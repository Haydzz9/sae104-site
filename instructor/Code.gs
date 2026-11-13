/**
 * CSAE 104 progress collector (Google Apps Script).
 * Paste this into a script attached to your Google Sheet, then deploy it as a web app.
 * Full steps: instructor/google-sheet-setup.md
 */
const SECRET = "dragonballz";           // must match "key" in assets/config.js
const SECTIONS = ["3B", "3E", "3F", "3G"];
const WEEKS = 18;
const DATA = "Progress", SETTINGS = "Settings", ROSTER = "Roster";
// Columns: A Key | B Name | C Section | D Student ID | E Updated | F Last active | G Lecture % | H Lab % | I Quiz avg %
// J Weeks behind (formula) | K..AB lecture W1-18 | AC..AT lab W1-18 | AU..BL quiz W1-18 | BM raw JSON | BN device id
const COL = { lec: 11, lab: 11 + WEEKS, quiz: 11 + 2 * WEEKS, raw: 11 + 3 * WEEKS, cid: 12 + 3 * WEEKS };

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function num_(x) { x = Number(x); return isFinite(x) ? Math.max(0, Math.min(100, Math.round(x))) : 0; }
function str_(x, n) { return String(x == null ? "" : x).replace(/[\r\n]+/g, " ").trim().slice(0, n || 100); }
function avg_(a) { return a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length) : 0; }
// stop spreadsheet formulas being injected through names
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function doGet() { return out_({ ok: true, message: "CSAE 104 progress endpoint is running" }); }

function norm_(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }

// Optional class list: a sheet named "Roster" with Name | Section | Student ID (header row allowed).
// When it has names, only those names are accepted.
function roster_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ROSTER);
  if (!sh || sh.getLastRow() < 1) return [];
  const vals = sh.getRange(1, 1, sh.getLastRow(), 3).getValues();
  return vals.filter(function (r, i) { return String(r[0]).trim() && !(i === 0 && norm_(r[0]) === "name"); })
    .map(function (r) { return { name: str_(r[0]), section: str_(r[1], 5), id: str_(r[2], 30) }; });
}

// ---------- work submissions (GitHub links) ----------
const SUBS = "Submissions", NOTREG = "Not registered", INACTIVE = "Inactive";
function subsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SUBS);
  if (!sh) {
    sh = ss.insertSheet(SUBS);
    sh.getRange(1, 1, 1, 11).setValues([["Key", "Name", "Section", "Item", "Repo link", "Tag or folder", "Deployed site", "Note", "First submitted", "Last updated", "Times"]]).setFontWeight("bold").setBackground("#E8EDF3");
    sh.setFrozenRows(1); sh.hideColumns(1);
    sh.getRange("I:J").setNumberFormat("yyyy-mm-dd hh:mm");
    sh.setColumnWidth(2, 200); sh.setColumnWidth(5, 320); sh.setColumnWidth(7, 240); sh.setColumnWidth(8, 220);
  }
  // grading columns, filled in by the instructor: students only see a score when Released is ticked
  sh.getRange("L1:O1").setValues([["Score", "Out of", "Feedback", "Released"]]).setFontWeight("bold").setBackground("#DAF1EC");
  sh.setColumnWidth(14, 280);
  return sh;
}
function link_(u) { return u ? '=HYPERLINK("' + u + '","' + u + '")' : ""; }

// A student reads only their own released scores. The device must be the one that registered the ID.
function handleScores_(p) {
  const d = p.data || {};
  const cid = str_(d.clientId, 64);
  if (cid.length < 12) return out_({ ok: false, error: "client" });
  const who = resolve_(str_(d.name), "", d.id);
  if (who.error) return out_({ ok: false, error: who.error });
  const key = who.key;
  const pg = sheet_(), plast = pg.getLastRow();
  let registered = false;
  if (plast > 1) {
    const rows = pg.getRange(2, 1, plast - 1, COL.cid).getValues();
    for (let i = 0; i < rows.length; i++) if (rows[i][0] === key) { registered = String(rows[i][COL.cid - 1] || "") === cid; break; }
  }
  if (!registered) return out_({ ok: false, error: "unregistered" });
  const sh = subsSheet_(), last = sh.getLastRow(), items = [];
  if (last > 1) {
    sh.getRange(2, 1, last - 1, 15).getValues().forEach(function (r) {
      const score = Number(r[11]);
      if (r[0] === key && r[14] === true && r[11] !== "" && isFinite(score)) {
        const max = r[12] === "" ? null : Number(r[12]);
        items.push({ item: String(r[3]), score: score, max: isFinite(max) ? max : null, feedback: str_(r[13], 500) });
      }
    });
  }
  return out_({ ok: true, items: items });
}

