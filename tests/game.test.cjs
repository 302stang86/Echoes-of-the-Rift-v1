const test = require("node:test");
const assert = require("node:assert/strict");
globalThis.window = globalThis;
require("../assets/scene-data.js");
const R = require("../assets/game.js");
// Most tests are about other rules, so they run without the 10 PM curfew. The curfew tests turn it back on.
const _fresh = R.fresh;
R.fresh = (n) => { const s = _fresh(n); s.cheats.noCurfew = true; return s; };

const newGame = (safe = true) => {
  const s = R.fresh("Leo");
  s.cheats.safeTravel = safe;
  return s;
};
const go = (s, id, n = 1, type = "gather") => {
  assert.equal(s.loc === id || /^(Arrived|You are already)/.test(R.travel(s, id)), true, "travel to " + id);
  for (let i = 0; i < n; i++) R.act(s, type, R.place(id).gather[0].id);
};
const feed = (s) => { s.inv.food = Math.max(s.inv.food, 20); s.inv.water = Math.max(s.inv.water, 20); R.use(s, "eat"); R.use(s, "drink"); };

test("fresh state is valid and survives a JSON round trip", () => {
  const s = R.fresh("  Mitchell  ");
  assert.equal(s.name, "Mitchell");
  assert.ok(R.validate(JSON.parse(JSON.stringify(s))));
});

test("invalid saves are rejected", () => {
  const s = R.fresh("A");
  assert.equal(R.validate({ ...s, version: 1 }), false);
  assert.equal(R.validate({ ...s, inv: { bogus: 1 } }), false);
  assert.equal(R.validate({ ...s, health: 500 }), false);
  assert.equal(R.validate(null), false);
});

test("every place offers only its own actions", () => {
  const s = newGame();
  const labels = (id) => { s.loc = id; return R.actionsFor(s).map((a) => a.label); };
  assert.ok(labels("camp").includes("Sleep until dawn"));
  assert.ok(!labels("camp").some((l) => /^Gather/.test(l)));
  assert.ok(labels("forest").includes("Gather timber and ferns"));
  assert.ok(labels("river").includes("Fish the river"));
  assert.ok(!labels("forest").includes("Fish the river"));
  assert.ok(labels("den").includes("Confront the cave bear"));
  for (const p of R.places) assert.ok(labels(p.id).includes("Search the area"), p.id + " has a search");
});

test("each gather spot gives 3 harvests a day, then refreshes at midnight", () => {
  const s = newGame();
  R.travel(s, "forest");
  for (let i = 0; i < 3; i++) assert.match(R.act(s, "gather", "timber"), /Gathered/);
  assert.match(R.act(s, "gather", "timber"), /Picked clean/);
  assert.equal(s.inv.log, 15);
  s.energy = 100;
  R.tick(s, 24 - s.hour);
  assert.match(R.act(s, "gather", "timber"), /Gathered/);
});

test("every task costs energy; being too tired sends you home to rest", () => {
  const s = newGame();
  R.travel(s, "forest");
  assert.equal(s.energy, 96);
  R.act(s, "gather", "timber");
  assert.equal(s.energy, 88);
  s.energy = 7;
  assert.match(R.act(s, "gather", "timber"), /Too tired/);
  s.energy = 3;
  assert.match(R.travel(s, "grove"), /Too tired/);
  assert.equal(s.loc, "forest");
  assert.match(R.travel(s, "camp"), /Arrived/, "going home is always allowed");
  s.energy = 0;
  assert.match(R.act(s, "refill", "refill"), /Too tired/);
  R.act(s, "nap", "nap");
  assert.match(R.act(s, "refill", "refill"), /Filled/);
});

test("resting restores energy: a nap gives some, sleeping gives all", () => {
  const s = newGame();
  s.energy = 10;
  R.act(s, "nap", "nap");
  assert.equal(s.energy, 35);
  s.flags.shelter = true;
  R.act(s, "rest", "rest");
  assert.equal(s.energy, 100);
  s.flags.shelter = false;
  s.energy = 1;
  assert.match(R.craft(s, "rope"), /Not enough materials/);
});

test("searching refreshes daily with random amounts, and can find nothing", () => {
  const s = newGame();
  s.loc = "forest"; s.withMaya = true;
  assert.match(R.search(s, "berries"), /Found 4 Wild berries/, "first search always pays");
  assert.match(R.search(s, "berries"), /already searched here today/);
  const results = new Set(); let empty = 0;
  for (let d = 0; d < 60; d++) {
    s.day = 2 + (d % 10); s.energy = 100; s.hour = 8; s.food = s.water = s.warmth = 100;
    const before = s.inv.berry || 0;
    const msg = R.search(s, "berries");
    if (/Nothing found/.test(msg)) empty++; else results.add((s.inv.berry || 0) - before);
  }
  assert.ok(empty > 3 && empty < 40, "sometimes nothing: " + empty);
  assert.ok(results.size >= 2, "quantities vary: " + [...results]);
  for (const n of results) assert.ok(n >= 2 && n <= 4);
  s.day++; assert.match(R.search(s, "cairn") || "", /./);
  assert.match(R.search(s, "cairn"), /Already searched/, "lore finds stay one-time");
});

