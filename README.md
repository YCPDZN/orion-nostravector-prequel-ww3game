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

## Chapters
The game is split into chapters, each a self-contained mission. Pick one from **CHAPTERS** on the title screen.
- **Chapter I — The Siege of New London** *(New London, November 2090)*: fight through the ruined city, light the signal beacons and destroy the Iron Warden.
- **Chapter II — Ashes of Dover** *(Dover, December 2090)*: coming soon.
- **Chapter III — Iron Tide** *(Normandy, February 2091)*: coming soon.
- **Chapter IV — Winter of the Bear** *(Kaliningrad, March 2091)*: coming soon.
- **Chapter V — Under One Banner** *(Harbin, summer 2091)*: coming soon.

Chapter I begins with a first-person memory: Orion recalls his birth in London in 2069 AD, shown as a soft, out-of-focus dream with a heartbeat, narrated by Orion (voice/intro1-6.mp3). Each chapter then opens with its own title card and prologue and ends with a *Chapter Complete* screen showing your time, kills, deaths and rank. Replaying a chapter keeps Orion's rank and upgrades. Chapters are defined in `js/chapters.js`.

## Alignment
Orion's choices decide who he becomes, and Thomas follows his lead. Both start **Neutral (yellow)** and can end up **Good (blue)** or **Evil (red)**.
- **One dialogue choice per chapter.** Thomas raises the dilemma, Orion picks his reply (good, neutral or evil), and Thomas answers.
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
js/actors.js          Orion, Thomas, enemies, boss, weapons
js/game.js            input (keyboard, touch, gamepad), camera, HUD, saves, story
js/audio.js           procedural sound effects, ambience and music
js/chapters.js        chapter list: titles, openings, prologues, summaries
js/opening.js         the dreamlike first-person opening scene
js/alignment.js       alignment system and the moral choices
js/codex.js           the Codex: character and adversary entries with 3D turntables
voice/01-17.mp3       voiced dialogue lines (played with the subtitles)
voice/warden01-11.mp3 the Iron Warden's Mandarin lines
assets/models.js      the rigged characters embedded for offline play
models/*_rigged.glb   the rigged, animated characters as standard glTF files (Unity/Blender/Godot)
tools/*.py            the rigging pipeline used to build them
```

## The rigged models
`models/OrionMascar_rigged.glb` and `models/ThomasHawthorne_rigged.glb` are standard skinned glTF 2.0 files that import into Unity, Blender, Godot or Unreal.
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
