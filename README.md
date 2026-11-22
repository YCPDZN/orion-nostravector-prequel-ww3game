# ORION — The Third World War

*New London, November 2090.* A souls-like action game.

**The story so far:** the Third World War has raged for ten years, since 2080: the **United States against China and Russia**. Britain stood with America. When the war machines of the **Sino-Russian Pact** crossed the Channel, London fell in a single night. **British Command** sent its youngest commander, **Orion Mascar** (born 2069, age 21), with his apprentice **Thomas Hawthorne** (born 2074), to break the siege. Their dropship never reached the line.

You play Orion, with Thomas fighting beside you as an AI companion. Cut through the Pact's war machines, light the signal beacons, and destroy the **Iron Warden** in the ruined cathedral plaza.

## How to play

**On a PC:** double-click `index.html`. It opens in your browser and runs straight from this folder: no install, no internet needed. Use Chrome, Edge or Firefox.

**On a phone or tablet:** the game is fully touch-enabled and works best in landscape. A phone can't open files from your PC directly, so either:
- use the hosted link Claude gave you, or
- put this folder on any static web host (for example GitHub Pages or Netlify Drop) and open the link on your phone.

On iPhone/Android you can use *Add to Home Screen* to get a full-screen app icon.

## Controls

| Action | Keyboard & mouse | Touch | Gamepad |
|---|---|---|---|
| Move | WASD | Left side of screen (virtual stick; push to the edge to run) | Left stick |
| Camera | Mouse (click the game to capture it) | Drag on the right side | Right stick |
| Light attack (combo) | Left click / J | ATTACK | RB |
| Heavy attack | F / K | HEAVY | RT |
| Block (hold) | Right click / Q | BLOCK | LB |
| Roll (invulnerable frames) | Space | ROLL | B / Circle |
| Use stim (heal) | R | STIM | X / Square |
| Lock on | Tab / middle click | LOCK | R3 |
| Interact (beacon, fog gate) | E | ACT | A / Cross |
| Sprint | Shift (hold) | Push stick fully | L3 |
| Pause | Esc | ❚❚ button | Start |

## Main menu
The title screen is a black stage where Orion and Thomas stand posed according to the alignment of your most recent save (Neutral on a new game), lit by a rim light in that colour:
- **Neutral** (default): Orion stands with arms crossed, wary; Thomas is cautious, rifle held low, glancing around.
- **Good**: Orion stands with arms crossed, head up; Thomas gives a thumbs up.
- **Evil**: Orion grips his red sabre in both hands; Thomas has his arms crossed, turned away, side-eyeing him.

## Chapters
The game is split into chapters, each a self-contained mission. Pick one from **CHAPTERS** on the title screen.
- **Chapter I — The Siege of New London** *(New London, November 2090)*: fight through the ruined city, light the signal beacons and destroy the Iron Warden.
- **Chapter II — Ashes of Dover** *(Dover, December 2090)*, in two parts, whatever your alignment:
  - **Part I — The Traitor** *(Dover Castle)*: you play **Orion alone**. Climb the cliff road under the castle walls, through the gatehouse and the outer bailey (Roman lighthouse, Saxon church, Pact artillery), to the inner bailey and a sword duel with **Talina Alvarez**, a Seville-born British Command officer who defected to the Pact. She parries, ripostes and rolls clear of telegraphed attacks; at half strength she gets faster and finishes combos with an unblockable lunge. Beaten, she drops to one knee, and takes Orion's left eye (the screen cuts to black at the moment of the strike). The scene fades back in on Orion clutching his eye, and branches on his alignment: as **Chaotic Good or Neutral** he lets her go, staggers away, then stops and confesses he has had a crush on her since the academy; as **Chaotic Evil** he calls her back, runs her through and delivers a cold monologue over her body. Part II's radio call and her codex entry follow whichever happened. From then on Orion wears an eyepatch: in later chapters, on the main menu and in the codex (Chapter I replays keep his original face).
  - **Part II — The Apprentice** *(Dover Beach)*: you play **Thomas alone**; Orion does not appear. Fight north along the shingle beneath the white cliffs, past beached Pact landing craft, Czech hedgehogs and WW2 pillboxes, and destroy the **Tidebreaker**, an amphibious assault frame that speaks Russian (browser text-to-speech, English subtitles). Its pilot survives, and **Thomas** decides what to do with him (The Pilot): this moves only Thomas's alignment; Orion's is unaffected.
  - Playing as Thomas: **attack** fires an auto-aimed 3-round burst at your lock-on or whoever is nearest your aim, **heavy** is a rifle-butt strike, and **block** aims down the sights (slower, steadier, harder-hitting shots). Roll and stims work as for Orion.
  - Once you have reached Part II, **CHAPTERS** offers a button to start it directly.
