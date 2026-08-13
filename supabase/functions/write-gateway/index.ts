import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type ActionConfig = {
  rpc: string;
  actorLimit: number;
  ipLimit: number;
  windowSeconds: number;
  keys: readonly string[];
};

const ACTIONS: Record<string, ActionConfig> = {
  update_board_post: { rpc: "update_board_post", actorLimit: 12, ipLimit: 40, windowSeconds: 600, keys: ["p_post_id","p_title","p_content","p_category","p_comments_enabled","p_password"] },
  delete_board_post: { rpc: "delete_board_post", actorLimit: 12, ipLimit: 40, windowSeconds: 600, keys: ["p_post_id","p_password"] },
  update_discussion_comment: { rpc: "update_discussion_comment", actorLimit: 30, ipLimit: 80, windowSeconds: 600, keys: ["p_comment_id","p_content","p_password"] },
  delete_discussion_comment: { rpc: "delete_discussion_comment", actorLimit: 30, ipLimit: 80, windowSeconds: 600, keys: ["p_comment_id","p_password"] },
  update_member_comment: { rpc: "update_member_comment", actorLimit: 30, ipLimit: 80, windowSeconds: 600, keys: ["p_comment_id","p_content"] },
  update_anonymous_comment: { rpc: "update_anonymous_comment", actorLimit: 30, ipLimit: 80, windowSeconds: 600, keys: ["p_comment_id","p_content","p_password"] },
  delete_member_comment: { rpc: "delete_member_comment", actorLimit: 30, ipLimit: 80, windowSeconds: 600, keys: ["p_comment_id"] },
  delete_anonymous_comment: { rpc: "delete_anonymous_comment", actorLimit: 30, ipLimit: 80, windowSeconds: 600, keys: ["p_comment_id","p_password"] },
  upsert_user_verse_mark: { rpc: "upsert_user_verse_mark", actorLimit: 60, ipLimit: 120, windowSeconds: 600, keys: ["p_verse_id","p_bookmark","p_highlight","p_memo"] },
  create_board_post: {
    rpc: "create_board_post",
    actorLimit: 3,
    ipLimit: 10,
    windowSeconds: 600,
    keys: ["p_board_type", "p_category", "p_title", "p_content", "p_anonymous_name", "p_password", "p_anonymous_id", "p_comments_enabled"],
  },
  create_discussion_comment: {
    rpc: "create_discussion_comment",
    actorLimit: 10,
    ipLimit: 30,
    windowSeconds: 600,
    keys: ["p_target_key", "p_content", "p_parent_id", "p_anonymous_name", "p_password", "p_anonymous_id"],
  },
  create_anonymous_comment: {
    rpc: "create_anonymous_comment",
    actorLimit: 10,
    ipLimit: 30,
    windowSeconds: 600,
    keys: ["p_verse_id", "p_content", "p_user_name", "p_password", "p_anonymous_id"],
  },
  create_member_comment: {
    rpc: "create_member_comment",
    actorLimit: 10,
    ipLimit: 30,
    windowSeconds: 600,
    keys: ["p_verse_id", "p_content"],
  },
  toggle_discussion_reaction: {
    rpc: "toggle_discussion_reaction",
    actorLimit: 60,
    ipLimit: 120,
    windowSeconds: 300,
    keys: ["p_target_key", "p_reaction_type", "p_anonymous_id"],
  },
  report_discussion_target: {
    rpc: "report_discussion_target",
    actorLimit: 10,
    ipLimit: 30,
    windowSeconds: 86400,
    keys: ["p_target_key", "p_reason", "p_anonymous_id"],
  },
  report_discussion_comment: {
    rpc: "report_discussion_comment",
    actorLimit: 10,
    ipLimit: 30,
    windowSeconds: 86400,
    keys: ["p_comment_id", "p_reason", "p_anonymous_id"],
  },
  record_discussion_view: {
    rpc: "record_discussion_view",
    actorLimit: 120,
    ipLimit: 300,
    windowSeconds: 300,
    keys: ["p_target_key", "p_anonymous_id"],
  },
};

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
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientAddress(req: Request): string {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

function selectPayload(input: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  return Object.fromEntries(keys.filter((key) => key in source).map((key) => [key, source[key]]));
}

function jwtClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

async function verifyTurnstile(token: unknown, remoteIp: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  const required = Deno.env.get("REQUIRE_TURNSTILE") === "true";
  if (!secret) return !required;
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) return false;
  const form = new URLSearchParams({ secret, response: token, remoteip: remoteIp });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const result = await response.json();
  return Boolean(result?.success);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (Deno.env.get("SURGE_READ_ONLY") === "true") {
    return json(503, { error: "surge_read_only", retry_after: 300 });
  }
  try {
    const requestBody = await req.text();
    if (new TextEncoder().encode(requestBody).byteLength > 24_576) {
      return json(413, { error: "request_too_large" });
    }
    const body = JSON.parse(requestBody);
    const action = String(body?.action || "");
    const config = ACTIONS[action];
    const idempotencyKey = String(body?.idempotency_key || "");
    if (!config || !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
      return json(400, { error: "invalid_request" });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) throw new Error("missing_server_configuration");

    const authorization = req.headers.get("authorization") || "";
    const bearerToken = authorization.toLowerCase().startsWith("bearer ")
      ? authorization.slice(7).trim()
      : "";
    const claims = jwtClaims(bearerToken);
    const userAuthorization = claims?.role === "authenticated" && typeof claims?.sub === "string"
      ? `Bearer ${bearerToken}`
      : "";
    const caller = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: userAuthorization ? { Authorization: userAuthorization } : {} },
    });
    let userId: string | null = null;
    if (userAuthorization) {
      const { data, error } = await caller.auth.getUser();
      if (error || !data.user) return json(401, { error: "invalid_session" });
      userId = data.user.id;
    }

    const degradation = String(Deno.env.get("DEGRADATION_LEVEL") || "normal");
    const nonCritical = new Set(["record_discussion_view", "toggle_discussion_reaction"]);
    const createActions = new Set(["create_board_post", "create_discussion_comment", "create_anonymous_comment", "create_member_comment"]);
    if (degradation === "emergency") return json(503, { error: "emergency_read_only", retry_after: 60 });
    if (degradation === "severe" && createActions.has(action)) return json(503, { error: "severe_backpressure", retry_after: 30 });
    if ((degradation === "guarded" || degradation === "severe") && nonCritical.has(action)) return json(202, { data: { deferred: true } });
    const payload = selectPayload(body?.payload, config.keys);
    const anonymousId = String(payload.p_anonymous_id || "");
    if (!userId && !/^[A-Za-z0-9_-]{16,128}$/.test(anonymousId)) {
      return json(400, { error: "invalid_actor" });
    }

    const remoteIp = clientAddress(req);
    if (!userId && !await verifyTurnstile(body?.turnstile_token, remoteIp)) {
      return json(403, { error: "challenge_required" });
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const actor = userId ? `user:${userId}` : `anonymous:${anonymousId}`;
    const [actorHash, ipHash] = await Promise.all([
      sha256(`write:${action}:${actor}`),
      sha256(`write:${action}:ip:${remoteIp}`),
    ]);
    const [actorLimit, ipLimit] = await Promise.all([
      admin.rpc("consume_request_rate_limit", {
        p_subject_hash: actorHash,
        p_limit: config.actorLimit,
        p_window_seconds: config.windowSeconds,
      }),
      admin.rpc("consume_request_rate_limit", {
        p_subject_hash: ipHash,
        p_limit: config.ipLimit,
        p_window_seconds: config.windowSeconds,
      }),
    ]);
    if (actorLimit.error || ipLimit.error) throw new Error("rate_limit_unavailable");
    if (!actorLimit.data || !ipLimit.data) {
      return json(429, { error: "too_many_requests", retry_after: config.windowSeconds });
    }

    const [idempotencyHash, bodyHash] = await Promise.all([sha256(`${action}:${actor}:${idempotencyKey}`), sha256(JSON.stringify(payload))]);
    const claim = await admin.rpc("cb_claim_idempotency", { p_idempotency_hash: idempotencyHash, p_actor_hash: actorHash, p_action: action, p_body_hash: bodyHash });
    if (claim.error) { if (claim.error.code === "23505") return json(409, { error: "idempotency_payload_mismatch" }); throw new Error("idempotency_unavailable"); }
    const claimRow = Array.isArray(claim.data) ? claim.data[0] : claim.data;
    if (!claimRow?.claimed) { if (claimRow?.cached_response) return json(200, claimRow.cached_response as Record<string, unknown>); return json(409, { error: "request_in_progress" }); }

    const result = await caller.rpc(config.rpc, payload);
    if (result.error) {
      await admin.from("cb_request_idempotency").delete().eq("idempotency_hash", idempotencyHash);
      return json(400, { error: "write_failed", code: result.error.code || null });
    }

    const responseBody = { data: result.data };
    await admin.from("cb_request_idempotency").update({
      response: responseBody,
      completed_at: new Date().toISOString(),
    }).eq("idempotency_hash", idempotencyHash);
    return json(200, responseBody);
  } catch (error) {
    console.error("write-gateway failed", error instanceof Error ? error.message : "unknown_error");
    return json(500, { error: "server_error" });
  }
});
