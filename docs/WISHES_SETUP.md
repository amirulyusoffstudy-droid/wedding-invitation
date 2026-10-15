# Native guestbook setup

## Combined RSVP and ucapan

The `feature/rsvp-ucapan` branch adds attendance and guest count to the same
submission as an optional wish. Only names and wishes are returned publicly.
Attendance and guest counts stay in the response Sheet. Attending guests can
select 1–5 people including themselves; declining guests are recorded as zero.

Before deploying this branch, update the existing Apps Script web app with
`docs/google-apps-script-wishes.js`: save the script, then use **Deploy > Manage
deployments > Edit > New version > Deploy**, keeping the existing `/exec` URL
and write secret. Do not rerun `setup` for this update; it compacts existing rows.
The updated script adds **Kehadiran** and **Bilangan Tetamu** columns when the
first RSVP is received, and saves the attendance and wish in the same row.

The API checks the adapter's RSVP capability before writing. An old adapter
will return an error rather than report success while discarding attendance.
For a branch preview, use its same-origin `/api/wishes` endpoint and configure
the Preview Google Script URL and secret. Plain Vite does not serve API routes;
use `npm run dev:secure` for isolated mock submissions.

The invitation submits and reads wishes through a Vercel Function. The function
keeps the Google Apps Script URL out of browser code and validates public input.

## Google Sheet and Apps Script

1. Open the Google Sheet linked to **Ucapan Untuk Pengantin** and copy either
   its full URL or its ID from `docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.
2. Open either **Extensions > Apps Script** or your existing standalone Apps
   Script project.
3. Replace the editor contents with `docs/google-apps-script-wishes.js`.
4. If using a standalone project, replace
   `PASTE_RESPONSE_SPREADSHEET_ID_OR_URL_HERE` with the URL or ID copied in step 1.
5. Save, select the `setup` function, and click **Run**.
6. Approve Google's permission prompt. The one-time setup removes the obsolete
   **Approved** column and compacts existing responses directly below the header.
7. Open **Project Settings > Script properties** and add
   `WISHES_WRITE_SECRET` with a long random value. Do not paste the value into
   source code or share it publicly.
8. Choose **Deploy > New deployment > Web app**.
9. Set **Execute as** to **Me** and **Who has access** to **Anyone**.
10. Deploy and copy the URL ending in `/exec`. Do not use the `/dev` test URL.

## Vercel environment variable

Add the `/exec` URL as `GOOGLE_WISHES_SCRIPT_URL` and the same random write
secret as `GOOGLE_WISHES_WRITE_SECRET` on the `erni-amirul` Vercel project.
Configure both Preview and Production separately, then redeploy.

Set `WISHES_ALLOWED_ORIGINS` to the comma-separated browser origins allowed to
use the API. The expected production value is:

```text
https://erni-amirul.vercel.app,https://amirulyusoffstudy-droid.github.io
```

Do not update the live Apps Script deployment until Vercel already has the
write-secret environment variable. This ordering prevents submission downtime.

## Public wishes

New wishes are displayed automatically. The invitation refreshes wishes whenever
the Ucapan panel opens or the refresh button is pressed. New rows are positioned
from actual response content, so formatting or empty table rows cannot push them
far down the spreadsheet.