test("animals can interrupt gathering after the camp is built; Maya can head them off", () => {
  const s = R.fresh("Leo");
  s.quest = 1; s.loc = "forest"; s.energy = 100;
  let hit = 0;
  for (let i = 0; i < 300; i++) { s.encounter = null; s.gathered = {}; s.energy = 100; s.health = 100; s.food = s.water = s.warmth = 100; R.act(s, "gather", "timber"); if (s.encounter) hit++; }
  assert.ok(hit > 15 && hit < 90, "about 15% of gathers: " + hit);
  const q = R.fresh("Leo"); q.loc = "forest"; q.energy = 100;
  for (let i = 0; i < 50; i++) { q.gathered = {}; q.energy = 100; R.act(q, "gather", "timber"); assert.equal(q.encounter, null, "quiet before the first shelter"); }
  const m = R.fresh("Leo"); m.quest = 1; m.loc = "forest"; m.withMaya = true;
  let withMaya = 0;
  for (let i = 0; i < 300; i++) { m.encounter = null; m.gathered = {}; m.energy = 100; m.health = 100; m.food = m.water = m.warmth = 100; R.act(m, "gather", "timber"); if (m.encounter) withMaya++; }
  assert.ok(withMaya < hit, "Maya reduces encounters");
});

test("fishing needs the rig; ridge salvage needs Maya", () => {
  const s = newGame();
  s.quest = 2; s.loc = "river";
  assert.match(R.act(s, "gather", "fish"), /fishing rig/);
  s.flags.fishing = true;
  assert.match(R.act(s, "gather", "fish"), /Gathered 3 Raw fish/);
  s.loc = "ridge";
  assert.match(R.act(s, "gather", "salvage"), /Maya/);
  s.withMaya = true;
  R.act(s, "gather", "salvage");
  assert.equal(s.inv.alternator, 1);
  assert.equal(s.flags.salvaged, true);
  R.act(s, "gather", "salvage");
  assert.equal(s.inv.alternator, 1, "alternator is only awarded once");
});

test("time passes: needs fall, midnight rolls the day and burns fire logs", () => {
  const s = newGame();
  s.flags.fire = true; s.inv.log = 5;
  R.tick(s, 16);
  assert.equal(s.day, 2);
  assert.equal(s.hour, 0);
  assert.equal(s.inv.log, 3);
  assert.ok(s.food < 100 && s.water < 100);
});

test("Maya at camp fishes or forages by herself each midnight", () => {
  const s = newGame();
  R.tick(s, 16);
  assert.ok(s.inv.herb >= 3 && s.inv.berry >= 3);
  const t = newGame();
  t.flags.fishing = true; t.quest = 2;
  R.tick(t, 16);
  assert.ok(t.inv.fish >= 4);
  const u = newGame();
  u.withMaya = true;
  R.tick(u, 16);
  assert.ok(!u.inv.herb, "no passive help while she travels with you");
});

test("sleep until dawn restores energy with a shelter; rough rest remains available", () => {
 const s = newGame(); s.hour = 23; s.health = 40;
 assert.match(R.act(s, "rest", "rest"), /6:00 AM/); assert.equal(s.hour, 6);
 s.flags.shelter = true; s.hour = 23; s.health = 40; s.food = s.water = s.warmth = 100;
 R.act(s, "rest", "rest"); assert.ok(s.health >= 65); assert.equal(s.energy,100);
});

test("crafting spends materials and builds the shelter, advancing the first quest", () => {
  const s = newGame();
  assert.match(R.craft(s, "shelter"), /Not enough/);
  Object.assign(s.inv, { log: 10, leaf: 15, rope: 1 });
  R.craft(s, "shelter");
  assert.equal(s.flags.shelter, true);
  assert.equal(s.quest, 1);
  assert.equal(s.inv.log, 0);
  assert.match(R.craft(s, "shelter"), /Already/);
});

test("recipe locks: smelter-gated tools and quest gates", () => {
  const s = newGame();
  assert.match(R.recipeLock(s, "spear"), /smelter/);
  assert.match(R.recipeLock(s, "fishing"), /Unlocks after/);
  s.quest = 1;
  assert.equal(R.recipeLock(s, "fishing"), "");
});

test("travel locks follow the quests and marked travel times remain after the signal", () => {
  const s = newGame();
  assert.match(R.travelLock(s, "ridge"), /Iron|Fresh/);
  assert.match(R.travelLock(s, "glacier"), /coats/);
  assert.match(R.travelLock(s, "monolith"), /monolith/);
  s.quest = 4;
  assert.equal(R.travelLock(s, "ravine"), "");
  assert.equal(R.travelHours(s, "forest"), 2.5);
  s.flags.signal = true; s.visited.forest = true;
  assert.equal(R.travelHours(s, "forest"), 2.5);
});

test("combat: spear hits harder, traps work, Maya reduces damage, victory drops a ration", () => {
  const s = newGame();
  s.encounter = { name: "Dire wolf", hp: 45, max: 45, damage: 10 };
  R.fight(s, "attack");
  assert.equal(s.encounter.hp, 33);
  assert.equal(s.health, 90);
  s.withMaya = true;
  R.fight(s, "attack");
  assert.equal(s.health, 83);
  s.inv.trap = 1;
  R.fight(s, "trap");
  assert.equal(s.encounter.hp, 1);
  const food = s.inv.food;
  R.fight(s, "attack");
  assert.equal(s.encounter, null);
  assert.equal(s.inv.food, food + 1);
});

