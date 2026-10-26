# HELL CAMP AI Engine — Stages 4–6

Updated: 2026-10-26

## Stage 4 — Context, memory, recovery, diagnostics

- AI Lab tool requests use the authenticated `hellcamp-ai` gateway.
- Tool runs are recorded per signed-in user in `hellcamp_ai_tool_runs`; the UI exposes a private recent-run list.
- Explicitly saved memories are listed, created and deleted through the authenticated gateway. The engine injects a bounded set of active memories into relevant AI prompts; memory is personalization context, not an instruction override.
- AI Lab has a read-only diagnostics view. Full platform checks and model benchmarking are restricted to `kaptainarizonah@gmail.com`.
- The model benchmark sends a short, fixed test prompt, records latency/status in `hellcamp_ai_health_checks`, and is not billed as a member AI run. The configured provider may still charge for its own API usage.
- Failed generation attempts are recorded as failed and do not call the successful exchange/billing RPC.

## Stage 5 — Actual content inputs and processing

- Image Understanding Studio accepts PNG, JPEG and WebP, resizes the image in the browser, and sends the compressed image to the configured OpenAI-compatible vision endpoint. The model must support image input. If it does not, the run fails and should not charge member coins.
- Document & Research Helper can read TXT, Markdown, CSV, JSON and HTML text files in the browser and submit extracted text for summary, explanation and study-guide tasks. The uploaded source file is not uploaded to a separate storage bucket by this workflow; the extracted text is sent only when the member presses Run.
- Video & Reel Planner creates scripts, shot lists, captions and storyboards. It does **not** render a finished video. A real video renderer needs a separately selected provider, endpoint/API contract, credentials, storage for output assets, and job-status handling. No provider credentials or model are assumed or fabricated.
- HELL EDITS is not replaced by this AI Lab change.

## Stage 6 — Configurable inference and open-weight evaluation

The Edge Function supports an OpenAI-compatible inference endpoint. It remains on the existing Groq-compatible endpoint by default, so this change does not falsely claim that a separate model server is already running.

Set these values as **Supabase Edge Function secrets** (never in the browser, HTML, JavaScript, GitHub Pages, or public repository):

- `HELLCAMP_AI_BASE_URL`: base URL including the API path, e.g. `https://your-private-inference-host.example/v1`
- `HELLCAMP_AI_API_KEY`: provider key or the access token for the private endpoint
- `HELLCAMP_AI_MODEL`: model identifier exposed by that endpoint
- `HELLCAMP_VISION_MODEL`: optional vision-capable model identifier; defaults to `HELLCAMP_AI_MODEL`

The previous `GROQ_API_KEY` and `GROQ_MODEL` values remain supported as fallbacks. The private inference host must be reachable from Supabase Edge Functions over HTTPS and expose compatible `/models` and `/chat/completions` routes. Do not expose a private model server directly to browsers.

### Suggested evaluation protocol

1. Run Engine Diagnostics and the owner-only model benchmark.
2. Test representative writing, long document summarization, multi-turn memory use, and image understanding (only with a vision model).
3. Record response latency, HTTP errors, output quality, context length, GPU/RAM use, uptime, and cost per successful result.
4. Compare at least three candidate open-weight models on the same sanitized test prompts before switching production traffic.
5. Keep member data out of public benchmark datasets; do not use private chats for training without clear consent and a documented retention policy.
6. Switch only after auth, billing, privacy, and failure-path checks pass. Keep the current provider configuration until the replacement has been verified.

## Privacy and security

- Member prompts and attached image data are sent from the authenticated Edge Function to whichever AI endpoint is configured. With the default configuration, that endpoint is the existing external provider; a private endpoint is only private to the extent that its host, logs, access controls and retention are configured securely.
- Hell Camp must not sell member private data. Do not put secrets or credentials in prompts, memories, logs or drafts.
- Never treat user-uploaded content or saved memories as trusted system instructions.
- Cyber Lab remains limited to authorized, defensive security learning and fictional/simulated exercises.

## Current implementation boundary

The gateway and UI are prepared for a compatible inference endpoint and vision model, but an independent model is not running merely because these settings exist. Actual video rendering and a production open-weight model deployment still require a chosen provider/host and its credentials or compute infrastructure.
