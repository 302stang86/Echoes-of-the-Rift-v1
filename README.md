# Echoes of the Rift

A playable first version of a single-player, illustrated survival adventure. Built from plain HTML, CSS and JavaScript for free GitHub Pages hosting. No accounts, paid services, frameworks, dependencies, or API keys are required.

## Start playing

Publish to GitHub Pages using the instructions below, or serve this folder with a local static web server and open index.html. For example, with Python installed: `python3 -m http.server 8000`, then visit http://localhost:8000. Use a web server rather than opening file:// URLs: browsers handle shared storage across local HTML files differently.

Name your protagonist, follow the illustrated prologue, then explore the valley. Select a map destination and press Travel. This is a map-based, action-driven adventure with turn-based encounters; it does not use real-time character movement. Each travel/gather/craft/rest action advances the clock. Navigation between HTML pages does not.

## Publish free with GitHub Pages

GitHub Free supports Pages for public repositories. Your game code and bundled images will be publicly accessible.

1. Create a public GitHub repository, for example echoes-of-the-rift, or choose an existing public repository.
2. Extract this ZIP. Upload the contents of the echoes-of-the-rift folder to the repository root. Keep assets and its subfolders intact. index.html must be at the root. Include .nojekyll; tests and README are optional for hosting.
3. In the repository, open Settings → Pages.
4. Under Build and deployment, select Deploy from a branch.
5. Select main and /(root), then Save.
6. Wait for GitHub to report the published URL. Open that URL to play.

The game also works inside a subdirectory of an existing Pages site: upload all game files into that directory and link to its index.html. All links and assets use relative paths. No GitHub Actions build is necessary.

Official documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Pages

- index.html — title, player name, new game, continue
- story.html — four prologue scenes illustrated with all 20 panels from the first sheet
- world.html — 13 interactive travel destinations, gathering, scavenging, investigations, wildlife encounters
- camp.html — shelter, warmth, integrity, resting, Maya assignments and transmitter defenses
- crafting.html — 14 recipes, material costs and progression locks
- inventory.html — resources, equipment, save export and import
- journal.html — six quests, checklist progress, story recap and wildlife field guide

## Survival systems

- Health, hunger, hydration and warmth; cold nights and campfires.
- Eight-hour rest requires a lean-to, restores health and consumes survival time.
- Fire consumes two logs each midnight; stockpiles matter.
- Four gathering actions per site per day; sites replenish at midnight.
- Eight gathered resource-type slots per expedition, or ten with Maya; stacks have no weight limit. Return to camp to unload.
- Maya can guard, forage, cook, fish after her rig is crafted, or accompany the hero. Companion benefits include improved herb yields, ambush detection and reduced combat damage.
- Iron spear, traps and rift-crystal flares support turn-based combat. Retreat returns to camp.
- Gear and structures are equipped automatically when crafted.
- A persistent dire wolf threat interrupts Maya’s fishing during Apex Predator.
- Camp raids damage integrity if Maya is absent or not guarding; palisades reduce damage.
- Rift scavenging supplies modern components. Battery replacements remain renewable.
- Ravine route puzzle, three transmitter defense waves and an ordered wiring puzzle complete the campaign.
- Signal completion unlocks free play, survivor recruitment and faster return travel to visited regions.

## Beginner route

Bring Maya from Camp, then visit the forest twice for 10 logs and 16 leaves. Return to camp and build the lean-to. Next gather birch saplings, craft Maya’s fishing rig, and collect flint at River Bend to build a campfire. Gather more timber for fuel. Eat, drink and rest before critical levels. Keep Maya fishing across midnight to generate food, then preserve fish at the workbench. The quest journal explains the remaining objectives.

## Artwork

Both supplied 1376 × 768 JPEG sheets are included, unmodified, in assets/art. Each contains 20 panels. Inline SVG viewports and clip rectangles present the 40 panels separately, preserving their captions and proportions without destructive raster edits. assets/art/panels.json records every panel’s title, source sheet and bounds. The prologue uses the first 20; the frontier 20 appear in gameplay, crafting, camp, quests, inventory and the field guide. The supplied unlabeled valley map is displayed intact with live HTML location markers. The labeled reference guided placement. The map supports zoom (100–300%), mouse-wheel zoom, pinch zoom, drag panning, Fit map, Locate me, label visibility, keyboard controls, and an accessible destination list. In phone-sized overview, only selected/current labels appear to prevent overlap; zoom in to see the other labels. Selecting a marker does not travel or consume time. The details panel shows requirements, resource types, and travel time before you move. Glacier Peaks requires coats; additional areas follow quest progression; the Rift Monolith unlocks after the ravine puzzle. Existing version-1 saves remain compatible.