function handleSubmission_(p) {
  const d = p.data || {};
  const cid = str_(d.clientId, 64);
  if (cid.length < 12) return out_({ ok: false, error: "client" });
  const item = str_(d.item, 12);
  if (!/^(lab(1[0-7]|[1-8])|cp[1-5]|final)$/.test(item)) return out_({ ok: false, error: "item" });
  const repo = str_(d.repo, 300);
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/[\w\/.%#~+-]*)?$/.test(repo)) return out_({ ok: false, error: "repo" });
  const deploy = str_(d.deploy, 300);
  if (deploy && !/^https:\/\/[\w.-]+(:\d+)?(\/[\w\/.%#~+?=&-]*)?$/.test(deploy)) return out_({ ok: false, error: "deploy" });
  const ref = str_(d.ref, 80), note = str_(d.note, 200);

  const who0 = resolve_(str_(d.name), "", d.id);
  if (who0.error) return out_({ ok: false, error: who0.error });
  const key = who0.key;

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    // the student must already be registered, and this must be the device that registered the name
    const pg = sheet_(), plast = pg.getLastRow();
    let who = null;
    if (plast > 1) {
      const rows = pg.getRange(2, 1, plast - 1, COL.cid).getValues();
      for (let i = 0; i < rows.length; i++) if (rows[i][0] === key) { who = { name: rows[i][1], section: rows[i][2], cid: String(rows[i][COL.cid - 1] || "") }; break; }
    }
    if (!who || !who.cid || who.cid !== cid) return out_({ ok: false, error: "unregistered" });

    const sh = subsSheet_(), last = sh.getLastRow();
    let row = 0;
    if (last > 1) { const ks = sh.getRange(2, 1, last - 1, 4).getValues(); for (let i = 0; i < ks.length; i++) if (ks[i][0] === key && ks[i][3] === item) { row = i + 2; break; } }
    const now = new Date();
    if (!row) {
      row = last + 1;
      sh.getRange(row, 1, 1, 4).setValues([[key, safe_(String(who.name)), who.section, item]]);
      sh.getRange(row, 9).setValue(now); sh.getRange(row, 11).setValue(1);
    } else sh.getRange(row, 11).setValue((Number(sh.getRange(row, 11).getValue()) || 1) + 1);
    sh.getRange(row, 5).setFormula(link_(repo));
    sh.getRange(row, 6).setValue(safe_(ref));
    sh.getRange(row, 7).setFormula(link_(deploy));
    sh.getRange(row, 8).setValue(safe_(note));
    sh.getRange(row, 10).setValue(now);
  } finally { lock.releaseLock(); }
  return out_({ ok: true });
}

function normId_(s) { return String(s || "").toLowerCase().replace(/\s+/g, ""); }

// Works out who a request is from. The student ID is required and is the unique key.
// With a Roster: IDs listed there must match; names listed without IDs are matched by name.
function resolve_(name, section, id) {
  id = str_(id, 30);
  const roster = roster_();
  if (roster.length) {
    const withIds = roster.filter(function (r) { return r.id; });
    let hit = null;
    if (id) hit = withIds.filter(function (r) { return normId_(r.id) === normId_(id); })[0] || null;
    if (!hit && !withIds.length) hit = roster.filter(function (r) { return norm_(r.name) === norm_(name); })[0] || null;
    if (!hit) return { error: id || !withIds.length ? "roster" : "id" };
    name = hit.name; section = hit.section || section; if (hit.id) id = hit.id;
  }
  if (!id || !/^[A-Za-z0-9][A-Za-z0-9 -]{2,29}$/.test(id)) return { error: "id" };
  if (!name) return { error: "student" };
  return { name: name, section: section, id: id, key: normId_(id) };
}

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    if (p.key !== SECRET) return out_({ ok: false, error: "key" });
    if (p.type === "submission") return handleSubmission_(p);
    if (p.type === "scores") return handleScores_(p);
    const d = p.data;
    if (!d || d.app !== "csae104-progress" || !d.student || !Array.isArray(d.weeks)) return out_({ ok: false, error: "format" });
    const cid = str_(d.clientId, 64);
    if (cid.length < 12) return out_({ ok: false, error: "client" });
    const who = resolve_(str_(d.student.name), str_(d.student.section, 5), d.student.id);
    if (who.error) return out_({ ok: false, error: who.error });
    const name = who.name, section = who.section, id = who.id;
    if (SECTIONS.indexOf(section) < 0) return out_({ ok: false, error: "student" });

    const lec = [], lab = [], quiz = [];
    for (let w = 1; w <= WEEKS; w++) {
      const x = d.weeks.filter(function (y) { return y.week === w; })[0] || {};
      lec.push(num_(x.lecture)); lab.push(num_(x.laboratory));
      quiz.push(x.quiz && x.quiz.total ? Math.max(0, Math.min(+x.quiz.total, +x.quiz.best || 0)) + "/" + (+x.quiz.total) : "");
    }
    const key = who.key;

    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      const sh = sheet_();
      const last = sh.getLastRow();
      let row = 0, cidRow = 0;
      if (last > 1) {
        const keys = sh.getRange(2, 1, last - 1, 1).getValues();
        const cids = sh.getRange(2, COL.cid, last - 1, 1).getValues();
        for (let i = 0; i < keys.length; i++) {
          if (keys[i][0] === key) row = i + 2;
          if (cids[i][0] === cid) cidRow = i + 2;
        }
      }
      // this device already belongs to a different student name: the name cannot be changed
      if (cidRow && cidRow !== row) return out_({ ok: false, error: "identity" });
      // this name was first claimed by another device
      if (row) { const owner = String(sh.getRange(row, COL.cid).getValue() || ""); if (owner && owner !== cid) return out_({ ok: false, error: "claimed" }); }

      const isNew = !row; if (isNew) row = last + 1;
      // each quiz counts once: a score already on the sheet is never replaced
      if (!isNew) { const oldQ = sh.getRange(row, COL.quiz, 1, WEEKS).getValues()[0]; for (let i = 0; i < WEEKS; i++) if (oldQ[i]) quiz[i] = String(oldQ[i]); }
      const qp = quiz.filter(String).map(function (q) { const a = q.split("/"); return Math.round((a[0] / a[1]) * 100); });
      sh.getRange(row, 1, 1, 9).setValues([[key, safe_(name), section, safe_(id), new Date(), d.lastActive ? new Date(d.lastActive) : "", avg_(lec), avg_(lab), avg_(qp)]]);
      sh.getRange(row, COL.lec, 1, WEEKS).setValues([lec]);
      sh.getRange(row, COL.lab, 1, WEEKS).setValues([lab]);
      sh.getRange(row, COL.quiz, 1, WEEKS).setValues([quiz]);
      sh.getRange(row, COL.raw).setValue(JSON.stringify(d).slice(0, 20000));
      sh.getRange(row, COL.cid).setValue(cid);
      if (!sh.getRange(1, COL.cid).getValue()) sh.getRange(1, COL.cid).setValue("Device ID (clear this cell to unlock the student)").setFontWeight("bold").setBackground("#E8EDF3");
      if (isNew) sh.getRange(row, 10).setFormula(behindFormula_(row));
    } finally { lock.releaseLock(); }
    return out_({ ok: true });
  } catch (err) { return out_({ ok: false, error: String(err) }); }
}