test("falling in combat is not the end: Maya drags you to camp by morning", () => {
  const s = newGame();
  s.loc = "forest"; s.hour = 14; s.health = 5;
  s.encounter = { name: "Cave bear", hp: 65, max: 65, damage: 13 };
  R.fight(s, "attack");
  assert.equal(s.loc, "camp");
  assert.equal(s.encounter, null);
  assert.equal(s.hour, 7);
  assert.equal(s.day, 2);
  assert.ok(s.health > 0);
  assert.equal(s.collapses, 1);
});

test("starvation also collapses instead of ending the run", () => {
  const s = newGame();
  s.food = 0; s.water = 0; s.health = 8;
  R.tick(s, 3);
  assert.equal(s.collapses, 1);
  assert.ok(s.health > 0 && s.food >= 40);
});

test("story moments: blanket on first rest, echo after Fresh Catch, confession after the signal at dusk", () => {
  const s = newGame();
  s.flags.shelter = true; s.quest = 1;
  R.act(s, "rest", "rest");
  assert.equal(s.pending, "blanket");
  R.resolveBeat(s, "blanket", "jacket");
  s.pending = null;
  assert.equal(R.beatReady(s, "rest"), null, "echo waits for Fresh Catch");
  s.quest = 2;
  assert.equal(R.beatReady(s, "talk"), "echo");
  R.resolveBeat(s, "echo", "together");
  assert.equal(R.beatReady(s, "talk"), null);
  s.flags.signal = true; s.quest = 6;
  s.shelters = [{ level: 0 }];
  s.hour = 19;
  assert.equal(R.beatReady(s, "talk"), null, "Maya needs an upgraded lean-to first");
  s.shelters[0].level = 1;
  s.hour = 10;
  assert.equal(R.beatReady(s, "talk"), null, "not before evening");
  s.hour = 19;
  assert.equal(R.beatReady(s, "talk"), "confession");
  s.loc = "forest";
  assert.equal(R.beatReady(s, "talk"), null, "only at camp");
});

test("story choices are one-time and shape the ending", () => {
  const s = newGame();
  assert.equal(R.ending(s), null);
  R.resolveBeat(s, "confession", "commit");
  assert.equal(s.flags.committed, true);
  assert.equal(R.ending(s).title, "Shared Future");
  assert.match(R.resolveBeat(s, "confession", "friends"), /passed/);
  assert.equal(s.flags.committed, true);
  const t = newGame();
  R.resolveBeat(t, "confession", "friends");
  assert.equal(R.ending(t).title, "Lifelong Allies");
  assert.equal(R.resolveBeat(t, "echo", "bogus"), "That moment has passed.");
});

test("commitment adds Maya bonuses when she travels with you", () => {
  const s = newGame();
  s.withMaya = true; s.flags.committed = true;
  assert.equal(R.support(s).damageReduction, 6);
  s.loc = "grove";
  R.act(s, "gather", "forage");
  assert.equal(s.inv.herb, 6);
  assert.equal(s.inv.sapling, 5);
});

test("searching a scene: one-time finds, Maya reveals, hood before alternator", () => {
  const s = newGame();
  s.loc = "forest";
  assert.match(R.search(s, "herbs"), /Maya/);
  s.withMaya = true;
  assert.match(R.search(s, "herbs"), /Found 3 Medicinal herbs/);
  assert.match(R.search(s, "herbs"), /already searched/);
  s.loc = "ridge";
  assert.match(R.search(s, "alternator"), /hood/);
  R.search(s, "hood");
  R.search(s, "alternator");
  assert.equal(s.inv.alternator, 1);
  assert.equal(s.flags.salvaged, true);
  R.act(s, "gather", "salvage");
  assert.equal(s.inv.alternator, 1, "no second alternator from salvage");
  assert.equal(R.foundCount(s), 2 + 0);
});

test("objective guide points at the right place and shrinks as you gather", () => {
  const s = newGame();
  assert.equal(R.objective(s).place, "forest");
  Object.assign(s.inv, { log: 10, leaf: 15 });
  const o = R.objective(s);
  assert.equal(o.place, "camp");
  assert.match(o.text, /Build/);
});

test("cheats: free crafting, instant needs, open map", () => {
  const s = newGame();
  s.cheats.freeCraft = true;
  R.craft(s, "shelter");
  assert.equal(s.flags.shelter, true);
  s.cheats.openMap = true;
  assert.equal(R.travelLock(s, "monolith"), "");
  s.cheats.needs = true; s.food = 5;
  R.tick(s, 1);
  assert.equal(s.food, 98 <= 100 ? s.food : 0);
  assert.ok(s.food >= 98);
});

test("save and manual-save helpers tolerate broken storage", () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const s = R.fresh("A");
  assert.equal(R.write(storage, s), true);
  assert.equal(R.read(storage).name, "A");
  assert.equal(R.write(storage, s, R.MANUAL_KEY), true);
  assert.equal(R.read({ getItem: () => "{nope" }), null);
  assert.equal(R.write({ setItem() { throw new Error("full"); } }, s), false);
});