Some supplied wildlife illustrations document the world rather than adding a separate combat or hunting mechanic. Wolves, cave bears and rift-displaced terror birds are the implemented combat enemies. Rifts explain wildlife from mismatched prehistoric eras.

## Saves

Progress autosaves in localStorage under echoes-rift-v1. It is specific to the browser, device and website origin. It is not a cloud save. Export a JSON backup from Pack before changing devices, changing site addresses, clearing browser data or starting another journey. Import validates the file and asks before replacing current progress. Browser storage failures show a warning. Death ends the run; import a previous backup or start anew.

## Development and checks

Run `node --test tests/*.test.cjs` to verify progression and survival rules. Thirty-one automated tests cover import validation, gathering limits, carry capacity, Maya assignments, cold/fire/rest, battery renewability, six-quest progression, combat and death. The campaign rule test uses supplied resource fixtures; it is not a full survival-balance playthrough. Browser smoke testing verified naming, the prologue, travel, companion assistance, gathering, crafting the shelter, quest advancement and illustrations. The interactive-map update was checked for selection, lock messages, zoom, label visibility, travel, gathering, and a 390px-wide responsive layout. Added automated checks cover destination coordinates, unlock requirements, resource yields and zoom/pan geometry.

This initial version is intentionally expandable. A phone-width browser preview was checked; physical iPhone/Safari gesture testing has not been performed. No multiplayer, cloud saves, paid assets or backend services are included.

## Map update

The illustrated map has 13 destinations: River Camp, Old-growth Forest, Birch Grove, River Bend, Broken Ridge, Glowing Purple Rift, Foggy Ravine, Glacier Peaks, Cave Bear Den, Woolly Rhino Meadow, Wolf Totem, Rift Monolith, and Prehistoric Sea. The wolf territory near the river remains the Apex Predator quest site. The coast and meadow add exploration and gathering; the den also offers a deliberate cave-bear encounter. None of the travel durations changed to the multi-day scale shown on the reference artwork. Travel still takes two game hours, or one for unlocked fast travel.

## Maya & partner relationship progression

Maya Lin’s trust and affection persist with your save, both capped at 100. New journeys begin at Trust 10 / Affection 0. The companion name follows the updated character profile. Older saves initialize relationship progress from completed camp/quest milestones without changing your name, inventory, location, or quests. Existing relationship data is preserved on later loads and imports.

### Acts and moments

- Act I, The Survival Bond: Trust 0–30. After at least four cold hours at the lean-to and surviving until dawn, The Shared Blanket becomes available at camp. Offering a jacket or sharing the wool blanket gives exactly +5 Trust and +5 Affection, once.
- Act II, The Deepened Partnership: Trust 31–70; this remains the stage for higher trust until Affection reaches 80. After the blanket scene, Trust 31+, and Fresh Catch (a shared camp project) or Apex Predator completed with Maya, The Reminiscent Echo becomes available. “We’re building a new map together” gives +10 Affection; “One day at a time” gives +5 Trust. Either response unlocks Synergy.
- Act III, Devotion & Commitment: Trust 71+ and Affection 80+. After the earlier scenes, complete Chapter 3 (the signal) or build the Permanent river home. Return to a safe camp in the evening (18:00–05:00) for The Riverbank Confession. Choose commitment to unlock Shared Future, or choose a lasting friendship. Scenes may be deferred and revisited from the relationship card.

Events are presented at camp, never over a combat encounter. Each completed scene awards its benefits once. The journal records the game day and your response; reading memories does not grant rewards again. All dialogue inserts the chosen protagonist name as safely displayed text.

### Growing the bond

Each camp activity takes one game hour and can reward progress once per game day:

| Activity | Cost | Trust | Affection |
| --- | --- | --- | --- |
| Listen & talk | No materials | +3 | +4 |
| Share a meal | 1 preserved ration | +3 | +5 |
| Weave a keepsake | 1 rope, 1 wire | +2 | +6 |

