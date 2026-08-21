# Wedding Invitation Security Review

**Review date:** 20 August 2026
**Reviewed deployment:** <https://erni-amirul.vercel.app>
**Scope:** React/Vite client, Vercel Function, Google Apps Script guestbook,
Google Sheet data flow, public assets, deployment workflow, dependencies, and
Firebase rule presence.
**Change policy:** Report only. No application behavior, cloud configuration,
or deployed service was changed during this review.

> **Deployment update — 21 August 2026:** The remediations were merged into
> `main` and deployed to Vercel. The protected Apps Script write path,
> spreadsheet formula neutralization, and restricted origins were verified in
> Preview; the live write path, browser headers, and Vercel Firewall rate limit
> were verified after the production cutover.

## Executive summary

The application has a small and understandable attack surface, uses React's
safe text rendering, validates guestbook lengths at both server boundaries, and
keeps the Google Apps Script URL out of the browser bundle. HTTPS/HSTS is active,
common secret patterns were not found in tracked source, npm registry signatures
verified, and the published JPEGs did not expose GPS metadata.

The review identified two high-priority findings before broadly sharing the invitation:

1. Anyone can automate guestbook writes without authentication or a durable
   rate limit, including by calling the Apps Script endpoint directly if its URL
   is discovered. Messages are published automatically.
2. A name or message beginning with a spreadsheet formula marker can be written
   through `setValues()`, creating a formula-injection path in the response
   spreadsheet.

Both high-priority findings are now remediated. **Residual risk:** Moderate,
primarily because event, contact, financial, and guestbook information remains
intentionally public to anyone with the invitation URL.

## Architecture and trust boundaries

```text
Guest browser
  | GET/POST (untrusted name + message)
  v
Vercel /api/wishes
  | server-side fetch using GOOGLE_WISHES_SCRIPT_URL
  v
Public Google Apps Script web app
  | read/write
  v
Google response spreadsheet

Public static site -> photos, phone numbers, venue, QR codes, bank details
GitHub Actions    -> npm install/build -> GitHub Pages
Vercel build      -> npm install/build -> static site + API function
```

Assets requiring protection or deliberate exposure decisions:

- Integrity and availability of the wishes spreadsheet.
- Guest names and messages.
- Couple/family names, phone numbers, photos, venue and event time.
- Bank account numbers and DuitNow QR images.
- Vercel environment configuration and Apps Script deployment URL.

## Findings summary

| ID | Severity | Finding | Status |
|---|---|---|---|
| SEC-01 | High | Public guestbook writes have no authentication or durable rate limit | Remediated and verified in production |
| SEC-02 | High | Spreadsheet formula injection is possible through guest input | Remediated; literal readback verified through Preview |
| SEC-03 | Medium | Sensitive event and financial details are intentionally public and indexed | No-index deployed; account exposure accepted |
| SEC-04 | Medium | Personalized guest names are carried in shareable query-string URLs | Remediated and deployed |
| SEC-05 | Medium | Browser hardening headers are incomplete | Remediated and verified in production |
| SEC-06 | Medium | Dependency audit reports four high-severity advisories | Remediated; audit now clean |
| SEC-07 | Low | Guestbook PII has no stated retention/deletion policy or notice | Notice implemented; retention process pending |
| SEC-08 | Low | Direct Apps Script errors reveal internal details | Remediated and deployed |
| SEC-09 | Low | CI actions use mutable tags and dependency scripts run without an allowlist | Remediated and deployed |

## Detailed findings

### SEC-01 — Public guestbook writes can be automated

