# HELL CAMP AI Engine — Stage 3

Updated: 2026-10-26

## What changed in Stage 3

- Deployed `hellcamp-ai` Edge Function version 10 with an authenticated `ai_tool_run` action.
- Routed the text-based AI Lab tools through this central Hell Camp gateway instead of having each tool call a model provider directly from browser code.
- Added a server-side allowlist and server-authored task instructions for Writer, Growth, Bio, Campaign, Listing, Learning, Design Prompt, Video Planner, Smart Reply, Workflow Blueprint, and Document Helper.
- Each successful text tool run is written to the existing account-owned AI conversation history and to `hellcamp_ai_tool_runs`; failed provider calls are recorded as failed and do not intentionally charge coins.
- Text tool runs use the current 50-coin successful-response path. Verify the live coin balance and transaction records with a signed-in browser test before considering billing fully validated.
- The existing Cyber Lab route remains separate and keeps its ethical, defensive, simulated-lab safety boundary. HELL EDITS is not replaced by this change.

## Important limitation

This is now a more unified **Hell Camp AI engine gateway**, but it is not yet a fully self-hosted foundation model. Text reasoning still uses the configured Groq model on the server side. The browser does not receive the Groq secret. The server sends the brief needed for generation to Groq, so members should not submit passwords, login codes, API keys, or sensitive credentials.

The current “Image & Design Prompt Lab” and “Video & Reel Planner” produce prompts and production plans; they do not render images or videos. Real media generation requires a connected media model/runtime. HELL EDITS remains its own visual editor and must be regression-tested separately.

## Next stages

### Stage 4 — Stabilize and measure
1. Run authenticated end-to-end tests for each text tool: success, provider timeout, provider 429/5xx, empty response, insufficient coins, and database save failure.
2. Verify that one member cannot read another member's conversations, tool runs, drafts, or memories.
3. Add a useful owner diagnostics view for tool success/failure counts without exposing prompt content or secrets.
4. Add safe tool feedback and a small regression suite for prompt quality, factuality, privacy, and refusal behavior.
5. Confirm the GitHub Pages build and check the existing social feed, messaging, coin billing, AI Lab, Cyber Lab and HELL EDITS after deployment.

### Stage 5 — Real tools, not just text plans
1. Connect approved document parsing, image generation, and video generation through server-side adapters.
2. Keep user approval before publishing, messaging, modifying production data, or spending on external services.
3. Give every tool explicit inputs, outputs, timeouts, quotas, permission scopes, audit entries and rollback behavior.
4. Use mock/sample data for tests; never perform unauthorized scans or access third-party accounts/systems.

### Stage 6 — Independent model evaluation
1. Benchmark a suitable open-weight model on a separate inference host.
2. Compare output quality, latency, hardware needs, operating cost, privacy, and availability against the current hosted model.
3. Run it in shadow/staging mode before any user-facing switch.
4. Only migrate production traffic after regression, security, and billing tests pass.

## Release rule

Do not describe the platform as fully independent or claim that every media tool runs without an external provider until the relevant model and tool adapters are actually deployed and tested. Keep provider keys in Supabase secrets; never place them in `index.html` or browser JavaScript.
