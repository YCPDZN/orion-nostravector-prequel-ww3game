/* ORION — The Third World War. Main game controller. */
(function () {
'use strict';
const GM = window.GM = {};
const $ = (id) => document.getElementById(id);
const rnd = Math.random, R = (a, b) => a + (b - a) * rnd();
const isTouch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

/* ---------------- settings & save ---------------- */
const SET_KEY = 'orion_ww3_settings', SAVE_KEY = 'orion_ww3_save';
const load = (k, d) => { try { return Object.assign({}, d, JSON.parse(localStorage.getItem(k) || '{}')); } catch (e) { return Object.assign({}, d); } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
GM.settings = load(SET_KEY, { quality: 'auto', sens: 5, inv: false, vol: 8, touch: 'auto' });
const NEW_SAVE = { started: false, align: { o: 0, t: 0 }, choices: {}, chapter: 1, done: {}, stats: { time: 0, deaths: 0, kills: 0 }, vig: 0, end: 0, str: 0, rank: 1, scrap: 0, maxStims: 4, beacon: 0, lit: [true, false], bossDead: false, echo: null, seen: {} };
GM.save = JSON.parse(JSON.stringify(NEW_SAVE));
GM.persist = () => { }; // no autosave: progress is only written when the player saves
const SLOT_KEY = 'orion_ww3_slots', NSLOTS = 3;
function readSlots() { try { const a = JSON.parse(localStorage.getItem(SLOT_KEY) || '[]'); while (a.length < NSLOTS) a.push(null); return a.slice(0, NSLOTS); } catch (e) { return [null, null, null]; } }
function writeSlots(a) { try { localStorage.setItem(SLOT_KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
(function migrateAutosave() { // bring progress from older versions (which autosaved) into slot 1
  try {
    const old = localStorage.getItem(SAVE_KEY); if (!old) return; const slots = readSlots();
    if (!slots.some(Boolean)) { const sv = Object.assign(JSON.parse(JSON.stringify(NEW_SAVE)), JSON.parse(old));
      if (sv.started) { slots[0] = { when: Date.now(), loc: 'Last beacon (imported)', save: sv, world: null }; writeSlots(slots); } }
    localStorage.removeItem(SAVE_KEY);
  } catch (e) { }
})();
const QUALITY = {
  low: { shadow: 1024, dpr: 1, msaa: 2, bloom: false, particles: 1200, shadowExt: 18, drawDist: 70, aniso: 2 },
  medium: { shadow: 1536, dpr: 1.5, msaa: 4, bloom: true, particles: 2000, shadowExt: 22, drawDist: 95, aniso: 4 },
  high: { shadow: 2048, dpr: 2, msaa: 4, bloom: true, particles: 3000, shadowExt: 26, drawDist: 130, aniso: 8 },
};
const qName = () => GM.settings.quality === 'auto' ? (isTouch ? 'medium' : 'high') : GM.settings.quality;
const touchOn = () => GM.settings.touch === 'on' || (GM.settings.touch === 'auto' && isTouch);

/* ---------------- state ---------------- */
GM.state = 'loading'; GM.enemies = []; GM.projectiles = []; GM.markers = []; GM.shocks = []; GM.lock = null; GM.audio = AU;
GM.cam = { yaw: 0, pitch: 0.28, dist: isTouch ? 4.6 : 4.2, pos: [0, 2, -4], target: [0, 1.5, 0], fov: 1.0, shake: 0 };
GM.camFov = GM.cam.fov; // gameplay lens; menu/codex stages restore this
let hs = 0, flashT = 8, lastT = 0, time = 0, boss = null;
GM.hitstop = (t) => { hs = Math.max(hs, t); };
GM.shake = (a) => { GM.cam.shake = Math.min(1, GM.cam.shake + a); };

/* ---------------- levels: one per chapter, built the first time it is needed ---------------- */
let LV = null; GM.levels = {};
const clone = (o) => JSON.parse(JSON.stringify(o));
const ENV_KEYS = ['sunDir', 'sunCol', 'sky', 'ground', 'fogCol', 'fogDen', 'exposure', 'skyPal'];
/* a chapter can have parts, each with its own level: Chapter II is '2a' (Orion, Dover Castle) then '2b' (Thomas, the beach) */
const levelId = (S) => S.chapter === 2 ? (S.part === 2 ? '2b' : '2a') : (S.chapter || 1);
GM.levelId = levelId;
/* who you play: Orion (sword; eyepatch once he has lost the eye, except in Chapter I) or Thomas (rifle) */
GM.heroes = {};
function heroFor(def) {
  const S = GM.save;
  if (def.hero === 'thomas') return 'thomas';
  if (S.chapter === 1) return 'orion';
  if (S.chapter === 2 && S.part !== 2) return S.eyeLost ? 'orionEye' : 'orion';
  return S.eye ? 'orionEye' : 'orion';
}
function hero(key) {
  if (!GM.heroes[key]) { const prev = OE.scene; OE.scene = new OE.Node();
    GM.heroes[key] = key === 'thomas' ? new A.Player(GM.assets.thomas, 'rifle') : new A.Player(key === 'orionEye' ? GM.assets.orionEye : GM.assets.orion);
    OE.scene = prev; }
  return GM.heroes[key];
}
GM.pickHero = function () {
  const def = LV.def, key = heroFor(def), P = hero(key);
  if (GM.player && GM.player !== P) { P.pos = GM.player.pos.slice(); P.yaw = GM.player.yaw; }
  for (const k in GM.heroes) { const h = GM.heroes[k]; if (h.node.parent) h.node.parent.remove(h.node); if (h !== P) { h.light.intensity = 0; if (h.muzzle) h.muzzle.intensity = 0; } }
  GM.player = P; GM.heroKey = key; LV.root.add(P.node);
  if (GM.companion.node.parent) GM.companion.node.parent.remove(GM.companion.node);
  GM.solo = !!def.solo; if (!GM.solo) LV.root.add(GM.companion.node);
  document.querySelector('.bars').dataset.who = key === 'thomas' ? 'VITALS // APPR. T. HAWTHORNE' : 'VITALS // CMDR. O. MASCAR';
};
GM.loadLevel = function (id) {
  if (!LEVELS[id]) id = 1;
  let L = GM.levels[id];
  if (!L) {
    const before = new Set(OE.R.lights), prevScene = OE.scene, root = new OE.Node(); OE.scene = root;
    const st = W.make(id), def = LEVELS[id];
    const enemies = def.spawns.map(([t, p]) => new A.Enemy(t, p, Math.PI));
    const b = def.boss.duelist ? new A.Duelist(GM.assets[def.boss.duelist], def.boss.pos, Math.PI, def.boss.T) : new A.Enemy(def.boss.type, def.boss.pos, Math.PI); enemies.push(b);
    const env = clone(GM.baseEnv); if (def.env) Object.assign(env, clone(def.env));
    L = GM.levels[id] = { id, def, root, st, enemies, boss: b, env, lights: OE.R.lights.filter((l) => !before.has(l)) };
    OE.scene = prevScene;
  }
  if (LV !== L) {
    if (LV) OE.R.lights = OE.R.lights.filter((l) => !LV.lights.includes(l));
    for (const l of L.lights) if (!OE.R.lights.includes(l)) OE.R.lights.push(l);
    W.use(L.st); GM.enemies = L.enemies; boss = GM.boss = L.boss;
    GM.worldRoot = L.root; GM.worldEnv = L.env; LV = GM.level = L;
    if (!GM._inMenu) { OE.scene = L.root; Object.assign(OE.R, clone(L.env)); }
  }
  GM.pickHero();
  return L;
};
const introKey = (id) => id === 1 ? 'intro' : 'intro_' + id;

/* ---------------- boot ---------------- */
GM.boot = async function () {
  const msg = (t, p) => { $('lmsg').textContent = t; $('lbar').style.width = (p * 100) + '%'; };
  try {
    msg('Preparing renderer', 0.05); await tick();
    OE.init($('c'), QUALITY[qName()]);
    OE.scene = new OE.Node();
    GM.baseEnv = {}; for (const k of ENV_KEYS) GM.baseEnv[k] = clone(OE.R[k]);
    GM.align.build(); W.textures();
    msg('Loading Orion Mascar', 0.45); await tick();
    const dec = (s) => { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };
    const orion = await OE.loadGLB(dec(ORION_MODELS.orion));
    msg('Loading Thomas Hawthorne', 0.7); await tick();
    const thomas = await OE.loadGLB(dec(ORION_MODELS.thomas));
    msg('Waking the war machines', 0.9); await tick();
    GM.parts = new OE.Particles(QUALITY[qName()].particles);
    msg('Loading Talina Alvarez', 0.8); await tick();
    const orionEye = await OE.loadGLB(dec(ORION_MODELS.orionEye)), talina = await OE.loadGLB(dec(ORION_MODELS.talina));
    GM.assets = { orion, thomas, orionEye, talina };
    GM.heroes.orion = GM.player = new A.Player(orion); GM.companion = new A.Companion(thomas);
    msg('Building New London', 0.95); await tick();
    GM.loadLevel(1);
    respawnAll(true);
    setupInput(); setupUI();
    msg('', 1);
    $('loading').classList.add('hidden');
    showTitle();
    lastT = performance.now(); requestAnimationFrame(frame);
    document.title = 'ORION — The Third World War';
    window.__ready = true;
  } catch (e) {
    console.error(e); $('lmsg').textContent = 'Error: ' + e.message; document.title = 'ERR ' + e.message;
  }
};
const tick = () => new Promise((r) => setTimeout(r, 16));

function spawnPoint() {
  const b = W.beacons[GM.save.beacon] || W.beacons[0];
  return { pos: [b.pos[0] - 1.3, 0, b.pos[2] + 1.4], yaw: 0 };
}
function respawnAll(first) {
  try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { }
  if (GM.align) GM.align.hud(true);
  const sp = spawnPoint();
  GM.player.reset(sp.pos, sp.yaw);
  GM.companion.reset([sp.pos[0] - 1.6, 0, sp.pos[2] - 0.8]); if (GM.solo) GM.companion.alive = false;
  for (const e of GM.enemies) { if (e.boss && GM.save.bossDead) { e.alive = false; e.state = 'dead'; e.root.visible = false; continue; } e.reset(); }
  GM.projectiles.length = 0; GM.markers.length = 0; GM.shocks.length = 0; GM.lock = null;
  W.beacons.forEach((b, i) => setBeaconLit(b, !!GM.save.lit[i]));
  W.gate.sealed = false; W.sealCol.off = true; W.gateCol.off = GM.save.bossDead; W.gate.node.visible = !GM.save.bossDead;
  GM.inBoss = false; $('bossbar').classList.add('hidden'); AU.bossMusic(false);
  GM.cam.yaw = sp.yaw; GM.cam.pitch = 0.28;
  OE.R.desat = 0;
}
function setBeaconLit(b, lit) {
  b.lit = lit; b.beam.visible = lit; b.core.mat.emissive = lit ? [1.2, 2.6, 5] : [0.2, 0.5, 1.0]; b.light.intensity = lit ? 3.5 : 0.6; b.light.range = lit ? 12 : 8;
}

/* ---------------- input ---------------- */
const keys = {}; const edge = {}; let mdx = 0, mdy = 0, mouseL = false, mouseR = false;
function lockPointer() {
  if (isTouch || GM.noLock) return; const cv = $('c'); if (!cv.requestPointerLock) { GM.noLock = true; return; }
  try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { GM.noLock = true; }); } catch (e) { GM.noLock = true; }
}
let drag = null;
const touch = { stickId: null, sx: 0, sy: 0, mx: 0, my: 0, camId: null, cx: 0, cy: 0, dx: 0, dy: 0, btn: {}, edge: {} };
let padPrev = {};
function press(name) { edge[name] = true; }
function setupInput() {
  addEventListener('keydown', (e) => {
    if (e.repeat) { if (['Tab', 'Space'].includes(e.code)) e.preventDefault(); return; }
    keys[e.code] = true; AU.init();
    const map = { Space: 'roll', KeyR: 'heal', KeyF: 'heavy', KeyJ: 'attack', KeyK: 'heavy', KeyE: 'interact', Tab: 'lock', Escape: 'pause', KeyP: 'pause', Enter: 'confirm' };
    if (map[e.code]) { press(map[e.code]); e.preventDefault(); }
    if (GM.state === 'crawl') endCrawl(); else if (GM.state === 'birth') { if (e.code === 'Escape') GM.birth.skip(); else GM.birth.advance(); }
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  const cv = $('c');
  cv.addEventListener('mousedown', (e) => {
    AU.init();
    if (isTouch && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    if (GM.state !== 'play') return;
    if (GM.noLock) { if (e.button === 0) drag = { x: e.clientX, y: e.clientY, moved: false }; else if (e.button === 2) mouseR = true; else if (e.button === 1) press('lock'); return; }
    if (document.pointerLockElement !== cv) { lockPointer(); return; }
    if (e.button === 0) { mouseL = true; press('attack'); } if (e.button === 2) mouseR = true; if (e.button === 1) { press('lock'); e.preventDefault(); }
  });
  addEventListener('mouseup', (e) => { if (e.button === 0) { mouseL = false; if (drag && !drag.moved && GM.state === 'play') press('attack'); drag = null; } if (e.button === 2) mouseR = false; });
  addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === cv) { mdx += e.movementX; mdy += e.movementY; }
    else if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (drag.moved) { mdx += dx * 1.4; mdy += dy * 1.4; } drag.x = e.clientX; drag.y = e.clientY; }
  });
  document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && GM.state === 'play' && !isTouch && !GM.noLock) openPause(); });
  document.addEventListener('pointerlockerror', () => { GM.noLock = true; });
  // touch: left half = move stick, right half = camera
  const stick = $('stick'), knob = stick.querySelector('i');
  cv.addEventListener('touchstart', (e) => {
    AU.init(); e.preventDefault();
    if (GM.state === 'crawl') { endCrawl(); return; }
    for (const t of e.changedTouches) {
      if (t.clientX < innerWidth * 0.45 && touch.stickId === null) { touch.stickId = t.identifier; touch.sx = t.clientX; touch.sy = t.clientY; touch.mx = touch.my = 0; stick.style.left = t.clientX + 'px'; stick.style.top = t.clientY + 'px'; stick.style.opacity = 1; knob.style.transform = ''; }
      else if (touch.camId === null) { touch.camId = t.identifier; touch.cx = t.clientX; touch.cy = t.clientY; }
    }
  }, { passive: false });
  cv.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === touch.stickId) {
        let dx = t.clientX - touch.sx, dy = t.clientY - touch.sy; const l = Math.hypot(dx, dy), max = 55;
        if (l > max) { // drag the stick origin along
          touch.sx += dx * (1 - max / l) * 0.5; touch.sy += dy * (1 - max / l) * 0.5; stick.style.left = touch.sx + 'px'; stick.style.top = touch.sy + 'px';
          dx = t.clientX - touch.sx; dy = t.clientY - touch.sy;
        }
        const m = Math.min(1, Math.hypot(dx, dy) / max); const a = Math.atan2(dy, dx);
        touch.mx = Math.cos(a) * m; touch.my = -Math.sin(a) * m;
        knob.style.transform = `translate(${Math.cos(a) * m * max * 0.8}px,${Math.sin(a) * m * max * 0.8}px)`;
      } else if (t.identifier === touch.camId) { touch.dx += t.clientX - touch.cx; touch.dy += t.clientY - touch.cy; touch.cx = t.clientX; touch.cy = t.clientY; }
    }
  }, { passive: false });
  const tend = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === touch.stickId) { touch.stickId = null; touch.mx = touch.my = 0; stick.style.opacity = 0; }
      if (t.identifier === touch.camId) touch.camId = null;
    }
  };
  cv.addEventListener('touchend', tend); cv.addEventListener('touchcancel', tend);
  buildTouchButtons();
}
const ICONS = {
  attack: '<svg viewBox="0 0 24 24"><path d="M4 20 L15 9 M14 4 L20 4 L20 10 L9 21 L3 21 L3 15 Z"/></svg>',
  heavy: '<svg viewBox="0 0 24 24"><path d="M12 2 V16 M7 7 L12 2 L17 7 M6 20 H18"/></svg>',
  roll: '<svg viewBox="0 0 24 24"><path d="M20 12 A8 8 0 1 1 12 4 M12 4 L16 2 M12 4 L15 8"/></svg>',
  block: '<svg viewBox="0 0 24 24"><path d="M12 2 L20 5 V12 C20 17 16 20 12 22 C8 20 4 17 4 12 V5 Z"/></svg>',
  heal: '<svg viewBox="0 0 24 24"><path d="M9 3 H15 M10 3 V8 L6 18 C5 21 19 21 18 18 L14 8 V3 M8 14 H16"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="M12 2 V6 M12 18 V22 M2 12 H6 M18 12 H22"/></svg>',
  interact: '<svg viewBox="0 0 24 24"><path d="M7 12 L11 16 L18 8"/></svg>',
};
function buildTouchButtons() {
  const L = $('touch');
  const defs = [['attack', 'ATTACK', 80, 26, 34], ['heavy', 'HEAVY', 58, 120, 20], ['roll', 'ROLL', 62, 30, 140], ['block', 'BLOCK', 58, 116, 106],
    ['heal', 'STIM', 48, 196, 26], ['lock', 'LOCK', 44, 36, 230], ['interact', 'ACT', 58, 198, 104]];
  for (const [id, label, size, right, bottom] of defs) {
    const b = document.createElement('div'); b.className = 'btnt'; b.id = 'tb_' + id;
    b.style.cssText = `width:${size}px;height:${size}px;right:calc(${right}px + env(safe-area-inset-right));bottom:calc(${bottom}px + env(safe-area-inset-bottom))`;
    b.innerHTML = ICONS[id] + `<span>${label}</span>`;
    const down = (e) => { e.preventDefault(); e.stopPropagation(); AU.init(); touch.btn[id] = true; touch.edge[id] = true; b.classList.add('on'); };
    const up = (e) => { e.preventDefault(); touch.btn[id] = false; b.classList.remove('on'); };
    b.addEventListener('touchstart', down, { passive: false }); b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
    b.addEventListener('mousedown', down); b.addEventListener('mouseup', up); b.addEventListener('mouseleave', up);
    L.appendChild(b);
  }
}
function readInput(dt) {
  const inp = { mx: 0, my: 0, cx: 0, cy: 0, attack: false, heavy: false, roll: false, heal: false, lock: false, interact: false, block: false, sprint: false, pause: false };
  // keyboard
  inp.mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  inp.my = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  if (inp.mx && inp.my) { inp.mx *= 0.7071; inp.my *= 0.7071; }
  inp.block = mouseR || !!keys.KeyQ; inp.sprint = !!(keys.ShiftLeft || keys.ShiftRight);
  const sens = 0.0009 + GM.settings.sens * 0.0004;
  inp.cx = mdx * sens; inp.cy = mdy * sens; mdx = mdy = 0;
  for (const k of ['attack', 'heavy', 'roll', 'heal', 'lock', 'interact', 'pause']) if (edge[k]) inp[k] = true;
  for (const k in edge) edge[k] = false;
  // touch
  if (touch.mx || touch.my) { inp.mx = touch.mx; inp.my = touch.my; }
  inp.cx += touch.dx * sens * 1.7; inp.cy += touch.dy * sens * 1.7; touch.dx = touch.dy = 0;
  for (const k in touch.edge) { if (touch.edge[k]) inp[k] = true; touch.edge[k] = false; }
  if (touch.btn.block) inp.block = true;
  // gamepad
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; const p = pads && Array.from(pads).find((x) => x && x.connected);
  if (p) {
    const dz = (v) => Math.abs(v) < 0.15 ? 0 : v;
    const lx = dz(p.axes[0] || 0), ly = dz(p.axes[1] || 0), rx = dz(p.axes[2] || 0), ry = dz(p.axes[3] || 0);
    if (lx || ly) { inp.mx = lx; inp.my = -ly; }
    inp.cx += rx * dt * 2.6 * (0.5 + GM.settings.sens * 0.1); inp.cy += ry * dt * 1.8 * (0.5 + GM.settings.sens * 0.1);
    const b = (i) => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5);
    const map = { 5: 'attack', 7: 'heavy', 1: 'roll', 2: 'heal', 11: 'lock', 0: 'interact', 9: 'pause' };
    for (const i in map) { const now = b(+i); if (now && !padPrev[i]) inp[map[i]] = true; padPrev[i] = now; }
    if (b(4)) inp.block = true; if (b(10)) inp.sprint = true;
    const skipNow = b(0) || b(9); if (skipNow && !GM._padSkip) { if (GM.state === 'crawl') endCrawl(); else if (GM.state === 'birth') GM.birth.advance(); } GM._padSkip = skipNow;
  }
  if (GM.settings.inv) inp.cy = -inp.cy;
  return inp;
}

