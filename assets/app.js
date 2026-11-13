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
    clear() { try { Object.keys(localStorage).filter((k) => k.startsWith("csae104:") && !k.endsWith(":theme")).forEach((k) => localStorage.removeItem(k)); } catch (e) {} },
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
      <div>Your progress is saved in this browser only. <a href="progress.html">Export it</a> to share with your instructor. <a href="teacher.html">Instructor view</a>. <button type="button" id="resetBtn">Reset my progress</button></div>
    </div></footer>
    <dialog class="search" id="searchDlg" aria-label="Search"><input id="searchIn" type="search" placeholder="Search lectures and labs, for example: middleware" autocomplete="off"><ul id="searchOut"></ul></dialog>`;
  }
  function wireShell() {
    $("#themeBtn").addEventListener("click", () => {
      const t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(t); store.set("theme", t);
    });
    $("#resetBtn").addEventListener("click", () => {
      if (confirm("Clear your saved progress, quiz scores and notes on this device?")) { store.clear(); location.reload(); }
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
    return `<section class="sec quiz-sec" id="quiz" data-sec><div class="quiz"><header><h2>Check your understanding</h2><span class="score" id="score">${mc ? (best ? `Best score: ${best.best}/${best.total}` : `${mc} multiple-choice questions`) : ""}</span></header>
      ${items}
      ${mc ? `<div class="qfoot"><button class="btn" type="button" id="retry">Try again with new order</button><p>The choices are shuffled each time, so the answer is never in the same place.</p></div>` : ""}</div></section>`;
  }
  function wireQuiz(w, t) {
    const root = $("#quiz"); if (!root) return;
    const total = w.quiz.filter((q) => !q.open).length;
    let right = 0, answered = 0;
    root.addEventListener("click", (e) => {
      const b = e.target.closest(".opt"); if (!b) return;
      const q = b.closest(".q"), ans = +q.dataset.ans, pick = +b.dataset.oi;
      $$(".opt", q).forEach((o) => { o.disabled = true; if (+o.dataset.oi === ans) o.classList.add("right"); });
      const fb = $(".fb", q);
      if (pick === ans) { b.classList.add("right"); fb.textContent = "Correct."; fb.className = "fb ok"; right++; }
      else { b.classList.add("wrong"); fb.textContent = "Not quite. The correct choice is highlighted in green."; fb.className = "fb no"; }
      answered++;
      $("#score").textContent = `Score: ${right}/${answered} of ${total}`;
      if (answered === total) {
        const best = store.get(`quiz:${t}:${w.week}`, null);
        store.set("active", new Date().toISOString());
        if (!best || right > best.best) store.set(`quiz:${t}:${w.week}`, { best: right, total });
        $("#score").textContent = `Final score: ${right}/${total}`;
      }
    });
    root.addEventListener("input", (e) => { if (e.target.dataset.note !== undefined) store.set(`note:${t}:${w.week}:${e.target.dataset.note}`, e.target.value); });
    const retry = $("#retry");
    if (retry) retry.addEventListener("click", () => {
      right = answered = 0;
      const tmp = document.createElement("div"); tmp.innerHTML = quizHTML(w, t);
      $$(".q[data-q]", root).forEach((q) => { const n = $(`.q[data-q="${q.dataset.q}"]`, tmp); q.replaceWith(n); });
      $("#score").textContent = `${total} multiple-choice questions`;
      $(".q[data-q]", root).scrollIntoView({ block: "center" });
    });
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
      store.set("active", new Date().toISOString());
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

  function progressPage() {
    const s = getStudent(), snap = snapshot();
    const rows = snap.weeks.map((x) => {
      const w = C.lecture[x.week - 1];
      return `<div class="net-row prow"><span class="nm"><span class="wk">${String(x.week).padStart(2, "0")}</span><span class="tt">${esc(w.title)}</span></span>
        <span data-l="Lecture">${bar(x.lecture)}</span><span data-l="Laboratory">${bar(x.laboratory)}</span><span data-l="Quiz">${x.quiz ? `${x.quiz.best}/${x.quiz.total}` : "-"}</span></div>`;
    }).join("");
    return `<main id="main" class="wrap pg">
      <section class="intro"><h1>My progress</h1>
      <p>This page shows what you have finished on this device. Fill in your details, download your progress file, and submit it on Google Classroom so your instructor can see how you are doing.</p></section>
      <form class="card sform" id="studentForm" autocomplete="off">
        <label>Full name<input id="stName" value="${esc(s.name)}" required placeholder="Surname, Given name"></label>
        <label>Section<select id="stSec"><option value="">Choose</option>${SECTIONS.map((x) => `<option ${s.section === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <label>Student ID (optional)<input id="stId" value="${esc(s.id)}" placeholder="e.g. 24-0001"></label>
      </form>
      <div class="sums">
        <div class="card"><b id="sumL">${avg(snap.weeks.map((x) => x.lecture))}%</b><span>Lectures read</span></div>
        <div class="card"><b id="sumB">${avg(snap.weeks.map((x) => x.laboratory))}%</b><span>Lab steps done</span></div>
        <div class="card"><b id="sumQ">${quizAvg(snap.weeks)}%</b><span>Average best quiz score</span></div>
      </div>
      <div class="net"><div class="net-head prow"><span>Week</span><span>Lecture</span><span>Laboratory</span><span>Quiz</span></div>${rows}</div>
      <div class="pactions">
        <button class="btn solid" type="button" id="dlJson">Download my progress file</button>
        <button class="btn" type="button" id="dlCsv">Download as CSV</button>
        <button class="btn" type="button" id="prn">Print or save as PDF</button>
      </div>
      <p class="net-note" id="pmsg" role="status">Your name and section are required before you download. The file contains only your name, section, student ID, and your percentages and quiz scores. It does not contain your notes. Your instructor asks you to submit the file on Google Classroom.</p>
    </main>`;
  }
  function wireProgress() {
    const save = () => store.set("student", { name: $("#stName").value.trim(), section: $("#stSec").value, id: $("#stId").value.trim() });
    $$("#studentForm input,#studentForm select").forEach((e) => e.addEventListener("input", save));
    $("#studentForm").addEventListener("submit", (e) => e.preventDefault());
    const ready = () => {
      save(); const s = getStudent();
      if (!s.name || !s.section) { $("#pmsg").textContent = "Please enter your full name and choose your section first."; $("#pmsg").style.color = "var(--bad)"; $("#stName").focus(); return null; }
      $("#pmsg").style.color = ""; $("#pmsg").textContent = "Downloaded. Now submit the file on Google Classroom. Download a new file whenever your instructor asks for an update.";
      return snapshot();
    };
    $("#dlJson").addEventListener("click", () => { const d = ready(); if (d) download(`csae104-${slugName(d.student.name)}-${d.exportedAt.slice(0, 10)}.json`, JSON.stringify(d, null, 2), "application/json"); });
    $("#dlCsv").addEventListener("click", () => { const d = ready(); if (d) download(`csae104-${slugName(d.student.name)}-${d.exportedAt.slice(0, 10)}.csv`, csv([d]), "text/csv"); });
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
    else if (page === "teacher") { html = teacherPage(); title = "Class progress | CSAE 104"; kind = "teacher"; document.body.dataset.kind = kind; }
    else html = home();
    document.title = title;
    $("#app").innerHTML = header(kind) + html + footer();
    wireShell();
    if (page === "progress") wireProgress();
    if (page === "teacher") wireTeacher();
    if (page === "week") wireWeek(kind, parseInt(q.get("w"), 10) || 1);
  }
  boot();
})();
