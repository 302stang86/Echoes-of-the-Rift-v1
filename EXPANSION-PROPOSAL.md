# Echoes of the Rift — The Far Shore (proposal)

Not implemented in this graphics update.

Unlock on the first Winter-to-Spring transition after the winter-survival quest begins, using the existing winterSurvived flag. Reveal a thawed mountain pass and a journal discovery. Do not reset the current camp, gear, survivors or inventory. Keep travel between both maps available. Let the existing rift gate provide a later shortcut rather than making the map depend on finishing the game.

| Area | New materials | Threats | Purpose |
| --- | --- | --- | --- |
| Ashen Foothills | Obsidian, basalt | Loose rock, territorial cats | Sharp blades and reinforced tool heads |
| Amber Marsh | Resin, reeds | Biting insects, deep mud | Waterproof wraps and food storage |
| Mammoth Steppe | Heavy pelts, shed ivory | Herd charges, stalking wolves | Expedition clothing and shelters |
| Steamwood Basin | Sulfur, medicinal moss | Hot springs, toxic vents | Advanced remedies and camp improvements |
| Shattered Observatory | Rift glass, unusual salvage | Rift storms, displaced predators | Story discoveries and gate upgrades |

Introduce two areas at first. Require preparations and discoveries to reach the others. Materials should unlock specialized gear with tradeoffs, such as waterproof clothing with less warmth, rather than replacing every existing item. Telegraph hazards and offer retreat. Reuse existing predators with new behavior before adding many species. Save region and discoveries in the current save with backwards-compatible defaults.

## Graphics update 2

All 24 existing gear tiers use the shared vector renderer: rough-cut hide silhouettes, leather grain, hand lacing, bone-colored toggles, wrapped fishing grip, chipped stone axe and shaded materials. No gear costs, statistics, save format or unlock rules changed.

Review finding: index.html runs game.js/ui.js, while older standalone pages run engine.js/app.js. These are separate versions; future feature work should consolidate the entry points deliberately with save migration. This update targets the current index.html game.
