import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "npm:jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function googleAccessToken() {
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw = Deno.env.get("FIREBASE_PRIVATE_KEY");
  if (!clientEmail || !privateKeyRaw) throw new Error("Firebase credentials are not configured");

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const key = await importPKCS8(privateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google OAuth failed: ${JSON.stringify(j)}`);
  return j.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID");
    if (!supabaseUrl || !serviceRoleKey || !firebaseProjectId) throw new Error("Server environment is incomplete");

    const body = await req.json().catch(() => ({}));
    const notificationId = Number(body?.notification_id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return reply({ error: "notification_id is required" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Load an existing legitimate notification. The caller cannot supply title/user/message.
    const { data: n, error: nErr } = await admin
      .from("notifications")
      .select("id,user_id,title,message,order_id,kind,push_sent_at,push_attempted_at")
      .eq("id", notificationId)
      .maybeSingle();

    if (nErr) throw nErr;
    if (!n) return reply({ error: "Notification not found" }, 404);
    if (n.push_sent_at) return reply({ success: true, skipped: "already_sent" });

    // Claim this notification to make repeated public calls harmless.
    const { data: claimed, error: claimErr } = await admin
      .from("notifications")
      .update({ push_attempted_at: new Date().toISOString(), push_error: null })
      .eq("id", n.id)
      .is("push_sent_at", null)
      .select("id")
      .maybeSingle();
    if (claimErr) throw claimErr;
    if (!claimed) return reply({ success: true, skipped: "already_claimed" });

    const { data: tokens, error: tErr } = await admin
      .from("push_tokens")
      .select("id,token")
      .eq("user_id", n.user_id);
    if (tErr) throw tErr;

    if (!tokens?.length) {
      await admin.from("notifications").update({
        push_sent_at: new Date().toISOString(),
        push_error: "no_registered_devices",
      }).eq("id", n.id);
      return reply({ success: true, sent: 0, reason: "no_registered_devices" });
    }

    const accessToken = await googleAccessToken();
    let sent = 0;
    const errors: string[] = [];
    const invalidTokenIds: number[] = [];
    const link = n.order_id
      ? `https://hakarblaa.github.io/HA-Marketing/account.html#order-${n.order_id}`
      : "https://hakarblaa.github.io/HA-Marketing/notifications-center.html";

    for (const row of tokens) {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: row.token,
            notification: { title: n.title, body: n.message },
            data: {
              title: n.title,
              message: n.message,
              link,
              notification_id: String(n.id),
              kind: n.kind || "general",
              order_id: n.order_id ? String(n.order_id) : "",
            },
            webpush: {
              fcm_options: { link },
              notification: {
                title: n.title,
                body: n.message,
                icon: "https://hakarblaa.github.io/HA-Marketing/main.jpg",
                badge: "https://hakarblaa.github.io/HA-Marketing/main.jpg",
                tag: `ha-notification-${n.id}`,
              },
            },
          },
        }),
      });

      if (r.ok) {
        sent++;
      } else {
        const text = await r.text();
        errors.push(text);
        if (text.includes("UNREGISTERED") || text.includes("registration-token-not-registered")) {
          invalidTokenIds.push(row.id);
        }
      }
    }

    if (invalidTokenIds.length) {
      await admin.from("push_tokens").delete().in("id", invalidTokenIds);
    }

    await admin.from("notifications").update({
      push_sent_at: new Date().toISOString(),
      push_error: errors.length ? errors.slice(0, 3).join(" | ").slice(0, 3000) : null,
    }).eq("id", n.id);

    return reply({ success: true, sent, failed: errors.length, removed_invalid_tokens: invalidTokenIds.length });
  } catch (error) {
    console.error(error);
    return reply({ error: error instanceof Error ? error.message : "Unknown server error" }, 500);
  }
});
