# CSAE 104 progress monitoring: system specification

Version 1.0, November 2026. Applies to the CSAE 104 course site (`csae104-site`) and its Google Sheet collector (`instructor/Code.gs`).

## 1. Purpose and scope

The course site is a static website. This system lets the instructor see how each student is doing and receive and score their lab work, without running a server.

It does five things:

1. **Registers** each student once (name, section, student ID).
2. **Tracks** reading progress, lab steps and quiz scores, and sends them to the instructor's Google Sheet.
3. **Collects** links to students' GitHub work (labs, project checkpoints, final project).
4. **Shows scores** to each student for work the instructor has graded and released.
5. **Flags** students who are behind, inactive or not yet registered.

Out of scope: logins with passwords, grading by the system itself, checking the contents of student repositories, and any storage of student code.

## 2. Architecture

```
  Student's browser                         Google (instructor's account)
 ┌──────────────────────────┐   HTTPS POST   ┌──────────────────────────┐
 │ csae104 site (GitHub     │ ─────────────► │ Apps Script web app      │
 │ Pages): HTML, JS, data   │ ◄───────────── │ (instructor/Code.gs)     │
 │ localStorage: progress,  │   JSON reply   │            │             │
 │ quiz answers, notes,     │                │            ▼             │
 │ device ID, student info  │                │ Google Sheet "CSAE 104   │
 └──────────────────────────┘                │ Progress" (6 tabs)       │
                                             └──────────────────────────┘
```

- The site has no server of its own. It is served from GitHub Pages.
- All progress is first saved in the student's browser (`localStorage`). The browser then sends a summary to the Apps Script web app, which writes it to the sheet.
- The sheet is the instructor's single view of the class. Only the instructor (the sheet owner) can open it.
- The web app is public at its URL, so every request is checked: a shared key, a valid student ID, and the device that registered that ID.

## 3. Components

| Component | Location | Role |
|---|---|---|
| Site pages and scripts | `index.html`, `lecture.html`, `laboratory.html`, `week.html`, `assets/app.js`, `assets/style.css` | Course content, progress tracking, forms |
| My progress page | `progress.html` | Student details, progress table, scores, work submission, backup, downloads |
| Configuration | `assets/config.js` | `endpoint`, `key`, `instructorGithub` |
| Collector script | `instructor/Code.gs` | Apps Script web app; writes the sheet; serves scores |
| Course data | `data/lecture.js`, `data/laboratory.js` | 18 weeks of lectures and labs (the progress units are derived from these) |

## 4. Roles

| Role | Can do |
|---|---|
| **Student** | Read content, take each quiz once, share progress, submit GitHub links, read their own released scores, back up and restore their data |
| **Guest** | Browse the site without registering. Nothing is sent or tracked |
| **Instructor** | Own the sheet and script; maintain the Roster; grade submissions; release scores; unlock students; see all data |

## 5. Data collected

| Data | Source | Where it is stored |
|---|---|---|
| Name, section, student ID | Entered by the student at registration (or taken from the Roster) | Progress sheet |
| Lecture progress per week (%) | Sections the student has viewed | Progress sheet |
| Lab progress per week (%) | Lab steps and checklist items ticked | Progress sheet |
| Quiz score per week | First and only attempt | Progress sheet |
| Last active and last sync time | Browser clock and sheet clock | Progress sheet |
| Device ID | Random 128-bit value created in the browser | Progress sheet (last column) |
| Raw copy of the progress summary | The request body | Progress sheet (hidden column BM) |
| Submitted work: item, GitHub link, tag, deployed link, note, times | Entered by the student | Submissions sheet |
| Scores and feedback | Entered by the instructor | Submissions sheet |

**Never collected:** the student's notes and typed answers, quiz answers (only the score), browsing history, passwords, IP addresses (the script does not read them), and any code. Quiz answers and notes stay in the student's browser.

## 6. Data model (Google Sheet tabs)

### 6.1 Progress (one row per registered student)

