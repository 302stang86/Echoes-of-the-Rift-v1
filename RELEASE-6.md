# Release 6 — Marked map travel times

Valley map pin labels now show the supplied one-way times from River Camp. Return journeys take the same time. Trips between two valley destinations follow both routes through River Camp; for example Forest → River takes 2.5 + 1.5 = 4 hours. The travel button always shows the full journey time.

| Destination | One way | Round trip |
| --- | ---: | ---: |
| Glacier Peaks | 8 hours | 16 hours |
| Old-growth Forest | 2.5 hours | 5 hours |
| River Bend | 1.5 hours | 3 hours |
| Wolf Totem | 4 hours | 8 hours |
| Birch Grove | 5 hours | 10 hours |
| Foggy Ravine | 1 hour | 2 hours |
| Broken Ridge | 3.5 hours | 7 hours |
| Woolly Rhino Meadow | 3.5 hours | 7 hours |
| Cave Bear Den | 5 hours | 10 hours |
| Rift Monolith | 5 hours | 10 hours |
| Glowing Purple Rift | 6.5 hours | 13 hours |
| Prehistoric Sea | 7 hours | 14 hours |

Field-camp eligibility now starts at five hours round trip, inclusive. All destinations above except River Bend and Foggy Ravine qualify. Existing Far Shore camps remain available. The field-fire, rest and attack mechanics are unchanged. Shortcuts never remove existing camping eligibility.

Signal discovery no longer replaces the supplied valley travel times with one-hour journeys. The explicit fast-travel cheat remains. Far Shore crossings retain three hours (one with the rift gate), plus the connecting valley route when starting/ending away from home. Travel within the Far Shore remains two hours (one with the rift gate).

Crafting remains instant and uses no energy. Resource uses and save data are preserved. Validation: 126 automated tests pass, including all map routes, return symmetry, half-hour arrivals, inter-area journeys and the five-hour camping boundary.