/* ---------------- UI ---------------- */
function show(id) { for (const s of ['title', 'pause', 'rest', 'level', 'settings', 'controls', 'crawl', 'codex', 'chapters', 'complete', 'saves']) $(s).classList.toggle('hidden', s !== id); }
let menuReturn = null;
function setupUI() {
  $('bContinue').onclick = () => { AU.init(); AU.ui(); const sl = readSlots(); let bi = -1; sl.forEach((x, i) => { if (x && (bi < 0 || x.when > sl[bi].when)) bi = i; }); if (bi >= 0) loadSlot(bi); };
  $('bLoad').onclick = () => { AU.init(); AU.ui(); openSaves('load', 'title'); };
  $('pSave').onclick = () => { AU.ui(); openSaves('save', 'pause'); };
  $('pLoad').onclick = () => { AU.ui(); openSaves('load', 'pause'); };
  $('rSave').onclick = () => { AU.ui(); openSaves('save', 'rest'); };
  $('svBack').onclick = () => { AU.ui(); show(savesReturn); };
  $('pNext').onclick = () => { AU.ui(); GM.advance(); }; $('rNext').onclick = () => { AU.ui(); GM.advance(); };
  $('cineSkip').onclick = () => { GM.cine.skip(); };
  $('bNew').onclick = () => { AU.init(); AU.ui(); GM.save = JSON.parse(JSON.stringify(NEW_SAVE)); startChapter(1); };
  $('birth').onclick = (e) => { if (e.target.id === 'birthSkip') GM.birth.skip(); else GM.birth.advance(); };
  $('bChapters').onclick = () => { AU.init(); AU.ui(); openChapters('title'); };
  $('chBack').onclick = () => { AU.ui(); show(chapterReturn); };
  $('cmpContinue').onclick = () => { AU.ui(); show(null); GM.state = 'play'; hudVisible(true); lockPointer(); };
  $('cmpChapters').onclick = () => { AU.ui(); openChapters('complete'); };
  $('cmpTitle').onclick = () => { AU.ui(); GM.save = JSON.parse(JSON.stringify(NEW_SAVE)); respawnAll(); showTitle(); };
  $('cmpSave').onclick = () => { AU.ui(); openSaves('save', 'complete'); };
  $('bSettings').onclick = () => { menuReturn = 'title'; openSettings(); };
  $('bControls').onclick = () => { menuReturn = 'title'; show('controls'); };
  $('bCodex').onclick = () => { AU.init(); AU.ui(); GM.codex.open('title'); };
  $('pCodex').onclick = () => { AU.ui(); GM.codex.open('pause'); };
  $('pResume').onclick = () => closePause();
  $('pSettings').onclick = () => { menuReturn = 'pause'; openSettings(); };
  $('pControls').onclick = () => { menuReturn = 'pause'; show('controls'); };
  $('pQuit').onclick = () => {
    const b = $('pQuit'); if (!b.dataset.confirm) { b.dataset.confirm = 1; b.textContent = 'QUIT? UNSAVED PROGRESS IS LOST'; setTimeout(() => { delete b.dataset.confirm; b.textContent = 'QUIT TO TITLE'; }, 3500); return; }
    delete b.dataset.confirm; b.textContent = 'QUIT TO TITLE'; GM.save = JSON.parse(JSON.stringify(NEW_SAVE)); respawnAll(); showTitle(); };
  $('cBack').onclick = () => show(menuReturn);
  $('sBack').onclick = () => { store(SET_KEY, GM.settings); show(menuReturn); };
  $('sQual').onclick = () => { const o = ['auto', 'low', 'medium', 'high']; GM.settings.quality = o[(o.indexOf(GM.settings.quality) + 1) % o.length]; refreshSettings(); };
  $('sInv').onclick = () => { GM.settings.inv = !GM.settings.inv; refreshSettings(); };
  $('sTouch').onclick = () => { const o = ['auto', 'on', 'off']; GM.settings.touch = o[(o.indexOf(GM.settings.touch) + 1) % o.length]; refreshSettings(); };
  document.querySelectorAll('[data-sens]').forEach((b) => b.onclick = () => { GM.settings.sens = OE.clamp(GM.settings.sens + +b.dataset.sens, 1, 10); refreshSettings(); });
  document.querySelectorAll('[data-vol]').forEach((b) => b.onclick = () => { GM.settings.vol = OE.clamp(GM.settings.vol + +b.dataset.vol, 0, 10); AU.setVolume(GM.settings.vol / 10); refreshSettings(); });
  $('rLevel').onclick = () => { openLevel(); };
  $('rLeave').onclick = () => { show(null); GM.state = 'play'; GM.player.setState('move', 'Idle'); hudVisible(true); };
  $('lvBack').onclick = () => show('rest');
  document.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => levelUp(b.dataset.up));
  $('pauseBtn').onclick = (e) => { e.stopPropagation(); openPause(); };
  $('pauseBtn').addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
  $('rotOk').onclick = () => { $('rotate').classList.add('hidden'); GM.rotDismissed = true; };
  AU.setVolume(GM.settings.vol / 10);
  addEventListener('resize', () => { OE.resize(); checkRotate(); });
  checkRotate();
}
function checkRotate() { const portrait = innerHeight > innerWidth; $('rotate').classList.toggle('hidden', !(isTouch && portrait && !GM.rotDismissed && GM.state !== 'loading')); }
function refreshSettings() {
  $('sQual').textContent = GM.settings.quality.toUpperCase() + (GM.settings.quality === 'auto' ? ` (${qName()})` : '');
  $('sSens').textContent = GM.settings.sens; $('sInv').textContent = GM.settings.inv ? 'ON' : 'OFF'; $('sVol').textContent = GM.settings.vol;
  $('sTouch').textContent = GM.settings.touch.toUpperCase(); $('touch').classList.toggle('hidden', !(touchOn() && GM.state === 'play'));
}
function openSettings() { refreshSettings(); show('settings'); }
function showTitle() {
  GM.state = 'title'; show('title'); hudVisible(false);
  const sl = readSlots(); const latest = sl.filter(Boolean).sort((a, b) => b.when - a.when)[0];
  $('bContinue').style.display = latest ? '' : 'none'; $('bLoad').style.display = latest ? '' : 'none';
  if (latest) $('bContinue').textContent = 'CONTINUE — CHAPTER ' + chapterDef(latest.save.chapter).numeral;
  checkRotate();
}
function hudVisible(v) { $('hud').classList.toggle('hidden', !v); $('touch').classList.toggle('hidden', !(v && touchOn())); document.body.classList.toggle('touchmode', touchOn()); }
function startPlay() {
  clearTimeout(crawlTimer); clearTimeout(GM._crawlFade);
  show(null); GM.state = 'play'; hudVisible(true);
  if (isTouch) { try { const de = document.documentElement; if (de.requestFullscreen && !document.fullscreenElement) de.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { })).catch(() => { }); } catch (e) { } }
  else { lockPointer(); }
  const ik = introKey(LV.id);
  if (!GM.save.seen[ik]) { GM.save.seen[ik] = 1; GM.persist(); LV.def.intro(); }
}
function openPause() { if (GM.state !== 'play') return; GM.state = 'pause'; refreshAdvance(); const pc = chapterDef(GM.save.chapter), pp = pc.parts && pc.parts[(GM.save.part || 1) - 1]; $('pChapter').textContent = `CHAPTER ${pc.numeral} · ${pp ? 'PART ' + pp.numeral + ' · ' + pp.title.toUpperCase() : pc.title.toUpperCase()}`; $('prompt').classList.add('hidden'); show('pause'); hudVisible(false); if (document.pointerLockElement) document.exitPointerLock(); }
function closePause() { show(null); GM.state = 'play'; hudVisible(true); lockPointer(); }

