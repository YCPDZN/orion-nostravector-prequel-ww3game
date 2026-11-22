/* World: Chapter V, spring 2095 — where the war ends.
   '5h' Harbin: Central Street's old Russian facades under Pact banners and neon, to the square before the Church of Saint Sophia.
   '5m' Moscow: a Stalinist boulevard in the rain, past the Manege, onto Red Square: the Kremlin wall, Spasskaya Tower, Saint Basil's.
   '5l' New London: the city of Chapter I, five years on, burning again. */
(function () {
'use strict';
function kit(seed) {
  const rnd = OE.rng(seed), R = (a, b) => a + (b - a) * rnd();
  const T = W.textures();
  const mats = { stone: W.tri(T.concrete, 0.3, 0.9, 0), metal: W.tri(T.metal, 0.6, 0.55, 0.55), ground: W.tri(T.ground, 0.25, 0.95, 0), brick: W.tri(T.brick, 0.32, 0.9, 0) };
  const G = {}; for (const k in mats) G[k] = new OE.Geo();
  const glows = {}, DARKG = new OE.Geo();
  const pick = (o) => { const c = (o && o.col) || [1, 1, 1, 1]; if (c[0] + c[1] + c[2] < 0.3) return DARKG; const k = c.slice(0, 3).join(','); return glows[k] || (glows[k] = new OE.Geo()); };
  const glow = { box: (p, sz, o) => pick(o).box(p, sz, Object.assign({}, o, { col: [1, 1, 1, 1] })), cyl: (p, r, h, n, o) => pick(o).cyl(p, r, h, n, Object.assign({}, o, { col: [1, 1, 1, 1] })),
    sphere: (p, r, n, o) => pick(o).sphere(p, r, n, Object.assign({}, o, { col: [1, 1, 1, 1] })) };
  const col = (x0, x1, z0, z1, h = 10) => W.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h });
  const DARK = [0.05, 0.05, 0.06, 1];
  const K = { rnd, R, G, glow, col };
  // a facade along the street: x is its front face, it extends away from the street (side -1 left, +1 right)
  K.facade = (side, z0, z1, h, c, opt = {}) => {
    const depth = 9, x = side * (opt.x || 12) + side * depth / 2, len = z1 - z0, zc = (z0 + z1) / 2;
    G[opt.mat || 'stone'].box([x, h / 2, zc], [depth, h, len], { col: c });
    G[opt.mat || 'stone'].box([side * (opt.x || 12) - side * 0.15, h - 0.4, zc], [0.5, 0.8, len], { col: opt.trim || c }); // cornice
    const fl = Math.floor((h - 1) / 3.2);
    for (let f = 0; f < fl; f++) for (let z = z0 + 1.6; z < z1 - 1; z += 2.6) {
      const lit = rnd() < (opt.lit ?? 0.25), y = 1.9 + f * 3.2, fx = side * (opt.x || 12) - side * 0.03;
      glow.box([fx, y, z], [0.05, opt.arch ? 1.7 : 1.4, 1.1], { col: lit ? (opt.warm || [1, 0.7, 0.4, 1]) : DARK });
      if (opt.arch) G.stone.cyl([fx - side * 0.02, y + 0.85, z], 0.56, 0.08, 10, { rz: 90, col: opt.trim || c });
    }
    col(side * (opt.x || 12) - (side < 0 ? depth : 0), side * (opt.x || 12) + (side > 0 ? depth : 0), z0, z1, h + 2);
  };
  K.dome = (p, r, c, opt = {}) => { // an onion dome on a drum, with a cross or star on top
    G.stone.cyl([p[0], p[1], p[2]], r * 0.75, r * 1.1, 14, { col: opt.drum || [0.6, 0.35, 0.28, 1] });
    G.metal.sphere([p[0], p[1] + r * 1.1 + r * 0.7, p[2]], r, 14, { col: c, sy: 1.15 });
    G.metal.cyl([p[0], p[1] + r * 1.1 + r * 1.75, p[2]], r * 0.12, r * 0.9, 6, { r2: 0.01, col: c });
    if (opt.star) glow.sphere([p[0], p[1] + r * 1.1 + r * 2.9, p[2]], r * 0.25, 6, { col: [2.6, 0.15, 0.1, 1] });
    else G.metal.box([p[0], p[1] + r * 1.1 + r * 2.8, p[2]], [r * 0.08, r * 0.7, r * 0.08], { col: [0.75, 0.62, 0.3, 1] });
  };
  K.banner = (x, z, h, ry) => { G.metal.box([x, h - 2.5, z], [0.06, 5, 1.8], { ry, col: [0.62, 0.06, 0.05, 1] }); glow.box([x, h - 1.4, z], [0.07, 0.6, 0.6], { ry, col: [1.6, 1.2, 0.2, 1] }); };
  K.tank = (x, z, ry, c) => {
    const a = ry * Math.PI / 180;
    G.metal.box([x, 0.8, z], [3.5, 1.1, 7.4], { ry, col: c });
    for (const s of [-1, 1]) G.metal.box([x + Math.cos(a) * s * 1.8, 0.55, z - Math.sin(a) * s * 1.8], [0.6, 1.1, 7.6], { ry, col: [0.14, 0.14, 0.14, 1] });
    G.metal.box([x, 1.75, z], [2.7, 0.8, 3.4], { ry: ry + 20, col: c.map((v, i) => i < 3 ? v * 0.9 : v) });
    col(x - 2.6, x + 2.6, z - 4, z + 4, 2.4); W.fires.push({ pos: [x, 2.2, z], size: 1.0 });
  };
  K.hedgehog = (x, z) => { for (const [rx, ry] of [[45, 0], [-45, 0], [0, 90]]) G.metal.box([x, 0.75, z], [0.22, 0.22, 2.2], { rx, ry, col: [0.2, 0.19, 0.19, 1] }); col(x - 0.9, x + 0.9, z - 0.9, z + 0.9, 1.4); };
  K.car = (x, z, ry) => { G.metal.box([x, 0.55, z], [1.8, 0.8, 4.2], { ry, col: [0.22, 0.23, 0.25, 1] }); G.metal.box([x, 1.15, z], [1.6, 0.6, 2.2], { ry, col: [0.18, 0.18, 0.2, 1] }); col(x - 1.6, x + 1.6, z - 2.3, z + 2.3, 1.5); };
  K.lamp = (x, z, lit) => { G.metal.cyl([x, 0, z], 0.08, 5.2, 6, { col: [0.13, 0.13, 0.14, 1] }); G.metal.box([x, 5.3, z], [0.5, 0.5, 0.5], { col: [0.13, 0.13, 0.14, 1] }); glow.box([x, 5.0, z], [0.36, 0.1, 0.36], { col: lit ? [1.3, 1.0, 0.6, 1] : DARK }); };
  K.gate = (z, c) => { // a barricade across the street, with a gap and the fog gate
    for (const s of [-1, 1]) { G.stone.box([s * 17, 2.6, z + 1.5], [26, 5.2, 3], { col: c }); col(s * 4.3, s * 30, z, z + 3, 5.2); }
    for (const s of [-1, 1]) G.stone.box([s * 4.3, 3.6, z + 1.5], [1.2, 7.2, 3.2], { col: c });
    G.stone.box([0, 7.0, z + 1.5], [9.8, 1.0, 3.2], { col: c });
    for (const s of [-1, 1]) { G.stone.box([s * 5.0, 2.5, z + 5], [1.2, 5, 6.5], { col: c }); col(s * 4.4, s * 5.6, z + 1.8, z + 8.5, 5); }
    for (const s of [-1, 1]) col(s * 5, s * 30, z + 3.4, z + 4.6, 4.4);
    const fg = new OE.Geo(); fg.box([0, 3.4, z], [7.4, 6.8, 0.15], { col: [1, 1, 1, 1] });
    W.gate = { node: new OE.Node(fg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.6, 0.45, 0.35], alpha: 0.3, doubleSided: true }), z, open: false, sealed: false,
      zone: [-4, 4, z - 3.5, z], enter: [0, z + 6.6], thomas: [1.6, z + 5.9], fx: [-3.5, 3.5, 6.3] };
    W.gate.node.castShadow = false; OE.scene.add(W.gate.node);
    W.gateCol = { x0: -4.3, x1: 4.3, z0: z - 0.4, z1: z + 0.2, h: 8, gate: true }; W.colliders.push(W.gateCol);
    W.sealCol = { x0: -4, x1: 4, z0: z + 4.6, z1: z + 5.4, h: 8, gate: true, off: true }; W.colliders.push(W.sealCol);
  };
  K.ring = () => { const A = W.arena;
    for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < 0.2) continue;
      const x = A.c[0] + Math.cos(a) * (A.r + 2.2), z = A.c[2] + Math.sin(a) * (A.r + 2.2); col(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 1.2); } };
  K.build = () => {
    for (const k in G) OE.scene.add(new OE.Node(G[k].build(), mats[k]));
    for (const k in glows) { const c = k.split(',').map(Number), gw = new OE.Node(glows[k].build(), { mode: 2, color: [0, 0, 0], emissive: c }); gw.castShadow = false; OE.scene.add(gw); }
    OE.scene.add(new OE.Node(DARKG.build(), { mode: 1, triA: W.tex.metal.albedo, triN: W.tex.metal.normal, triScale: 2, rough: 0.15, metal: 0.6, color: [0.12, 0.13, 0.15] }));
  };
  return K;
}

