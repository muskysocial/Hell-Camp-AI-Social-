# HELL CAMP AI Foundation

Status: isolated AI foundation schema and a new `hellcamp-ai` Edge Function deployed to the connected Supabase project on 2026-10-26. A narrowly scoped AI-chat UI integration is staged on the feature branch; it has not been merged to `main` or released through GitHub Pages. Existing production AI functions have not been replaced.

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

## Release state

The foundation PR was merged to `main` on 2026-10-26. The `hellcamp-ai` Edge Function is active at version 3 with JWT verification enabled. Repository source checks pass; the exact GitHub Pages deployment and authenticated end-to-end flow cannot be confirmed from the server-side tools alone.