/* ---------------- prologue crawl ---------------- */
const chapterDef = (n) => CHAPTERS.find((c) => c.id === n) || CHAPTERS[0];
let crawlTimer = null, crawlIdx = -1;

/* ---------------- manual save / load ---------------- */
let savesReturn = 'title', savesMode = 'load';
function locationName(z) { return z < 14 ? 'Crash Site' : z < 72 ? 'The Burning Street' : z < 104 ? 'Overpass Ruins' : z < 123 ? 'Cathedral Approach' : 'Cathedral Plaza'; }
function snapshot() {
  const P = GM.player, C = GM.companion;
  return { when: Date.now(), loc: locationName(P.pos[2]), save: JSON.parse(JSON.stringify(GM.save)),
    world: { p: { pos: P.pos.slice(), yaw: P.yaw, hp: P.hp, stims: P.stims }, t: { pos: C.pos.slice() },
      dead: GM.enemies.map((e, i) => (!e.alive && !e.boss ? i : -1)).filter((i) => i >= 0) } };
}
function saveToSlot(i) {
  if (GM.inBoss) { $('svMsg').textContent = 'You cannot save during a boss fight.'; return; }
  if (!GM.player.alive) { $('svMsg').textContent = 'You cannot save right now.'; return; }
  const sl = readSlots(); sl[i] = snapshot();
  if (writeSlots(sl)) { $('svMsg').textContent = 'Game saved to slot ' + (i + 1) + '.'; AU.heal(); } else $('svMsg').textContent = 'Could not save: browser storage is unavailable.';
  renderSlots();
}
function loadSlot(i) {
  const d = readSlots()[i]; if (!d) return;
  GM.save = Object.assign(JSON.parse(JSON.stringify(NEW_SAVE)), JSON.parse(JSON.stringify(d.save)));
  GM.chapterEndT = 0; GM.loadLevel(levelId(GM.save)); respawnAll();
  if (d.world) {
    const P = GM.player, w = d.world; P.pos = w.p.pos.slice(); P.yaw = w.p.yaw; P.hp = Math.min(P.maxHp, w.p.hp); P.stims = w.p.stims;
    GM.companion.pos = w.t.pos.slice(); GM.cam.yaw = P.yaw;
    for (const idx of w.dead) { const e = GM.enemies[idx]; if (e && !e.boss) { e.alive = false; e.state = 'dead'; e.deadT = 99; e.root.visible = false; } }
  }
  P_sync();
  GM.save.seen.intro = 1; startPlay(); GM.hud.toast('GAME LOADED');
}
function P_sync() { GM.player.syncNode(); GM.companion.sync(); }
function renderSlots() {
  const sl = readSlots();
  $('slotList').innerHTML = sl.map((d, i) => {
    let info = '<div class="sum">Empty</div>';
    if (d) { const c = chapterDef(d.save.chapter); const dt = new Date(d.when);
      info = `<div class="ttl">Chapter ${c.numeral} — ${c.title}</div><div class="meta">${d.loc} · Rank ${d.save.rank} · ${fmtTime((d.save.stats && d.save.stats.time) || 0)} played</div>
        <div class="sum">${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`; }
    const btns = savesMode === 'save' ? `<button class="btn" data-sv="save" data-i="${i}">${d ? 'OVERWRITE' : 'SAVE HERE'}</button>`
      : `<button class="btn" data-sv="load" data-i="${i}" ${d ? '' : 'disabled'}>LOAD</button>`;
    return `<div class="chap ${d ? '' : 'locked'}"><div class="num">SLOT ${i + 1}</div>${info}<div class="bt">${btns}${d ? `<button class="btn" data-sv="del" data-i="${i}">DELETE</button>` : ''}</div></div>`;
  }).join('');
  $('slotList').querySelectorAll('[data-sv]').forEach((b) => b.onclick = () => {
    const i = +b.dataset.i, act = b.dataset.sv;
    if ((act === 'del' || (act === 'save' && readSlots()[i]) || (act === 'load' && savesReturn !== 'title')) && !b.dataset.confirm) {
      b.dataset.confirm = 1; b.textContent = act === 'del' ? 'CONFIRM DELETE' : act === 'save' ? 'CONFIRM OVERWRITE' : 'LOAD? UNSAVED PROGRESS IS LOST'; return; }
    AU.ui();
    if (act === 'save') saveToSlot(i);
    else if (act === 'load') loadSlot(i);
    else { const sl = readSlots(); sl[i] = null; writeSlots(sl); $('svMsg').textContent = 'Slot ' + (i + 1) + ' deleted.'; renderSlots(); }
  });
}
function openSaves(mode, ret) {
  savesMode = mode; savesReturn = ret; $('svTitle').textContent = mode === 'save' ? 'SAVE GAME' : 'LOAD GAME';
  $('svMsg').textContent = mode === 'save' && GM.inBoss ? 'You cannot save during a boss fight.' : ''; renderSlots(); show('saves');
}

