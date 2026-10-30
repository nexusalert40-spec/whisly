# Whisly — Build Plan

Mobile-first voice-story app matching the uploaded mockups (purple/pink gradient branding, soft lavender backgrounds, rounded cards, wave footers).

## Screens (built to match the mockups)
1. **Welcome** (`/`) — gradient waveform logo, "Your voice. Your story.", Continue with Google, Continue with email, "Create account", Terms footer.
2. **Log in** (`/login`) — "Welcome back!" card, email + password (show/hide), gradient Log in button, Forgot password.
3. **Sign up** (`/signup`) — Full name, Email, Password, Confirm password, **Country** picker, Register.
4. **Reset password** (`/reset-password`) — set a new password from the email link.
5. **Complete profile** (`/onboarding`) — asks Country after Google sign-in when missing.
6. **Feed** (`/feed`) — header (logo, bell, search, profile), "Create voice" button, tabs All / Love / Life / Other, story cards with audio player + progress, Like, Support (gift), Save, More; bottom nav with center + button.
7. **Create your voice** (`/record`) — title input, glowing mic button with animated bars, 00:00 / 05:00 timer + progress, Stop, Play, Delete, Re-record, Publish (category selector added).
8. **Profile / Upgrade** (`/profile`, `/upgrade`) — account level, expiry date, buy extension/upgrade plans, my stories (delete own).

## Backend
- Use **Lovable Cloud** (built-in database, login, file storage) instead of a separately configured Supabase project — no .env to fill in for the database or Google login; Google sign-in is managed for you.
- Tables: **profiles** (id, name, email, country, subscription_expiry_date, account_level), **stories** (id, user_id, title, audio_url, category, country, likes_count, support_amount), **likes**, **saves**, **payments** (record of every PayPal order).
- Strict access rules: only signed-in users can read/write; users edit only their own profile; delete only their own stories; account level, expiry date, like counts and support amounts can only change on the server, never from the browser.
- Private audio storage bucket; users upload only into their own folder; playback via signed links.

## Feed logic
- Stories automatically filtered to the signed-in user's country, newest first, with category tab filtering.
- Likes counted by the server (one per user per story).

## Recording
- Browser microphone recording, auto-stop at 5:00, preview playback, delete/re-record, upload on Publish with loading + error states.

## PayPal
- You'll provide **PayPal Client ID** and **Secret** (stored securely, never in code), plus a **Webhook ID** after I create the webhook address.
- Flow 1 — Upgrades/extensions: fixed plans (e.g. 1 month / 6 months / 12 months, Premium level). Prices are placeholders until you give me real ones.
- Flow 2 — Support a creator: pick an amount on a story, pay via PayPal.
- Security: prices are decided on the server; orders are created and captured on the server; a verified PayPal webhook is the only thing that extends subscriptions or adds support amounts (duplicate events ignored).
- Note: all money lands in the merchant PayPal account (jhonberoti@gmail.com). Creator support is tracked per story/creator; actually paying creators out (PayPal Payouts) would be a later step.
- Starts in PayPal sandbox (test mode); switch to live by changing one setting.

## Order of work
1. Design system + all screens with mock data.
2. Enable Cloud, tables, access rules, storage, email + Google login, onboarding.
3. Real feed, recording/upload, likes, saves, delete.
4. PayPal checkout, server capture, webhook, upgrade + support flows.

## Technical details
- TanStack Start (the project's fixed framework, not Next.js), Tailwind v4 tokens in `src/styles.css` (oklch gradients `--gradient-brand`), font: Outfit/Figtree.
- Protected pages under `_authenticated/`; server functions with `requireSupabaseAuth`; zod validation everywhere; password rule min 8 chars with letters + numbers, leaked-password check on.
- PayPal: `createServerFn` for create/capture order using OAuth client-credentials via fetch; webhook at `/api/public/paypal-webhook` verified with PayPal's verify-webhook-signature API; secrets `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV`.
- Counters and subscription fields updated only via service-role on the server / security-definer functions; column-level protections via triggers.