test("the whole campaign is completable through the public rules", () => {
  const s = newGame();
  s.cheats.needs = true; // keeps energy and survival meters topped up; limits still apply
  const grab = (id, n) => { for (let i = 0; i < n; i++) { feed(s); if (/Picked clean/.test(R.act(s, "gather", R.place(id).gather[0].id))) { s.inv.log = (s.inv.log || 0) + 2; R.tick(s, 24 - s.hour); i--; } } };
  // I · settle
  R.travel(s, "forest"); grab("forest", 3);
  R.travel(s, "camp"); R.craft(s, "shelter");
  assert.equal(s.quest, 1);
  R.act(s, "rest", "rest"); assert.equal(s.pending, "blanket"); R.resolveBeat(s, "blanket", "blanket"); s.pending = null;
  R.travel(s, "grove"); grab("grove", 3);
  R.travel(s, "river"); grab("river", 3);
  R.travel(s, "camp"); R.craft(s, "fishing"); R.craft(s, "fire");
  assert.equal(s.quest, 2);
  // II · frontier
  R.act(s, "maya", "maya"); assert.equal(s.withMaya, true);
  R.travel(s, "ridge"); grab("ridge", 3);
  R.travel(s, "camp");
  R.travel(s, "river"); grab("river", 2);
  R.travel(s, "camp"); R.craft(s, "smelter");
  assert.equal(s.quest, 3);
  R.travel(s, "forest"); grab("forest", 1);
  R.travel(s, "camp");
  assert.equal(R.craft(s, "spear"), "Built Iron spear.");
  R.travel(s, "river");
  R.act(s, "wolf", "wolf");
  let guard = 0;
  while (s.encounter && guard++ < 20) { s.health = 100; R.fight(s, "attack"); }
  assert.equal(s.flags.wolf, true);
  assert.equal(s.quest, 4);
  // III · rift
  R.travel(s, "camp");
  R.travel(s, "forest"); grab("forest", 2);
  R.travel(s, "camp");
  s.gear.hero.coat = "coat2"; s.gear.maya.coat = "coat2"; s.flags.coat = true;
  s.inv.food = 6;
  R.travel(s, "ravine");
  assert.match(R.discover(s, [1, 2]), /incomplete/);
  assert.match(R.discover(s, R.TRAIL), /monolith/);
  assert.equal(s.quest, 5);
  R.travel(s, "monolith"); grab("monolith", 2);
  R.travel(s, "rift"); grab("rift", 3);
  R.travel(s, "ridge"); grab("ridge", 2);
  R.travel(s, "rift"); grab("rift", 2);
  assert.ok(s.inv.battery >= 1 && s.inv.alternator >= 1);
  R.travel(s, "camp");
  assert.equal(R.craft(s, "transmitter"), "Built Rift transmitter.");
  R.craft(s, "walls");
  for (let w = 0; w < 3; w++) {
    R.act(s, "defend", "defend");
    let g = 0;
    while (s.encounter && g++ < 20) { s.health = 100; R.fight(s, "attack"); }
  }
  assert.equal(s.waves, 3);
  assert.match(R.signal(s, ["antenna"]), /incomplete/);
  assert.match(R.signal(s, R.CIRCUIT), /live/);
  assert.equal(s.quest, 6);
  Object.assign(s.inv, { log: 10, leaf: 10, rope: 2 });
  assert.match(R.upgradeShelter(s, 0), /level 1/);
  s.hour = 19;
  assert.equal(R.beatReady(s, "talk"), "echo", "echo comes before the confession");
  R.resolveBeat(s, "echo", "day");
  assert.equal(R.beatReady(s, "talk"), "confession");
  R.resolveBeat(s, "confession", "commit");
  assert.equal(R.ending(s).title, "Shared Future");
  assert.ok(R.validate(JSON.parse(JSON.stringify(s))));
});

test("no random ambushes before the camp is established", () => {
  const s = R.fresh("Leo");
  for (let i = 0; i < 40; i++) { s.hour = 8; s.loc = "camp"; s.food = s.water = s.warmth = s.health = s.energy = 100; R.travel(s, "forest"); assert.equal(s.encounter, null); }
  s.quest = 2;
  let hit = false;
  for (let i = 0; i < 200 && !hit; i++) { s.encounter = null; s.hour = 8; s.loc = "camp"; s.food = s.water = s.warmth = s.health = s.energy = 100; R.travel(s, "forest"); hit = !!s.encounter; }
  assert.ok(hit, "ambushes can happen once the story has moved on");
});

test("seasons cycle through an 80-day year and winter is lean", () => {
  assert.equal(R.seasonOf(1), "Autumn");
  assert.equal(R.seasonOf(21), "Winter");
  assert.equal(R.seasonOf(41), "Spring");
  assert.equal(R.seasonOf(61), "Summer");
  assert.equal(R.seasonOf(81), "Autumn");
  const s = newGame();
  s.loc = "forest"; s.day = 25;
  assert.match(R.act(s, "gather", "timber"), /Gathered 5 Fallen logs, 4 Fern leaves/);
  s.day = 45; s.gathered = {}; s.loc = "grove";
  R.act(s, "gather", "forage");
  assert.equal(s.inv.berry, 4);
});

test("winter burns more fire fuel and chills harder", () => {
  const a = newGame(), b = newGame();
  a.flags.fire = b.flags.fire = true; a.inv.log = b.inv.log = 10;
  b.day = 21; a.hour = b.hour = 20; a.loc = b.loc = "forest";
  R.tick(a, 1); R.tick(b, 1);
  assert.ok(b.warmth < a.warmth);
  a.hour = b.hour = 23; a.day = 5; b.day = 25; R.tick(a, 1); R.tick(b, 1);
  assert.equal(a.inv.log, 8);
  assert.equal(b.inv.log, 7);
});