/* ---------------- chapters ---------------- */
let chapterReturn = 'title';
const fmtTime = (t) => { t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s2 = t % 60; return (h ? h + 'h ' : '') + m + 'm ' + String(s2).padStart(2, '0') + 's'; };
function startChapter(n, opts = {}) {
  // replaying keeps Orion's rank and stats, but the mission itself starts over
  const S0 = GM.save;
  // alignment carries from chapter to chapter; replaying a chapter rewinds it to how it stood when that chapter began
  const alignAt = clone(S0.alignAt || {}); const align = clone(alignAt[n] || S0.align || { o: 0, t: 0 }); alignAt[n] = clone(align);
  for (const k in alignAt) if (+k > n) delete alignAt[k]; // later chapters will follow from this run instead
  const choices = {}; for (let i = 1; i < n; i++) { const c = GM.align.forChapter(i); if (c && S0.choices && S0.choices[c.id]) choices[c.id] = S0.choices[c.id]; }
  const seen = clone(S0.seen || {});
  for (const id of Object.keys(LEVELS)) if (String(id)[0] === String(n)) { delete seen[introKey(isNaN(id) ? id : +id)]; delete seen['talk_' + LEVELS[id].boss.seen]; }
  const keep = { vig: S0.vig, end: S0.end, str: S0.str, rank: S0.rank, maxStims: S0.maxStims, done: S0.done || {}, align, alignAt, choices, seen, eye: !!S0.eye, reached: S0.reached || {}, talina: S0.talina };
  GM.save = Object.assign(clone(NEW_SAVE), keep, { started: true, chapter: n, part: opts.part || 1 });
  GM.save.stats = { time: 0, deaths: 0, kills: 0 };
  if (opts.part === 2) { GM.save.eyeLost = true; GM.save.eye = true; }
  GM.chapterEndT = 0; GM.loadLevel(levelId(GM.save)); respawnAll();
  if (opts.part === 2) { startCrawl(2); return; }
  const ch = chapterDef(n);
  if (ch.opening) { GM.state = 'birth'; show(null); hudVisible(false); AU.musicDuck(0.1); GM.birth.start(ch.opening, startCrawl); } else startCrawl();
}
/* progression: a chapter opens once the one before it has been completed (in this game or any saved one) */
/* a save counts as having finished its chapter once the final boss of the chapter is down (even if it was saved before the Complete screen) */
const finishedIn = (S) => !!(S && S.started && S.bossDead && (() => { const c = chapterDef(S.chapter); return !c.parts || (S.part || 1) === c.parts.length; })());
GM.completed = function () {
  const d = Object.assign({}, GM.save.done || {}); if (finishedIn(GM.save)) d[GM.save.chapter] = d[GM.save.chapter] || {};
  for (const sl of readSlots()) if (sl && sl.save) { if (sl.save.done) Object.assign(d, sl.save.done); if (finishedIn(sl.save)) d[sl.save.chapter] = d[sl.save.chapter] || {}; }
  return d;
};
/* from a save where this chapter's boss is already beaten: on to the next chapter */
const nextChapter = () => { const c = chapterDef(GM.save.chapter); const n = CHAPTERS.find((x) => x.id === c.id + 1); return n && n.available ? n : null; };
GM.canAdvance = () => finishedIn(GM.save) && !!nextChapter();
GM.advance = function () {
  const S = GM.save, n = nextChapter(); if (!n || !finishedIn(S)) return;
  show(null);
  if (!(S.done && S.done[S.chapter])) GM.align.open(LV.def.choice, chapterComplete); // never reached the Complete screen: make the choice / record it first
  else startChapter(n.id);
};
const refreshAdvance = () => { const n = nextChapter(), ok = GM.canAdvance(); for (const id of ['pNext', 'rNext']) { const b = $(id); b.style.display = ok ? '' : 'none'; if (n) b.textContent = `CHAPTER ${n.numeral}: ${n.title.toUpperCase()}`; } };
GM.unlocked = (id) => id <= 1 || !!GM.completed()[id - 1];
const COVERS = { 1: 'assets/chapters/ch1.jpg', 2: 'assets/chapters/ch2.jpg' };
function openChapters(ret) {
  chapterReturn = ret; const S = GM.save;
  $('chList').innerHTML = CHAPTERS.map((c) => {
    const done = S.done && S.done[c.id]; const inProg = S.started && S.chapter === c.id && !S.bossDead;
    const here = S.started && S.chapter === c.id; const open = c.available && (GM.unlocked(c.id) || here);
    const prev = CHAPTERS.find((x) => x.id === c.id - 1);
    let status = !c.available ? 'COMING LATER' : !open ? `LOCKED · COMPLETE CHAPTER ${prev.numeral} TO UNLOCK` : done ? `COMPLETED · ${fmtTime(done.time)} · ${done.deaths} deaths` : inProg ? 'IN PROGRESS' : 'NOT STARTED';
    let btns = '';
    const cover = COVERS[c.id] && c.available ? `<div class="cov${open ? '' : ' lk'}" style="background-image:url('${COVERS[c.id]}')">${open ? '' : '<span>LOCKED</span>'}</div>` : `<div class="cov soon"><span>CLASSIFIED<small>COMING LATER</small></span></div>`;
    if (open) {
      if (S.started && S.chapter === c.id) btns += `<button class="btn" data-ch="cont" data-id="${c.id}">CONTINUE</button>`;
      btns += `<button class="btn" data-ch="start" data-id="${c.id}">${done || (S.started && S.chapter === c.id) ? 'REPLAY CHAPTER' : 'START CHAPTER'}</button>`;
      if (c.parts && S.reached && S.reached[c.id + 'b']) btns += `<button class="btn" data-ch="part2" data-id="${c.id}">PART II: ${c.parts[1].title.toUpperCase()}</button>`;
    }
    return `<div class="chap ${open ? '' : 'locked'}">${cover}<div class="num">CHAPTER ${c.numeral}</div><div class="ttl">${c.title}</div>
      ${c.place ? `<div class="meta">${c.place} · ${c.date}</div>` : ''}<div class="sum">${c.summary}</div>
      ${(() => { const ch = GM.align.forChapter(c.id); if (!ch) return ''; const made = S.choices && S.choices[ch.id]; return `<div class="meta">Dialogue choice: <b style="color:#efe4cc">${ch.title}</b>${made ? ` — <span style="color:${GM.align.TIERS[made].css}">${GM.align.label('o', made)}</span>` : ''}</div>`; })()}<div class="st ${done ? 'done' : ''}">${status}</div><div class="bt">${btns}</div></div>`;
  }).join('');
  $('chList').querySelectorAll('[data-ch]').forEach((b) => b.onclick = () => {
    AU.init(); AU.ui(); const id = +b.dataset.id;
    if (b.dataset.ch === 'cont') { if (GM.state === 'complete') { show(null); GM.state = 'play'; hudVisible(true); lockPointer(); } else startPlay(); }
    else if (b.dataset.ch === 'part2') startChapter(id, { part: 2 });
    else startChapter(id);
  });
  show('chapters');
}
function chapterComplete() {
  const S = GM.save; const c = chapterDef(S.chapter);
  S.done = S.done || {}; S.done[c.id] = { time: S.stats.time, deaths: S.stats.deaths, kills: S.stats.kills, rank: S.rank }; GM.persist();
  GM.state = 'complete'; hudVisible(false); if (document.pointerLockElement) document.exitPointerLock();
  $('cmpNum').textContent = `CHAPTER ${c.numeral} COMPLETE`; $('cmpTitle2').textContent = c.title;
  $('cmpStats').innerHTML = [['Time', fmtTime(S.stats.time)], ['War machines destroyed', S.stats.kills], ['Times killed in action', S.stats.deaths], ['Rank', S.rank],
    ['Orion', GM.align.chip('', 'o')], ['Thomas', GM.align.chip('', 't')]]
    .map(([k, v]) => `<div class="row"><span>${k}</span><span class="v">${v}</span></div>`).join('') +
    `<div class="small" style="margin-top:10px;font-style:italic;text-align:center">${LV.def.endings[GM.align.tier(LV.def.endingBy || 'o')]}</div>`;
  S.done[c.id].align = GM.align.tier('o');
  S.alignAt = S.alignAt || {}; S.alignAt[c.id + 1] = clone(S.align); // the next chapter starts from how this one ended
  const next = CHAPTERS.find((x) => x.id === c.id + 1);
  $('cmpNext').textContent = next ? (next.available ? `Chapter ${next.numeral} — ${next.title} is now unlocked.` : `Chapter ${next.numeral}: ${next.summary} (Coming later.)`) : '';
  const nb = $('cmpNextCh'); nb.style.display = next && next.available ? '' : 'none'; if (next) nb.textContent = `CHAPTER ${next.numeral}: ${next.title.toUpperCase()}`;
  nb.onclick = () => { AU.ui(); startChapter(next.id); };
  $('banner').style.opacity = 0; show('complete'); AU.beacon();
}
/* Part I ends (Talina has taken Orion's eye): Thomas carries on alone on the beach */
GM.toPart2 = function () {
  const S = GM.save; S.part = 2; S.eyeLost = true; S.eye = true; S.bossDead = false; S.lit = [true, false]; S.beacon = 0; S.echo = null;
  S.reached = S.reached || {}; S.reached['2b'] = 1; GM.chapterEndT = 0; GM.inBoss = false;
  GM.loadLevel(levelId(S)); respawnAll(); hudVisible(false); startCrawl(2);
};
function startCrawl(part) {
  GM.state = 'crawl'; show('crawl'); const box = $('crawlTxt');
  const ch = chapterDef(GM.save.chapter); const pt = ch.parts ? ch.parts[(part || GM.save.part || 1) - 1] : null;
  GM.crawlPart = pt;
  const head = pt ? `<p class="first"><small>CHAPTER ${ch.numeral} · PART ${pt.numeral}</small>${pt.title}</p>` : `<p class="first"><small>CHAPTER ${ch.numeral}</small>${ch.title}</p>`;
  const lines = (pt && pt.prologue) || ch.prologue;
  const vo = (pt && pt.vo) || [];
  box.innerHTML = (pt && pt.numeral === 'I' ? `<p class="first"><small>CHAPTER ${ch.numeral}</small>${ch.title}</p>` : '') + head + lines.map((t, i) => `<p${vo[i] ? ` data-vo="${vo[i]}"` : ''}>${t}</p>`).join('');
  crawlIdx = -1; $('crawl').onclick = endCrawl; AU.musicDuck(0.4); nextCrawl();
}
function nextCrawl() {
  const ps = $('crawlTxt').querySelectorAll('p'); clearTimeout(crawlTimer); clearTimeout(GM._crawlFade);
  ps.forEach((p) => p.style.opacity = 0);
  crawlIdx++;
  if (crawlIdx >= ps.length) { AU.musicDuck(0.28); startPlay(); const ch = chapterDef(GM.save.chapter), pt = GM.crawlPart;
    if (pt) banner(pt.title.toUpperCase(), `CHAPTER ${ch.numeral} · PART ${pt.numeral} · ${pt.place.toUpperCase()}`, 'gold', 4.5);
    else banner(ch.title.toUpperCase(), `CHAPTER ${ch.numeral} · ${ch.place.toUpperCase()}, ${ch.date.toUpperCase()}`, 'gold', 4.5); return; }
  const p = ps[crawlIdx]; GM._crawlFade = setTimeout(() => { if (GM.state === 'crawl') p.style.opacity = 1; }, crawlIdx ? 700 : 200);
  let ms = 1800 + p.textContent.length * 55;
  const vn = +p.dataset.vo; if (GM.vo(vn)) { playVoice(GM.vo(vn)); ms = Math.max(ms, (window.DOVER_VO[vn] + 1.1) * 1000); } // narrated line
  crawlTimer = setTimeout(nextCrawl, ms);
}
function endCrawl() { if (GM.state === 'crawl') nextCrawl(); }