function colLetter_(n) { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function behindFormula_(r) {
  const l1 = colLetter_(COL.lec), l2 = colLetter_(COL.lec + WEEKS - 1), b1 = colLetter_(COL.lab), b2 = colLetter_(COL.lab + WEEKS - 1);
  return "=SUMPRODUCT((COLUMN(" + l1 + r + ":" + l2 + r + ")-COLUMN(" + l1 + r + ")+1<=INDIRECT(\"Settings!$B$1\"))*(((" + l1 + r + ":" + l2 + r + "<INDIRECT(\"Settings!$B$2\"))+(" + b1 + r + ":" + b2 + r + "<INDIRECT(\"Settings!$B$2\")))>0))";
}

function settings_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let st = ss.getSheetByName(SETTINGS);
  if (!st) {
    st = ss.insertSheet(SETTINGS);
    st.getRange("A1:C2").setValues([["Current week", 1, "Change this each week"], ["Behind if below %", 80, "Lecture or lab under this counts as behind"]]);
    st.getRange("A1:A2").setFontWeight("bold"); st.setColumnWidth(1, 160); st.setColumnWidth(3, 320);
  }
  if (!st.getRange("A3").getValue()) {
    st.getRange("A3:C3").setValues([["Inactive after (days)", 7, "No sync for this many days counts as inactive"]]);
    st.getRange("A3").setFontWeight("bold");
  }
  return st;
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  settings_();
  let sh = ss.getSheetByName(DATA);
  if (!sh) { sh = ss.insertSheet(DATA); setupHeaders_(sh); }
  return sh;
}
function setupHeaders_(sh) {
  const head = ["Key", "Name", "Section", "Student ID", "Updated", "Last active", "Lecture %", "Lab %", "Quiz avg %", "Weeks behind"];
  for (let w = 1; w <= WEEKS; w++) head.push("W" + w + " lecture %");
  for (let w = 1; w <= WEEKS; w++) head.push("W" + w + " lab %");
  for (let w = 1; w <= WEEKS; w++) head.push("W" + w + " quiz");
  head.push("Raw");
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight("bold").setBackground("#E8EDF3");
  sh.setFrozenRows(1); sh.setFrozenColumns(3);
  sh.hideColumns(1); sh.hideColumns(COL.raw);
  sh.getRange("E:F").setNumberFormat("yyyy-mm-dd hh:mm");
  sh.setColumnWidth(2, 220); sh.setColumnWidths(5, 2, 140);
}

