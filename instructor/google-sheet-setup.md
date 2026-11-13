# Live progress in a Google Sheet (about 10 minutes)

The site sends each student's progress to a Google Sheet that you own. One row per student, updated as they work.
Students must tick the consent box on the **My progress** page and enter their name and section first.

## 1. Create the sheet and the script
1. Create a new Google Sheet, for example "CSAE 104 Progress".
2. Choose **Extensions > Apps Script**.
3. Delete the sample code, paste in everything from `instructor/Code.gs`, and change `SECRET` to a word of your own.
4. Choose **Run > setup** (pick `setup` in the function list). Allow the permissions when Google asks. This creates the `Progress` and `Settings` sheets. If the "Weeks behind" column ever shows `#REF!`, run `repairFormulas` (or `setup`) from the editor.

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

## Stopping name changes and impersonation
- **One name per device.** The first device to sync a name owns that row (the hidden-looking `Device ID` column at the far right of the Progress sheet). Another device cannot send progress under the same name, and a device that has already synced cannot switch to a different name. Students see a clear message instead.
- **Locked fields.** After the first successful sync, the name, section and ID fields on the My progress page are locked. "Reset my progress" clears progress only, not the name.
- **Unlocking a student** (new phone, cleared browser data, typo in the name): in the Progress sheet, clear that student's cell in the last column (**Device ID**). Their next sync claims the row again. For a wrong name, delete the whole row and ask the student to sync again.
- **Student ID is required.** Students must enter their ID number to share progress or submit work. The ID is the unique key for a student, so two spellings of one name can never create two rows.
- **Class list (strongest option).** Run `setup` again to create a **Roster** tab, then list your students there: **Name, Section (3B, 3E, 3F or 3G) and Student ID**. When the Roster has IDs, a student can only sync with an ID on your list. The name and section are then taken from your list, so a typo in the name does not matter. If you list names without IDs, the name is matched (ignoring capital letters and extra spaces) and the student still has to enter an ID. Leave the Roster empty to accept any name and ID.
- This is a deterrent, not a login. A student who clears their browser data and uses a new name and ID can still start a new row unless you use the Roster with IDs, so fill in the Roster before students start.
- Rows created before this change (without an ID) are separate from rows with an ID. Delete the old test rows.

After changing the script, always use **Deploy > Manage deployments > Edit > New version > Deploy**.

## Receiving student work (GitHub links)
Students keep one GitHub repository for the whole semester, named `csae104-notices-board`, with one folder per lab. They finish each lab with `git add .`, `git commit` and `git push`, and for the five project checkpoints they also add a tag (`git tag checkpoint-1` and so on, then `git push --tags`).

They then open **My progress > Submit my work**, choose the lab or checkpoint, and paste the repository link (plus the tag name, and the deployed address for Weeks 15 and 17).

- Submissions arrive in a **Submissions** tab: one row per student per item, with a clickable repo link, the tag or folder, the deployed site, the first submission time, the last update and how many times it was sent. Run `setup` once, or just deploy the new version, and the tab is created on the first submission.
- A student can submit an item again to replace the link. The first submission time is kept.
- Only real `https://github.com/...` links are accepted, so other sites and spreadsheet formulas are refused.
- A student must have shared their progress first (the name lock), and must submit from the same device. Submissions are matched to the student, so nobody can submit under a classmate's name.
- If a repository is private, students add the GitHub account in `instructorGithub` (in `assets/config.js`) as a collaborator. Change that value to your own account.
- Grading: open the repo, check the commit history (dates and regular commits), open the tag for the checkpoint, and run or read the code. Compare "First submitted" with your deadline for late work.

After changing the script, always use **Deploy > Manage deployments > Edit > New version > Deploy**.

## Students who change device
Progress is saved in each browser. A student who gets a new phone or computer can use **My progress > Use another device**: download a backup on the old device, then **Restore from backup** on the new one. The backup carries their device ID, so the sheet recognises the new device without you unlocking anything. If a student lost the old device with no backup, clear their **Device ID** cell in the Progress sheet; their progress restarts on the new device from zero, and their next sync claims the row again.

## Quizzes are taken once
Each quiz can only be taken once. Answers lock as soon as a student picks one, they stay locked after a reload, and "Reset my progress" does not clear them. In the Google Sheet, a quiz score that is already there is never replaced, so the first score counts. To let a student retake a quiz, clear that week's quiz cell in the Progress sheet and ask them to clear their site data for the site (or use a different browser).