/* ---------------- Harbin ---------------- */
W.builders['5h'] = function () {
  const K = kit(1898), { G, glow, col, R, rnd } = K;
  W.ambience = 'ash'; W.arena = { c: [0, 0, 152], r: 20 }; W.bounds = [-30, 30, -8.5, 178];
  const A = W.arena, OCHRE = [0.78, 0.62, 0.42, 1], CREAM = [0.82, 0.76, 0.64, 1], ROSE = [0.72, 0.5, 0.44, 1], TRIM = [0.9, 0.86, 0.78, 1];
  G.ground.box([0, -0.5, 85], [130, 1, 240], { col: [0.4, 0.38, 0.36, 1], aoBottom: 1 });
  G.stone.box([0, 0.01, 60], [24, 0.04, 140], { col: [0.5, 0.47, 0.44, 1], aoBottom: 1 }); // Central Street's granite setts
  // old Russian facades (ochre, cream, rose), Chinese neon over the shopfronts, Pact banners
  const cols = [OCHRE, CREAM, ROSE];
  for (const side of [-1, 1]) for (let z = -8, i = 0; z < 118; i++) { const len = R(14, 22), z1 = Math.min(118, z + len);
    K.facade(side, z, z1, R(11, 15), cols[(i + (side > 0)) % 3], { trim: TRIM, arch: true, lit: 0.3 });
    for (let k = 0; k < 2; k++) glow.box([side * 11.94, R(3.0, 3.6), R(z + 2, z1 - 2)], [0.06, 0.5, R(2, 4)], { col: rnd() < 0.5 ? [2.4, 0.25, 0.2, 1] : [0.3, 1.6, 2.2, 1] }); // neon signs
    if (i % 2 === 0) K.dome([side * 13.5, R(11, 13), z + 2], 1.2, [0.3, 0.42, 0.34, 1], { drum: TRIM }); // corner turrets with little domes
    z = z1 + 0.4; }
  for (let z = 6; z < 116; z += 14) for (const s of [-1, 1]) K.banner(s * 11.7, z, 11, 90);
  for (let z = 4; z < 118; z += 16) for (const s of [-1, 1]) K.lamp(s * 8, z, true);
  // the fighting: Pact barricades, a burnt-out tank, cars, tank traps
  K.hedgehog(-3, 24); K.hedgehog(4, 27); K.car(5, 38, 20); K.tank(-3.5, 52, 10, [0.32, 0.3, 0.26, 1]); K.hedgehog(2, 66); K.car(-5, 78, -30);
  for (let x = -9; x <= 9; x += 1.3) if (Math.abs(x) > 2.8) G.stone.box([x, 0.6, 96], [1.2, 1.2, 1.2], { ry: R(-10, 10), col: [0.5, 0.5, 0.5, 1] }); col(-9.6, -2.8, 95.3, 96.7, 1.2); col(2.8, 9.6, 95.3, 96.7, 1.2);
  K.hedgehog(-2, 108); K.car(4, 112, 60);
  K.gate(121, [0.55, 0.52, 0.5, 1]);
  // Saint Sophia's square: the church at the far end, towers of the new city behind
  G.stone.cyl([0, -0.005, 152], 22, 0.04, 40, { col: [0.56, 0.53, 0.5, 1], aoB: 1 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; K.lamp(A.c[0] + Math.cos(a) * (A.r - 0.8), A.c[2] + Math.sin(a) * (A.r - 0.8), true); }
  const cz = 184, BR = [0.58, 0.32, 0.26, 1]; // Saint Sophia: red brick, the great green onion dome, a bell tower
  G.brick.box([0, 7, cz], [16, 14, 16], { col: BR }); G.brick.box([0, 6, cz - 9], [7, 12, 4], { col: BR });
  for (const s of [-1, 1]) G.brick.box([s * 10, 5, cz], [5, 10, 9], { col: BR });
  K.dome([0, 14, cz], 5.2, [0.25, 0.45, 0.35, 1], { drum: BR });
  for (const [x, z] of [[-6, cz - 6], [6, cz - 6], [-6, cz + 6], [6, cz + 6]]) K.dome([x, 14, z], 1.4, [0.25, 0.45, 0.35, 1], { drum: BR });
  G.brick.box([0, 13, cz + 11], [5, 26, 5], { col: BR }); K.dome([0, 26, cz + 11], 1.8, [0.25, 0.45, 0.35, 1], { drum: BR });
  glow.box([0, 3, cz - 11.05], [2.4, 4.4, 0.05], { col: [1.4, 0.9, 0.45, 1] });
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) glow.box([s * (4 + i * 2.6), 8, cz - 8.05], [0.9, 2.6, 0.05], { col: [1.2, 0.8, 0.4, 1] });
  col(-14, 14, cz - 11, cz + 14, 20);
  for (const [x, z, w, h] of [[-26, 205, 10, 60], [-12, 220, 12, 80], [10, 215, 11, 70], [27, 200, 9, 55], [0, 240, 14, 95]]) { // the new city: glass towers
    G.metal.box([x, h / 2, z], [w, h, w], { col: [0.22, 0.25, 0.3, 1] });
    for (let y = 4; y < h - 2; y += 3) if (rnd() < 0.5) glow.box([x, y, z - w / 2 - 0.05], [w * 0.8, 0.25, 0.05], { col: rnd() < 0.2 ? [2.2, 0.2, 0.2, 1] : [0.8, 0.9, 1.2, 1] }); }
  for (const s of [-1, 1]) K.facade(s, 128, 176, 14, s < 0 ? CREAM : OCHRE, { trim: TRIM, arch: true, x: 24, lit: 0.2 });
  for (const s of [-1, 1]) K.banner(s * 12, 168, 14, 0);
  K.ring();
  W.fires.push({ pos: [-10, 0.4, 140], size: 0.8 }, { pos: [11, 0.4, 162], size: 0.8 }, { pos: [-6, 1.2, 52], size: 1.0 });
  K.build();
  W.beacons = [W.makeBeacon([-5, 0, 3], 'Central Street'), W.makeBeacon([-4.5, 0, 88], 'The Old Hotel')];
};

