/* World: the beach under the white cliffs of Dover, December 2090 — Chapter II.
   The shingle runs north between the chalk cliffs (west) and the Channel (east), past beached Pact
   landing craft and old WW2 defences, to the landing zone where the Tidebreaker guards the beachhead. */
(function () {
'use strict';
const rnd = OE.rng(1940);
const R = (a, b) => a + (b - a) * rnd();

W.builders['2b'] = function () {
  const T = W.textures();
  if (!T.chalk) T.chalk = OE.proceduralTex('chalk', 512);
  if (!T.shingle) T.shingle = OE.proceduralTex('shingle', 512);
  const mats = {
    chalk: W.tri(T.chalk, 0.045, 0.95, 0), shingle: W.tri(T.shingle, 0.75, 0.88, 0),
    concrete: W.tri(T.concrete, 0.22, 0.92, 0), metal: W.tri(T.metal, 0.6, 0.55, 0.55), ground: W.tri(T.ground, 0.18, 0.95, 0),
  };
  const G = {}; for (const k in mats) G[k] = new OE.Geo();
  const glow = new OE.Geo();
  const col = (x0, x1, z0, z1, h = 10) => W.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h });
  W.ambience = 'rain';
  W.arena = { c: [-5, 0, 150], r: 20 };
  W.bounds = [-30, 30, -8.5, 182];
  const A = W.arena;

  // ---------- beach & sea ----------
  G.shingle.box([10, -0.5, 85], [130, 1, 250], { col: [1, 1, 1, 1], aoBottom: 1 });
  G.shingle.box([16.5, 0.004, 85], [5, 0.01, 250], { col: [0.55, 0.55, 0.58, 1], aoBottom: 1 }); // wet shingle at the waterline
  G.shingle.box([-4, 0.006, 150], [44, 0.01, 44], { col: [0.78, 0.76, 0.74, 1], aoBottom: 1 }); // trampled landing zone
  const seaG = new OE.Geo(); seaG.box([92, -0.08, 85], [148, 0.2, 420], { col: [1, 1, 1, 1] });
  const sea = new OE.Node(seaG.build(), { mode: 2, color: [0.05, 0.085, 0.1], rough: 0.16, metal: 0.15 }); sea.castShadow = false; OE.scene.add(sea);
  const foam = [];
  for (const [x, w, a] of [[17.6, 1.4, 0.55], [20.5, 0.8, 0.3], [24, 0.6, 0.18]]) {
    const fg = new OE.Geo(); fg.box([x, 0.035, 85], [w, 0.02, 420], { col: [1, 1, 1, 1] });
    const n = new OE.Node(fg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.55, 0.6, 0.66], alpha: a, doubleSided: true }); n.castShadow = false; OE.scene.add(n);
    foam.push({ n, a, ph: rnd() * 6 });
  }
  W.sea = { update(dt, t) { for (const f of foam) { const s = Math.sin(t * 0.55 + f.ph); f.n.pos = [s * 0.9, 0, 0]; f.n.mat.alpha = f.a * (0.55 + 0.45 * (0.5 + 0.5 * s)); } sea.pos = [0, Math.sin(t * 0.4) * 0.015, 0]; } };
  col(15.5, 60, -20, 210, 0.5); // the sea (low, so it never blocks the camera)

  // ---------- the white cliffs ----------
  const faceX = (z) => z < 121 ? -12 : -28;
  for (let z = -24; z < 206; z += R(5, 8)) {
    const fx = faceX(z) - R(0, 1.6), d = R(8, 16), h = R(26, 38), len = R(7, 11);
    G.chalk.box([fx - d / 2, h / 2, z], [d, h, len], { ry: R(-7, 7), col: [1, 1, 1, 1], aoBottom: 0.7 });
    if (rnd() < 0.6) G.chalk.box([fx - R(0, 1), R(4, h * 0.7), z + R(-2, 2)], [R(1.2, 2.6), R(4, 12), R(2, 5)], { ry: R(-20, 20), rz: R(-6, 6), col: [0.95, 0.95, 0.93, 1] }); // buttresses
    G.ground.box([fx - d / 2 - 0.5, h + 0.25, z], [d + 2, 0.6, len + 1], { col: [0.32, 0.42, 0.22, 1] }); // grass cap
  }
  G.chalk.box([-40, 15, 98], [26, 30, 240], { col: [0.9, 0.9, 0.88, 1] }); // cliff mass behind the face
  col(-60, -11.6, -30, 121, 30); col(-60, -27.4, 121, 210, 30);
  // chalk fall at the foot of the cliff
  for (let i = 0; i < 46; i++) {
    const z = R(-6, 118), s = R(0.4, 1.4), x = faceX(z) + R(0.3, 2.4);
    G.chalk.box([x, s * 0.35, z], [s * 1.4, s * 0.9, s * 1.2], { rx: R(-25, 25), ry: R(0, 180), rz: R(-25, 25), col: [0.92, 0.91, 0.88, 1] });
    if (s > 1) col(x - s * 0.6, x + s * 0.6, z - s * 0.6, z + s * 0.6, s * 0.8);
  }
  // rockfall closing the beach behind the start
  for (let x = -12; x < 16; x += R(1.6, 2.6)) { const s = R(1.2, 2.4); G.chalk.box([x, s * 0.45, -9.6 + R(-0.5, 0.5)], [s * 1.5, s * 1.1, s * 1.3], { ry: R(0, 180), rx: R(-15, 15), col: [0.9, 0.9, 0.87, 1] }); }
  col(-12, 16, -10.6, -8.6, 3);

  // ---------- Dover Castle on the clifftop ----------
  (function castle() {
    const g = G.concrete, c = [0.72, 0.68, 0.6, 1], x = -64, z = 74, y = 33;
    g.box([x, y + 8, z], [16, 16, 16], { col: c });
    for (const [dx, dz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) g.box([x + dx, y + 10, z + dz], [4, 20, 4], { col: c });
    for (const [dx, dz, w, l] of [[0, -22, 44, 3], [0, 22, 44, 3], [22, 0, 3, 44], [-22, 0, 3, 44]]) g.box([x + dx, y + 3.5, z + dz], [w, 7, l], { col: [0.68, 0.64, 0.57, 1] });
    for (const [dx, dz] of [[22, -22], [22, 22], [22, 8], [22, -8]]) G.concrete.cyl([x + dx, y, z + dz], 2.4, 10, 10, { col: c });
    g.box([x + 3, y + 16.5, z - 3], [0.2, 5, 0.2], { col: [0.3, 0.3, 0.3, 1] }); // flag mast
    glow.box([x + 8.1, y + 9, z + 2], [0.1, 1.6, 1], { col: [1, 1, 1, 1] });
    W.fires.push({ pos: [x + 6, y + 16.2, z + 4], size: 1.6, far: true });
  })();

  // ---------- props ----------
  function hedgehog(x, z, ry = 0) { // Czech hedgehog anti-tank obstacle
    const c = [0.34, 0.3, 0.27, 1];
    G.metal.box([x, 0.62, z], [2.1, 0.2, 0.2], { ry, rz: 40, col: c });
    G.metal.box([x, 0.62, z], [2.1, 0.2, 0.2], { ry: ry + 90, rz: -40, col: c });
    G.metal.box([x, 0.62, z], [0.2, 1.5, 0.2], { ry, rx: 35, col: c });
    col(x - 0.75, x + 0.75, z - 0.75, z + 0.75, 1.2);
  }
  for (const [x, z, r] of [[5, 12, 10], [9.5, 15, 50], [12.5, 24, 5], [3.5, 30, 70], [13.5, 45, 20], [6.5, 54, 35], [11, 61, 0], [13, 70, 60],
    [4.5, 76, 15], [12, 84, 40], [7.5, 95, 80], [13.5, 104, 25], [3, 112, 55], [11, 116, 10]]) hedgehog(x, z, r);
  // arena edge: a broken line of hedgehogs along the surf
  for (let i = 0; i < 9; i++) { const a = -0.95 + i * 0.27; hedgehog(A.c[0] + Math.cos(a) * (A.r + 0.8), A.c[2] + Math.sin(a) * (A.r + 0.8), i * 23); }

  function groyne(z) { // wooden breakwater running into the sea
    const c = [0.3, 0.22, 0.15, 1];
    G.metal.box([14, 0.42, z], [20, 0.85, 0.35], { col: c, aoBottom: 0.6 });
    for (let x = 4.5; x < 24; x += 2.2) G.metal.box([x, 0.55, z + 0.25], [0.28, 1.1, 0.28], { col: [0.24, 0.18, 0.12, 1] });
    col(4, 24, z - 0.35, z + 0.35, 0.9);
  }
  groyne(19); groyne(51); groyne(87);

  function landingCraft(x, z, ry, fire) { // small beached Pact landing craft, wrecked
    const m = OE.M4.create(), q = OE.Q.create(); OE.Q.euler(q, 0, ry, 0); OE.M4.fromRTS(m, q, [x, 0, z], [1, 1, 1]);
    const P = (a, b, c) => OE.M4.point([0, 0, 0], m, [a, b, c]); const c = [0.36, 0.38, 0.4, 1], g = G.metal;
    g.box(P(0, 0.9, 0), [5.4, 1.8, 12], { ry, col: c, rz: 4 });
    for (const s of [-1, 1]) g.box(P(s * 2.6, 2.2, -0.5), [0.25, 1.4, 11], { ry, col: c });
    g.box(P(0, 2.2, -6), [5.4, 1.4, 0.3], { ry, col: c });
    g.box(P(0.3, 0.7, 7.4), [5, 0.25, 3.6], { ry, rx: 22, col: [0.3, 0.32, 0.34, 1] }); // dropped ramp
    g.box(P(-1.2, 3.6, -4.8), [2, 1.6, 1.8], { ry, col: [0.3, 0.3, 0.32, 1] }); // wheelhouse
    glow.box(P(-1.2, 3.8, -3.88), [1.4, 0.3, 0.05], { col: [1, 1, 1, 1], ry });
    const r = 3.2; col(x - r, x + r, z - 6.2, z + 6.2, 3); // (rotations are small: an axis-aligned box is close enough)
    if (fire) W.fires.push({ pos: P(0.5, 1.9, -1.5), size: 1.2 });
  }
  landingCraft(11.5, 34, -14, true); landingCraft(10.5, 99, 12, true);

  function pillbox(x, z) { // WW2 hexagonal pillbox
    G.concrete.cyl([x, 0, z], 2.3, 2.1, 6, { col: [0.62, 0.6, 0.55, 1] });
    G.concrete.cyl([x, 2.1, z], 2.7, 0.45, 6, { col: [0.58, 0.56, 0.52, 1] });
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI * 2; G.metal.box([x + Math.cos(a) * 2.22, 1.4, z + Math.sin(a) * 2.22], [0.12, 0.25, 0.9], { ry: -a * 57.3, col: [0.05, 0.05, 0.05, 1] }); }
    col(x - 2.3, x + 2.3, z - 2.3, z + 2.3, 2.5);
  }
  pillbox(-8.2, 60); pillbox(-8.6, 97);
  // WW2 bunker by the start
  G.concrete.box([-9.5, 1.3, -3], [4.5, 2.6, 5.5], { col: [0.6, 0.58, 0.54, 1] }); G.metal.box([-7.24, 1.6, -3], [0.06, 0.3, 2.4], { col: [0.05, 0.05, 0.05, 1] }); col(-11.8, -7.2, -5.8, -0.2, 2.6);

  function sandbags(x, z, len, ry) {
    const a = ry * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    for (let r = 0; r < 3; r++) for (let i = 0; i < len; i++) { const o = (i - len / 2 + (r % 2) * 0.5) * 0.62; G.ground.box([x + ca * o, 0.18 + r * 0.3, z - sa * o], [0.6, 0.3, 0.42], { ry, col: [0.62, 0.58, 0.46, 1], aoBottom: 0.6 }); }
    const hl = len * 0.31 + 0.3; col(x - Math.abs(ca) * hl - 0.3, x + Math.abs(ca) * hl + 0.3, z - Math.abs(sa) * hl - 0.3, z + Math.abs(sa) * hl + 0.3, 1.0);
  }
  sandbags(-2, 39, 6, 0); sandbags(4, 66, 5, 0); sandbags(-5, 108, 5, 0);
  function wire(x0, x1, z) { // barbed wire on stakes
    for (let x = x0; x <= x1; x += 1.6) G.metal.box([x, 0.5, z], [0.07, 1, 0.07], { col: [0.25, 0.22, 0.2, 1], rz: R(-8, 8) });
    for (const y of [0.35, 0.65, 0.9]) G.metal.box([(x0 + x1) / 2, y, z], [x1 - x0, 0.025, 0.025], { col: [0.3, 0.27, 0.24, 1] });
    col(x0, x1, z - 0.25, z + 0.25, 1);
  }
  wire(-11, -4, 28); wire(1, 8, 72); wire(-10, -3, 84);
  // craters
  for (const [x, z, r] of [[1, 24, 2.2], [-4, 52, 2.6], [5, 92, 2.0], [-1, 118, 1.8]]) {
    G.ground.cyl([x, 0.0, z], r, 0.04, 20, { col: [0.12, 0.11, 0.1, 1], aoB: 1 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + R(0, 0.3); const s = R(0.2, 0.5); G.shingle.box([x + Math.cos(a) * r, s * 0.25, z + Math.sin(a) * r], [s * 1.6, s * 0.5, s], { ry: -a * 57.3, col: [0.7, 0.68, 0.66, 1] }); }
  }
  function droneWreck(x, z, ry) { // downed Chinese heavy drone
    G.metal.sphere([x, 0.6, z], 1.25, 10, { col: [0.36, 0.37, 0.4, 1], sy: 0.6 });
    for (const s of [-1, 1]) G.metal.box([x + s * 1.9 * Math.cos(ry * 0.0175), 0.5 + s * 0.3, z - s * 1.9 * Math.sin(ry * 0.0175)], [2.4, 0.12, 1.1], { ry, rz: s * 18, col: [0.3, 0.31, 0.33, 1] });
    col(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 1.3);
    W.fires.push({ pos: [x + 0.2, 1.0, z], size: 0.9 });
  }
  droneWreck(-3.5, 15, 30); droneWreck(6.5, 81, -40);
  function containers(x, z, n, ry) { // Pact cargo containers
    for (let i = 0; i < n; i++) { const c = [[0.42, 0.16, 0.12, 1], [0.32, 0.34, 0.3, 1], [0.48, 0.36, 0.14, 1]][i % 3];
      G.metal.box([x, 1.3 + Math.floor(i / 2) * 2.6, z + (i % 2) * 2.6], [6, 2.6, 2.5], { ry, col: c }); }
    col(x - 3, x + 3, z - 1.3, z + 1.3 + (n > 1 ? 2.6 : 0), 5);
  }
  containers(-8.5, 42, 3, 0); containers(-8, 76, 2, 0); containers(6, 113, 3, 0);
  // Pact comms mast with a blinking red light
  G.metal.cyl([-9.5, 0, 118], 0.14, 14, 6, { col: [0.3, 0.3, 0.32, 1] }); G.metal.box([-9.5, 0.3, 118], [1.6, 0.6, 1.6], { col: [0.3, 0.3, 0.32, 1] }); col(-10.3, -8.7, 117.2, 118.8, 14);
  const lampG = new OE.Geo(); lampG.sphere([-9.5, 14.2, 118], 0.2, 6, { col: [1, 1, 1, 1] });
  const lamp = new OE.Node(lampG.build(), { mode: 2, color: [0, 0, 0], emissive: [5, 0.3, 0.2] }); lamp.castShadow = false; OE.scene.add(lamp);
  const seaUpd = W.sea.update; W.sea.update = (dt, t) => { seaUpd(dt, t); lamp.mat.emissive = (t % 1.6) < 0.25 ? [6, 0.4, 0.25] : [0.4, 0.03, 0.02]; };

  // ---------- the Pact landing ship (closes the beach before the landing zone) ----------
  (function ship() {
    const g = G.metal, c = [0.33, 0.35, 0.38, 1], dk = [0.22, 0.23, 0.25, 1];
    g.box([7.5, 3.2, 123], [17, 6.4, 8.5], { col: c });
    g.box([7.5, 7.0, 124], [15, 1.2, 7], { col: dk });
    g.box([11, 9.8, 124.5], [5, 4.4, 4], { col: c }); // bridge
    glow.box([11, 10.5, 122.45], [4, 0.6, 0.05], { col: [1, 1, 1, 1] });
    g.cyl([12.5, 12, 124.5], 0.12, 5, 6, { col: dk });
    for (let i = 0; i < 6; i++) g.box([0.5 + i * 2.8, 5.2, 118.8], [1.8, 0.5, 0.2], { col: [0.4, 0.13, 0.1, 1] }); // Pact red hull band
    col(-1.3, 16.5, 118.8, 127.5, 7);
    W.fires.push({ pos: [3, 6.6, 121.2], size: 1.1 }, { pos: [14, 6.6, 125], size: 0.9 });
  })();
  // west side of the gate: a chalk buttress
  G.chalk.box([-10.4, 5, 123], [3.6, 10, 4], { col: [0.95, 0.95, 0.92, 1] }); col(-12, -8.7, 121, 125, 10);
  G.concrete.box([-8.85, 4, 122], [0.5, 8, 0.6], { col: [0.7, 0.68, 0.64, 1] }); G.concrete.box([-1.15, 4, 122], [0.5, 8, 0.6], { col: [0.7, 0.68, 0.64, 1] });
  G.concrete.box([-5, 8.1, 122], [8.3, 0.4, 0.6], { col: [0.7, 0.68, 0.64, 1] });
  // walls between the gate and the landing zone
  for (const s of [-1, 1]) {
    const x = A.c[0] + s * 4.0;
    G.chalk.box([x, 2.5, 126], [1.4, 5, 6.5], { col: [0.92, 0.92, 0.9, 1] }); col(x - 0.6, x + 0.6, 122.8, 129.5, 5);
  }
  G.chalk.box([-19, 4, 124.6], [19, 8, 2], { col: [0.92, 0.92, 0.9, 1] }); col(-30, -9.6, 123.6, 125.6, 8);
  col(-0.4, 30, 123.6, 125.6, 7);

  // ---------- the landing zone ----------
  for (let i = 0; i < 44; i++) { // containment ring (the cliffs and surf show where it is)
    const a = i / 44 * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < 0.2) continue;
    const x = A.c[0] + Math.cos(a) * (A.r + 2.2), z = A.c[2] + Math.sin(a) * (A.r + 2.2); col(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 1.2);
  }
  // the Tidebreaker's carrier: a huge landing ship run aground, bow ramp down onto the beach
  (function carrier() {
    const g = G.metal, c = [0.31, 0.33, 0.36, 1], z = A.c[2] + A.r + 9;
    g.box([-4, 7, z + 8], [30, 14, 22], { col: c });
    g.box([-4, 15, z + 12], [22, 4, 12], { col: [0.26, 0.27, 0.3, 1] });
    g.box([-12, 21, z + 14], [7, 9, 6], { col: c });
    glow.box([-12, 23, z + 10.95], [5.5, 0.8, 0.05], { col: [1, 1, 1, 1] });
    for (const s of [-1, 1]) g.box([-4 + s * 9, 7, z - 3], [2.5, 14, 2], { col: c }); // bow doors, open
    g.box([-4, 2.4, z - 6], [14, 0.5, 13], { rx: -24, col: [0.28, 0.29, 0.31, 1] }); // ramp
    for (let i = 0; i < 9; i++) g.box([-15 + i * 3.4, 10.5, z - 2.9], [2.2, 0.6, 0.2], { col: [0.42, 0.13, 0.1, 1] });
    W.fires.push({ pos: [-14, 14.5, z + 2], size: 1.4 }, { pos: [6, 1, z - 9], size: 1.0 });
  })();
  // broken chalk along the cliff side of the zone
  for (let i = 0; i < 16; i++) { const a = R(Math.PI * 0.55, Math.PI * 1.35), d = R(16, 19.5), s = R(0.4, 1.1);
    G.chalk.box([A.c[0] + Math.cos(a) * d, s * 0.35, A.c[2] + Math.sin(a) * d], [s * 1.5, s * 0.8, s * 1.2], { ry: R(0, 180), rx: R(-20, 20), col: [0.92, 0.91, 0.88, 1] }); }
  W.fires.push({ pos: [-21, 0.4, 140], size: 0.9 }, { pos: [9, 0.4, 162], size: 1.0 });
  W.fires.push({ pos: [-6, 0.4, 70], size: 0.8 }, { pos: [9, 0.4, 47], size: 0.7 });

  // ---------- meshes ----------
  for (const k in G) { const n = new OE.Node(G[k].build(), mats[k]); OE.scene.add(n); }
  const gw = new OE.Node(glow.build(), { mode: 2, color: [0, 0, 0], emissive: [2.2, 1.2, 0.5] }); gw.castShadow = false; OE.scene.add(gw);

  // ---------- beacons ----------
  W.beacons = [W.makeBeacon([-7, 0, 3], 'Cliff Path'), W.makeBeacon([-4.5, 0, 92], 'Old Pillbox')];
  // ---------- fog gate ----------
  const fg = new OE.Geo(); fg.box([-5, 3.6, 122], [7.4, 7.2, 0.15], { col: [1, 1, 1, 1] });
  W.gate = { node: new OE.Node(fg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.8, 0.85, 0.9], alpha: 0.35, doubleSided: true }), z: 122, open: false, sealed: false,
    zone: [-8.5, -1.5, 118.5, 122], enter: [-5, 127.6], thomas: [-3.4, 126.9], fx: [-8.5, -1.5, 6.5] };
  W.gate.node.castShadow = false; OE.scene.add(W.gate.node);
  W.gateCol = { x0: -8.7, x1: -1.3, z0: 121.6, z1: 122.4, h: 8, gate: true }; W.colliders.push(W.gateCol);
  W.sealCol = { x0: -8.7, x1: -1.3, z0: 125.6, z1: 126.4, h: 8, gate: true, off: true }; W.colliders.push(W.sealCol);
};
})();