| Column | Content |
|---|---|
| A (hidden) | Key: the student ID in lowercase with spaces removed |
| B | Name (from the Roster when one exists) |
| C | Section: 3B, 3E, 3F or 3G |
| D | Student ID |
| E | Updated: time of the last sync |
| F | Last active: last time the student used the site |
| G | Lecture % (average over the 18 weeks) |
| H | Lab % (average over the 18 weeks) |
| I | Quiz average % (over quizzes taken) |
| J | Weeks behind (formula, section 7.6) |
| K to AB | Lecture % for Weeks 1 to 18 |
| AC to AT | Lab % for Weeks 1 to 18 |
| AU to BL | Quiz score per week, as the text `right/total` (the cells are plain text; Sheets would otherwise turn 5/5 into a date) |
| BM (hidden) | Raw summary as JSON |
| BN | Device ID. Clear this cell to unlock the student |

### 6.2 Submissions (one row per student per item)

| Column | Content |
|---|---|
| A (hidden) | Key (student) |
| B, C | Name, section |
| D | Item: `lab1` to `lab8`, `lab10` to `lab17`, `cp1` to `cp5`, `final` |
| E | GitHub repository link (clickable) |
| F | Tag or folder (for example `checkpoint-1`) |
| G | Deployed site link (clickable) |
| H | Note from the student |
| I, J | First submitted, last updated |
| K | Times sent |
| L | **Score** (instructor) |
| M | **Out of**. Filled in from the Grading tab by a formula; the instructor may type a different total for one row |
| N | **Feedback** (instructor, optional) |
| O | **Released** (checkbox, instructor) |

### 6.3 Roster (instructor)

Columns **Name, Section, Student ID**, one student per row. Optional. See section 7.1.

### 6.4 Settings (instructor)

| Cell | Setting | Default |
|---|---|---|
| B1 | Current week | 1 |
| B2 | Behind if below (%) | 80 |
| B3 | Inactive after (days) | 7 |

### 6.5 Grading (instructor)

One row per gradable item: **Item** (the code, for example `lab1`, `cp1`, `final`), **Name**, and **Out of** (total points, default 100). Each submission's **Out of** is looked up from here (`VLOOKUP` on the Item code), so the total is set once per item.

### 6.6 Not registered (formulas)

Roster students with no row in Progress, plus counts of Roster size, Registered and Not registered. Students are matched by name.

### 6.7 Inactive (formulas)

Registered students whose last sync is older than the Settings value, with the date and the days inactive.

## 7. Rules

### 7.1 Registration and identity

- The **student ID is required** and is the unique key. IDs are 3 to 30 characters: letters, digits, spaces and dashes, starting with a letter or digit.
- With a **Roster that lists IDs**, the ID must be on the list. The name and section are then taken from the list, so a typo in the name does not matter.
- With a **Roster of names only**, the name must match (ignoring capitals and extra spaces) and the student still enters an ID.
- With **no Roster**, any name and ID is accepted.
- Sections are limited to 3B, 3E, 3F and 3G.

### 7.2 Device binding (anti-impersonation)

- The first device to register a student ID owns that row.
- Another device cannot send data for that ID (`claimed`).
- A device that has registered one student cannot register or send as another (`identity`).
- After the first successful sync, the name, section and ID fields are read-only in the browser. If an account is locked but has no valid ID (created before the ID became required), the fields unlock so the student can add it.
- To move to a new device, the student restores a **backup**, which carries the device ID. If the old device is lost, the instructor clears the **Device ID** cell (column BN).

### 7.3 Progress calculation

- **Lecture %** for a week = sections viewed ÷ viewable sections. A section counts as viewed when it scrolls past a reading line on the page. Reaching the bottom marks the last section. Dividers and challenge sections are excluded.
- **Lab %** for a week = (steps ticked + checklist items ticked) ÷ (steps + checklist items). If a lab has none (for example the midterm), it falls back to sections viewed.
- **Quiz score** for a week = multiple-choice questions answered correctly, recorded when all multiple-choice questions are answered. Typed (open) questions are not scored.

### 7.4 Quizzes are taken once

