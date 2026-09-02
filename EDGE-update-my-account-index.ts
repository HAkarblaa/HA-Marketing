import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json; charset=utf-8" },
  });
}

function normalizePhone(v: unknown) {
  let p = String(v ?? "").replace(/\D/g, "");
  if (p.startsWith("0")) p = "964" + p.slice(1);
  if (!p.startsWith("964")) p = "964" + p;
  return p;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "يجب تسجيل الدخول من جديد" }, 401);

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authErr } = await caller.auth.getUser();
    if (authErr || !authData.user) return json({ ok: false, error: "جلسة الحساب غير صالحة. سجل الدخول من جديد." }, 401);

    const admin = createClient(url, service);
    const uid = authData.user.id;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");

    if (action === "password") {
      const password = String(body?.password || "");
      if (!/^[!-~]{8,72}$/.test(password)) {
        return json({ ok: false, error: "الرقم السري يجب أن يكون 8 إلى 72 خانة إنكليزية/أرقام/رموز وبدون مسافات." }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(uid, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "profile") {
      const username = String(body?.username || "").trim();
      const phone = normalizePhone(body?.phone);
      if (!/^[!-~]{6,40}$/.test(username)) return json({ ok: false, error: "المعرّف غير صالح" }, 400);
      if (!/^9647\d{9}$/.test(phone)) return json({ ok: false, error: "رقم الموبايل غير صالح" }, 400);

      const { data: duplicateUser } = await admin.from("profiles").select("id").eq("username", username).neq("id", uid).limit(1);
      if (duplicateUser?.length) return json({ ok: false, error: "اسم المستخدم مستخدم مسبقاً" }, 409);
      const { data: duplicatePhone } = await admin.from("profiles").select("id").eq("phone", phone).neq("id", uid).limit(1);
      if (duplicatePhone?.length) return json({ ok: false, error: "رقم الموبايل مستخدم مسبقاً" }, 409);

      const { data: profile } = await admin.from("profiles").select("id,phone").eq("id", uid).maybeSingle();
      const oldPhone = normalizePhone(profile?.phone || authData.user.user_metadata?.phone || phone);

      const profilePayload = { username, phone };
      if (profile) {
        const { error } = await admin.from("profiles").update(profilePayload).eq("id", uid);
        if (error) throw error;
      } else {
        const { error } = await admin.from("profiles").insert({ id: uid, username, phone, account_type: "customer" });
        if (error) throw error;
      }

      const metadata = { ...(authData.user.user_metadata || {}), username, phone };
      const authChanges: Record<string, unknown> = { user_metadata: metadata };
      if (oldPhone !== phone) authChanges.email = `u${phone}@ha.local`;
      const { error: authUpdateErr } = await admin.auth.admin.updateUserById(uid, authChanges);
      if (authUpdateErr) throw authUpdateErr;

      return json({ ok: true, username, phone, session_refresh_required: oldPhone !== phone });
    }

    return json({ ok: false, error: "عملية غير معروفة" }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 400);
  }
});
