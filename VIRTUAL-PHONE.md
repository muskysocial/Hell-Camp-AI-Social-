# Hell Camp Virtual Phone setup

## Deployed pieces
- The `virtual_phones` table exists in Supabase with RLS enabled and four user-specific policies.
- Supabase Edge Function `virtual-phone-session` is deployed with JWT verification enabled.
- The feature branch adds the phone UI and a menu entry. The draft PR is not merged to production.
- US routing is not enabled until the provider secrets are added and a live session's public IP is verified.

## Required one-time provider setup
1. Create a Browserbase account at https://www.browserbase.com/ and create a project. Browser sessions can be requested in the US region `us-west-2`.
2. In the Browserbase dashboard, copy the API key and project ID. Do not send either secret in chat or commit them to GitHub.
3. Open Supabase Edge Function secrets for project `lwgbfnyjuxixduuehckp` at https://supabase.com/dashboard/project/lwgbfnyjuxixduuehckp/functions/secrets
4. Add:
   - `BROWSERBASE_API_KEY` = your Browserbase API key
   - `BROWSERBASE_PROJECT_ID` = your Browserbase project ID
5. Browser sessions may be billable. Check current provider pricing before enabling this for all users.
6. After merging/deploying the feature branch, sign in to Hell Camp, open Hell Phone, and press **Start US browser session**.
7. Verify the public IP from inside the remote browser. A US region selects US-hosted browser compute but does not by itself guarantee a particular IP geolocation for every service. Do not claim verified US egress until tested.

## Important limitations
- External app icons link to their websites; they are not native iOS apps. Social sites may block embedding or remote browser sessions.
- This function creates a time-limited remote session. It does not yet implement durable per-user browser contexts/cookie restoration across expired sessions.
- Do not store external social account passwords in Hell Camp.
- Keep the provider API key in Supabase secrets only. Never expose it to the frontend.