- Each answer locks when chosen and stays locked after a reload.
- The first completed score is final. The sheet never replaces a score that is already there.
- "Reset my progress" does not clear quiz answers.
- To allow a retake, the instructor clears that week's quiz cell and the student clears the site's data (or uses another browser).

### 7.5 Syncing

- The browser sends a summary about 4 seconds after any change and when the site is opened. Anything not yet sent is sent again when the page is closed, hidden or left (using `sendBeacon`, with `fetch` as a fallback).
- A sync needs: sharing switched on (consent), a name, a section and a valid ID.
- A failed sync keeps data in the browser. It sends again on a later change.

### 7.6 Behind, inactive and not registered

- **Weeks behind** = the number of weeks up to **Current week** where lecture % or lab % is below **Behind if below**.
- **Inactive** = last sync older than **Inactive after (days)**. The name and Updated cells turn red in Progress.
- **Not registered** = on the Roster, no row in Progress.

### 7.7 Work submissions

- A student can submit only after registering, and only from the registered device.
- Items: `lab1` to `lab8`, `lab10` to `lab17` (no Lab 9, the midterm), `cp1` to `cp5` (project checkpoints), and `final`.
- The repository link must be `https://github.com/<user>/<repo>` (optionally with a path). Other sites and spreadsheet formulas are refused.
- The deployed link, when given, must start with `https://`.
- Submitting the same item again replaces the link. The first submission time is kept and the count goes up.

### 7.8 Scores

- The instructor enters **Score** (and optionally **Out of** and **Feedback**) and ticks **Released**.
- A student sees an item only when it has a numeric score and **Released** is ticked.
- Each item shows `score / out of` and a percentage when **Out of** is set. The page also shows a running **Total so far**, summed over the released items that have an **Out of**.
- A student can read only their own scores, and only from the device that registered their ID.

### 7.9 Registration form

- Shown on every page except My progress and the instructor page, until the student registers or chooses "I am not a student of this class".
- It cannot be closed with Esc. Guests are remembered and not asked again.
- Shown only when `endpoint` is set in `assets/config.js`.

## 8. Web app interface

**Endpoint:** the Apps Script web app URL (ends in `/exec`).

- `GET` returns `{"ok":true,"message":"CSAE 104 progress endpoint is running"}`.
- `POST` with `Content-Type: text/plain;charset=utf-8` and a JSON body. The browser reads the JSON reply.

All requests carry `"key"`, which must equal `SECRET` in `Code.gs`. Wrong key: `{"ok":false,"error":"key"}`.

### 8.1 Progress (default)

```json
{ "key": "...", "data": {
    "app": "csae104-progress", "version": 1, "exportedAt": "ISO time", "lastActive": "ISO time",
    "student": { "name": "...", "section": "3F", "id": "24-0001" },
    "weeks": [ { "week": 1, "lecture": 100, "laboratory": 40, "labDone": 6, "labTotal": 15, "quiz": { "best": 4, "total": 5 } } ],
    "clientId": "32 hex characters" } }
```
Reply: `{"ok":true}` or an error.

### 8.2 Submission

```json
{ "key": "...", "type": "submission",
  "data": { "clientId": "...", "name": "...", "id": "...", "item": "cp1",
            "repo": "https://github.com/user/repo", "ref": "checkpoint-1", "deploy": "", "note": "" } }
```

### 8.3 Scores

```json
{ "key": "...", "type": "scores", "data": { "clientId": "...", "name": "...", "id": "..." } }
```
Reply: `{"ok":true,"items":[{"item":"cp1","score":85,"max":100,"feedback":"..."}]}`

### 8.4 Error codes

| Code | Meaning |
|---|---|
| `key` | Wrong shared key |
| `format` | Body is not a valid progress summary |
| `client` | Missing or too-short device ID |
| `id` | Student ID missing or not valid (or not on a Roster that lists IDs) |
| `roster` | Name or ID is not on the Roster |
| `student` | Name missing or section not one of 3B, 3E, 3F, 3G |
| `identity` | This device is already registered under another student |
| `claimed` | This student ID was registered on another device |
| `unregistered` | The student has not registered yet, or the request came from another device |
| `item` | Submission item is not allowed |
| `repo` | Not a valid GitHub link |
| `deploy` | Deployed link must start with https:// |
| `network` | Browser-side only: the server could not be reached |

