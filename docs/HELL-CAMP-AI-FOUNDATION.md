# HELL CAMP AI Foundation

Status: initial isolated foundation deployed to the connected Supabase project on 2026-10-26. The website UI and existing production AI functions have not been replaced.

## Existing project facts verified
- Static GitHub Pages front end with a large `index.html`, a standalone HELL EDITS visual editor/runtime, and an existing Pages workflow.
- Supabase project `lwgbfnyjuxixduuehckp` is reported as active/healthy by project metadata.
- Existing functions include `groq-chat`, `profile-about-ai`, and several image/editing functions.
- Existing product tables already cover profiles, posts, messaging, HELL EDITS activity/assets/templates, profile About Me history, and user memories. Do not recreate these product areas under new names unless a distinct AI-engine need is proven.
- Current Groq model ID `openai/gpt-oss-20b` appears in the provider's current supported-model documentation. The reported 404 must be traced from the actual request path/logs; do not blindly change the model ID.

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
2. Add an isolated `hellcamp-ai` Edge Function with JWT verification, server-only model keys, bounded request sizes, owner-scoped history and memory retrieval, and explicit tool allowlists.
3. Trace and fix the reported Groq 404 with exact request logs before touching `groq-chat` or `profile-about-ai`.
4. Integrate one UI path at a time, starting with the existing AI chat and HELL EDITS/document assistance, while preserving the bottom navigation and editor.
5. Add diagnostics with read-only checks first; require approval and rollback for production writes.
6. Add feedback-based evaluation. Do not train on private conversations by default.
7. Evaluate an open-weight model on a separate host before considering any production model switch.

## Release gates
- Existing sign-in, profiles, feed, messaging, coin/billing functions, HELL EDITS, and admin-only surfaces pass regression checks.
- Cross-user isolation tests prove one user cannot read another user's conversations or memories.
- API secrets are never shipped in `index.html` or other public assets.
- New model/provider calls are rate-limited, bounded, logged without secret content, and return useful error codes.
- Deploy only after tests pass; keep rollback instructions for each release.
