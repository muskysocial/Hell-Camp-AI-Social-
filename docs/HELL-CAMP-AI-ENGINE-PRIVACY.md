# HELL CAMP AI ENGINE — privacy-first build plan

Status: staged engineering plan. This document describes intended controls; it is not a claim that every future control is already implemented.

## Mission

Build HELL CAMP AI ENGINE as the shared intelligence layer for Hell Camp's chat, learning, creator tools, HELL EDITS and future agent workflows. The engine should be provider-independent so hosted models can be used now and a self-hosted/open-weight model can be evaluated later.

## Non-negotiable privacy rules

1. **No selling private member data.** Conversations, saved memories, uploads, profile details and tool inputs must never be sold, used for advertising profiles, or exposed to another member.
2. **Account isolation.** Every conversation, memory, run and draft must be scoped to the authenticated user. Server-side service credentials stay in Supabase Edge Function secrets and are never placed in GitHub Pages assets.
3. **Data minimization.** Send a model only the current request and the minimum relevant conversation context required to answer. Do not attach unrelated profile fields, private messages, or all stored files by default.
4. **Transparent provider processing.** Hosted AI providers receive the prompt/context needed to generate a reply. The interface must say so and advise members never to send passwords, login codes, API keys or private credentials. Self-hosting is a separate future milestone, not something GitHub Pages can do by itself.
5. **Private by default.** Do not train models on private conversations or memories by default. Feedback for improving the product must be separated from private chat content unless the member explicitly opts in.
6. **Safe diagnostics.** Log request IDs, action, timing, outcome and error codes—not raw message text, credentials, or uploaded private content.
7. **User control.** Members should be able to review and delete saved memories and conversations, and eventually export their AI data. Deletion behavior must be tested across primary tables, backups/retention and any provider-side retention supported by the provider.
8. **No silent external actions.** Tool calls that publish, message other people, change account settings, spend coins, or modify site data must require permission and report what actually happened.

## Engine architecture

- **Client:** GitHub Pages UI; no provider secrets, privileged database keys, or direct unrestricted tool credentials.
- **Gateway:** authenticated Supabase Edge Function; validate user/session, action, input size, quotas and permissions.
- **Policy/router:** select an approved capability (chat, learning, cyber lab, document help, HELL EDITS support) and block unapproved actions.
- **Model adapter:** provider-agnostic interface. Groq is the current hosted text provider; keep its key server-side. Future self-hosted inference can be added behind the same adapter.
- **Private memory and history:** Supabase tables with row-level security and owner-scoped server checks. Memory retrieval should be relevant and minimal.
- **Tool layer:** small, explicitly registered functions with per-tool permissions, coin policy, timeout, audit record and rollback where applicable.
- **Evaluation:** fixed tests for correctness, refusal boundaries, prompt injection, cross-account access, charge correctness, and failure handling before production releases.

## Build sequence

### Stage A — privacy and billing baseline
- Keep AI Chat at 50 coins per successful response.
- Ensure charges and message persistence are atomic: failed generation or failed persistence must not consume coins.
- Display the provider-processing notice in AI Chat.
- Verify that provider keys never appear in public repository files.

### Stage B — controlled intelligence
- Route requests to dedicated capabilities instead of one generic prompt.
- Add structured outputs and tool schemas; the model may propose an action but the server validates and executes it.
- Add per-account rate limits, bounded context, timeouts, and safe error handling.
- Use feedback for evaluation without automatically training on private chats.

### Stage C — private knowledge
- Add opt-in document retrieval with file-level permissions and deletion.
- Keep each member's knowledge index isolated. Never search across members' private files.
- Provide memory controls and a visible indicator when saved memories are used.

### Stage D — toward independent infrastructure
- Benchmark open-weight models on a separate server with controlled access and measured hardware cost.
- Test latency, quality, privacy, uptime and cost against the hosted model.
- Switch only after an authenticated canary test, rollback path, and security review. Do not claim Hell Camp owns or runs its own model until it really does.

## Release checklist

- [ ] Authenticated calls only; no service key in browser code.
- [ ] Cross-user conversation, memory and document isolation tests pass.
- [ ] AI Chat costs 50 coins only after a successful persisted reply.
- [ ] Provider failures, timeouts and empty responses cost zero coins.
- [ ] Every paid capability displays its cost before execution.
- [ ] Privacy notice accurately explains hosted provider processing.
- [ ] Existing sign-in, feed, messages, gifts, payments and HELL EDITS pass regression tests.
- [ ] Deployment is confirmed live before calling a feature released.
