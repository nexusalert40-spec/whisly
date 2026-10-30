<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Legal documents live on the public `/legal` page; acceptance navigates to registration and decline closes or leaves the site without changing an account, because browser tab closure can be restricted.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate); the layout also forces `/onboarding` when a profile has no country, because the feed is country-scoped.
- Money-related fields (profiles.account_level/subscription_expiry_date, stories.likes_count/support_amount) are never writable by the browser: column grants + triggers + the service-role-only `fulfil_payment` RPC own them.
- PayPal prices live in `src/lib/plans.ts` and are applied only server-side; orders are created/captured in `src/lib/paypal.functions.ts`, with `/api/public/paypal-webhook` as signature-verified backup fulfilment (idempotent).
- Story audio is stored privately in the `audio` bucket under `<user_id>/…`; the DB keeps the storage path and the app plays it via signed URLs.
- UI text goes through `useI18n().t()` from `src/lib/i18n.tsx` (English is the fallback for missing keys; Arabic switches the page to RTL), so new strings need an `en` key.
- Story categories are defined once in `CATEGORIES` (`src/lib/stories.ts`) and must match the `stories_category_check` constraint.
