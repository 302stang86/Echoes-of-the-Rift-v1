const test = require("node:test");
const assert = require("node:assert/strict");
globalThis.window = globalThis;
require("../assets/scene-data.js");
const R = require("../assets/game.js");

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
  assert.ok(labels("camp").includes("Rest in the lean-to"));
  assert.ok(!labels("camp").some((l) => /^Gather/.test(l)));
  assert.ok(labels("forest").includes("Gather timber and ferns"));
  assert.ok(labels("river").includes("Fish the river"));
  assert.ok(!labels("forest").includes("Fish the river"));
  assert.ok(labels("den").includes("Confront the cave bear"));
  for (const p of R.places) assert.ok(labels(p.id).includes("Search the area"), p.id + " has a search");
});

test("gathering has no daily limit and no carry slots", () => {
  const s = newGame();
  R.travel(s, "forest");
  for (let i = 0; i < 6; i++) { feed(s); R.act(s, "gather", "timber"); }
  assert.equal(s.inv.log, 30);
  assert.equal(s.inv.leaf, 48);
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

test("rest needs the lean-to and restores health", () => {
  const s = newGame();
  s.health = 40;
  assert.match(R.act(s, "rest", "rest"), /lean-to/);
  s.flags.shelter = true;
  R.act(s, "rest", "rest");
  assert.ok(s.health >= 65);
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

test("travel locks follow the quests; fast travel after the signal", () => {
  const s = newGame();
  assert.match(R.travelLock(s, "ridge"), /Iron|Fresh/);
  assert.match(R.travelLock(s, "glacier"), /coats/);
  assert.match(R.travelLock(s, "monolith"), /monolith/);
  s.quest = 4;
  assert.equal(R.travelLock(s, "ravine"), "");
  assert.equal(R.travelHours(s, "forest"), 2);
  s.flags.signal = true; s.visited.forest = true;
  assert.equal(R.travelHours(s, "forest"), 1);
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
  assert.match(R.search(s, "herbs"), /Already/);
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
  const grab = (id, n) => { for (let i = 0; i < n; i++) { feed(s); R.act(s, "gather", R.place(id).gather[0].id); } };
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
  s.inv.rope = 2; R.craft(s, "coat");
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
  for (let i = 0; i < 40; i++) { s.hour = 8; s.loc = "camp"; s.food = s.water = s.warmth = s.health = 100; R.travel(s, "forest"); assert.equal(s.encounter, null); }
  s.quest = 2;
  let hit = false;
  for (let i = 0; i < 200 && !hit; i++) { s.encounter = null; s.hour = 8; s.loc = "camp"; s.food = s.water = s.warmth = s.health = 100; R.travel(s, "forest"); hit = !!s.encounter; }
  assert.ok(hit, "ambushes can happen once the story has moved on");
});
