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
function safePublicUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "metadata.google.internal") return null;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:)/i.test(host)) return null;
    const match = host.match(/^172\.(\d+)\./);
    if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return null;
    return url.toString();
  } catch { return null; }
}
async function navigateSession(connectUrl: string, url: string): Promise<boolean> {
  return await new Promise((resolve) => {
    let finished = false;
    let timer: number | undefined;
    let socket: WebSocket;
    const finish = (ok: boolean) => {
      if (finished) return;
      finished = true;
      if (timer !== undefined) clearTimeout(timer);
      try { socket?.close(); } catch {}
      resolve(ok);
    };
    try {
      socket = new WebSocket(connectUrl);
      timer = setTimeout(() => finish(false), 7000);
      socket.onopen = () => {
        try { socket.send(JSON.stringify({ id: 1, method: "Target.createTarget", params: { url } })); }
        catch { finish(false); }
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data));
          if (msg.id === 1) finish(!msg.error && !!msg.result?.targetId);
        } catch { finish(false); }
      };
      socket.onerror = () => finish(false);
    } catch { finish(false); }
  });
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
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}
  const targetUrl = safePublicUrl(body.url);
  if (!targetUrl) return json({ error: "Enter a valid public http or https website address. Local and private network addresses are blocked." }, 400);
  const apiKey = Deno.env.get("BROWSERBASE_API_KEY");
  const projectId = Deno.env.get("BROWSERBASE_PROJECT_ID");
  if (!apiKey || !projectId) return json({
    configured: false, provider: "Browserbase", region: "us-west-2",
    requiredSecrets: ["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID"],
    message: "The secure US browser gateway is not connected yet. Add the Browserbase API key and project ID as Supabase Edge Function secrets. No browser session was started.",
  }, 503);
  try {
    const createResponse = await fetch("https://api.browserbase.com/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-BB-API-Key": apiKey },
      body: JSON.stringify({
        projectId,
        region: "us-west-2",
        timeout: 1800,
        proxies: [{ type: "browserbase", geolocation: { country: "US" } }],
        browserSettings: { recordSession: false, logSession: false, viewport: { width: 1280, height: 800 } },
        userMetadata: { hellCampUserId: user.id, product: "hell-camp-virtual-phone" },
      }),
    });
    const session = await createResponse.json().catch(() => ({}));
    if (!createResponse.ok || !session.id || !session.connectUrl) return json({ error: "The US browser provider could not start a session.", providerStatus: createResponse.status }, 502);
    const navigated = await navigateSession(session.connectUrl, targetUrl);
    if (!navigated) return json({ error: "The US browser started, but could not open the requested page. Check provider session CDP access and retry." }, 502);
    const debugResponse = await fetch(`https://api.browserbase.com/v1/sessions/${encodeURIComponent(session.id)}/debug`, { headers: { "X-BB-API-Key": apiKey } });
    const debug = await debugResponse.json().catch(() => ({}));
    const liveViewUrl = debug.debuggerFullscreenUrl || debug.debuggerUrl;
    if (!debugResponse.ok || !liveViewUrl) return json({ configured: true, sessionId: session.id, region: session.region || "us-west-2", expiresAt: session.expiresAt || null, message: "The US browser session started, but the provider did not return a live-view link. Check Browserbase project permissions." }, 502);
    return json({ configured: true, sessionId: session.id, region: session.region || "us-west-2", expiresAt: session.expiresAt || null, liveViewUrl, openedUrl: targetUrl, message: "A US-geolocated proxy session was created and the requested page was opened. Verify the public egress IP before relying on US location." });
  } catch {
    return json({ error: "Could not reach the US browser provider. Try again later." }, 502);
  }
});