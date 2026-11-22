/* World: Dover Castle on the clifftop, December 2090 — Chapter II, Part I.
   The cliff road runs north under the outer curtain wall with the drop to the Channel on the right; through the
   gatehouse into the outer bailey (Roman lighthouse, Saxon church, Pact artillery), then the Palace Gate into the
   inner bailey, where Talina Alvarez waits beneath the Great Tower. */
(function () {
'use strict';
const rnd = OE.rng(1066);
const R = (a, b) => a + (b - a) * rnd();

W.builders['2a'] = function () {
  const T = W.textures();
  if (!T.chalk) T.chalk = OE.proceduralTex('chalk', 512);
  const mats = {
    stone: W.tri(T.concrete, 0.3, 0.9, 0), brick: W.tri(T.brick, 0.3, 0.9, 0), chalk: W.tri(T.chalk, 0.045, 0.95, 0),
    metal: W.tri(T.metal, 0.6, 0.55, 0.55), ground: W.tri(T.ground, 0.2, 0.95, 0),
  };
  const G = {}; for (const k in mats) G[k] = new OE.Geo();
  const glow = new OE.Geo();
  const col = (x0, x1, z0, z1, h = 10) => W.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h });
  const SC = [0.78, 0.74, 0.66, 1], SC2 = [0.7, 0.66, 0.59, 1]; // castle stone
  W.ambience = 'rain';
  W.arena = { c: [0, 0, 150], r: 19 };
  W.bounds = [-30, 30, -8.5, 180];
  const A = W.arena;

  // ---------- ground: clifftop grass, the road, the drop to the sea ----------
  G.ground.box([-8, -0.5, 85], [80, 1, 230], { col: [0.42, 0.55, 0.3, 1], aoBottom: 1 });
  G.stone.box([0, 0.01, 57], [9, 0.03, 132], { col: [0.5, 0.48, 0.45, 1], aoBottom: 1 }); // the road
  G.stone.cyl([0, -0.01, 150], 20, 0.05, 36, { col: [0.6, 0.57, 0.52, 1], aoB: 1 }); // inner bailey flagstones
  G.chalk.box([16, -22, 30], [6, 44, 90], { col: [1, 1, 1, 1] }); // the cliff face below the road
  const seaG = new OE.Geo(); seaG.box([160, -40, 85], [290, 0.2, 500], { col: [1, 1, 1, 1] });
  const sea = new OE.Node(seaG.build(), { mode: 2, color: [0.05, 0.085, 0.1], rough: 0.16, metal: 0.15 }); sea.castShadow = false; OE.scene.add(sea);
  for (let z = -6; z < 60; z += 3.2) if (rnd() < 0.7) G.metal.box([12.4, 0.5, z], [0.08, 1, 0.08], { col: [0.3, 0.27, 0.24, 1], rz: R(-12, 12) }); // broken fence at the edge
  col(12.6, 60, -20, 60, 0.5);

  // ---------- the outer curtain wall along the road ----------
  function wall(x0, x1, z0, z1, h, c = SC) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = Math.abs(x1 - x0), l = Math.abs(z1 - z0);
    G.stone.box([cx, h / 2, cz], [w, h, l], { col: c });
    const along = l > w; const n = Math.floor((along ? l : w) / 1.4);
    for (let i = 0; i < n; i++) if (i % 2 === 0) { const u = (i + 0.5) / n - 0.5; G.stone.box([along ? cx : cx + u * w, h + 0.45, along ? cz + u * l : cz], [along ? w : 0.8, 0.9, along ? 0.8 : l], { col: c }); }
    col(x0, x1, z0, z1, h);
  }
  function drum(x, z, r, h) { G.stone.cyl([x, 0, z], r, h, 14, { col: SC2 }); G.stone.cyl([x, h, z], r + 0.25, 1.0, 14, { col: SC }); col(x - r, x + r, z - r, z + r, h); }
  wall(-15, -12, -10, 58, 9);
  for (const z of [6, 24, 42]) drum(-12.5, z, 2.6, 11);
  // rockfall behind the start
  for (let x = -12; x < 13; x += R(1.6, 2.6)) { const s = R(1.2, 2.2); G.chalk.box([x, s * 0.45, -9.6 + R(-0.5, 0.5)], [s * 1.5, s * 1.1, s * 1.3], { ry: R(0, 180), rx: R(-15, 15), col: [0.85, 0.84, 0.8, 1] }); }
  col(-12, 13, -10.6, -8.6, 3);

  // ---------- gatehouse (z 58-64) ----------
  wall(-30, -3.6, 58.5, 63.5, 10); wall(3.6, 30, 58.5, 63.5, 10);
  G.stone.box([0, 8.6, 61], [7.2, 2.8, 5], { col: SC }); // arch over the passage
  drum(-6.2, 60.5, 3.2, 13); drum(6.2, 60.5, 3.2, 13);
  glow.box([-6.2, 9, 57.25], [0.6, 1.2, 0.1], { col: [1, 1, 1, 1] }); glow.box([6.2, 9, 57.25], [0.6, 1.2, 0.1], { col: [1, 1, 1, 1] });
  W.fires.push({ pos: [-2.8, 0.4, 56.5], size: 0.8 }, { pos: [2.8, 0.4, 56.5], size: 0.8 }); // braziers at the gate

  // ---------- outer bailey (z 64-121) ----------
  wall(-21, -18, 63, 121, 8); wall(18, 21, 63, 121, 8);
  for (const z of [80, 100]) { drum(-18.5, z, 2.2, 10); drum(18.5, z, 2.2, 10); }
  (function pharos() { // the Roman lighthouse
    const x = 10.5, z = 97;
    G.brick.cyl([x, 0, z], 2.7, 9, 8, { col: [0.7, 0.62, 0.55, 1], r2: 2.4 });
    G.stone.cyl([x, 9, z], 2.4, 4.5, 8, { col: SC2, r2: 2.2 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; G.stone.box([x + Math.cos(a) * 2.45, 6 + (i % 2), z + Math.sin(a) * 2.45], [0.15, 1.2, 0.7], { ry: -a * 57.3, col: [0.12, 0.12, 0.12, 1] }); }
    col(x - 2.7, x + 2.7, z - 2.7, z + 2.7, 13);
  })();
  (function church() { // St Mary in Castro
    const x = -10.5, z = 84;
    G.stone.box([x, 3.5, z], [6.5, 7, 15], { col: SC }); G.stone.box([x, 7.6, z], [5.4, 1.4, 14.4], { col: [0.4, 0.36, 0.33, 1], rz: 0 });
    G.stone.box([x, 6.5, z + 9.5], [6, 13, 5.5], { col: SC2 }); // crossing tower
    for (const dz of [-4.5, 0, 4.5]) glow.box([x + 3.28, 3.6, z + dz], [0.05, 2.2, 0.8], { col: [1, 1, 1, 1] });
    col(x - 3.3, x + 3.3, z - 7.5, z + 12.3, 13);
  })();
  (function artillery() { // Pact gun emplacement aimed at the beach
    const x = 7.5, z = 74;
    G.ground.cyl([x, 0, z], 3.6, 0.6, 16, { col: [0.62, 0.58, 0.46, 1] });
    G.metal.box([x, 1.3, z], [2.4, 1.4, 3.2], { col: [0.33, 0.35, 0.32, 1] });
    G.metal.cyl([x + 0.4, 1.8, z - 0.5], 0.22, 6.5, 10, { rz: -80, ry: 20, col: [0.3, 0.31, 0.3, 1] });
    for (let i = 0; i < 4; i++) G.metal.box([x - 1 + i * 0.66, 0.85, z + 1.8], [0.45, 0.25, 0.25], { col: [0.42, 0.13, 0.1, 1] });
    col(x - 2.6, x + 2.6, z - 2.6, z + 2.6, 2.5);
  })();
  function containers(x, z, n) { for (let i = 0; i < n; i++) { const c = [[0.42, 0.16, 0.12, 1], [0.32, 0.34, 0.3, 1], [0.48, 0.36, 0.14, 1]][i % 3]; G.metal.box([x, 1.3 + Math.floor(i / 2) * 2.6, z + (i % 2) * 2.6], [6, 2.6, 2.5], { col: c }); } col(x - 3, x + 3, z - 1.3, z + 1.3 + (n > 1 ? 2.6 : 0), 5); }
  containers(-13, 106, 3); containers(13, 111, 2);
  function sandbags(x, z, len, ry) {
    const a = ry * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    for (let r = 0; r < 3; r++) for (let i = 0; i < len; i++) { const o = (i - len / 2 + (r % 2) * 0.5) * 0.62; G.ground.box([x + ca * o, 0.18 + r * 0.3, z - sa * o], [0.6, 0.3, 0.42], { ry, col: [0.75, 0.68, 0.52, 1], aoBottom: 0.6 }); }
    const hl = len * 0.31 + 0.3; col(x - Math.abs(ca) * hl - 0.3, x + Math.abs(ca) * hl + 0.3, z - Math.abs(sa) * hl - 0.3, z + Math.abs(sa) * hl + 0.3, 1.0);
  }
  sandbags(-3, 30, 5, 0); sandbags(4, 52, 4, 0); sandbags(-4, 68, 5, 0); sandbags(2, 100, 5, 0);
  function wreck(x, z, ry) { // burnt-out Pact light vehicle
    G.metal.box([x, 0.75, z], [2.2, 1.0, 4.6], { ry, col: [0.25, 0.22, 0.2, 1] }); G.metal.box([x, 1.5, z], [1.9, 0.6, 2.2], { ry, col: [0.18, 0.16, 0.15, 1] });
    col(x - 1.8, x + 1.8, z - 2.4, z + 2.4, 1.8); W.fires.push({ pos: [x, 1.6, z], size: 1.0 });
  }
  wreck(5, 15, 20); wreck(-6, 48, -15); wreck(-1, 112, 70);
  for (const [x, z, r] of [[-2, 38, 2.0], [3, 86, 2.4], [-7, 96, 1.8]]) {
    G.ground.cyl([x, 0.0, z], r, 0.04, 20, { col: [0.13, 0.11, 0.1, 1], aoB: 1 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + R(0, 0.3); const s = R(0.2, 0.5); G.ground.box([x + Math.cos(a) * r, s * 0.25, z + Math.sin(a) * r], [s * 1.6, s * 0.5, s], { ry: -a * 57.3, col: [0.45, 0.4, 0.33, 1] }); }
  }
  // Pact comms mast with a blinking red light (their spotters)
  G.metal.cyl([-15, 0, 116], 0.14, 16, 6, { col: [0.3, 0.3, 0.32, 1] }); col(-15.8, -14.2, 115.2, 116.8, 16);
  const lampG = new OE.Geo(); lampG.sphere([-15, 16.2, 116], 0.2, 6, { col: [1, 1, 1, 1] });
  const lamp = new OE.Node(lampG.build(), { mode: 2, color: [0, 0, 0], emissive: [5, 0.3, 0.2] }); lamp.castShadow = false; OE.scene.add(lamp);
  W.sea = { update(dt, t) { lamp.mat.emissive = (t % 1.6) < 0.25 ? [6, 0.4, 0.25] : [0.4, 0.03, 0.02]; sea.pos = [0, Math.sin(t * 0.4) * 0.02, 0]; } };

  // ---------- the inner curtain and the Palace Gate (z 121-124) ----------
  wall(-30, -4.3, 121, 124, 9); wall(4.3, 30, 121, 124, 9);
  for (const s of [-1, 1]) G.stone.box([s * 4.3, 4.6, 122.5], [1.2, 9.2, 3.2], { col: SC2 });
  G.stone.box([0, 8.3, 122.5], [9.8, 1.4, 3.2], { col: SC });
  for (const s of [-1, 1]) { G.stone.box([s * 5.0, 2.5, 126], [1.2, 5, 6.5], { col: SC2 }); col(s * 4.4, s * 5.6, 122.8, 129.5, 5); }
  for (const s of [-1, 1]) { G.stone.box([s * 17, 2.2, 125], [24, 4.4, 1.2], { col: SC2 }); col(s * 5, s * 30, 124.4, 125.6, 4.4); }

  // ---------- inner bailey: Talina's arena ----------
  const nW = 26;
  for (let i = 0; i < nW; i++) {
    const a = i / nW * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < 0.22) continue;
    const x = A.c[0] + Math.cos(a) * (A.r + 2), z = A.c[2] + Math.sin(a) * (A.r + 2); const h = R(6, 9);
    G.stone.box([x, h / 2, z], [1.8, h, 5.2], { ry: -a * 180 / Math.PI, col: i % 2 ? SC : SC2 });
    G.stone.box([x, h + 0.4, z], [1.8, 0.8, 1.6], { ry: -a * 180 / Math.PI, col: SC });
  }
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < 0.2) continue;
    const x = A.c[0] + Math.cos(a) * (A.r + 2.2), z = A.c[2] + Math.sin(a) * (A.r + 2.2); col(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 3); }
  (function keep() { // the Great Tower
    const z = A.c[2] + A.r + 13;
    G.stone.box([0, 14, z], [26, 28, 20], { col: SC });
    for (const [dx, dz] of [[-13, -10], [13, -10], [-13, 10], [13, 10]]) G.stone.box([dx, 16, z + dz], [4.5, 32, 4.5], { col: SC2 });
    for (let i = 0; i < 9; i++) G.stone.box([-11 + i * 2.75, 28.6, z - 10], [1.3, 1.2, 1.0], { col: SC });
    G.stone.box([-7, 6, z - 11.5], [9, 12, 5], { col: SC2 }); // forebuilding
    for (const dx of [-6, 0, 6]) glow.box([dx, 17, z - 10.05], [1.0, 2.4, 0.05], { col: [1, 1, 1, 1] });
    G.metal.box([4, 30.5, z], [0.15, 5, 0.15], { col: [0.3, 0.3, 0.3, 1] });
    G.metal.box([5.3, 32, z], [2.4, 1.4, 0.05], { col: [0.5, 0.12, 0.1, 1] }); // Pact banner on the keep
  })();
  for (let i = 0; i < 6; i++) { // braziers around the courtyard
    const a = -Math.PI / 2 + 0.55 + i * (Math.PI * 2 - 1.1) / 5, x = A.c[0] + Math.cos(a) * (A.r - 1.2), z = A.c[2] + Math.sin(a) * (A.r - 1.2);
    G.metal.cyl([x, 0, z], 0.1, 1.0, 6, { col: [0.2, 0.2, 0.2, 1] }); G.metal.cyl([x, 1.0, z], 0.35, 0.3, 10, { col: [0.25, 0.22, 0.2, 1], r2: 0.45 });
    W.fires.push({ pos: [x, 1.35, z], size: 0.7 });
  }

  // ---------- meshes ----------
  for (const k in G) { const n = new OE.Node(G[k].build(), mats[k]); OE.scene.add(n); }
  const gw = new OE.Node(glow.build(), { mode: 2, color: [0, 0, 0], emissive: [2.6, 1.2, 0.45] }); gw.castShadow = false; OE.scene.add(gw);

  // ---------- beacons & fog gate ----------
  W.beacons = [W.makeBeacon([-6.5, 0, 3], 'Cliff Road'), W.makeBeacon([4, 0, 92], 'Roman Lighthouse')];
  const fg = new OE.Geo(); fg.box([0, 3.6, 120.9], [7.4, 7.2, 0.15], { col: [1, 1, 1, 1] });
  W.gate = { node: new OE.Node(fg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.85, 0.75, 0.95], alpha: 0.35, doubleSided: true }), z: 120.9, open: false, sealed: false,
    zone: [-4, 4, 117.5, 121], enter: [0, 127.6], thomas: [1.6, 126.9], fx: [-3.5, 3.5, 6.5] };
  W.gate.node.castShadow = false; OE.scene.add(W.gate.node);
  W.gateCol = { x0: -4.3, x1: 4.3, z0: 120.6, z1: 121.2, h: 8, gate: true }; W.colliders.push(W.gateCol);
  W.sealCol = { x0: -4, x1: 4, z0: 125.6, z1: 126.4, h: 8, gate: true, off: true }; W.colliders.push(W.sealCol);
};
})();
