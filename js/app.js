(() => {
  "use strict";

  const app = document.getElementById("app");
  const DIAGRAMS = window.DIAGRAMS;
  const GLOSSARY = window.GLOSSARY;
  const ALIASES = window.ALIASES || {};
  const DIAG = Object.fromEntries(DIAGRAMS.map(d => [d.id, d]));

  const TOPICS = [
    { id: "anterior", name: "Anterior landmarks" },
    { id: "posterior", name: "Posterior landmarks" },
    { id: "planes", name: "Body planes" },
    { id: "cavities", name: "Body cavities" },
  ];
  const TOPIC_NAME = Object.fromEntries(TOPICS.map(t => [t.id, t.name]));

  const MODES = {
    label:   { name: "Label it", desc: "A label is highlighted on the diagram. Name it." },
    find:    { name: "Find it", desc: "You're given a term. Tap where it goes on the diagram." },
    concept: { name: "Concepts", desc: "Multiple-choice questions on meanings, planes and cavities." },
    mix:     { name: "Mix", desc: "All three question types, shuffled." },
  };

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
  const STATS_KEY = "bioquiz.stats.v1";
  const PREFS_KEY = "bioquiz.prefs.v1";
  let stats = store.get(STATS_KEY, {});
  let prefs = Object.assign(
    { topics: ["anterior", "posterior", "planes", "cavities"], mode: "label", style: "type", length: "20", showAnswered: true, retryMissed: true },
    store.get(PREFS_KEY, {})
  );

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
  const labelKey = (dId, i) => `L:${dId}:${DIAG[dId].labels[i].term}`;

  const LABEL_ITEMS = DIAGRAMS.flatMap(d => d.labels.map((_, i) => ({ d: d.id, i, key: labelKey(d.id, i), topic: d.id })));

  const QUESTIONS = buildQuestions();

  function buildQuestions() {
    const qs = [];
    const regionTerms = Object.keys(GLOSSARY).filter(t => GLOSSARY[t].side);
    for (const term of regionTerms) {
      const { meaning, side } = GLOSSARY[term];
      const topic = side === "both" ? "anterior" : side;
      const others = regionTerms.filter(t => t !== term);
      qs.push({
        id: `mean:${term}`, topic,
        q: `What does the term <strong>${esc(term)}</strong> refer to?`,
        answer: meaning,
        options: () => shuffle([meaning, ...sample(others, 3).map(meaningOf)]),
        explain: `${term}: ${meaning}.`,
      });
      qs.push({
        id: `term:${term}`, topic,
        q: `Which region is the <strong>${esc(meaning)}</strong>?`,
        answer: term,
        options: () => shuffle([term, ...sample(others, 3)]),
        explain: `${term}: ${meaning}.`,
      });
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
        id: `q:${c.id}`, topic: c.topic, q: esc(c.q), answer: c.a[0],
        options: () => shuffle(c.a),
        explain: c.explain || "",
      });
    }
    return qs;
  }
  const QUESTION_BY_KEY = Object.fromEntries(QUESTIONS.map(q => [`Q:${q.id}`, q]));

  const labelKeysForTopic = topic => LABEL_ITEMS.filter(it => it.topic === topic).map(it => it.key);

  // ---------- Answer checking ----------
  const STOP_WORDS = /\b(the|region|cavity|plane|body|area)\b/g;
  const normalize = s => s.toLowerCase().replace(/\(.*?\)/g, m => " " + m.slice(1, -1) + " ")
    .replace(STOP_WORDS, " ").replace(/[^a-z]/g, "");

  function acceptedForms(term) {
    const forms = new Set([normalize(term), ...(ALIASES[term] || []).map(normalize)]);
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
  function matchTerm(input, term) {
    const n = normalize(input);
    if (!n) return false;
    const forms = acceptedForms(term);
    if (forms.includes(n)) return "exact";
    for (const f of forms) {
      const allowed = f.length >= 9 ? 2 : f.length >= 5 ? 1 : 0;
      if (allowed && editDistance(n, f) <= allowed) return "close";
    }
    return false;
  }

  // ---------- Session building ----------
  function buildSession({ topics, mode, length }) {
    const labelItems = LABEL_ITEMS.filter(it => topics.includes(it.topic));
    const mcItems = QUESTIONS.filter(q => topics.includes(q.topic)).map(q => ({ type: "mc", key: `Q:${q.id}`, q }));
    const limit = length === "all" ? Infinity : Number(length);
    const topicOrder = it => topics.indexOf(it.topic);

    let items;
    if (mode === "label" || mode === "find") {
      // Keep each diagram's questions together so the picture doesn't jump around.
      items = sample(labelItems, limit)
        .sort((a, b) => topicOrder(a) - topicOrder(b))
        .map(it => ({ ...it, type: mode }));
      items = regroupShuffled(items);
    } else if (mode === "concept") {
      items = sample(mcItems, limit);
    } else {
      const diagramItems = labelItems.map(it => ({ ...it, type: Math.random() < .5 ? "label" : "find" }));
      items = sample([...diagramItems, ...mcItems], limit);
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
      const layout = l.h > l.w * 2 ? " vertical" : l.h * d.height / 100 < 26 ? " single" : "";
      const text = st.text != null ? esc(st.text) : `<span class="num">${i + 1}</span>`;
      const label = st.text != null ? st.text : `Label ${i + 1}`;
      return `<button type="button" class="blank${layout} ${st.cls || ""}${opts.clickable ? " clickable" : ""}"
        data-blank="${i}" aria-label="${esc(label)}" ${opts.clickable ? "" : 'tabindex="-1"'}
        style="left:${l.x}%;top:${l.y}%;${layout === " single" ? "min-width" : "width"}:${l.w}%;height:${l.h}%">${text}</button>`;
    }).join("");
    return `<div class="figure-wrap"><div class="figure" style="--ar:${d.width / d.height};--fs:calc(1150cqw / ${d.width})">
      <img src="${d.image}" width="${d.width}" height="${d.height}" alt="${esc(d.title)} diagram">
      ${blanks}</div>${opts.footer || ""}</div>`;
  }

  // ---------- Router ----------
  let quiz = null; // active quiz state

  function go(screen, arg) {
    if (screen !== "quiz") quiz = null;
    ({ home: renderHome, study: renderStudy, results: renderResults }[screen] || renderHome)(arg);
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", e => {
    if (e.target.closest('[data-action="home"]')) go("home");
  });

  // ---------- Home ----------
  function renderHome() {
    const weakKeys = Object.keys(stats).filter(isWeak);
    const weakNames = weakKeys.map(k => k.startsWith("L:") ? k.split(":").slice(2).join(":") : null).filter(Boolean);
    const uniqueWeak = [...new Set(weakNames)];
    const weakConcepts = weakKeys.length - weakNames.length;

    const tiles = TOPICS.map(t => {
      const keys = labelKeysForTopic(t.id);
      const done = keys.filter(isMastered).length;
      const pct = Math.round(done / keys.length * 100);
      return `<button class="tile" data-study="${t.id}">
        <div class="tile-img"><img src="${DIAG[t.id].image}" alt=""></div>
        <div class="tile-name">${t.name}</div>
        <div class="bar"><span style="width:${pct}%"></span></div>
        <div class="tile-progress">${done} / ${keys.length} labels mastered</div>
      </button>`;
    }).join("");

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
        <h1>Body landmarks, planes &amp; cavities</h1>
        <p>Study the diagrams, then quiz yourself. Terms you miss come back until you get them right twice in a row.</p>
      </section>
      <div class="home-grid">
        <div>
          <section class="card">
            <h2>Study the diagrams</h2>
            <p class="muted" style="font-size:.92rem">Tap a label to hide it or show it and test yourself.</p>
            <div class="study-tiles">${tiles}</div>
          </section>
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
          <div class="field" ${prefs.mode === "label" || prefs.mode === "mix" ? "" : "hidden"}>
            <span class="field-label">How to answer "Label it" questions</span>
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
      const tabs = TOPICS.map(t =>
        `<button class="tab" role="tab" data-tab="${t.id}" aria-selected="${t.id === d.id}">${t.name}</button>`).join("");
      const glossary = d.labels.map((l, i) =>
        `<li><button data-row="${i}"><span class="n">${i + 1}</span><span class="t">${esc(l.term)}</span><span class="m">${esc(meaningOf(l.term))}</span></button></li>`).join("");

      app.innerHTML = `
        <div class="tabs" role="tablist">${tabs}</div>
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
        if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      flashIdx = -1;
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
        return startQuiz(buildSession({ topics: [d.id], mode: t.dataset.quiz, length: "all" }), "quiz");
      } else return;
      draw();
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
        ${it.type !== "mc" ? `<button class="chip" data-toggle-answered aria-pressed="${prefs.showAnswered}" title="Color the labels you've already answered">Show answered</button>` : ""}
        <button class="btn btn-ghost" data-quit>End</button>
      </div>`;
    const retryTag = it.retry ? ` · <span class="retry-tag">Retry</span>` : "";

    if (it.type === "mc") {
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
        const noun = d.id === "planes" ? "plane" : d.id === "cavities" ? "label" : "region";
        const prompt = `Name the highlighted ${noun} <strong>#${it.i + 1}</strong>.`;
        if (quiz.style === "choose") {
          let pool = d.labels.map(l => l.term).filter(t => t !== term);
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
            <div class="topic-tag">${TOPIC_NAME[d.id]} · ${MODES[it.type].name}${retryTag}</div>
            ${body}
            <div id="feedback"></div>
            ${it.type === "label" && quiz.style === "type" ? `<div class="hint">Press Enter to check. Small spelling slips still count.</div>` : ""}
          </section>
        </div>`;
      const target = app.querySelector(".blank.target");
      if (target) target.scrollIntoView({ block: "nearest" });
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
          if (i === it.i) return { cls: result.correct ? "correct" : "wrong", text: term };
          if (result.clicked === i) return { cls: "wrong", text: term };
        }
        if (i === it.i) return it.type === "label" ? { cls: "target" } : {}; // don't hint a retry's spot
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
      const correctAnswer = it.type === "mc" ? it.q.answer : DIAG[it.d].labels[it.i].term;
      return answer(picked === correctAnswer, { pickedIdx: +t.dataset.choice, picked });
    }
    if (t.dataset.blank != null && it.type === "find") {
      const i = +t.dataset.blank;
      return answer(i === it.i, { clicked: i });
    }
  }

  function submitTyped() {
    if (quiz.answered) return;
    const input = app.querySelector("#answer");
    const val = input.value.trim();
    if (!val) { input.focus(); return; }
    const it = quiz.items[quiz.idx];
    const term = DIAG[it.d].labels[it.i].term;
    const m = matchTerm(val, term);
    let otherLabel = null;
    if (!m) {
      const d = DIAG[it.d];
      const j = d.labels.findIndex((l, k) => k !== it.i && matchTerm(val, l.term) === "exact");
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
    if (it.type !== "mc") {
      const marks = (quiz.marks[it.d] ||= {});
      marks[it.i] = !correct ? "missed" : it.retry || marks[it.i] === "missed" ? "retry" : "first";
    }

    let term, meaning, extra = "";
    if (it.type === "mc") {
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
      if (info.clicked != null && info.clicked !== it.i) {
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
        ${showTerm ? `<div>${it.type === "mc" ? (meaning ? esc(meaning) : `Answer: <strong>${esc(term)}</strong>`) : `<strong>${esc(term)}</strong>${meaning ? `: ${esc(meaning)}` : ""}`}</div>` : ""}
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
      if (item.type === "mc") {
        return `<li><div class="t">${item.q.q}</div><div class="m">Answer: ${esc(item.q.answer)}</div></li>`;
      }
      const term = DIAG[item.d].labels[item.i].term;
      return `<li><div class="t">${esc(term)} <span class="muted" style="font-weight:400">· ${esc(TOPIC_NAME[item.d])}</span></div><div class="m">${esc(meaningOf(term))}</div></li>`;
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
