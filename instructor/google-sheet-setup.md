# Live progress in a Google Sheet (about 10 minutes)

The site sends each student's progress to a Google Sheet that you own. One row per student, updated as they work.
Students must tick the consent box on the **My progress** page and enter their name and section first.

## 1. Create the sheet and the script
1. Create a new Google Sheet, for example "CSAE 104 Progress".
2. Choose **Extensions > Apps Script**.
3. Delete the sample code, paste in everything from `instructor/Code.gs`, and change `SECRET` to a word of your own.
4. Choose **Run > setup** (pick `setup` in the function list). Allow the permissions when Google asks. This creates the `Progress` and `Settings` sheets. If the "Weeks behind" column ever shows `#REF!`, the Settings sheet is missing: run `setup` again.

## 2. Publish it
1. Click **Deploy > New deployment**, choose the type **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**.
3. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
4. Open the URL in a browser. You should see `{"ok":true,"message":"CSAE 104 progress endpoint is running"}`.

After you edit the script later, use **Deploy > Manage deployments > Edit > New version**, or the change will not go live.

## 3. Connect the site
Edit `assets/config.js`:
```js
window.CSAE_CONFIG = {
  endpoint: "PASTE THE WEB APP URL HERE",
  key: "THE SAME SECRET AS IN Code.gs",
};
```
Commit and push. Students then see a "Share my progress with my instructor" box on the My progress page.

## 4. Use it
- **Progress** sheet: one row per student with lecture %, lab %, quiz average, weeks behind, per-week columns and last active date. Use the filter on the Section column.
- **Settings** sheet: change **Current week** each week and the **Behind if below %** threshold. The "Weeks behind" column updates by itself, and red cells mark weeks under the threshold.
- Share the sheet only with people who need it (you and any co-teacher). It contains student names.

## Good to know
- The key in `config.js` is public, because the site is public. It only stops random posts; it is not a password. Do not put anything secret in the sheet's script.
- Students can edit their own data in the browser, so treat the numbers as self-reported.
- A student who clears their browser data loses local progress. Their row stays in the sheet until they sync again.
- Only name, section, optional student ID, percentages and quiz scores are sent. Notes are never sent.
- To stop collecting data, set `endpoint` back to `""` or use **Deploy > Manage deployments > Archive**.
