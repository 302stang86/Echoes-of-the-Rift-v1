/* Echoes of the Rift v2 — the single-screen hub. */
(function () {
  "use strict";
  const R = Rift2;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const app = $("#app"), dlg = $("#dlg"), toastEl = $("#toast");
  let S = R.read(localStorage);
  let selected = S ? S.loc : "camp";
  let sceneSel = null, toastTimer = 0, serial = 0;

  /* ---------- helpers ---------- */
  function panel(id, cls = "") {
    const a = window.ART[id];
    if (!a) return "";
    const clip = "clip" + ++serial;
    return `<figure class="art-panel ${cls}"><svg viewBox="${a.box.join(" ")}" role="img" aria-label="${esc(a.title)}"><title>${esc(a.title)}</title><defs><clipPath id="${clip}"><rect x="${a.box[0]}" y="${a.box[1]}" width="${a.box[2]}" height="${a.box[3]}"/></clipPath></defs><image clip-path="url(#${clip})" href="assets/art/${a.sheet}" width="${a.width || 1376}" height="${a.height || 768}"/></svg></figure>`;
  }
  function toast(t, ms = 3600) {
    if (!t) return;
    toastEl.textContent = t; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (toastEl.hidden = true), ms);
  }
  function save() { if (S && !R.write(localStorage, S)) toast("Browser storage is unavailable. Export a backup from Pack so you do not lose progress.", 6000); }
  // buttons: [label, fn, className, keepOpen]
  function modal(title, body, buttons = [], opts = {}) {
    dlg.className = opts.wide ? "wide" : "";
    dlg.innerHTML = `<h2>${title}</h2><div class="dlg-body">${body}</div><div class="dlg-actions"></div>`;
    for (const [label, fn, cls, keep] of buttons) {
      const b = document.createElement("button");
      b.textContent = label; if (cls) b.className = cls;
      b.onclick = () => { if (!keep) dlg.close(); if (fn) fn(); };
      $(".dlg-actions", dlg).append(b);
    }
    dlg.oncancel = opts.locked ? (e) => e.preventDefault() : null;
    if (!dlg.open) dlg.showModal();
    return dlg;
  }
  const closeModal = () => { if (dlg.open) dlg.close(); };
  const hhmm = (h) => String(h).padStart(2, "0") + ":00";

  // Run one game action, then save, redraw and react to whatever happened.
  function commit(fn) {
    const q = S.quest, c = S.collapses;
    const msg = fn();
    save(); render();
    if (S.collapses !== c) showCollapse();
    else if (S.encounter) showEncounter(msg);
    else if (S.pending) { const id = S.pending; S.pending = null; save(); showBeat(id); }
    else if (msg) toast(msg);
    if (S.quest !== q && S.quest === 6) toast("The signal is live. The valley is yours to explore.", 6000);
  }

  /* ---------- title and prologue ---------- */
  function renderTitle() {
    const manual = R.read(localStorage, R.MANUAL_KEY);
    app.innerHTML = `<main class="title"><div class="title-box"><div class="eyebrow">A story-first survival adventure</div><h1>ECHOES<br>OF THE <em>RIFT</em></h1><p>Created by Mitch Peebles</p><p>The world you knew is gone.<br>The one before you remembers nothing of it.</p>
      <form id="new"><label for="nm">YOUR NAME IN THIS WORLD</label><input id="nm" type="text" maxlength="24" placeholder="Enter your name" autocomplete="given-name" required>
      <button class="primary" type="submit">Begin your story →</button>
      <button type="button" id="cont" ${S ? "" : "hidden"}>Continue · Day ${S ? S.day : ""}</button>
      <button type="button" id="load" ${manual ? "" : "hidden"}>Load saved game</button></form></div></main>`;
    $("#cont").onclick = () => { selected = S.loc; render(); };
    $("#load").onclick = () => modal("Load saved game?", "<p>This replaces your current autosave with your manual save.</p>", [["Load it", () => { S = manual; selected = S.loc; save(); render(); }, "primary"], ["Cancel"]]);
    $("#new").onsubmit = (e) => {
      e.preventDefault();
      const begin = () => { S = R.fresh($("#nm").value); selected = "camp"; save(); render(); };
      if (S) modal("Begin a new journey?", "<p>This replaces your autosave. Export a backup from Pack first if you want to keep it.</p>", [["Begin new journey", begin, "primary"], ["Keep current journey"]]);
      else begin();
    };
  }
  function storyScenes() {
    const n = esc(S.name);
    return [
      { tag: "ACT I · THE WORLD YOU KNEW", title: "The Collapse", text: `The afternoon sky turns a bruised purple. ${n}, 27, leaves an engineering lecture in a prized 1986 Ford Foxbody Mustang GT, racing toward another gas-station night shift. Then the highway tears apart. The Mustang slides into the fissure. Daylight vanishes under hundreds of feet of concrete.`, choice: "Pry open the crushed door", note: "The flashlight cuts through smoke. Somewhere beneath the wreckage, a woman calls for help." },
      { tag: "ACT I · MAYA LIN", title: "A voice in the rubble", text: `Using the multi-tool and every trick learned under a Mustang’s hood, ${n} shifts the debris. Maya Lin, 21, is trapped beneath a reinforced slab. Her hand reaches through the dust.`, choice: "Free Maya from the rubble", note: "Maya is alive. You find coats, rations, rope, copper wire, and a crowbar in the abandoned cars." },
      { tag: "ACT II · THREE DAYS BELOW", title: "The Anomaly", text: "A violet sphere pulses above a perfect circle of clean earth. Around it, cars are sliced in half. The fumes stop at its edge. For three days, you and Maya scavenge the underground graveyard. On the fourth night, the ceiling begins to collapse. Inside the sphere, pine trees sway beneath a blue sky.", choice: "Take Maya’s hand. Enter the rift.", note: "The smoke disappears. Cool air fills your lungs. Behind you, the rift snaps shut." },
      { tag: "ACT III · THE ANCIENT VALLEY", title: "A world before yours", text: "Pines tower above an untouched forest. A giant elk moves between the trunks. From somewhere farther away comes a call no living bird should make. Following the sound of water, you find a riverbank. There is no road home. But there is timber, clean water, and the stubborn possibility of tomorrow.", choice: "Establish the riverbank camp", note: "Your survival story begins." },
    ];
  }
  function renderStory() {
    const i = Math.min(S.prologue, 3), sc = storyScenes()[i];
    const panels = Array.from({ length: 5 }, (_, n) => panel("story-" + String(i * 5 + n + 1).padStart(2, "0"))).join("");
    app.innerHTML = `<main class="story"><div class="eyebrow">${sc.tag}</div><h1>${sc.title}</h1><div class="story-panels">${panels}</div><p class="story-text">${sc.text}</p><button class="primary" id="next">${sc.choice} →</button><p class="tiny muted" style="margin-top:12px">Scene ${i + 1} of 4</p></main>`;
    $("#next").onclick = () => {
      R.note(S, sc.note); S.prologue++; save();
      if (S.prologue >= 4) { render(); intro(); } else render();
    };
    window.scrollTo(0, 0);
  }
  function intro() {
    if (S.flags.intro) return;
    S.flags.intro = true; save();
    modal("How this works", `<p>Three things are always on screen.</p><div class="lines"><p><b>Next step</b>The banner at the top tells you what to do now, and the glowing pin on the map shows where.</p><p><b>Map</b>Pick a place, then Travel. Travel takes 2 hours.</p><p><b>Here</b>Everything you can do where you are standing, in one list.</p></div><p class="tiny">Hunger, thirst and cold rise slowly. If you collapse, Maya will find you.</p>`, [["Start at camp", null, "primary"]]);
  }

  /* ---------- the hub ---------- */
  function meter(label, v) {
    return `<div class="meter ${v < 30 ? "low" : ""}"><span>${label}<b>${v}</b></span><div class="bar"><i style="width:${v}%"></i></div></div>`;
  }
  function render() {
    if (!S) return renderTitle();
    if (S.prologue < 4) return renderStory();
    const goal = R.objective(S), here = R.place(S.loc), night = S.hour >= 19 || S.hour < 6;
    const sel = R.place(selected), lock = R.travelLock(S, sel.id);
    const actions = R.actionsFor(S);
    const pins = R.places.map((p) => {
      const cls = ["pin", R.travelLock(S, p.id) ? "locked" : "", p.id === S.loc ? "current" : "", p.id === selected ? "selected" : "", goal.place === p.id ? "goal-pin" : ""].join(" ");
      return `<button class="${cls}" data-pin="${p.id}" style="left:${(p.x / 1376) * 100}%;top:${(p.y / 768) * 100}%" aria-label="${esc(p.name)}${p.id === S.loc ? ", you are here" : ""}${R.travelLock(S, p.id) ? ", locked" : ""}">${p.id === S.loc ? "◆ " : goal.place === p.id ? "★ " : ""}${p.label}</button>`;
    }).join("");
    const travelBtn = `<button class="primary ${lock ? "locked" : ""}" id="go" ${lock ? 'aria-disabled="true"' : ""}>Travel to ${esc(sel.name)} · ${R.travelHours(S, sel.id)} hours</button>`;
    app.innerHTML = `
    <header class="top"><span class="brand">ECHOES OF THE RIFT</span><span class="clock">${night ? "☾" : "☀"} Day ${S.day} · ${hhmm(S.hour)}</span>
      <div class="meters">${meter("Health", S.health)}${meter("Food", S.food)}${meter("Water", S.water)}${meter("Warmth", S.warmth)}</div>
      <div class="row"><button id="eat" aria-label="Eat">Eat</button><button id="drink" aria-label="Drink">Drink</button><button id="pack">Pack</button><button id="journal">Journal</button><button id="menu">Menu${S.cheats.everUsed ? " · cheats used" : ""}</button></div></header>
    <main class="hub">
      <section class="card goal" aria-label="Next step"><div><div class="eyebrow">Next step · ${esc(goal.title)}</div><p>${esc(goal.text)}</p></div>${goal.place && goal.place !== selected ? `<button id="show-goal">Show on map ★</button>` : ""}</section>
      <section class="map-col" aria-label="Valley map"><div class="map"><img src="assets/art/valley-map.jpg" alt="Hand-painted prehistoric valley map" draggable="false">${pins}</div>
        ${sel.id === S.loc ? "" : `<div class="card selected-box"><div class="eyebrow">${esc(sel.kind)}</div><h3>${esc(sel.name)}</h3><p>${esc(sel.desc)}</p>${lock ? `<p class="tiny" style="color:var(--warn)">${esc(lock)}</p>` : ""}${travelBtn}</div>`}</section>
      <section class="card here" aria-label="What you can do here"><div class="here-art">${panel(here.art)}</div><div class="eyebrow">You are here</div><h2>${esc(here.name)}</h2><p>${esc(here.desc)}</p>
        <div class="actions">${actions.map((a, i) => a.info ? `<div class="note-line">${esc(a.label)}. ${esc(a.sub)}.</div>` : `<button class="act ${a.disabled ? "locked" : ""} ${a.glow ? "glow" : ""} ${a.quest ? "quest" : ""}" data-act="${i}" ${a.disabled ? 'aria-disabled="true"' : ""}>${esc(a.label)}<small>${esc(a.disabled || a.sub)}</small></button>`).join("")}</div></section>
      <section class="card log" aria-label="Recent events"><div class="eyebrow">Recent events</div><ol>${S.log.slice(0, 5).map((l) => `<li>${esc(l)}</li>`).join("")}</ol></section>
    </main>`;
    $$("[data-pin]").forEach((b) => (b.onclick = () => { selected = b.dataset.pin; render(); }));
    const go = $("#go"); if (go) go.onclick = () => (lock ? toast(lock) : commit(() => R.travel(S, selected)));
    const sg = $("#show-goal"); if (sg) sg.onclick = () => { selected = goal.place; render(); $(".map").scrollIntoView({ block: "center", behavior: "smooth" }); };
    $$("[data-act]").forEach((b) => (b.onclick = () => onAction(actions[+b.dataset.act])));
    $("#eat").onclick = () => commit(() => R.use(S, "eat"));
    $("#drink").onclick = () => commit(() => R.use(S, "drink"));
    $("#pack").onclick = showPack; $("#journal").onclick = showJournal; $("#menu").onclick = showMenu;
  }
  function onAction(a) {
    if (a.disabled) return toast(a.disabled);
    if (a.type === "build") return showBuild();
    if (a.type === "search") return showSearch();
    if (a.type === "ravine") return showRavine();
    if (a.type === "wire") return showWiring();
    if (a.type === "talk") return commit(() => R.talk(S));
    commit(() => R.act(S, a.type, a.id));
  }

  /* ---------- panels ---------- */
  function showBuild() {
    const chip = (k, n) => `<span class="chip ${(S.inv[k] || 0) >= n ? "ok" : "no"}">${n} ${R.names[k]} (${S.inv[k] || 0})</span>`;
    const rows = Object.entries(R.recipes).map(([id, r]) => {
      const lock = R.recipeLock(S, id), can = !lock && (S.cheats.freeCraft || R.can(S, r.cost));
      const html = `<article class="recipe">${panel(r.art)}<h3>${r.title}</h3><p>${r.desc}</p><div class="chips">${Object.entries(r.cost).map(([k, n]) => chip(k, n)).join("")}</div><button data-build="${id}" class="${can ? "primary" : ""}" ${can ? "" : 'aria-disabled="true"'}>${lock || (can ? "Build" : "Not enough materials")}</button></article>`;
      return { html, rank: can ? 0 : lock ? 2 : 1, lock };
    }).filter((r) => r.lock !== "Already built.").sort((a, b) => a.rank - b.rank);
    const open = rows.filter((r) => r.rank < 2).map((r) => r.html).join(""), later = rows.filter((r) => r.rank === 2);
    modal("Build and craft", `<p class="tiny">Each build takes 1 hour. Green means you have enough. Ready items come first.</p><div class="recipes">${open || "<p>Nothing else to build right now.</p>"}</div>${later.length ? `<details><summary>Not available yet · ${later.length}</summary><div class="recipes">${later.map((r) => r.html).join("")}</div></details>` : ""}`, [["Close"]], { wide: true });
    $$("[data-build]", dlg).forEach((b) => (b.onclick = () => {
      if (b.getAttribute("aria-disabled")) return toast(b.textContent);
      const id = b.dataset.build, q = S.quest, c = S.collapses; const msg = R.craft(S, id); save(); render();
      toast(msg); if (S.collapses !== c) { showCollapse(); return; }
      showBuild();
      if (S.quest !== q) { closeModal(); toast("Quest complete: " + R.quests[q].title + ". Next: " + R.objective(S).title + ".", 5000); }
    }));
  }
  function showPack() {
    const items = Object.entries(S.inv).filter(([, n]) => n > 0);
    const gear = [S.flags.spear && "Iron spear", S.flags.axe && "Iron axe", S.flags.coat ? "Winter coats" : "Canvas jacket"].filter(Boolean).join(" · ");
    const manual = R.read(localStorage, R.MANUAL_KEY);
    modal("Pack", `<div class="inv">${items.length ? items.map(([k, n]) => `<div>${R.names[k]}<b>${n}</b></div>`).join("") : "<p>Empty.</p>"}</div><p class="tiny">Equipped: ${gear}. There is no carry limit.</p>
      <details><summary>Save and backup</summary><p class="tiny">Progress autosaves in this browser after every action. A manual save is a separate checkpoint.</p><div class="row"><button id="msave">Save game</button><button id="mload" ${manual ? "" : 'aria-disabled="true"'}>Load saved game</button><button id="exp">Export backup</button></div><p class="tiny" style="margin-top:10px"><label for="imp">Import a backup (.json)</label></p><input id="imp" type="file" accept=".json,application/json"></details>`, [["Close"]]);
    $("#msave", dlg).onclick = () => toast(R.write(localStorage, S, R.MANUAL_KEY) ? "Game saved." : "Could not save in this browser.");
    $("#mload", dlg).onclick = () => { if (!manual) return toast("No manual save yet."); modal("Load saved game?", "<p>This replaces your current progress with your last manual save.</p>", [["Load it", () => { S = manual; selected = S.loc; save(); render(); toast("Loaded."); }, "primary"], ["Cancel", showPack]]); };
    $("#exp", dlg).onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" }));
      a.download = "echoes-of-the-rift-day-" + S.day + ".json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $("#imp", dlg).onchange = async (e) => {
      try {
        const data = JSON.parse(await e.target.files[0].text());
        if (!R.validate(data)) return toast("That file is not a valid version 2 save.", 5000);
        modal("Replace current progress?", "<p>Importing replaces your current journey with " + esc(data.name) + "’s save from Day " + data.day + ".</p>", [["Import", () => { S = data; selected = S.loc; save(); render(); toast("Save imported."); }, "primary"], ["Cancel"]]);
      } catch { toast("Could not read that file.", 5000); }
    };
  }
  function showJournal() {
    const q = R.quests.map((x, i) => `<div class="quest-row ${i < S.quest ? "done" : i === S.quest ? "now" : ""}"><b>${i < S.quest ? "✓" : i === S.quest ? "▶" : "·"}</b> ${x.title} <span class="tiny">— ${x.chapter}</span><br><span class="tiny">${i <= S.quest ? x.desc : "Not yet discovered."}</span></div>`).join("");
    const moments = ["blanket", "echo", "confession"].map((id) => S.beats[id] ? `<p><button data-memory="${id}">${R.beatTitles[id]}</button> <span class="tiny">Day ${S.beatDays[id]}</span></p>` : `<p class="tiny">◇ A moment with Maya is still to come.</p>`).join("");
    const finds = Object.keys(S.found).map((key) => { const [site, id] = key.split(":"); const o = window.SCENES[site]?.objects.find((x) => x.id === id); return o ? `<p><b>${esc(o.name)}</b> · ${esc(R.place(site).name)}<br><span class="tiny">${esc(o.text)}</span></p>` : ""; }).join("");
    const end = R.ending(S);
    modal("Journal", `<details open><summary>Quests</summary>${q}</details><details><summary>Moments with Maya</summary>${moments}${end ? `<p><button id="ending">${end.title} — view ending</button></p>` : ""}</details><details><summary>Things we found · ${Object.keys(S.found).length}</summary>${finds || "<p class=tiny>Search places on the map to uncover discoveries.</p>"}</details><details><summary>The collapse · read the prologue again</summary>${storyScenes().map((s) => `<p><b>${s.title}</b><br><span class="tiny">${s.text}</span></p>`).join("")}</details>`, [["Close"]], { wide: true });
    $$("[data-memory]", dlg).forEach((b) => (b.onclick = () => showBeat(b.dataset.memory, true)));
    const e = $("#ending", dlg); if (e) e.onclick = showEnding;
  }
  function showSearch() {
    const objs = R.sceneObjects(S), sc = window.SCENES[S.loc];
    if (!sceneSel || !objs.some((o) => o.id === sceneSel)) sceneSel = objs[0]?.id;
    const draw = () => {
      const o = objs.find((x) => x.id === sceneSel), found = R.isFound(S, o.id), why = found ? "" : R.objectReason(S, o), vis = R.objectVisible(S, o);
      const hot = objs.map((x, i) => `<button class="hot ${R.isFound(S, x.id) ? "found" : ""} ${x.id === sceneSel ? "sel" : ""} ${!R.objectVisible(S, x) ? "hidden" : ""}" data-obj="${x.id}" style="left:${x.x}%;top:${x.y}%" aria-label="Examine ${esc(R.objectVisible(S, x) ? x.name : "something hidden")}">${R.isFound(S, x.id) ? "✓" : R.objectVisible(S, x) ? i + 1 : "?"}</button>`).join("");
      const list = objs.map((x) => `<button data-obj="${x.id}" class="${x.id === sceneSel ? "sel" : ""}">${R.isFound(S, x.id) ? "✓ " : "◇ "}${esc(R.objectVisible(S, x) ? x.name : "Something hidden")}</button>`).join("");
      const loot = Object.keys(o.loot).length ? " · " + R.list(o.loot) : "";
      modal(esc(sc.title), `<p>${esc(sc.intro)}</p><div class="search-grid"><div><div class="scene">${panel(sc.art)}${hot}</div><div class="objs">${list}</div></div><div class="card"><h3>${esc(vis ? o.name : "Something is easy to overlook")}</h3><p>${vis ? esc(o.text) : "Maya’s eye may reveal it."}</p>${found ? '<p class="tiny" style="color:var(--ok)">Discovery recorded.</p>' : `<button class="primary ${why ? "locked" : ""}" id="do" ${why ? 'aria-disabled="true"' : ""}>${esc(o.verb)}${o.cost ? " · 1 hour" : ""}${esc(loot)}</button>${why ? `<p class="tiny" style="color:var(--warn);margin-top:6px">${esc(why)}</p>` : ""}`}</div></div>`, [["Close"]], { wide: true });
      $$("[data-obj]", dlg).forEach((b) => (b.onclick = () => { sceneSel = b.dataset.obj; draw(); }));
      const d = $("#do", dlg); if (d) d.onclick = () => { if (why) return toast(why); const c = S.collapses; const msg = R.search(S, o.id); save(); render(); if (S.collapses !== c) return showCollapse(); draw(); toast(msg); };
    };
    draw();
  }
  function showRavine() {
    let step = 0;
    modal("Signals in the Mist", `<p>Follow the cairns from northwest to southeast. Maya’s notes: east, south, east, south, south, east. A wrong turn costs warmth.</p><div class="trail">${Array.from({ length: 16 }, (_, i) => `<button data-cell="${i}" aria-label="Trail tile ${i + 1}">${i === 0 ? "START" : i === 15 ? "◈" : "·"}</button>`).join("")}</div><p id="pn" class="tiny">Begin one tile east of START.</p>`, [["Return to trailhead"]], { wide: false });
    $$("[data-cell]", dlg).forEach((b) => (b.onclick = () => {
      if (+b.dataset.cell === R.TRAIL[step]) {
        b.classList.add("chosen"); step++;
        if (step === R.TRAIL.length) { closeModal(); commit(() => R.discover(S, R.TRAIL)); }
      } else {
        S.warmth = Math.max(0, S.warmth - 5); save(); render();
        $("#pn", dlg).textContent = "The fog closes in. Warmth −5. Retrace the marked cairns.";
      }
    }));
  }
  function showWiring() {
    let step = 0;
    const label = { antenna: "Antenna", battery: "Battery", crystal: "Rift crystal", alternator: "Alternator" };
    modal("Bridge the eras", `<p>Connect the power circuit in engineering order: stored power → regulator → rift core → aerial.</p><div class="row">${["antenna", "battery", "crystal", "alternator"].map((x) => `<button data-wire="${x}">${label[x]}</button>`).join("")}</div><p id="wn" class="tiny" style="margin-top:10px">Choose the power source.</p>`, [["Step away"]]);
    $$("[data-wire]", dlg).forEach((b) => (b.onclick = () => {
      if (b.dataset.wire === R.CIRCUIT[step]) {
        b.disabled = true; step++;
        if (step === 4) { closeModal(); commit(() => R.signal(S, R.CIRCUIT)); }
      } else { step = 0; $$("[data-wire]", dlg).forEach((x) => (x.disabled = false)); $("#wn", dlg).textContent = "Circuit interrupted. Start again at the power source."; }
    }));
  }

  /* ---------- story moments, fights, collapse ---------- */
  function showBeat(id, replay) {
    const sc = R.beatScene(S, id), lines = sc.lines.map(([who, line]) => `<p><b>${esc(who)}</b>“${esc(line)}”</p>`).join("");
    const body = `${panel(sc.art)}<p style="margin-top:10px">${esc(sc.lead)}</p><div class="lines">${lines}</div>`;
    if (replay) {
      const chosen = sc.choices.find((c) => c[0] === S.beats[id]);
      return modal(sc.title + " · memory", body + `<p class="tiny" style="color:var(--accent)">Your choice: ${esc(chosen ? chosen[1] : "A moment shared.")}</p>`, [["Close memory"]]);
    }
    modal(sc.title, body, sc.choices.map(([c, label]) => [label, () => {
      commit(() => R.resolveBeat(S, id, c));
      if (id === "confession") showEnding();
    }, "primary"]), { locked: true });
  }
  function showEnding() {
    const e = R.ending(S); if (!e) return;
    modal(e.title, `${panel("frontier-20")}<p style="margin-top:10px;color:var(--ink)">${esc(e.text)}</p><p class="tiny">Free play continues. The valley is yours.</p>`, [["Continue your story", null, "primary"]]);
  }
  function showEncounter(msg) {
    const e = S.encounter; if (!e) return closeModal();
    const art = e.name.includes("bear") ? "frontier-04" : e.name.includes("bird") ? "frontier-12" : "frontier-02";
    const hit = S.flags.spear ? 24 : 12;
    modal(esc(e.name), `${panel(art)}<p style="margin-top:10px">Its health ${e.hp} / ${e.max}</p><div class="hpbar"><i style="width:${(e.hp / e.max) * 100}%"></i></div><p>Your health ${S.health} / 100${S.withMaya ? ` · Maya cuts incoming damage by ${R.support(S).damageReduction}` : ""}</p>${msg ? `<p style="color:var(--ink)">${esc(msg)}</p>` : ""}`, [
      [`Strike · ${hit} damage`, () => fightStep("attack"), "primary", true],
      [`Set a trap · 20 (${S.inv.trap || 0})`, () => fightStep("trap"), "", true],
      [`Crystal flare · 30 (${S.inv.energy || 0})`, () => fightStep("flare"), "", true],
      ["Retreat to camp", () => fightStep("flee"), "", true],
    ], { locked: true });
  }
  function fightStep(a) {
    const q = S.quest, c = S.collapses, msg = R.fight(S, a); save(); render();
    if (S.collapses !== c) return showCollapse();
    if (S.encounter) return showEncounter(msg);
    closeModal(); toast(msg);
    if (S.quest !== q) toast("Quest complete: " + R.quests[q].title + ". Next: " + R.objective(S).title + ".", 5000);
  }
  function showCollapse() {
    modal("You wake at camp", `${panel("frontier-20")}<p style="margin-top:10px">Everything goes dark. You wake at dawn beside the fire, a blanket over you and Maya at your side. You are weak, but alive. Eat, drink and take it slowly today.</p><p class="tiny">Health ${S.health}. Anything you were carrying stays with you.</p>`, [["Get up", null, "primary"]], { locked: true });
  }

  /* ---------- menu and cheats ---------- */
  function showMenu() {
    modal("Menu", `<div class="row"><button id="m-cheats">Cheats</button><button id="m-new">New journey</button></div><p class="tiny" style="margin-top:12px">Echoes of the Rift · created by Mitch Peebles</p>`, [["Close"]]);
    $("#m-cheats", dlg).onclick = showCheats;
    $("#m-new", dlg).onclick = () => modal("Begin a new journey?", "<p>You will return to the title screen. Your autosave stays until you begin a new story. Export a backup from Pack first if you want to keep it.</p>", [["Go to title", () => renderTitle(), "primary"], ["Cancel"]]);
  }
  function showCheats() {
    const KEY = "rift2-cheats";
    let open = false; try { open = sessionStorage.getItem(KEY) === "1"; } catch {}
    if (!open) {
      modal("Cheats", `<p>Enter the access code.</p><input id="cc" type="password" autocomplete="off"><p id="ce" class="tiny" style="color:var(--warn)"></p>`, [["Unlock", () => {
        if ($("#cc", dlg)?.value === "Chaosenvy") { try { sessionStorage.setItem(KEY, "1"); } catch {} showCheats(); } else toast("That code is not correct.");
      }, "primary", true], ["Close"]]);
      $("#cc", dlg).onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); $(".dlg-actions button", dlg).click(); } };
      return;
    }
    const opts = [["god", "Invincibility"], ["needs", "Unlimited survival"], ["freeCraft", "Free crafting"], ["safeTravel", "No random ambushes"], ["fastTravel", "Fast travel everywhere (1 hour)"], ["openMap", "Unlock all destinations"]];
    modal("Cheats", `<p class="tiny">Turning anything on marks this save “cheats used”.</p>${opts.map(([k, l]) => `<p><label><input type="checkbox" data-cheat="${k}" ${S.cheats[k] ? "checked" : ""}> ${l}</label></p>`).join("")}<div class="row"><button id="c-heal">Restore survival meters</button><button id="c-cache">Spawn supply cache (+50 each)</button></div>`, [["Lock menu", () => { try { sessionStorage.removeItem(KEY); } catch {} }], ["Close"]]);
    $$("[data-cheat]", dlg).forEach((c) => (c.onchange = () => { S.cheats[c.dataset.cheat] = c.checked; S.cheats.everUsed = true; R.clamp(S); save(); render(); }));
    $("#c-heal", dlg).onclick = () => { S.health = S.food = S.water = S.warmth = 100; S.cheats.everUsed = true; save(); render(); toast("Restored."); };
    $("#c-cache", dlg).onclick = () => { for (const k of Object.keys(R.names)) R.add(S, k, 50); S.cheats.everUsed = true; save(); render(); toast("Added 50 of every resource."); };
  }

  render();
})();
