# HELL CAMP AI Foundation

Status: AI foundation and site-wide member AI companion are implemented on the feature branch; `hellcamp-ai` Edge Function version 5 is deployed.

## Existing project facts verified
- Static GitHub Pages front end with a large `index.html`, a standalone HELL EDITS visual editor/runtime, and an existing Pages workflow.
- Supabase project `lwgbfnyjuxixduuehckp` is reported as active/healthy by project metadata.
- Existing functions include `groq-chat`, `profile-about-ai`, and several image/editing functions.
- Existing product tables already cover profiles, posts, messaging, HELL EDITS activity/assets/templates, profile About Me history, and user memories. Do not recreate these product areas under new names unless a distinct AI-engine need is proven.
- Current Groq model ID `openai/gpt-oss-20b` appears in the provider's current supported-model documentation. The reported 404 must be traced from the actual request path/logs; do not blindly change the model ID.

## New AI gateway
- Added and deployed `hellcamp-ai` as a separate Edge Function with JWT verification enabled.
- Supports authenticated chat, owner-scoped conversation history, and explicit user-managed memory list/save/delete actions.
- Uses server-side `GROQ_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`; neither is added to public HTML.
- Chat uses the same 1,400-coin AI Chat charge path as the existing chat function. Memory/history reads do not invoke the model.
- The gateway is currently a foundation, not a full autonomous agent: website tool execution, health repair actions, media generation, and full UI memory controls are not yet implemented.

## Isolated AI engine schema
The migration `supabase/migrations/202610260001_hellcamp_ai_foundation.sql` introduces:
- `hellcamp_ai_conversations`: conversation ownership and metadata.
- `hellcamp_ai_messages`: conversation history, scoped to the owner.
- `hellcamp_ai_memories`: user-managed long-term memories with owner-only policies.
- `hellcamp_ai_tool_runs`: auditable tool execution status.
- `hellcamp_ai_feedback`: user ratings and feedback.
- `hellcamp_ai_health_checks`: diagnostic results, with no direct anon/authenticated grants.

All tables enable RLS. Conversation/message/tool-run reads are owner-scoped; the service-side AI gateway will own writes to conversation history and tool runs. Memories support owner-only CRUD. Feedback inserts must reference a conversation owned by the caller. No existing tables, billing functions, or product Edge Functions are altered by this migration.

## Next implementation stages
1. Confirm this migration is represented in the repository and verify live table/RLS/advisor state.
2. Finish testing the isolated `hellcamp-ai` Edge Function with authenticated chat, history, memory ownership, coin charging, and request-size tests.
3. Trace and fix the reported Groq 404 with exact request logs before touching `groq-chat` or `profile-about-ai`.
4. Review and merge the staged AI-chat integration only after end-to-end tests; then integrate HELL EDITS/document assistance without changing their existing editor layout.
5. Add diagnostics with read-only checks first; require approval and rollback for production writes.
6. Add feedback-based evaluation. Do not train on private conversations by default.
7. Evaluate an open-weight model on a separate host before considering any production model switch.

## Release gates
- Existing sign-in, profiles, feed, messaging, coin/billing functions, HELL EDITS, and admin-only surfaces pass regression checks.
- Cross-user isolation tests prove one user cannot read another user's conversations or memories.
- API secrets are never shipped in `index.html` or other public assets.
- New model/provider calls are rate-limited, bounded, logged without secret content, and return useful error codes.
- Deploy only after tests pass; keep rollback instructions for each release.

## Stage 1 hardening added (2026-10-26)

- `hellcamp-ai` now enforces the request-body limit after reading the actual body, including requests without a `Content-Length` header.
- Added `record_hellcamp_ai_exchange`, a service-role-only database function that charges coins and writes the user/assistant message pair in one database transaction. A failed message write rolls back the charge.
- Added owner-only `health_check` action to verify database table reachability and record diagnostic results. It reports whether `GROQ_API_KEY` is configured, but deliberately does not spend provider tokens or claim the key has been validated.
- Added owner-scoped feedback storage and a branch-only AI chat toolbar for saved conversation history, explicit user-controlled memories (list/save/delete), and owner diagnostics.
- The updated `index.html` is merged to `main` and now calls `hellcamp-ai` for AI Chat; existing AI tool functions and HELL EDITS were not replaced. GitHub Pages propagation and signed-in browser behavior still need a real client check.

## Chat persistence hotfix (2026-10-26)

- Production logs showed Groq generation reached the exchange persistence step, but the database RPC rejected it with `service role required`, causing HTTP 500 and no visible assistant response.
- The guard relied on the legacy `request.jwt.claim.role` setting, which was not populated for the configured Supabase secret API key. The fix removes that unreliable in-function check while retaining explicit EXECUTE permissions for `service_role` only; `anon` and `authenticated` are denied.
- The production function definition and grants were verified after the hotfix. A fresh signed-in browser exchange is still needed to confirm the entire generation/charge/persistence path end to end.
- Deployed Edge Function version 4 extends owner-only diagnostics to core feed, messaging, HELL EDITS, site settings/activity, and AI tables. It now performs a low-cost Groq models endpoint check to verify the configured key and model without generating a completion.

## Release state

The foundation PR was merged to `main` on 2026-10-26. The `hellcamp-ai` Edge Function is active at version 3 with JWT verification enabled. Repository source checks pass; the exact GitHub Pages deployment and authenticated end-to-end flow cannot be confirmed from the server-side tools alone.


## Member AI companion — stage 2 (2026-10-26)

- Added a persistent, responsive **Ask HELL CAMP AI** launcher throughout the site so members can reach AI without first finding the AI Lab.
- Added quick-start workflows for social posts, profile bios, message replies, member growth plans, learning and seller/job post drafting.
- The companion uses the authenticated `hellcamp-ai` Edge Function, restores the member's latest conversation, lets members start a new conversation, and provides a history picker for prior conversations.
- Added a private AI Draft Library: members can save AI replies as drafts, copy them, review saved drafts and delete them. Saving a draft does not spend coins.
- Added member-controlled saved memory management: members can explicitly save preferences or project details, list active memories, and delete saved items. Memory remains account-scoped.
- Added mobile full-screen layout, keyboard accessibility, reduced-motion-aware launcher animation, and clear coin charging status. It uses the existing 1,400-coin successful-reply rule and does not expose provider keys in the browser.
- Upgraded the deployed AI system prompt with platform-aware guidance for profiles, posts, direct messages, groups/events, jobs/marketplace, gifts, HELL EDITS and AI Lab. It is explicit that it cannot publish or mutate site data without a connected action tool.
- Edge Function version 6 is deployed with JWT verification enabled. The new owner-scoped `hellcamp_ai_drafts` table has RLS enabled; draft list/save/delete actions enforce the authenticated user ID. A signed-in browser smoke test of the new companion, history, and memory controls remains to be performed after Pages publishes the branch.