The first successful gathering action with Maya each day adds +3 Trust and +2 Affection. Building the shelter, fishing rig, monolith discovery, defeating the wolf, completing the signal, and the permanent camp upgrade grant one-time milestone progress. These routes make the late-game thresholds reachable without repeating a dialogue reward.

### Gameplay benefits and ending

Synergy saves one hour on every fourth successful gathering action with Maya; failed or solo gathering does not advance its rhythm. Your next free gathering action is labeled in Explore.

Choosing commitment raises Maya’s companion damage reduction from 3 to 6 and adds +2 to gathered herbs, berries and saplings. Daily camp output also rises by 2: fishing yields 6 raw fish, foraging yields 5 herbs plus 5 berries, and cooking converts 2 fish into 5 rations. Normal assignment requirements and wildlife restrictions still apply. Camp dialogue changes with your relationship stage.

Shared Future is an optional ending path. It becomes viewable from the camp’s relationship card after both commitment and the transmitter signal are complete. The confession and ending include a gentle campfire pan/zoom and a written embrace; reduced-motion preferences disable the animation. Free play continues afterward.

The Permanent river home costs 20 logs, 12 stone, 8 metal plates and 4 rope, requires a reinforced palisade, and unlocks after Signals in the Mist. It offers an alternative to finishing the transmitter before the confession; the ending itself still requires the signal.

### Relationship verification

Twelve additional automated checks cover migration, night/event triggers, threshold boundaries, both Echo responses, daily limits and material costs, non-repeatable rewards, Synergy timing, confession prerequisites, commitment/friendship choices, actual support bonuses, custom names, invalid imports, and reaching the late-game thresholds through daily activities. Browser checks verified the first two scenes through ordinary play and the confession/ending with an isolated late-game fixture. The original save was kept separate from that fixture.

## Blue rift background and mobile polish

The title screen now uses a new wide illustrated background inspired by the supplied blue parchment/rift/Mustang reference. It is included at assets/art/blue-rift-background.png. A quieter dark left side keeps the title and form readable, while the rift, Mustang and prehistoric carvings fill the right. Other pages show a subdued version behind their panels. The interface uses midnight navy, slate blue, cobalt and ice-blue accents; natural story illustrations and the valley map retain their own colors. No generated artwork is fetched from an external service at runtime.

The phone layout has stacked full-width title buttons, larger touch controls, safe-area padding around the notch and home indicator, and scrollable dialogues. A 390 × 844 browser preview was checked for title layout, menu fit, horizontal overflow and cheat-code entry. This is a responsive layout check, not a physical iPhone/Safari test. The first full artwork download is about 3.1 MiB; browsers cache it for later pages.

## Optional Cheats menu

Open Cheats in the navigation and enter the exact, case-sensitive access code **Chaosenvy**. Access stays unlocked for the current browser-tab session; Lock menu removes that access. This access state is separate from exported saves. All effects start off. Unlocking the menu alone does not mark your save as cheated. Enabling a cheat or applying an instant action permanently marks that save with Cheats · USED.

| Option | Effect |
| --- | --- |
| Invincibility | Health stays at 100. Enabling it revives a fallen hero. |
| Unlimited survival | Hunger, hydration and warmth stay at 100; the clock continues. |
| Free crafting | Materials are not required or spent; blueprint requirements and crafting time remain. |
| No random ambushes | Random travel encounters stop; quest wolves and defense waves remain. |
| Unlock destinations | Map travel restrictions are bypassed; puzzle and story prerequisites remain. |
| Fast travel everywhere | Every trip takes one game hour. |
| Restore survival meters | Instantly restore health, hunger, hydration and warmth; also revives the hero. |
| Spawn supply cache | Add 50 of every resource type, including food, water and traps. |
| Max relationship stats | Set trust and affection to 100, without completing scenes or choosing commitment. |

Disable ongoing cheats turns off all toggles. Instant supplies, crafted items, restored stats, relationship gains, completed progress and the used-save marker remain. Lock menu gates access without changing active effects. Cheats are also accessible from a combat encounter. Older saves need no reset and have no cheat effects by default.

Seven additional automated checks verify exact-code access, locking, survival and combat effects, free crafting requirements, map travel, required encounters, instant actions and save persistence. Browser checks verified wrong-code rejection, successful unlock, toggles, free crafting, disabling and re-locking in an isolated test save.