## 9. Browser storage

All keys are prefixed `csae104:` in `localStorage`.

| Key | Content |
|---|---|
| `prog:<lecture or laboratory>:<week>` | Sections seen and steps done |
| `quiz:lecture:<week>` | Final score `{best,total}` |
| `qpick:lecture:<week>` | Answers chosen (locks the quiz) |
| `note:...` | Typed answers (never sent) |
| `student`, `cid`, `locked`, `consent`, `guest` | Identity, device ID, registration state |
| `subs`, `scores` | Submissions made and the last scores received |
| `synced`, `syncerr`, `active`, `last`, `theme` | Sync status and preferences |

"Reset my progress" clears reading progress, lab steps and notes. It keeps the identity, consent and quiz keys.

## 10. Security and privacy

### 10.1 Threats and controls

| Threat | Control | Remaining risk |
|---|---|---|
| Someone posts fake data to the web app | Shared key; ID and Roster checks; device binding | The key is public (it is in the site's script). It deters, not secures |
| A student impersonates another | First device owns the ID; other devices refused | A student who knows a classmate's ID before that classmate registers could claim it. Use the Roster and ask students to register early |
| A student changes their name or ID | Fields lock after registration; the device cannot change identity | Clearing browser data gives a new device ID, so use the Roster |
| A student reads others' scores | Scores are returned only for the device that registered that ID | None known |
| Spreadsheet formula injection | Names, IDs, notes and links are validated or prefixed with a quote | None known |
| A student edits their own progress numbers | Not prevented | Progress is self-reported. Verify work through the GitHub repositories |
| Retaking a quiz | Answers lock; the sheet keeps the first score | A student can retake locally after clearing browser data, but the sheet keeps the first score |
| Cheating on quizzes | Not prevented | Quizzes are for practice. Use supervised exams for grades |

### 10.2 Privacy

- Collect only what is needed (section 5). Notes and code stay with the student.
- Students give consent on the registration form and are told what is sent.
- The sheet should be shared only with the instructor and any co-teacher.
- Do not keep the sheet longer than needed. At the end of the term, export what you need and delete or archive the sheet.
- This is a technical description, not legal advice. Check your school's data privacy officer and the Data Privacy Act of 2012 (Republic Act 10173) for retention and consent requirements.

## 11. Limits and constraints

- 18 weeks and four sections are fixed in `Code.gs` (`WEEKS`, `SECTIONS`) and `assets/app.js` (`SECTIONS`). Change both places to alter them.
- Google Apps Script has daily quotas on free accounts. A class-sized load is small, but if you ever see quota errors in the Apps Script executions page, spread the load or contact Google support.
- A sync is lost if the browser cannot reach Google (offline). It sends again on the next change.
- The sheet formulas (Weeks behind, Not registered, Inactive) recalculate in Google Sheets. They need the Settings and Roster tabs to exist.
- Student devices need JavaScript and a modern browser (Chrome, Edge, Firefox or Safari, recent versions).
- Progress that lives only in one browser is lost if its data is cleared, unless the student kept a backup.

## 12. Configuration and deployment

`assets/config.js`:

```js
window.CSAE_CONFIG = {
  endpoint: "https://script.google.com/macros/s/<deployment id>/exec",
  key: "<same value as SECRET in Code.gs>",
  instructorGithub: "<your GitHub account>",   // private-repo students add this account as a collaborator
};
```

- Leave `endpoint` empty to turn the whole system off. The site then behaves as a plain course site that saves progress in the browser only.
- Deploy `Code.gs` as a **Web app**: Execute as **Me**, access **Anyone**.
- After every script change, create a **new version** of the deployment (Deploy, Manage deployments, Edit, New version, Deploy), or the old code keeps running.
- See `docs/INSTRUCTOR-GUIDE.md` for the full steps.
