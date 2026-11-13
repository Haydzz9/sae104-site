# CSAE 104 progress monitoring: instructor guide

For the instructor (and any co-teacher). For the technical details, see `docs/SYSTEM-SPECIFICATION.md`. Students have their own page at `docs/STUDENT-GUIDE.md` and on the site (**How it works**).

## 1. What you get

- A **Google Sheet** that fills itself as students use the site: one row per student with lecture, lab and quiz progress for all 18 weeks.
- A **registration form** so every student appears, and a **Not registered** tab that shows who is missing.
- **Behind** and **Inactive** flags, so you can see who needs a nudge.
- A **Submissions** tab with each student's GitHub links (labs, project checkpoints, final project), where you also enter **scores and feedback**.
- Students see **their own scores** on the site when you release them.

## 2. One-time setup (about 15 minutes)

You need a Google account. Do these steps once per course.

**A. Create the sheet and the script**
1. Create a new Google Sheet and name it, for example, "CSAE 104 Progress".
2. Choose **Extensions > Apps Script**.
3. Delete the sample code. Open `instructor/Code.gs` from this project, copy everything, and paste it in.
4. On line 6, change `SECRET` to a word of your own (for example `const SECRET = "my-secret-word";`).
5. Click **Save** (the disk icon).
6. In the function dropdown at the top, choose **setup**, then click **Run**. Allow the permissions Google asks for. This creates the tabs: Progress, Submissions, Roster, Settings, Not registered and Inactive.

**B. Publish it**
1. Click **Deploy > New deployment**, choose type **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**. ("Anyone" must be exactly this. "Anyone with Google account" blocks students.)
3. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
4. Open that URL in a private browser window. You should see `{"ok":true,"message":"CSAE 104 progress endpoint is running"}`. If you see a Google sign-in page, the access setting is wrong.

**C. Connect the site**
1. In this project, open `assets/config.js` and fill in:
   ```js
   window.CSAE_CONFIG = {
     endpoint: "PASTE THE WEB APP URL HERE",
     key: "THE SAME SECRET AS IN Code.gs",
     instructorGithub: "YOUR GITHUB ACCOUNT",
   };
   ```
2. Commit and push to GitHub. The change is live in about a minute.

**D. Fill in your class list**
1. Open the **Roster** tab and enter one student per row: **Name, Section, Student ID**.
2. Sections must be 3B, 3E, 3F or 3G. IDs must be the numbers students will type.
3. Names are shown in the same form you type here, so use a consistent style, such as `Surname, Given name`.

**E. Test it**
1. Open the site in a private window. The registration form should appear.
2. Register as a Roster student, open any lecture week, and wait a few seconds. A row should appear in the **Progress** tab.
3. Delete your test row afterwards if it was not a real student.

## 3. Your weekly routine

| When | Do this |
|---|---|
| Start of each week | Set **Current week** on the Settings tab. "Weeks behind" counts weeks up to this number |
| Early in the week | Open **Not registered** and message students who are still missing |
| Mid-week | Open **Inactive** (or look for red names in Progress) and follow up with students who have gone quiet |
| After a lab or checkpoint is due | Open **Submissions**, check the repo links, and enter scores |
| After grading | Tick **Released** so students can see their scores |

## 4. Reading each tab

**Progress**
- One row per registered student. Filter by the Section column to see one class.
- **Lecture %, Lab %, Quiz avg %** are averages across all 18 weeks, so they are low early in the semester. Use the per-week columns (K to AT) for the current week.
- **Weeks behind** counts weeks up to Current week where lecture or lab is below your threshold. Orange means behind.
- Red cells in the lecture, lab and per-week columns mean a value under 80%. This 80% is fixed in the colouring. The "Behind if below" setting only affects the Weeks behind count. A red **name or Updated** cell means the student is inactive.
- **Last active** is when the student last used the site. **Updated** is the last time their data reached the sheet.
- The last column, **Device ID**, locks each student to their device (section 6).

**Submissions**
- One row per student per item (a lab, a checkpoint, or the final project).
- **Repo link** and **Deployed site** are clickable. **Tag or folder** tells you where to look (for example `checkpoint-1`).
- **First submitted** shows when they first handed it in, which you can compare with your deadline. **Times** shows how often they re-submitted.

**Not registered:** Roster students with no row in Progress, with counts. It needs your Roster to be filled in.

**Inactive:** registered students with no sync for the number of days in Settings (default 7), with how many days it has been.

