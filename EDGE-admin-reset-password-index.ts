import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) throw new Error("Unauthorized");

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authErr } = await caller.auth.getUser();
    if (authErr || !authData.user) throw new Error("Unauthorized");

    const admin = createClient(url, service);
    const { data: profile, error: profileErr } = await admin
      .from("profiles").select("account_type").eq("id", authData.user.id).maybeSingle();
    if (profileErr || profile?.account_type !== "admin") throw new Error("Not allowed");

    const body = await req.json();
    const requestId = Number(body.request_id);
    const password = String(body.new_password || "");
    if (!Number.isInteger(requestId) || requestId <= 0) throw new Error("Invalid request");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");

    const { data: reset, error: resetErr } = await admin
      .from("password_reset_requests")
      .select("id,user_id,status")
      .eq("id", requestId).maybeSingle();
    if (resetErr || !reset) throw new Error("Request not found");
    if (!reset.user_id) throw new Error("No matching account for this request");
    if (!["pending", "verified"].includes(reset.status)) throw new Error("Request already closed");

    const { error: updateErr } = await admin.auth.admin.updateUserById(reset.user_id, { password });
    if (updateErr) throw updateErr;

    const { error: markErr } = await admin.from("password_reset_requests")
      .update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", requestId);
    if (markErr) throw markErr;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "content-type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      headers: { ...cors, "content-type": "application/json" }, status: 400,
    });
  }
});