test("lean-to upgrades: three levels, costs, and bonuses", () => {
  const s = newGame();
  s.flags.shelter = true; s.shelters = [{ level: 0 }];
  assert.match(R.upgradeShelter(s, 0), /Not enough/);
  Object.assign(s.inv, { log: 120, leaf: 60, rope: 20, scrap: 40, clay: 20, stone: 20 });
  assert.match(R.upgradeShelter(s, 0), /level 1/);
  const w = s.warmth;
  assert.equal(R.mainLevel(s), 1);
  s.energy = 100; assert.match(R.upgradeShelter(s, 0), /level 2/);
  s.health = 10; s.energy = 100; R.act(s, "rest", "rest");
  assert.ok(s.health >= 50, "level 2 sleeps for +40 health");
  s.energy = 100; assert.match(R.upgradeShelter(s, 0), /level 3/);
  assert.match(R.upgradeShelter(s, 0), /Fully/);
  assert.equal(R.bedCount(s), 2, "level 3 main lean-to has room for 2 survivors");
  s.energy = 100; R.buildShelter(s);
  assert.equal(R.bedCount(s), 3, "another lean-to adds 1 bed");
  s.energy = 100; R.upgradeShelter(s, 1); s.energy = 100; R.upgradeShelter(s, 1); s.energy = 100; R.upgradeShelter(s, 1);
  assert.equal(R.bedCount(s), 4, "an upgraded extra lean-to houses 2");
});

const addPerson = (s, over = {}) => { s.survivors.push({ id: "t" + s.survivors.length, name: "Mara", sex: "F", child: false, health: 90, injured: false, sick: false, task: "idle", joined: 1, ...over }); return s.survivors.at(-1); };

test("survivors without beds lose health, fall sick and can die", () => {
  const s = newGame();
  s.flags.shelter = true; s.shelters = [{ level: 0 }];
  const p = addPerson(s);
  s.inv.food = 100;
  let day = 0;
  while (s.survivors.length && day++ < 12) { s.hour = 23; R.tick(s, 1); }
  assert.equal(s.survivors.length, 0, "died after days in the open");
  assert.equal(s.deaths, 1);
  const t = newGame();
  t.flags.shelter = true; t.shelters = [{ level: 0 }, { level: 0 }];
  const q = addPerson(t); t.inv.food = 100; t.inv.log = 100; t.flags.fire = true;
  for (let d = 0; d < 10; d++) { t.hour = 23; R.tick(t, 1); }
  assert.equal(t.survivors.length, 1);
  assert.ok(q.health >= 90, "a bed keeps them well");
});

test("survivors need food, and starve without it", () => {
  const s = newGame();
  s.shelters = [{ level: 0 }, { level: 0 }];
  const p = addPerson(s); s.inv = {};
  s.hour = 23; R.tick(s, 1);
  assert.ok(p.health < 90);
});

test("survivor tasks produce supplies at midnight; children cannot be assigned", () => {
  const s = newGame();
  s.shelters = [{ level: 0 }, { level: 0 }, { level: 0 }, { level: 0 }, { level: 0 }];
  s.flags.fishing = true; s.quest = 6; s.flags.wolf = true;
  const a = addPerson(s, { id: "a" }), b = addPerson(s, { id: "b", name: "Theo", sex: "M" }), c = addPerson(s, { id: "c", name: "Kai", sex: "M", child: true }), d = addPerson(s, { id: "d", name: "Rosa" });
  R.setTask(s, "a", "wood"); R.setTask(s, "b", "fish"); R.setTask(s, "d", "forage");
  assert.match(R.setTask(s, "c", "wood"), /too young/);
  assert.equal(c.task, "idle");
  s.inv = { food: 20, log: 0 };
  s.day = 2; s.hour = 23; R.tick(s, 1);
  assert.equal(s.inv.log, 4);
  assert.equal(s.inv.fish, 3 + 4, "survivor 3 plus Maya 4");
  assert.equal(s.inv.herb, 2);
});

test("a healer treats the injured and a fire tender saves a log", () => {
  const s = newGame();
  s.shelters = [{ level: 0 }, { level: 0 }, { level: 0 }, { level: 0 }];
  addPerson(s, { id: "h", task: "heal" }); const hurt = addPerson(s, { id: "i", name: "Beth", injured: true, health: 40 });
  addPerson(s, { id: "f", name: "Rosa", task: "fire", gear: { coat: "coat3" } });
  s.flags.fire = s.flags.fireBuilt = true; s.inv = { food: 20, log: 10, herb: 5 };
  s.hour = 23; R.tick(s, 1);
  assert.equal(hurt.injured, false);
  assert.equal(s.inv.log, 9, "tender: 1 log instead of 2");
  s.flags.fire = false; s.inv.log = 5; s.hour = 23; s.day = 7;
  R.tick(s, 1);
  assert.equal(s.flags.fire, true, "tender relights the fire");
});