- **Chapter III — Iron Tide** *(Normandy, June 2091)*: eyepatch Orion and Thomas fight with American armour through the bocage (sunken hedgerow lanes, fields, an apple orchard, a Norman village) to the church square, where Talina Alvarez waits for a rematch. If Orion executed Talina at Dover, her twin sister **Inés Alvarez** is there instead, hunting him: two sabres, spinning cuts, and twice her sister's strength.
  - The chapter's choice is Orion's alone (it moves only his alignment). **Talina**: save her (good; she leaves Normandy at his side, which leads into Chapter IV), send her to British Command (neutral) or kill her (evil). **Inés**: spare her (good; she joins as a companion for Chapters IV and V, but Thomas is pushed the opposite way, towards evil), send her to Command (neutral) or kill her (evil).
- **Chapter IV — The Siege of Kaliningrad** *(Kaliningrad, winter 2094)*: a snowbound night in the old Königsberg. How many parts it has depends on Talina:
  - **If Orion saved Talina at Normandy (2 parts).** *Part I, Born Under Siege*: Talina, pregnant with Orion's child, has gone into labour at a field hospital the Pact has cut off. Orion and Thomas fight through the outskirts (Soviet panel blocks, a burnt tram, tank traps) to the hospital courtyard and destroy **the Hunter**, a fast twin-bladed pursuit frame. Then the birth itself, in-engine: Talina in labour at the hospital door, Orion at her side, a silent cut to black, and Talina holding their child. *Part II, The Bear* is the assault below.
  - **If Talina is dead (executed at Dover or killed at Normandy), or in British custody (1 part)**: the chapter is the assault alone.
  - *The assault*: down a tram avenue, past a collapsed apartment block (the chapter's choice, **Survivors in the Rubble**: talk to Thomas there), over the bridge on the frozen Pregel to the square before the House of Soviets, where **the Bear**, a huge winter-white machine with a cleaver in each fist, holds the city. If Orion spared Inés at Normandy, she fights beside him with her two sabres.
  - Dialogue is kept to a minimum: 22 numbered lines in all (no boss taunts, no call-outs). Record them as `voice/kaliningradNN.mp3` and list them in `js/voice_kaliningrad.js`; until then they are subtitles (the Hunter speaks Mandarin and the Bear Russian, through text-to-speech).
- **After Kaliningrad.** When the Bear falls, a narration plays before the Chapter Complete screen. It reads back your war record (every choice Orion and Thomas made, from the Warden's core to the rubble), names **Croxian Mascar**, Orion and Talina's son, if he was born, and tells you where the war will end.
- **Chapter V — Under One Banner** *(spring 2095)*: the end of the war. Three new places: **Harbin** (Central Street's old Russian facades and neon, to the square before the Church of Saint Sophia), **Moscow** (a Stalinist boulevard in the rain, onto Red Square under the Kremlin wall and Saint Basil's) and **New London** again, burning at dawn. Yi Liang, Vladimir Orlov and Josiah Williams I fight with rifles: aimed bursts you can roll through, the rifle butt up close, grenades from half strength. Evil Thomas fights with his rifle; evil Orion with his sword. Beating Yi Liang or Orlov at the end brings the surrender choice; then a closing narration tells how the war ended, and what became of Orion, Thomas, Croxian and Inés. Where it is fought, and against whom, depends on the alignments Orion and Thomas end Chapter IV with (9 outcomes):

  | Orion | Thomas | Part I | Part II |
  |---|---|---|---|
  | Good | Good or Neutral | Harbin, vs Marshal Yi Liang | — |
  | Good | Evil | Harbin, vs Yi Liang | New London, vs Thomas Hawthorne |
  | Neutral | Neutral or Good | Moscow, vs General Vladimir Orlov | — |
  | Neutral | Evil | Moscow, vs Orlov | New London, vs Thomas Hawthorne |
  | Evil | Good | New London, vs Orion Mascar (you play Thomas) | Harbin, vs Yi Liang (as Thomas) |
  | Evil | Neutral | New London, vs Orion Mascar (you play Thomas) | Moscow, vs Orlov (as Thomas) |
  | Evil | Evil | New London, vs Josiah Williams I, head of British Command (Orion, with Thomas) | — |

  The routes and narration are in `js/chapters.js` (`CH5`), the levels in `js/world_ch5.js` and `js/levels.js` ('5h', '5m', '5l'). The three leaders are rigged (`models/VladimirOrlov_rigged.glb`, `YiLiang_rigged.glb`, `JosiahWilliams_rigged.glb`, embedded in `assets/models_ch5.js`).

Chapter I begins with a first-person memory: Orion recalls his birth in London in 2069 AD, shown as a soft, out-of-focus dream with a heartbeat, narrated by Orion (voice/intro1-6.mp3). Each chapter then opens with its own title card and prologue and ends with a *Chapter Complete* screen showing your time, kills, deaths and rank. Replaying a chapter keeps Orion's rank and upgrades. Chapters are defined in `js/chapters.js`; each chapter's enemies, boss, dialogue and weather are in `js/levels.js`.

Chapter II's lines are numbered 1–80 (Part I: 1–44, Part II: 45–80). A recording saved as `voice/doverNN.mp3` (for example `voice/dover34.mp3`) plays with its line, including the title-card narration and the cutscenes, which wait for each recording to finish; lines without a recording stay subtitle-only. `js/voice_dover.js` lists which recordings exist and how long they are. If a recording is on the wrong line, open `voice_matcher.html`, listen to each file and pick the line it really is: **Save to game** applies it at once, and **Copy code** gives a code that can be built into `js/voice_dover.js` (`window.DOVER_MAP`).

Chapters unlock in order: each one opens once the chapter before it has been completed (in the current game or any save slot). The Chapter Complete screen has a button straight into the next chapter, and the chapter select shows a cover image for each chapter (`assets/chapters/`).

Alignment carries from one chapter to the next: finishing Chapter I takes Orion's and Thomas's alignment into Dover (use the **NEXT CHAPTER** button on the Chapter Complete screen). Replaying a chapter keeps your current alignment and the choices you've already made (so a replay never shifts alignment twice); from the title screen, Chapter Select builds on your most recent save.

## Alignment
Orion's choices decide who he becomes, and Thomas follows his lead. Both start **Neutral (yellow)** and can end up **Good (blue)** or **Evil (red)**.
- **One dialogue choice per chapter.** Thomas raises the dilemma, Orion picks his reply (good, neutral or evil), and Thomas answers. Chapter I's replies are fully voiced (voice/ch1_*.mp3).
- Orion is always **Chaotic** and Thomas always **Lawful**, so as they turn they become Chaotic Good / Chaotic Neutral / Chaotic Evil and Lawful Good / Lawful Neutral / Lawful Evil. Both start Neutral.
- Alignment changes how you fight. **Good**: you deal 1.5x damage and take 1.5x less. **Neutral**: normal. **Evil**: you deal 2x damage but take 1.5x more. It uses the alignment of whoever you are playing (Orion, or Thomas in Chapter II, Part II).
- Every choice moves Orion's alignment, and moves Thomas's by 90% as much, so one choice is enough to change both. Evil choices pay in scrap and stims; good ones cost you.
- You can see alignment in the HUD chips under the health bars, the colour of Orion's sabre and Thomas's rifle stripe, the Codex, the chapter list, and the Chapter Complete screen (with an ending line for Orion's path). It is kept in your save slots.

| Chapter | Dialogue choice |
|---|---|
| I — The Siege of New London | The Warden's Core (after the boss falls) |
| II — Ashes of Dover | The Pilot |
| III — Iron Tide | The Field Hospital |
| IV — Winter of the Bear | Survivors in the Rubble |
| V — Under One Banner | The Surrender |

## Souls-like systems
- **Stamina** for every swing, roll and block. Run dry and your guard breaks.
- **Stims** (your flasks) refill at **Signal Beacons**. Resting also respawns every war machine.
- **Scrap** comes from destroyed machines. When you die it stays where you fell; walk back to recover it, or lose it if you die again.
- **Reinforce** at a beacon: spend scrap on Vigor (health), Endurance (stamina) or Strength (damage). Every 3 ranks adds a stim.
- **Enemies**: Pact Revenants (blade troopers), Seeker Drones (ranged plasma; roll through the bolts) and Juggernauts (slow, heavy slams).
- **Boss: the Iron Warden.** Sweeping cleaves, a slam that sends out a shockwave (roll through it), a charge, and a second phase at half health with an orbital barrage.
- **Thomas** follows you, picks targets, holds his rifle properly with both hands (arm IK: stock in the shoulder, hands on grip and handguard), shoulders it to fire aimed 3-round bursts (muzzle flash, tracers, ejected casings), rifle-bashes enemies that get close, and gets back up if he goes down. He's built tough: 3× a soldier's health (780), and the Iron Warden's attacks do only half damage to him and don't stagger him.
- **Codex** (title screen and pause menu): lore entries for Orion and Thomas with live 3D turntables of their models. Adversary entries unlock as you meet each war machine.
- Fully voiced dialogue: 17 lines for Thomas, Orion and British Command, synced with subtitles.
- **The Iron Warden speaks Mandarin Chinese** — 11 recorded lines (voice/warden01–11.mp3): intro, taunts (including "The Red Sun and the Bear have united under one banner"), orbital-strike call-out, phase 2, killing Orion and his defeat — with English subtitles.
- **Manual saving:** the game never autosaves. Use **Save Game** from the pause menu, a beacon or the Chapter Complete screen; there are 3 slots. Load from **Load Game** on the title screen or pause menu, and **Continue** loads your most recent save. You can't save during a boss fight. Saves are stored in the browser you play in.

## Graphics
The game uses a custom WebGL2 engine (no libraries): GPU-skinned characters with their original PBR and normal-map textures, PCF shadows, HDR bloom, ACES tone mapping, fog, a procedural night sky with artillery flashes, fire and ember particles, and procedural concrete, brick, metal and ground materials.
**Settings → Graphics** offers Low / Medium / High (Auto picks Medium on phones, High on desktop). Pick Low if an older phone struggles.

## Folder contents
```
index.html            the game
rig-viewer.html       preview every animation on both rigged characters
js/engine.js          WebGL2 renderer (skinning, PBR, shadows, bloom, particles)
js/world.js           New London level: street, overpass, fog gate, cathedral arena
js/world_castle.js    Dover Castle level (Chapter II, Part I): cliff road, gatehouse, baileys, Great Tower
js/world_dover.js     Dover beach level (Chapter II, Part II): white cliffs, shingle, the Channel, landing ships
js/world_normandy.js  Normandy level (Chapter III): the bocage, the village, the church square
js/world_kaliningrad.js  Kaliningrad levels (Chapter IV): the road to the field hospital; the House of Soviets
js/cine.js            in-engine cutscenes (Talina and Orion's eye; the birth at Kaliningrad)
js/levels.js          per-level enemies, boss, playable hero, voice lines, sky and weather
js/actors.js          Orion, Thomas, enemies, boss, weapons
js/game.js            input (keyboard, touch, gamepad), camera, HUD, saves, story
js/audio.js           procedural sound effects, ambience and music
js/chapters.js        chapter list: titles, openings, prologues, summaries
js/opening.js         the dreamlike first-person opening scene
js/alignment.js       alignment system and the moral choices
js/menu.js            the main-menu stage and alignment poses
js/codex.js           the Codex: character and adversary entries with 3D turntables
voice/01-17.mp3       voiced dialogue lines (played with the subtitles)
voice/warden01-11.mp3 the Iron Warden's Mandarin lines
assets/models.js      the rigged characters embedded for offline play
models/*_rigged.glb   the rigged, animated characters as standard glTF files (Unity/Blender/Godot)
tools/*.py            the rigging pipeline used to build them
```

## The rigged models
`models/OrionMascar_rigged.glb`, `models/OrionEyepatch_rigged.glb`, `models/ThomasHawthorne_rigged.glb` `models/TalinaAlvarez_rigged.glb`, `models/TalinaPregnant_rigged.glb` (Chapter IV) and `models/InesAlvarez_rigged.glb` are standard skinned glTF 2.0 files that import into Unity, Blender, Godot or Unreal.
- **Skeleton:** 21 bones (Hips, Spine, Chest, Neck, Head, Shoulder/UpperArm/ForeArm/Hand ×2, UpLeg/Leg/Foot/Toe ×2).
- **Scale:** real-world metres, about 1.82 m tall.
- **Mesh:** optimised for mobile from about 1.9M to about 50k triangles, with the original 1024² colour, normal and metal/roughness textures kept.
- **Orion's clips:** Idle, Walk, Run, Attack1, Attack2, Heavy, Roll, Block, Hit, Death, Heal.
- **Thomas's clips:** Idle, Walk, Run, WalkAim, Aim, Shoot (3-round burst with recoil), Attack1 (rifle bash), Roll, Hit, Death. In game his rifle is aimed procedurally at his target.
- The weighting is region-aware: Orion's cloak follows his hips and spine instead of his arms, and fused hand/thigh geometry was separated.

### Rebuilding the rig (optional)
This needs Python 3 with numpy and scipy. Put the original Tripo files in `source_models/`, then run:
```
python tools/extract.py
python tools/rig.py
python tools/pack.py
```
Joint positions and animation keyframes are in `tools/rig.py` and `tools/anims.py`.