// Roster students who have not registered yet (matched by name, which is taken from the Roster when a student registers).
function notRegisteredSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(NOTREG);
  if (!sh) {
    sh = ss.insertSheet(NOTREG);
    sh.getRange("A1:C1").setValues([["Name", "Section", "Student ID"]]).setFontWeight("bold").setBackground("#E8EDF3");
    sh.getRange("E1:E3").setValues([["Roster size"], ["Registered"], ["Not registered"]]).setFontWeight("bold");
    sh.setColumnWidth(1, 240); sh.setColumnWidth(5, 130);
  }
  sh.getRange("A2").setFormula('=IF(COUNTA(Roster!A2:A)=0, "Add your students to the Roster tab first", IFERROR(FILTER(Roster!A2:C, Roster!A2:A<>"", COUNTIF(Progress!B2:B, Roster!A2:A)=0), "Everyone on the Roster has registered"))');
  sh.getRange("F1").setFormula('=COUNTA(Roster!A2:A)');
  sh.getRange("F2").setFormula('=SUMPRODUCT((Roster!A2:A<>"")*(COUNTIF(Progress!B2:B, Roster!A2:A)>0))');
  sh.getRange("F3").setFormula('=F1-F2');
  return sh;
}

// Registered students with no sync for "Inactive after (days)" days (Settings sheet).
function inactiveSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(INACTIVE);
  if (!sh) {
    sh = ss.insertSheet(INACTIVE);
    sh.getRange("A1:E1").setValues([["Name", "Section", "Student ID", "Last sync", "Days inactive"]]).setFontWeight("bold").setBackground("#E8EDF3");
    sh.getRange("D:D").setNumberFormat("yyyy-mm-dd hh:mm"); sh.setColumnWidth(1, 240); sh.setColumnWidth(4, 150);
  }
  sh.getRange("A2").setFormula('=IFERROR(ARRAYFORMULA(FILTER({Progress!B2:B, Progress!C2:C, Progress!D2:D, Progress!E2:E, ROUND(TODAY()-Progress!E2:E)}, Progress!B2:B<>"", TODAY()-Progress!E2:E>INDIRECT("Settings!$B$3"))), "No inactive students")');
  return sh;
}

/** Rewrites the Weeks behind formula in every row. Run it if you ever see #REF! in that column. */
function repairFormulas() {
  settings_();
  const sh = sheet_(), last = sh.getLastRow();
  for (let r = 2; r <= last; r++) sh.getRange(r, 10).setFormula(behindFormula_(r));
  SpreadsheetApp.flush();
}

/** Run this once from the editor (Run > setup) to create the sheets and colouring. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  settings_();
  if (!ss.getSheetByName(ROSTER)) {
    const r = ss.insertSheet(ROSTER);
    r.getRange("A1:C1").setValues([["Name", "Section", "Student ID"]]).setFontWeight("bold").setBackground("#E8EDF3");
    r.getRange("E1").setValue("Optional. List your students here (Name, Section 3B/3E/3F/3G, Student ID). When this sheet has names, only these names can sync. Leave it empty to accept any name.");
  }
  const subs = subsSheet_();
  subs.getRange("O2:O1000").insertCheckboxes();
  let sh = ss.getSheetByName(DATA);
  if (!sh) { sh = ss.insertSheet(DATA); setupHeaders_(sh); }
  notRegisteredSheet_(); inactiveSheet_();
  const red = SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(80).setBackground("#FADAD7").setRanges([sh.getRange(2, 7, 500, 2), sh.getRange(2, COL.lec, 500, 2 * WEEKS)]).build();
  const late = SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThan(0).setBackground("#FBEBCF").setBold(true).setRanges([sh.getRange(2, 10, 500, 1)]).build();
  const idle = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($B2<>"", TODAY()-$E2>INDIRECT("Settings!$B$3"))').setBackground("#FADAD7").setRanges([sh.getRange(2, 2, 500, 1), sh.getRange(2, 5, 500, 1)]).build();
  sh.setConditionalFormatRules([red, late, idle]);
  repairFormulas();
}
