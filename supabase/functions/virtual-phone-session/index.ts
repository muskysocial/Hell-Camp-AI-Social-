import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://muskysocial.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const origin = req.headers.get("origin");
  if (origin && origin !== "https://muskysocial.github.io") return json({ error: "This origin is not allowed." }, 403);
  const authorization = req.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Sign in to Hell Camp before starting a virtual browser." }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !anonKey) return json({ error: "Supabase function environment is not configured." }, 503);
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authorization } });
  if (!authResponse.ok) return json({ error: "Your Hell Camp session is invalid or expired. Sign in again." }, 401);
  const user = await authResponse.json();
  if (!user?.id) return json({ error: "Could not verify your Hell Camp account." }, 401);
  const apiKey = Deno.env.get("BROWSERBASE_API_KEY");
  const projectId = Deno.env.get("BROWSERBASE_PROJECT_ID");
  if (!apiKey || !projectId) return json({
    configured: false, provider: "Browserbase", region: "us-west-2",
    requiredSecrets: ["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID"],
    message: "The secure US browser gateway is not connected yet. Add the Browserbase API key and project ID as Supabase Edge Function secrets. No browser session was started.",
  }, 503);
  try {
    const createResponse = await fetch("https://api.browserbase.com/v1/sessions", {
      method: "POST", headers: { "Content-Type": "application/json", "X-BB-API-Key": apiKey },
      body: JSON.stringify({ projectId, region: "us-west-2", timeout: 1800, userMetadata: { hellCampUserId: user.id, product: "hell-camp-virtual-phone" } }),
    });
    const session = await createResponse.json().catch(() => ({}));
    if (!createResponse.ok || !session.id) return json({ error: "The US browser provider could not start a session.", providerStatus: createResponse.status }, 502);
    const debugResponse = await fetch(`https://api.browserbase.com/v1/sessions/${encodeURIComponent(session.id)}/debug`, { headers: { "X-BB-API-Key": apiKey } });
    const debug = await debugResponse.json().catch(() => ({}));
    const liveViewUrl = debug.debuggerFullscreenUrl || debug.debuggerUrl;
    if (!debugResponse.ok || !liveViewUrl) return json({ configured: true, sessionId: session.id, region: session.region || "us-west-2", expiresAt: session.expiresAt || null, message: "The US browser session started, but the provider did not return a live-view link. Check Browserbase project permissions." }, 502);
    return json({ configured: true, sessionId: session.id, region: session.region || "us-west-2", expiresAt: session.expiresAt || null, liveViewUrl, message: "A US-region remote browser session was created. Verify its public egress IP before relying on it for location-sensitive browsing." });
  } catch {
    return json({ error: "Could not reach the US browser provider. Try again later." }, 502);
  }
});