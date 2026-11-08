# Release 3 — The Far Shore

Open index.html through your static host. Replace the existing game files with this folder’s contents. No Firebase configuration or dependency installation is needed. Keep the same site address to retain browser saves; export a backup from Pack before replacing files.

## Playable expansion
- The Winter-to-Spring transition during The Long Winter unlocks the second map. Existing saves that have already passed this quest unlock it automatically.
- Ancient Valley and Far Shore map tabs preserve the original settlement. Return to camp works from either map. Cross-region travel takes three hours, while a built rift gate makes Far Shore travel one hour. Existing curfew and retreat behavior remain in effect.
- Five areas: Ashen Foothills, Amber Marsh, Mammoth Steppe, Steamwood Basin, Shattered Observatory. Each has a regional map pin, scene illustration, two searchable objects and a daily gathering action.
- Nine materials: obsidian, basalt, resin, reeds, heavy pelts, shed ivory, sulfur, moss and rift glass.
- Discover migration markers in the foothills to reach the steppe. Find the marsh route chart to reach the basin; carry a vent mask. Find the steppe star chart and carry a rift compass to reach the observatory.
- Craft resin-wrapped boots, a vent mask, a rift compass, an obsidian spear and a mammoth-hide coat at River Camp. Masks and compasses work when carried in the gear pack or equipped by the hero. Boots must be worn. Boots trade warmth for marsh protection. The obsidian spear adds 16 damage; the coat adds 6 warmth.
- Gathering has a 25% regional hazard chance. Normal exposure costs 5 health, 6 warmth and 6 energy; protective boots/mask reduce their corresponding hazard to 2 energy. Random ambushes use five regional predators with different combat statistics. Retreat remains available.
- Moss dressings restore 50 health. Read the observatory archive and restore its beacon using 6 rift glass, 4 wire and 4 crystals (one hour, 8 energy). This completes the expansion chapter without closing either map.
- The Journal tracks the current Far Shore objective and areas visited.

## Compatibility and fixes
Save schema remains version 2; release number is 3. Existing camps, survivors, inventories and gear are retained. Fixed validation of the existing numeric survivor-search counter. Fixed stranded stranger encounters after searching.

## Verification
103 automated tests pass, including the complete expansion route, spring unlock, migration, curfew, travel times, gathering limits, hazard protection and beacon completion. Desktop browser checks verified the regional map, searchable scene, route unlock and stranger encounter flow. Phone hardware testing has not been performed. The new illustrations are lightweight vector landscapes; further painted artwork and extended balance playtesting remain possible polish work.

Legacy standalone HTML pages still use their older engine. Use index.html for this expansion. No deployment or GitHub upload was performed in this build.