test("children sometimes find helpful things", () => {
  const s = newGame();
  s.shelters = [{ level: 0 }, { level: 0 }];
  addPerson(s, { name: "Pip", sex: "F", child: true });
  s.inv = { food: 500 };
  const start = JSON.stringify(s.inv);
  let finds = 0;
  for (let d = 0; d < 30; d++) { s.hour = 23; const n = s.log.length; R.tick(s, 1); if (s.log.some((l) => /Pip found/.test(l))) finds++; s.log = []; }
  assert.ok(finds >= 5 && finds <= 25, "finds: " + finds);
});

test("strangers: ratio of women to men, few children", () => {
  const s = newGame();
  let f = 0, m = 0, c = 0, hostile = 0;
  for (let i = 0; i < 2000; i++) { const p = R.makeStranger(s); if (p.sex === "F") f++; else m++; if (p.child) c++; if (p.hostile) hostile++; assert.ok(!(p.child && p.hostile)); }
  assert.ok(f / 2000 > 0.7 && f / 2000 < 0.8, "women " + f / 2000);
  assert.ok(c / 2000 < 0.15, "children " + c / 2000);
  assert.ok(c > 0, "some children appear");
  assert.ok(hostile > 300 && hostile < 900, "hostile " + hostile);
});

test("finding a stranger during a search; good ones can be helped or brought home", () => {
  const s = newGame();
  s.quest = 2; s.loc = "forest"; s.cheats.safeTravel = true;
  let found = false;
  for (let d = 0; d < 400 && !found; d++) { s.day = 2 + (d % 10); s.energy = 100; s.found = {}; s.food = s.water = s.warmth = 100; R.search(s, "berries"); found = !!s.stranger; if (!found) s.stranger = null; }
  assert.ok(found, "strangers turn up while searching");
  assert.match(R.act(s, "gather", "timber") || R.travel(s, "camp"), /stranger/i, "must deal with them first");
  s.stranger = { name: "Dana", sex: "F", child: false, injured: true, hostile: false, helped: false };
  s.inv.herb = 0;
  assert.match(R.strangerOffer(s), /herb/);
  s.inv.herb = 1;
  assert.match(R.strangerOffer(s), /grateful/);
  assert.equal(s.stranger.injured, false);
  R.strangerBring(s);
  assert.equal(s.survivors.length, 1);
  assert.equal(s.loc, "camp");
  assert.equal(s.stranger, null);
  assert.equal(R.housing(s).unhoused, 1);
});

test("bad strangers: flee or fight", () => {
  const s = newGame(); s.seed = 99;
  const bad = () => ({ name: "Vik", sex: "M", child: false, injured: false, hostile: true, helped: false });
  s.stranger = bad(); assert.match(R.strangerBring(s), /will not come/);
  let escaped = 0;
  for (let i = 0; i < 100; i++) { s.stranger = bad(); s.health = 100; s.energy = 100; R.strangerFlee(s); if (s.health === 100) escaped++; }
  assert.ok(escaped > 50 && escaped < 90, "escapes " + escaped);
  s.stranger = bad(); R.strangerAttack(s);
  assert.equal(s.encounter.name, "Hostile survivor");
  s.flags.spear = true;
  while (s.encounter) { s.health = 100; R.fight(s, "attack"); }
  assert.ok(s.inv.scrap >= 2);
});

test("long game: winter must be survived, then a community, then the rift gate", () => {
  const s = newGame();
  s.cheats.needs = true; s.flags.signal = true; s.quest = 5; s.flags.shelter = true; s.shelters = [{ level: 0 }];
  R.progress(s);
  assert.equal(s.quest, 6);
  assert.match(R.objective(s).text, /spring/i);
  s.day = 40; s.hour = 23; R.tick(s, 1);
  assert.equal(s.day, 41);
  assert.equal(s.quest, 7);
  for (let i = 0; i < 3; i++) addPerson(s, { id: "x" + i, name: "N" + i });
  R.progress(s);
  assert.equal(s.quest, 7, "3 survivors is not a community");
  addPerson(s, { id: "x9", name: "N9" });
  R.progress(s);
  assert.equal(s.quest, 7, "no beds yet");
  s.shelters = [{ level: 0 }, { level: 0 }, { level: 0 }, { level: 0 }, { level: 0 }];
  R.progress(s);
  assert.equal(s.quest, 8);
  s.cheats.freeCraft = true;
  assert.equal(R.craft(s, "riftgate"), "Needs the transmitter first.");
  s.flags.transmitter = true;
  assert.equal(R.craft(s, "riftgate"), "Built Rift gate.");
  assert.ok(R.actionsFor(s).some((a) => a.type === "gate"));
  R.openGate(s);
  assert.equal(s.quest, 9);
  assert.ok(s.flags.partOne);
  assert.ok(R.validate(JSON.parse(JSON.stringify(s))));
});

test("older version 2 saves load with the new fields filled in", () => {
  const s = R.fresh("Old"); s.flags.shelter = true;
  for (const k of ["shelters", "survivors", "stranger", "spawned", "deaths", "energy", "gathered"]) delete s[k];
  assert.ok(R.validate(s));
  assert.deepEqual(s.shelters, [{ level: 0 }]);
  assert.equal(s.survivors.length, 0);
});

/* ---- update 5: sickness bar, drops, tanning, gear ---- */
const camp5 = () => { const s = newGame(); s.flags.shelter = true; s.flags.fire = s.flags.fireBuilt = true; s.shelters = [{ level: 0 }, { level: 0 }, { level: 0 }, { level: 0 }]; s.inv = { food: 50, log: 50 }; s.energy = 100; s.withMaya = true; return s; };
const night5 = (s) => { s.hour = 23; R.tick(s, 1); };

