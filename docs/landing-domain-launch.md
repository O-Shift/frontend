# OrangeShift website and application launch

The new landing page belongs at **https://www.orangeshift.net/**. Login, signup, onboarding, workspace selection, the dashboard, integrations, and the API proxy belong at **https://app.orangeshift.net/**. Both domains use the **same existing Vercel frontend project and deployment**. A second project is not required.

This branch contains the finished landing page, actual OShift branding, interactive glass magnifier, readable OrangeShift business footer and LinkedIn link, plus the domain routing. The original dashboard is preserved as `src/components/dashboard/Home.tsx`; it renders at the app hostname's root and at `/dashboard`.

## Instructions for the Vercel owner

1. Open the existing Vercel project connected to `O-Shift/frontend`. Keep its existing framework, build, backend, Supabase and analytics configuration. The Git production branch is currently `master`; this change is pushed on `codex/landing-domain-launch` for review before merging.
2. In **Settings → Domains**, retain `www.orangeshift.net` and `orangeshift.net`, and add **app.orangeshift.net** to the same project. Assign the app domain to the production environment. Do **not** configure a Vercel domain redirect from `app.orangeshift.net` to `www.orangeshift.net`: these hosts serve different experiences. An existing apex-to-www redirect is fine.
3. At the DNS provider, add the `app` record using **the exact value Vercel displays for this project**. Do not guess a historical CNAME value, change nameservers, or change mail/MX records. Wait until Vercel reports valid DNS configuration and HTTPS works for the app hostname. [Vercel domain instructions](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
4. Set these **Production** environment variables in Vercel before merging:

   ```text
   NEXT_PUBLIC_SITE_URL=https://www.orangeshift.net
   NEXT_PUBLIC_APP_URL=https://app.orangeshift.net
   NEXT_PUBLIC_API_BASE_URL=/api
   ```

   Keep the existing real `API_BACKEND_URL`, Supabase URL/public key, PostHog key/host, and other existing application variables. Do not copy placeholder credentials from `.env.example`. The URL defaults in code already match these production domains, but setting them explicitly avoids an old `NEXT_PUBLIC_SITE_URL` overriding the new canonical address. Environment changes require a new deployment.
5. In **Supabase → Authentication → URL Configuration**, change **Site URL** to `https://app.orangeshift.net`. Add the following redirect entries without removing local/development entries still in use:

   ```text
   https://app.orangeshift.net/auth/callback
   https://app.orangeshift.net/auth/callback?next=**
   https://app.orangeshift.net/update-password
   ```

   The scoped callback query pattern covers existing encoded onboarding, workspace and deep-link destinations. Do not use a wildcard for every production host/path. Audit custom confirmation/reset email templates for hardcoded `www.orangeshift.net` links; use Supabase's confirmation/redirect variables so links return to the app hostname. The code already builds callback and recovery URLs from the origin where login/signup is opened. [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).
6. Keep the social-login provider's Supabase callback URI unchanged when it still points to `https://<supabase-project>.supabase.co/auth/v1/callback`. If Google/provider settings include JavaScript origins for the frontend, add `https://app.orangeshift.net`. Check any backend-managed integration callbacks and frontend-return URLs: their final frontend destination must use the app hostname. Backend deployment/configuration is outside this frontend repository.
7. Confirm the app domain, DNS, HTTPS, environment values and auth redirect settings are ready. Then merge the pull request into `master`. Let the existing Vercel Git integration build the resulting production commit. Verify the deployed Git SHA matches that merge. No separate build/upload command is needed.

## Expected journeys

| Visitor action | Result |
| --- | --- |
| Visit `www.orangeshift.net/`, including a returning visitor | Public landing page; no forced login or signup |
| Visit `orangeshift.net/` or `www.orangeshift.net/landing` | Canonical public homepage |
| Click **Start watching**, **Find your next move**, or the final CTA | `/start` on the app hostname chooses the entry page |
| New browser clicks the main CTA | `app.orangeshift.net/signup` |
| Previously signed-in browser, now signed out, clicks the main CTA | `app.orangeshift.net/login` |
| Browser has a valid app session and clicks the CTA/login/signup | `app.orangeshift.net/workspaces`, then the dashboard |
| Click **Log in** without a live session | App login page, regardless of browser history |
| Visit a login/signup/product/API URL on the main domain | Redirect to the corresponding app URL, preserving query parameters |
| Visit a protected app route without a valid session | App login page; the history marker never grants access |

The returning-browser marker is a host-only, HttpOnly, SameSite=Lax cookie named `oshift_returning_browser`. It is written only after a verified Supabase session, lasts one year, and survives signing out. It contains only `1`, not an identity or credential. Cookie expiry, clearing browser data and private browsing reset this preference. It cannot reconstruct a past login whose browser data has already been removed.

Existing sessions on `www.orangeshift.net` or an old Vercel hostname do **not** transfer to the app subdomain. Users will sign in once on the new app hostname; actual auth cookies are deliberately not broadened to the parent domain. The history preference starts being recorded on the new app host after that verified sign-in. Existing workspace/browser storage is also origin-specific, so workspace selection runs again.

## Production smoke checks after deployment

- In a fresh/private browser, load the public homepage. Confirm hero, logo/mascot, wheel scrolling, glass lens, footer address, OrangeShift name and LinkedIn button.
- Click the main CTA: hostname must become `app.orangeshift.net` and the real signup form must appear. The login link must open the real app login form.
- Sign in with a real authorized account, choose a workspace and confirm the dashboard and a normal data request work. No account was created by the preparation checks.
- Visit the homepage while still signed in; it should remain the landing page. Click the CTA; it should return to workspace selection without another password prompt.
- Sign out, revisit the homepage and click the CTA; the app should select login. A private browser should still select signup. Direct `/signup` remains available for explicitly creating another account.
- Verify Google login, confirmation email and password reset return to the app hostname, not the marketing domain. Test one integration connect/return flow if integrations are in use.
- Verify `www.orangeshift.net/robots.txt` permits the homepage, its sitemap lists the canonical homepage, and `app.orangeshift.net/robots.txt` disallows indexing. App/auth responses also send `X-Robots-Tag: noindex, nofollow`.

## Local verification and rollback

Localhost and unconfigured Vercel preview hosts show the landing at `/` and keep auth/product URLs on their own host. `/dashboard` provides the product dashboard after workspace selection in this single-origin setup. For a full host-routing check, run a production server on port 3100 and then:

```powershell
npm run build
npm run start -- --port 3100
# In a second terminal:
node scripts/check-domain-routing.mjs
```

The check uses synthetic Host headers, manual redirect inspection and no credentials. Unit tests cover host boundaries, redirect query preservation, preview behavior and browser-entry decisions. Real signed-in/email/OAuth/backend behavior must still be smoke-tested on the configured deployment.

If deployment checks fail, restore the preceding production deployment in Vercel. Restore the previous Supabase Site URL/redirect configuration if rolling the domain migration back. Keep the app domain attached while diagnosing; deleting DNS is unnecessary. Resolve the issue on the release branch before retrying.