/* ---------------- HUD helpers ---------------- */
let subQ = [], subT = 0, toastT = 0, bannerT = 0;
const NAMES = { thomas: 'Thomas', orion: 'Orion', radio: 'British Command', warden: 'Iron Warden', tide: 'Tidebreaker', talina: 'Talina', pilot: 'Pact Pilot' };
/* Each level's boss speaks its own language (Mandarin for the Iron Warden, Russian for the Tidebreaker) with English subtitles.
   Lines with a recording play the mp3; the rest use the browser's text-to-speech. */
const BV = () => LV.def.voice;
let ttsVoices = {}, tauntT = 0, tauntBag = [];
function nextTaunt() { // shuffle bag: every taunt is heard once before any repeats
  const TT = BV().lines.taunts;
  if (!tauntBag.length) { tauntBag = TT.slice(1).sort(() => Math.random() - 0.5); tauntBag.unshift(TT[0]); if (GM._tauntsStarted) tauntBag = TT.slice().sort(() => Math.random() - 0.5); GM._tauntsStarted = true; }
  return tauntBag.shift();
}
function pickVoices() {
  try { const vs = speechSynthesis.getVoices(); for (const lang of ['zh-CN', 'ru-RU']) { const b = lang.slice(0, 2); ttsVoices[lang] = vs.find((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) || vs.find((v) => v.lang.toLowerCase().startsWith(b)) || null; } } catch (e) { }
}
if (window.speechSynthesis) { pickVoices(); speechSynthesis.onvoiceschanged = pickVoices; }
function speakZh(text, lang = 'zh-CN') {
  if (!window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text); u.lang = lang; if (ttsVoices[lang]) u.voice = ttsVoices[lang];
    u.pitch = 0.25; u.rate = 0.78; u.volume = Math.min(1, GM.settings.vol / 10 + 0.1);
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { }
}
GM.warden = (key, story = true) => {
  const V = BV(); let line = V.lines[key]; if (!line) return;
  if (!story && (subQ.length || subT > 0.3)) return; // taunts never interrupt dialogue
  if (key === 'taunts') line = nextTaunt();
  if (story && ['intro', 'phase2', 'death', 'kill'].includes(key)) { subQ.length = 0; subT = 0; try { if (voiceEl) voiceEl.pause(); } catch (e) { } } // boss moments cut in
  const [zh, en, file, secs] = line;
  if (V.vo) { // numbered Chapter II line: its recording if there is one, else text-to-speech (if any)
    const f = GM.vo(file), base = Math.max(3.2, en.length * 0.06 + 1.4, zh ? zh.length * (V.lang === 'zh-CN' ? 0.34 : 0.075) + 1.2 : 0);
    GM.say(V.who, en, GM.voDur(file, base), { zh: f ? null : zh, lang: V.lang, file: f || null }); return;
  }
  const dur = file && V.file ? Math.max(2.6, secs + 1.0) : Math.max(3.2, en.length * 0.06 + 1.4, zh ? zh.length * (V.lang === 'zh-CN' ? 0.34 : 0.075) + 1.2 : 0);
  GM.say(V.who, en, dur, { zh, lang: V.lang, file: file && V.file ? V.file(file) : null });
};
GM.wardenTaunt = () => { if (time - tauntT < 11 || Math.random() > 0.35) return; tauntT = time; GM.warden('taunts', false); };
GM.say = (who, text, dur = 4, voice = 0) => { subQ.push({ who, text, dur, voice }); };
GM.clearSubs = () => { subQ.length = 0; subT = 0; };
let voiceEl = null;
function playVoice(n) {
  try {
    if (voiceEl) { voiceEl.pause(); }
    voiceEl = new Audio(typeof n === 'string' ? n : 'voice/' + String(n).padStart(2, '0') + '.mp3');
    voiceEl.volume = Math.min(1, GM.settings.vol / 10 + 0.15);
    AU.musicDuck(0.12); voiceEl.onended = () => AU.musicDuck(GM.inBoss ? 0.4 : 0.28);
    const p = voiceEl.play(); if (p && p.catch) p.catch(() => { });
  } catch (e) { }
}
GM.hud = { toast(t) { $('toast').textContent = t; $('toast').style.opacity = 1; toastT = 2.2; } };
function banner(t, s, cls, dur = 4) { const b = $('banner'); $('bannerT').textContent = t; $('bannerS').textContent = s || ''; b.className = cls; b.style.opacity = 1; bannerT = dur; }
function updateHud(dt) {
  const P = GM.player;
  const hpw = Math.min(100, 30 + P.maxHp / 420 * 32); $('hpb').style.width = hpw + '%'; $('stb').style.width = Math.min(90, 24 + P.maxStam / 100 * 30) + '%';
  $('hpb').querySelector('i').style.transform = `scaleX(${Math.max(0, P.hp / P.maxHp)})`; $('hpb').querySelector('b').style.transform = `scaleX(${Math.max(0, P.hp / P.maxHp)})`;
  $('stb').querySelector('i').style.transform = `scaleX(${Math.max(0, P.stam / P.maxStam)})`;
  const st = $('stims'); const key = P.stims + '/' + GM.save.maxStims;
  if (st.dataset.k !== key) { st.dataset.k = key; st.innerHTML = Array.from({ length: GM.save.maxStims }, (_, i) => `<div class="vial ${i < P.stims ? '' : 'empty'}"></div>`).join('') + `<span>STIM ×${P.stims}</span>`; }
  $('scrapv').textContent = GM.save.scrap; GM.align.hud();
  if (GM.inBoss && boss) { $('bossbar').querySelector('i').style.transform = `scaleX(${Math.max(0, boss.hp / boss.maxHp)})`; $('bossbar').querySelector('b').style.transform = `scaleX(${Math.max(0, boss.hp / boss.maxHp)})`; }
  // subtitles
  subT -= dt; const sub = $('sub');
  if (subT <= 0) { if (subQ.length) { const s = subQ.shift(); sub.innerHTML = `<b>${NAMES[s.who] || s.who}:</b> ${s.text}`; /* English subtitles only */ sub.style.opacity = 1; subT = s.dur; if (s.voice && s.voice.file) playVoice(s.voice.file); else if (s.voice && s.voice.zh) speakZh(s.voice.zh, s.voice.lang); else if (s.voice && typeof s.voice !== 'object') playVoice(s.voice); } else sub.style.opacity = 0; }
  toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0;
  bannerT -= dt; if (bannerT <= 0) $('banner').style.opacity = 0;
  // lock-on marker & enemy health bars
  const lo = $('lockon');
  if (GM.lock && GM.lock.alive) { const s = project([GM.lock.pos[0], GM.lock.hitY(), GM.lock.pos[2]]); if (s) { lo.classList.remove('hidden'); lo.style.left = s[0] + 'px'; lo.style.top = s[1] + 'px'; } else lo.classList.add('hidden'); }
  else lo.classList.add('hidden');
  const box = $('ehps'); let html = '';
  for (const e of GM.enemies) {
    if (e.boss || !e.alive || e.showBar <= 0) continue;
    const s = project([e.pos[0], e.hover ? e.pos[1] + 0.7 : 2.35 * e.T.s, e.pos[2]]); if (!s) continue;
    html += `<div class="ehp" style="left:${s[0]}px;top:${s[1]}px"><i style="transform:scaleX(${Math.max(0, e.hp / e.maxHp)})"></i></div>`;
  }
  box.innerHTML = html;
}
function project(p) {
  const m = OE.R.vp; const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
  if (w <= 0.1) return null; const cw = $('c').clientWidth, ch = $('c').clientHeight;
  return [(x / w * 0.5 + 0.5) * cw, (1 - (y / w * 0.5 + 0.5)) * ch];
}

/* ---------------- effects ---------------- */
const flashPool = [];
function flashLight(pos, color, intensity, range, dur) {
  let L = flashPool.find((f) => f.t <= 0);
  if (!L) { if (flashPool.length >= 4) L = flashPool[0]; else { L = { light: { pos: [0, 0, 0], color: [1, 1, 1], intensity: 0, range: 1 }, t: 0 }; flashPool.push(L); OE.R.lights.push(L.light); } }
  L.light.pos = pos.slice(); L.light.color = color; L.light.range = range; L.peak = intensity; L.t = dur; L.dur = dur;
}
GM.fx = {
  sparks(p, dir, n, col) {
    for (let i = 0; i < n; i++) {
      const v = [dir[0] * R(1, 5) + R(-3, 3), R(0.5, 4.5) + dir[1] * 3, dir[2] * R(1, 5) + R(-3, 3)];
      GM.parts.emit({ pos: p.slice(), vel: v, grav: 9, life: R(0.2, 0.55), size: R(0.012, 0.03), stretch: 0.06, col: [col[0], col[1], col[2], 1], soft: 0.3, drag: 1.5, floor: 0.02 });
    }
    flashLight(p, [1, 0.7, 0.4], 2.5, 4, 0.12);
  },
  blood(p) {
    for (let i = 0; i < 14; i++) GM.parts.emit({ pos: p.slice(), vel: [R(-2, 2), R(0.5, 3), R(-2, 2)], grav: 9, life: R(0.3, 0.7), size: R(0.02, 0.05), col: [0.25, 0.01, 0.005, 0.9], add: false, soft: 0.4, floor: 0.02 });
  },
  dust(p, n) {
    for (let i = 0; i < n; i++) GM.parts.emit({ pos: [p[0] + R(-0.6, 0.6), p[1] + R(0, 0.3), p[2] + R(-0.6, 0.6)], vel: [R(-2.5, 2.5), R(0.3, 1.5), R(-2.5, 2.5)], drag: 1.8, life: R(1.2, 2.4), size: R(0.3, 0.6), grow: 0.8, col: [0.22, 0.19, 0.16, 0.5], add: false, soft: 0, rot: R(0, 6), spin: R(-1, 1) });
  },
  explode(p, s) {
    for (let i = 0; i < 26 * s; i++) GM.parts.emit({ pos: [p[0] + R(-0.3, 0.3) * s, p[1] + R(-0.3, 0.3) * s, p[2] + R(-0.3, 0.3) * s], vel: [R(-3, 3) * s, R(0, 4) * s, R(-3, 3) * s], drag: 3, life: R(0.3, 0.7), size: R(0.3, 0.6) * s, grow: 1.2 * s, col: [4, 1.6, 0.4, 1], soft: 0.0, rot: R(0, 6) });
    for (let i = 0; i < 14 * s; i++) GM.parts.emit({ pos: p.slice(), vel: [R(-2, 2) * s, R(1, 3) * s, R(-2, 2) * s], drag: 1.2, life: R(1.5, 3.5), size: R(0.4, 0.8) * s, grow: 0.9 * s, col: [0.08, 0.07, 0.065, 0.65], add: false, soft: 0, rot: R(0, 6), spin: R(-1, 1) });
    this.sparks(p, [0, 1, 0], 30 * s, [3, 1.8, 0.8]);
    flashLight(p, [1, 0.55, 0.2], 7 * s, 9 * s, 0.5);
    AU.explode(s > 2); GM.shake(0.25 * s);
  },
};
GM.addMarker = (pos, delay, radius, dmg) => GM.markers.push({ pos, t: delay, r: radius, dmg });
GM.addShockwave = (pos, maxR, dmg) => GM.shocks.push({ pos, r: 0.5, max: maxR, dmg, hit: new Set() });
function updateHazards(dt) {
  const P = GM.player, C = GM.companion;
  for (let i = GM.projectiles.length - 1; i >= 0; i--) {
    const p = GM.projectiles[i]; p.life -= dt;
    const np = [p.pos[0] + p.vel[0] * dt, p.pos[1] + p.vel[1] * dt, p.pos[2] + p.vel[2] * dt];
    GM.parts.emit({ pos: p.pos.slice(), vel: [p.vel[0] * 0.02, p.vel[1] * 0.02, p.vel[2] * 0.02], stretch: 0.25, size: 0.07, life: 0.12, col: [3.5, 0.5, 0.2, 1], soft: 0.2, fade: 0 });
    GM.parts.emit({ pos: p.pos.slice(), vel: [0, 0, 0], size: 0.22, life: 0.05, col: [2.5, 0.3, 0.1, 0.8], soft: 0, fade: 0 });
    let done = p.life <= 0 || np[1] < 0.05 || W.ray(p.pos, np, 0.5) < 1;
    for (const t of [P, C]) {
      if (done || !t.alive) continue;
      if (Math.hypot(np[0] - t.pos[0], np[1] - 1.2, np[2] - t.pos[2]) < p.r + 0.4) { if (t.damage(p.dmg, p.pos)) done = true; else if (t === P && P.iframe) { } }
    }
    p.pos = np;
    if (done) { GM.fx.sparks(p.pos, [0, 1, 0], 14, [3.5, 0.6, 0.2]); GM.projectiles.splice(i, 1); }
  }
  for (let i = GM.markers.length - 1; i >= 0; i--) {
    const m = GM.markers[i]; m.t -= dt;
    const n = 10; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + time * 2; GM.parts.emit({ pos: [m.pos[0] + Math.cos(a) * m.r, 0.08, m.pos[2] + Math.sin(a) * m.r], vel: [0, 0.2, 0], size: 0.09, life: 0.08, col: [3.5, 0.3, 0.1, 1], soft: 0.1, fade: 0 }); }
    if (m.t < 0.5 && rnd() < 0.5) GM.parts.emit({ pos: [m.pos[0], 6 - (0.5 - m.t) * 12, m.pos[2]], vel: [0, -12, 0], stretch: 0.8, size: 0.08, life: 0.06, col: [4, 1.5, 0.5, 1], soft: 0.2, fade: 0 });
    if (m.t <= 0) {
      GM.fx.explode([m.pos[0], 0.4, m.pos[2]], 1.3);
      for (const t of [P, C]) if (t.alive && Math.hypot(t.pos[0] - m.pos[0], t.pos[2] - m.pos[2]) < m.r) t.damage(m.dmg, m.pos, { unblockable: false, boss: true });
      GM.markers.splice(i, 1);
    }
  }
  for (let i = GM.shocks.length - 1; i >= 0; i--) {
    const s = GM.shocks[i]; s.r += dt * 9;
    const n = Math.floor(s.r * 3); for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2; GM.parts.emit({ pos: [s.pos[0] + Math.cos(a) * s.r, 0.15, s.pos[2] + Math.sin(a) * s.r], vel: [Math.cos(a) * 1.5, R(0.5, 1.5), Math.sin(a) * 1.5], size: R(0.2, 0.35), grow: 0.5, life: 0.5, col: [0.3, 0.24, 0.18, 0.45], add: false, soft: 0 }); }
    for (const t of [P, C]) { if (!t.alive || s.hit.has(t)) continue; const d = Math.hypot(t.pos[0] - s.pos[0], t.pos[2] - s.pos[2]); if (Math.abs(d - s.r) < 0.6) { s.hit.add(t); t.damage(s.dmg, s.pos, { unblockable: true, boss: true }); } }
    if (s.r > s.max) GM.shocks.splice(i, 1);
  }
  for (const f of flashPool) { if (f.t > 0) { f.t -= dt; f.light.intensity = f.peak * Math.max(0, f.t / f.dur); } else f.light.intensity = 0; }
}

