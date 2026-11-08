# Echoes of the Rift — v2 (single-screen hub)

A streamlined, story-first rebuild of the first version. Plain HTML, CSS and JavaScript; no build step, accounts or API keys. Serve the folder with any static host (for example GitHub Pages) or run `python3 -m http.server 8000` and open http://localhost:8000.

## How it plays

One screen:

- Next step banner: always says what to do now. A glowing ★ pin on the map shows where.
- Map: pick a place, then Travel (2 hours; 1 hour to visited places after the signal).
- Here panel: only the actions that make sense where you are standing. Examples: Forest has "Gather timber and ferns"; River Bend has "Collect flint and clay", "Fish the river", "Fill water bottles"; Camp has Rest, Talk with Maya, Build and craft, Take Maya along.
- Search the area: opens that place's illustrated scene. This replaces the old Explore page and the old "Investigate site" button.
- Pack, Journal and Build open as panels on the same screen. There are no page loads.

## What changed from v1

- No carry slots. Every gather action takes 1 hour and 15 energy. Each gathering spot gives 3 harvests per day and refreshes at midnight (constant `DAILY_LIMIT` in game.js).
- Energy (0 to 100). Gather 15, search 8 (3 for lore), travel 10, build 8, fill water 5, trail puzzle 20, defend 15. Sleep in the lean-to restores all energy; a rest by the fire restores 20. Going home to camp is always allowed, even at 0 energy.
- Search the area refreshes every day. The first search of a spot always pays; later days give random amounts and sometimes nothing. Lore finds are one-time.
- Animals can interrupt gathering (15% per harvest) once the first shelter is built. Maya often warns you in time.
- Clock shows AM and PM.
- Maya is either with you or at camp. At camp she fishes (once the rig is built) or forages by herself each midnight.
- Trust and affection meters and daily relationship chores are gone. Three story moments with Maya appear at quest milestones: The Shared Blanket (first rest in the lean-to), The Reminiscent Echo (after Fresh Catch), The Riverbank Confession (after the signal, by the fire at dusk). Your choice decides the ending: Shared Future or Lifelong Allies. Committing also strengthens Maya's help.
- Camp integrity and raids, the flashlight and its battery, and the permanent-home recipe are removed.
- Falling to zero health no longer ends the run. Maya drags you back to camp and you wake at dawn.
- No random ambushes until Fresh Catch is complete.
- Cheats (code Chaosenvy), manual save/load, and JSON export/import remain.
- Audio is not included in v2 yet.

## Survivors, lean-tos, seasons (update 3)

- Searching can turn up strangers (about 10% per search once Fresh Catch is done, 16% after the signal). Roughly 75% are women and 25% men, and children stay under 15% of everyone met. Good strangers can be helped (1 herb for a wound, 1 ration otherwise) or brought to camp. Hostile strangers (about 30% of adults) can be fled from (70% success) or fought.
- Survivors are found only by searching an area (not gathering) once Fresh Catch is done: about 14% per search (20% after the signal), and one is guaranteed after 8 searches without one.
- Energy costs were halved in update 4: gather 8, search 4, travel 4, craft 4; a nap restores 25.
- Survivors at camp eat about 1 ration a day (or 2 berries, or 1 fish). Each needs a bed. Without one they lose health every day, fall sick and can die. Check on survivors at camp to assign chores at midnight: gather wood, fish, forage food, tend the fire, tend the injured. Children cannot take chores but sometimes find helpful things. Treat the sick or injured with 1 herb.
- Lean-tos: you and Maya share the main lean-to. Each extra lean-to gives 1 bed. Three upgrades per lean-to: level 1 warmer nights and security (less wave damage), level 2 more healing from sleep and faster recovery for survivors, level 3 two beds (a main lean-to at level 3 has 2 spare beds).
- Maya's love story continues. The Riverbank Confession now also needs the main lean-to at level 1 or higher, so Maya ends up living in the upgraded lean-to with you.
- Seasons: 20 days each, an 80-day year (Autumn, Winter, Spring, Summer). Winter is colder, plants give half, and fire burns 3 logs a night. Spring gives extra berries and herbs. Summer makes you thirstier.
- Longer ending: the signal is now the midpoint. Next come The Long Winter (survive until spring), A Community (4 survivors, each with a bed), and The Far Shore (build the rift gate and open it). That ends Part 1. Part 2 is not playable yet; the gate and the saved settlement are the hook.

## Saves

Autosave key `echoes-rift-v2`; manual save is separate. v1 saves are not compatible.

## Checks

`node --test tests/*.test.cjs` runs 40 rule tests, including a full campaign playthrough from first shelter to the ending.

## Update 5: health, hunting, tanning and gear
- Sickness is a separate red bar under a survivor's health. It fills each day while they are sick; once full, health starts dropping. Injuries cost health every day until treated.
- Chores can injure or sicken survivors. Cold, hunger, no bed and no fire raise the odds; warm clothing, weapons and armor lower them.
- Tend the injured: healers treat survivors who are injured, under 50% health or sick, two patients per healer. 1 herb for injuries and low health, 2 herbs for sickness, only while herbs last.
- New chores: Hunt (needs a spear or axe), Tan hides and sew (needs a tanning rack), Cook and preserve (needs a burning fire), Guard the camp (less damage from defense waves), Haul water.
- Animals drop raw meat, hides, claws and sometimes a pelt. Collect them after the fight. Tan hides into leather at a tanning rack, then craft clothing in the Gear workshop.
- Gear: shirt, pants, shoes, gloves, coat, tool and weapon slots for you, Maya and every survivor (children can wear clothes only). Clothing and tools upgrade through tiers. Heavy coats on you and Maya also satisfy the Glacier ravine coat requirement. Open Gear and equipment, or Check on survivors, at camp.

## Update 6: curfew, forced sleep, gear art
- Be back at camp by 10 PM. A warning appears at 8 PM. If you are still out at 10 PM you are dragged home cold (-10 warmth). You cannot leave camp when the trip would end after dusk.
- 10 PM to midnight at camp: only check on survivors, gear, craft, talk, or rest. At midnight you fall asleep for 8 hours and wake at 8 AM with health and energy restored. Rest by the fire to pass time and gain energy.
- The cheat menu has "No 10 PM curfew or forced sleep" for testing.
- Heavy winter coats are no longer a recipe. Coats are gear: make a Light coat, upgrade it to a Heavy coat, and equip one on you and one on Maya. The Glacier and ravine requirements use these.
- Hunt game (forest, grove, river) needs a spear or axe equipped and brings meat, hides and sometimes claws.
- All gear has drawn vector icons (assets/gear-icons.js). A reference sheet is in assets/art/gear-sheet.png.

## Graphics release 2
All 24 gear tiers now use textured prehistoric survival artwork. See EXPANSION-PROPOSAL.md for the proposed second map (not implemented). Release numbers live in VERSION; run `node scripts/bump-version.cjs` once per future release to increment by one. Save schema versions are independent.
