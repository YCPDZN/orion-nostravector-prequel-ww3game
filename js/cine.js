/* In-engine cutscenes. 'eye': Chapter II, Part I — Talina Alvarez, beaten and on one knee, takes Orion's left eye.
   The moment of the strike cuts to black; the scene fades back in on Orion clutching his eye, then branches on his alignment:
   - Chaotic Good / Neutral: she walks away; he staggers off, then stops and confesses he has had a crush on her since the academy.
   - Chaotic Evil: he calls her back and runs her through, then stands over her and speaks.
   The outcome is saved (GM.save.talina = 'fled' | 'executed') for Part II's radio call and the codex. */
(function () {
'use strict';
const $ = (id) => document.getElementById(id);
const C = GM.cine = { t: 0, on: false };
const fwd = (y) => [Math.sin(y), 0, Math.cos(y)];

const OPEN = [ // shared, up to the strike
  [0.4, 'orion', 'It\'s over, Talina. Get up. You\'re coming back to London to answer for this.', 5, 26],
  [5.6, 'talina', 'London? London is ash, Comandante. And you are a boy with a sword.', 4.6, 27],
  [10.4, 'orion', 'Last chance.', 2, 28],
  [12.5, 'talina', 'Then let me leave you something to remember me by.', 3.3, 29],
  [16.2, 'orion', 'Argh — !', 1.6, 30],
  [18.4, 'talina', 'Hasta luego, Orion.', 2.4, 31],
];
const BRANCH = {
  spare: { fate: 'fled', end: 46.5, fadeOut: 40.9, lines: [
    [23.0, 'orion', 'Talina — wait.', 2, 32],
    [25.2, 'talina', '...¿Qué?', 1.8, 33],
    [27.2, 'orion', 'Since the academy. Since the day you put me on my back in the training hall... I\'ve had a crush on you.', 5.5, 34],
    [32.9, 'talina', '...You tell me this now? With my blade still warm? Idiota.', 4.2, 35],
    [37.3, 'talina', 'Go home, Orion. Before I change my mind.', 3.4, 36],
    [41.6, 'thomas', 'Commander? Commander, respond! ...Orion! ORION!', 4.6, 37],
  ] },
  execute: { fate: 'executed', end: 60, fadeOut: 54, lines: [
    [20.9, 'orion', 'Talina.', 1.6, 38],
    [24.5, 'orion', 'You should have finished it. You had your blade at my face, and you chose to leave me something to remember you by.', 5.7, 39],
    [30.4, 'orion', 'So here is mine. Feel how cold the steel is. Feel your strength run out through your fingers, onto the stones you sold.', 5.7, 40],
    [36.3, 'orion', 'You taught Command\'s cadets to aim for the heart. I aimed lower. I wanted you to have time to understand.', 5.7, 41],
    [42.2, 'orion', 'Seville. London. The Pact. None of it matters now. The Channel wind is the only thing that will remember your name.', 5.7, 42],
    [48.1, 'orion', 'And when the Red Sun and the Bear ask what became of their traitor... I\'ll tell them. Slowly.', 5.4, 43],
    [54.6, 'thomas', 'Commander? Commander, respond! ...Orion? What happened up there?', 5, 44],
  ] },
};
const IMPACT = 15.9, BLACK_UNTIL = 17.8;

function black(v, secs) { const b = $('cineBlack'); b.style.transition = secs ? `opacity ${secs}s` : 'none'; b.style.opacity = v; }

C.start = function (name) {
  if (name !== 'eye') return;
  C.name = name; C.t = 0; C.real = 0; C.busy = 0; C.on = true; C.flags = {};
  C.br = GM.align.tier('o') === 'evil' ? BRANCH.execute : BRANCH.spare;
  C.lines = OPEN.concat(C.br.lines); C.li = 0; C.end = C.br.end;
  GM.state = 'cutscene'; GM.lock = null; GM.clearSubs();
  if (document.pointerLockElement) document.exitPointerLock();
  $('prompt').classList.add('hidden'); $('hud').classList.remove('hidden'); $('hud').classList.add('cine'); $('touch').classList.add('hidden');
  $('cine').classList.remove('hidden'); black(0); $('banner').style.opacity = 0;
  const P = GM.player, T = GM.boss;
  T.state = 'cut'; T.yaw = Math.atan2(P.pos[0] - T.pos[0], P.pos[2] - T.pos[2]);
  const d = fwd(T.yaw); C.dir = d; C.right = [d[2], 0, -d[0]];
  C.spot = [T.pos[0] + d[0] * 1.75, 0, T.pos[2] + d[2] * 1.75]; C.from = P.pos.slice(); C.home = T.pos.slice();
  P.state = 'cine'; P.iframe = true; C.eyeW = 0;
};
C.skip = function () {
  if (!C.on) return;
  if (C.t < IMPACT - 0.1) { C.t = IMPACT - 0.05; C.busy = 0; GM.clearSubs(); C.li = C.lines.findIndex((l) => l[0] >= IMPACT); }
  else C.t = C.end;
};

/* Orion's left hand pressed over his left eye (model space: +x is his left, +z forward) */
function holdEye(P, w) {
  if (w <= 0.001) return;
  const ch = P.ch; ch.modelPose(); const bi = ch.boneIndex, M = ch.mP; const h = M[bi.Head], sh = M[bi.L_UpperArm];
  ch.ik(['L_UpperArm', 'L_ForeArm', 'L_Hand'], [h[0] + 0.05, h[1] + 0.05, h[2] + 0.16], [sh[0] + 0.4, sh[1] - 0.25, sh[2] + 0.15], w);
}
const walkTo = (a, target, speed, dt) => { const dx = target[0] - a.pos[0], dz = target[2] - a.pos[2], l = Math.hypot(dx, dz); if (l < 0.05) return true; const s = Math.min(l, speed * dt); a.pos[0] += dx / l * s; a.pos[2] += dz / l * s; a.yaw = Math.atan2(dx, dz); return false; };
const faceTo = (a, b, dt, rate) => { a.yaw += OE.angDiff(a.yaw, Math.atan2(b.pos[0] - a.pos[0], b.pos[2] - a.pos[2])) * Math.min(1, dt * rate); };

C.update = function (dt) {
  if (!C.on) return;
  /* script clock: runs in real time, but holds at a line's cue until the previous line's recording has finished */
  C.real += dt; let step = dt; const nx = C.li >= 0 ? C.lines[C.li] : null;
  if (nx && C.t + dt >= nx[0]) {
    if (C.real < C.busy) { C.t = Math.max(C.t, nx[0] - 1e-4); step = 0; }
    else { const D = GM.voDur(nx[4], nx[3]); GM.say(nx[1], nx[2], D, GM.vo(nx[4])); C.busy = C.real + D - 0.25; C.li++; }
  }
  C.t += step;
  const t = C.t, P = GM.player, T = GM.boss, cam = GM.cam, F = C.flags, d = C.dir, r = C.right, evil = C.br === BRANCH.execute;

  if (t < IMPACT) { // Orion walks up and stands over her
    const u = Math.min(1, t / 2.2);
    if (t < 2.2) { P.pos = [OE.lerp(C.from[0], C.spot[0], u), 0, OE.lerp(C.from[2], C.spot[2], u)]; P.ch.play('Walk', 0.2); } else P.ch.play('Idle', 0.3);
    P.yaw = Math.atan2(T.pos[0] - P.pos[0], T.pos[2] - P.pos[2]);
    if (t >= IMPACT - 0.28 && !F.struck) { F.struck = true; T.ch.play('Strike', 0.05, 1, true); }
  } else {
    if (!F.hit) { // the cut to black
      F.hit = true; black(1); OE.R.hurt = 1; GM.shake(0.8); GM.audio.hurt(); GM.audio.hit(true); P.ch.play('Hit', 0.05, 1, true);
    }
    if (t >= BLACK_UNTIL && !F.up) { F.up = true; black(0, 1.4); OE.R.hurt = 0.6; P.ch.play('Idle', 0.4); T.ch.play('Idle', 0.5); T.yaw = Math.atan2(P.pos[0] - T.pos[0], P.pos[2] - T.pos[2]); }
    C.eyeW = Math.min(1, C.eyeW + dt * 3); // from the cut onwards he holds his eye
    const away = [C.home[0] - d[0] * 12, 0, C.home[2] - d[2] * 12]; // where Talina walks off to, deeper into the bailey

    if (!evil) { // she leaves; he staggers off, stops, turns back and tells her
      if (t > 19.6 && t < 25.2) { if (!walkTo(T, away, 1.0, dt)) T.ch.play('Walk', 0.25, 0.9); else T.ch.play('Idle', 0.3); }
      else if (t >= 25.2 && t < 37.3) { T.ch.play('Idle', 0.3); faceTo(T, P, dt, 3); }
      else if (t >= 37.3) { if (!walkTo(T, [away[0] - d[0] * 8, 0, away[2] - d[2] * 8], 1.1, dt)) T.ch.play('Walk', 0.25, 0.9); }
      const flee = [C.spot[0] + d[0] * 5.5, 0, C.spot[2] + d[2] * 5.5];
      if (t > 20.2 && t < 22.8) { if (!walkTo(P, flee, 1.6, dt)) P.ch.play('Walk', 0.25, 0.75); }
      else if (t >= 22.8) { P.ch.play('Idle', 0.35); faceTo(P, T, dt, 3); }
    } else { // she turns to go; he calls her back and runs her through
      if (t > 19.6 && t < 21.0) { if (!walkTo(T, away, 1.0, dt)) T.ch.play('Walk', 0.25, 0.9); }
      else if (t >= 21.0 && !F.turned) { F.turned = true; T.ch.play('Idle', 0.3); }
      if (t >= 21.0 && t < 22.6) faceTo(T, P, dt, 6);
      if (t >= 21.3 && t < 22.0) { if (!walkTo(P, [T.pos[0] + Math.sin(T.yaw) * 1.3, 0, T.pos[2] + Math.cos(T.yaw) * 1.3], 5.5, dt)) P.ch.play('Run', 0.1); }
      if (t >= 22.0 && !F.swing) { F.swing = true; P.yaw = Math.atan2(T.pos[0] - P.pos[0], T.pos[2] - P.pos[2]); P.ch.play('Heavy', 0.06, 1, true); }
      if (t >= 22.58 && !F.kill) {
        F.kill = true; GM.shake(0.6); GM.audio.hit(true); T.ch.play('Death', 0.08, 0.85, true);
        for (let i = 0; i < 3; i++) GM.fx.blood([T.pos[0] + (Math.random() - 0.5) * 0.2, 1.15 - i * 0.12, T.pos[2] + (Math.random() - 0.5) * 0.2]);
        T.T = Object.assign({}, T.T, { glow: [0.25, 0.04, 0.32] }); T.lit = 0; // her blade goes dark
      }
      if (t >= 23.4 && !F.drop) { F.drop = true; T.sword.visible = false; T.light.intensity = 0; } // the sabre falls from her hand
      if (t >= 23.6 && !F.idle) { F.idle = true; P.ch.play('Idle', 0.6); }
    }
    if (t >= C.br.fadeOut && !F.down) { F.down = true; black(1, evil ? 1.6 : 1.2); }
  }
  P.ch.update(dt); holdEye(P, C.eyeW); P.syncNode();

  // ---- camera ----
  let pos, tgt;
  if (t < 10.4) { const k = t * 0.05, m = [(T.pos[0] + C.spot[0]) / 2, 0, (T.pos[2] + C.spot[2]) / 2]; pos = [m[0] + r[0] * (4.4 - k) + d[0] * 0.6, 1.55, m[2] + r[2] * (4.4 - k) + d[2] * 0.6]; tgt = [m[0], 1.05, m[2]]; }
  else if (t < IMPACT - 0.35) { pos = [C.spot[0] + d[0] * 1.4 + r[0] * 1.15, 1.85, C.spot[2] + d[2] * 1.4 + r[2] * 1.15]; tgt = [T.pos[0], 0.95, T.pos[2]]; }
  else if (t < BLACK_UNTIL) { pos = [T.pos[0] + d[0] * 0.5 - r[0] * 0.9, 1.25, T.pos[2] + d[2] * 0.5 - r[2] * 0.9]; tgt = [P.pos[0], 1.62, P.pos[2]]; }
  else if (evil && t > 24) { // low, slow push in on Orion standing over her
    const k = Math.min(1, (t - 24) / 28), toT = [T.pos[0] - P.pos[0], 0, T.pos[2] - P.pos[2]], l = Math.hypot(toT[0], toT[2]) || 1, u = [toT[0] / l, 0, toT[2] / l], s = [u[2], 0, -u[0]];
    const side = OE.lerp(4.2, 2.6, k), m = [P.pos[0] + u[0] * 0.7, 0, P.pos[2] + u[2] * 0.7]; // from the side: Orion standing, her body at his feet
    pos = [m[0] + s[0] * side - u[0] * 0.4, OE.lerp(0.5, 0.75, k), m[2] + s[2] * side - u[2] * 0.4]; tgt = [m[0] + u[0] * 0.2, OE.lerp(1.0, 1.35, k), m[2] + u[2] * 0.2];
  } else if (!evil && t > 26.6 && t < 37.3) { // the confession: on whoever is speaking, the other out of focus behind
    const toP = [P.pos[0] - T.pos[0], 0, P.pos[2] - T.pos[2]], l = Math.hypot(toP[0], toP[2]) || 1, u = [toP[0] / l, 0, toP[2] / l], s = [u[2], 0, -u[0]];
    const onOrion = t < 32.6; const a = onOrion ? P.pos : T.pos, v = onOrion ? [-u[0], 0, -u[2]] : u;
    pos = [a[0] + v[0] * 2.6 + s[0] * 0.8, 1.6, a[2] + v[2] * 2.6 + s[2] * 0.8]; tgt = [a[0], 1.55, a[2]];
  } else { // wide two-shot that follows them as they part
    const m = [(T.pos[0] + P.pos[0]) / 2, 0, (T.pos[2] + P.pos[2]) / 2], sep = Math.hypot(T.pos[0] - P.pos[0], T.pos[2] - P.pos[2]);
    const off = 3.6 + sep * 0.55; pos = [m[0] + r[0] * off, 1.55, m[2] + r[2] * off]; tgt = [m[0], 1.15, m[2]];
  }
  cam.pos = pos; cam.target = tgt; cam.shadowCenter = [tgt[0], 0, tgt[2]]; cam.camPos = cam.pos;
  if (t >= C.end) C.finish();
};
C.finish = function () {
  C.on = false;
  $('hud').classList.remove('cine'); $('cine').classList.add('hidden'); black(0); OE.R.hurt = 0;
  if (C.name === 'eye') { GM.save.talina = C.br.fate; GM.boss.node.visible = false; GM.boss.sword.visible = true; GM.toPart2(); }
};
})();
