# Release 5 — Useful resources and instant crafting

Every inventory resource has a crafting or quest purpose. Added berry travel rations (4 berries + 1 water → 2 rations) and preserved meat broth (1 meat + 1 water → 2 rations), both requiring a burning fire. All other materials already feed existing recipes, gear or quests.

Pack now includes a collapsible resource-use guide derived from actual recipe costs, gear costs and quest requirements. RESOURCE-USES.md contains the full mapping.

Crafting, gear upgrades, lean-to builds/upgrades and observatory beacon restoration are instant and use zero energy. Materials and unlock conditions remain required. Exhaustion does not block crafting. Travel, gathering, searches, treating survivors and combat retain their costs.

122 tests pass, including collectible-purpose coverage, cooking inputs/outputs, quest component uses and exhausted crafting without time advancement. Existing saves gain an empty fieldCamps object; current camps, inventories and equipment are preserved.

## Field camps
Locations with a baseline round trip of six hours or more from home support field camps. All five Far Shore locations qualify (three hours each way before shortcuts). Eligibility remains after fast-travel unlocks. Build a field shelter for 4 logs, 6 fern leaves and 1 rope. Build its fire ring with 4 stone and add 3 logs for three hours of fire. Later refueling needs only 3 logs. Construction is instant and uses no energy. Fire fuel burns as all game time passes, even while away.

Sleep here until dawn or choose a short rest. Every accumulated hour resting at a field camp has a 20% attack chance without fire or 12% with fire. Attacks stop rest immediately and open the existing fight/retreat interaction; only elapsed rest grants energy. Home-camp rest has no random camp attack roll. Field sleep restores 12 energy per hour and 10 health on uninterrupted completion, compared with full energy recovery at a sheltered home camp. Normal food, water and warmth costs still apply. Short naps accumulate toward the hourly risk roll, so splitting rest cannot avoid attacks.

Browser checks verified campsite construction without clock advancement, lighting/refueling controls, displayed attack risk and the resource-use guide. Automated checks cover fire burnout, interrupted sleep, partial recovery, persistence and old-save migration.