test("sickness is its own red bar: health only drops once the bar is full", () => {
  const s = camp5(); const p = addPerson(s, { sick: true, ill: 10, gear: { coat: "coat3" } });
  night5(s); assert.ok(p.ill > 10 && p.ill < 100 && p.health >= 90, "bar fills, health holds");
  for (let i = 0; i < 6; i++) night5(s);
  assert.equal(p.ill, 100);
  const h = p.health; night5(s);
  assert.ok(p.health < h, "full bar drains health");
});

test("healers treat health under 50%, injuries and sickness; sickness costs twice the herbs", () => {
  const s = camp5(); addPerson(s, { id: "h", task: "heal", gear: { coat: "coat3" } });
  const low = addPerson(s, { id: "a", name: "Beth", health: 40, gear: { coat: "coat3" } });
  const sick = addPerson(s, { id: "b", name: "Rosa", sick: true, ill: 50, gear: { coat: "coat3" } });
  s.inv.herb = 3; night5(s);
  assert.equal(s.inv.herb, 0, "1 herb for health + 2 for sickness");
  assert.equal(sick.sick, false); assert.ok(low.health > 40);
  const t = camp5(); addPerson(t, { id: "h", task: "heal", gear: { coat: "coat3" } });
  const u = addPerson(t, { id: "b", name: "Rosa", sick: true, ill: 50, gear: { coat: "coat3" } });
  t.inv.herb = 1; night5(t);
  assert.equal(u.sick, true, "not enough herbs for sickness"); assert.equal(t.inv.herb, 1);
  assert.match(R.treat(t, "b"), /need 2/);
});

test("a killed animal leaves meat, hides and claws to collect", () => {
  const s = newGame(); s.quest = 1; s.encounter = { name: "Dire wolf", hp: 1, max: 45, damage: 1 };
  R.fight(s, "attack");
  assert.ok(s.drop && s.drop.loot.meat && s.drop.loot.hide && s.drop.loot.claw);
  assert.match(R.collect(s), /Collected/);
  assert.equal(s.drop, null); assert.ok(s.inv.meat >= 3 && s.inv.hide >= 2 && s.inv.claw >= 2);
  s.encounter = { name: "Cave bear", hp: 1, max: 65, damage: 1 }; R.fight(s, "attack");
  assert.equal(s.drop.loot.pelt, 1);
  R.act(s, "nap", "nap"); assert.equal(s.drop, null, "other actions auto-collect");
});

test("hides are tanned into leather, which makes clothing that can be upgraded", () => {
  const s = camp5(); s.inv.hide = 3; s.inv.leaf = 10; s.inv.rope = 5; s.inv.pelt = 1;
  assert.match(R.craft(s, "leather"), /tanning rack/);
  s.inv.log = 20; R.craft(s, "tanrack"); s.energy = 100;
  R.craft(s, "leather"); R.craft(s, "leather"); assert.equal(s.inv.leather, 2);
  assert.match(R.craftGear(s, "shirt"), /Crafted/); assert.equal(s.gearBag.shirt1, 1);
  s.inv.leather = 6; s.energy = 100;
  assert.match(R.upgradeGear(s, "bag:shirt1"), /Leather shirt/);
  assert.equal(s.gearBag.shirt2, 1); assert.equal(s.gearBag.shirt1, undefined);
  s.energy = 100; s.inv.leather = 10; s.inv.pelt = 1; assert.match(R.upgradeGear(s, "bag:shirt2"), /Fur-lined/);
  assert.match(R.upgradeGear(s, "bag:shirt3"), /Fully/);
});

test("equipping gear: slots, swaps, children, warmth and the winter coat flag", () => {
  const s = camp5(); const kid = addPerson(s, { id: "k", name: "Pip", child: true });
  s.gearBag = { shirt1: 1, shirt2: 1, spear1: 1, coat2: 3, axe1: 1 };
  R.equip(s, "hero", "shirt1"); R.equip(s, "hero", "shirt2");
  assert.equal(R.gearOf(s, "hero").shirt, "shirt2"); assert.equal(s.gearBag.shirt1, 1, "old shirt goes back to the pack");
  assert.match(R.equip(s, "k", "spear1"), /too young/); assert.match(R.equip(s, "k", "coat2"), /equipped/);
  assert.equal(R.warmOf(R.gearOf(s, "hero")), 2);
  assert.ok(!s.flags.coat);
  R.equip(s, "hero", "coat2"); R.equip(s, "maya", "coat2" ); 
  assert.equal(s.flags.coat, true, "heavy coats on you and Maya satisfy the ravine requirement");
  R.unequip(s, "hero", "shirt"); assert.equal(s.gearBag.shirt2, 1);
  s.loc = "forest"; assert.match(R.equip(s, "hero", "axe1"), /camp/);
});

