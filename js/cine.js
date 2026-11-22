/* In-engine cutscenes. 'eye': Chapter II, Part I — Talina Alvarez, beaten and on one knee, takes Orion's left eye.
   Kept PG: the screen cuts to black at the moment of the strike; everything after is heard, not seen. */
(function () {
'use strict';
const $ = (id) => document.getElementById(id);
const C = GM.cine = { t: 0, on: false };
const fwd = (y) => [Math.sin(y), 0, Math.cos(y)];

const SCENES = {
  eye: {
    impact: 15.9, end: 25.5,
    lines: [
      [0.4, 'orion', 'It\'s over, Talina. Get up. You\'re coming back to London to answer for this.', 5],
      [5.6, 'talina', 'London? London is ash, Comandante. And you are a boy with a sword.', 4.6],
      [10.4, 'orion', 'Last chance.', 2],
      [12.5, 'talina', 'Then let me leave you something to remember me by.', 3.3],
      [16.2, 'orion', 'Argh — !', 1.6],
      [18.0, 'talina', 'Hasta luego, Orion.', 2.6],
      [20.8, 'thomas', 'Commander? Commander, respond! ...Orion! ORION!', 4.6],
    ],
  },
};

C.start = function (name) {
  const sc = SCENES[name]; if (!sc) return;
  C.sc = sc; C.name = name; C.t = 0; C.li = 0; C.on = true; C.hit = false;
  GM.state = 'cutscene'; GM.lock = null; GM.clearSubs();
  if (document.pointerLockElement) document.exitPointerLock();
  $('prompt').classList.add('hidden'); $('hud').classList.remove('hidden'); $('hud').classList.add('cine'); $('touch').classList.add('hidden');
  $('cine').classList.remove('hidden'); $('cineBlack').style.opacity = 0; $('banner').style.opacity = 0;
  const P = GM.player, T = GM.boss;
  T.state = 'cut'; T.yaw = Math.atan2(P.pos[0] - T.pos[0], P.pos[2] - T.pos[2]);
  const d = fwd(T.yaw); C.dir = d; C.right = [d[2], 0, -d[0]];
  C.spot = [T.pos[0] + d[0] * 1.75, 0, T.pos[2] + d[2] * 1.75]; C.from = P.pos.slice();
  P.state = 'cine'; P.iframe = true;
};
C.skip = function () { if (!C.on) return; if (C.t < C.sc.impact - 0.1) { C.t = C.sc.impact - 0.05; GM.clearSubs(); C.li = C.sc.lines.findIndex((l) => l[0] >= C.sc.impact); } else C.t = C.sc.end; };

C.update = function (dt) {
  if (!C.on) return;
  C.t += dt; const t = C.t, sc = C.sc, P = GM.player, T = GM.boss, cam = GM.cam;
  while (C.li >= 0 && C.li < sc.lines.length && sc.lines[C.li][0] <= t) { const l = sc.lines[C.li++]; GM.say(l[1], l[2], l[3]); }
  // Orion walks up to her and stands over her
  const u = Math.min(1, t / 2.2);
  if (t < 2.2) { P.pos = [OE.lerp(C.from[0], C.spot[0], u), 0, OE.lerp(C.from[2], C.spot[2], u)]; P.ch.play('Walk', 0.2); }
  else if (!C.hit) P.ch.play('Idle', 0.3);
  P.yaw = Math.atan2(T.pos[0] - P.pos[0], T.pos[2] - P.pos[2]);
  if (t >= sc.impact - 0.28 && !C.struck) { C.struck = true; T.ch.play('Strike', 0.05, 1, true); }
  if (t >= sc.impact && !C.hit) { // the cut
    C.hit = true; $('cineBlack').style.opacity = 1; OE.R.hurt = 1; GM.shake(0.8); GM.audio.hurt(); GM.audio.hit(true); P.ch.play('Hit', 0.05, 1, true);
  }
  P.ch.update(dt); P.syncNode();
  // camera
  const d = C.dir, r = C.right, m = [(T.pos[0] + C.spot[0]) / 2, 0, (T.pos[2] + C.spot[2]) / 2];
  let pos, tgt;
  if (t < 10.4) { const k = t * 0.05; pos = [m[0] + r[0] * (4.4 - k) + d[0] * 0.6, 1.55, m[2] + r[2] * (4.4 - k) + d[2] * 0.6]; tgt = [m[0], 1.05, m[2]]; }
  else if (t < sc.impact - 0.35) { pos = [C.spot[0] + d[0] * 1.4 + r[0] * 1.15, 1.85, C.spot[2] + d[2] * 1.4 + r[2] * 1.15]; tgt = [T.pos[0], 0.95, T.pos[2]]; }
  else { pos = [T.pos[0] + d[0] * 0.5 - r[0] * 0.9, 1.25, T.pos[2] + d[2] * 0.5 - r[2] * 0.9]; tgt = [P.pos[0], 1.62, P.pos[2]]; }
  cam.pos = pos; cam.target = tgt; cam.shadowCenter = m; cam.camPos = cam.pos;
  if (t >= sc.end) C.finish();
};
C.finish = function () {
  C.on = false; C.struck = false;
  $('hud').classList.remove('cine'); $('cine').classList.add('hidden'); OE.R.hurt = 0;
  if (C.name === 'eye') { GM.boss.node.visible = false; GM.toPart2(); }
};
})();