/* ---------------- gameplay events ---------------- */
GM.alert = (e) => {
  const seen = GM.save.seen; const k = 'alert_' + e.type;
  if (seen[k] || e.boss) return; seen[k] = 1;
  const lines = { trooper: 'Contact! Pact Revenants — Russian-built. They hit hard but they\'re slow to recover. Punish the swing, like you taught me!', drone: 'Seeker drone — Chinese tech! Roll through the bolts, don\'t try to outrun them.',
    brute: 'Juggernaut! Don\'t trade blows with that thing, Commander. Dodge the slam, then hit it from behind.' };
  if (GM.solo) { // nobody to warn you: the hero talks it through alone (text only)
    const solo = GM.heroKey === 'thomas'
      ? { trooper: 'Revenants. Hit hard, slow to recover. Punish the swing — just like he taught me.', drone: 'Seeker drone. Don\'t outrun the bolts. Roll through them.', brute: 'Juggernaut. Don\'t trade blows. Dodge the slam, then hit it from behind.' }
      : { trooper: 'Revenants. Slow to recover — punish the swing.', drone: 'Seeker drone. Roll through the bolts, then close in.', brute: 'Juggernaut. Don\'t trade blows with it. Dodge the slam.' };
    const n = (GM.heroKey === 'thomas' ? { trooper: 55, drone: 56, brute: 57 } : { trooper: 12, drone: 13, brute: 14 })[e.type]; // numbered Chapter II lines
    GM.say(GM.heroKey === 'thomas' ? 'thomas' : 'orion', solo[e.type], GM.voDur(n, 5), GM.vo(n)); return;
  }
  GM.say('thomas', lines[e.type], { trooper: 8.3, drone: 5.7, brute: 6.9 }[e.type], { trooper: 4, drone: 5, brute: 6 }[e.type]);
};
GM.onEnemyKilled = (e) => {
  GM.save.scrap += e.T.scrap; GM.hud.toast('+' + e.T.scrap + ' SCRAP'); GM.save.stats.kills++;
  if (GM.lock === e) GM.lock = null;
  if (e.boss) victory();
};
GM.onBossPhase2 = () => { GM.warden('phase2'); LV.def.phase2(); AU.slam(); GM.shake(0.6); OE.R.flash = 0.8; };
GM.onPlayerDeath = () => {
  GM.state = 'dead'; AU.death(); hudVisible(false); GM.save.stats.deaths++; $('hud').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  const P = GM.player;
  if (GM.save.scrap > 0) GM.save.echo = { pos: [P.pos[0], 0, P.pos[2]], amount: GM.save.scrap }; else GM.save.echo = null;
  GM.save.scrap = 0; GM.persist();
  GM.deathT = 0; GM.deathBanner = false;
  if (GM.inBoss) { subQ.length = 0; subT = 0; GM.warden('kill'); }
};
function updateDeath(dt) {
  GM.deathT += dt;
  if (!GM.deathBanner && GM.deathT > 1.3) { GM.deathBanner = true; banner('K.I.A.', 'KILLED IN ACTION', 'red', 4); }
  if (GM.deathT > 5.8) { respawnAll(); GM.state = 'play'; hudVisible(true); OE.R.desat = 0; lockPointer(); }
}
function victory() {
  GM.save.bossDead = true; GM.persist(); AU.bossMusic(false); AU.victory();
  W.sealCol.off = true; W.gateCol.off = true; W.gate.node.visible = false;
  setTimeout(() => { $('bossbar').classList.add('hidden'); GM.inBoss = false; }, 2500);
  subQ.length = 0; subT = 0; GM.warden('death');
  const v = LV.def.victory();
  if (v.banner) setTimeout(() => banner(v.banner[0], v.banner[1], 'gold', 6), 1800);
  GM.chapterEndT = v.endIn;
}
function interactables() {
  const P = GM.player; let best = null;
  W.beacons.forEach((b, i) => { const d = Math.hypot(P.pos[0] - b.pos[0], P.pos[2] - b.pos[2]); if (d < 2.4) best = { type: 'beacon', b, i, label: b.lit ? 'Rest at beacon' : 'Light the beacon' }; });
  const gz = W.gate.zone;
  if (!GM.save.bossDead && !GM.inBoss && P.pos[0] > gz[0] && P.pos[0] < gz[1] && P.pos[2] > gz[2] && P.pos[2] < gz[3]) best = { type: 'gate', label: 'Pass through the fog' };
  if (!best) best = GM.align.nearby(P.pos);
  return best;
}
function doInteract(it) {
  const P = GM.player;
  if (it.type === 'choice') { $('prompt').classList.add('hidden'); GM.align.open(it.id); return; }
  if (it.type === 'beacon') {
    const first = !it.b.lit;
    GM.save.lit[it.i] = true; GM.save.beacon = it.i; setBeaconLit(it.b, true);
    AU.beacon(); P.hp = P.maxHp; P.stims = GM.save.maxStims; P.stam = P.maxStam;
    if (first) { banner('BEACON LIT', it.b.name.toUpperCase(), 'gold', 3.5); LV.def.beacon(it.i); }
    // rest: everything respawns
    for (const e of GM.enemies) if (!e.boss) e.reset();
    GM.companion.reset([P.pos[0] - 1.4, 0, P.pos[2] - 0.8]);
    GM.persist();
    $('prompt').classList.add('hidden'); $('tb_interact') && $('tb_interact').classList.add('hidden');
    GM.state = 'rest'; refreshAdvance(); P.setState('rest', 'Idle', 0.3); $('restName').textContent = it.b.name.toUpperCase(); show('rest'); hudVisible(false); $('hud').classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  } else if (it.type === 'gate') {
    AU.gate(); P.pos = [W.gate.enter[0], 0, W.gate.enter[1]]; P.yaw = 0; GM.cam.yaw = 0;
    GM.companion.pos = [W.gate.thomas[0], 0, W.gate.thomas[1]];
    W.sealCol.off = false; W.gate.sealed = true; GM.inBoss = true;
    boss.reset(); boss.active = true; boss.state = 'roar'; boss.t = 0;
    $('bossname').textContent = boss.T.name; $('bossbar').classList.remove('hidden'); AU.bossMusic(true);
    GM.warden('intro'); GM.wardenChildren = true; tauntT = time; tauntBag = []; GM._tauntsStarted = false;
    const bk = LV.def.boss.seen; GM.save.seen[bk] = 1; // unlocks the codex entry
    if (!GM.save.seen['talk_' + bk]) { GM.save.seen['talk_' + bk] = 1; LV.def.bossIntro(); }
  }
}
function openLevel() {
  const S = GM.save; const cost = 120 + S.rank * 80;
  $('lvRank').textContent = S.rank; $('lvScrap').textContent = S.scrap; $('lvCost').textContent = cost;
  $('lvVig').textContent = S.vig; $('lvEnd').textContent = S.end; $('lvStr').textContent = S.str; $('lvStim').textContent = S.maxStims;
  document.querySelectorAll('[data-up]').forEach((b) => b.disabled = S.scrap < cost);
  show('level');
}
function levelUp(stat) {
  const S = GM.save; const cost = 120 + S.rank * 80; if (S.scrap < cost) return;
  S.scrap -= cost; S[stat]++; S.rank++; S.maxStims = Math.min(8, 4 + Math.floor((S.rank - 1) / 3));
  const P = GM.player; P.hp = P.maxHp; P.stam = P.maxStam; P.stims = S.maxStims; AU.heal(); GM.persist(); openLevel();
}
function toggleLock() {
  if (GM.lock) { GM.lock = null; return; }
  const P = GM.player, c = GM.cam; const f = [Math.sin(c.yaw), Math.cos(c.yaw)]; let best = null, bs = -1;
  for (const e of GM.enemies) {
    if (!e.alive || (e.boss && !e.active)) continue; const dx = e.pos[0] - P.pos[0], dz = e.pos[2] - P.pos[2]; const d = Math.hypot(dx, dz); if (d > (e.boss ? 32 : 20)) continue;
    const dot = (dx * f[0] + dz * f[1]) / d; const sc = dot * 2 - d / 20; if (dot > 0.2 && sc > bs) { bs = sc; best = e; }
  }
  GM.lock = best;
}

