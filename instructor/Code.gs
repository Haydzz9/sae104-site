/**
 * CSAE 104 progress collector (Google Apps Script).
 * Paste this into a script attached to your Google Sheet, then deploy it as a web app.
 * Full steps: instructor/google-sheet-setup.md
 */
const SECRET = "change-this-secret";           // must match "key" in assets/config.js
const SECTIONS = ["3B", "3E", "3F", "3G"];
const WEEKS = 18;
const DATA = "Progress", SETTINGS = "Settings";
// Columns: A Key | B Name | C Section | D Student ID | E Updated | F Last active | G Lecture % | H Lab % | I Quiz avg %
// J Weeks behind (formula) | K..AB lecture W1-18 | AC..AT lab W1-18 | AU..BL quiz W1-18 | BM raw JSON
const COL = { lec: 11, lab: 11 + WEEKS, quiz: 11 + 2 * WEEKS, raw: 11 + 3 * WEEKS };

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function num_(x) { x = Number(x); return isFinite(x) ? Math.max(0, Math.min(100, Math.round(x))) : 0; }
function str_(x, n) { return String(x == null ? "" : x).replace(/[\r\n]+/g, " ").trim().slice(0, n || 100); }
function avg_(a) { return a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length) : 0; }
// stop spreadsheet formulas being injected through names
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function doGet() { return out_({ ok: true, message: "CSAE 104 progress endpoint is running" }); }

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    if (p.key !== SECRET) return out_({ ok: false, error: "key" });
    const d = p.data;
    if (!d || d.app !== "csae104-progress" || !d.student || !Array.isArray(d.weeks)) return out_({ ok: false, error: "format" });
    const name = str_(d.student.name), section = str_(d.student.section, 5), id = str_(d.student.id, 30);
    if (!name || SECTIONS.indexOf(section) < 0) return out_({ ok: false, error: "student" });

    const lec = [], lab = [], quiz = [];
    for (let w = 1; w <= WEEKS; w++) {
      const x = d.weeks.filter(function (y) { return y.week === w; })[0] || {};
      lec.push(num_(x.lecture)); lab.push(num_(x.laboratory));
      quiz.push(x.quiz && x.quiz.total ? Math.max(0, Math.min(+x.quiz.total, +x.quiz.best || 0)) + "/" + (+x.quiz.total) : "");
    }
    const qp = quiz.filter(String).map(function (q) { const a = q.split("/"); return Math.round((a[0] / a[1]) * 100); });
    const key = (name + "|" + id).toLowerCase();

    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      const sh = sheet_();
      const last = sh.getLastRow();
      let row = 0;
      if (last > 1) { const keys = sh.getRange(2, 1, last - 1, 1).getValues(); for (let i = 0; i < keys.length; i++) if (keys[i][0] === key) { row = i + 2; break; } }
      const isNew = !row; if (isNew) row = last + 1;
      sh.getRange(row, 1, 1, 9).setValues([[key, safe_(name), section, safe_(id), new Date(), d.lastActive ? new Date(d.lastActive) : "", avg_(lec), avg_(lab), avg_(qp)]]);
      sh.getRange(row, COL.lec, 1, WEEKS).setValues([lec]);
      sh.getRange(row, COL.lab, 1, WEEKS).setValues([lab]);
      sh.getRange(row, COL.quiz, 1, WEEKS).setValues([quiz]);
      sh.getRange(row, COL.raw).setValue(JSON.stringify(d).slice(0, 20000));
      if (isNew) sh.getRange(row, 10).setFormula(behindFormula_(row));
    } finally { lock.releaseLock(); }
    return out_({ ok: true });
  } catch (err) { return out_({ ok: false, error: String(err) }); }
}

function colLetter_(n) { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function behindFormula_(r) {
  const l1 = colLetter_(COL.lec), l2 = colLetter_(COL.lec + WEEKS - 1), b1 = colLetter_(COL.lab), b2 = colLetter_(COL.lab + WEEKS - 1);
  return "=SUMPRODUCT((COLUMN(" + l1 + r + ":" + l2 + r + ")-COLUMN(" + l1 + r + ")+1<=Settings!$B$1)*(((" + l1 + r + ":" + l2 + r + "<Settings!$B$2)+(" + b1 + r + ":" + b2 + r + "<Settings!$B$2))>0))";
}

function settings_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let st = ss.getSheetByName(SETTINGS);
  if (!st) {
    st = ss.insertSheet(SETTINGS);
    st.getRange("A1:C2").setValues([["Current week", 1, "Change this each week"], ["Behind if below %", 80, "Lecture or lab under this counts as behind"]]);
    st.getRange("A1:A2").setFontWeight("bold"); st.setColumnWidth(1, 160); st.setColumnWidth(3, 320);
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
  let sh = ss.getSheetByName(DATA);
  if (!sh) { sh = ss.insertSheet(DATA); setupHeaders_(sh); }
  const red = SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(80).setBackground("#FADAD7").setRanges([sh.getRange(2, 7, 500, 2), sh.getRange(2, COL.lec, 500, 2 * WEEKS)]).build();
  const late = SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThan(0).setBackground("#FBEBCF").setBold(true).setRanges([sh.getRange(2, 10, 500, 1)]).build();
  sh.setConditionalFormatRules([red, late]);
  repairFormulas();
}
