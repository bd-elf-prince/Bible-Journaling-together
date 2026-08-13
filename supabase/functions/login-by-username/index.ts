import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientAddress(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const requestBody = await req.text();
    if (new TextEncoder().encode(requestBody).byteLength > 4096) {
      return json(413, { error: "request_too_large" });
    }
    const payload = JSON.parse(requestBody);
    const username = String(payload?.username || "").trim().toLowerCase();
    const password = String(payload?.password || "");

    if (!/^[a-z0-9_]{3,24}$/.test(username) || password.length < 8 || password.length > 72) {
      return json(401, { error: "invalid_credentials" });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) throw new Error("missing_server_configuration");

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const ipHash = await sha256(`ip:${clientAddress(req)}`);
    const usernameHash = await sha256(`username:${username}`);
    const [ipLimit, usernameLimit] = await Promise.all([
      admin.rpc("consume_request_rate_limit", {
        p_subject_hash: ipHash,
        p_limit: 30,
        p_window_seconds: 300,
      }),
      admin.rpc("consume_request_rate_limit", {
        p_subject_hash: usernameHash,
        p_limit: 10,
        p_window_seconds: 300,
      }),
    ]);

    if (ipLimit.error || usernameLimit.error) throw new Error("rate_limit_unavailable");
    if (!ipLimit.data || !usernameLimit.data) {
      return json(429, { error: "too_many_attempts", retry_after: 300 });
    }

    const { data: userId, error: identityError } = await admin.rpc("resolve_member_user_id", {
      p_username: username,
    });
    if (identityError) throw new Error("identity_lookup_failed");
    if (!userId) return json(401, { error: "invalid_credentials" });

    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(userId);
    const email = userResult?.user?.email;
    if (userError || !email) return json(401, { error: "invalid_credentials" });

    const auth = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await auth.auth.signInWithPassword({ email, password });
    if (error || !data.session) return json(401, { error: "invalid_credentials" });

    return json(200, {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      },
    });
  } catch (error) {
    console.error("login-by-username failed", error instanceof Error ? error.message : "unknown_error");
    return json(500, { error: "server_error" });
  }
});