/* ---------------- camera ---------------- */
function updateCamera(dt, inp) {
  const c = GM.cam, P = GM.player;
  c.yaw -= inp.cx; c.pitch = OE.clamp(c.pitch + inp.cy, -0.35, 1.1);
  const tgt = [P.pos[0], 1.55, P.pos[2]];
  if (GM.lock && GM.lock.alive && P.alive) {
    const ly = A.yawTo(P.pos, GM.lock.pos); c.yaw += OE.angDiff(c.yaw, ly) * Math.min(1, dt * 6);
    const want = GM.lock.boss ? 0.38 : 0.24; c.pitch += (want - c.pitch) * Math.min(1, dt * 3);
    if (A.dist2(P.pos, GM.lock.pos) > (GM.lock.boss ? 36 : 24)) GM.lock = null;
  }
  let dist = c.dist * (GM.lock && GM.lock.boss ? 1.35 : 1);
  const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  const right = [-Math.cos(c.yaw), 0, Math.sin(c.yaw)]; const sh = 0.35;
  const look = [tgt[0] + right[0] * sh, tgt[1], tgt[2] + right[2] * sh];
  let pos = [look[0] - Math.sin(c.yaw) * cp * dist, look[1] + sp * dist, look[2] - Math.cos(c.yaw) * cp * dist];
  const fr = W.ray(look, pos, 0.8); if (fr < 1) { const k = Math.max(0.12, fr - 0.06); pos = [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k]; }
  pos[1] = Math.max(0.3, pos[1]);
  // smooth
  const k = 1 - Math.exp(-dt * 18);
  for (let i = 0; i < 3; i++) { c.pos[i] += (pos[i] - c.pos[i]) * k; c.target[i] += (look[i] - c.target[i]) * k; }
  if (c.shake > 0) { const s = c.shake * c.shake * 0.22; c.pos[0] += R(-s, s); c.pos[1] += R(-s, s); c.pos[2] += R(-s, s); c.shake = Math.max(0, c.shake - dt * 2.2); }
  c.shadowCenter = [P.pos[0] + Math.sin(c.yaw) * 6, 0, P.pos[2] + Math.cos(c.yaw) * 6];
  c.camPos = c.pos;
}

