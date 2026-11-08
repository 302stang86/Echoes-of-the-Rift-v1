/* Echoes of the Rift v2 — game rules. No DOM access here, so the rules can be tested in Node. */
(function (root) {
  "use strict";
  const KEY = "echoes-rift-v2";
  const MANUAL_KEY = "echoes-rift-v2-manual";

  const DAILY_LIMIT = 3; // gathers per area per day
  const ENERGY = { max: 100, gather: 8, search: 4, lore: 2, travel: 4, craft: 4, refill: 2, wolf: 6, bear: 6, ravine: 12, defend: 8, nap: 25 };
  const WILD_CHANCE = 0.15;
  const SEASON_LEN = 20; // days; four seasons make an 80-day year
  const seasonOf = (day) => ["Autumn", "Winter", "Spring", "Summer"][Math.floor(((day - 1) % (SEASON_LEN * 4)) / SEASON_LEN)];
  const SHELTER_UPGRADES = [
    { cost: { log: 8, leaf: 10, rope: 2 }, desc: "Warmer nights and a sturdier frame." },
    { cost: { log: 10, scrap: 4, clay: 4 }, desc: "Better rest: more healing when you sleep, and injured survivors recover faster." },
    { cost: { log: 14, scrap: 6, rope: 3, stone: 6 }, desc: "Room for 2 survivors to sleep inside." },
  ];
  const EXTRA_LEANTO = { log: 8, leaf: 12, rope: 1 };
  const MAX_LEANTOS = 8, MAX_SURVIVORS = 14;
  const TASKS = { idle: "Resting", wood: "Gather wood", fish: "Fish", forage: "Forage food", fire: "Tend the fire", heal: "Tend the injured" };

  const names = {
    log: "Fallen logs", leaf: "Fern leaves", rope: "Rope", sapling: "Birch saplings",
    wire: "Copper wire", scrap: "Metal plates", stone: "Flint & stone", clay: "River clay",
    herb: "Medicinal herbs", berry: "Wild berries", fish: "Raw fish", food: "Preserved rations",
    water: "Bottled water", pelt: "Wolf pelt", energy: "Rift crystals", battery: "Car battery",
    alternator: "Mustang alternator", trap: "Wooden traps",
  };

  // Where each material is usually found. Used for the "what next?" guide.
  const source = {
    log: "forest", leaf: "forest", sapling: "grove", herb: "grove", berry: "grove",
    stone: "river", clay: "river", fish: "river", scrap: "rift", wire: "rift",
    energy: "rift", battery: "rift", alternator: "ridge",
  };

  const recipes = {
    shelter: { title: "Riverbank lean-to", desc: "A safe place to sleep. Lets you rest at camp.", cost: { log: 10, leaf: 15, rope: 1 }, flag: "shelter", art: "frontier-08" },
    fire: { title: "Campfire", desc: "Warms the camp. Burns 2 logs each midnight.", cost: { stone: 4, log: 3 }, flag: "fire", art: "frontier-20" },
    fishing: { title: "Maya’s fishing rig", desc: "Lets you and Maya fish. Maya fishes daily while she stays at camp.", cost: { sapling: 5, wire: 2 }, flag: "fishing", gate: 1, art: "frontier-06" },
    smelter: { title: "Primitive smelter", desc: "Refines salvaged metal. Opens iron tools.", cost: { stone: 8, clay: 5, scrap: 4 }, flag: "smelter", gate: 2, art: "frontier-03" },
    spear: { title: "Iron spear", desc: "Strike for 24 instead of 12.", cost: { scrap: 4, log: 3 }, flag: "spear", requires: "smelter", art: "frontier-03" },
    axe: { title: "Iron axe", desc: "3 extra logs every time you gather timber.", cost: { scrap: 3, log: 2 }, flag: "axe", requires: "smelter", art: "frontier-05" },
    walls: { title: "Reinforced palisade", desc: "Cuts damage from the transmitter defense waves.", cost: { scrap: 4, log: 12 }, flag: "walls", requires: "smelter", art: "frontier-19" },
    coat: { title: "Heavy winter coats", desc: "Warm coats for you and Maya. Needed for Glacier Peaks.", cost: { pelt: 1, leaf: 8, rope: 2 }, flag: "coat", art: "frontier-02" },
    rope: { title: "Braided fern cord", desc: "Makes 1 rope from tough fern fibers.", cost: { leaf: 5 }, item: "rope", count: 1, art: "frontier-01" },
    trap: { title: "Wooden trap", desc: "Weakens an attacker by 20.", cost: { log: 3, rope: 1 }, item: "trap", count: 1, art: "frontier-02" },
    food: { title: "Preserve food", desc: "Smoke 2 fish into 3 rations. Needs a burning fire.", cost: { fish: 2 }, item: "food", count: 3, requires: "fire", art: "frontier-06" },
    med: { title: "Herbal dressing", desc: "Restores 30 health.", cost: { herb: 3 }, heal: 30, art: "frontier-18" },
    riftgate: { title: "Rift gate", desc: "A stabilized stone arch. Opens the way to the far shore.", cost: { energy: 20, scrap: 15, wire: 12, stone: 20, log: 20 }, flag: "riftgate", requires: "transmitter", gate: 8, art: "frontier-14" },
    transmitter: { title: "Rift transmitter", desc: "An alternator, a battery and rift crystals: a signal across time.", cost: { alternator: 1, battery: 1, wire: 6, energy: 6, scrap: 6 }, flag: "transmitter", requires: "monolith", art: "frontier-13" },
  };
  const requireNames = { shelter: "the lean-to", fire: "a campfire", smelter: "the smelter", walls: "the palisade", monolith: "the Rift Monolith", transmitter: "the transmitter" };

  const quests = [
    { title: "First Shelter", chapter: "I · Settling the wilderness", desc: "Build a lean-to beside the river.", art: "frontier-08" },
    { title: "Fresh Catch", chapter: "I · Settling the wilderness", desc: "Craft a fishing rig so Maya can feed the camp.", art: "frontier-06" },
    { title: "Iron & Flint", chapter: "II · The frontier", desc: "Take Maya to Broken Ridge, salvage the wreck, and build a smelter.", art: "frontier-03" },
    { title: "Apex Predator", chapter: "II · The frontier", desc: "Face the dire wolf at River Bend with an iron spear or 3 wooden traps.", art: "frontier-02" },
    { title: "Signals in the Mist", chapter: "III · Rift mysteries", desc: "With Maya, winter coats and 6 rations, follow the trail through Foggy Ravine.", art: "frontier-07" },
    { title: "Bridging the Eras", chapter: "III · Rift mysteries", desc: "Build the transmitter, defend it through 3 waves, then connect its circuit.", art: "frontier-13" },
    { title: "The Long Winter", chapter: "IV · The settlement", desc: "Survive until spring. Keep the fire lit, keep everyone fed, and keep survivors sheltered.", art: "frontier-20" },
    { title: "A Community", chapter: "IV · The settlement", desc: "Bring at least 4 survivors to camp and give each of them a bed.", art: "frontier-19" },
    { title: "The Far Shore", chapter: "IV · The settlement", desc: "Build the rift gate and open the way to what lies beyond.", art: "frontier-14" },
  ];

  /* Every place lists only the actions that make sense there.
     type "gather" gives a themed bundle in 1 hour. */
  const places = [
    { id: "camp", name: "River Camp", x: 430, y: 310, label: "CAMP", kind: "Home", art: "frontier-20",
      desc: "Your riverbank refuge. Rest, cook, build and talk with Maya." },
    { id: "forest", name: "Old-growth Forest", x: 130, y: 350, label: "FOREST", kind: "Timber", art: "frontier-05",
      desc: "Ancient conifers shelter fallen timber and broad fern leaves.",
      gather: [{ id: "timber", label: "Gather timber and ferns", loot: (s) => ({ log: 5 + (s.flags.axe ? 3 : 0), leaf: 8 }) }] },
    { id: "grove", name: "Birch Grove", x: 580, y: 645, label: "GROVE", kind: "Plants", art: "frontier-18",
      desc: "Flexible saplings, sweet berries and medicinal herbs.",
      gather: [{ id: "forage", label: "Gather saplings, berries and herbs", loot: (s) => ({ sapling: 3, herb: s.withMaya ? 4 : 2, berry: 3 }) }] },
    { id: "river", name: "River Bend", x: 265, y: 452, label: "RIVER", kind: "River", art: "frontier-02",
      desc: "Flint and clay line the water. A wounded dire wolf stalks the trail.",
      gather: [
        { id: "flint", label: "Collect flint and clay", loot: () => ({ stone: 4, clay: 3 }) },
        { id: "fish", label: "Fish the river", loot: () => ({ fish: 3 }), needsFlag: "fishing", why: "Build the fishing rig first." },
      ] },
    { id: "ridge", name: "Broken Ridge", x: 846, y: 176, label: "RIDGE", kind: "Salvage", art: "frontier-16", gate: 2,
      desc: "Modern wreckage lodged among fractured rock. Maya’s help is needed to salvage it.",
      gather: [{ id: "salvage", label: "Salvage the wreck", needsMaya: "Bring Maya to help salvage the wreck.", loot: (s) => ({ scrap: 6, wire: 3, ...(s.flags.salvaged ? {} : { alternator: 1 }) }) }] },
    { id: "rift", name: "Glowing Purple Rift", x: 912, y: 587, label: "RIFT", kind: "Anomaly", art: "frontier-14",
      desc: "Temporary tears drop batteries, wire and metal into the clearing. Crystals glow in the soil.",
      gather: [{ id: "scavenge", label: "Scavenge the rift debris", loot: (s) => ({ energy: s.flags.monolith ? 4 : 2, scrap: 3, wire: 2, ...(s.flags.batteryFound ? {} : { battery: 1 }) }) }] },
    { id: "ravine", name: "Foggy Ravine", x: 645, y: 259, label: "RAVINE", kind: "Quest", art: "frontier-07", gate: 4,
      desc: "Cairns mark a trail toward the monolith. Bring Maya, winter coats and 6 rations.",
      gather: [{ id: "forage", label: "Gather stone and herbs", loot: () => ({ stone: 3, herb: 3 }) }] },
    { id: "glacier", name: "Glacier Peaks", x: 315, y: 89, label: "GLACIER", kind: "Highlands", art: "frontier-01", requires: "coat",
      desc: "Crystals lie among ice-scoured rock. Winter coats are required.",
      gather: [{ id: "chip", label: "Chip crystals from the ice", loot: () => ({ stone: 5, energy: 1 }) }] },
    { id: "den", name: "Cave Bear Den", x: 1240, y: 225, label: "DEN", kind: "Danger", art: "frontier-04", gate: 3,
      desc: "A cave bear shelters under the eastern canopy.",
      gather: [{ id: "forage", label: "Forage near the den", loot: () => ({ stone: 4, herb: 2 }) }] },
    { id: "meadow", name: "Woolly Rhino Meadow", x: 962, y: 311, label: "MEADOW", kind: "Wildlife", art: "frontier-09", gate: 2,
      desc: "Rhinos graze beyond the river. Forage quietly at the edge.",
      gather: [{ id: "forage", label: "Forage the meadow edge", loot: (s) => ({ leaf: 4, berry: 4, herb: s.withMaya ? 4 : 2 }) }] },
    { id: "totem", name: "Wolf Totem", x: 150, y: 635, label: "TOTEM", kind: "Lore", art: "frontier-02", gate: 3,
      desc: "Carved wolf figures watch the southern forest. Their markings echo the rift.",
      gather: [{ id: "collect", label: "Collect stone and crystal", loot: () => ({ stone: 4, energy: 1 }) }] },
    { id: "monolith", name: "Rift Monolith", x: 1200, y: 432, label: "MONOLITH", kind: "Rift technology", art: "frontier-07", requires: "monolith",
      desc: "An ancient stone anchor, humming in answer to your footsteps.",
      gather: [{ id: "draw", label: "Draw crystals from the monolith", loot: () => ({ energy: 4, stone: 2 }) }] },
    { id: "coast", name: "Prehistoric Sea", x: 1265, y: 631, label: "COAST", kind: "Coast", art: "frontier-17", gate: 4,
      desc: "A shore beside the river delta. Storms wash clay, stone and copper onto the beach.",
      gather: [{ id: "comb", label: "Comb the shore", loot: () => ({ clay: 4, stone: 2, wire: 1 }) }] },
  ];
  const place = (id) => places.find((p) => p.id === id);

  /* ---- story moments with Maya, tied to quest milestones ---- */
  const beatTitles = { blanket: "The Shared Blanket", echo: "The Reminiscent Echo", confession: "The Riverbank Confession" };
  function beatScene(s, id) {
    const n = s.name;
    if (id === "blanket")
      return { title: beatTitles[id], art: "frontier-20",
        lead: "Your first night beneath the lean-to is a cold one. Maya is shivering at the edge of the fire ring. You sit beside her and offer what warmth you have.",
        lines: [["Maya Lin", "You didn’t have to give me your extra layer, " + n + "."], [n, "Cold nights don’t care about personal space. Just keep warm."]],
        choices: [["jacket", "Offer the scavenged jacket"], ["blanket", "Share the heavy wool blanket"]] };
    if (id === "echo")
      return { title: beatTitles[id], art: "frontier-06",
        lead: "A good day at the river settles into quiet. Maya turns a copper fishing hook in her fingers and tells you about the life she left behind.",
        lines: [["Maya Lin", "Before all this, I used to think my life was mapped out. College, career, predictable routine. Now… looking at the stars here, none of that matters. As long as you’re here, I feel grounded, " + n + "."]],
        choices: [["together", "“We’re building a new map together, Maya.”"], ["day", "“We just need to take it one day at a time.”"]] };
    return { title: beatTitles.confession, art: "frontier-20",
      lead: "Evening settles over the river camp. Maya places a small keepsake in your palm: reeds woven around a fine strand of copper. Beyond the fire, the valley stretches into violet dusk.",
      lines: [["Maya Lin", "I made this for you, " + n + ". I don’t know if we’ll ever get our old lives back. But I know who I want beside me in this one."], [n, "We’ve built more than a shelter here. We’ve built a life."], ["Maya Lin", "Then let’s choose it. Together."]],
      choices: [["commit", "Choose a life together"], ["friends", "Choose a lifelong friendship"]] };
  }
  const isEvening = (s) => s.hour >= 17 || s.hour < 5;
  // Which story moment is ready? "via" is how the player got there: rest or talk.
  function beatReady(s, via) {
    const b = s.beats;
    if (s.encounter || s.loc !== "camp") return null;
    if (!b.blanket && s.flags.shelter && via === "rest") return "blanket";
    if (b.blanket && !b.echo && s.quest >= 2) return "echo";
    if (b.echo && !b.confession && s.flags.signal && isEvening(s) && via === "talk" && mainLevel(s) >= 1) return "confession";
    return null;
  }
  function beatWaiting(s) {
    // For a small hint in the UI: a moment exists but is not ready yet.
    const b = s.beats;
    if (!b.blanket && s.flags.shelter) return "Rest in the lean-to tonight.";
    if (b.blanket && !b.echo && s.quest < 2) return "";
    if (b.echo && !b.confession && s.flags.signal && mainLevel(s) < 1) return "Upgrade the lean-to so Maya has a proper home.";
    if (b.echo && !b.confession && s.flags.signal && !isEvening(s)) return "Maya wants to talk by the fire at dusk.";
    return "";
  }
  function resolveBeat(s, id, choice) {
    const scene = beatScene(s, id);
    if (s.beats[id] || !scene.choices.some((c) => c[0] === choice)) return "That moment has passed.";
    s.beats[id] = choice;
    s.beatDays[id] = s.day;
    if (id === "blanket") note(s, "The Shared Blanket: warmth is easier to find together.");
    if (id === "echo") note(s, "The Reminiscent Echo: Maya shares what she left behind.");
    if (id === "confession") {
      s.flags.committed = choice === "commit";
      note(s, s.flags.committed ? "The Riverbank Confession: you choose a life together." : "The Riverbank Confession: you choose a lasting friendship.");
    }
    return "A moment to remember.";
  }
  function ending(s) {
    if (!s.beats.confession) return null;
    const c = s.flags.committed;
    return c
      ? { title: "Shared Future", text: "The transmitter carries human voices across the years, but the answer to where you belong is already beside you. " + s.name + " and Maya Lin welcome the new arrivals, strengthen the river camp, and watch another fire-lit evening settle over the valley. Maya’s things are already in the upgraded lean-to beside yours. They may still search for answers. They no longer search for home." }
      : { title: "Lifelong Allies", text: "You thank Maya for her honesty. Together you choose a friendship built on care and mutual respect. When the new arrivals come, you are the ones who show them the river, the fire and the way home. The valley is a place you will protect side by side." };
  }
  function dialogue(s) {
    if (s.flags.committed) return ["The river sounds different when you know you’re staying, " + s.name + ".", "Whatever answers the transmitter brings, this is our home.", "I kept your woven token. It reminds me of everything we chose."][s.day % 3];
    if (s.beats.confession) return "We found a family in this valley, " + s.name + ". I’m glad we were honest with each other.";
    if (s.beats.echo) return "We don’t need to say much on the trail anymore. I know when you’ve spotted something.";
    return "We can’t control where we landed. We can control what we make of it.";
  }
  const support = (s) => ({
    damageReduction: s.withMaya ? (s.flags.committed ? 6 : 3) : 0,
    bonus: s.flags.committed ? 2 : 0,
  });

  /* ---- state ---- */
  function fresh(name) {
    return {
      version: 2, name: String(name || "Leo").trim().slice(0, 24) || "Leo",
      started: true, prologue: 0, day: 1, hour: 8,
      health: 100, food: 100, water: 100, warmth: 85, energy: 100, gathered: {}, shelters: [], survivors: [], stranger: null, spawned: { f: 0, m: 0, c: 0, t: 0 }, deaths: 0,
      loc: "camp", quest: 0, withMaya: false, flags: {},
      inv: { rope: 2, wire: 4, food: 6, water: 5 },
      visited: { camp: true }, found: {}, beats: {}, beatDays: {},
      waves: 0, encounter: null, collapses: 0, pending: null,
      log: ["The river is clear. For the first time in four days, the air is easy to breathe."],
      seed: 4817, cheats: { everUsed: false, god: false, needs: false, freeCraft: false, fastTravel: false, safeTravel: false, openMap: false },
    };
  }
  function validate(s) {
    if (s && s.version === 2) {
      if (s.energy === undefined) s.energy = 100;
      if (!s.gathered) s.gathered = {};
      if (!s.shelters) s.shelters = s.flags && s.flags.shelter ? [{ level: 0 }] : [];
      if (!s.survivors) s.survivors = [];
      if (s.stranger === undefined) s.stranger = null;
      if (!s.spawned) s.spawned = { f: 0, m: 0, c: 0, t: 0 };
      if (s.deaths === undefined) s.deaths = 0;
    }
    if (!s || s.version !== 2 || typeof s.name !== "string" || s.name.length > 24) return false;
    if (!place(s.loc) || !Number.isInteger(s.quest) || s.quest < 0 || s.quest > 9) return false;
    for (const k of ["health", "food", "water", "warmth", "energy"]) if (!Number.isFinite(s[k]) || s[k] < 0 || s[k] > 100) return false;
    for (const k of ["day", "hour", "waves", "prologue", "seed"]) if (!Number.isFinite(s[k]) || s[k] < 0) return false;
    if (s.hour >= 24 || s.day < 1 || s.waves > 3 || s.prologue > 4) return false;
    if (typeof s.withMaya !== "boolean" || !s.flags || !s.inv || !s.visited || !s.found || !s.beats || !s.beatDays || !s.cheats) return false;
    if (!Array.isArray(s.log) || s.log.length > 100) return false;
    if (!Array.isArray(s.shelters) || s.shelters.length > MAX_LEANTOS || s.shelters.some((x) => !x || !Number.isInteger(x.level) || x.level < 0 || x.level > 3)) return false;
    if (!Array.isArray(s.survivors) || s.survivors.length > MAX_SURVIVORS || s.survivors.some((p) => !p || typeof p.name !== "string" || p.name.length > 40 || !Number.isFinite(p.health) || !Object.hasOwn(TASKS, p.task))) return false;
    if (Object.values(s.flags).some((v) => typeof v !== "boolean")) return false;
    if (Object.entries(s.inv).some(([k, v]) => !Object.hasOwn(names, k) || !Number.isFinite(v) || v < 0 || v > 9999)) return false;
    if (s.encounter && (!Number.isFinite(s.encounter.hp) || !Number.isFinite(s.encounter.max) || !Number.isFinite(s.encounter.damage) || typeof s.encounter.name !== "string")) return false;
    return true;
  }
  function read(storage, key) {
    try { const s = JSON.parse(storage.getItem(key || KEY)); return validate(s) ? s : null; } catch { return null; }
  }
  function write(storage, s, key) {
    try { storage.setItem(key || KEY, JSON.stringify(s)); return true; } catch { return false; }
  }

  function random(s) { s.seed = (s.seed * 1664525 + 1013904223) >>> 0; return s.seed / 4294967296; }
  function add(s, k, n) { s.inv[k] = Math.min(9999, (s.inv[k] || 0) + n); }
  function note(s, t) { s.log.unshift(t); s.log = s.log.slice(0, 40); }
  const can = (s, c) => Object.entries(c).every(([k, n]) => (s.inv[k] || 0) >= n);
  const pay = (s, c) => { for (const [k, n] of Object.entries(c)) s.inv[k] -= n; };
  const list = (loot) => Object.entries(loot).map(([k, n]) => n + " " + names[k]).join(", ");

  function clamp(s) {
    const c = s.cheats;
    if (c.god) s.health = 100;
    if (c.needs) { s.food = 100; s.water = 100; s.warmth = 100; s.energy = 100; }
    for (const k of ["health", "food", "water", "warmth", "energy"]) s[k] = Math.max(0, Math.min(100, s[k]));
    if (s.health <= 0) collapse(s);
  }
  // Falling is not the end: Maya finds you and drags you back to camp by morning.
  function collapse(s) {
    s.collapses++;
    s.encounter = null;
    s.loc = "camp";
    s.withMaya = false;
    s.health = 35; s.food = Math.max(s.food, 40); s.water = Math.max(s.water, 40); s.warmth = Math.max(s.warmth, 50); s.energy = Math.max(s.energy, 60);
    if (s.hour >= 7) s.day++;
    s.hour = 7;
    note(s, "You black out. Maya finds you and drags you back to camp. You wake at dawn, weak but alive.");
  }

  const PLANTS = ["leaf", "berry", "herb", "sapling"];
  // Seasons change what the land gives: winter is lean, spring is generous.
  function seasonLoot(s, loot) {
    const se = seasonOf(s.day);
    for (const k of PLANTS) if (loot[k]) {
      if (se === "Winter") loot[k] = Math.max(1, Math.floor(loot[k] / 2));
      else if (se === "Spring" && (k === "berry" || k === "herb")) loot[k] += 1;
    }
    return loot;
  }
  const SEASON_NOTES = {
    Autumn: "Autumn begins. The air is crisp and the land is generous.",
    Winter: "Winter has arrived. Nights are harsher, plants are scarce, and the fire burns more logs.",
    Spring: "Spring begins. The ice breaks and the valley turns green.",
    Summer: "Summer begins. Days are hot and you will need more water.",
  };
  const mainLevel = (s) => (s.shelters[0] ? s.shelters[0].level : 0);
  const bestLevel = (s) => s.shelters.reduce((m, x) => Math.max(m, x.level), 0);
  // Beds for rescued survivors. You and Maya share the main lean-to; it only has spare room at upgrade 3.
  const bedCount = (s) => s.shelters.reduce((n, sh, i) => n + (sh.level >= 3 ? 2 : i === 0 ? 0 : 1), 0);
  function housing(s) {
    const beds = bedCount(s), n = s.survivors.length;
    return { beds, count: n, unhoused: Math.max(0, n - beds) };
  }
  const able = (p) => !p.child && !p.injured && !p.sick && p.health >= 30;
  const hasTender = (s) => s.survivors.some((p) => able(p) && p.task === "fire");
  function feedSurvivors(s, n) {
    let fed = 0;
    for (; fed < n; fed++) {
      if ((s.inv.food || 0) > 0) s.inv.food--;
      else if ((s.inv.berry || 0) >= 2) s.inv.berry -= 2;
      else if ((s.inv.fish || 0) > 0) s.inv.fish--;
      else break;
    }
    return fed;
  }
  const FIND_TEXT = ["a handful of bright river stones", "a coil of cord", "some ripe berries", "a smooth lump of clay", "a spool of copper wire", "an armful of ferns"];
  const FIND_LOOT = [{ stone: 2 }, { rope: 1 }, { berry: 3 }, { clay: 2 }, { wire: 1 }, { leaf: 4 }];
  function survivorsDay(s) {
    const list = s.survivors;
    if (!list.length) return;
    const winter = seasonOf(s.day) === "Winter", beds = bedCount(s), best = bestLevel(s);
    const out = { wood: 0, fish: 0, herb: 0, berry: 0 };
    for (const p of list) {
      if (!able(p)) continue;
      if (p.task === "wood") out.wood += 4;
      if (p.task === "fish") { if (s.flags.fishing && (s.quest < 3 || s.flags.wolf)) out.fish += 3; else { out.herb += 1; out.berry += 2; } }
      if (p.task === "forage") { out.herb += 2; out.berry += 2; }
    }
    seasonLoot(s, out);
    const made = Object.entries(out).filter(([, n]) => n > 0).map(([k, n]) => [k === "wood" ? "log" : k, n]);
    for (const [k, n] of made) add(s, k, n);
    if (made.length) note(s, "Your survivors brought in " + list_(Object.fromEntries(made)) + ".");
    // Healers tend up to two patients each.
    const healers = list.filter((p) => able(p) && p.task === "heal").length;
    let slots = healers * 2;
    for (const p of list) {
      if (slots <= 0) break;
      if (p.injured || p.sick) { slots--; if (p.injured) { p.injured = false; p.health = Math.min(100, p.health + 20); } p.sick = false; note(s, p.name + " was tended and is recovering."); }
    }
    const fed = feedSurvivors(s, list.length);
    if (fed < list.length) note(s, "There was not enough food for everyone in camp.");
    const dead = [];
    list.forEach((p, i) => {
      const isFed = i < fed, housed = i < beds;
      let d = isFed ? 0 : -15;
      if (housed) { d += 3 + (best >= 2 ? 3 : 0); if (winter && best < 1) d -= 4; }
      else { d -= 12 + (winter ? 6 : 0); if (!p.sick && random(s) < 0.3) { p.sick = true; note(s, p.name + " has fallen ill sleeping in the open."); } }
      if (housed && !p.sick && random(s) < 0.04 && best < 1) { p.sick = true; note(s, p.name + " has a fever."); }
      if (p.sick) { d -= 8; if (housed && best >= 2 && random(s) < 0.4) { p.sick = false; note(s, p.name + " shook off the fever."); } }
      if (p.injured && !housed) d -= 3;
      p.health = Math.max(0, Math.min(100, p.health + d));
      if (p.child && isFed && random(s) < 0.4) {
        const k = Math.floor(random(s) * FIND_TEXT.length);
        for (const [item, n] of Object.entries(FIND_LOOT[k])) add(s, item, n);
        note(s, p.name + " found " + FIND_TEXT[k] + " and brought it to camp.");
      }
      if (p.health <= 0) dead.push(p);
    });
    if (dead.length) {
      s.survivors = list.filter((p) => !dead.includes(p));
      s.deaths += dead.length;
      for (const p of dead) note(s, p.name + " did not survive. Shelter and food matter.");
    }
    const low = s.survivors.filter((p) => p.health < 40).length;
    if (low) note(s, low + (low === 1 ? " survivor is" : " survivors are") + " in poor health. Check the survivors panel.");
  }
  const list_ = (loot) => Object.entries(loot).map(([k, n]) => n + " " + names[k].toLowerCase()).join(", ");

  function midnight(s) {
    const before = seasonOf(s.day);
    s.day++;
    const season = seasonOf(s.day);
    if (season !== before) {
      note(s, SEASON_NOTES[season]);
      if (before === "Winter" && s.quest >= 6) s.flags.winterSurvived = true;
    } else if ((s.day - 1) % (SEASON_LEN * 4) === SEASON_LEN - 3) note(s, "Cold winds from the north. Winter begins in 3 days. Stock logs, food and warm shelter.");
    survivorsDay(s);
    const tender = hasTender(s), burn = (season === "Winter" ? 3 : 2) - (tender ? 1 : 0);
    if (s.flags.fire) {
      if ((s.inv.log || 0) >= burn) s.inv.log -= burn;
      else { s.flags.fire = false; note(s, "The fire went out. Gather logs and rebuild it."); }
    } else if (s.flags.fireBuilt && tender && (s.inv.log || 0) >= burn) {
      s.inv.log -= burn; s.flags.fire = true; note(s, "Your fire tender relit the fire.");
    }
    if (!s.withMaya) {
      const b = support(s).bonus;
      if (s.flags.fishing && (s.quest < 3 || s.flags.wolf)) {
        add(s, "fish", 4 + b);
        note(s, "While you were away, Maya caught " + (4 + b) + " fish.");
      } else {
        const l = seasonLoot(s, { herb: 3 + b, berry: 3 + b });
        add(s, "herb", l.herb); add(s, "berry", l.berry);
        note(s, "While you were away, Maya brought back herbs and berries.");
      }
    }
    progress(s);
  }
  function tick(s, h) {
    for (let i = 0; i < h; i++) {
      if (s.cheats.needs) { s.food = 100; s.water = 100; s.warmth = 100; s.energy = 100; }
      const startLoc = s.loc;
      s.hour++;
      const season = seasonOf(s.day);
      s.food -= 2; s.water -= season === "Summer" ? 4 : 3;
      const night = s.hour >= 19 || s.hour < 6;
      const homeNight = startLoc === "camp" && s.flags.shelter ? (mainLevel(s) >= 1 ? -1 : -2) : -4;
      s.warmth += (s.flags.coat ? 1 : night ? homeNight : -1) - (season === "Winter" ? 2 : 0);
      if (startLoc === "camp" && s.flags.fire) s.warmth += 6;
      if (s.food <= 0) s.health -= 4;
      if (s.water <= 0) s.health -= 6;
      if (s.warmth < 25) s.health -= 3;
      else if (s.food >= 40 && s.water >= 40 && s.warmth >= 40 && s.health < 100) s.health += 1;
      if (s.hour >= 24) { s.hour = 0; midnight(s); }
      const before = s.collapses;
      clamp(s);
      if (s.collapses !== before) break;
    }
  }

  /* ---- quests and guidance ---- */
  function progress(s) {
    const f = s.flags, old = s.quest;
    if (s.quest === 0 && f.shelter) s.quest++;
    if (s.quest === 1 && f.fishing) s.quest++;
    if (s.quest === 2 && f.salvaged && f.smelter) s.quest++;
    if (s.quest === 3 && f.wolf) s.quest++;
    if (s.quest === 4 && f.monolith) s.quest++;
    if (s.quest === 5 && f.signal) { s.quest++; f.winterSurvived = false; }
    if (s.quest === 6 && f.winterSurvived) s.quest++;
    if (s.quest === 7 && s.survivors.length >= 4 && housing(s).unhoused === 0) s.quest++;
    if (s.quest === 8 && f.partOne) s.quest++;
    if (s.quest !== old) note(s, s.quest === 9 ? "Part 1 is complete. Your settlement endures, and the rift gate stands open." : s.quest === 6 ? "A human voice answers. You are not alone. But winter is coming." : "Quest complete. New objective: " + quests[s.quest].title + ".");
  }
  function missing(s, id) {
    const out = [];
    for (const [k, n] of Object.entries(recipes[id].cost)) if ((s.inv[k] || 0) < n) out.push([k, n - (s.inv[k] || 0)]);
    return out;
  }
  const missingText = (m) => m.map(([k, n]) => n + " more " + names[k].toLowerCase()).join(", ");
  // One clear next step, plus the place on the map where it happens.
  function objective(s) {
    const q = s.quest;
    const gatherFor = (id, verb) => {
      const m = missing(s, id);
      if (m.length) {
        const k = m[0][0];
        return { place: source[k] || "camp", text: "Still needed: " + missingText(m) + ". " + (k === "rope" ? "Braid fern cord at the workbench." : "Try " + place(source[k] || "camp").name + ".") };
      }
      return { place: "camp", text: verb };
    };
    if (q === 0) { const g = gatherFor("shelter", "You have everything. Open Build at camp and make the lean-to."); return { title: quests[0].title, ...g }; }
    if (q === 1) { const g = gatherFor("fishing", "Open Build at camp and make the fishing rig."); return { title: quests[1].title, ...g }; }
    if (q === 2) {
      if (!s.flags.salvaged) return { title: quests[2].title, place: s.withMaya ? "ridge" : "camp", text: s.withMaya ? "Travel to Broken Ridge and salvage the wreck." : "Ask Maya to come along, then travel to Broken Ridge." };
      const g = gatherFor("smelter", "Open Build at camp and make the smelter."); return { title: quests[2].title, ...g };
    }
    if (q === 3) {
      if (!s.flags.spear && (s.inv.trap || 0) < 3) {
        if (!s.flags.smelter) return { title: quests[3].title, place: "camp", text: "Build the smelter first." };
        const g = gatherFor("spear", "Open Build at camp and make the iron spear."); return { title: quests[3].title, ...g };
      }
      return { title: quests[3].title, place: "river", text: "You are armed. Travel to River Bend and track the wolf." };
    }
    if (q === 4) {
      if (!s.flags.coat) {
        const g = gatherFor("coat", "Open Build at camp and make the winter coats.");
        return { title: quests[4].title, ...(s.inv.pelt ? g : { place: "camp", text: "You need a wolf pelt for the coats." }) };
      }
      if ((s.inv.food || 0) < 6) return { title: quests[4].title, place: "river", text: "Carry 6 rations. Fish at River Bend, then preserve fish at camp." };
      if (!s.withMaya) return { title: quests[4].title, place: "camp", text: "Ask Maya to come along, then travel to Foggy Ravine." };
      return { title: quests[4].title, place: "ravine", text: s.loc === "ravine" ? "Follow the cairn trail here in the ravine." : "Travel to Foggy Ravine and follow the cairn trail." };
    }
    if (q === 5) {
      if (!s.flags.transmitter) { const g = gatherFor("transmitter", "Open Build at camp and make the transmitter."); return { title: quests[5].title, ...g }; }
      if (s.waves < 3) return { title: quests[5].title, place: "camp", text: "At camp, defend the transmitter. Waves survived: " + s.waves + " of 3." };
      return { title: quests[5].title, place: "camp", text: "At camp, connect the circuit." };
    }
    const maya = s.beats.echo && !s.beats.confession && s.flags.signal ? " " + (beatWaiting(s) || "Talk with Maya by the fire.") : "";
    const h = housing(s);
    if (q === 6) {
      const d = (s.day - 1) % (SEASON_LEN * 4), toSpring = d < SEASON_LEN * 2 ? SEASON_LEN * 2 - d : SEASON_LEN * 6 - d;
      return { title: quests[6].title, place: null, text: "Survive until spring, " + toSpring + " days away (" + seasonOf(s.day) + " now). Keep the fire lit, stay fed, and shelter survivors. Search places to find more survivors." + maya };
    }
    if (q === 7) return { title: quests[7].title, place: null, text: "Bring at least 4 survivors to camp and give each a bed (" + h.count + " here, " + h.beds + (h.beds === 1 ? " bed" : " beds") + "). Search places to find survivors." + maya };
    if (q === 8) {
      if (!s.flags.riftgate) { const g = gatherFor("riftgate", "Open Build at camp and make the rift gate."); return { title: quests[8].title, ...g }; }
      return { title: quests[8].title, place: "camp", text: "At camp, open the rift gate." };
    }
    return { title: "Part 1 complete", place: null, text: "Your settlement endures. Keep growing it. Part 2 will carry your camp across the rift." + maya };
  }

  /* ---- actions available here ---- */
  function lootFor(s, a) {
    const loot = seasonLoot(s, a.loot(s));
    if (s.flags.committed && s.withMaya) for (const k of ["herb", "berry", "sapling"]) if (loot[k]) loot[k] += 2;
    return loot;
  }
  const tiredWhy = (s, cost) => (s.energy < cost ? (s.loc === "camp" ? "Too tired. Sleep or rest first." : "Too tired. Return to camp to rest.") : "");
  const spend = (s, n) => { s.energy = Math.max(0, s.energy - n); };
  const gatherKey = (s, id) => s.loc + ":" + id;
  const gatherLeft = (s, id) => { const g = s.gathered[gatherKey(s, id)]; return DAILY_LIMIT - (g && g.day === s.day ? g.n : 0); };
  function actionsFor(s) {
    const p = place(s.loc), out = [];
    const busy = s.encounter ? "Resolve the encounter first." : s.stranger ? "Deal with the stranger first." : "";
    const push = (type, id, label, sub, disabled = "", extra = {}) => out.push({ type, id, label, sub, disabled: disabled || busy, ...extra });
    if (s.loc === "camp") {
      const ready = beatReady(s, "talk"), wait = beatWaiting(s);
      push("rest", "rest", "Sleep in the lean-to", "8 hours · full energy · +30 health", s.flags.shelter ? "" : "Build the lean-to first.");
      push("nap", "nap", "Rest by the fire", "1 hour · +" + ENERGY.nap + " energy");
      push("talk", "talk", "Talk with Maya", ready ? "● A quiet moment is ready" : wait || "She has something to say", "", { glow: !!ready });
      push("build", "build", "Build and craft", "Open the workbench · " + ENERGY.craft + " energy each");
      push("refill", "refill", "Fill water bottles", "1 hour · " + ENERGY.refill + " energy · +3 bottles", tiredWhy(s, ENERGY.refill));
      push("maya", "maya", s.withMaya ? "Leave Maya at camp" : "Take Maya along", s.withMaya ? "She will fish or forage while you are away" : "Herb bonus, ambush warning, combat help");
      if (s.survivors.length) {
        const h = housing(s), sick = s.survivors.filter((p) => p.injured || p.sick).length;
        push("survivors", "survivors", "Check on survivors", s.survivors.length + " in camp" + (h.unhoused ? " · " + h.unhoused + " without a bed" : "") + (sick ? " · " + sick + " need care" : ""), "", { glow: h.unhoused > 0 || sick > 0 });
        if (h.unhoused) push("warn", "warn", h.unhoused + (h.unhoused === 1 ? " survivor has" : " survivors have") + " no bed", "Build another lean-to, or they will grow sick and may die", "", { info: true });
      }
      if (s.flags.riftgate && s.quest === 8) push("gate", "gate", "Open the rift gate", "The finale of Part 1", "", { quest: true });
      if (s.flags.transmitter && s.waves < 3) push("defend", "defend", "Defend the transmitter", "Wave " + (s.waves + 1) + " of 3 · " + ENERGY.defend + " energy · heal first", tiredWhy(s, ENERGY.defend));
      if (s.flags.transmitter && s.waves >= 3 && !s.flags.signal) push("wire", "wire", "Connect the circuit", "Final step of the signal");
    } else {
      if (s.withMaya) push("maya-note", "maya-note", "Maya is with you", "Return to camp to leave her there", "", { info: true });
      for (const a of p.gather || []) {
        let why = "";
        const left = gatherLeft(s, a.id);
        if (left <= 0) why = "Picked clean for today. It refreshes at midnight.";
        else if (tiredWhy(s, ENERGY.gather)) why = tiredWhy(s, ENERGY.gather);
        if (a.needsFlag && !s.flags[a.needsFlag]) why = a.why;
        if (a.needsMaya && !s.withMaya) why = a.needsMaya;
        push("gather", a.id, a.label, "1 hour · " + ENERGY.gather + " energy · " + Math.max(0, left) + " of " + DAILY_LIMIT + " left today · " + list(lootFor(s, a)), why);
      }
      if (s.loc === "river") {
        push("refill", "refill", "Fill water bottles", "1 hour · " + ENERGY.refill + " energy · +3 bottles", tiredWhy(s, ENERGY.refill));
        if (s.quest === 3) {
          const armed = s.flags.spear || (s.inv.trap || 0) >= 3;
          push("wolf", "wolf", "Track the wolf", armed ? "Quest · turn-based fight · " + ENERGY.wolf + " energy" : "Needs an iron spear or 3 traps", armed ? tiredWhy(s, ENERGY.wolf) : "Prepare an iron spear or 3 wooden traps.", { quest: true });
        }
      }
      if (s.loc === "den") push("bear", "bear", "Confront the cave bear", "Optional · turn-based fight · " + ENERGY.bear + " energy", tiredWhy(s, ENERGY.bear));
      if (s.loc === "ravine" && s.quest === 4) {
        const why = !s.flags.coat || !s.withMaya || !can(s, { food: 6 }) ? "Bring Maya, winter coats and 6 rations." : tiredWhy(s, ENERGY.ravine);
        push("ravine", "ravine", "Follow the cairn trail", "Quest · puzzle · " + ENERGY.ravine + " energy · uses 6 rations", why, { quest: true });
      }
    }
    if (window_scenes(s)) {
      const left = sceneObjects(s).filter((o) => !searched(s, o)).length;
      push("search", "search", "Search the area", left + " " + (left === 1 ? "spot" : "spots") + " to search today · " + ENERGY.search + " energy" + (s.quest >= 2 ? " · may turn up survivors" : ""));
    }
    return out;
  }
  const scenes = () => (root.SCENES || {});
  const sceneObjects = (s) => scenes()[s.loc]?.objects || [];
  const window_scenes = (s) => !!scenes()[s.loc];
  const isFound = (s, id) => (s.loc + ":" + id) in s.found;
  const foundCount = (s) => sceneObjects(s).filter((o) => isFound(s, o.id)).length;
  // Supply spots refresh every day. One-time finds (lore, unique salvage) stay found.
  const repeatable = (o) => Object.keys(o.loot).length > 0 && !o.uniqueFlag;
  const searched = (s, o) => isFound(s, o.id) && (!repeatable(o) || s.found[s.loc + ":" + o.id] === s.day);

  function guard(s) {
    if (s.encounter) return "Resolve the encounter first.";
    if (s.stranger) return "Deal with the stranger first.";
    return "";
  }
  function act(s, type, id) {
    const g = guard(s);
    if (g) return g;
    const a = actionsFor(s).find((x) => x.type === type && x.id === id);
    if (!a) return "That is not possible here.";
    if (a.disabled) return a.disabled;
    if (type === "gather") return gather(s, id);
    if (type === "rest") return rest(s);
    if (type === "nap") { tick(s, 1); s.energy += ENERGY.nap; clamp(s); note(s, "You rest by the fire for an hour."); return "You feel a little fresher."; }
    if (type === "refill") return refill(s);
    if (type === "maya") { s.withMaya = !s.withMaya; note(s, s.withMaya ? "Maya joins you." : "Maya stays at camp."); return s.withMaya ? "Maya joins you." : "Maya stays at camp."; }
    if (type === "wolf") { spend(s, ENERGY.wolf); return wolf(s); }
    if (type === "bear") { spend(s, ENERGY.bear); s.encounter = { name: "Cave bear", hp: 65, max: 65, damage: 13 }; return "The cave bear rises."; }
    if (type === "defend") { spend(s, ENERGY.defend); return defend(s); }
    return "Nothing happens.";
  }
  // Animals can interrupt work in the wild. Maya often spots them first.
  function wildEncounter(s) {
    if (s.cheats.safeTravel || s.quest < 1 || s.loc === "camp") return;
    if (random(s) >= WILD_CHANCE) return;
    if (s.withMaya && random(s) < 0.5) { note(s, "Maya spots movement and waves you back. You avoid trouble."); return; }
    s.encounter = { name: ["ridge", "den"].includes(s.loc) ? "Cave bear" : s.loc === "grove" ? "Rift-displaced terror bird" : "Dire wolf", hp: 45, max: 45, damage: 10 };
    note(s, "An animal interrupts your work.");
  }
  function gather(s, id) {
    const a = (place(s.loc).gather || []).find((x) => x.id === id);
    const loot = lootFor(s, a);
    if (s.loc === "rift") { s.flags.batteryFound = true; note(s, "Violet light fractures. Another century falls through the trees."); }
    if (loot.alternator) { s.flags.salvaged = true; note(s, "The crowbar peels back a familiar badge. A Mustang alternator, intact."); }
    for (const [k, n] of Object.entries(loot)) add(s, k, n);
    const key = gatherKey(s, id), g = s.gathered[key];
    s.gathered[key] = { day: s.day, n: (g && g.day === s.day ? g.n : 0) + 1 };
    spend(s, ENERGY.gather);
    tick(s, 1);
    note(s, "Gathered " + list(loot) + ".");
    progress(s);
    if (s.loc !== "camp") wildEncounter(s);
    return s.encounter ? "Gathered " + list(loot) + ". An animal interrupts you!" : "Gathered " + list(loot) + ".";
  }
  function refill(s) {
    spend(s, ENERGY.refill);
    add(s, "water", 3); tick(s, 1);
    return "Filled 3 bottles.";
  }
  function rest(s) {
    tick(s, 8);
    if (s.loc === "camp") {
      s.health += 30 + (mainLevel(s) >= 2 ? 10 : 0); s.warmth += s.flags.fire ? 35 : 5; s.energy = ENERGY.max; clamp(s);
      note(s, "Eight hours of sleep. Health and energy restored.");
      s.pending = beatReady(s, "rest");
    }
    return "You wake rested.";
  }
  // Talk: a ready story moment, or a line from Maya.
  function talk(s) {
    const id = beatReady(s, "talk");
    if (id) { s.pending = id; return ""; }
    if (s.beats.echo && !s.beats.confession && s.flags.signal && !isEvening(s)) return "Maya: “Find me by the fire once evening comes, " + s.name + ".”";
    return "Maya: “" + dialogue(s) + "”";
  }

  function use(s, id) {
    if (id === "eat") {
      const item = s.inv.food ? "food" : s.inv.berry ? "berry" : null;
      if (!item) return "No ready-to-eat food.";
      pay(s, { [item]: 1 }); s.food += item === "food" ? 30 : 12;
    } else if (id === "drink") {
      if (!can(s, { water: 1 })) return "No water left. Fill bottles at camp or River Bend.";
      pay(s, { water: 1 }); s.water += 35;
    } else return "Unknown item.";
    clamp(s);
    return id === "eat" ? "You eat." : "You drink.";
  }

  /* ---- building ---- */
  function recipeLock(s, id) {
    const r = recipes[id];
    if (!r) return "Unknown recipe.";
    if (r.flag && s.flags[r.flag]) return "Already built.";
    if (r.requires && !s.flags[r.requires]) return "Needs " + requireNames[r.requires] + " first.";
    if (r.gate && s.quest < r.gate) return "Unlocks after “" + quests[r.gate - 1].title + "”.";
    return "";
  }
  function craft(s, id) {
    if (s.loc !== "camp") return "Return to camp to use the workbench.";
    if (s.encounter) return "Resolve the encounter first.";
    const lock = recipeLock(s, id), r = recipes[id];
    if (lock) return lock;
    if (s.energy < ENERGY.craft) return "Too tired. Sleep or rest first.";
    if (!s.cheats.freeCraft && !can(s, r.cost)) return "Not enough materials.";
    spend(s, ENERGY.craft);
    if (!s.cheats.freeCraft) pay(s, r.cost);
    if (r.flag) s.flags[r.flag] = true;
    if (r.item) add(s, r.item, r.count);
    if (r.heal) s.health += r.heal;
    if (id === "shelter") s.shelters = [{ level: 0 }];
    if (id === "fire") { s.warmth += 20; s.flags.fireBuilt = true; }
    tick(s, 1);
    note(s, "Built: " + r.title + ".");
    progress(s);
    clamp(s);
    return "Built " + r.title + ".";
  }


  /* ---- lean-tos ---- */
  function buildShelter(s) {
    if (s.loc !== "camp") return "Return to camp to build.";
    if (s.encounter || s.stranger) return "Deal with the danger first.";
    if (!s.flags.shelter) return "Build the first lean-to first.";
    if (s.shelters.length >= MAX_LEANTOS) return "The camp has no room for more lean-tos.";
    if (s.energy < ENERGY.craft) return "Too tired. Sleep or rest first.";
    if (!s.cheats.freeCraft && !can(s, EXTRA_LEANTO)) return "Not enough materials.";
    if (!s.cheats.freeCraft) pay(s, EXTRA_LEANTO);
    spend(s, ENERGY.craft);
    s.shelters.push({ level: 0 });
    tick(s, 1);
    note(s, "Built another lean-to. It has room for 1 survivor.");
    progress(s);
    return "Built another lean-to.";
  }
  function upgradeShelter(s, i) {
    const sh = s.shelters[i];
    if (!sh) return "No such lean-to.";
    if (s.loc !== "camp") return "Return to camp to build.";
    if (s.encounter || s.stranger) return "Deal with the danger first.";
    if (sh.level >= 3) return "Fully upgraded.";
    const up = SHELTER_UPGRADES[sh.level];
    if (s.energy < ENERGY.craft) return "Too tired. Sleep or rest first.";
    if (!s.cheats.freeCraft && !can(s, up.cost)) return "Not enough materials.";
    if (!s.cheats.freeCraft) pay(s, up.cost);
    spend(s, ENERGY.craft);
    sh.level++;
    tick(s, 1);
    note(s, (i === 0 ? "Main lean-to" : "Lean-to " + (i + 1)) + " upgraded to level " + sh.level + ".");
    progress(s);
    return "Upgraded to level " + sh.level + ".";
  }

  /* ---- survivors ---- */
  const NAMES = {
    F: ["Mara", "Joanna", "Priya", "Keiko", "Dana", "Imani", "Rosa", "Hana", "Tess", "Noor", "Lena", "Sofia", "Wren", "Amara", "Ines", "Beth", "Yara", "Colleen"],
    M: ["Theo", "Marcus", "Dev", "Owen", "Luis", "Sam", "Kofi", "Ray", "Anders", "Elias"],
    CF: ["Pip", "Lily", "Maisie", "Ayla", "June"],
    CM: ["Eli", "Toby", "Jonah", "Kai", "Milo"],
  };
  function pickName(s, key) {
    const pool = NAMES[key], used = new Set(s.survivors.map((p) => p.name));
    for (let n = 0; n < pool.length * 3; n++) {
      const cand = pool[Math.floor(random(s) * pool.length)] + (n >= pool.length ? " " + (n >= pool.length * 2 ? "III" : "II") : "");
      if (!used.has(cand)) return cand;
    }
    return pool[0] + " " + s.spawned.t;
  }
  // About 75% women and 25% men; children stay under 15% of everyone met.
  function makeStranger(s) {
    const sp = s.spawned;
    const child = (sp.c + 1) / (sp.t + 1) < 0.15 && random(s) < 0.12;
    const female = random(s) < 0.75;
    const injured = random(s) < 0.4;
    const hostile = !child && random(s) < 0.3;
    sp.t++; if (female) sp.f++; else sp.m++; if (child) sp.c++;
    const name = pickName(s, child ? (female ? "CF" : "CM") : female ? "F" : "M");
    const sex = female ? "F" : "M";
    return { name, sex, child, injured, hostile, helped: false };
  }
  function strangerText(p) {
    const she = p.sex === "F" ? "she" : "he", her = p.sex === "F" ? "her" : "his";
    if (p.hostile) return p.injured
      ? p.name + " blocks the trail, wounded but gripping a sharpened spear. “Leave your supplies and walk away,” " + she + " warns."
      : p.name + " steps into your path with a sharpened spear. “Leave your supplies and walk away,” " + she + " says.";
    if (p.child) return "A " + (p.sex === "F" ? "girl" : "boy") + " named " + p.name + " is hiding in the ferns, " + (p.injured ? "limping and hurt" : "hungry and frightened") + ". " + (p.sex === "F" ? "She" : "He") + " is on " + her + " own.";
    return p.injured
      ? p.name + " is slumped against a rock, " + her + " leg badly hurt. " + (p.sex === "F" ? "She" : "He") + " looks up with a weak, hopeful face."
      : p.name + " steps out of the trees with empty hands raised. " + (p.sex === "F" ? "She" : "He") + " has been alone for days and asks if there is room by your fire.";
  }
  function maybeStranger(s) {
    if (s.stranger || s.encounter || s.quest < 2 || s.survivors.length >= MAX_SURVIVORS) return;
    s.flags.dry = (s.flags.dry || 0) + 1;
    if (s.flags.dry < 8 && random(s) >= (s.flags.signal ? 0.2 : 0.14)) return;
    s.flags.dry = 0;
    s.stranger = makeStranger(s);
    note(s, "You are not alone out here. Someone is nearby.");
  }
  const STRANGER_REWARDS = [{ stone: 2 }, { wire: 2 }, { leaf: 4 }, { clay: 2 }, { berry: 3 }];
  function strangerOffer(s) {
    const p = s.stranger;
    if (!p || p.hostile || p.helped) return "Nothing to offer.";
    const cost = p.injured ? { herb: 1 } : { food: 1 };
    if (!can(s, cost)) return p.injured ? "You need 1 medicinal herb to treat the wound." : "You need 1 preserved ration to share.";
    pay(s, cost);
    p.helped = true; p.injured = false;
    const reward = STRANGER_REWARDS[Math.floor(random(s) * STRANGER_REWARDS.length)];
    for (const [k, n] of Object.entries(reward)) add(s, k, n);
    note(s, p.name + " is grateful and presses " + list_(reward) + " into your hands.");
    return p.name + " is grateful. Gift: " + list_(reward) + ".";
  }
  function strangerBring(s) {
    const p = s.stranger;
    if (!p || p.hostile) return "They will not come.";
    if (s.survivors.length >= MAX_SURVIVORS) return "The camp cannot support anyone else.";
    if (s.energy < ENERGY.travel) return "Too tired to guide them. Rest first.";
    spend(s, ENERGY.travel);
    s.survivors.push({ id: "p" + s.spawned.t + "-" + s.day, name: p.name, sex: p.sex, child: p.child, health: p.injured ? 45 : 90, injured: p.injured, sick: false, task: "idle", joined: s.day });
    s.stranger = null;
    s.loc = "camp"; s.visited.camp = true;
    tick(s, 2);
    note(s, p.name + " came back to camp with you." + (housing(s).unhoused ? " " + p.name + " needs a bed. Build another lean-to." : ""));
    progress(s);
    return p.name + " is now at camp.";
  }
  function strangerLeave(s) {
    const p = s.stranger; s.stranger = null;
    if (p) note(s, "You leave " + p.name + " behind.");
    return "You move on.";
  }
  function strangerFlee(s) {
    const p = s.stranger; if (!p || !p.hostile) return "There is nothing to flee from.";
    spend(s, 5); s.stranger = null;
    if (random(s) < 0.7) { note(s, "You slip away from " + p.name + "."); return "You get away."; }
    s.health -= 8; note(s, p.name + " hits you with the spear shaft as you run. Health −8.");
    clamp(s);
    return "You escape, but not unhurt.";
  }
  function strangerAttack(s) {
    const p = s.stranger; if (!p || !p.hostile) return "There is nothing to fight.";
    s.stranger = null;
    s.encounter = { name: "Hostile survivor", hp: p.injured ? 28 : 40, max: p.injured ? 28 : 40, damage: 9, human: true };
    note(s, "You stand your ground against " + p.name + ".");
    return p.name + " raises the spear.";
  }
  function setTask(s, id, task) {
    const p = s.survivors.find((x) => x.id === id);
    if (!p) return "No such survivor.";
    if (p.child) return p.name + " is too young for chores. Children sometimes find useful things on their own.";
    if (!Object.hasOwn(TASKS, task)) return "Unknown task.";
    p.task = task;
    return p.name + ": " + TASKS[task] + ".";
  }
  function treat(s, id) {
    const p = s.survivors.find((x) => x.id === id);
    if (!p || (!p.injured && !p.sick)) return "They do not need treatment.";
    if (s.loc !== "camp") return "Return to camp.";
    if (!can(s, { herb: 1 })) return "You need 1 medicinal herb.";
    if (s.energy < 5) return "Too tired. Sleep or rest first.";
    pay(s, { herb: 1 }); spend(s, 5);
    p.injured = false; p.sick = false; p.health = Math.min(100, p.health + 25);
    tick(s, 1);
    note(s, "You treated " + p.name + ".");
    return p.name + " is looking better.";
  }
  function openGate(s) {
    if (s.loc !== "camp" || !s.flags.riftgate || s.quest !== 8) return "The gate is not ready.";
    s.flags.partOne = true;
    note(s, "You step to the edge of the rift gate. Light pours through.");
    progress(s);
    return "The gate opens.";
  }

  /* ---- travel ---- */
  function travelLock(s, id) {
    const p = place(id);
    if (!p) return "Unknown destination.";
    if (s.cheats.openMap) return "";
    if (p.requires && !s.flags[p.requires]) return p.requires === "coat" ? "Craft winter coats before climbing Glacier Peaks." : "Find the monolith in Foggy Ravine first.";
    if (p.gate && s.quest < p.gate) return "Complete “" + quests[p.gate - 1].title + "” to reach " + p.name + ".";
    return "";
  }
  const travelHours = (s, id) => (s.cheats.fastTravel || (s.flags.signal && s.visited[id]) ? 1 : 2);
  function travel(s, id) {
    if (s.encounter) return "Resolve the encounter first.";
    if (s.stranger) return "Deal with the stranger first.";
    if (s.loc === id) return "You are already here.";
    const lock = travelLock(s, id);
    if (lock) return lock;
    if (id === "camp") spend(s, ENERGY.travel);
    else if (s.energy < ENERGY.travel) return "Too tired to travel. Return to camp and rest.";
    else spend(s, ENERGY.travel);
    const hours = travelHours(s, id);
    s.loc = id; s.visited[id] = true;
    tick(s, hours);
    if (s.loc !== id) return "You black out on the trail.";
    note(s, "Reached " + place(id).name + ".");
    // No surprise fights until the camp is established (after Fresh Catch).
    if (id !== "camp" && s.quest >= 2 && !s.cheats.safeTravel && random(s) < 0.12) {
      if (s.withMaya) note(s, "Maya spots movement in the trees. You avoid an ambush.");
      else {
        s.encounter = { name: ["ridge", "den"].includes(id) ? "Cave bear" : id === "grove" ? "Rift-displaced terror bird" : "Dire wolf", hp: 45, max: 45, damage: 10 };
        note(s, "An animal blocks the trail.");
      }
    }
    return "Arrived at " + place(id).name + ".";
  }

  /* ---- combat ---- */
  function wolf(s) {
    s.encounter = { name: "Wounded dire wolf", hp: 80, max: 80, damage: 13, boss: true };
    return "The wounded dire wolf steps out of the reeds.";
  }
  function defend(s) {
    s.encounter = { name: ["Dire wolf pack", "Cave bear", "Rift-displaced terror bird"][s.waves], hp: 45 + s.waves * 15, max: 45 + s.waves * 15, damage: Math.max(3, (s.flags.walls ? 7 : 12) - (mainLevel(s) >= 1 ? 2 : 0)), wave: true };
    return "Defense wave " + (s.waves + 1) + " begins.";
  }
  function fight(s, action) {
    const e = s.encounter;
    if (!e) return "No encounter.";
    if (action === "flee") {
      s.encounter = null; s.loc = "camp"; s.withMaya = false;
      s.health -= 4; tick(s, 1); clamp(s);
      return "You escape to camp, losing 4 health.";
    }
    if (action === "trap") { if (!can(s, { trap: 1 })) return "No traps left."; pay(s, { trap: 1 }); e.hp -= 20; }
    else if (action === "flare") { if (!can(s, { energy: 1 })) return "You need a rift crystal."; pay(s, { energy: 1 }); e.hp -= 30; }
    else e.hp -= s.flags.spear ? 24 : 12;
    if (e.hp > 0) {
      const before = s.collapses;
      s.health -= Math.max(0, e.damage - support(s).damageReduction);
      clamp(s);
      return s.collapses !== before ? "You fall. Maya drags you back to camp." : "The animal strikes back.";
    }
    if (e.boss) { s.flags.wolf = true; add(s, "pelt", 1); note(s, "The river is safe. A winter pelt remains."); }
    else if (e.wave) { s.waves++; note(s, "Transmitter defense wave " + s.waves + " survived."); }
    else if (e.human) { add(s, "food", 1); add(s, "scrap", 2); note(s, "The stranger drops the spear and flees into the trees. You recover a ration and some scrap."); }
    else { add(s, "food", 1); note(s, "The threat retreats. You recover a ration from your dropped pack."); }
    s.encounter = null;
    tick(s, 1);
    progress(s);
    clamp(s);
    return "Encounter survived.";
  }

  /* ---- puzzles ---- */
  const TRAIL = [1, 5, 6, 10, 14, 15];
  const CIRCUIT = ["battery", "alternator", "crystal", "antenna"];
  function discover(s, path) {
    if (s.loc !== "ravine" || s.quest !== 4 || !s.flags.coat || !s.withMaya || !can(s, { food: 6 })) return "Bring Maya, winter coats and 6 rations to Foggy Ravine.";
    if (JSON.stringify(path) !== JSON.stringify(TRAIL)) return "The trail is incomplete.";
    if (s.energy < ENERGY.ravine) return "Too tired. Return to camp and rest.";
    spend(s, ENERGY.ravine);
    pay(s, { food: 6 });
    tick(s, 3);
    s.flags.monolith = true; s.visited.monolith = true;
    note(s, "The dormant monolith wakes. The ravine is behind you.");
    progress(s);
    return "The monolith is found.";
  }
  function signal(s, circuit) {
    if (s.loc !== "camp" || !s.flags.transmitter || s.waves !== 3) return "Survive all 3 waves at camp first.";
    if (JSON.stringify(circuit) !== JSON.stringify(CIRCUIT)) return "The circuit is incomplete.";
    s.flags.signal = true;
    note(s, "Static. Then a voice: We thought we were the only ones.");
    progress(s);
    return "The signal is live.";
  }

  /* ---- searching a place's illustrated scene ---- */
  function objectVisible(s, o) {
    if (isFound(s, o.id)) return true;
    if (o.requires && !isFound(s, o.requires)) return false;
    return o.reveal === "maya" ? s.withMaya : true;
  }
  function objectReason(s, o) {
    if (s.encounter) return "Resolve the wildlife encounter first.";
    if (o.requires && !isFound(s, o.requires)) return "Open the crushed hood first.";
    if (o.needsMaya && !s.withMaya) return "Bring Maya to help brace and salvage the wreck.";
    if (!objectVisible(s, o)) return "Bring Maya. She will spot what is hidden here.";
    return tiredWhy(s, searchCost(s, o));
  }
  const searchCost = (s, o) => (o.uniqueFlag && s.flags[o.uniqueFlag] ? 0 : o.cost ? ENERGY.search : ENERGY.lore);
  const spread = (s, n) => Math.max(1, Math.floor(n / 2)) + Math.floor(random(s) * (Math.ceil(n / 2) + 1));
  function search(s, id) {
    const sc = scenes()[s.loc], o = sc?.objects.find((x) => x.id === id);
    if (!o) return "Unknown object.";
    if (searched(s, o)) return repeatable(o) ? "You already searched here today. Try again tomorrow." : "Already searched. Your find is saved in the journal.";
    const why = objectReason(s, o);
    if (why) return why;
    const key = s.loc + ":" + id, first = !(key in s.found);
    let loot = {};
    const rich = repeatable(o) || (Object.keys(o.loot).length && !(o.uniqueFlag && s.flags[o.uniqueFlag]));
    if (rich) {
      // The first search always pays off. Later days vary, and can come up empty.
      if (first || random(s) >= 0.25) for (const [k, n] of Object.entries(o.loot)) loot[k] = first ? n : spread(s, n);
      seasonLoot(s, loot);
      if (s.flags.committed && s.withMaya) for (const k of ["herb", "berry", "sapling"]) if (loot[k]) loot[k] += 2;
    }
    const hours = o.uniqueFlag && s.flags[o.uniqueFlag] ? 0 : o.cost;
    spend(s, searchCost(s, o));
    s.found[key] = s.day;
    for (const [k, n] of Object.entries(loot)) add(s, k, n);
    if (o.uniqueFlag) s.flags[o.uniqueFlag] = true;
    if (hours) tick(s, hours);
    const empty = repeatable(o) && !Object.keys(loot).length;
    if (empty) note(s, "You search the " + o.name.toLowerCase() + " carefully but find nothing this time.");
    else note(s, "Discovery · " + o.name + ": " + o.text + (Object.keys(loot).length ? " Found " + list(loot) + "." : ""));
    progress(s);
    maybeStranger(s);
    return s.stranger ? "Someone is nearby." : empty ? "Nothing found this time." : Object.keys(loot).length ? "Found " + list(loot) + "." : "Added to your journal.";
  }

  root.Rift2 = {
    KEY, MANUAL_KEY, names, recipes, quests, places, place, beatTitles, TRAIL, CIRCUIT,
    fresh, validate, read, write, random, add, note, can, pay, list, tick, clamp, progress,
    objective, missing, missingText, actionsFor, act, use, talk, rest, craft, recipeLock, travel, travelLock, travelHours,
    fight, discover, signal, search, objectVisible, objectReason, sceneObjects, isFound, foundCount, searched, repeatable, ENERGY, DAILY_LIMIT, searchCost,
    beatScene, beatReady, resolveBeat, ending, dialogue, support,
    seasonOf, SEASON_LEN, SHELTER_UPGRADES, EXTRA_LEANTO, MAX_LEANTOS, MAX_SURVIVORS, TASKS, housing, bedCount, mainLevel, buildShelter, upgradeShelter,
    strangerText, strangerOffer, strangerBring, strangerLeave, strangerFlee, strangerAttack, setTask, treat, openGate, makeStranger, survivorsDay,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.Rift2;
})(typeof window !== "undefined" ? window : globalThis);