**Severity:** High
**Evidence:** [`api/wishes.ts`](../api/wishes.ts#L21),
[`api/wishes.ts`](../api/wishes.ts#L90),
[`google-apps-script-wishes.js`](google-apps-script-wishes.js#L123)

The Vercel API permits `POST` from every browser origin with
`Access-Control-Allow-Origin: *`. It has only a client-visible honeypot and no
durable rate limit, challenge, authentication, or abuse quota. CORS is not an
authentication control, and non-browser clients ignore it. The public Apps
Script `doPost()` also accepts writes without proof that the request came from
Vercel. Because new messages display automatically, one attacker can spam the
public wall, grow the sheet, and consume Vercel or Apps Script quotas.

**Recommended remediation:**

1. Add a durable server-side rate limit to `POST /api/wishes` (for example,
   per-IP and global limits backed by a shared store or platform firewall).
2. Add a maximum request-body size and reject unsupported content types before
   parsing JSON.
3. Restrict browser CORS to the Vercel and GitHub Pages origins. Treat this as
   defense in depth, not authentication.
4. Store a write secret in Vercel and Apps Script `PropertiesService`; require
   it in `doPost()` so callers cannot bypass Vercel controls by using the Apps
   Script URL directly.
5. Consider a lightweight bot challenge and a rapid takedown/moderation path,
   even if normal messages remain auto-published.

### SEC-02 — Spreadsheet formula injection

**Severity:** High
**Evidence:** [`google-apps-script-wishes.js`](google-apps-script-wishes.js#L67),
[`google-apps-script-wishes.js`](google-apps-script-wishes.js#L123),
[`google-apps-script-wishes.js`](google-apps-script-wishes.js#L144)

The sanitizers remove control characters and enforce length limits, but they do
not neutralize values beginning with `=`, `+`, `-`, or `@`. Apps Script writes
the strings through `Range.setValues()`, where formula-looking strings can be
interpreted as spreadsheet formulas. A malicious wish could corrupt cells,
make external requests through spreadsheet functions, or mislead an operator
viewing/exporting the sheet.

**Recommended remediation:** Neutralize formula-leading input at the final
spreadsheet boundary by prefixing an apostrophe before writing it. Apply this to
every user-controlled cell, including migrated rows. Add regression cases for
`=HYPERLINK(...)`, `+1+1`, `-1+1`, and `@SUM(...)`.

### SEC-03 — Public indexing of sensitive event and financial data

**Severity:** Medium
**Evidence:** [`wedding.ts`](../src/data/wedding.ts#L77),
[`wedding.ts`](../src/data/wedding.ts#L92),
[`robots.txt`](../public/robots.txt), [`sitemap.xml`](../public/sitemap.xml)

The public client bundle contains family phone numbers, full bank account
numbers, account-holder names, venue, event time, personal names, and photos.
DuitNow QR images are directly downloadable. `robots.txt` allows all crawling,
and the sitemap explicitly advertises the site. Full account publication was
explicitly approved, but indexing and long-term aggregation remain privacy and
social-engineering risks. Removing values later does not remove them from Git
history, mirrors, caches, or prior downloads.

**Recommended remediation:** Decide whether search indexing is actually needed
for an invitation. If not, add `noindex`, remove the sitemap, and use a less
discoverable/private sharing method. For the gift panel, prefer QR-only or
masked numbers with a private contact route. Treat robots directives as crawler
guidance, not access control.

### SEC-04 — Personalized names propagate through shared URLs

**Severity:** Medium
**Evidence:** [`guest.ts`](../src/utils/guest.ts#L3),
[`App.tsx`](../src/App.tsx#L144)

Guest personalization uses `?to=Name`, while the share action forwards
`window.location.href`. A recipient can therefore forward another guest's name,
and the value persists in browser history, screenshots, copied links, and some
logs. React escapes the text correctly, so this is a privacy issue rather than
an XSS issue.

**Recommended remediation:** Strip `to` before using the Web Share or clipboard
APIs. If personalization must remain private, use a URL fragment or an opaque,
expiring invitation identifier instead of a readable name in the query string.

### SEC-05 — Missing defense-in-depth response headers

**Severity:** Medium
**Evidence:** Live header inspection on 20 August 2026; no `vercel.json` or CSP
meta policy exists in the repository.

The live deployment correctly sends HSTS, but the main document did not send a
Content Security Policy, `X-Content-Type-Options`, clickjacking protection,
`Referrer-Policy`, or `Permissions-Policy`. These controls reduce the impact of
future injection or dependency mistakes and prevent unwanted embedding.

**Recommended remediation:** Add a restrictive CSP (`default-src 'self'`,
`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, narrowly scoped
`connect-src`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a
minimal `Permissions-Policy`. Use Vercel headers plus a CSP meta fallback if the
GitHub Pages copy must receive equivalent protection.

### SEC-06 — Known dependency vulnerabilities

**Severity:** Medium (upstream advisory severity: High)
**Evidence:** `npm audit --json` and `npm audit --omit=dev --json`, run on
20 August 2026 against the committed `package-lock.json`.

The full audit reported four high-severity vulnerable packages with fixes
available:

- `brace-expansion` through ESLint and typescript-eslint
  ([GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp),
  [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg),
  [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895)).
- `js-yaml` through ESLint
  ([GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)).
- `nanoid` through PostCSS/Vite
  ([GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv),
  [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8)).
- `postcss` through Vite
  ([GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp),
  [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849)).

These packages are reached during lint/build rather than by normal visitor
requests, which lowers immediate production exploitability. Vercel and GitHub
Actions still execute the affected build chain. `npm audit --omit=dev` retains
the PostCSS/Nanoid findings because Vite and its React plugin are currently
declared as production dependencies.

**Recommended remediation:** Review targeted non-breaking dependency updates,
move build-only Vite packages to `devDependencies`, regenerate the lockfile, and
rerun lint, typecheck, build, full audit, and production-only audit. Do not use
`npm audit fix --force` without reviewing breaking changes.

### SEC-07 — No guestbook privacy lifecycle

**Severity:** Low
**Evidence:** [`WishesPanel.tsx`](../src/components/WishesPanel.tsx#L98),
[`google-apps-script-wishes.js`](google-apps-script-wishes.js#L96)

Guest names and messages are stored in Google Sheets and displayed publicly,
but the form does not explain public visibility beyond immediate display, state
a retention period, or provide a correction/deletion route. The sheet retains
entries indefinitely unless manually removed.

**Recommended remediation:** Add a concise notice stating that the name and
message will be public, identify a deletion contact, document a retention date,
and establish a reliable deletion process for the sheet and any exports.

### SEC-08 — Apps Script exposes internal errors to direct callers

**Severity:** Low
**Evidence:** [`google-apps-script-wishes.js`](google-apps-script-wishes.js#L118),
[`google-apps-script-wishes.js`](google-apps-script-wishes.js#L158)

The Vercel proxy returns generic Malay errors, which is good. The direct Apps
Script response returns `error.message`, potentially revealing header names,
configuration state, or spreadsheet structure to anyone who knows the URL.

**Recommended remediation:** Log detailed errors privately with `console.error`
and return a generic public message from Apps Script.

### SEC-09 — CI supply-chain hardening is incomplete

**Severity:** Low
**Evidence:** [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)

GitHub Actions are referenced by mutable major-version tags rather than commit
SHAs, and `npm ci` runs dependency lifecycle scripts without an explicit
allowlist. The workflow permissions are otherwise appropriately scoped, and one
authoritative lockfile is present.

**Recommended remediation:** Pin third-party actions to reviewed commit SHAs,
add automated dependency updates, inspect required lifecycle scripts, and adopt
a fail-closed script policy where practical. Registry verification succeeded:
176 packages had verified signatures and 62 had verified attestations.

## Firebase Security Rules assessment

**Status:** Not applicable.

No Firebase SDK dependency, `.firebaserc`, `firebase.json`, `firestore.rules`,
or `storage.rules` exists in the repository. Therefore the Firebase-specific
create/update bypass, ownership, role authority, type, size, and Storage rules
checklist cannot be scored. The actual persistence layer is Google Sheets via
Apps Script and is covered by SEC-01, SEC-02, SEC-07, and SEC-08.

## Confirmed controls and positive findings

- React renders guest-controlled names/messages as text; no
  `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `document.write` was found.
- The Vercel and Apps Script boundaries trim input and cap names/messages.
- The upstream Apps Script URL is held in a Vercel environment variable rather
  than browser code or tracked source.
- The Vercel API uses a 10-second upstream timeout and generic error responses.
- HSTS is enabled on the live Vercel deployment.
- No common credential/private-key pattern or tracked environment file was
  found. `.env*.local` and `.vercel/` are ignored.
- The package manager and CI agree on npm with one committed lockfile; CI uses
  `npm ci`.
- npm registry signature verification succeeded.
- Public JPEG/JPEG QR assets contained no GPS metadata in the available metadata
  inspection. Personal image content itself remains intentionally public.
- The guest-name query parameter is normalized, length-limited, and safely
  escaped by React.

## Recommended remediation order

1. **SEC-02:** Neutralize spreadsheet formulas.
2. **SEC-01:** Add write authentication between Vercel and Apps Script, durable
   rate limiting, body limits, and restricted browser origins.
3. **SEC-06:** Upgrade the vulnerable build dependency chain.
4. **SEC-05:** Add security headers.
5. **SEC-03/SEC-04:** Decide the intended privacy/indexing posture and stop
   forwarding personalized query parameters.
6. **SEC-07/SEC-08/SEC-09:** Add privacy lifecycle, generic Apps Script errors,
   and CI hardening.

## Verification performed

- Repository and tracked-file inventory.
- Firebase configuration/rules search.
- Manual review of React, Vercel Function, Apps Script, Vite, deployment
  workflow, and public metadata/configuration.
- Common secret-pattern scan and ignored-file review.
- Live Vercel page/API header inspection.
- `npm audit --json` and `npm audit --omit=dev --json`.
- `npm audit signatures`.
- Dependency path inspection with `npm ls`.
- JPEG metadata/GPS-property inspection.
