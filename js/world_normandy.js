/* World: the Normandy bocage, June 2091 — Chapter III.
   From the American lines, sunken lanes run north between high hedgerows, through open fields and an apple orchard,
   into a Norman village, and on to the church square where the duel is fought. Summer morning, clear sky. */
(function () {
'use strict';
const rnd = OE.rng(1944);
const R = (a, b) => a + (b - a) * rnd();

W.builders[3] = function () {
  const T = W.textures();
  const mats = {
    stone: W.tri(T.concrete, 0.3, 0.9, 0), metal: W.tri(T.metal, 0.6, 0.55, 0.55), ground: W.tri(T.ground, 0.2, 0.95, 0),
    leaf: W.tri(T.ground, 0.6, 0.85, 0), brick: W.tri(T.brick, 0.3, 0.9, 0),
  };
  const G = {}; for (const k in mats) G[k] = new OE.Geo();
  const glow = new OE.Geo();
  const col = (x0, x1, z0, z1, h = 10) => W.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h });
  const STONE = [0.86, 0.8, 0.68, 1], STONE2 = [0.78, 0.72, 0.6, 1], SLATE = [0.3, 0.31, 0.34, 1], GREEN = [0.3, 0.46, 0.18, 1], GREEN2 = [0.24, 0.38, 0.14, 1];
  W.ambience = 'summer';
  W.arena = { c: [0, 0, 150], r: 19 };
  W.bounds = [-30, 30, -8.5, 180];
  const A = W.arena;

  // ---------- ground: meadow, lanes ----------
  G.ground.box([0, -0.5, 85], [120, 1, 240], { col: [0.5, 0.66, 0.32, 1], aoBottom: 1 });
  G.ground.box([0, 0.01, 58], [8, 0.03, 132], { col: [0.62, 0.52, 0.38, 1], aoBottom: 1 }); // the dirt lane
  G.stone.cyl([0, -0.005, 150], 20, 0.04, 36, { col: [0.72, 0.68, 0.6, 1], aoB: 1 }); // the church square's cobbles
  G.stone.box([0, 0.012, 101], [9, 0.03, 38], { col: [0.66, 0.62, 0.55, 1], aoBottom: 1 }); // village street

  // ---------- hedgerows: earth bank + thick hedge ----------
  function hedge(x0, z0, x1, z1, h = 3.2) {
    const along = Math.abs(z1 - z0) > Math.abs(x1 - x0), len = along ? Math.abs(z1 - z0) : Math.abs(x1 - x0);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    G.ground.box([cx, 0.45, cz], along ? [1.8, 0.9, len] : [len, 0.9, 1.8], { col: [0.52, 0.42, 0.3, 1], aoBottom: 0.8 });
    for (let u = 0; u < len; u += R(1.1, 1.8)) {
      const p = along ? [cx + R(-0.3, 0.3), 0, Math.min(z0, z1) + u] : [Math.min(x0, x1) + u, 0, cz + R(-0.3, 0.3)];
      const s = R(1.0, 1.6), hh = R(h - 0.8, h + 0.4);
      G.leaf.sphere([p[0], 0.9 + hh * 0.45, p[2]], s, 7, { col: rnd() < 0.5 ? GREEN : GREEN2, sy: hh / (s * 2) + 0.2 });
      if (rnd() < 0.12) { G.ground.cyl([p[0], 0.8, p[2]], 0.12, h + 1.2, 6, { col: [0.32, 0.25, 0.18, 1] }); G.leaf.sphere([p[0], h + 2.1, p[2]], R(1.2, 1.8), 7, { col: GREEN }); } // a tree in the hedge
    }
    if (along) col(cx - 1.1, cx + 1.1, Math.min(z0, z1), Math.max(z0, z1), h); else col(Math.min(x0, x1), Math.max(x0, x1), cz - 1.1, cz + 1.1, h);
  }
  // the first lane (z -8 .. 44): hedges both sides, gaps into the fields
  hedge(-7.5, -9, -7.5, 16); hedge(-7.5, 21, -7.5, 44); hedge(7.5, -9, 7.5, 28); hedge(7.5, 33, 7.5, 44);
  hedge(-24, -9, -24, 44); hedge(24, -9, 24, 44); // outer field hedges
  hedge(-24, 44, -3.2, 44); hedge(3.2, 44, 24, 44); // the cross hedge with its gate
  hedge(-12, -9.5, 12, -9.5, 2.6); // behind the start
  // the fields beyond (z 44 .. 82)
  hedge(-24, 44, -24, 82); hedge(24, 44, 24, 82);
  hedge(-24, 82, -9, 82, 2.8); hedge(9, 82, 24, 82, 2.8);
  // field gate posts at the cross hedge
  for (const s of [-1, 1]) G.ground.cyl([s * 3.1, 0, 44], 0.14, 1.6, 6, { col: [0.36, 0.28, 0.2, 1] });
  G.metal.box([4.6, 0.8, 45.2], [2.8, 0.1, 0.1], { ry: 50, col: [0.3, 0.26, 0.2, 1] }); // swung-open gate

  // ---------- the American lines at the start ----------
  function tank(x, z, ry, wreck) { // allied main battle tank (olive drab), or a burnt-out one
    const c = wreck ? [0.2, 0.19, 0.17, 1] : [0.34, 0.37, 0.24, 1], c2 = wreck ? [0.16, 0.15, 0.13, 1] : [0.28, 0.31, 0.2, 1];
    const m = OE.M4.create(), q = OE.Q.create(); OE.Q.euler(q, 0, ry, 0); OE.M4.fromRTS(m, q, [x, 0, z], [1, 1, 1]); const P = (a, b, cc) => OE.M4.point([0, 0, 0], m, [a, b, cc]);
    G.metal.box(P(0, 0.75, 0), [3.4, 1.0, 7.2], { ry, col: c });
    for (const s of [-1, 1]) G.metal.box(P(s * 1.75, 0.55, 0), [0.6, 1.1, 7.4], { ry, col: [0.15, 0.15, 0.14, 1] }); // tracks
    G.metal.box(P(0, 1.65, -0.5), [2.6, 0.8, 3.4], { ry, col: c2 }); // turret
    G.metal.cyl(P(0, 1.7, 1.0), 0.12, 4.2, 8, { rx: 90, ry, col: c2 });
    if (!wreck) glow.box(P(0, 1.66, -2.2), [0.6, 0.05, 0.02], { ry, col: [1, 1, 1, 1] });
    if (!wreck) { G.metal.box(P(1.2, 1.7, -0.5), [0.02, 0.5, 0.5], { ry, col: [0.92, 0.92, 0.9, 1] }); } // white star panel
    col(x - 2.4, x + 2.4, z - 3.9, z + 3.9, 2.4);
    if (wreck) W.fires.push({ pos: P(0, 2.1, -0.3), size: 1.1 });
  }
  tank(13.5, 4, -8, false); tank(-14.5, 12, 6, false);
  function sandbags(x, z, len, ry) {
    const a = ry * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    for (let r = 0; r < 3; r++) for (let i = 0; i < len; i++) { const o = (i - len / 2 + (r % 2) * 0.5) * 0.62; G.ground.box([x + ca * o, 0.18 + r * 0.3, z - sa * o], [0.6, 0.3, 0.42], { ry, col: [0.72, 0.66, 0.5, 1], aoBottom: 0.6 }); }
    const hl = len * 0.31 + 0.3; col(x - Math.abs(ca) * hl - 0.3, x + Math.abs(ca) * hl + 0.3, z - Math.abs(sa) * hl - 0.3, z + Math.abs(sa) * hl + 0.3, 1.0);
  }
  sandbags(3.5, 12, 4, 0); sandbags(-3.5, 32, 4, 0); sandbags(3, 70, 5, 0);

  // ---------- the fields: hay, a wrecked Pact walker, a burnt-out tank, craters ----------
  for (const [x, z] of [[-15, 8], [-18, 26], [16, 20], [14, 36], [-12, 58], [18, 66], [-19, 74]]) { G.ground.cyl([x, 0, z], 0.8, 1.1, 12, { rz: 90, ry: R(0, 180), col: [0.86, 0.74, 0.42, 1] }); col(x - 0.9, x + 0.9, z - 0.9, z + 0.9, 1.1); }
  (function walkerWreck(x, z) { // a Pact war machine lying where it fell
    G.metal.box([x, 1.0, z], [2.6, 2.0, 3.4], { ry: 30, rz: 18, col: [0.3, 0.29, 0.3, 1] });
    G.metal.box([x + 2.2, 0.5, z + 1.4], [0.7, 0.7, 3.6], { ry: 60, rx: 8, col: [0.26, 0.25, 0.26, 1] });
    G.metal.box([x - 1.8, 0.45, z - 1.6], [0.6, 0.6, 3.2], { ry: -20, col: [0.26, 0.25, 0.26, 1] });
    glow.box([x - 0.2, 1.4, z + 1.55], [0.6, 0.15, 0.05], { ry: 30, col: [1, 1, 1, 1] });
    col(x - 2.2, x + 2.2, z - 2.2, z + 2.2, 2); W.fires.push({ pos: [x, 2.1, z], size: 1.0 });
  })(9, 56);
  tank(-8, 66, 20, true);
  for (const [x, z, r] of [[2, 26, 1.8], [-3, 52, 2.2], [5, 76, 2.0]]) {
    G.ground.cyl([x, 0.0, z], r, 0.04, 20, { col: [0.2, 0.17, 0.12, 1], aoB: 1 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + R(0, 0.3), s = R(0.2, 0.5); G.ground.box([x + Math.cos(a) * r, s * 0.25, z + Math.sin(a) * r], [s * 1.6, s * 0.5, s], { ry: -a * 57.3, col: [0.48, 0.4, 0.28, 1] }); }
  }
  // apple orchard on the left
  for (let z = 50; z < 80; z += 5.5) for (let x = -21; x < -11; x += 5) {
    const px = x + R(-0.6, 0.6), pz = z + R(-0.6, 0.6);
    G.ground.cyl([px, 0, pz], 0.16, 1.8, 6, { col: [0.36, 0.28, 0.2, 1] });
    G.leaf.sphere([px, 2.6, pz], R(1.4, 1.8), 8, { col: [0.32, 0.5, 0.2, 1], sy: 0.75 });
    for (let i = 0; i < 4; i++) glow.sphere([px + R(-1.1, 1.1), 2.4 + R(-0.4, 0.5), pz + R(-1.1, 1.1)], 0.07, 4, { col: [1, 1, 1, 1] }); // apples catching the light
    col(px - 0.4, px + 0.4, pz - 0.4, pz + 0.4, 2);
  }

  // ---------- the village (z 82 .. 121) ----------
  function house(x, z, w, l, h, ry, burning) { // Norman stone farmhouse with a slate roof
    const cA = rnd() < 0.5 ? STONE : STONE2;
    G.stone.box([x, h / 2, z], [w, h, l], { ry, col: cA });
    const ang = 45, rl = (w / 2) / Math.cos(ang * Math.PI / 180) + 0.3; // gable roof along its length
    for (const s of [-1, 1]) {
      const a = ry * Math.PI / 180, ox = Math.cos(a) * s * w * 0.25, oz = -Math.sin(a) * s * w * 0.25;
      G.metal.box([x + ox, h + w * 0.25 + 0.1, z + oz], [rl, 0.22, l + 0.6], { ry, rz: -s * ang, col: SLATE });
    }
    const g = w / Math.SQRT2; G.stone.box([x, h, z], [g, g, l - 0.05], { ry, rz: 45, col: cA }); // fills the gable ends
    const cx = rnd() < 0.5 ? 1 : -1, a2 = ry * Math.PI / 180, ch = w * 0.5 + 0.9; // chimney, standing on the wall line and up through the roof
    G.brick.box([x + Math.cos(a2) * cx * w * 0.3 + Math.sin(a2) * l * 0.3, h + ch / 2, z - Math.sin(a2) * cx * w * 0.3 + Math.cos(a2) * l * 0.3], [0.7, ch, 0.7], { ry, col: [0.6, 0.4, 0.32, 1] });
    for (let i = 0; i < Math.floor(l / 2.6); i++) for (const s of [-1, 1]) { // windows on the long sides
      const a = ry * Math.PI / 180, lz = -l / 2 + 1.4 + i * 2.6, lx = s * (w / 2 + 0.03);
      glow.box([x + Math.cos(a) * lx + Math.sin(a) * lz, h * 0.55, z - Math.sin(a) * lx + Math.cos(a) * lz], [0.05, 0.8, 0.6], { ry, col: [1, 1, 1, 1] });
    }
    const hw = Math.abs(Math.cos(ry * Math.PI / 180)) * w / 2 + Math.abs(Math.sin(ry * Math.PI / 180)) * l / 2, hl = Math.abs(Math.sin(ry * Math.PI / 180)) * w / 2 + Math.abs(Math.cos(ry * Math.PI / 180)) * l / 2;
    col(x - hw, x + hw, z - hl, z + hl, h + 2);
    if (burning) W.fires.push({ pos: [x, h + 1, z], size: 1.4 });
  }
  house(-10.5, 90, 7, 9, 4.2, 0, false); house(10.5, 92, 7, 11, 4.4, 0, true); house(-11, 104, 7, 9, 4.0, 0, false); house(11, 108, 7, 10, 4.6, 0, false);
  house(-11.5, 116, 7, 7, 4.2, 0, true); house(11.5, 117.5, 6, 6, 4.0, 0, false);
  for (const s of [-1, 1]) { G.stone.box([s * 18, 0.7, 101], [0.8, 1.4, 38], { col: STONE2 }); col(s * 18 - 0.4, s * 18 + 0.4, 82, 121, 1.4); } // low stone walls behind the houses
  // the village pump and a stalled Pact supply truck
  G.stone.box([-4.6, 0.6, 98], [1.0, 1.2, 1.0], { col: STONE }); G.metal.cyl([-4.6, 1.2, 98], 0.08, 0.9, 6, { col: [0.2, 0.2, 0.22, 1] }); col(-5.2, -4, 97.4, 98.6, 1.2);
  G.metal.box([4.4, 1.2, 102], [2.4, 2.2, 5.6], { col: [0.3, 0.32, 0.28, 1] }); G.metal.box([4.4, 1.0, 105.6], [2.3, 1.6, 1.8], { col: [0.26, 0.28, 0.24, 1] }); col(3.1, 5.7, 99, 106.6, 2.4);
  for (let i = 0; i < 6; i++) G.metal.box([2.9 + i * 0.6, 2.2, 99.4], [0.4, 0.2, 0.1], { col: [0.42, 0.13, 0.1, 1] });

  // ---------- the gate into the square (z 121-124) ----------
  for (const s of [-1, 1]) { G.stone.box([s * 17, 2.6, 122.5], [26, 5.2, 3], { col: STONE2 }); col(s * 4.3, s * 30, 121, 124, 5.2); }
  for (const s of [-1, 1]) G.stone.box([s * 4.3, 3.6, 122.5], [1.2, 7.2, 3.2], { col: STONE });
  G.stone.box([0, 7.0, 122.5], [9.8, 1.0, 3.2], { col: STONE });
  for (const s of [-1, 1]) { G.stone.box([s * 5.0, 2.5, 126], [1.2, 5, 6.5], { col: STONE2 }); col(s * 4.4, s * 5.6, 122.8, 129.5, 5); }
  for (const s of [-1, 1]) { col(s * 5, s * 30, 124.4, 125.6, 4.4); }

  // ---------- the church square (Talina's arena) ----------
  const nH = 12;
  for (let i = 0; i < nH; i++) { // houses round the square, the church on the far side
    const a = i / nH * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < 0.4 || Math.abs(OE.angDiff(a, Math.PI / 2)) < 0.5) continue;
    const d = A.r + 6, x = A.c[0] + Math.cos(a) * d, z = A.c[2] + Math.sin(a) * d;
    house(x, z, 7, 8, R(4.4, 6), -a * 180 / Math.PI + 90, i === 3);
  }
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < 0.2) continue;
    const x = A.c[0] + Math.cos(a) * (A.r + 2.2), z = A.c[2] + Math.sin(a) * (A.r + 2.2); col(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 1.2); }
  (function church() {
    const z = A.c[2] + A.r + 10;
    G.stone.box([0, 5, z + 6], [10, 10, 22], { col: STONE });
    for (const s of [-1, 1]) G.metal.box([s * 2.6, 11.6, z + 6], [6.8, 0.3, 22.6], { rz: -s * 40, col: SLATE });
    G.stone.box([0, 9, z - 6], [6, 18, 6], { col: STONE2 }); // the tower
    G.metal.cyl([0, 18, z - 6], 3.6, 12, 8, { r2: 0.1, col: SLATE }); // the spire
    G.metal.box([0, 30.6, z - 6], [0.12, 1.6, 0.12], { col: [0.3, 0.28, 0.24, 1] }); G.metal.box([0, 30.8, z - 6], [0.9, 0.12, 0.12], { col: [0.3, 0.28, 0.24, 1] });
    glow.box([0, 6, z - 9.05], [1.6, 3.2, 0.05], { col: [1, 1, 1, 1] }); // rose window / door light
    glow.cyl([0, 13.5, z - 9.06], 0.9, 0.05, 12, { rx: 90, col: [1, 1, 1, 1] });
  })();
  for (let i = 0; i < 6; i++) { // street lamps round the square (unlit in the day), and flower boxes
    const a = -Math.PI / 2 + 0.55 + i * (Math.PI * 2 - 1.1) / 5, x = A.c[0] + Math.cos(a) * (A.r - 1.0), z = A.c[2] + Math.sin(a) * (A.r - 1.0);
    G.metal.cyl([x, 0, z], 0.07, 3.6, 6, { col: [0.16, 0.16, 0.17, 1] }); G.metal.box([x, 3.7, z], [0.4, 0.5, 0.4], { col: [0.16, 0.16, 0.17, 1] });
  }
  W.fires.push({ pos: [9, 0.4, 135], size: 0.8 }, { pos: [-12, 0.4, 164], size: 0.9 });

  // ---------- meshes ----------
  for (const k in G) { const n = new OE.Node(G[k].build(), mats[k]); OE.scene.add(n); }
  const gw = new OE.Node(glow.build(), { mode: 2, color: [0, 0, 0], emissive: [0.32, 0.28, 0.22] }); // dark window glass by day gw.castShadow = false; OE.scene.add(gw);

  // ---------- beacons & fog gate ----------
  W.beacons = [W.makeBeacon([-5, 0, 3], 'American Lines'), W.makeBeacon([-4.5, 0, 86], 'The Orchard Gate')];
  const fg = new OE.Geo(); fg.box([0, 3.4, 121], [7.4, 6.8, 0.15], { col: [1, 1, 1, 1] });
  W.gate = { node: new OE.Node(fg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.55, 0.5, 0.42], alpha: 0.3, doubleSided: true }), z: 121, open: false, sealed: false,
    zone: [-4, 4, 117.5, 121], enter: [0, 127.6], thomas: [1.6, 126.9], fx: [-3.5, 3.5, 6.3] };
  W.gate.node.castShadow = false; OE.scene.add(W.gate.node);
  W.gateCol = { x0: -4.3, x1: 4.3, z0: 120.6, z1: 121.2, h: 8, gate: true }; W.colliders.push(W.gateCol);
  W.sealCol = { x0: -4, x1: 4, z0: 125.6, z1: 126.4, h: 8, gate: true, off: true }; W.colliders.push(W.sealCol);
};
})();
