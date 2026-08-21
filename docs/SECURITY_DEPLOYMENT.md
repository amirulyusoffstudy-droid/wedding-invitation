# Security hardening deployment

This branch is safe to review locally without writing to the live Google Sheet.

## Local review

```powershell
npm.cmd run dev:secure
```

Open <http://127.0.0.1:3000>. The command forces `WISHES_STORAGE_MODE=mock`
for the local Vercel Function. Mock wishes live only for the local function
process and are never sent to Google Apps Script.

## Production prerequisites

Do not merge or deploy until these items are ready:

1. Generate a long random `WISHES_WRITE_SECRET`.
2. Add it to Apps Script **Project Settings > Script properties**.
3. Add the same value to Vercel as `GOOGLE_WISHES_WRITE_SECRET` for Preview and
   Production. Mark it sensitive.
4. Set `WISHES_ALLOWED_ORIGINS` in Vercel:

   ```text
   https://erni-amirul.vercel.app,https://amirulyusoffstudy-droid.github.io
   ```

5. Keep the existing `GOOGLE_WISHES_SCRIPT_URL` value.

## Vercel Firewall rate limit

The code rejects malformed requests, but a durable serverless rate limit belongs
at the Vercel Firewall boundary. Before production cutover, create a rate-limit
rule for:

- Path: `/api/wishes`
- Method: `POST`
- Suggested starting limit: 5 requests per IP per 60 seconds
- Action: rate limit/deny

Observe normal wedding traffic after launch and adjust only if legitimate guests
are blocked. Rate limiting is plan/usage dependent, so review the Vercel summary
before enabling the rule.

## No-downtime cutover order

1. Configure the Vercel write secret and origin allowlist.
2. Deploy the hardened Vercel branch to Preview and test it.
3. Update the existing Apps Script source, but do not publish the version yet.
4. Confirm the Apps Script property contains the matching write secret.
5. Deploy the new Apps Script version to the existing `/exec` deployment.
6. Immediately verify Preview submission and spreadsheet formula neutralization.
7. Merge to `main` and deploy Production.
8. Enable/confirm the Vercel Firewall rate-limit rule.

The Vercel-first order is intentional: the new API sends the secret while the
old Apps Script safely ignores the additional JSON field. Publishing Apps Script
first would reject writes from the current production API.

## Post-deployment checks

- Valid wish returns `201` and appears in the spreadsheet.
- `=1+1` is stored/displayed as text, never evaluated as a formula.
- Unknown browser origin returns `403`.
- Non-JSON request returns `415`.
- Request larger than 4 KiB returns `413`.
- Excess rapid submissions return `429` from Vercel Firewall.
- CSP, `nosniff`, frame denial, referrer policy, and no-index headers are present.
- Current production invitation and GitHub Pages origins can both read wishes.
- The current Vercel Preview deployment origin can submit wishes without opening
  access to unrelated `vercel.app` sites.
- HSTS is present on the production response.
