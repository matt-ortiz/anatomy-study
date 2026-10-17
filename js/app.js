(() => {
  "use strict";

  // Each unit page loads its own data first: window.UNIT, DIAGRAMS, GLOSSARY, ALIASES, CONCEPT_QUESTIONS.
  const app = document.getElementById("app");
  const UNIT = window.UNIT;
  const DIAGRAMS = window.DIAGRAMS;
  const GLOSSARY = window.GLOSSARY;
  const ALIASES = window.ALIASES || {};
  const DIAG = Object.fromEntries(DIAGRAMS.map(d => [d.id, d]));
  const DIAG_ORDER = Object.fromEntries(DIAGRAMS.map((d, i) => [d.id, i]));

  // Sections are the quiz topics (e.g. Bones / The skeleton / Joints); each diagram belongs to one.
  const TOPICS = UNIT.sections;
  const TOPIC_NAME = Object.fromEntries(TOPICS.map(t => [t.id, t.name]));
  const diagramsIn = topic => DIAGRAMS.filter(d => d.section === topic);
  const DIAGRAM_TOPICS = TOPICS.filter(t => diagramsIn(t.id).length); // some topics are questions only
  const NOTES = window.SLIDE_NOTES || [];

  const MODES = {
    label:   { name: "Label it", desc: "A label is highlighted on the diagram. Name it." },
    find:    { name: "Find it", desc: "You're given a term. Tap where it goes on the diagram." },
    concept: { name: "Concepts", desc: "Multiple-choice questions on meanings and key facts from the slides." },
    fill:    { name: "Slide notes", desc: "Fill in the blanks in sentences from the slides." },
    mix:     { name: "Mix", desc: "Every question type, shuffled." },
  };
  if (!NOTES.length) delete MODES.fill;

  // ---------- Helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const meaningOf = term => (GLOSSARY[term] && GLOSSARY[term].meaning) || "";
  const shortName = term => (GLOSSARY[term] && GLOSSARY[term].short) || term;

  // ---------- Storage (per-browser progress) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode etc. */ }
    },
  };
  const STATS_KEY = `${UNIT.storageKey}.stats.v1`;
  const PREFS_KEY = `${UNIT.storageKey}.prefs.v1`;
  let stats = store.get(STATS_KEY, {});
  let prefs = Object.assign(
    { topics: TOPICS.map(t => t.id), mode: "label", style: "type", length: "20", showAnswered: true, retryMissed: true },
    store.get(PREFS_KEY, {})
  );
  prefs.topics = prefs.topics.filter(id => TOPIC_NAME[id]);
  // Select topics added since this device last visited.
  const seen = prefs.seenTopics || prefs.topics;
  TOPICS.forEach(t => { if (!seen.includes(t.id) && !prefs.topics.includes(t.id)) prefs.topics.push(t.id); });
  prefs.seenTopics = TOPICS.map(t => t.id);
  if (!MODES[prefs.mode]) prefs.mode = "label";

  function record(key, correct) {
    const s = stats[key] || { right: 0, wrong: 0, streak: 0 };
    if (correct) { s.right++; s.streak++; } else { s.wrong++; s.streak = 0; }
    stats[key] = s;
    store.set(STATS_KEY, stats);
  }
  const isWeak = key => { const s = stats[key]; return !!s && s.wrong > 0 && s.streak < 2; };
  const isMastered = key => { const s = stats[key]; return !!s && s.streak >= 2; };

  // ---------- Question bank ----------
  // Every quizzable thing has a stable key so progress can be tracked.
  // A term can be labeled more than once on a diagram (e.g. "Compact bone"); it's one item,
  // asked at its first spot, and any of its spots counts in "Find it".
  const labelKey = (dId, i) => `L:${dId}:${DIAG[dId].labels[i].term}`;
  const spotsOf = (d, term) => d.labels.map((l, i) => (l.term === term ? i : -1)).filter(i => i >= 0);

  const LABEL_ITEMS = DIAGRAMS.flatMap(d => d.labels
    .map((l, i) => ({ d: d.id, i, key: labelKey(d.id, i), topic: d.section }))
    .filter(it => d.labels.findIndex(l => l.term === d.labels[it.i].term) === it.i));

  const QUESTIONS = buildQuestions();

  // Glossary entries with a "side" (body landmarks) or a "topic" get generated
  // meaning questions; distractors come from the same group.
  function buildQuestions() {
    const qs = [];
    const quizTerms = Object.keys(GLOSSARY).filter(t => (GLOSSARY[t].side || GLOSSARY[t].topic) && GLOSSARY[t].quiz !== false);
    const groupOf = t => (GLOSSARY[t].side ? "regions" : GLOSSARY[t].topic);
    for (const term of quizTerms) {
      const { meaning, side } = GLOSSARY[term];
      const topic = side ? (side === "both" ? "anterior" : side) : GLOSSARY[term].topic;
      const others = quizTerms.filter(t => t !== term && groupOf(t) === groupOf(term) && meaningOf(t) !== meaning);
      qs.push({
        id: `mean:${term}`, topic,
        q: `What does the term <strong>${esc(term)}</strong> refer to?`,
        answer: meaning,
        options: () => shuffle([meaning, ...sample(others, 3).map(meaningOf)]),
        explain: `${term}: ${meaning}.`,
      });
      qs.push({
        id: `term:${term}`, topic,
        q: side ? `Which region is the <strong>${esc(meaning)}</strong>?` : `Which term means <strong>${esc(meaning)}</strong>?`,
        answer: term,
        options: () => shuffle([term, ...sample(others, 3)]),
        explain: `${term}: ${meaning}.`,
      });
      if (!side) continue;
      const sideAnswer = side === "both" ? "Both" : side === "anterior" ? "Anterior" : "Posterior";
      qs.push({
        id: `side:${term}`, topic,
        q: `Where is the <strong>${esc(term)}</strong> region labeled: the anterior view, the posterior view or both?`,
        answer: sideAnswer,
        options: () => ["Anterior", "Posterior", "Both"],
        explain: side === "both"
          ? `${term} (${meaning}) is labeled on both the anterior and posterior views.`
          : `${term} (${meaning}) is on the ${side} view.`,
      });
    }
    for (const c of window.CONCEPT_QUESTIONS) {
      qs.push({
        id: `q:${c.id}`, topic: c.topic, also: c.also || [], q: esc(c.q), answer: c.a[0],
        options: () => shuffle(c.a),
        explain: c.explain || "",
      });
    }
    return qs;
  }
  const QUESTION_BY_KEY = Object.fromEntries(QUESTIONS.map(q => [`Q:${q.id}`, q]));
  const inTopics = (x, topics) => topics.includes(x.topic) || (x.also || []).some(t => topics.includes(t));

  // ---------- Slide notes (fill in the blank) ----------
  // "{answer|alt|alt}" in a line is a blank. Each blank is one quiz item.
  // Punctuation right after a blank ("{206}.") stays glued to it so it can't wrap onto its own line.
  const parseLine = line => {
    const parts = line.split(/(\{[^}]+\})/).filter(Boolean).map(part =>
      part.startsWith("{") ? { answers: part.slice(1, -1).split("|"), after: "" } : { text: part });
    parts.forEach((p, i) => {
      const next = parts[i + 1];
      if (p.answers && next && next.text) {
        p.after = next.text.match(/^[.,;:!?)]*/)[0];
        next.text = next.text.slice(p.after.length);
      }
    });
    return parts.filter(p => p.answers || p.text);
  };
  const glue = (html, after) => (after ? `<span class="nowrap">${html}${esc(after)}</span>` : html);
  const FILL_ITEMS = [];
  NOTES.forEach(deck => deck.slides.forEach((slide, si) => {
    slide.parsed = slide.lines.map(parseLine);
    slide.parsed.forEach((parts, li) => {
      let bi = 0;
      parts.forEach(part => {
        if (!part.answers) return;
        FILL_ITEMS.push({ type: "fill", key: `S:${deck.id}:${si}:${li}:${bi}`, deck: deck.id, si, li, bi,
          topic: slide.topic || deck.topic, also: slide.also || [] });
        bi++;
      });
    });
  }));
  const DECK = Object.fromEntries(NOTES.map(d => [d.id, d]));
  const FILL_BY_KEY = Object.fromEntries(FILL_ITEMS.map(it => [it.key, it]));
  const fillParts = it => DECK[it.deck].slides[it.si].parsed[it.li];
  const fillBlank = it => fillParts(it).filter(p => p.answers)[it.bi];
  // Sentence with the asked blank shown as `blank` (HTML) and any other blanks filled in.
  function fillSentence(it, blank) {
    let bi = 0;
    return fillParts(it).map(p => {
      if (!p.answers) return esc(p.text);
      return glue(bi++ === it.bi ? blank : `<strong>${esc(p.answers[0])}</strong>`, p.after);
    }).join("");
  }
  function matchFill(input, answers) {
    const n = normalize(input), lit = literal(input);
    if (!n) return false;
    const forms = answers.flatMap(a => [normalize(a), literal(a)]);
    if (forms.includes(n) || forms.includes(lit)) return "exact";
    for (const f of forms) {
      const allowed = f.length >= 9 ? 2 : f.length >= 5 ? 1 : 0;
      if (allowed && editDistance(n, f) <= allowed) return "close";
    }
    return false;
  }
  // Multiple-choice options: the answer plus other blanks from the same deck of the same kind.
  function fillChoices(it) {
    const answer = fillBlank(it).answers[0];
    const numeric = /^\d+$/.test(answer);
    const byForm = new Map(); // one option per normalized answer, so "Osteoclasts"/"osteoclasts" don't both appear
    FILL_ITEMS.filter(x => x.deck === it.deck).map(x => fillBlank(x).answers[0])
      .filter(a => /^\d+$/.test(a) === numeric && normalize(a) !== normalize(answer))
      .forEach(a => { if (!byForm.has(normalize(a))) byForm.set(normalize(a), a); });
    const pool = [...byForm.values()];
    if (numeric) while (pool.length < 3) pool.push(String(+answer + pool.length + 1));
    return shuffle([answer, ...sample(pool, 3)]);
  }

  const labelKeysForDiagram = dId => LABEL_ITEMS.filter(it => it.d === dId).map(it => it.key);

  // ---------- Answer checking ----------
  // Answers are compared after lowercasing and dropping filler words ("bone", "joint",
  // "cavity"…), so "frontal" matches "Frontal bone". Words in parentheses are optional.
  const STOP_WORDS = /\b(the|region|cavity|plane|body|area|bone|bones|joint|joints|of|sinus)\b/g;
  const squash = s => {
    const kept = s.replace(STOP_WORDS, " ").replace(/[^a-z0-9]/g, "");
    return kept || s.replace(/[^a-z0-9]/g, ""); // e.g. "Body" alone stays "body"
  };
  const normalize = s => squash(s.toLowerCase().replace(/[()]/g, " "));
  const primaryForm = term => squash(term.toLowerCase().replace(/\(.*?\)/g, " "));
  const literal = s => s.toLowerCase().replace(/[^a-z0-9]/g, ""); // every word kept

  // Forms that would also match a different label on the same diagram are dropped,
  // so "sternum" isn't accepted for "Body (of sternum)" when "Sternum" is also labeled.
  function acceptedForms(term, d) {
    const forms = new Set([primaryForm(term), normalize(term), literal(term), literal(term.replace(/\(.*?\)/g, " ")),
      ...(ALIASES[term] || []).map(normalize)]);
    if (d) d.labels.forEach(l => { if (l.term !== term) forms.delete(primaryForm(l.term)); });
    forms.delete("");
    return [...forms];
  }

  function editDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return dp[a.length][b.length];
  }

  // Returns "exact", "close" (small typo) or false.
  function matchTerm(input, term, d) {
    const n = normalize(input);
    if (!n) return false;
    const forms = acceptedForms(term, d);
    if (forms.includes(n) || forms.includes(literal(input))) return "exact";
    // Not a typo if it's exactly another label on this diagram ("L1 vertebra" vs "T1 vertebra").
    if (d && d.labels.some(l => l.term !== term && acceptedForms(l.term, d).includes(n))) return false;
    for (const f of forms) {
      const allowed = f.length >= 9 ? 2 : f.length >= 5 ? 1 : 0;
      if (allowed && editDistance(n, f) <= allowed) return "close";
    }
    return false;
  }

  // ---------- Session building ----------
  // diagrams (optional) narrows diagram questions to specific diagrams, e.g. from the study view.
  function buildSession({ topics, mode, length, diagrams }) {
    const labelItems = LABEL_ITEMS.filter(it => (diagrams ? diagrams.includes(it.d) : topics.includes(it.topic)));
    const mcItems = diagrams ? [] : QUESTIONS.filter(q => inTopics(q, topics)).map(q => ({ type: "mc", key: `Q:${q.id}`, q }));
    const fillItems = diagrams ? [] : FILL_ITEMS.filter(it => inTopics(it, topics));
    const limit = length === "all" ? Infinity : Number(length);
    const topicOrder = it => DIAG_ORDER[it.d];

    let items;
    if (mode === "label" || mode === "find") {
      // Keep each diagram's questions together so the picture doesn't jump around.
      items = sample(labelItems, limit)
        .sort((a, b) => topicOrder(a) - topicOrder(b))
        .map(it => ({ ...it, type: mode }));
      items = regroupShuffled(items);
    } else if (mode === "concept") {
      items = sample(mcItems, limit);
    } else if (mode === "fill") {
      items = sample(fillItems, limit);
    } else {
      const diagramItems = labelItems.map(it => ({ ...it, type: Math.random() < .5 ? "label" : "find" }));
      items = sample([...diagramItems, ...mcItems, ...fillItems], limit);
    }
    return items;
  }

  // After sorting by topic, shuffle within each topic group.
  function regroupShuffled(items) {
    const groups = [];
    for (const it of items) {
      const g = groups[groups.length - 1];
      if (g && g[0].d === it.d) g.push(it); else groups.push([it]);
    }
    return groups.flatMap(g => shuffle(g));
  }

  function buildWeakSession() {
    const keys = shuffle(Object.keys(stats).filter(isWeak));
    const items = [];
    for (const key of keys) {
      if (key.startsWith("L:")) {
        const it = LABEL_ITEMS.find(x => x.key === key);
        if (it) items.push({ ...it, type: Math.random() < .5 ? "label" : "find" });
      } else if (QUESTION_BY_KEY[key]) {
        items.push({ type: "mc", key, q: QUESTION_BY_KEY[key] });
      } else if (FILL_BY_KEY[key]) {
        items.push({ ...FILL_BY_KEY[key] });
      }
    }
    return items.slice(0, 25);
  }

  // ---------- Diagram rendering ----------
  // opts.state(i) -> { cls, text } for each blank; opts.clickable adds hover/click.
  function figureHTML(d, opts = {}) {
    const blanks = d.labels.map((l, i) => {
      const st = (opts.state && opts.state(i)) || {};
      // Single-line boxes may grow to fit the revealed term; tall ones wrap or run vertically.
      const hPx = l.h * d.height / 100, wPx = l.w * d.width / 100;
      const layout = hPx > wPx * 2 ? " vertical" : hPx < d.fontPx * 1.9 ? " single" : "";
      const text = st.text != null ? esc(st.text) : `<span class="num">${i + 1}</span>`;
      const label = st.text != null ? st.text : `Label ${i + 1}`;
      return `<button type="button" class="blank${layout} ${st.cls || ""}${opts.clickable ? " clickable" : ""}"
        data-blank="${i}" aria-label="${esc(label)}" ${opts.clickable ? "" : 'tabindex="-1"'}
        style="left:${l.x}%;top:${l.y}%;${layout === " single" ? "min-width" : "width"}:${l.w}%;height:${l.h}%">${text}</button>`;
    }).join("");
    // Labels scale with the picture; on narrow screens the picture keeps a minimum
    // width (so labels stay readable) and the card scrolls sideways instead.
    const minW = Math.round(d.width * 9 / d.fontPx);
    return `<div class="figure-wrap"><div class="figure" style="--ar:${d.width / d.height};--fs:calc(${d.fontPx * 100}cqw / ${d.width});--minw:${minW}px">
      <img src="${d.image}" width="${d.width}" height="${d.height}" alt="${esc(d.title)} diagram">
      ${blanks}</div>${opts.footer || ""}</div>`;
  }

  // ---------- Router ----------
  let quiz = null; // active quiz state

  function go(screen, arg) {
    if (screen !== "quiz") quiz = null;
    ({ home: renderHome, study: renderStudy, notes: renderNotes, results: renderResults }[screen] || renderHome)(arg);
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", e => {
    if (e.target.closest('[data-action="home"]')) go("home");
  });

  // ---------- Home ----------
  function renderHome() {
    const weakKeys = Object.keys(stats).filter(isWeak);
    const weakNames = weakKeys.map(k => k.startsWith("L:") ? k.split(":").slice(2).join(":")
      : FILL_BY_KEY[k] ? fillBlank(FILL_BY_KEY[k]).answers[0] : null).filter(Boolean);
    const uniqueWeak = [...new Set(weakNames)];
    const weakConcepts = weakKeys.filter(k => k.startsWith("Q:")).length;

    const tile = (d, name) => {
      const keys = labelKeysForDiagram(d.id);
      const done = keys.filter(isMastered).length;
      const pct = Math.round(done / keys.length * 100);
      return `<button class="tile" data-study="${d.id}">
        <div class="tile-img"><img src="${d.image}" alt="" loading="lazy"></div>
        <div class="tile-name">${esc(name)}</div>
        <div class="bar"><span style="width:${pct}%"></span></div>
        <div class="tile-progress">${done} / ${keys.length} labels mastered</div>
      </button>`;
    };
    // One diagram per section: a single grid named by section. Otherwise group tiles by section.
    const flat = DIAGRAM_TOPICS.every(t => diagramsIn(t.id).length === 1);
    const tiles = flat
      ? `<div class="study-tiles">${DIAGRAM_TOPICS.map(t => tile(diagramsIn(t.id)[0], t.name)).join("")}</div>`
      : DIAGRAM_TOPICS.map(t => `<h3 class="tile-group">${esc(t.name)}</h3>
          <div class="study-tiles">${diagramsIn(t.id).map(d => tile(d, d.title)).join("")}</div>`).join("");

    const topicChips = TOPICS.map(t =>
      `<button class="chip" data-topic="${t.id}" aria-pressed="${prefs.topics.includes(t.id)}">${t.name}</button>`).join("");
    const modeChips = Object.entries(MODES).map(([id, m]) =>
      `<button class="chip" data-mode="${id}" aria-pressed="${prefs.mode === id}">${m.name}</button>`).join("");
    const styleChips = [["type", "Type the answer"], ["choose", "Multiple choice"]].map(([id, n]) =>
      `<button class="chip" data-style="${id}" aria-pressed="${prefs.style === id}">${n}</button>`).join("");
    const retryChips = [[true, "On"], [false, "Off"]].map(([v, n]) =>
      `<button class="chip" data-retry-missed="${v}" aria-pressed="${prefs.retryMissed === v}">${n}</button>`).join("");
    const lengthChips = ["10", "20", "all"].map(n =>
      `<button class="chip" data-length="${n}" aria-pressed="${prefs.length === n}">${n === "all" ? "All" : n}</button>`).join("");

    app.innerHTML = `
      <section class="hero">
        <h1>${esc(UNIT.heading)}</h1>
        <p>${esc(UNIT.intro)}</p>
      </section>
      <div class="home-grid">
        <div>
          <section class="card">
            <h2>Study the diagrams</h2>
            <p class="muted" style="font-size:.92rem">Tap a label to hide it or show it and test yourself.</p>
            ${tiles}
          </section>
          ${NOTES.length ? `
          <section class="card">
            <h2>Study the slide notes</h2>
            <p class="muted" style="font-size:.92rem">The written part of each slide, with the key words as blanks you can tap to reveal.</p>
            <div class="btn-row">${NOTES.map(deck => {
              const keys = FILL_ITEMS.filter(it => it.deck === deck.id).map(it => it.key);
              return `<button class="btn notes-btn" data-notes="${deck.id}">${esc(deck.title)}
                <small>${keys.filter(isMastered).length}/${keys.length}</small></button>`;
            }).join("")}</div>
          </section>` : ""}
          ${weakKeys.length ? `
          <section class="card">
            <h2>Review what you missed</h2>
            <p class="muted" style="font-size:.92rem;margin-bottom:0">${weakKeys.length} item${weakKeys.length === 1 ? "" : "s"} to review${weakConcepts ? `, including ${weakConcepts} concept question${weakConcepts === 1 ? "" : "s"}` : ""}.</p>
            ${uniqueWeak.length ? `<div class="weak-list">${uniqueWeak.slice(0, 18).map(n => `<span class="weak-tag">${esc(shortName(n))}</span>`).join("")}${uniqueWeak.length > 18 ? `<span class="weak-tag">+${uniqueWeak.length - 18} more</span>` : ""}</div>` : `<div style="height:12px"></div>`}
            <button class="btn btn-primary" data-start="weak">Practice missed items</button>
          </section>` : ""}
        </div>
        <section class="card">
          <h2>Quiz yourself</h2>
          <div class="field">
            <span class="field-label">Topics</span>
            <div class="chips">${topicChips}</div>
          </div>
          <div class="field">
            <span class="field-label">Question type</span>
            <div class="chips">${modeChips}</div>
            <div class="mode-desc">${MODES[prefs.mode].desc}</div>
          </div>
          <div class="field" ${["label", "fill", "mix"].includes(prefs.mode) ? "" : "hidden"}>
            <span class="field-label">How to answer ${MODES.fill ? "\"Label it\" and \"Slide notes\"" : "\"Label it\""} questions</span>
            <div class="chips">${styleChips}</div>
          </div>
          <div class="field">
            <span class="field-label">Number of questions</span>
            <div class="chips">${lengthChips}</div>
          </div>
          <div class="field">
            <span class="field-label">Repeat missed questions</span>
            <div class="chips">${retryChips}</div>
            <div class="mode-desc">${prefs.retryMissed ? "Anything you miss comes back a few questions later until you get it right." : "Each question is asked once."}</div>
          </div>
          <button class="btn btn-primary btn-block" data-start="quiz" ${prefs.topics.length ? "" : "disabled"}>Start quiz</button>
          <p style="text-align:center;margin:14px 0 0"><button class="link" data-reset>Reset my progress</button></p>
        </section>
      </div>`;

    app.onclick = e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.study) return go("study", t.dataset.study);
      if (t.dataset.notes) return go("notes", t.dataset.notes);
      if (t.dataset.topic) {
        const id = t.dataset.topic;
        prefs.topics = prefs.topics.includes(id) ? prefs.topics.filter(x => x !== id) : TOPICS.map(x => x.id).filter(x => x === id || prefs.topics.includes(x));
      } else if (t.dataset.mode) prefs.mode = t.dataset.mode;
      else if (t.dataset.style) prefs.style = t.dataset.style;
      else if (t.dataset.length) prefs.length = t.dataset.length;
      else if (t.dataset.retryMissed) prefs.retryMissed = t.dataset.retryMissed === "true";
      else if (t.dataset.start === "quiz") return startQuiz(buildSession(prefs), "quiz");
      else if (t.dataset.start === "weak") return startQuiz(buildWeakSession(), "weak");
      else if (t.hasAttribute("data-reset")) {
        if (confirm("Clear all saved progress on this device?")) { stats = {}; store.set(STATS_KEY, stats); }
      } else return;
      store.set(PREFS_KEY, prefs);
      renderHome();
    };
  }

  // ---------- Study ----------
  function renderStudy(dId) {
    const d = DIAG[dId] || DIAGRAMS[0];
    const hidden = new Set();
    let flashIdx = -1;

    const draw = () => {
      const idx = DIAG_ORDER[d.id];
      const nav = DIAGRAMS.length <= 6
        ? `<div class="tabs" role="tablist">${DIAGRAMS.map(x =>
            `<button class="tab" role="tab" data-tab="${x.id}" aria-selected="${x.id === d.id}">${esc(TOPIC_NAME[x.section] && diagramsIn(x.section).length === 1 ? TOPIC_NAME[x.section] : x.title)}</button>`).join("")}</div>`
        : `<div class="diagram-picker">
            <button class="btn" data-tab="${DIAGRAMS[(idx + DIAGRAMS.length - 1) % DIAGRAMS.length].id}" aria-label="Previous diagram">‹</button>
            <select id="diagram-select" aria-label="Choose a diagram">${DIAGRAM_TOPICS.map(t => `<optgroup label="${esc(t.name)}">${diagramsIn(t.id).map(x =>
              `<option value="${x.id}" ${x.id === d.id ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</optgroup>`).join("")}</select>
            <button class="btn" data-tab="${DIAGRAMS[(idx + 1) % DIAGRAMS.length].id}" aria-label="Next diagram">›</button>
          </div>`;
      const glossary = d.labels.map((l, i) =>
        `<li><button data-row="${i}"><span class="n">${i + 1}</span><span class="t">${esc(l.term)}</span><span class="m">${esc(meaningOf(l.term))}</span></button></li>`).join("");

      app.innerHTML = `
        ${nav}
        <div class="study-layout">
          <div>
            <div class="study-tools">
              <button class="btn" data-all="hide">Hide all labels</button>
              <button class="btn" data-all="show">Show all labels</button>
            </div>
            ${figureHTML(d, {
              clickable: true,
              state: i => hidden.has(i)
                ? { cls: i === flashIdx ? "flash" : "" }
                : { cls: "revealed" + (i === flashIdx ? " flash" : ""), text: shortName(d.labels[i].term) },
            })}
          </div>
          <section class="card">
            <h2>${esc(d.title)}</h2>
            <p class="muted" style="font-size:.9rem">Tap a term to find it on the diagram.</p>
            <ul class="glossary">${glossary}</ul>
            <div class="btn-row" style="margin-top:16px">
              <button class="btn btn-primary" data-quiz="label">Quiz: Label it</button>
              <button class="btn" data-quiz="find">Quiz: Find it</button>
            </div>
          </section>
        </div>`;
      if (flashIdx >= 0) {
        const el = app.querySelector(`[data-blank="${flashIdx}"]`);
        if (el) el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      }
      flashIdx = -1;
      const sel = app.querySelector("#diagram-select");
      if (sel) sel.onchange = () => go("study", sel.value);
    };

    app.onclick = e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.tab) return go("study", t.dataset.tab);
      if (t.dataset.blank) { const i = +t.dataset.blank; hidden.has(i) ? hidden.delete(i) : hidden.add(i); }
      else if (t.dataset.all === "hide") d.labels.forEach((_, i) => hidden.add(i));
      else if (t.dataset.all === "show") hidden.clear();
      else if (t.dataset.row) { const i = +t.dataset.row; hidden.delete(i); flashIdx = i; }
      else if (t.dataset.quiz) {
        return startQuiz(buildSession({ diagrams: [d.id], mode: t.dataset.quiz, length: "all" }), "quiz");
      } else return;
      draw();
    };
    draw();
  }

  // ---------- Slide notes study view ----------
  function renderNotes(deckId) {
    const deck = DECK[deckId] || NOTES[0];
    const deckItems = FILL_ITEMS.filter(it => it.deck === deck.id);
    const shown = new Set(); // keys of revealed blanks; all hidden to start

    const draw = () => {
      const tabs = NOTES.map(x =>
        `<button class="tab" role="tab" data-deck="${x.id}" aria-selected="${x.id === deck.id}">${esc(x.title)}</button>`).join("");
      const slides = deck.slides.map((slide, si) => `
        <section class="card slide-card">
          <h3>${esc(slide.title)}</h3>
          <ul>${slide.parsed.map((parts, li) => {
            let bi = 0;
            return `<li>${parts.map(p => {
              if (!p.answers) return esc(p.text);
              const key = `S:${deck.id}:${si}:${li}:${bi++}`;
              return glue(shown.has(key)
                ? `<button class="note-blank shown" data-key="${key}">${esc(p.answers[0])}</button>`
                : `<button class="note-blank" data-key="${key}" aria-label="Show answer">${"\u00a0".repeat(Math.max(6, p.answers[0].length))}</button>`, p.after);
            }).join("")}</li>`;
          }).join("")}</ul>
        </section>`).join("");
      app.innerHTML = `
        <div class="tabs" role="tablist">${tabs}</div>
        <div class="study-tools">
          <button class="btn" data-all="hide">Hide all blanks</button>
          <button class="btn" data-all="show">Show all blanks</button>
          <button class="btn btn-primary" data-quiz-deck>Quiz this deck (${deckItems.length})</button>
        </div>
        <p class="muted" style="font-size:.9rem">Tap a blank to reveal it, and tap again to hide it.</p>
        <div class="slide-list">${slides}</div>`;
    };

    app.onclick = e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.deck) return go("notes", t.dataset.deck);
      if (t.dataset.key) { shown.has(t.dataset.key) ? shown.delete(t.dataset.key) : shown.add(t.dataset.key); }
      else if (t.dataset.all === "hide") shown.clear();
      else if (t.dataset.all === "show") deckItems.forEach(it => shown.add(it.key));
      else if (t.hasAttribute("data-quiz-deck")) return startQuiz(shuffle(deckItems.map(it => ({ ...it }))), "quiz");
      else return;
      const y = window.scrollY;
      draw();
      window.scrollTo(0, y);
    };
    draw();
  }

  // ---------- Quiz ----------
  function startQuiz(items, kind) {
    if (!items.length) return go("home");
    // marks[diagramId][labelIndex] = "first" (right first try) | "retry" (right after a miss) | "missed" (retry pending)
    quiz = { items, idx: 0, kind, results: [], answered: false, style: prefs.style, retryMissed: prefs.retryMissed, marks: {}, lastResult: null };
    renderQuestion();
    window.scrollTo(0, 0);
  }

  function renderQuestion() {
    const it = quiz.items[quiz.idx];
    quiz.answered = false;
    quiz.current = { choices: null };
    quiz.lastResult = null;
    const n = quiz.items.length;
    const firstTries = quiz.results.filter(r => !r.item.retry);
    const correctSoFar = firstTries.filter(r => r.correct).length;
    const retriesLeft = quiz.items.slice(quiz.idx).filter(x => x.retry).length;
    const head = `
      <div class="quiz-head">
        <div class="progress">
          <div class="progress-text"><span>Question ${quiz.idx + 1} of ${n}${retriesLeft ? ` · ${retriesLeft} to retry` : ""}</span><span>${correctSoFar} of ${firstTries.length} right first try</span></div>
          <div class="bar"><span style="width:${quiz.idx / n * 100}%"></span></div>
        </div>
        ${it.type === "label" || it.type === "find" ? `<button class="chip" data-toggle-answered aria-pressed="${prefs.showAnswered}" title="Color the labels you've already answered">Show answered</button>` : ""}
        <button class="btn btn-ghost" data-quit>End</button>
      </div>`;
    const retryTag = it.retry ? ` · <span class="retry-tag">Retry</span>` : "";

    if (it.type === "fill") {
      const deck = DECK[it.deck], slide = deck.slides[it.si];
      let body;
      if (quiz.style === "choose") {
        quiz.current.choices = fillChoices(it);
        body = choicesHTML(quiz.current.choices);
      } else {
        body = `<form class="answer-row" id="answer-form" autocomplete="off">
            <input class="answer-input" id="answer" type="text" placeholder="Fill in the blank…" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Your answer">
            <button class="btn btn-primary" type="submit">Check</button>
          </form>
          <div class="panel-actions"><button class="btn btn-ghost" data-giveup>I don't know</button></div>`;
      }
      app.innerHTML = `${head}
        <div class="quiz-layout">
          <section class="card panel">
            <div class="topic-tag">${esc(deck.title)} · Slide notes${retryTag}</div>
            <div class="slide-title">${esc(slide.title)}</div>
            <div class="prompt fill-sentence" id="sentence">${fillSentence(it, `<span class="fill-blank">?</span>`)}</div>
            ${body}
            <div id="feedback"></div>
          </section>
        </div>`;
    } else if (it.type === "mc") {
      const opts = it.q.options();
      quiz.current.choices = opts;
      app.innerHTML = `${head}
        <div class="quiz-layout">
          <section class="card panel">
            <div class="topic-tag">${TOPIC_NAME[it.q.topic]}${retryTag}</div>
            <div class="prompt">${it.q.q}</div>
            ${choicesHTML(opts)}
            <div id="feedback"></div>
          </section>
        </div>`;
    } else {
      const d = DIAG[it.d];
      const term = d.labels[it.i].term;
      let body;
      if (it.type === "label") {
        const noun = d.noun;
        const prompt = `Name the highlighted ${noun} <strong>#${it.i + 1}</strong>.`;
        if (quiz.style === "choose") {
          let pool = [...new Set(d.labels.map(l => l.term))].filter(t => t !== term);
          if (d.id === "planes") pool = pool.concat("Parasagittal plane");
          const opts = shuffle([term, ...sample(pool, 3)]);
          quiz.current.choices = opts;
          body = `<div class="prompt">${prompt}</div>${choicesHTML(opts.map(shortName))}`;
        } else {
          body = `<div class="prompt">${prompt}</div>
            <form class="answer-row" id="answer-form" autocomplete="off">
              <input class="answer-input" id="answer" type="text" placeholder="Type the term…" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Your answer">
              <button class="btn btn-primary" type="submit">Check</button>
            </form>
            <div class="panel-actions"><button class="btn btn-ghost" data-giveup>I don't know</button></div>`;
        }
      } else {
        body = `<div class="prompt">Tap the label for <strong>${esc(shortName(term))}</strong>.</div>
          <div class="panel-actions"><button class="btn btn-ghost" data-giveup>I don't know</button></div>`;
      }
      app.innerHTML = `${head}
        <div class="quiz-layout has-figure">
          <div id="figure">${quizFigure(it)}</div>
          <section class="card panel">
            <div class="topic-tag">${esc(d.title)} · ${MODES[it.type].name}${retryTag}</div>
            ${body}
            <div id="feedback"></div>
            ${it.type === "label" && quiz.style === "type" ? `<div class="hint">Press Enter to check. Small spelling slips still count.</div>` : ""}
          </section>
        </div>`;
      const target = app.querySelector(".blank.target");
      if (target) target.scrollIntoView({ block: "nearest", inline: "center" });
    }

    const input = app.querySelector("#answer");
    if (input && window.matchMedia("(hover: hover)").matches) input.focus();

    app.onclick = onQuizClick;
    const form = app.querySelector("#answer-form");
    if (form) form.onsubmit = e => { e.preventDefault(); submitTyped(); };
  }

  function choicesHTML(opts) {
    return `<div class="choices">${opts.map((o, i) =>
      `<button class="choice" data-choice="${i}"><span class="key">${i + 1}</span><span>${esc(o)}</span></button>`).join("")}</div>`;
  }

  // Figure for a diagram question. With "Show answered" on, labels answered earlier
  // in this session are colored by how they went, like a worksheet being filled in.
  // Missed labels stay unnamed until their retry is answered correctly.
  function quizFigure(it, result) {
    const d = DIAG[it.d];
    const term0 = d.labels[it.i].term;
    const isTarget = i => d.labels[i].term === term0; // every spot of the asked term
    const marks = prefs.showAnswered ? (quiz.marks[d.id] || {}) : {};
    const legend = prefs.showAnswered ? `<div class="legend">
      <span><i class="sw prev-good"></i>Right first try</span>
      ${quiz.retryMissed ? `<span><i class="sw prev-retry"></i>Right on retry</span>` : ""}
      <span><i class="sw prev-missed"></i>${quiz.retryMissed ? "Missed (coming back)" : "Missed"}</span></div>` : "";
    return figureHTML(d, {
      footer: legend,
      clickable: it.type === "find" && !quiz.answered,
      state: i => {
        const term = shortName(d.labels[i].term);
        if (result) {
          if (isTarget(i)) return { cls: result.correct ? "correct" : "wrong", text: term };
          if (result.clicked === i) return { cls: "wrong", text: term };
        }
        if (i === it.i && it.type === "label") return { cls: "target" };
        if (isTarget(i)) return {}; // don't hint a retry's spot
        if (marks[i] === "first") return { cls: "prev-good", text: term };
        if (marks[i] === "retry") return { cls: "prev-retry", text: term };
        if (marks[i] === "missed") return quiz.retryMissed ? { cls: "prev-missed" } : { cls: "prev-missed", text: term };
        return {};
      },
    });
  }

  function onQuizClick(e) {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-quit")) return finishQuiz();
    if (t.hasAttribute("data-next")) return nextQuestion();
    if (t.hasAttribute("data-toggle-answered")) {
      prefs.showAnswered = !prefs.showAnswered;
      store.set(PREFS_KEY, prefs);
      t.setAttribute("aria-pressed", prefs.showAnswered);
      const it = quiz.items[quiz.idx];
      app.querySelector("#figure").innerHTML = quizFigure(it, quiz.lastResult);
      return;
    }
    if (quiz.answered) return;
    const it = quiz.items[quiz.idx];
    if (t.hasAttribute("data-giveup")) return answer(false, { gaveUp: true });
    if (t.dataset.choice != null) {
      const picked = quiz.current.choices[+t.dataset.choice];
      const correctAnswer = it.type === "mc" ? it.q.answer : it.type === "fill" ? fillBlank(it).answers[0] : DIAG[it.d].labels[it.i].term;
      return answer(picked === correctAnswer, { pickedIdx: +t.dataset.choice, picked });
    }
    if (t.dataset.blank != null && it.type === "find") {
      const i = +t.dataset.blank;
      const d = DIAG[it.d];
      return answer(d.labels[i].term === d.labels[it.i].term, { clicked: i });
    }
  }

  function submitTyped() {
    if (quiz.answered) return;
    const input = app.querySelector("#answer");
    const val = input.value.trim();
    if (!val) { input.focus(); return; }
    const it = quiz.items[quiz.idx];
    if (it.type === "fill") {
      const m = matchFill(val, fillBlank(it).answers);
      return answer(!!m, { typed: val, close: m === "close" });
    }
    const d = DIAG[it.d];
    const term = d.labels[it.i].term;
    const m = matchTerm(val, term, d);
    let otherLabel = null;
    if (!m) {
      const j = d.labels.findIndex(l => l.term !== term && matchTerm(val, l.term, d) === "exact");
      if (j >= 0) otherLabel = { term: d.labels[j].term, num: j + 1 };
    }
    answer(!!m, { typed: val, close: m === "close", otherLabel });
  }

  function answer(correct, info) {
    quiz.answered = true;
    const it = quiz.items[quiz.idx];
    record(it.key, correct);
    quiz.results.push({ item: it, correct });

    // Missed questions come back a few questions later (or right away at the end).
    const RETRY_GAP = 3;
    if (!correct && quiz.retryMissed) {
      const at = Math.min(quiz.idx + 1 + RETRY_GAP, quiz.items.length);
      quiz.items.splice(at, 0, { ...it, retry: true });
    }
    if (it.type === "label" || it.type === "find") {
      const marks = (quiz.marks[it.d] ||= {});
      const mark = !correct ? "missed" : it.retry || marks[it.i] === "missed" ? "retry" : "first";
      spotsOf(DIAG[it.d], DIAG[it.d].labels[it.i].term).forEach(i => (marks[i] = mark));
    }

    let term, meaning, extra = "";
    if (it.type === "fill") {
      term = fillBlank(it).answers[0];
      app.querySelector("#sentence").innerHTML = fillSentence(it,
        `<span class="fill-blank ${correct ? "good" : "bad"}">${esc(term)}</span>`);
      app.querySelectorAll(".choice").forEach((b, i) => {
        b.disabled = true;
        if (quiz.current.choices[i] === term) b.classList.add("correct");
        else if (i === info.pickedIdx) b.classList.add("wrong");
      });
      const input = app.querySelector("#answer");
      if (input) input.disabled = true;
      app.querySelectorAll("#answer-form button").forEach(b => (b.disabled = true));
      app.querySelectorAll(".panel-actions").forEach(el => el.remove());
      if (info.typed && !correct) extra = `You wrote “${esc(info.typed)}”.`;
    } else if (it.type === "mc") {
      term = it.q.answer;
      meaning = it.q.explain;
      app.querySelectorAll(".choice").forEach((b, i) => {
        b.disabled = true;
        const val = quiz.current.choices[i];
        if (val === it.q.answer) b.classList.add("correct");
        else if (i === info.pickedIdx) b.classList.add("wrong");
      });
    } else {
      const d = DIAG[it.d];
      term = d.labels[it.i].term;
      meaning = meaningOf(term);
      if (it.type === "label") {
        if (quiz.current.choices) {
          app.querySelectorAll(".choice").forEach((b, i) => {
            b.disabled = true;
            if (quiz.current.choices[i] === term) b.classList.add("correct");
            else if (i === info.pickedIdx) b.classList.add("wrong");
          });
        }
        const input = app.querySelector("#answer");
        if (input) input.disabled = true;
        app.querySelectorAll("#answer-form button").forEach(b => (b.disabled = true));
      }
      if (info.clicked != null && !correct) {
        extra = `You tapped <strong>${esc(shortName(d.labels[info.clicked].term))}</strong> (${esc(meaningOf(d.labels[info.clicked].term))}).`;
      }
      if (info.otherLabel) {
        extra = `${esc(info.otherLabel.term)} is #${info.otherLabel.num} on this diagram (${esc(meaningOf(info.otherLabel.term))}).`;
      } else if (info.typed && !correct) {
        extra = `You wrote “${esc(info.typed)}”.`;
      }
      quiz.lastResult = { correct, clicked: info.clicked };
      app.querySelector("#figure").innerHTML = quizFigure(it, quiz.lastResult);
      app.querySelectorAll(".panel-actions, .hint").forEach(el => el.remove());
    }

    const verdict = correct ? (info.close ? "Correct, but check the spelling" : "Correct!") : info.gaveUp ? "Here's the answer" : "Not quite";
    const showTerm = it.type !== "mc" || !correct || it.q.explain;
    app.querySelector("#feedback").innerHTML = `
      <div class="feedback ${correct ? "good" : "bad"}" role="status">
        <div class="verdict">${verdict}</div>
        ${it.type === "fill" ? (correct ? "" : `<div>Answer: <strong>${esc(term)}</strong></div>`) : ""}
        ${showTerm && it.type !== "fill" ? `<div>${it.type === "mc" ? (meaning ? esc(meaning) : `Answer: <strong>${esc(term)}</strong>`) : `<strong>${esc(term)}</strong>${meaning ? `: ${esc(meaning)}` : ""}`}</div>` : ""}
        ${info.close ? `<div class="note">Spelled: <strong>${esc(term)}</strong></div>` : ""}
        ${extra ? `<div class="note">${extra}</div>` : ""}
        ${!correct && quiz.retryMissed ? `<div class="note">This one will come back in a few questions.</div>` : ""}
      </div>
      <div class="panel-actions">
        <button class="btn btn-primary" data-next>${quiz.idx + 1 < quiz.items.length ? "Next" : "See results"}</button>
      </div>`;
    const next = app.querySelector("[data-next]");
    next.focus({ preventScroll: true });
  }

  function nextQuestion() {
    quiz.idx++;
    if (quiz.idx >= quiz.items.length) return finishQuiz();
    renderQuestion();
  }

  function finishQuiz() {
    const results = quiz.results;
    quiz = null;
    go("results", results);
  }

  document.addEventListener("keydown", e => {
    if (!quiz || e.metaKey || e.ctrlKey || e.altKey) return;
    if (quiz.answered && e.key === "Enter" && document.activeElement?.tagName !== "BUTTON") {
      e.preventDefault();
      nextQuestion();
    } else if (!quiz.answered && /^[1-4]$/.test(e.key) && document.activeElement?.tagName !== "INPUT") {
      const b = app.querySelector(`[data-choice="${+e.key - 1}"]`);
      if (b) b.click();
    }
  });

  // ---------- Results ----------
  function renderResults(results) {
    if (!results || !results.length) return go("home");
    const firstTries = results.filter(r => !r.item.retry);
    const right = firstTries.filter(r => r.correct).length;
    const pct = Math.round(right / firstTries.length * 100);
    const missed = firstTries.filter(r => !r.correct);
    const retried = results.length - firstTries.length;
    const msg = pct === 100 ? "Perfect score! 🎉" : pct >= 90 ? "Excellent work!" : pct >= 75 ? "Nice job. Almost there." : pct >= 50 ? "Good start. Review the ones below and try again." : "Keep going. Try the study view, then quiz again.";

    const missedHTML = missed.map(({ item }) => {
      if (item.type === "fill") {
        return `<li><div class="t">${fillSentence(item, `<span class="fill-blank good">${esc(fillBlank(item).answers[0])}</span>`)}</div>
          <div class="m">${esc(DECK[item.deck].title)} · ${esc(DECK[item.deck].slides[item.si].title)}</div></li>`;
      }
      if (item.type === "mc") {
        return `<li><div class="t">${item.q.q}</div><div class="m">Answer: ${esc(item.q.answer)}</div></li>`;
      }
      const term = DIAG[item.d].labels[item.i].term;
      return `<li><div class="t">${esc(term)} <span class="muted" style="font-weight:400">· ${esc(DIAG[item.d].title)}</span></div><div class="m">${esc(meaningOf(term))}</div></li>`;
    }).join("");

    app.innerHTML = `
      <div class="quiz-layout">
        <section class="card">
          <div class="muted">You scored</div>
          <div class="score-big">${pct}%</div>
          <p>${right} of ${firstTries.length} right on the first try${retried ? `, plus ${retried} retr${retried === 1 ? "y" : "ies"}` : ""}. ${msg}</p>
          <div class="btn-row">
            ${missed.length ? `<button class="btn btn-primary" data-retry>Retry the ${missed.length} missed</button>` : ""}
            <button class="btn" data-action="home">Back to home</button>
          </div>
        </section>
        ${missed.length ? `<section class="card"><h2>Review these</h2><ul class="missed-list">${missedHTML}</ul></section>` : ""}
      </div>`;

    app.onclick = e => {
      if (e.target.closest("[data-retry]")) startQuiz(shuffle(missed.map(r => r.item)), "retry");
    };
  }

  go("home");
})();
