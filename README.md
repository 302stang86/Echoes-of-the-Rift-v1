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

- No carry slots and no daily gather limits. Every gather action takes 1 hour.
- Maya is either with you or at camp. At camp she fishes (once the rig is built) or forages by herself each midnight.
- Trust and affection meters and daily relationship chores are gone. Three story moments with Maya appear at quest milestones: The Shared Blanket (first rest in the lean-to), The Reminiscent Echo (after Fresh Catch), The Riverbank Confession (after the signal, by the fire at dusk). Your choice decides the ending: Shared Future or Lifelong Allies. Committing also strengthens Maya's help.
- Camp integrity and raids, the flashlight and its battery, and the permanent-home recipe are removed.
- Falling to zero health no longer ends the run. Maya drags you back to camp and you wake at dawn.
- No random ambushes until Fresh Catch is complete.
- Cheats (code Chaosenvy), manual save/load, and JSON export/import remain.
- Audio is not included in v2 yet.

## Saves

Autosave key `echoes-rift-v2`; manual save is separate. v1 saves are not compatible.

## Checks

`node --test tests/*.test.cjs` runs 23 rule tests, including a full campaign playthrough from first shelter to the ending.
