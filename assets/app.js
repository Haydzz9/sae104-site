/* CSAE 104 Web Programming — course site. No build step, no dependencies besides hljs.js. */
(function () {
  "use strict";
  const C = window.CSAE || {};
  const KINDS = {
    lecture: { label: "Lecture", req: "GET /lecture", other: "laboratory", file: "lecture.html",
      blurb: "Concepts, worked examples and quick checks for every week of the course." },
    laboratory: { label: "Laboratory", req: "GET /laboratory", other: "lecture", file: "laboratory.html",
      blurb: "Step-by-step builds with a checklist, so you always know what is left to do." },
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- storage (per device) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("csae104:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("csae104:" + k, JSON.stringify(v)); } catch (e) {} },
    clear() { try { Object.keys(localStorage).filter((k) => k.startsWith("csae104:") && !/:(theme|cid|student|locked|consent|syncerr|synced|subs)$|:(quiz|qpick):/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} },
  };

  /* ---------- theme ---------- */
  function applyTheme(t) { document.documentElement.setAttribute("data-theme", t); }
  function initTheme() {
    const saved = store.get("theme", null);
    applyTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }

  /* ---------- rich text: auto-format code-like words ---------- */
  const PLAIN_JS = /^(?:(?:Node|Express|React|Next|Vue)\.js|iLab|iPhone|iPad)$/i;
  const RICH = new RegExp([
    "(`[^`]+`)",
    "(https?:\\/\\/[^\\s)]+[^\\s).,;:])",
    "(\\b[A-Za-z_$][\\w$.]*\\((?:[^()]|\\([^()]*\\))*\\))",
    "(<\\/?[A-Za-z][\\w-]*(?:\\s[^<>]*)?>)",
    "((?<![\\w.])\\.env(?:\\.example)?\\b|\\b[\\w-]+\\.(?:html|css|jsx?|json|md|mjs)\\b)",
    "(\\blocalhost:\\d+(?:\\/[\\w\\/.:-]*)?)",
    "((?<=^|[\\s(\"'])\\/(?:[a-z][\\w-]*(?:\\.[\\w-]+)*|:\\w+)(?:\\/[\\w:.-]*)*)",
    "(\\b(?:req|res|app|process|document|window|console|JSON|Object|Array|mongoose|express|router|module|exports|bcrypt|jwt|Math|Promise)\\.[\\w$.]+)",
    "(\\b(?:npm|npx|git) (?:run [\\w:-]+|[a-z]+(?: -{1,2}\\w+)?))",
    "(\\b[a-z]+(?:[A-Z][a-z0-9]+)+\\b)",
    "(\\b[a-z0-9]+_[a-z0-9_]+\\b)",
  ].join("|"), "g");
  function rich(text, opts) {
    opts = opts || {};
    let out = "", last = 0, m;
    RICH.lastIndex = 0;
    while ((m = RICH.exec(text))) {
      const s = m[0];
      out += esc(text.slice(last, m.index));
      last = m.index + s.length;
      if (s[0] === "`") out += `<code>${esc(s.slice(1, -1))}</code>`;
      else if (PLAIN_JS.test(s) || /^\w+\(s\)$/.test(s)) out += esc(s);
      else if (opts.links && /^https?:/.test(s)) out += `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a>`;
      else out += `<code>${esc(s)}</code>`;
    }
    return (out + esc(text.slice(last))).replace(/\n/g, "<br>");
  }
  const segs = (item) => item.map(([t, b]) => (b ? `<strong>${rich(t)}</strong>` : rich(t))).join("");

  /* ---------- progress ---------- */
  const pkey = (t, w) => `prog:${t}:${w}`;
  const getP = (t, w) => store.get(pkey(t, w), { seen: [], done: [] });
  function units(week, t) {
    if (t === "laboratory") {
      const u = [];
      week.sections.forEach((s) => {
        if (s.kind === "step") u.push("step:" + s.id);
        if (s.kind === "checklist") (s.blocks || []).forEach((b) => b.k === "list" && b.items.forEach((_, i) => u.push(`cl:${s.id}:${i}`)));
      });
      if (u.length) return { ids: u, field: "done" };
    }
    return { ids: week.sections.filter((s) => s.kind !== "divider" && s.kind !== "challenge").map((s) => s.id), field: "seen" };
  }
  function progress(t, w) {
    const week = C[t].find((x) => x.week === w);
    const u = units(week, t), p = getP(t, w);
    const got = u.ids.filter((id) => p[u.field].includes(id)).length;
    const pct = u.ids.length ? Math.round((got / u.ids.length) * 100) : 0;
    return { pct, got, total: u.ids.length, state: pct >= 100 ? "done" : pct > 0 ? "part" : "none" };
  }
  const STATUS = { done: ["200 OK", "done"], part: ["206 Partial", "part"], none: ["Not started", ""] };

  /* ---------- shell ---------- */
  const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const ICON_THEME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg>';
  function header(kind) {
    return `<a class="skip" href="#main">Skip to content</a>
    <header class="top"><div class="wrap">
      <a class="brand" href="index.html"><b>CSAE 104</b><span>Web Programming</span></a>
      <nav class="nav" aria-label="Main">
        <a data-k="lecture" href="lecture.html" ${kind === "lecture" ? "aria-current=page" : ""}>Lecture</a>
        <a data-k="laboratory" href="laboratory.html" ${kind === "laboratory" ? "aria-current=page" : ""}>Laboratory</a>
        <a data-k="progress" href="progress.html" ${kind === "progress" ? "aria-current=page" : ""}>My progress</a>
      </nav>
      <button class="icon-btn" id="openSearch" type="button" aria-label="Search the course">${ICON_SEARCH}<span>Search</span><kbd>/</kbd></button>
      <button class="icon-btn" id="themeBtn" type="button" aria-label="Switch light or dark theme">${ICON_THEME}</button>
    </div></header>`;
  }
  function footer() {
    return `<footer class="site"><div class="wrap">
      <div>CSAE 104 Web Programming, College of Computer Science, DMMMSU-SLUC<br>Haydee D. Limson, MIS. 2nd Semester AY 2026-2027</div>
      <div>Your progress is saved in this browser. <a href="progress.html">Share or export it</a> for your instructor. <a href="guide.html">How it works</a>. <a href="teacher.html">Instructor view</a>. <button type="button" id="resetBtn">Reset my progress</button></div>
    </div></footer>
    <dialog class="search" id="searchDlg" aria-label="Search"><input id="searchIn" type="search" placeholder="Search lectures and labs, for example: middleware" autocomplete="off"><ul id="searchOut"></ul></dialog>`;
  }
  function wireShell() {
    $("#themeBtn").addEventListener("click", () => {
      const t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(t); store.set("theme", t);
    });
    $("#resetBtn").addEventListener("click", () => {
      if (confirm("Clear your reading progress, lab steps and notes on this device? Quiz answers are kept, because each quiz can only be taken once.")) { store.clear(); location.reload(); }
    });
    wireSearch();
  }

  /* ---------- search ---------- */
  let INDEX = null;
  function buildIndex() {
    INDEX = [];
    ["lecture", "laboratory"].forEach((t) => (C[t] || []).forEach((w) => {
      w.sections.forEach((s) => {
        const txt = (s.blocks || []).map((b) => b.k === "list" ? b.items.map((i) => i.map((x) => x[0]).join("")).join(" ") : b.k === "table" ? b.head.concat(...b.rows).join(" ") : b.k === "compare" ? [b.bad, b.good, b.badNote, b.goodNote].join(" ") : b.t || "").concat(s.extra || [], s.sub || "").join(" ");
        INDEX.push({ t, wk: w.week, wt: w.title, sid: s.id, title: s.title, text: txt });
      });
      if (w.syllabus) { const y = w.syllabus; INDEX.push({ t, wk: w.week, wt: w.title, sid: "syllabus", title: "Where this fits in the syllabus", text: [].concat(y.outcomes, y.topics[t], y.methods, y.resources, y.assessment, y.sdg.map((g) => g.goal + " " + g.link)).join(" ") }); }
      if (w.quiz.length) INDEX.push({ t, wk: w.week, wt: w.title, sid: "quiz", title: "Check your understanding", text: w.quiz.map((q) => q.q + " " + (q.options || []).join(" ")).join(" ") });
    }));
  }
  function wireSearch() {
    const dlg = $("#searchDlg"), inp = $("#searchIn"), out = $("#searchOut");
    const open = () => { if (!INDEX) buildIndex(); dlg.showModal(); inp.select(); run(); };
    $("#openSearch").addEventListener("click", open);
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !dlg.open) { e.preventDefault(); open(); }
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    inp.addEventListener("input", run);
    function run() {
      const q = inp.value.trim().toLowerCase();
      if (q.length < 2) { out.innerHTML = '<li class="empty">Type at least two letters. Search covers every lecture and lab.</li>'; return; }
      const terms = q.split(/\s+/);
      const hits = [];
      INDEX.forEach((it) => {
        const hay = (it.title + " " + it.wt + " " + it.text).toLowerCase();
        if (!terms.every((x) => hay.includes(x))) return;
        const inTitle = terms.every((x) => it.title.toLowerCase().includes(x));
        const inWeek = terms.every((x) => it.wt.toLowerCase().includes(x));
        hits.push({ it, score: (inTitle ? 10 : 0) + (inWeek ? 3 : 0) + (it.t === "lecture" ? 1 : 0) });
      });
      hits.sort((a, b) => b.score - a.score || a.it.wk - b.it.wk);
      if (!hits.length) { out.innerHTML = `<li class="empty">Nothing matches “${esc(inp.value)}”. Try a shorter word.</li>`; return; }
      const mk = (s) => terms.reduce((h, x) => h.replace(new RegExp("(" + x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"), esc(s));
      out.innerHTML = hits.slice(0, 30).map(({ it }) => {
        const i = it.text.toLowerCase().indexOf(terms[0]);
        const sn = i < 0 ? it.text.slice(0, 110) : (i > 40 ? "…" : "") + it.text.slice(Math.max(0, i - 40), i + 80) + "…";
        return `<li><a href="week.html?t=${it.t}&w=${it.wk}#${it.sid}"><small><i class="dot ${it.t}"></i>${KINDS[it.t].label}, week ${it.wk}</small><b>${mk(it.title)}</b><span>${mk(sn)}</span></a></li>`;
      }).join("");
    }
  }

  /* ---------- home ---------- */
  const PHASES = [
    [1, 3, "HTML and CSS foundation", "p1"],
    [4, 8, "The web, JavaScript, Node, Express and MongoDB Atlas (MERN)", "p2"],
    [9, 9, "Midterm", "p3"],
    [10, 15, "Supabase PostgreSQL (PERN), React and your API", "p4"],
    [16, 18, "Security, testing, deploy, demos", "p5"],
  ];
  function home() {
    const lec = C.lecture, lab = C.laboratory;
    const nq = lec.reduce((n, w) => n + w.quiz.length, 0);
    const ns = lab.reduce((n, w) => n + w.sections.filter((s) => s.kind === "step").length, 0);
    const last = store.get("last", null);
    const door = (k, cls, body) => `<a class="door ${cls}" href="${KINDS[k].file}">
        <div class="req">${KINDS[k].req.replace(" ", " <i>")}</i></div>
        <h2>${k === "lecture" ? "Read the ideas, then test yourself." : "Build it by following the steps."}</h2>
        <p>${KINDS[k].blurb}</p>
        <div class="res"><b>200 OK</b><br>${body}</div>
        <span class="go">Open the ${KINDS[k].label.toLowerCase()}</span></a>`;
    const bar = Array.from({ length: lec.length }, (_, i) => {
      const w = i + 1, p = PHASES.find((x) => w >= x[0] && w <= x[1]);
      return `<a class="${p[3]}" href="week.html?t=lecture&w=${w}" title="Week ${w}: ${esc(lec[i].title)}">${w}</a>`;
    }).join("");
    const legend = PHASES.map((p) => `<span style="--c:var(--${p[3]})">${p[0] === p[1] ? "Week " + p[0] : "Weeks " + p[0] + " to " + p[1]}: ${p[2]}</span>`).join("");
    return `<main id="main" class="wrap">
      <section class="intro">
        <h1>Web programming: from MERN to PERN</h1>
        <p>Eighteen weeks from your first HTML page to a deployed full-stack app. Each week has a lecture to read and a laboratory to build.</p>
        ${last ? `<a class="resume" href="week.html?t=${last.t}&w=${last.w}">Continue: ${KINDS[last.t].label}, week ${last.w}, ${esc(last.title)}</a>` : ""}
        <div class="doors">
          ${door("lecture", "lec", `${lec.length} weeks, ${lec[0].duration} each<br>${nq} quick-check questions`)}
          ${door("laboratory", "lab", `${lab.length} weeks, ${lab[0].duration} each<br>${ns} guided steps`)}
        </div>
      </section>
      <section class="phases" style="--p1:#2A3AA6;--p2:#0A7566;--p3:#A35F00;--p4:#7A3FA0;--p5:#B23A5C">
        <h2>The ${lec.length}-week route</h2>
        <p>Pick any week to open its lecture. Colours show how the course is organised.</p>
        <div class="bar">${bar}</div>
        <div class="legend">${legend}</div>
      </section>
    </main>`;
  }

  /* ---------- list pages ---------- */
  function list(kind) {
    const weeks = C[kind], K = KINDS[kind];
    const quiz = weeks.reduce((n, w) => n + w.quiz.length, 0);
    const steps = weeks.reduce((n, w) => n + w.sections.filter((s) => s.kind === "step").length, 0);
    const done = weeks.filter((w) => progress(kind, w.week).state === "done").length;
    const rows = weeks.map((w) => {
      const p = progress(kind, w.week), st = STATUS[p.state];
      return `<a class="net-row" href="week.html?t=${kind}&w=${w.week}">
        <span class="nm"><span class="wk">${String(w.week).padStart(2, "0")}</span><span class="tt">${esc(w.title)}<span class="fc">${esc(w.focus)}</span></span></span>
        <span class="st ${st[1]}">${st[0]}</span>
        <span class="sz">${w.sections.filter((s) => s.kind !== "divider").length} sections</span>
        <span class="tm">${esc(w.duration)}</span>
        <span class="meter" role="img" aria-label="${p.pct}% complete" style="--p:${p.pct}%"><i></i></span></a>`;
    }).join("");
    return `<div class="band"><div class="wrap">
        <h1 class="req">${K.req}</h1><p>${K.blurb}</p>
        <div class="meta"><span>200 OK</span><span>${weeks.length} weeks</span><span>${kind === "lecture" ? quiz + " quick checks" : steps + " guided steps"}</span><span>${done} of ${weeks.length} finished</span></div>
      </div></div>
      <main id="main" class="wrap">
        <div class="net" role="list">
          <div class="net-head" aria-hidden="true"><span>Name</span><span>Status</span><span>Content</span><span>Time</span><span>Progress</span></div>
          ${rows}
        </div>
        <p class="net-note">${kind === "lecture" ? "A week turns 200 OK after you have scrolled through every section." : "A week turns 200 OK after you have ticked every step and every item on the checklist."}</p>
      </main>`;
  }

  /* ---------- week page ---------- */
  const TAGS = { concept: "Concept", example: "Worked example", outcomes: "Learning outcomes", brief: "Lab brief", prepare: "Prepare", examday: "Exam day", catchup: "Catch-up", checklist: "Checklist", step: "Step", orient: "Orientation", challenge: "Finished early?" };
  const LANGS = { javascript: "JavaScript", xml: "HTML", css: "CSS", bash: "Terminal", json: "JSON", http: "HTTP", sql: "SQL", text: "Output" };

  function codeHTML(b) {
    let h;
    try { h = b.lang !== "text" && hljs.getLanguage(b.lang) ? hljs.highlight(b.t, { language: b.lang }).value : esc(b.t); } catch (e) { h = esc(b.t); }
    return `<div class="cb"><div class="cb-h"><span>${LANGS[b.lang] || "Code"}</span><button type="button" data-copy>Copy</button></div><pre tabindex="0"><code class="hljs">${h}</code></pre></div>${b.pv ? previewHTML(b) : ""}`;
  }
  /* Live "Rendered result" under a code block: b.pv is true (render b.t) or a string (render that instead). Scripts, forms and links are switched off. */
  const PV_IMG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#d9dee7"/><path d="M0 200l90-90 60 60 50-50 100 100z" fill="#b3bccb"/><circle cx="220" cy="55" r="20" fill="#f3f5f9"/></svg>');
  const PV_CSS = "body{font:16px/1.5 system-ui,Segoe UI,sans-serif;margin:14px;color:#111;background:#fff}img{max-width:100%;height:auto}a{pointer-events:none}";
  function previewHTML(b) {
    const src = (typeof b.pv === "string" ? b.pv : b.t).replace(/(<img\b[^>]*?\bsrc=")(?!data:|https?:)[^"]*"/g, `$1${PV_IMG}"`);
    const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${PV_CSS}</style></head><body>${src}</body></html>`;
    return `<div class="rv"><div class="rv-h"><span>Rendered result</span><em>Plain browser style, no CSS yet. Links are switched off here.</em></div><iframe class="rv-f" sandbox title="Rendered result of the code above" loading="lazy" srcdoc="${esc(doc)}" style="height:${b.ph || 150}px"></iframe></div>`;
  }
  function compareHTML(b) {
    const col = (cls, label, code, note) => `<div class="cmp-c ${cls}"><div class="cmp-h">${label}</div>${codeHTML({ t: code, lang: b.lang || "xml" })}<p>${rich(note)}</p></div>`;
    return `<div class="cmp">${col("bad", b.badLabel || "Avoid", b.bad, b.badNote)}${col("good", b.goodLabel || "Better", b.good, b.goodNote)}</div>`;
  }
  function blockHTML(b, s, t, w) {
    if (b.k === "code") return codeHTML(b);
    if (b.k === "compare") return compareHTML(b);
    if (b.k === "p") return `<p>${rich(b.t)}</p>`;
    if (b.k === "callout") return /:$/.test(b.t) && b.t.length < 90 ? `<p class="lead-in">${rich(b.t)}</p>` : `<p class="callout">${rich(b.t)}</p>`;
    if (b.k === "table") return `<div class="tw"><table><thead><tr>${b.head.map((h) => `<th>${rich(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${rich(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    if (b.k === "list") {
      if (s.kind === "checklist") {
        const p = getP(t, w.week);
        return `<ul class="checks">${b.items.map((it, i) => { const id = `cl:${s.id}:${i}`; return `<li><label><input type="checkbox" data-uid="${id}" ${p.done.includes(id) ? "checked" : ""}><span>${segs(it)}</span></label></li>`; }).join("")}</ul>`;
      }
      return `<ul>${b.items.map((it) => `<li>${segs(it)}</li>`).join("")}</ul>`;
    }
    return "";
  }
  function sectionHTML(s, t, w) {
    if (s.kind === "divider") return `<div class="divider" id="${s.id}" data-sec><h2>${rich(s.title)}</h2>${s.sub ? `<p>${rich(s.sub)}</p>` : ""}</div>`;
    const p = getP(t, w.week);
    const isStep = s.kind === "step", done = isStep && p.done.includes("step:" + s.id);
    const tag = isStep ? "" : s.kind === "outcomes" || s.kind === "challenge" || s.kind === "brief" || s.kind === "checklist" ? "" : `<span class="tag ${s.kind}">${TAGS[s.kind] || ""}</span>`;
    const head = `<div class="sec-h">${isStep ? `<span class="stepno" aria-label="Step ${s.step}">${s.step}</span>` : ""}<h2>${rich(s.title)}</h2>${tag}${isStep ? `<button class="mark" type="button" data-step="${s.id}" aria-pressed="${done}">${done ? "Done" : "Mark step done"}</button>` : ""}</div>`;
    const body = (s.blocks || []).map((b) => blockHTML(b, s, t, w)).join("");
    const expect = t === "laboratory" && (s.extra || []).every((x) => /^you (should|will) (see|get|have)/i.test(x));
    const extra = (s.extra || []).length ? `<aside class="note${expect ? " expect" : ""}"><b>${expect ? "What you should see" : "Instructor's note"}</b>${s.extra.map((x) => `<p>${rich(x)}</p>`).join("")}</aside>` : "";
    return `<section class="sec ${s.kind}${done ? " done" : ""}" id="${s.id}" data-sec>${head}${body}${extra}</section>`;
  }


  function syllabusHTML(w, t) {
    const y = w.syllabus; if (!y) return "";
    const ul = (arr) => `<ul>${arr.map((x) => `<li>${rich(x)}</li>`).join("")}</ul>`;
    return `<section class="sec syl" id="syllabus" data-sec>
      <div class="sec-h"><h2>Where this fits in the syllabus</h2><span class="tag">${esc(y.label)}</span></div>
      <dl class="syl-grid">
        <div><dt>Time</dt><dd>${esc(y.hours)}</dd></div>
        <div><dt>Learning outcomes</dt><dd><ol>${y.outcomes.map((x) => `<li>${rich(x)}</li>`).join("")}</ol>${y.outcomesNote ? `<p class="small">${esc(y.outcomesNote)}</p>` : ""}</dd></div>
        <div><dt>${t === "lecture" ? "Lecture topics" : "Laboratory topics"}</dt><dd>${ul(y.topics[t])}</dd></div>
        <div><dt>How you learn</dt><dd>${ul(y.methods)}</dd></div>
        <div><dt>Resources</dt><dd>${ul(y.resources)}</dd></div>
        <div><dt>How you are assessed</dt><dd>${ul(y.assessment)}</dd></div>
      </dl>
      <details class="sdg"><summary>Link to the Sustainable Development Goals</summary>
        ${y.sdg.map((g) => `<div class="sdg-i"><b>${esc(g.goal)}</b><p>${esc(g.target)}</p><p><em>${esc(g.link)}</em></p></div>`).join("")}
      </details>
      <p class="small">Source: CSAE 104 syllabus, 2nd Semester AY 2026-2027, Part III Learning Plan.</p>
    </section>`;
  }

  /* quiz */
  const shuffle = (n) => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function quizHTML(w, t) {
    let mc = 0;
    const items = w.quiz.map((q, qi) => {
      if (q.open) {
        const v = store.get(`note:${t}:${w.week}:${qi}`, "");
        return `<div class="q open"><p class="q-t">${rich(q.q)}</p><textarea data-note="${qi}" aria-label="Your answer" placeholder="Type your answer here">${esc(v)}</textarea><small>Saved on this device only. ${esc(q.hint || "")}</small></div>`;
      }
      const order = shuffle(q.options.length); mc++;
      return `<div class="q" data-q="${qi}" data-ans="${q.answer}"><p class="q-t">${rich(q.q)}</p><ul class="opts">${order.map((oi, pos) => `<li><button type="button" class="opt" data-oi="${oi}"><span class="ltr">${"ABCD"[pos]}</span><span>${rich(q.options[oi])}</span></button></li>`).join("")}</ul><p class="fb" aria-live="polite"></p></div>`;
    }).join("");
    const best = store.get(`quiz:${t}:${w.week}`, null);
    return `<section class="sec quiz-sec" id="quiz" data-sec><div class="quiz"><header><h2>Check your understanding</h2><span class="score" id="score">${mc ? (best ? `Your score: ${best.best}/${best.total}` : `${mc} multiple-choice questions`) : ""}</span></header>
      ${items}
      ${mc ? `<div class="qfoot"><p>You can take this quiz only once. Your answers are saved and your first score is the one that counts.</p></div>` : ""}</div></section>`;
  }
  function wireQuiz(w, t) {
    const root = $("#quiz"); if (!root) return;
    const total = w.quiz.filter((q) => !q.open).length;
    const pkey = `qpick:${t}:${w.week}`;
    const picks = store.get(pkey, {});
    let right = 0, answered = 0;
    const lock = (q, pick) => {
      const ans = +q.dataset.ans;
      $$(".opt", q).forEach((o) => { o.disabled = true; if (+o.dataset.oi === ans) o.classList.add("right"); });
      const fb = $(".fb", q), btn = $(`.opt[data-oi="${pick}"]`, q);
      if (pick === ans) { if (btn) btn.classList.add("right"); fb.textContent = "Correct."; fb.className = "fb ok"; right++; }
      else { if (btn) btn.classList.add("wrong"); fb.textContent = "Not quite. The correct choice is highlighted in green."; fb.className = "fb no"; }
      answered++;
    };
    const finish = () => {
      if (answered < total) { $("#score").textContent = `Score: ${right}/${answered} of ${total}`; return; }
      if (!store.get(`quiz:${t}:${w.week}`, null)) store.set(`quiz:${t}:${w.week}`, { best: right, total });
      store.set("active", new Date().toISOString()); scheduleSync();
      $("#score").textContent = `Final score: ${right}/${total}`;
    };
    // answers given earlier stay locked, so reloading the page cannot reset the quiz
    $$(".q[data-q]", root).forEach((q) => { if (picks[q.dataset.q] !== undefined) lock(q, +picks[q.dataset.q]); });
    if (answered) finish();
    root.addEventListener("click", (e) => {
      const btn = e.target.closest(".opt"); if (!btn || btn.disabled) return;
      const q = btn.closest(".q"); lock(q, +btn.dataset.oi);
      picks[q.dataset.q] = +btn.dataset.oi; store.set(pkey, picks);
      finish();
    });
    root.addEventListener("input", (e) => { if (e.target.dataset.note !== undefined) store.set(`note:${t}:${w.week}:${e.target.dataset.note}`, e.target.value); });
  }

  function weekPage(t, n) {
    const weeks = C[t], w = weeks.find((x) => x.week === n);
    const K = KINDS[t], O = KINDS[K.other];
    const prev = weeks.find((x) => x.week === n - 1), next = weeks.find((x) => x.week === n + 1);
    const hasRefs = w.refs.length > 0, hasQuiz = w.quiz.length > 0;
    const toc = w.sections.map((s) => {
      const lab = s.kind === "step" ? `Step ${s.step}: ${s.title}` : s.title;
      return `<li><a href="#${s.id}" data-t="${s.id}" class="${s.kind === "divider" ? "divl" : s.kind === "step" ? "sub" : ""}"><span>${esc(lab)}</span><span class="ck" aria-hidden="true">✓</span></a></li>`;
    }).join("") + (w.syllabus ? `<li><a href="#syllabus" data-t="syllabus"><span>Where this fits in the syllabus</span></a></li>` : "") + (hasQuiz ? `<li><a href="#quiz" data-t="quiz"><span>Check your understanding</span></a></li>` : "") + (hasRefs ? `<li><a href="#references" data-t="references"><span>References</span></a></li>` : "");
    const p = progress(t, n);
    const refs = hasRefs ? `<section class="sec refs" id="references" data-sec><div class="sec-h"><h2>References and suggested reading</h2></div>${w.refsIntro ? `<p>${rich(w.refsIntro)}</p>` : ""}<ol>${w.refs.map((r) => `<li>${rich(r, { links: true })}</li>`).join("")}</ol></section>` : "";
    return `<div class="whead"><div class="wrap">
        <div class="crumb"><a href="${K.file}">${K.req}</a> / week-${n}</div>
        <h1>${esc(w.title)}</h1>
        <p class="focus">${esc(w.focus)}</p>
        <div class="actions">
          <span class="pill">Week ${n} of ${weeks.length}</span><span class="pill">${esc(w.duration)}</span>
          ${w.decks ? w.decks.map((d) => `<a class="btn solid" href="${d.path}" download>${esc(d.label)} (.pptx)</a>`).join("") : w.pptx ? `<a class="btn solid" href="${w.pptx}" download>Download original slides (.pptx)</a>` : ""}
          <a class="btn" href="week.html?t=${K.other}&w=${n}">Open the ${O.label.toLowerCase()} for this week</a>
          <div class="wprog"><div class="meter" id="wmeter" style="--p:${p.pct}%"><i></i></div><span id="wpct">${p.pct}%</span></div>
        </div>
        ${w.pptxNote ? `<p class="pnote">${esc(w.pptxNote)}</p>` : !w.pptx ? `<p class="pnote">There is no slide deck for this week yet.</p>` : ""}</div></div>
      <div class="wrap layout">
        <nav class="toc" aria-label="On this page"><details id="tocd" open><summary>On this page</summary><ol>${toc}</ol></details></nav>
        <main id="main" class="content">
          ${w.sections.map((s) => sectionHTML(s, t, w)).join("")}
          ${syllabusHTML(w, t)}
          ${hasQuiz ? quizHTML(w, t) : ""}
          ${refs}
          <div class="pager">
            ${prev ? `<a href="week.html?t=${t}&w=${prev.week}"><small>Previous</small><b>Week ${prev.week}: ${esc(prev.title)}</b></a>` : "<span></span>"}
            ${next ? `<a class="nx" href="week.html?t=${t}&w=${next.week}"><small>Next</small><b>Week ${next.week}: ${esc(next.title)}</b></a>` : "<span></span>"}
            <a class="sw" href="week.html?t=${K.other}&w=${n}"><b>Go to the Week ${n} ${O.label.toLowerCase()}</b></a>
          </div>
        </main></div>`;
  }

  function wireWeek(t, n) {
    const w = C[t].find((x) => x.week === n), U = units(w, t);
    const upd = () => {
      const p = progress(t, n), P = getP(t, n);
      $("#wmeter").style.setProperty("--p", p.pct + "%"); $("#wpct").textContent = p.pct + "%";
      $$(".toc a[data-t]").forEach((a) => {
        const id = a.dataset.t, s = w.sections.find((x) => x.id === id);
        const dn = s && s.kind === "step" ? P.done.includes("step:" + id) : U.field === "seen" ? P.seen.includes(id) : false;
        a.classList.toggle("dn", !!dn);
      });
    };
    const mark = (field, id, on) => {
      store.set("active", new Date().toISOString()); scheduleSync();
      const P = getP(t, n), set = new Set(P[field]);
      on ? set.add(id) : set.delete(id); P[field] = Array.from(set); store.set(pkey(t, n), P); upd();
    };
    store.set("last", { t, w: n, title: w.title });

    document.addEventListener("click", (e) => {
      const c = e.target.closest("[data-copy]");
      if (c) {
        const txt = $("pre", c.closest(".cb")).textContent;
        const ok = () => { c.textContent = "Copied"; setTimeout(() => (c.textContent = "Copy"), 1400); };
        (navigator.clipboard ? navigator.clipboard.writeText(txt).then(ok, () => {}) : Promise.reject()).catch(() => {
          const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch (_) {} ta.remove();
        });
      }
      const m = e.target.closest("[data-step]");
      if (m) {
        const on = m.getAttribute("aria-pressed") !== "true";
        m.setAttribute("aria-pressed", on); m.textContent = on ? "Done" : "Mark step done";
        m.closest(".sec").classList.toggle("done", on); mark("done", "step:" + m.dataset.step, on);
      }
    });
    document.addEventListener("change", (e) => { if (e.target.dataset && e.target.dataset.uid) mark("done", e.target.dataset.uid, e.target.checked); });

    // scroll tracking: active TOC item + "seen" sections
    const links = new Map($$(".toc a[data-t]").map((a) => [a.dataset.t, a]));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      links.forEach((a) => a.classList.remove("on")); if (links.get(id)) links.get(id).classList.add("on");
      if (U.field === "seen" && id !== "quiz" && id !== "references") mark("seen", id, true);
    }), { rootMargin: "-30% 0px -60% 0px" });
    $$("[data-sec]").forEach((s) => io.observe(s));
    if (U.field === "seen") addEventListener("scroll", () => {
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 60) {
        const last = w.sections.filter((s) => s.kind !== "divider" && s.kind !== "challenge").pop(); if (last) mark("seen", last.id, true);
      }
    }, { passive: true });
    const d = $("#tocd"); if (innerWidth < 960) d.open = false;
    $$(".toc a").forEach((a) => a.addEventListener("click", () => { if (innerWidth < 960) d.open = false; }));
    wireQuiz(w, t); upd();
    if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) setTimeout(() => el.scrollIntoView(), 50); }
  }

  /* ---------- progress export (student) and class view (instructor) ---------- */
  const SECTIONS = ["3B", "3E", "3F", "3G"];
  const getStudent = () => store.get("student", { name: "", section: "", id: "" });
  function snapshot() {
    const n = C.lecture.length, weeks = [];
    for (let w = 1; w <= n; w++) {
      const l = progress("lecture", w), b = progress("laboratory", w), q = store.get(`quiz:lecture:${w}`, null);
      weeks.push({ week: w, lecture: l.pct, laboratory: b.pct, labDone: b.got, labTotal: b.total, quiz: q ? { best: q.best, total: q.total } : null });
    }
    return { app: "csae104-progress", version: 1, exportedAt: new Date().toISOString(), lastActive: store.get("active", null), student: getStudent(), weeks };
  }
  const avg = (a) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0);
  const quizAvg = (weeks) => avg(weeks.filter((x) => x.quiz && x.quiz.total).map((x) => Math.round((x.quiz.best / x.quiz.total) * 100)));
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const slugName = (s) => (s || "student").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student";
  const bar = (p) => `<span class="pbar"><span class="meter" style="--p:${p}%"><i></i></span><b>${p}%</b></span>`;

  /* ---------- optional live sync to the instructor's Google Sheet ---------- */
  const CFG = window.CSAE_CONFIG || {};
  const syncOn = () => !!CFG.endpoint;
  function deviceId() {
    let id = store.get("cid", "");
    if (!id) {
      try { id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join(""); }
      catch (e) { id = (Date.now().toString(16) + Math.random().toString(16).slice(2)).padEnd(24, "0"); }
      store.set("cid", id);
    }
    return id;
  }
  const SYNC_MSG = {
    claimed: "This name is already registered on another device. Ask your instructor to unlock it.",
    identity: "This device is registered under a different name, so the name cannot be changed. Ask your instructor if it is wrong.",
    roster: "Your name or student ID is not in the class list. Check your student ID number.",
    id: "Enter your student ID number (letters, numbers and dashes, at least 3 characters).",
    client: "Could not identify this device. Reload the page and try again.",
  };
  function syncReady() { const s = getStudent(); return syncOn() && store.get("consent", false) && s.name && s.section && s.id; }
  let syncTimer = null;
  function scheduleSync() { if (!syncReady() || store.get("syncerr", null)) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 4000); }
  async function syncNow(force) {
    if (!syncReady()) return { ok: false };
    clearTimeout(syncTimer);
    const body = JSON.stringify({ key: CFG.key || "", data: Object.assign(snapshot(), { clientId: deviceId() }) });
    const opts = { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, keepalive: body.length < 60000 };
    let res = null;
    try { res = await (await fetch(CFG.endpoint, opts)).json(); }
    catch (e) {
      try { await fetch(CFG.endpoint, Object.assign({}, opts, { mode: "no-cors" })); res = { ok: true, unconfirmed: true }; }
      catch (e2) { return { ok: false, error: "network" }; }
    }
    if (res && res.ok) { store.set("synced", new Date().toISOString()); store.set("syncerr", null); store.set("locked", true); return { ok: true }; }
    const err = (res && res.error) || "unknown";
    store.set("syncerr", SYNC_MSG[err] ? err : null);
    return { ok: false, error: err };
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && syncTimer) syncNow(); });

  /* ---------- registration gate: every student appears in the instructor's sheet ---------- */
  const ID_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{2,29}$/;
  function needsGate(page) { return syncOn() && page !== "progress" && page !== "teacher" && page !== "guide" && !store.get("locked", false) && !store.get("guest", false); }
  function showGate() {
    if ($("#gateDlg")) return;
    const s = getStudent();
    const d = document.createElement("dialog"); d.className = "gate"; d.id = "gateDlg"; d.setAttribute("aria-labelledby", "gateTitle");
    d.innerHTML = `<form id="gateForm" autocomplete="off">
      <h2 id="gateTitle">Register for CSAE 104</h2>
      <p>Students of this course register once, so your instructor can see your progress and receive your lab work. It takes a minute.</p>
      <label>Full name<input id="gName" required value="${esc(s.name)}" placeholder="Surname, Given name"></label>
      <label>Section<select id="gSec" required><option value="">Choose</option>${SECTIONS.map((x) => `<option ${s.section === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label>Student ID number<input id="gId" required minlength="3" maxlength="30" pattern="[A-Za-z0-9][A-Za-z0-9 \\-]{2,29}" value="${esc(s.id)}" placeholder="Your student ID number"></label>
      <label class="chk"><input type="checkbox" id="gOk" required><span>I agree that my name, section, student ID, reading and lab progress and quiz scores are sent to my instructor for this course. My notes are never sent. Once registered, my name and ID cannot be changed.</span></label>
      <p class="small gmsg" id="gMsg" role="status"></p>
      <div class="gbtns"><button class="btn solid" type="submit" id="gGo">Register</button>
      <button class="btn" type="button" id="gGuest">I am not a student of this class</button></div>
      <p class="small">Already registered on another device? <a href="progress.html#device">Restore from your backup</a>.</p>
    </form>`;
    document.body.appendChild(d);
    d.addEventListener("cancel", (e) => e.preventDefault());
    const msg = (t, bad) => { const m = $("#gMsg"); m.textContent = t; m.style.color = bad ? "var(--bad)" : ""; };
    $("#gGuest").addEventListener("click", () => { store.set("guest", true); d.close(); d.remove(); });
    $("#gateForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = { name: $("#gName").value.trim(), section: $("#gSec").value, id: $("#gId").value.trim() };
      if (!v.name || !v.section || !ID_RE.test(v.id)) { msg(SYNC_MSG.id, true); return; }
      if (!$("#gOk").checked) { msg("Please tick the box to agree.", true); return; }
      $("#gGo").disabled = true; msg("Registering...");
      store.set("student", v); store.set("consent", true); store.set("syncerr", null);
      const r = await syncNow();
      $("#gGo").disabled = false;
      if (r.ok) { d.close(); d.remove(); return; }
      store.set("consent", false);
      msg(r.error === "network" ? "Could not reach the server. Check your internet and try again." : (SYNC_MSG[r.error] || "Could not register. Tell your instructor."), true);
    });
    try { d.showModal(); } catch (err) { d.setAttribute("open", ""); }
    $("#gName").focus();
  }

  /* ---------- submit work (GitHub links) ---------- */
  const SUB_ITEMS = () => {
    const labs = (C.laboratory || []).filter((w) => w.week <= 17 && w.week !== 9).map((w) => ({ id: "lab" + w.week, label: `Lab ${w.week}: ${w.title}` }));
    const cps = [[1, 6, "Notices API"], [2, 8, "persistent notices API"], [3, 11, "Notices API on PostgreSQL"], [4, 16, "authenticated Notices Board"], [5, 17, "deployed application URL"]]
      .map(([n, w, t]) => ({ id: "cp" + n, label: `Project Checkpoint ${n} (Week ${w}): ${t}` }));
    return [...cps, ...labs, { id: "final", label: "Final project: Campus Notices Board (Week 18)" }];
  };
  const GH_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/[\w\/.%#~+-]*)?$/;
  const DEPLOY_RE = /^https:\/\/[\w.-]+(:\d+)?(\/[\w\/.%#~+?=&-]*)?$/;
  const SUB_MSG = Object.assign({
    item: "Choose what you are submitting.", repo: "Use your GitHub link, for example https://github.com/your-name/csae104-notices-board.",
    deploy: "The deployed site must start with https://.", unregistered: "Share your progress first (tick the box and click Send my progress now), then submit.",
  }, SYNC_MSG);
  async function submitWork(f) {
    const s = getStudent();
    const body = JSON.stringify({ key: CFG.key || "", type: "submission", data: { clientId: deviceId(), name: s.name, id: s.id, item: f.item, repo: f.repo, ref: f.ref, deploy: f.deploy, note: f.note } });
    let res;
    try { res = await (await fetch(CFG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body })).json(); }
    catch (e) { return { ok: false, error: "network" }; }
    if (res && res.ok) { const all = store.get("subs", {}); all[f.item] = { repo: f.repo, ref: f.ref, deploy: f.deploy, at: new Date().toISOString() }; store.set("subs", all); }
    return res || { ok: false, error: "unknown" };
  }
  function submitCard() {
    if (!syncOn()) return "";
    const done = store.get("subs", {}), items = SUB_ITEMS();
    const owner = CFG.instructorGithub ? ` If your repository is private, add <b>${esc(CFG.instructorGithub)}</b> as a collaborator on GitHub so your instructor can open it.` : "";
    const list = items.filter((i) => done[i.id]).map((i) => `<li><b>${esc(i.label)}</b><br><a href="${esc(done[i.id].repo)}" target="_blank" rel="noopener">${esc(done[i.id].repo)}</a> <small>sent ${new Date(done[i.id].at).toLocaleString()}</small></li>`).join("");
    return `<section class="card submit" id="submit"><h2>Submit my work</h2>
      <p class="small">Keep your whole project in one GitHub repository, with one folder for each lab. For a project checkpoint, tag the commit (for example <code>git tag checkpoint-1</code> then <code>git push --tags</code>) and put the tag name below.${owner}</p>
      <form id="subForm" class="sform" autocomplete="off">
        <label>What are you submitting?<select id="subItem" required><option value="">Choose</option>${items.map((i) => `<option value="${i.id}">${esc(i.label)}</option>`).join("")}</select></label>
        <label>GitHub repository link<input id="subRepo" type="url" required placeholder="https://github.com/your-name/csae104-notices-board"></label>
        <label>Tag or folder (optional)<input id="subRef" maxlength="80" placeholder="checkpoint-1 or week-06"></label>
        <label>Deployed site (Weeks 15 and 17)<input id="subDeploy" type="url" placeholder="https://..."></label>
        <label>Note to instructor (optional)<input id="subNote" maxlength="200"></label>
        <button class="btn solid" type="submit">Submit</button>
      </form>
      <p class="small" id="subMsg" role="status"></p>
      ${list ? `<h3>Already submitted</h3><ul class="sublist">${list}</ul>` : ""}</section>`;
  }
  function wireSubmit() {
    const f = $("#subForm"); if (!f) return;
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const m = $("#subMsg"), v = { item: $("#subItem").value, repo: $("#subRepo").value.trim(), ref: $("#subRef").value.trim(), deploy: $("#subDeploy").value.trim(), note: $("#subNote").value.trim() };
      const bad = !v.item ? "item" : !GH_RE.test(v.repo) ? "repo" : v.deploy && !DEPLOY_RE.test(v.deploy) ? "deploy" : null;
      if (bad) { m.textContent = SUB_MSG[bad]; m.style.color = "var(--bad)"; return; }
      if (!store.get("locked", false)) { m.textContent = SUB_MSG.unregistered; m.style.color = "var(--bad)"; return; }
      m.style.color = ""; m.textContent = "Sending...";
      const r = await submitWork(v);
      if (r.ok) { m.textContent = "Submitted. You can submit again to replace it."; setTimeout(() => location.reload(), 900); }
      else { m.style.color = "var(--bad)"; m.textContent = r.error === "network" ? "Could not reach the server. Check your internet and try again." : (SUB_MSG[r.error] || "Could not submit. Tell your instructor."); }
    });
  }

  /* ---------- move progress to another device ---------- */
  const BACKUP_KEY = /^(prog:|quiz:|qpick:|note:)/;
  const BACKUP_ONE = new Set(["student", "cid", "locked", "consent", "subs", "synced", "active"]);
  function makeBackup() {
    const data = {};
    try { Object.keys(localStorage).filter((k) => k.startsWith("csae104:")).forEach((k) => { const n = k.slice(8); if (BACKUP_KEY.test(n) || BACKUP_ONE.has(n)) data[n] = JSON.parse(localStorage.getItem(k)); }); } catch (e) {}
    return { app: "csae104-backup", version: 1, createdAt: new Date().toISOString(), data };
  }
  // merge a backup into this device: never lose progress that is already here
  function restoreBackup(b) {
    if (!b || b.app !== "csae104-backup" || !b.data || typeof b.data !== "object") throw new Error("not a backup");
    let n = 0;
    for (const [k, v] of Object.entries(b.data)) {
      if (!(BACKUP_KEY.test(k) || BACKUP_ONE.has(k))) continue;
      if (k.startsWith("prog:") && v && Array.isArray(v.seen) && Array.isArray(v.done)) {
        const cur = store.get(k, { seen: [], done: [] });
        store.set(k, { seen: [...new Set([...cur.seen, ...v.seen.map(String)])], done: [...new Set([...cur.done, ...v.done.map(String)])] }); n++;
      } else if (k.startsWith("quiz:") && v && Number.isFinite(v.best) && Number.isFinite(v.total)) {
        if (!store.get(k, null)) store.set(k, { best: v.best, total: v.total }); n++;
      } else if (k.startsWith("qpick:") && v && typeof v === "object") {
        store.set(k, Object.assign({}, v, store.get(k, {}))); n++;
      } else if (k.startsWith("note:") && typeof v === "string") { if (!store.get(k, "")) store.set(k, v); n++; }
      else if (k === "subs" && v && typeof v === "object") store.set(k, Object.assign({}, v, store.get("subs", {})));
      else if (k === "student" && v && typeof v === "object") store.set(k, { name: String(v.name || ""), section: String(v.section || ""), id: String(v.id || "") });
      else if (["cid", "synced", "active"].includes(k) && typeof v === "string") store.set(k, v);
      else if (["locked", "consent"].includes(k)) store.set(k, !!v);
    }
    return n;
  }
  function deviceCard() {
    return `<section class="card" id="device"><h2>Use another device</h2>
      <p class="small">Your progress is saved on this device. To continue on a phone or another computer, download a backup here, then open this page on the other device and choose <b>Restore from backup</b>. Restoring adds to what is already there. It never removes progress.</p>
      <div class="pactions"><button class="btn" type="button" id="bkDl">Download backup</button>
      <label class="btn fbtn">Restore from backup<input id="bkUp" type="file" accept=".json,application/json" hidden></label></div>
      <p class="small" id="bkMsg" role="status"></p></section>`;
  }
  function wireDevice() {
    const m = $("#bkMsg"); if (!m) return;
    $("#bkDl").addEventListener("click", () => {
      const s = getStudent(); download(`csae104-backup-${slugName(s.name)}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(makeBackup(), null, 2), "application/json");
      m.style.color = ""; m.textContent = "Backup downloaded. Keep it private: it holds your progress and your identity for this course.";
    });
    $("#bkUp").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const b = JSON.parse(await f.text());
        if (!confirm("Restore this backup on this device? Your progress here is kept and the backup is added to it.")) { e.target.value = ""; return; }
        const n = restoreBackup(b);
        m.style.color = ""; m.textContent = `Restored ${n} saved items. Reloading...`; setTimeout(() => location.reload(), 700);
      } catch (err) { m.style.color = "var(--bad)"; m.textContent = "That file is not a CSAE 104 backup."; }
      e.target.value = "";
    });
  }

  /* ---------- my scores (released by the instructor) ---------- */
  function scoresCard() {
    if (!syncOn()) return "";
    return `<section class="card" id="scores"><h2>My scores</h2>
      <p class="small" id="scState">Loading...</p><div id="scList"></div>
      <div class="pactions"><button class="btn" type="button" id="scRefresh">Refresh my scores</button></div></section>`;
  }
  function drawScores(items, at) {
    const labels = Object.fromEntries(SUB_ITEMS().map((i) => [i.id, i.label]));
    const order = SUB_ITEMS().map((i) => i.id);
    items = items.slice().sort((a, b) => order.indexOf(a.item) - order.indexOf(b.item));
    $("#scState").textContent = items.length ? `Updated ${new Date(at).toLocaleString()}` : "No scores have been released yet. Your instructor posts them after checking your work.";
    const gt = items.filter((i) => i.max), sum = gt.reduce((a, i) => a + i.score, 0), tot = gt.reduce((a, i) => a + i.max, 0);
    $("#scList").innerHTML = items.length ? `${tot ? `<p class="sctotal">Total so far: <b>${esc(sum)} / ${esc(tot)}</b> <small>${Math.round((sum / tot) * 100)}%</small></p>` : ""}<div class="tscroll"><table class="ttable"><thead><tr><th>Work</th><th>Score</th><th>Feedback</th></tr></thead><tbody>${items.map((i) => {
      const pct = i.max ? Math.round((i.score / i.max) * 100) : null;
      return `<tr><td>${esc(labels[i.item] || i.item)}</td><td><b>${esc(i.score)}${i.max ? " / " + esc(i.max) : ""}</b>${pct !== null ? ` <small>${pct}%</small>` : ""}</td><td>${esc(i.feedback || "")}</td></tr>`;
    }).join("")}</tbody></table></div>` : "";
  }
  async function loadScores() {
    const st = $("#scState"); if (!st) return;
    const cached = store.get("scores", null); if (cached) drawScores(cached.items, cached.at);
    if (!store.get("locked", false)) { if (!cached) st.textContent = "Register and share your progress first. Your scores appear here after your instructor releases them."; return; }
    const s = getStudent();
    if (!ID_RE.test(s.id || "")) { st.textContent = "Your student ID is missing. Enter it in the box at the top of this page, then press Send my progress now."; return; }
    st.textContent = cached ? st.textContent + " (checking for updates...)" : "Loading...";
    try {
      const res = await (await fetch(CFG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: CFG.key || "", type: "scores", data: { clientId: deviceId(), name: s.name, id: s.id } }) })).json();
      if (res && res.ok) { const at = new Date().toISOString(); store.set("scores", { items: res.items, at }); drawScores(res.items, at); }
      else st.textContent = (res && SYNC_MSG[res.error]) || (res && res.error === "unregistered" ? "Share your progress first, then your scores can load." : "Could not load your scores. Try again later.");
    } catch (e) { st.textContent = cached ? "Could not reach the server. Showing the scores saved on this device." : "Could not reach the server. Check your internet and try again."; }
  }

  function progressPage() {
    const s = getStudent(), snap = snapshot(), noId = !ID_RE.test(s.id || ""), lk = syncOn() && store.get("locked", false) && !noId;
    const rows = snap.weeks.map((x) => {
      const w = C.lecture[x.week - 1];
      return `<div class="net-row prow"><span class="nm"><span class="wk">${String(x.week).padStart(2, "0")}</span><span class="tt">${esc(w.title)}</span></span>
        <span data-l="Lecture">${bar(x.lecture)}</span><span data-l="Laboratory">${bar(x.laboratory)}</span><span data-l="Quiz">${x.quiz ? `${x.quiz.best}/${x.quiz.total}` : "-"}</span></div>`;
    }).join("");
    return `<main id="main" class="wrap pg">
      <section class="intro"><h1>My progress</h1>
      <p>This page shows what you have finished on this device. Fill in your details, download your progress file, and submit it on Google Classroom so your instructor can see how you are doing.</p></section>
      <form class="card sform" id="studentForm" autocomplete="off">
        <label>Full name<input id="stName" value="${esc(s.name)}" ${lk ? "readonly" : ""} required placeholder="Surname, Given name"></label>
        <label>Section<select id="stSec" ${lk ? "disabled" : ""}><option value="">Choose</option>${SECTIONS.map((x) => `<option ${s.section === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <label>Student ID number<input id="stId" value="${esc(s.id)}" ${lk ? "readonly" : ""} required minlength="3" maxlength="30" pattern="[A-Za-z0-9][A-Za-z0-9 \\-]{2,29}" placeholder="Your student ID number"></label>
      </form>
      ${syncOn() && store.get("locked", false) && noId ? `<p class="small lockmsg" style="color:var(--bad)">Your account was created before the student ID was required. Enter your student ID number above, then press <b>Send my progress now</b>.</p>` : ""}
      ${lk ? `<p class="small lockmsg">Your name, section and ID are locked because your progress is shared with your instructor. If something is wrong, ask your instructor to unlock it.</p>` : ""}
      ${syncOn() ? `<div class="card consent"><label class="chk"><input type="checkbox" id="stConsent" ${store.get("consent", false) ? "checked" : ""}><span><b>Share my progress with my instructor.</b> My name, section, student ID (if given), percentages and quiz scores are sent to a Google Sheet that only my instructor reads. My notes are never sent. I can untick this any time.</span></label><p class="small" id="syncState"></p><button class="btn" type="button" id="syncNow">Send my progress now</button></div>` : ""}
      <div class="sums">
        <div class="card"><b id="sumL">${avg(snap.weeks.map((x) => x.lecture))}%</b><span>Lectures read</span></div>
        <div class="card"><b id="sumB">${avg(snap.weeks.map((x) => x.laboratory))}%</b><span>Lab steps done</span></div>
        <div class="card"><b id="sumQ">${quizAvg(snap.weeks)}%</b><span>Average best quiz score</span></div>
      </div>
      <div class="net"><div class="net-head prow"><span>Week</span><span>Lecture</span><span>Laboratory</span><span>Quiz</span></div>${rows}</div>
      ${scoresCard()}
      ${submitCard()}
      ${deviceCard()}
      <div class="pactions">
        <button class="btn solid" type="button" id="dlJson">Download my progress file</button>
        <button class="btn" type="button" id="dlCsv">Download as CSV</button>
        <button class="btn" type="button" id="prn">Print or save as PDF</button>
      </div>
      <p class="net-note" id="pmsg" role="status">Your name, section and student ID number are required before you download. The file contains only your name, section, student ID, and your percentages and quiz scores. It does not contain your notes. Your instructor asks you to submit the file on Google Classroom.</p>
    </main>`;
  }
  function wireProgress() {
    const save = () => store.set("student", { name: $("#stName").value.trim(), section: $("#stSec").value, id: $("#stId").value.trim() });
    $$("#studentForm input,#studentForm select").forEach((e) => e.addEventListener("input", save));
    $("#studentForm").addEventListener("submit", (e) => e.preventDefault());
    const ready = () => {
      save(); const s = getStudent();
      if (!s.name || !s.section || !/^[A-Za-z0-9][A-Za-z0-9 -]{2,29}$/.test(s.id || "")) { $("#pmsg").textContent = "Please enter your full name, choose your section and enter your student ID number first."; $("#pmsg").style.color = "var(--bad)"; $("#stName").focus(); return null; }
      $("#pmsg").style.color = ""; $("#pmsg").textContent = "Downloaded. Now submit the file on Google Classroom. Download a new file whenever your instructor asks for an update.";
      return snapshot();
    };
    $("#dlJson").addEventListener("click", () => { const d = ready(); if (d) download(`csae104-${slugName(d.student.name)}-${d.exportedAt.slice(0, 10)}.json`, JSON.stringify(d, null, 2), "application/json"); });
    $("#dlCsv").addEventListener("click", () => { const d = ready(); if (d) download(`csae104-${slugName(d.student.name)}-${d.exportedAt.slice(0, 10)}.csv`, csv([d]), "text/csv"); });
    wireSubmit();
    if (syncOn()) { loadScores(); $("#scRefresh").addEventListener("click", loadScores); }
    wireDevice();
    if (syncOn()) {
      const st = () => { const t = store.get("synced", null), on = store.get("consent", false), er = store.get("syncerr", null); $("#syncState").textContent = !on ? "Sharing is off." : er ? SYNC_MSG[er] : t ? "Last sent: " + new Date(t).toLocaleString() : "Sharing is on. Your progress is sent automatically while you study."; };
      st();
      $("#stConsent").addEventListener("change", (e) => { store.set("consent", e.target.checked); st(); if (e.target.checked) scheduleSync(); });
      $("#syncNow").addEventListener("click", async () => {
        save(); const s = getStudent();
        if (!store.get("consent", false)) { $("#syncState").textContent = "Tick the box above first."; return; }
        if (!s.name || !s.section || !s.id) { $("#syncState").textContent = "Enter your full name, choose your section and enter your student ID number first."; return; }
        $("#syncState").textContent = "Sending..."; const r = await syncNow(); st(); if (!r.ok && r.error === "network") $("#syncState").textContent = "Could not reach the server. Check your internet and try again."; else if (r.ok) setTimeout(() => location.reload(), 600);
      });
      $("#studentForm").addEventListener("input", scheduleSync);
    }
    $("#prn").addEventListener("click", () => { save(); window.print(); });
  }

  /* instructor view: load the files students submitted; everything stays in this browser */
  const csvCell = (v) => { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  function csv(list) {
    const n = C.lecture.length;
    const head = ["Name", "Section", "Student ID", "Exported", "Last active", "Lecture %", "Lab %", "Quiz avg %"];
    for (let w = 1; w <= n; w++) head.push(`W${w} lecture %`, `W${w} lab %`, `W${w} quiz`);
    const lines = [head].concat(list.map((d) => {
      const r = [d.student.name, d.student.section, d.student.id, d.exportedAt, d.lastActive || "", avg(d.weeks.map((x) => x.lecture)), avg(d.weeks.map((x) => x.laboratory)), quizAvg(d.weeks)];
      d.weeks.forEach((x) => r.push(x.lecture, x.laboratory, x.quiz ? `${x.quiz.best}/${x.quiz.total}` : ""));
      return r;
    }));
    return lines.map((r) => r.map(csvCell).join(",")).join("\r\n");
  }
  const validFile = (d) => d && d.app === "csae104-progress" && d.student && Array.isArray(d.weeks) && d.weeks.every((x) => Number.isFinite(x.lecture) && Number.isFinite(x.laboratory));
  function teacherPage() {
    return `<main id="main" class="wrap pg">
      <section class="intro"><h1>Class progress</h1>
      <p>Open the progress files your students submitted. The files are read in this browser only and are not uploaded anywhere. If a student submits twice, the newest file is used.</p></section>
      <div class="card tctl">
        <label class="fbtn btn solid">Choose progress files<input id="tFiles" type="file" accept=".json,application/json" multiple hidden></label>
        <label>Section<select id="tSec"><option value="">All</option>${SECTIONS.map((x) => `<option>${x}</option>`).join("")}</select></label>
        <label>Current week<input id="tWeek" type="number" min="1" max="${C.lecture.length}" value="1"></label>
        <label>Behind if below<input id="tThr" type="number" min="1" max="100" value="80"> %</label>
        <button class="btn" type="button" id="tCsv" disabled>Download class CSV</button>
      </div>
      <p class="net-note" id="tMsg" role="status">No files loaded yet.</p>
      <div class="tscroll"><table class="ttable" id="tTable" hidden><thead><tr><th>Name</th><th>Section</th><th>Lectures</th><th>Labs</th><th>Quiz avg</th><th>Weeks behind</th><th>Last active</th><th>Exported</th></tr></thead><tbody id="tBody"></tbody></table></div>
    </main>`;
  }
  function wireTeacher() {
    let people = new Map();
    const render = () => {
      const sec = $("#tSec").value, cur = Math.max(1, Math.min(C.lecture.length, +$("#tWeek").value || 1)), thr = +$("#tThr").value || 80;
      const list = [...people.values()].filter((d) => !sec || d.student.section === sec).sort((a, b) => (a.student.section + a.student.name).localeCompare(b.student.section + b.student.name));
      $("#tTable").hidden = !list.length; $("#tCsv").disabled = !list.length;
      $("#tBody").innerHTML = list.map((d) => {
        const behind = d.weeks.filter((x) => x.week <= cur && (x.lecture < thr || x.laboratory < thr)).map((x) => x.week);
        const la = d.lastActive ? new Date(d.lastActive).toLocaleDateString() : "-";
        return `<tr class="${behind.length ? "late" : ""}"><td>${esc(d.student.name)}${d.student.id ? `<small>${esc(d.student.id)}</small>` : ""}</td><td>${esc(d.student.section)}</td><td>${bar(avg(d.weeks.map((x) => x.lecture)))}</td><td>${bar(avg(d.weeks.map((x) => x.laboratory)))}</td><td>${quizAvg(d.weeks)}%</td><td>${behind.length ? `<b>${behind.length}</b> <small>(${behind.map((x) => "W" + x).join(", ")})</small>` : "On track"}</td><td>${la}</td><td>${new Date(d.exportedAt).toLocaleDateString()}</td></tr>`;
      }).join("");
      if (people.size) $("#tMsg").textContent = `${list.length} of ${people.size} students shown. "Behind" means a lecture or lab below ${thr}% in any week up to Week ${cur}.`;
    };
    $("#tFiles").addEventListener("change", async (e) => {
      let bad = 0;
      for (const f of e.target.files) {
        try {
          const d = JSON.parse(await f.text());
          if (!validFile(d)) { bad++; continue; }
          const key = (d.student.name || "").toLowerCase().trim() + "|" + (d.student.id || "");
          const old = people.get(key);
          if (!old || old.exportedAt < d.exportedAt) people.set(key, d);
        } catch (err) { bad++; }
      }
      render();
      if (bad) $("#tMsg").textContent += ` ${bad} file(s) were skipped because they are not valid CSAE 104 progress files.`;
      e.target.value = "";
    });
    ["tSec", "tWeek", "tThr"].forEach((id) => $("#" + id).addEventListener("input", render));
    $("#tCsv").addEventListener("click", () => {
      const sec = $("#tSec").value;
      download(`csae104-class-progress-${new Date().toISOString().slice(0, 10)}.csv`, csv([...people.values()].filter((d) => !sec || d.student.section === sec)), "text/csv");
    });
  }

  /* ---------- student guide page ---------- */
  function guidePage() {
    const sec = (id, h, body) => `<section class="card gsec" id="${id}"><h2>${h}</h2>${body}</section>`;
    const ol = (a) => `<ol>${a.map((x) => `<li>${x}</li>`).join("")}</ol>`;
    const ul = (a) => `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    const tbl = (head, rows) => `<div class="tscroll"><table class="ttable"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    return `<main id="main" class="wrap pg">
      <section class="intro"><h1>How it works</h1>
      <p>How to register, how your progress is counted, how to submit your lab work and how to see your scores.</p></section>
      <nav class="card gtoc" aria-label="In this guide"><b>In this guide:</b> <a href="#register">Register</a> · <a href="#tracked">What is tracked</a> · <a href="#quizzes">Quizzes</a> · <a href="#submit-work">Submit your work</a> · <a href="#scores">Your scores</a> · <a href="#device">Another device</a> · <a href="#messages">Messages</a> · <a href="#privacy">Privacy</a></nav>
      ${sec("register", "1. Register once", ol(["On your first visit, a <b>Register for CSAE 104</b> form appears.", "Enter your <b>full name</b>, choose your <b>section</b> (3B, 3E, 3F or 3G) and enter your <b>student ID number</b>.", "Tick the box to agree that your progress is sent to your instructor, then click <b>Register</b>."]) + ul(["Use your real student ID. Your instructor has a class list, and your ID must be on it.", "After you register, your name, section and ID are <b>locked</b>. If something is wrong, ask your instructor.", "Not a student of this class? Click <b>I am not a student of this class</b>. Nothing is sent."]))}
      ${sec("tracked", "2. What the site tracks", tbl(["What", "How it counts"], [["<b>Lectures</b>", "A week fills up as you scroll through its sections. Read the whole week to reach 100%."], ["<b>Labs</b>", "Tick every step and every item on the &quot;You are done when&quot; checklist."], ["<b>Quizzes</b>", "Your score is recorded when you answer all the multiple-choice questions."]]) + "<p>Your progress is saved on your device and sent to your instructor automatically a few seconds after you make progress. Your <b>notes</b> and typed answers stay on your device and are never sent.</p>")}
      ${sec("quizzes", "3. Quizzes: one attempt only", ul(["Each quiz can be taken <b>once</b>. An answer locks as soon as you pick it.", "Answers stay locked after you reload the page, and &quot;Reset my progress&quot; does not clear them.", "Your first score is the one your instructor sees."]))}
      ${sec("submit-work", "4. Submit your lab work", "<p>Your work lives in <b>one GitHub repository for the whole semester</b>, named <code>csae104-notices-board</code>, with a folder for each lab. You create it in Lab 1 and connect it to GitHub in Lab 5.</p><h3>After each lab</h3><pre><code>git add .\ngit commit -m &quot;Finish Lab 6&quot;\ngit push</code></pre><h3>For project checkpoints (Weeks 6, 8, 11, 16 and 17)</h3><pre><code>git tag checkpoint-1\ngit push --tags</code></pre><p>Use <code>checkpoint-2</code>, <code>checkpoint-3</code> and so on for the later ones.</p><h3>Then submit the link</h3>" + ol(["Open <a href=\"progress.html#submit\">My progress</a> and find <b>Submit my work</b>.", "Choose what you are submitting, paste your repository link, and add the tag or folder. For Weeks 15 and 17 add your deployed site address.", "Click <b>Submit</b>. You can submit again to replace your link; your first submission time is kept."]) + ul(["If your repository is private, add the GitHub account shown on the page as a collaborator.", "You must be registered, and you must submit from the device you registered on.", "Only <code>https://github.com/...</code> links are accepted."]))}
      ${sec("scores", "5. See your scores", "<p>When your instructor has checked your work and released the scores, they appear under <a href=\"progress.html#scores\">My progress &rarr; My scores</a> with your score out of the total, your total so far, and any feedback. Press <b>Refresh my scores</b> to check for new ones. You see only your own scores.</p>")}
      ${sec("device", "6. Use another device", ol(["On the old device, open My progress, find <b>Use another device</b>, and click <b>Download backup</b>.", "Send the file to yourself (email, Drive or USB).", "On the new device, open My progress and click <b>Restore from backup</b>."]) + "<p>Restoring adds to what is already there and never removes anything. Keep the file private. Lost your old device with no backup? Ask your instructor to unlock your account.</p>")}
      ${sec("messages", "7. If you see a message", tbl(["Message", "What to do"], [["Your name or student ID is not in the class list", "Check your student ID number. If it is right, tell your instructor."], ["This name is already registered on another device", "Restore your backup on this device, or ask your instructor to unlock you."], ["This device is registered under a different name", "Ask your instructor."], ["Share your progress first", "Register first (step 1), then try again."], ["Could not reach the server", "Check your internet connection and try again. Your progress is still saved on your device."], ["Use your GitHub link", "The link must start with https://github.com/"]]))}
      ${sec("privacy", "8. Your privacy", ul(["Your instructor receives your <b>name, section, student ID, lecture and lab progress, quiz scores, the GitHub links you submit, and the scores they give you</b>.", "Your instructor does <b>not</b> receive your notes, your typed answers, your quiz answers (only the score) or your code.", "You can switch off sharing on the My progress page, but then your instructor cannot see your progress."]))}
    </main>`;
  }

  /* ---------- boot ---------- */
  function boot() {
    initTheme();
    const page = document.body.dataset.page, q = new URLSearchParams(location.search);
    let kind = document.body.dataset.kind || "", html = "", title = "CSAE 104 Web Programming";
    if (page === "week") {
      kind = KINDS[q.get("t")] ? q.get("t") : "lecture";
      const n = parseInt(q.get("w"), 10) || 1;
      if (!C[kind].find((x) => x.week === n)) { location.replace(KINDS[kind].file); return; }
      document.body.dataset.kind = kind;
      title = `Week ${n} ${KINDS[kind].label}: ${C[kind].find((x) => x.week === n).title} | CSAE 104`;
      html = weekPage(kind, n);
    } else if (page === "list") { html = list(kind); title = `${KINDS[kind].label} | CSAE 104 Web Programming`; }
    else if (page === "progress") { html = progressPage(); title = "My progress | CSAE 104"; kind = "progress"; document.body.dataset.kind = kind; }
    else if (page === "guide") { html = guidePage(); title = "How it works | CSAE 104"; kind = "progress"; document.body.dataset.kind = kind; }
    else if (page === "teacher") { html = teacherPage(); title = "Class progress | CSAE 104"; kind = "teacher"; document.body.dataset.kind = kind; }
    else html = home();
    document.title = title;
    $("#app").innerHTML = header(kind) + html + footer();
    wireShell();
    if (needsGate(page)) showGate();
    scheduleSync();
    if (page === "progress") wireProgress();
    if (page === "teacher") wireTeacher();
    if (page === "week") wireWeek(kind, parseInt(q.get("w"), 10) || 1);
  }
  boot();
})();
