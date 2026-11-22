/* Main menu stage — Orion and Thomas on a black stage, posed by alignment.
   NEUTRAL (default): Orion arms crossed and wary, Thomas cautious with his rifle low.
   GOOD: Orion arms crossed, Thomas gives a thumbs up.
   EVIL: Orion grips his red sabre in both hands, Thomas arms crossed, turned away. */
(function () {
'use strict';
const { M4, Q } = OE;
const MN = GM.menu = {};
const STAGE = [0, 0, -600];
let root = null, O = null, T = null, sword = null, swordGlow = null, rifle = null, rifleGlow = null, lights = null, t = 0;
const swordModel = M4.create(), rifleModel = M4.create(), sw = M4.create(), rw = M4.create();

function build() {
  root = new OE.Node(); const prev = OE.scene; OE.scene = root;
  const g = new OE.Geo(); g.cyl([STAGE[0], -0.05, STAGE[2]], 3.2, 0.05, 48, { col: [0.22, 0.21, 0.2, 1], aoB: 1 });
  root.add(new OE.Node(g.build(), { mode: 1, triA: W.tex.concrete.albedo, triN: W.tex.concrete.normal, triScale: 0.4, rough: 0.7, metal: 0.1, color: [0.5, 0.48, 0.46] }));
  const Wp = A.weapons();
  O = new OE.Character(GM.assets.orion, { rim: 0.2 }); root.add(O.node);
  sword = new OE.Node(Wp.swordMesh, Wp.metalMat()); swordGlow = new OE.Node(Wp.swordGlow, { mode: 2, color: [0, 0, 0], emissive: [3.4, 0.35, 0.25] });
  swordGlow.castShadow = false; sword.add(swordGlow); sword.attach = () => M4.mul(sw, O.node.world, swordModel); O.node.add(sword);
  T = new OE.Character(GM.assets.thomas, { rim: 0.2 }); root.add(T.node);
  rifle = new OE.Node(Wp.rifleMesh, Wp.metalMat()); rifle.mat.color = [0.7, 0.7, 0.72];
  rifleGlow = new OE.Node(Wp.rifleGlow, { mode: 2, color: [0, 0, 0], emissive: [3, 2.3, 0.45] }); rifleGlow.castShadow = false; rifle.add(rifleGlow);
  rifle.attach = () => M4.mul(rw, T.node.world, rifleModel); T.node.add(rifle);
  O.play('Idle', 0); T.play('Idle', 0); T.t = 1.1;
  lights = {
    key: { pos: [STAGE[0] - 1.2, 3.0, STAGE[2] + 3.2], color: [1, 0.93, 0.85], intensity: 4.5, range: 10 },
    fill: { pos: [STAGE[0] + 2.5, 1.5, STAGE[2] + 2.0], color: [0.6, 0.65, 0.8], intensity: 1.2, range: 8 },
    rimO: { pos: [STAGE[0] - 0.9, 2.6, STAGE[2] - 1.6], color: [1, 0.8, 0.25], intensity: 6, range: 6 },
    rimT: { pos: [STAGE[0] + 1.6, 2.6, STAGE[2] - 1.6], color: [1, 0.8, 0.25], intensity: 6, range: 6 },
    floor: { pos: [STAGE[0] + 0.4, 0.3, STAGE[2] + 0.6], color: [1, 0.8, 0.25], intensity: 1.0, range: 4 },
  };
  OE.scene = prev;
}

/* alignment shown on the menu: the most recent save (or neutral when there is none) */
MN.tier = function () {
  try {
    const slots = JSON.parse(localStorage.getItem('orion_ww3_slots') || '[]').filter(Boolean).sort((a, b) => b.when - a.when);
    if (slots.length && slots[0].save && slots[0].save.align) return GM.align.tierOf(slots[0].save.align.o);
  } catch (e) { }
  return 'neutral';
};

const look = (ch, bone, x, y, z) => { const q = ch.override[bone] || (ch.override[bone] = Q.create()); Q.euler(q, x, y, z); };
function armsCrossed(ch, w, high) {
  ch.modelPose(); const bi = ch.boneIndex, P = ch.mP; const c = P[bi.Chest], shR = P[bi.R_UpperArm], shL = P[bi.L_UpperArm];
  const y = c[1] + 0.02 + (high || 0);
  ch.ik(['R_UpperArm', 'R_ForeArm', 'R_Hand'], [c[0] + 0.13, y - 0.04, c[2] + 0.2], [shR[0] - 0.45, shR[1] - 0.35, shR[2] + 0.05], w);
  ch.ik(['L_UpperArm', 'L_ForeArm', 'L_Hand'], [c[0] - 0.13, y + 0.01, c[2] + 0.25], [shL[0] + 0.45, shL[1] - 0.35, shL[2] + 0.05], w);
}
function twoHandSword(ch) {
  ch.modelPose(); const bi = ch.boneIndex, P = ch.mP; const c = P[bi.Chest], shR = P[bi.R_UpperArm], shL = P[bi.L_UpperArm];
  const G = [c[0] - 0.08, c[1] - 0.46, c[2] + 0.3]; const D = OE.V.norm([-0.42, 1, 0.3]); // blade angled up past his right shoulder
  const x = OE.V.norm(OE.V.cross([0, 0, 1], D)); const yv = OE.V.cross(D, x);
  swordModel.set([x[0], x[1], x[2], 0, yv[0], yv[1], yv[2], 0, D[0], D[1], D[2], 0, G[0], G[1], G[2], 1]);
  const at = (k, off) => OE.V.add(OE.V.add(G, OE.V.sc(D, k)), off);
  ch.ik(['R_UpperArm', 'R_ForeArm', 'R_Hand'], at(0.02, [0, -0.07, -0.03]), [shR[0] - 0.45, shR[1] - 0.45, shR[2]], 1);
  ch.ik(['L_UpperArm', 'L_ForeArm', 'L_Hand'], at(-0.11, [0, -0.07, -0.03]), [shL[0] + 0.45, shL[1] - 0.45, shL[2]], 1);
}
function thumbsUp(ch) {
  ch.modelPose(); const bi = ch.boneIndex, P = ch.mP; const shR = P[bi.R_UpperArm];
  ch.ik(['R_UpperArm', 'R_ForeArm', 'R_Hand'], [shR[0] - 0.02, shR[1] - 0.06, shR[2] + 0.33], [shR[0] - 0.25, shR[1] - 0.7, shR[2] - 0.1], 1);
}

MN.update = function (dt) {
  if (!root) build();
  t += dt; OE.scene = root;
  const R = OE.R, tier = MN.tier(), info = GM.align.TIERS[tier];
  // black stage
  R.skyOff = true; R.fogCol = [0, 0, 0]; R.fogDen = 0.035; R.sunCol = [0.12, 0.12, 0.14]; R.sky = [0.02, 0.02, 0.025]; R.ground = [0.01, 0.01, 0.01];
  const rc = info.light; for (const k of ['rimO', 'rimT', 'floor']) lights[k].color = rc;
  if (!R.lights.includes(lights.key)) for (const k in lights) R.lights.push(lights[k]);
  // place characters
  O.node.pos = [STAGE[0] - 0.05, 0, STAGE[2]]; T.node.pos = [STAGE[0] + 1.05, 0, STAGE[2] - 0.05];
  O.override = {}; T.override = {};
  const breathe = Math.sin(t * 1.3);
  // ---- Orion
  O.update(dt);
  if (tier === 'evil') {
    Q.yaw(O.node.rot, 0.12); look(O, 'Head', 6, -4 + breathe, 0); look(O, 'Chest', 4, 0, 0);
    O.update(0); twoHandSword(O); sword.visible = true;
    swordGlow.mat.emissive = info.glow.map((v) => v * (1.4 + 0.25 * Math.sin(t * 3)));
  } else {
    sword.visible = false;
    if (tier === 'good') { Q.yaw(O.node.rot, 0.18); look(O, 'Head', -3, -6, 0); look(O, 'Chest', -3, 0, 0); }
    else { Q.yaw(O.node.rot, 0.28); look(O, 'Head', 9, -16 + breathe * 2, 0); look(O, 'Chest', 2, -6, 0); } // wary: chin down, eyes away
    O.update(0); armsCrossed(O, 1);
  }
  // ---- Thomas
  T.update(dt);
  if (tier === 'good') {
    Q.yaw(T.node.rot, -0.22); look(T, 'Head', -4, 10, 4); rifle.visible = false;
    T.update(0); thumbsUp(T);
  } else if (tier === 'evil') {
    Q.yaw(T.node.rot, -0.75); look(T, 'Head', 8, 42, -9); look(T, 'Chest', 0, 10, 0); rifle.visible = false; // turned away, side-eye towards Orion
    T.update(0); armsCrossed(T, 1, -0.02);
  } else {
    Q.yaw(T.node.rot, -0.3); look(T, 'Head', 4, 22 + Math.sin(t * 0.7) * 8, 0); look(T, 'Spine', 6, 0, 0); rifle.visible = true; // cautious: rifle low, glancing around
    T.update(0); A.rifleRig(T, { aim: 0.2, dir: [0.1, -0.15, 1], recoil: 0 }, rifleModel);
    rifleGlow.mat.emissive = info.glow;
  }
  // camera: characters on the right two-thirds, the menu on the left
  const cam = GM.cam; cam.fov = 0.62; const asp = R.w / R.h;
  const shift = asp > 1.1 ? 0.95 : 0.5;
  cam.pos = [STAGE[0] + 0.5 - shift + Math.sin(t * 0.15) * 0.08, 1.22, STAGE[2] + 4.1]; cam.target = [STAGE[0] + 0.5 - shift, 0.98, STAGE[2]];
  cam.shadowCenter = STAGE;
  document.documentElement.style.setProperty('--acc', info.css);
  // HUD tags that track the characters
  const proj = (p) => { const v = R.vp; const x = v[0] * p[0] + v[4] * p[1] + v[8] * p[2] + v[12], y = v[1] * p[0] + v[5] * p[1] + v[9] * p[2] + v[13], w = v[3] * p[0] + v[7] * p[1] + v[11] * p[2] + v[15];
    return [(x / w * 0.5 + 0.5) * innerWidth, (1 - (y / w * 0.5 + 0.5)) * innerHeight]; };
  const place = (id, p) => { const el = document.getElementById(id); if (!el) return; const s = proj(p); const w = el.offsetWidth || 150;
    el.style.left = Math.max(8, Math.min(innerWidth - w - 8, s[0] - w / 2)) + 'px'; el.style.top = (s[1] - el.offsetHeight - 14) + 'px'; };
  place('tagO', [O.node.pos[0], 1.98, O.node.pos[2]]); place('tagT', [T.node.pos[0], 1.94, T.node.pos[2]]);
  const cap = document.getElementById('menuAlign');
  if (cap) { const key = tier; if (cap.dataset.k !== key) { cap.dataset.k = key; cap.innerHTML = `<i style="background:${info.css};box-shadow:0 0 10px ${info.css}"></i>${info.name}`; cap.style.color = info.css; } }
};
MN.leave = function () {
  if (!lights) return;
  OE.R.lights = OE.R.lights.filter((l) => !Object.values(lights).includes(l)); OE.R.skyOff = false;
};
})();