/* ---------------- main loop ---------------- */
let titleAng = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (ts - lastT) / 1000); lastT = ts;
  if (document.hidden || GM.simulating) return;
  OE.resize();
  step(dt, readInput(dt));
  OE.render(GM.cam, GM.state === 'codex' ? null : GM.parts);
}
function step(dt, inp) {
  time += dt;
  if (GM.state === 'codex') { GM.codex.update(dt, inp); return; }
  const R_ = OE.R;
  // world ambience
  flashT -= dt; if (flashT <= 0) { flashT = R(6, 15); R_.flash = R(0.4, 1.0); AU.thunder(R(0.6, 2.0)); }
  R_.flash = Math.max(0, R_.flash - dt * 2.5); R_.hurt = Math.max(0, R_.hurt - dt * 1.5);
  const st = GM.state;
  if (inp.pause) { if (st === 'play') openPause(); else if (st === 'pause') closePause(); }
  let sdt = dt; if (hs > 0) { hs -= dt; sdt = dt * 0.06; }
  if (st === 'title' || st === 'crawl' || st === 'loading' || st === 'birth') {
    GM._inMenu = true; GM.menu.update(dt);
    for (const e of GM.enemies) e.update(0);
  } else if (st === 'play' || st === 'dead') {
    if (GM._inMenu) { // back from the menu stage to New London
      GM._inMenu = false; GM.menu.leave(); OE.scene = GM.worldRoot; Object.assign(OE.R, JSON.parse(JSON.stringify(GM.worldEnv)));
    }
    if (st === 'play') { GM.save.stats.time += dt; if (GM.chapterEndT > 0) { GM.chapterEndT -= dt; if (GM.chapterEndT <= 0) { if (LV.def.cutscene) GM.cine.start(LV.def.cutscene); else GM.align.open(LV.def.choice, chapterComplete); } } }
    if (inp.lock) toggleLock();
    const P = GM.player;
    if (P.state === 'rest') P.setState('move', null);
    P.update(sdt, st === 'play' ? inp : { mx: 0, my: 0 });
    if (!GM.solo) GM.companion.update(sdt);
    for (const e of GM.enemies) { if (A.dist2(e.pos, P.pos) < 55 || e.state === 'dead') e.update(sdt); }
    updateHazards(sdt);
    // echo pickup
    const ec = GM.save.echo;
    if (ec) {
      if (rnd() < 0.6) GM.parts.emit({ pos: [ec.pos[0] + R(-0.25, 0.25), 0.2, ec.pos[2] + R(-0.25, 0.25)], vel: [0, R(0.6, 1.4), 0], size: R(0.04, 0.08), life: 1.2, col: [1.2, 2.8, 1.6, 1], soft: 0.2 });
      if (P.alive && st === 'play' && Math.hypot(P.pos[0] - ec.pos[0], P.pos[2] - ec.pos[2]) < 1.4) { GM.save.scrap += ec.amount; GM.hud.toast('SCRAP RECOVERED  +' + ec.amount); GM.save.echo = null; GM.persist(); AU.heal(); }
    }
    // interaction prompt
    const it = st === 'play' && P.alive && P.state === 'move' ? interactables() : null;
    const pr = $('prompt');
    if (it) { pr.classList.remove('hidden'); pr.innerHTML = (touchOn() ? '' : '<kbd>E</kbd>') + it.label; if (inp.interact) doInteract(it); } else pr.classList.add('hidden');
    $('tb_interact') && $('tb_interact').classList.toggle('hidden', !it);
    if (!P.alive) OE.R.desat = Math.min(0.85, OE.R.desat + dt * 0.4);
    if (st === 'dead') updateDeath(dt);
    GM.align.markers(time);
    if (!GM.debug || !GM.debug.freeze) updateCamera(dt, st === 'play' ? inp : { cx: 0, cy: 0 });
    updateHud(dt);
  } else if (st === 'cutscene') {
    GM.cine.update(dt);
    for (const e of GM.enemies) if (e.boss) e.update(dt);
    updateHud(dt);
  } else {
    // menus: keep world gently alive
    GM.player.ch.update(dt); GM.companion.ch.update(dt);
  }
  // beacons pulse
  for (const b of W.beacons) if (b.lit) { b.light.intensity = 3.2 + Math.sin(time * 2.2) * 0.5; if (rnd() < 0.3) GM.parts.emit({ pos: [b.pos[0] + R(-0.15, 0.15), 1.8, b.pos[2] + R(-0.15, 0.15)], vel: [R(-0.2, 0.2), R(0.8, 1.6), R(-0.2, 0.2)], size: 0.04, life: 1.4, col: [0.8, 1.8, 3.5, 1], soft: 0.2 }); }
  if (W.gate.node.visible) { const gf = W.gate.fx; W.gate.node.mat.alpha = 0.28 + Math.sin(time * 1.7) * 0.06; if (rnd() < 0.5) GM.parts.emit({ pos: [R(gf[0], gf[1]), R(0.2, gf[2]), W.gate.z + R(-0.1, 0.1)], vel: [0, R(0.1, 0.4), 0], size: R(0.1, 0.25), life: 1.5, col: [1.2, 1.1, 0.9, 0.35], soft: 0 }); }
  // ash & embers around camera
  const cp = GM.cam.pos;
  if (W.ambience === 'rain') { // Channel rain, driven in off the sea
    if (GM.state !== 'title' && GM.state !== 'crawl' && GM.state !== 'birth') for (let i = 0; i < 9; i++) GM.parts.emit({ pos: [cp[0] + R(-12, 12), R(5, 9), cp[2] + R(-12, 12)], vel: [-2.2, -15, 0.4], stretch: 0.06, size: R(0.01, 0.018), life: 0.7, col: [0.7, 0.74, 0.8, 0.55], add: false, soft: 0.1, fade: 0, floor: 0.02 });
  } else for (let i = 0; i < 2; i++) GM.parts.emit({ pos: [cp[0] + R(-14, 14), R(4, 9), cp[2] + R(-14, 14)], vel: [R(0.2, 0.6), R(-0.5, -0.9), R(-0.2, 0.2)], size: R(0.012, 0.03), life: 8, col: [0.5, 0.48, 0.45, 0.8], add: false, soft: 0.3, spin: 1 });
  if (W.ambience !== 'rain' && rnd() < 0.3) GM.parts.emit({ pos: [cp[0] + R(-10, 10), R(0, 2), cp[2] + R(-10, 10)], vel: [R(-0.3, 0.6), R(0.5, 1.5), R(-0.3, 0.3)], size: 0.02, life: 3, col: [4, 1.4, 0.3, 1], soft: 0.3 });
  W.update(sdt, time, { parts: GM.parts, camPos: GM.cam.pos });
  GM.parts.update(sdt);
}
GM.ui = { show, hudVisible, lock: lockPointer };
GM.debug = { saveSlot: (i) => saveToSlot(i), loadSlot: (i) => loadSlot(i), startPart2: () => startChapter(2, { part: 2 }), loadLevel: (n) => GM.loadLevel(n), startChapter: (n) => startChapter(n), victory: () => victory(), sim(sec, inpF) { GM.simulating = true; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) step(1 / 60, Object.assign({ mx: 0, my: 0, cx: 0, cy: 0 }, inpF ? inpF(i) : {})); GM.simulating = false; }, startPlay, respawnAll, doInteract, interactables, toggleLock, show, banner, get boss() { return boss; } };
})();
