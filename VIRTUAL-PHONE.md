# Hell Camp Virtual Phone foundation

This branch adds an isolated iPhone-style virtual phone page and an account-scoped Supabase schema migration.

## Included
- Responsive iPhone-inspired home screen with WhatsApp, Facebook, Instagram, TikTok, and X shortcuts.
- Personal wallpaper and note settings with Supabase-backed state persistence once the migration is applied.
- Row Level Security policies tying each phone row to `auth.uid()`.
- Clear status warning: external tabs use the user's normal network until a real US remote-browser/gateway service is integrated.

## Test
1. Apply `supabase/migrations/202610250001_virtual_phones.sql` to the Hell Camp Supabase project.
2. Open the phone page from the authenticated Hell Camp site.
3. Change wallpaper and note, wait for the save status, reload, and confirm the state restores.
4. Sign in with a second test account and confirm it sees a separate empty phone row; verify direct reads/writes for the first user's UUID are denied by RLS.
5. Do not describe US routing as active until a provider-backed remote browser is configured and the public egress IP and leak tests pass.

## US browsing integration still required
A front-end page or ordinary external link cannot route all browser traffic through a US IP. The production phase needs an authenticated backend session broker plus a remote browser/network gateway with US egress, session isolation, outbound destination restrictions, expiry, and leak testing. Provider credentials must be stored server-side and must never be placed in this repository or browser code.
