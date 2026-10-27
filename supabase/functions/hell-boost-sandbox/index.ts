// Hell Boost sandbox only. It never creates a paid order, calls a provider, or deducts coins.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond(405, { ok: false, error: "Use POST." });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return respond(401, { ok: false, error: "Sign in to Hell Camp to run the sandbox test." });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return respond(400, { ok: false, error: "Request body must be valid JSON." });
  }

  const serviceId = typeof body.service_id === "string" ? body.service_id : "";
  const targetUrl = typeof body.target_url === "string" ? body.target_url.trim() : "";
  const quantity = Number(body.quantity);

  if (!serviceId || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) {
    return respond(400, { ok: false, error: "Provide a service ID and a whole-number quantity from 1 to 1,000,000." });
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return respond(400, { ok: false, error: "Provide a valid public HTTP(S) URL." });
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol) || targetUrl.length > 2048) {
    return respond(400, { ok: false, error: "Only public HTTP(S) target URLs are accepted." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return respond(500, { ok: false, error: "Sandbox is not configured on the server." });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return respond(401, { ok: false, error: "Your session could not be verified. Sign in again." });
  }

  const { data: service, error: serviceError } = await supabase
    .from("growth_services")
    .select("id,title,platform,active,min_quantity,max_quantity")
    .eq("id", serviceId)
    .maybeSingle();

  if (serviceError) {
    return respond(503, { ok: false, error: "Could not verify the service catalogue." });
  }
  if (!service || !service.active) {
    return respond(404, { ok: false, error: "This service is not active." });
  }
  if (quantity < service.min_quantity || quantity > service.max_quantity) {
    return respond(400, {
      ok: false,
      error: "Quantity is outside this service's limits.",
      min_quantity: service.min_quantity,
      max_quantity: service.max_quantity,
    });
  }

  return respond(200, {
    ok: true,
    mode: "sandbox",
    test_id: crypto.randomUUID(),
    service: { id: service.id, title: service.title, platform: service.platform },
    quantity,
    target_url: targetUrl,
    status: "sandbox_simulated",
    provider_called: false,
    order_created: false,
    coins_charged: 0,
    message: "Sandbox validation passed. This is a simulation only: no live followers or engagement were delivered, no paid order was created, and no coins were deducted.",
  });
});
