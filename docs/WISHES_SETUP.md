# Native guestbook setup

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
6. Approve Google's permission prompt. A successful run confirms the script can
   access the response tab.
7. Choose **Deploy > New deployment > Web app**.
8. Set **Execute as** to **Me** and **Who has access** to **Anyone**.
9. Deploy and copy the URL ending in `/exec`. Do not use the `/dev` test URL.

## Vercel environment variable

Add the `/exec` URL as the production environment variable
`GOOGLE_WISHES_SCRIPT_URL` on the `erni-amirul` project, then redeploy.

## Public wishes

New wishes are displayed automatically. The invitation refreshes wishes whenever
the Ucapan panel opens or the refresh button is pressed. The old **Approved**
column can be left in the spreadsheet; it is no longer used.
