# Hell Boost — independent delivery foundation

## Current verified state (2026-10-27)

- Hell Boost UI is `hell-boost.html`.
- Supabase project: `lwgbfnyjuxixduuehckp`.
- Existing tables: `growth_services`, `growth_service_orders`, `growth_service_payments`, and `growth_campaign_reports`.
- Existing RPCs: `create_growth_coin_order` and `admin_refund_hell_boost_order`.
- `create_growth_coin_order` currently deducts paid coins and inserts an `awaiting_fulfilment` order when the service is active, `fulfillment_enabled=true`, and has a positive coin rate. It does **not** call a delivery provider.
- Therefore, enabling a service today is not proof that delivery exists. Do not enable paid checkout for a service until its fulfilment path is verified.

## Product direction

Build Hell Boost as an independent order and fulfilment platform, not a Sproute clone and not dependent on Sproute credentials.

Supported initial delivery model:
1. Customer selects a service and supplies a public target URL.
2. Server validates the user, service, quantity, price and wallet.
3. The order is recorded once with a unique internal order ID and idempotency key.
4. A fulfilment adapter dispatches only to an explicitly configured, authorized service.
5. A signed callback or scheduled status poll updates the order.
6. A failure before dispatch must not charge coins; a confirmed fulfilment failure must follow a documented refund/retry policy.
7. All provider secrets remain in server-side Supabase secrets, never in HTML or browser JavaScript.

## No-provider safety rules

- If no provider adapter is configured, return `provider_not_ready=true`; do not deduct coins.
- Never report an order as completed merely because it was created or submitted.
- Do not generate artificial followers, likes, views, comments or engagement accounts.
- Support organic/consent-based promotion: campaign setup, creator placements, ad delivery, analytics, and manual review while the service is being fulfilled.
- A free API key or sandbox is not equivalent to free live delivery. Live delivery needs an actual audience, distribution channel, or authorized provider.

## Delivery adapter contract

Implement the adapter only after a legitimate fulfilment channel is selected:

- `createOrder({orderId, serviceCode, targetUrl, quantity, idempotencyKey})`
- `getOrderStatus({providerReference})`
- `verifyWebhook({rawBody, signature})`
- Map provider statuses to: `awaiting_fulfilment`, `processing`, `completed`, `rejected`, `cancelled`.
- Store only provider reference and non-secret diagnostic metadata.
- Retry transient errors with bounded exponential backoff; never create duplicate external orders.

## Implementation sequence

1. Audit the current SQL/RLS policies and existing RPCs before changing wallet code.
2. Add provider configuration and dispatch-attempt audit fields/tables with RLS.
3. Add a server-side Edge Function for dispatch and status sync.
4. Add an admin-only provider health/configuration panel; keep secrets in Supabase Edge Function secrets.
5. Run tests for insufficient balance, disabled service, provider unavailable, duplicate request, provider timeout, successful dispatch, status callback, and refund-on-failure.
6. Enable a service only after sandbox tests pass and live fulfilment has been verified.

## Safety boundary

This branch is a foundation document only. It does not claim that a provider is connected, that followers will be delivered, or that any live database changes have been deployed.
