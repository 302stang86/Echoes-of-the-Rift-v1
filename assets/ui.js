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
  let mapRegion = S ? R.regionOf(S.loc) : "valley";
  let sceneSel = null, toastTimer = 0, serial = 0;

  /* ---------- helpers ---------- */
  function panel(id, cls = "") {
    const a = window.ART[id];
    if (!a) return "";
    const clip = "clip" + ++serial;
    return `<figure class="art-panel ${cls}"><svg viewBox="${a.box.join(" ")}" role="img" aria-label="${esc(a.title)}"><title>${esc(a.title)}</title><defs><clipPath id="${clip}"><rect x="${a.box[0]}" y="${a.box[1]}" width="${a.box[2]}" height="${a.box[3]}"/></clipPath></defs><image clip-path="url(#${clip})" href="assets/art/${a.sheet}" width="${a.width || 1376}" height="${a.height || 768}"/></svg></figure>`;
  }
  const chipHtml = (k, n) => `<span class="chip ${(S.inv[k] || 0) >= n ? "ok" : "no"}">${n} ${R.names[k]} (${S.inv[k] || 0})</span>`;
  const costHtml = (c) => Object.entries(c).map(([k, n]) => chipHtml(k, n)).join("");
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
  const hhmm = (h, m = 0) => (h % 12 || 12) + ":" + String(m).padStart(2, "0") + " " + (h < 12 ? "AM" : "PM");

  // Run one game action, then save, redraw and react to whatever happened.
  function commit(fn) {
    const q = S.quest, c = S.collapses;
    const msg = fn();
    save(); render();
    if (S.collapses !== c) showCollapse();
    else if (S.encounter) showEncounter(msg);
    else if (S.stranger) showStranger(msg);
    else if (S.drop) showDrop(msg);
    else if (S.notice) showNotice();
    else if (S.pending) { const id = S.pending; S.pending = null; save(); showBeat(id); }
    else if (msg) toast(msg);
    if (S.quest !== q && S.quest === 6) toast("The signal is live. But the story is not over. Winter is coming.", 6000);
    else if (S.quest !== q && S.quest < 9) toast("Quest complete: " + R.quests[q].title + ". Next: " + R.objective(S).title + ".", 5000);
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
    modal("How this works", `<p>Three things are always on screen.</p><div class="lines"><p><b>Next step</b>The banner at the top tells you what to do now, and the glowing pin on the map shows where.</p><p><b>Map</b>Pick a place, then Travel. Travel takes 2 hours and some energy.</p><p><b>Here</b>Everything you can do where you are standing, in one list.</p></div><p class="tiny">Choose when to end your day: sleep until 6:00 AM or rest by the fire for 30 minutes, 1 hour, or until dawn. Night travel and gathering cost 50% more energy, and staying awake at night drains 2 energy per hour. At zero energy, rest before working; you can always attempt to return to camp. Gathering takes 20 minutes, searches 10 minutes, crafting is instant and costs no energy, and filling bottles 10 minutes. Every task spends energy. When you run low, head back to camp and rest or sleep. Gathering spots give 3 harvests a day and refresh at midnight. Seasons change every 20 days, and winter is hard. You may meet other survivors while searching. If you collapse, Maya will find you.</p>`, [["Start at camp", null, "primary"]]);
  }

  /* ---------- the hub ---------- */
  function meter(label, v) {
    v = Math.round(v);
    return `<div class="meter ${v < 30 ? "low" : ""}"><span>${label}<b>${v}</b></span><div class="bar"><i style="width:${v}%"></i></div></div>`;
  }
  function render() {
    if (!S) return renderTitle();
    if (S.prologue < 4) return renderStory();
    const goal = mapRegion === "far" ? R.farObjective(S) : R.objective(S), here = R.place(S.loc), night = S.hour >= 19 || S.hour < 6;
    if (R.regionOf(selected) !== mapRegion) selected = mapRegion === "far" ? "ashen" : "camp";
    const sel = R.place(selected), lock = R.travelLock(S, sel.id);
    const actions = R.actionsFor(S);
    const pins = R.places.filter((p) => R.regionOf(p.id) === mapRegion).map((p) => {
      const cls = ["pin", R.travelLock(S, p.id) ? "locked" : "", p.id === S.loc ? "current" : "", p.id === selected ? "selected" : "", goal.place === p.id ? "goal-pin" : ""].join(" ");
      return `<button class="${cls}" data-pin="${p.id}" style="left:${(p.x / 1376) * 100}%;top:${(p.y / 768) * 100}%" aria-label="${esc(p.name)}${p.id === S.loc ? ", you are here" : ""}${R.travelLock(S, p.id) ? ", locked" : ""}">${p.id === S.loc ? "◆ " : goal.place === p.id ? "★ " : ""}${p.label}</button>`;
    }).join("");
    const travelBtn = `<button class="primary ${lock ? "locked" : ""}" id="go" ${lock ? 'aria-disabled="true"' : ""}>Travel to ${esc(sel.name)} · ${R.travelHours(S, sel.id)} hours · ${R.actionEnergy(S, "travel")} energy</button>`;
    app.innerHTML = `
    <header class="top"><span class="brand">ECHOES OF THE RIFT</span><span class="clock">${night ? "☾" : "☀"} ${R.seasonOf(S.day)} · Day ${S.day} · ${hhmm(S.hour, S.minute || 0)}${night ? ` <em class="dusk">· night fatigue · travel & gathering +50% energy</em>` : ""}</span>
      <div class="meters">${meter("Health", S.health)}${meter("Food", S.food)}${meter("Water", S.water)}${meter("Warmth", S.warmth)}${meter("Energy", S.energy)}</div>
      <div class="row"><button id="eat" aria-label="Eat">Eat</button><button id="drink" aria-label="Drink">Drink</button><button id="pack">Pack</button><button id="journal">Journal</button><button id="menu">Menu${S.cheats.everUsed ? " · cheats used" : ""}</button></div></header>
    <main class="hub">
      <section class="card goal" aria-label="Next step"><div><div class="eyebrow">Next step · ${esc(goal.title)}</div><p>${esc(goal.text)}</p></div>${goal.place && goal.place !== selected ? `<button id="show-goal">Show on map ★</button>` : ""}</section>
      <section class="map-col" aria-label="World map"><div class="region-tabs"><button id="map-valley" class="${mapRegion === 'valley' ? 'primary' : ''}">Ancient Valley</button><button id="map-far" class="${mapRegion === 'far' ? 'primary' : ''}">The Far Shore ${R.farUnlocked(S) ? '◇' : '· locked'}</button><button id="return-camp">Return to camp</button><button id="end-day" class="primary">${S.loc === "camp" ? "Sleep until dawn" : "Return to camp & sleep"}</button></div><p class="tiny region-caption">${mapRegion === 'far' ? 'THE FAR SHORE · Crossing takes 3 hours; a built rift gate reduces travel to 1 hour.' : 'ANCIENT VALLEY · Your settlement and familiar trails.'}</p><div class="map"><img src="assets/art/${mapRegion === 'far' ? 'far-shore-map.svg' : 'valley-map.jpg'}" alt="${mapRegion === 'far' ? 'Far Shore regional map with mountain pass, marsh, steppe, geothermal basin and observatory' : 'Hand-painted prehistoric valley map'}" draggable="false">${pins}</div>
        ${sel.id === S.loc ? "" : `<div class="card selected-box"><div class="eyebrow">${esc(sel.kind)}</div><h3>${esc(sel.name)}</h3><p>${esc(sel.desc)}</p>${lock ? `<p class="tiny" style="color:var(--warn)">${esc(lock)}</p>` : ""}${travelBtn}</div>`}</section>
      <section class="card here" aria-label="What you can do here"><div class="here-art">${panel(here.art)}</div><div class="eyebrow">You are here</div><h2>${esc(here.name)}</h2><p>${esc(here.desc)}</p>
        <div class="actions">${actions.map((a, i) => a.info ? `<div class="note-line">${esc(a.label)}. ${esc(a.sub)}.</div>` : `<button class="act ${a.disabled ? "locked" : ""} ${a.glow ? "glow" : ""} ${a.quest ? "quest" : ""}" data-act="${i}" ${a.disabled ? 'aria-disabled="true"' : ""}>${esc(a.label)}<small>${esc(a.disabled || a.sub)}</small></button>`).join("")}</div></section>
      <section class="card log" aria-label="Recent events"><div class="eyebrow">Recent events</div><ol>${S.log.slice(0, 5).map((l) => `<li>${esc(l)}</li>`).join("")}</ol></section>
    </main>`;
    $("#map-valley").onclick = () => { mapRegion = "valley"; selected = R.regionOf(S.loc) === "valley" ? S.loc : "camp"; render(); };
    $("#map-far").onclick = () => { if (!R.farUnlocked(S) && !S.cheats.openMap) return toast("Survive The Long Winter to reveal the mountain pass."); mapRegion = "far"; selected = R.regionOf(S.loc) === "far" ? S.loc : "ashen"; render(); };
    $("#end-day").onclick = () => modal("End the day?", `<p>${S.loc === "camp" ? "Sleep" : "Travel home (" + R.travelHours(S, "camp") + " hours), then sleep"} until the next 6:00 AM. Food, water, fires and survivor needs continue while time passes.</p>`, [["Sleep until dawn", () => { commit(() => R.returnAndSleep(S)); selected = S.loc; mapRegion = R.regionOf(S.loc); render(); }, "primary"], ["Keep playing"]]);
    $("#return-camp").onclick = () => { commit(() => R.travel(S, "camp")); mapRegion = R.regionOf(S.loc); selected = S.loc; render(); };
    $$("[data-pin]").forEach((b) => (b.onclick = () => { selected = b.dataset.pin; render(); }));
    const go = $("#go"); if (go) go.onclick = () => (lock ? toast(lock) : commit(() => R.travel(S, selected)));
    const sg = $("#show-goal"); if (sg) sg.onclick = () => { selected = goal.place; mapRegion = R.regionOf(selected); render(); $(".map").scrollIntoView({ block: "center", behavior: "smooth" }); };
    $$("[data-act]").forEach((b) => (b.onclick = () => onAction(actions[+b.dataset.act])));
    $("#eat").onclick = () => commit(() => R.use(S, "eat"));
    $("#drink").onclick = () => commit(() => R.use(S, "drink"));
    $("#pack").onclick = showPack; $("#journal").onclick = showJournal; $("#menu").onclick = showMenu;
  }
  function onAction(a) {
    if (a.disabled) return toast(a.disabled);
    if (a.type === "nearby") return showStranger();
    if (a.type === "resume-fight") return showEncounter();
    if (a.type === "nap") return modal(S.loc === "camp" ? "Rest by the fire" : "Rest at field camp", `<p>Choose how long to rest. Recover 25 energy per hour. Survival needs continue while resting.${S.loc !== "camp" ? " Field-camp attacks can interrupt rest. Attack chance per hour: " + Math.round(R.campRisk(S) * 100) + "%. Fire fuel: " + R.fieldCamp(S).fuel + " minutes." : ""}</p>`, [["30 minutes · +12.5 energy", () => commit(() => R.nap(S, .5))], ["1 hour · +25 energy", () => commit(() => R.nap(S, 1))], ["Until 6:00 AM", () => commit(() => R.nap(S, "dawn"))], ["Cancel"]]);
    if (a.type === "build") return showBuild();
    if (a.type === "search") return showSearch();
    if (a.type === "ravine") return showRavine();
    if (a.type === "wire") return showWiring();
    if (a.type === "survivors") return showSurvivors();
    if (a.type === "gear") return showGear("hero");
    if (a.type === "gate") return showGateConfirm();
    if (a.type === "talk") return commit(() => R.talk(S));
    commit(() => R.act(S, a.type, a.id));
  }

  /* ---------- panels ---------- */
  function showBuild() {
    if (S.notice) return showNotice();
    const chip = (k, n) => `<span class="chip ${(S.inv[k] || 0) >= n ? "ok" : "no"}">${n} ${R.names[k]} (${S.inv[k] || 0})</span>`;
    const rows = Object.entries(R.recipes).map(([id, r]) => {
      const lock = R.recipeLock(S, id), can = !lock && (S.cheats.freeCraft || R.can(S, r.cost));
      const html = `<article class="recipe">${panel(r.art)}<h3>${r.title}</h3><p>${r.desc}</p><div class="chips">${Object.entries(r.cost).map(([k, n]) => chip(k, n)).join("")}</div><button data-build="${id}" class="${can ? "primary" : ""}" ${can ? "" : 'aria-disabled="true"'}>${lock || (can ? "Build" : "Not enough materials")}</button></article>`;
      return { html, rank: can ? 0 : lock ? 2 : 1, lock };
    }).filter((r) => r.lock !== "Already built.").sort((a, b) => a.rank - b.rank);
    const open = rows.filter((r) => r.rank < 2).map((r) => r.html).join(""), later = rows.filter((r) => r.rank === 2);
    const costChips = (c) => Object.entries(c).map(([k, n]) => chip(k, n)).join("");
    const okCost = (c) => S.cheats.freeCraft || R.can(S, c);
    const leantos = S.flags.shelter ? `<details open><summary>Lean-tos · ${S.shelters.length} built</summary><p class="tiny">You and Maya share the main lean-to. Each rescued survivor needs a bed, or they will fall sick. Another lean-to gives 1 bed. A lean-to at level 3 gives 2 beds.</p><div class="recipes">${S.shelters.map((sh, i) => { const up = R.SHELTER_UPGRADES[sh.level]; return `<article class="recipe"><h3>${i === 0 ? "Main lean-to" : "Lean-to " + (i + 1)}</h3><p>Level ${sh.level} of 3 · ${i === 0 ? "you and Maya" : sh.level >= 3 ? "2 survivors" : "1 survivor"}${i === 0 && sh.level >= 3 ? " + 2 survivors" : ""}</p>${up ? `<p>Next: ${up.desc}</p><div class="chips">${costChips(up.cost)}</div><button data-upg="${i}" class="${okCost(up.cost) ? "primary" : ""}" ${okCost(up.cost) ? "" : 'aria-disabled="true"'}>${okCost(up.cost) ? "Upgrade to level " + (sh.level + 1) : "Not enough materials"}</button>` : "<p>Fully upgraded.</p>"}</article>`; }).join("")}${S.shelters.length < R.MAX_LEANTOS ? `<article class="recipe"><h3>Another lean-to</h3><p>Room for 1 more survivor.</p><div class="chips">${costChips(R.EXTRA_LEANTO)}</div><button data-newleanto class="${okCost(R.EXTRA_LEANTO) ? "primary" : ""}" ${okCost(R.EXTRA_LEANTO) ? "" : 'aria-disabled="true"'}>${okCost(R.EXTRA_LEANTO) ? "Build" : "Not enough materials"}</button></article>` : ""}</div></details>` : "";
    const workshop = S.flags.shelter ? `<details ${S.inv.leather || S.inv.hide ? "open" : ""}><summary>Gear workshop · clothing, tools and weapons</summary><p class="tiny">Crafted gear goes into your gear pack. Equip it from Gear and equipment, where you can also upgrade it. Raw hides come from animals; tan them into leather at a tanning rack.</p><div class="recipes">${Object.keys(R.FAM).map((fam) => { const i = R.GEAR[fam + "1"], lock = R.gearLock(S, i.id), ok = !lock && (S.cheats.freeCraft || R.can(S, i.cost)); return `<article class="recipe"><h3><span class="gl">${GearIcons.svg(i, 34)}</span> ${i.name}</h3><p>${R.itemDesc(i)} · ${R.FAM[fam].names.length} tiers</p><div class="chips">${costHtml(i.cost)}</div><button data-gear="${fam}" class="${ok ? "primary" : ""}" ${ok ? "" : 'aria-disabled="true"'}>${lock || (ok ? "Craft" : "Not enough materials")}</button></article>`; }).join("")}</div></details>` : "";
    modal("Build and craft", `<p class="tiny">Crafting and building are instant and use no energy. Materials are still required. Green means you have enough. Ready items come first.</p>${leantos}${workshop}<div class="recipes">${open || "<p>Nothing else to build right now.</p>"}</div>${later.length ? `<details><summary>Not available yet · ${later.length}</summary><div class="recipes">${later.map((r) => r.html).join("")}</div></details>` : ""}`, [["Close"]], { wide: true });
    $$("[data-upg]", dlg).forEach((b) => (b.onclick = () => {
      if (b.getAttribute("aria-disabled")) return toast("Not enough materials.");
      const c = S.collapses, q = S.quest; const msg = R.upgradeShelter(S, +b.dataset.upg); save(); render(); toast(msg);
      if (S.collapses !== c) return showCollapse(); showBuild();
    }));
    const nl = $("[data-newleanto]", dlg);
    if (nl) nl.onclick = () => { if (nl.getAttribute("aria-disabled")) return toast("Not enough materials."); const c = S.collapses; const msg = R.buildShelter(S); save(); render(); toast(msg); if (S.collapses !== c) return showCollapse(); showBuild(); };
    $$("[data-gear]", dlg).forEach((b) => (b.onclick = () => {
      if (b.getAttribute("aria-disabled")) return toast(b.textContent);
      const c = S.collapses; const msg = R.craftGear(S, b.dataset.gear); save(); render(); toast(msg);
      if (S.collapses !== c) return showCollapse(); showBuild();
    }));
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
    modal("Pack", `<div class="inv">${items.length ? items.map(([k, n]) => `<div>${R.names[k]}<b>${n}</b></div>`).join("") : "<p>Empty.</p>"}</div><p class="tiny">Equipped: ${gear}. There is no carry limit.</p><details><summary>What can I make? · resource uses</summary><p class="tiny">Uses include future unlocks. Recipe quantities are shown in parentheses; check Build and craft for full costs and requirements.</p>${items.map(([k]) => `<details><summary>${esc(R.names[k])} · ${R.resourceUses(k).length} uses</summary><ul class="resource-uses">${R.resourceUses(k).map(use => `<li>${esc(use)}</li>`).join("")}</ul></details>`).join("")}</details>
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
    const far = R.farObjective(S);
    const q = R.quests.map((x, i) => `<div class="quest-row ${i < S.quest ? "done" : i === S.quest ? "now" : ""}"><b>${i < S.quest ? "✓" : i === S.quest ? "▶" : "·"}</b> ${x.title} <span class="tiny">— ${x.chapter}</span><br><span class="tiny">${i <= S.quest ? x.desc : "Not yet discovered."}</span></div>`).join("");
    const moments = ["blanket", "echo", "confession"].map((id) => S.beats[id] ? `<p><button data-memory="${id}">${R.beatTitles[id]}</button> <span class="tiny">Day ${S.beatDays[id]}</span></p>` : `<p class="tiny">◇ A moment with Maya is still to come.</p>`).join("");
    const finds = Object.keys(S.found).map((key) => { const [site, id] = key.split(":"); const o = window.SCENES[site]?.objects.find((x) => x.id === id); return o ? `<p><b>${esc(o.name)}</b> · ${esc(R.place(site).name)}<br><span class="tiny">${esc(o.text)}</span></p>` : ""; }).join("");
    const end = R.ending(S);
    modal("Journal", `<details open><summary>The Far Shore</summary><p><b>${esc(far.title)}</b><br>${esc(far.text)}</p><p class="tiny">Visited ${R.FAR_PLACES.filter(p => S.visited[p.id]).length} of 5 areas · Beacon ${S.flags.farBeacon ? "restored" : "silent"}</p></details><details open><summary>Quests</summary>${q}</details><details><summary>Moments with Maya</summary>${moments}${end ? `<p><button id="ending">${end.title} — view ending</button></p>` : ""}</details><details><summary>Things we found · ${Object.keys(S.found).length}</summary>${finds || "<p class=tiny>Search places on the map to uncover discoveries.</p>"}</details><details><summary>The collapse · read the prologue again</summary>${storyScenes().map((s) => `<p><b>${s.title}</b><br><span class="tiny">${s.text}</span></p>`).join("")}</details>`, [["Close"]], { wide: true });
    $$("[data-memory]", dlg).forEach((b) => (b.onclick = () => showBeat(b.dataset.memory, true)));
    const e = $("#ending", dlg); if (e) e.onclick = showEnding;
  }
  function showSearch() {
    const objs = R.sceneObjects(S), sc = window.SCENES[S.loc];
    if (!sceneSel || !objs.some((o) => o.id === sceneSel)) sceneSel = objs[0]?.id;
    const draw = () => {
      const o = objs.find((x) => x.id === sceneSel), found = R.searched(S, o), why = found ? "" : R.objectReason(S, o), vis = R.objectVisible(S, o);
      const hot = objs.map((x, i) => `<button class="hot ${R.searched(S, x) ? "found" : ""} ${x.id === sceneSel ? "sel" : ""} ${!R.objectVisible(S, x) ? "hidden" : ""}" data-obj="${x.id}" style="left:${x.x}%;top:${x.y}%" aria-label="Examine ${esc(R.objectVisible(S, x) ? x.name : "something hidden")}">${R.searched(S, x) ? "✓" : R.objectVisible(S, x) ? i + 1 : "?"}</button>`).join("");
      const list = objs.map((x) => `<button data-obj="${x.id}" class="${x.id === sceneSel ? "sel" : ""}">${R.searched(S, x) ? "✓ " : "◇ "}${esc(R.objectVisible(S, x) ? x.name : "Something hidden")}</button>`).join("");
      const loot = Object.keys(o.loot).length ? (R.repeatable(o) && R.isFound(S, o.id) ? " · up to " : " · ") + R.list(o.loot) : "";
      modal(esc(sc.title), `<p>${esc(sc.intro)}</p><div class="search-grid"><div><div class="scene">${panel(sc.art)}${hot}</div><div class="objs">${list}</div></div><div class="card"><h3>${esc(vis ? o.name : "Something is easy to overlook")}</h3><p>${vis ? esc(o.text) : "Maya’s eye may reveal it."}</p>${found ? `<p class="tiny" style="color:var(--ok)">${R.repeatable(o) ? "Searched today. This spot refreshes at midnight." : "Discovery recorded."}</p>` : `<button class="primary ${why ? "locked" : ""}" id="do" ${why ? 'aria-disabled="true"' : ""}>${esc(o.verb)} · 10 minutes · ${R.searchCost(S, o)} energy${esc(loot)}</button>${why ? `<p class="tiny" style="color:var(--warn);margin-top:6px">${esc(why)}</p>` : ""}`}</div></div>`, [["Close"]], { wide: true });
      $$("[data-obj]", dlg).forEach((b) => (b.onclick = () => { sceneSel = b.dataset.obj; draw(); }));
      const d = $("#do", dlg); if (d) d.onclick = () => { if (why) return toast(why); const c = S.collapses; const msg = R.search(S, o.id); save(); render(); if (S.collapses !== c) return showCollapse(); if (S.stranger) return showStranger(msg); if (S.notice) return showNotice(); draw(); toast(msg); };
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
    modal(e.title, `${panel("frontier-20")}<p style="margin-top:10px;color:var(--ink)">${esc(e.text)}</p><p class="tiny">Your story continues.</p>`, [["Continue your story", null, "primary"]]);
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
    if (S.drop) return showDrop(msg);
    closeModal(); toast(msg);
    if (S.quest !== q) toast("Quest complete: " + R.quests[q].title + ". Next: " + R.objective(S).title + ".", 5000);
  }
  function showCollapse() {
    modal("You wake at camp", `${panel("frontier-20")}<p style="margin-top:10px">Everything goes dark. You wake at dawn beside the fire, a blanket over you and Maya at your side. You are weak, but alive. Eat, drink and take it slowly today.</p><p class="tiny">Health ${S.health}. Anything you were carrying stays with you.</p>`, [["Get up", null, "primary"]], { locked: true });
  }


  /* ---------- survivors, strangers, the gate ---------- */
  function showStranger(msg) {
    const p = S.stranger; if (!p) return closeModal();
    const title = p.hostile ? "A hostile stranger" : p.child ? "A lost child" : p.injured ? "A wounded stranger" : "A stranger";
    const body = `${panel(p.hostile ? "frontier-02" : "story-09")}<p style="margin-top:10px;color:var(--ink)">${esc(R.strangerText(p))}</p>${msg ? `<p class="tiny" style="color:var(--accent)">${esc(msg)}</p>` : ""}<p class="tiny">Beds at camp: ${R.housing(S).beds} for ${R.housing(S).count} survivors.</p>`;
    const buttons = p.hostile
      ? [["Flee · 5 energy", () => commit(() => R.strangerFlee(S))], ["Attack", () => commit(() => R.strangerAttack(S)), "primary"]]
      : [[p.helped ? "Already helped" : p.injured ? "Treat the wound · 1 herb" : "Share a ration · 1 ration", () => { const m = R.strangerOffer(S); save(); render(); showStranger(m); }, "", true],
         [`Bring them to camp · ${R.actionEnergy(S, "travel")} energy`, () => commit(() => R.strangerBring(S)), "primary"],
         ["Leave them", () => commit(() => R.strangerLeave(S))]];
    modal(title, body, buttons, { locked: true });
  }
  const sexLabel = (p) => (p.child ? (p.sex === "F" ? "Girl" : "Boy") : p.sex === "F" ? "Woman" : "Man");
  function gearLine(g) {
    const bits = [];
    const w = R.warmOf(g), tl = g.tool && R.GEAR[g.tool], wp = g.weapon && R.GEAR[g.weapon];
    if (w) bits.push("warmth +" + w);
    if (tl) bits.push(tl.name);
    if (wp) bits.push(wp.name);
    return bits.length ? bits.join(" · ") : "No gear equipped";
  }
  function showSurvivors() {
    if (S.notice) return showNotice();
    const h = R.housing(S), need = S.survivors.length;
    const herbs = S.inv.herb || 0;
    const mine = (who, label, sub) => `<article class="recipe mine"><h3>${esc(label)} <span class="tiny muted">· ${sub}</span></h3><p class="tiny">${esc(gearLine(R.gearOf(S, who)))}</p><button data-gear-of="${who}">Gear</button></article>`;
    const rows = S.survivors.map((p, i) => {
      const housed = i < h.beds, hurt = p.injured || p.health < 50, cost = (hurt ? 1 : 0) + (p.sick ? 2 : 0);
      const badges = [p.injured && "injured", p.sick && "sick", !housed && "no bed"].filter(Boolean).map((b) => `<span class="chip no">${b}</span>`).join("") + (housed ? '<span class="chip ok">has a bed</span>' : "");
      const sel = p.child ? `<span class="tiny muted">Too young for chores. Sometimes finds useful things.</span>` : `<select data-task="${p.id}" aria-label="Task for ${esc(p.name)}">${Object.entries(R.TASKS).map(([k, l]) => `<option value="${k}" ${p.task === k ? "selected" : ""}>${l}</option>`).join("")}</select>`;
      const ill = p.sick ? `<div class="illbar" title="Sickness"><i style="width:${Math.round(p.ill || 0)}%"></i></div><div class="tiny" style="color:#ff8a78;margin:-6px 0 8px">Sick · ${Math.round(p.ill || 0)}%${(p.ill || 0) >= 100 ? " · health is dropping" : " · health drops once this is full"}</div>` : "";
      return `<article class="recipe"><h3>${esc(p.name)} <span class="tiny muted">· ${sexLabel(p)} · health ${Math.round(p.health)}</span></h3><div class="hpbar" style="margin:0 0 ${p.sick ? 3 : 10}px"><i style="width:${p.health}%;background:${p.health < 50 ? "#ff8a78" : "var(--ok)"}"></i></div>${ill}<div class="chips">${badges}</div><p class="tiny">${esc(gearLine(p.gear || {}))}</p>${sel}<div class="row2"><button data-gear-of="${p.id}">Gear</button>${cost ? `<button data-treat="${p.id}" class="${herbs >= cost ? "primary" : ""}" ${herbs >= cost ? "" : 'aria-disabled="true"'}>Treat · ${cost} ${cost === 1 ? "herb" : "herbs"}</button>` : ""}</div></article>`;
    }).join("");
    modal("Camp and gear", `<p class="tiny">${need} ${need === 1 ? "survivor" : "survivors"} · ${h.beds} ${h.beds === 1 ? "bed" : "beds"}${h.unhoused ? ` · <span style="color:var(--warn)">${h.unhoused} without a bed will grow sick and may die</span>` : ""} · each person eats about 1 ration a day (or 2 berries or 1 fish).</p><p class="tiny">Tasks pay out at midnight. Chores can injure or sicken people; warm clothes and weapons lower the risk. Healers use 1 herb for injuries or health under 50%, and 2 herbs for sickness. Winter halves what plants give.</p><div class="recipes">${mine("hero", S.name, "you")}${S.flags.fishing || S.quest >= 1 ? mine("maya", "Maya", "companion") : ""}${rows}</div>${need ? "" : "<p class=\"tiny\">No survivors yet. They are found by searching places (not gathering), once you have finished Fresh Catch. Roughly one search in seven turns someone up, and one is guaranteed within eight searches.</p>"}`, [["Close"]], { wide: true });
    $$("[data-task]", dlg).forEach((s) => (s.onchange = () => { const m = R.setTask(S, s.dataset.task, s.value); toast(m); save(); showSurvivors(); }));
    $$("[data-gear-of]", dlg).forEach((b) => (b.onclick = () => showGear(b.dataset.gearOf)));
    $$("[data-treat]", dlg).forEach((b) => (b.onclick = () => { if (b.getAttribute("aria-disabled")) return toast("You do not have enough herbs."); const c = S.collapses; const m = R.treat(S, b.dataset.treat); save(); render(); toast(m); if (S.collapses !== c) return showCollapse(); showSurvivors(); }));
  }

  /* ---------- gear window ---------- */
  let gearSel = null;
  function showGear(who, msg) {
    if (S.notice) return showNotice();
    const people = [["hero", S.name], ["maya", "Maya"], ...S.survivors.map((p) => [p.id, p.name])];
    if (!people.some((x) => x[0] === who)) who = "hero";
    const g = R.gearOf(S, who), who_ = people.find((x) => x[0] === who)[1];
    const slotCells = Object.entries(R.SLOTS).map(([slot, label]) => {
      const it = g[slot] && R.GEAR[g[slot]], on = gearSel && gearSel.kind === "slot" && gearSel.slot === slot;
      return `<button class="slot ${it ? "t" + it.tier : ""} ${on ? "on" : ""}" data-slot="${slot}" aria-label="${label}${it ? ": " + it.name : ": empty"}"><span class="gl">${it ? GearIcons.svg(it, 46) : ""}</span>${it ? `<span class="tier">${"I".repeat(it.tier)}</span>` : ""}<small>${label}</small></button>`;
    }).join("");
    const bag = Object.entries(S.gearBag).filter(([, n]) => n > 0);
    const bagCells = bag.map(([id, n]) => { const it = R.GEAR[id], on = gearSel && gearSel.kind === "bag" && gearSel.id === id; return `<button class="item t${it.tier} ${on ? "on" : ""}" data-item="${id}" title="${esc(it.name)}"><span class="gl">${GearIcons.svg(it, 46)}</span><span class="tier">${"I".repeat(it.tier)}</span>${n > 1 ? `<span class="count">×${n}</span>` : ""}<small>${esc(it.name)}</small></button>`; }).join("");
    let detail = `<p class="tiny">Select an item in the pack to equip it on ${esc(who_)}, or select something worn to remove or upgrade it.</p>`;
    let cur = null, ref = null, buttons = "";
    if (gearSel && gearSel.kind === "bag" && S.gearBag[gearSel.id]) { cur = R.GEAR[gearSel.id]; ref = "bag:" + cur.id; buttons = `<button class="primary" data-equip="${cur.id}">Equip on ${esc(who_)}</button>`; }
    else if (gearSel && gearSel.kind === "slot" && g[gearSel.slot]) { cur = R.GEAR[g[gearSel.slot]]; ref = who + ":" + gearSel.slot; buttons = `<button data-remove="${gearSel.slot}">Remove</button>`; }
    if (cur) {
      const nxt = R.GEAR[cur.fam + (cur.tier + 1)], lock = nxt && R.gearLock(S, nxt.id), ok = nxt && !lock && (S.cheats.freeCraft || R.can(S, nxt.cost));
      detail = `<h3><span class="gl">${GearIcons.svg(cur, 34)}</span> ${esc(cur.name)} <span class="tiny muted">· tier ${cur.tier} of ${cur.max} · ${R.SLOTS[cur.slot]}</span></h3><p>${esc(R.itemDesc(cur))}</p><div class="row2">${buttons}</div>${nxt ? `<p class="tiny" style="margin-top:8px">Upgrade to ${esc(nxt.name)} (${esc(R.itemDesc(nxt))}):</p><div class="chips">${costHtml(nxt.cost)}</div><button data-upgrade="${ref}" class="${ok ? "primary" : ""}" ${ok ? "" : 'aria-disabled="true"'}>${lock || (ok ? "Upgrade · instant · no energy" : "Not enough materials")}</button>` : '<p class="tiny">Fully upgraded.</p>'}`;
    }
    const totals = `Warmth +${R.warmOf(g)} · armor ${R.armorOf(g)} · weapon +${R.weaponDmg(g)}`;
    modal("Gear · " + esc(who_), `<div class="gear-people">${people.map(([id, n]) => `<button class="${id === who ? "primary" : ""}" data-who="${id}">${esc(n)}</button>`).join("")}</div>${msg ? `<p class="tiny" style="color:var(--accent)">${esc(msg)}</p>` : ""}<div class="gear-grid"><div><div class="slots">${slotCells}</div><p class="tiny" style="margin-top:8px">${totals}</p></div><div><div class="eyebrow">Gear pack</div><div class="bag">${bagCells || '<p class="tiny">Empty. Craft clothing, tools and weapons in Build and craft.</p>'}</div></div></div><div class="card gear-detail">${detail}</div>`, [["Back to camp", showSurvivors], ["Close"]], { wide: true });
    const again = (m) => { save(); render(); showGear(who, m); };
    $$("[data-who]", dlg).forEach((b) => (b.onclick = () => { gearSel = null; showGear(b.dataset.who); }));
    $$("[data-slot]", dlg).forEach((b) => (b.onclick = () => { gearSel = { kind: "slot", slot: b.dataset.slot }; showGear(who); }));
    $$("[data-item]", dlg).forEach((b) => (b.onclick = () => { gearSel = { kind: "bag", id: b.dataset.item }; showGear(who); }));
    $$("[data-equip]", dlg).forEach((b) => (b.onclick = () => { const m = R.equip(S, who, b.dataset.equip); gearSel = null; again(m); }));
    $$("[data-remove]", dlg).forEach((b) => (b.onclick = () => { const m = R.unequip(S, who, b.dataset.remove); gearSel = null; again(m); }));
    $$("[data-upgrade]", dlg).forEach((b) => (b.onclick = () => {
      if (b.getAttribute("aria-disabled")) return toast(b.textContent);
      const c = S.collapses, wasBag = gearSel && gearSel.kind === "bag"; const m = R.upgradeGear(S, b.dataset.upgrade);
      if (wasBag) gearSel = null;
      save(); render(); if (S.collapses !== c) return showCollapse(); showGear(who, m);
    }));
  }
  function showNotice() {
    const n = S.notice; S.notice = null; save();
    modal(S.hour < 12 && S.hour >= 6 ? "A new morning" : "Night falls", `${panel("frontier-20")}<p style="margin-top:10px;color:var(--ink)">${esc(n)}</p>`, [["Continue", () => { if (S.pending) { const id = S.pending; S.pending = null; save(); showBeat(id); } }, "primary"]], { locked: true });
  }
  function showDrop(msg) {
    const d = S.drop; if (!d) return;
    modal("Something to collect", `${msg ? `<p class="tiny" style="color:var(--accent)">${esc(msg)}</p>` : ""}<p style="color:var(--ink)">The ${esc(d.name.toLowerCase())} is down. You can skin and butcher it for supplies.</p><div class="chips">${Object.entries(d.loot).map(([k, n]) => `<span class="chip ok">${n} ${R.names[k]}</span>`).join("")}</div><p class="tiny">Hides can be tanned into leather at a tanning rack. Claws, leather and pelts make better gear.</p>`, [["Collect everything", () => { const m = R.collect(S); save(); render(); toast(m); }, "primary"]], { locked: true });
  }

  function showGateConfirm() {
    modal("The rift gate", `${panel("frontier-14")}<p style="margin-top:10px">The stone arch hums. Beyond it, light moves like water over an unfamiliar coast. Stepping to the edge closes Part 1 of your story. You can keep playing and building afterward.</p>`, [["Open the gate", () => { commit(() => R.openGate(S)); showFinale(); }, "primary"], ["Not yet"]]);
  }
  function showFinale() {
    const c = S.flags.committed;
    modal("Part 1 complete", `${panel("frontier-14")}<p style="margin-top:10px;color:var(--ink)">The gate steadies. Past it lies a shoreline under a different sky: salt wind, unfamiliar stars, and the tracks of something enormous. ${c ? "Maya takes your hand." : "Maya stands beside you."} Behind you, the camp you built holds its fire against the long dark.</p><p>${S.survivors.length} ${S.survivors.length === 1 ? "survivor calls" : "survivors call"} your camp home. ${S.deaths ? S.deaths + " did not make it." : ""}</p><p class="tiny">The Far Shore is now playable. Switch maps to explore its foothills, marsh, steppe, basin and observatory. Your settlement, survivors and choices remain with you.</p>`, [["Keep playing", null, "primary"]]);
  }

  /* ---------- menu and cheats ---------- */
  function showMenu() {
    modal("Menu", `<div class="row"><button id="m-cheats">Cheats</button><button id="m-new">New journey</button></div><p class="tiny" style="margin-top:12px">Echoes of the Rift · release 5 · created by Mitch Peebles</p>`, [["Close"]]);
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
  if (S && S.prologue >= 4) { if (S.encounter) showEncounter(); else if (S.stranger) showStranger(); else if (S.drop) showDrop(); else if (S.notice) showNotice(); }
})();