**Settings:** Current week, Behind-if-below percentage, and Inactive-after days.

## 5. Grading submissions

1. Open the **Submissions** tab and click a repo link.
2. Check the commit history (regular commits, dates), open the tag if one is given, and read or run the code.
3. In the same row, fill in:
   - **Score**: for example 85
   - **Out of**: for example 100 (optional)
   - **Feedback**: a short comment (optional)
4. When you are ready, tick **Released**. The student then sees it under **My progress > My scores**.

Tips:
- Grade first and release later, so no one sees a partial mark. To release a whole column at once, select the checkboxes and tick them together.
- Changing a score later updates it for the student the next time they open the page or press **Refresh my scores**.
- Quiz scores are shown to students automatically when they finish. The Submissions tab is for lab work and projects.
- A student who is not registered, or who submits from another device, is refused. They see a message to register or restore their backup first.

## 6. Managing students

| Situation | What to do |
|---|---|
| A student is not on your Roster | Add them to the Roster tab. They can register straight away |
| A student typed the wrong name | If you use the Roster with IDs, the name comes from your list, so there is nothing to fix. Otherwise delete their row in Progress and ask them to register again |
| A student typed the wrong ID | Delete their row in Progress and their Submissions rows, and ask them to register again with the right ID |
| A student gets a new phone or computer | Ask them to use **My progress > Use another device > Restore from backup** with the backup from the old device. If they have no backup, clear their **Device ID** cell (last column in Progress). They re-register, and their progress starts again on the new device |
| A student gets "already registered on another device" | The ID is bound to a different device. Clear the **Device ID** cell if it is the genuine student |
| A student wants to retake a quiz | Clear that week's quiz cell in Progress, and ask the student to clear the site's saved data (or use another browser) |
| A student drops the course | Delete their row in Progress and Submissions, and remove them from the Roster |
| Two sections share one sheet | That is fine. Filter by Section |

## 7. Updating the script

Whenever the script (`instructor/Code.gs`) changes:
1. Open **Extensions > Apps Script** and paste in the new code. Keep your own `SECRET` on line 6.
2. Click **Save**.
3. If the notes mention it, run **setup** again.
4. Click **Deploy > Manage deployments**, click the pencil icon, set **Version** to **New version**, and click **Deploy**. The URL stays the same. Without this step the old code keeps running.

## 8. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Opening the web app link shows a Google sign-in page | Access is not set to **Anyone**. Edit the deployment, set Anyone, choose New version, and Deploy |
| Students' progress never arrives | `endpoint` or `key` in `assets/config.js` is wrong or empty, or the change was not pushed. Check that `key` equals `SECRET` exactly |
| The web app answers `{"ok":false,"error":"key"}` | `SECRET` in the script and `key` in `config.js` differ |
| The registration form never appears | `endpoint` is empty, or the student is a registered device, or chose "I am not a student" (they are remembered) |
| "Not in the class list" | The student's ID or name is not on the Roster, or has a typo. Fix the Roster |
| "Already registered on another device" | See section 6. Clear the Device ID cell if genuine |
| "Weeks behind" shows `#REF!` | The **Settings** tab is missing, or the cell is stuck. Run **repairFormulas** from the Apps Script editor |
| "Not registered" or "Inactive" tabs are empty or show an error | Run **setup** again. The Roster tab must have names |
| A change to the script has no effect | You did not create a **New version** of the deployment (section 7) |
| A student sees no scores | The Released box is not ticked, no number is in Score, or the student has not registered on that device |
| New quiz scores do not appear | Scores are final once recorded. See section 6 to allow a retake |

## 9. End of semester

1. Export what you need: **File > Download > Comma-separated values** for the Progress and Submissions tabs.
2. Keep only what your school requires. Delete or archive the sheet when you no longer need it.
3. For a new semester, create a new sheet and a new deployment, update `assets/config.js`, and fill in the new Roster. Students' browsers can keep working because the new sheet registers them again.

## 10. Privacy checklist

- Share the sheet only with people who need it, and use the sheet's own sharing settings.
- Students are told what is collected, on the registration form, before they register.
- Notes and code are never sent. Only names, IDs, percentages, quiz scores, GitHub links and your scores are held.
- Do not post screenshots of the sheet or Roster in class chats.
- Check your school's requirements (the Data Privacy Act of 2012, Republic Act 10173) for how long you may keep student data.