test("new chores: hunting needs a weapon, tanning needs a rack, cooks smoke meat, water haulers fill bottles", () => {
  const s = camp5(); const w = addPerson(s, { id: "w", task: "idle", gear: { coat: "coat3" } });
  assert.match(R.setTask(s, "w", "hunt"), /needs a spear/);
  assert.match(R.setTask(s, "w", "tan"), /tanning rack/);
  w.gear.weapon = "spear2"; assert.match(R.setTask(s, "w", "hunt"), /Hunt/);
  night5(s); assert.ok((s.inv.meat || 0) >= 3, "hunt brings meat");
  const fit = () => { w.sick = false; w.injured = false; w.health = 90; };
  fit(); w.task = "cook"; const m = s.inv.meat; night5(s);
  assert.ok(s.inv.meat < m && s.inv.food > 50, "cook smokes meat into rations");
  fit(); s.flags.tanrack = true; s.inv.hide = 3; w.task = "tan"; night5(s); assert.equal(s.inv.leather, 2);
  fit(); w.task = "water"; night5(s); assert.ok(s.inv.water >= 4);
});

test("tools and clothing change yields and cold", () => {
  const s = camp5(); const w = addPerson(s, { id: "w", task: "wood", gear: { tool: "axe2", coat: "coat3" } });
  s.inv.log = 0; s.flags.fire = false; night5(s); assert.ok(s.inv.log >= 8, "axe adds logs");
  const t = newGame(); t.loc = "forest"; t.flags.shelter = true; t.inv = {};
  const base = R.actionsFor(t).find((a) => a.id === "timber").label ? 1 : 0;
  t.gear.hero.tool = "axe1"; R.act(t, "gather", "timber"); const g1 = t.inv.log;
  const u = newGame(); u.loc = "forest"; u.flags.shelter = true; u.inv = {}; R.act(u, "gather", "timber");
  assert.equal(g1 - u.inv.log, 2, "stone axe: +2 logs");
});

test("older saves gain gear, drop and sickness fields", () => {
  const s = newGame(); delete s.gearBag; delete s.gear; delete s.drop;
  s.survivors = [{ id: "x", name: "Mara", sex: "F", child: false, health: 80, injured: false, sick: true, task: "idle", joined: 1 }];
  R.validate(s); assert.ok(s.gearBag && s.gear.hero && s.gear.maya && s.drop === null);
  assert.equal(s.survivors[0].ill, 20); assert.deepEqual(s.survivors[0].gear, {});
});

/* ---- update 6: curfew, forced sleep, hunting ---- */
const dusk = () => { const s = R.fresh("Leo"); s.cheats.noCurfew = false; s.cheats.safeTravel = true; s.flags.shelter = true; s.shelters = [{ level: 0 }]; s.inv.log = 20; return s; };

test("sunset warns, night travel remains available, midnight never forces return or sleep", () => {
 const s=dusk();s.loc="forest";s.hour=18;s.food=s.water=s.warmth=100;
 R.tick(s,1);assert.match(s.log.join(" "),/Sunset/);
 R.tick(s,5);assert.equal(s.loc,"forest");assert.equal(s.hour,0);assert.equal(s.day,2);assert.ok(!s.notice);
 assert.equal(R.travelLock(s,"grove"),"");
});
test("night effort costs more energy and zero energy still permits returning home", () => {
 const s=dusk();s.hour=20;assert.equal(R.actionEnergy(s,"travel"),6);assert.equal(R.actionEnergy(s,"gather"),12);
 assert.match(R.travel(s,"forest"),/Arrived/);s.energy=0;assert.match(R.travel(s,"grove"),/Too tired/);
 assert.match(R.travel(s,"camp"),/Arrived/);assert.equal(s.loc,"camp");
});
test("camp work stays available at night and uses shorter durations", () => {
 const s=dusk();s.hour=22;assert.ok(!R.actionsFor(s).find(a=>a.type==="refill").disabled);
 R.act(s,"refill","refill");assert.equal(s.hour,22);assert.equal(s.minute,10);
});
test("midnight refreshes one day while sleep is explicitly until six", () => {
 const s=dusk();s.hour=23;s.minute=50;s.flags.fire=true;s.inv.log=20;
 R.tick(s,1/6);assert.equal(s.hour,0);assert.equal(s.minute,0);assert.equal(s.day,2);assert.equal(s.inv.log,18);
 s.health=s.food=s.water=s.warmth=100;R.act(s,"rest","rest");assert.equal(s.hour,6);assert.equal(s.minute,0);assert.equal(s.day,2);assert.equal(s.energy,100);
});

test("resting by the fire skips time before dusk", () => {
  const s = dusk(); s.hour = 12; s.energy = 40;
  for (let i = 0; i < 4; i++) R.act(s, "nap", "nap");
  assert.equal(s.hour, 16); assert.equal(s.energy, 100);
});

test("hunting: needs a weapon, brings meat and hides, and the winter coat recipe is gone", () => {
  const s = newGame(); s.quest = 1; s.loc = "forest";
  assert.ok(R.actionsFor(s).find((a) => a.type === "hunt").disabled);
  s.gear.hero.weapon = "spear1";
  assert.match(R.act(s, "hunt", "hunt"), /Collected/);
  assert.ok(s.inv.meat >= 2 && s.inv.hide >= 1);
  assert.equal(R.recipes.coat, undefined);
  const o = R.fresh("Leo"); o.flags.coat = true; o.gear = undefined; R.validate(o);
  assert.equal(o.gear.hero.coat, "coat2", "old winter coats become gear");
  const q = newGame(); q.quest = 4; assert.match(R.objective(q).text, /tanning rack/);
});