/* ---------------- Moscow ---------------- */
W.builders['5m'] = function () {
  const K = kit(1147), { G, glow, col, R, rnd } = K;
  W.ambience = 'rain'; W.arena = { c: [0, 0, 152], r: 21 }; W.bounds = [-30, 30, -8.5, 178];
  const A = W.arena, STAL = [0.66, 0.6, 0.52, 1], STAL2 = [0.58, 0.52, 0.46, 1], TRIM = [0.82, 0.78, 0.7, 1], KREM = [0.62, 0.2, 0.15, 1];
  G.ground.box([0, -0.5, 85], [130, 1, 240], { col: [0.34, 0.33, 0.33, 1], aoBottom: 1 });
  G.ground.box([0, 0.01, 60], [22, 0.04, 140], { col: [0.26, 0.26, 0.27, 1], aoBottom: 1 }); // wet asphalt
  // Stalinist blocks down the boulevard, a spire at each end
  for (const side of [-1, 1]) for (let z = -8, i = 0; z < 118; i++) { const z1 = Math.min(118, z + R(18, 26));
    K.facade(side, z, z1, R(18, 24), i % 2 ? STAL : STAL2, { trim: TRIM, lit: 0.12, x: 12 }); z = z1 + 0.5; }
  for (const [x, z] of [[-17, 30], [17, 74]]) { G.stone.box([x, 28, z], [6, 12, 6], { col: TRIM }); G.metal.cyl([x, 34, z], 2.2, 12, 8, { r2: 0.05, col: [0.6, 0.5, 0.3, 1] });
    glow.sphere([x, 46.5, z], 0.6, 6, { col: [2.6, 0.15, 0.1, 1] }); }
  for (let z = 4; z < 118; z += 14) for (const s of [-1, 1]) K.lamp(s * 9.5, z, rnd() < 0.5);
  for (let z = 10; z < 116; z += 18) for (const s of [-1, 1]) K.banner(s * 11.7, z, 16, 90);
  K.hedgehog(-3, 22); K.hedgehog(3.5, 25); K.tank(3, 40, -12, [0.36, 0.38, 0.32, 1]); K.car(-5, 52, 30); K.hedgehog(-1, 64); K.hedgehog(4, 66);
  K.tank(-4, 82, 170, [0.36, 0.38, 0.32, 1]); K.car(5, 104, -50); K.hedgehog(-3, 110);
  K.gate(121, [0.5, 0.48, 0.46, 1]);
  // Red Square: the Kremlin wall on the left with Spasskaya Tower, GUM on the right, Saint Basil's at the end
  G.stone.box([0, -0.003, 152], [52, 0.04, 62], { col: [0.3, 0.29, 0.3, 1], aoBottom: 1 }); // dark cobbles
  G.brick.box([-25, 5, 152], [3, 10, 62], { col: KREM });
  for (let z = 122; z < 183; z += 2) G.brick.box([-23.6, 10.8, z], [0.8, 1.6, 0.9], { col: KREM }); // swallowtail merlons
  G.brick.box([-25, 13, 140], [8, 26, 8], { col: KREM }); G.stone.box([-25, 27, 140], [6, 3, 6], { col: TRIM }); // Spasskaya Tower
  glow.cyl([-20.9, 21, 140], 1.6, 0.1, 16, { rz: 90, col: [1.6, 1.4, 0.9, 1] }); // its clock face
  G.metal.cyl([-25, 28.5, 140], 3, 9, 8, { r2: 0.05, col: [0.25, 0.4, 0.3, 1] }); glow.sphere([-25, 38.2, 140], 0.9, 6, { col: [2.8, 0.15, 0.1, 1] });
  G.stone.box([27, 8, 152], [8, 16, 60], { col: [0.78, 0.74, 0.66, 1] }); // GUM
  for (let z = 126; z < 180; z += 3) for (let f = 0; f < 3; f++) glow.box([22.96, 2.5 + f * 4.5, z], [0.05, 2.4, 1.6], { col: rnd() < 0.3 ? [1.2, 0.95, 0.6, 1] : [0.05, 0.05, 0.06, 1] });
  const bz = 188; // Saint Basil's: a cluster of coloured onion domes
  G.brick.box([0, 5, bz], [18, 10, 14], { col: [0.62, 0.26, 0.2, 1] });
  K.dome([0, 10, bz], 2.6, [0.85, 0.7, 0.2, 1], { drum: [0.62, 0.26, 0.2, 1] }); G.brick.box([0, 18, bz], [3, 10, 3], { col: [0.62, 0.26, 0.2, 1] });
  const DC = [[0.2, 0.55, 0.3, 1], [0.85, 0.2, 0.15, 1], [0.2, 0.4, 0.75, 1], [0.9, 0.8, 0.3, 1], [0.3, 0.6, 0.55, 1], [0.8, 0.4, 0.2, 1]];
  [[-6, -4], [6, -4], [-6, 4], [6, 4], [0, -6], [0, 6]].forEach(([x, z], i) => { G.brick.box([x, 6, bz + z], [3.2, 12, 3.2], { col: [0.66, 0.3, 0.22, 1] }); K.dome([x, 12, bz + z], 1.6, DC[i], { drum: [0.85, 0.8, 0.7, 1] }); });
  col(-12, 12, bz - 8, bz + 8, 20);
  G.stone.cyl([14, 1.0, 176], 3.2, 2.0, 16, { col: [0.45, 0.42, 0.38, 1] }); // Lobnoye Mesto, the old stone platform, off to the side by Saint Basil's
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; K.lamp(A.c[0] + Math.cos(a) * (A.r - 0.8), A.c[2] + Math.sin(a) * (A.r - 0.8), true); }
  K.ring();
  W.fires.push({ pos: [-12, 0.4, 136], size: 0.9 }, { pos: [13, 0.4, 168], size: 0.9 }, { pos: [3, 1.6, 40], size: 1.0 });
  K.build();
  W.beacons = [W.makeBeacon([-5, 0, 3], 'Tverskaya Street'), W.makeBeacon([-4.5, 0, 90], 'The Manege')];
};

/* ---------------- New London, five years on ---------------- */
W.builders['5l'] = function () { W.builders[1](); };
})();
