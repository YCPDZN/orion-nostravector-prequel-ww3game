/* World: Kaliningrad (the old Königsberg), winter 2094 — Chapter IV.
   '4a' Born Under Siege: the snowbound outskirts, Soviet panel blocks and a tram depot, to the old Prussian
        hospital where Talina is in labour; the courtyard is where the Hunter is fought.
   '4b' The Bear: the city centre: a tram avenue, a collapsed apartment block, the bridge over the frozen Pregel,
        and the square before the House of Soviets, where the Bear stands guard. Night, snow falling. */
(function () {
'use strict';

function kit(seed) {
  const rnd = OE.rng(seed), R = (a, b) => a + (b - a) * rnd();
  const T = W.textures(); if (!T.snow) T.snow = OE.proceduralTex('snow', 512);
  const mats = {
    stone: W.tri(T.concrete, 0.3, 0.9, 0), metal: W.tri(T.metal, 0.6, 0.55, 0.55), ground: W.tri(T.ground, 0.25, 0.95, 0),
    snow: W.tri(T.snow, 0.2, 0.75, 0), brick: W.tri(T.brick, 0.32, 0.9, 0),
  };
  const G = {}; for (const k in mats) G[k] = new OE.Geo();
  /* emissive geometry, one mesh per colour (the glow material ignores vertex colour): lit windows, red crosses, fires, ice light.
     Unlit windows are plain dark glass, not emissive. */
  const glows = {}, DARKG = new OE.Geo();
  const pick = (o) => { const c = (o && o.col) || [1, 1, 1, 1]; if (c[0] + c[1] + c[2] < 0.3) return DARKG; const k = c.slice(0, 3).join(','); return glows[k] || (glows[k] = new OE.Geo()); };
  const glow = { box: (p, sz, o) => pick(o).box(p, sz, Object.assign({}, o, { col: [1, 1, 1, 1] })), cyl: (p, r, h, n, o) => pick(o).cyl(p, r, h, n, Object.assign({}, o, { col: [1, 1, 1, 1] })) };
  const col = (x0, x1, z0, z1, h = 10) => W.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h });
  const PANEL = [0.62, 0.6, 0.56, 1], PANEL2 = [0.52, 0.52, 0.5, 1], SNOW = [0.92, 0.94, 0.98, 1];
  const WARM = [1, 0.62, 0.3, 1], DARK = [0.05, 0.05, 0.06, 1];
  const K = { rnd, R, G, glow, col, mats };
  // a Soviet panel block (khrushchyovka): grey slab, rows of windows, snow on the roof; ry 0 or 90
  K.block = (x, z, w, l, h, opt = {}) => {
    const rot = opt.ry === 90, W_ = rot ? l : w, L_ = rot ? w : l;
    G.stone.box([x, h / 2, z], [W_, h, L_], { col: rnd() < 0.5 ? PANEL : PANEL2 });
    G.snow.box([x, h + 0.12, z], [W_ + 0.3, 0.24, L_ + 0.3], { col: SNOW });
    const floors = Math.floor(h / 2.8), face = rot ? 'z' : 'x';
    for (let f = 0; f < floors; f++) for (let i = 0; i < Math.floor((rot ? W_ : L_) / 2.4); i++) for (const s of [-1, 1]) {
      const u = -(rot ? W_ : L_) / 2 + 1.3 + i * 2.4, y = 1.6 + f * 2.8, lit = rnd() < (opt.lit ?? 0.12), burn = rnd() < 0.03;
      const p = face === 'x' ? [x + s * (W_ / 2 + 0.03), y, z + u] : [x + u, y, z + s * (L_ / 2 + 0.03)];
      glow.box(p, face === 'x' ? [0.05, 1.1, 1.1] : [1.1, 1.1, 0.05], { col: burn ? [1.4, 0.5, 0.15, 1] : lit ? WARM : DARK });
      if (burn) W.fires.push({ pos: [p[0], y, p[2]], size: 0.6 });
    }
    col(x - W_ / 2, x + W_ / 2, z - L_ / 2, z + L_ / 2, h + 2);
  };
  K.drift = (x, z, s) => { G.snow.sphere([x, 0, z], s, 8, { col: SNOW, sy: 0.28 }); };
  K.hedgehog = (x, z) => { // a Czech hedgehog tank trap, snow on the beams
    for (const [rx, rz] of [[45, 0], [-45, 0], [0, 90]]) G.metal.box([x, 0.75, z], [0.22, 0.22, 2.2], { rx, ry: rz, col: [0.2, 0.19, 0.19, 1] });
    col(x - 0.9, x + 0.9, z - 0.9, z + 0.9, 1.4);
  };
  K.tram = (x, z, ry, burnt) => { // a Tatra-style tram, red and cream, or burnt out
    const c = burnt ? [0.16, 0.14, 0.13, 1] : [0.62, 0.16, 0.12, 1], c2 = burnt ? [0.2, 0.18, 0.17, 1] : [0.86, 0.8, 0.66, 1];
    const a = ry * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    G.metal.box([x, 1.0, z], [2.5, 1.4, 14], { ry, col: c }); G.metal.box([x, 2.25, z], [2.5, 1.1, 14], { ry, col: c2 });
    G.snow.box([x, 2.9, z], [2.4, 0.18, 13.6], { ry, col: SNOW });
    for (let i = 0; i < 5; i++) { const u = -5.6 + i * 2.8; glow.box([x + sa * u + ca * 1.27, 2.2, z + ca * u - sa * 1.27], [0.04, 0.8, 1.9], { ry, col: burnt ? DARK : [0.4, 0.3, 0.2, 1] }); }
    const hx = Math.abs(ca) * 1.3 + Math.abs(sa) * 7, hz = Math.abs(sa) * 1.3 + Math.abs(ca) * 7; col(x - hx, x + hx, z - hz, z + hz, 3);
    if (burnt) W.fires.push({ pos: [x, 2.4, z + ca * 3], size: 1.0 });
  };
  K.pactTank = (x, z, ry) => { // a wrecked Pact tank in winter white
    const a = ry * Math.PI / 180;
    G.metal.box([x, 0.8, z], [3.5, 1.1, 7.4], { ry, col: [0.7, 0.72, 0.72, 1] });
    for (const s of [-1, 1]) G.metal.box([x + Math.cos(a) * s * 1.8, 0.55, z - Math.sin(a) * s * 1.8], [0.6, 1.1, 7.6], { ry, col: [0.14, 0.14, 0.14, 1] });
    G.metal.box([x, 1.75, z], [2.7, 0.8, 3.4], { ry: ry + 25, rz: 8, col: [0.6, 0.63, 0.64, 1] });
    G.metal.cyl([x + Math.sin(a + 0.4) * 2.4, 1.6, z + Math.cos(a + 0.4) * 2.4], 0.13, 4.4, 8, { rx: 80, ry: ry + 25, col: [0.5, 0.52, 0.52, 1] });
    glow.box([x, 1.2, z], [0.8, 0.12, 0.05], { ry, col: [1.8, 0.2, 0.05, 1] });
    col(x - 2.6, x + 2.6, z - 4, z + 4, 2.4); W.fires.push({ pos: [x, 2.2, z], size: 1.1 });
  };
  K.car = (x, z, ry) => { G.metal.box([x, 0.55, z], [1.8, 0.8, 4.2], { ry, col: [0.25, 0.27, 0.3, 1] }); G.metal.box([x, 1.15, z], [1.6, 0.6, 2.2], { ry, col: [0.2, 0.21, 0.23, 1] }); G.snow.box([x, 1.5, z], [1.5, 0.12, 2.1], { ry, col: SNOW }); col(x - 1.6, x + 1.6, z - 2.3, z + 2.3, 1.5); };
  K.lamp = (x, z, lit) => { G.metal.cyl([x, 0, z], 0.08, 5.5, 6, { col: [0.15, 0.15, 0.16, 1] }); G.metal.box([x, 5.6, z], [0.9, 0.18, 0.3], { col: [0.15, 0.15, 0.16, 1] }); glow.box([x, 5.48, z], [0.5, 0.05, 0.2], { col: lit ? [1.2, 0.9, 0.6, 1] : DARK }); };
  K.sandbags = (x, z, len, ry) => {
    const a = ry * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    for (let r = 0; r < 3; r++) for (let i = 0; i < len; i++) { const o = (i - len / 2 + (r % 2) * 0.5) * 0.62; G.ground.box([x + ca * o, 0.18 + r * 0.3, z - sa * o], [0.6, 0.3, 0.42], { ry, col: [0.62, 0.6, 0.52, 1], aoBottom: 0.6 }); }
    G.snow.box([x, 0.96, z], [len * 0.62, 0.08, 0.44], { ry, col: SNOW });
    const hl = len * 0.31 + 0.3; col(x - Math.abs(ca) * hl - 0.3, x + Math.abs(ca) * hl + 0.3, z - Math.abs(sa) * hl - 0.3, z + Math.abs(sa) * hl + 0.3, 1.0);
  };
  K.ground = (z0, z1, w = 130) => { G.snow.box([0, -0.5, (z0 + z1) / 2], [w, 1, z1 - z0], { col: SNOW, aoBottom: 1 }); };
  K.road = (z0, z1, w = 10) => { G.ground.box([0, 0.01, (z0 + z1) / 2], [w, 0.03, z1 - z0], { col: [0.36, 0.36, 0.38, 1], aoBottom: 1 }); // dark, trodden slush
    for (let z = z0; z < z1; z += R(3, 6)) K.drift(R(-w / 2, w / 2), z, R(0.4, 0.9)); };
  K.gate = (z, wallMat, wallCol) => { // the wall and gateway into the arena, with the fog gate
    for (const s of [-1, 1]) { G[wallMat].box([s * 17, 2.6, z + 1.5], [26, 5.2, 3], { col: wallCol }); col(s * 4.3, s * 30, z, z + 3, 5.2); G.snow.box([s * 17, 5.3, z + 1.5], [26, 0.2, 3.2], { col: SNOW }); }
    for (const s of [-1, 1]) G[wallMat].box([s * 4.3, 3.6, z + 1.5], [1.2, 7.2, 3.2], { col: wallCol });
    G[wallMat].box([0, 7.0, z + 1.5], [9.8, 1.0, 3.2], { col: wallCol });
    for (const s of [-1, 1]) { G[wallMat].box([s * 5.0, 2.5, z + 5], [1.2, 5, 6.5], { col: wallCol }); col(s * 4.4, s * 5.6, z + 1.8, z + 8.5, 5); }
    for (const s of [-1, 1]) col(s * 5, s * 30, z + 3.4, z + 4.6, 4.4);
    const fg = new OE.Geo(); fg.box([0, 3.4, z], [7.4, 6.8, 0.15], { col: [1, 1, 1, 1] });
    W.gate = { node: new OE.Node(fg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.45, 0.55, 0.75], alpha: 0.3, doubleSided: true }), z, open: false, sealed: false,
      zone: [-4, 4, z - 3.5, z], enter: [0, z + 6.6], thomas: [1.6, z + 5.9], fx: [-3.5, 3.5, 6.3] };
    W.gate.node.castShadow = false; OE.scene.add(W.gate.node);
    W.gateCol = { x0: -4.3, x1: 4.3, z0: z - 0.4, z1: z + 0.2, h: 8, gate: true }; W.colliders.push(W.gateCol);
    W.sealCol = { x0: -4, x1: 4, z0: z + 4.6, z1: z + 5.4, h: 8, gate: true, off: true }; W.colliders.push(W.sealCol);
  };
  K.ring = (skip = 0.2) => { const A = W.arena; // keeps the fight inside the arena
    for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < skip) continue;
      const x = A.c[0] + Math.cos(a) * (A.r + 2.2), z = A.c[2] + Math.sin(a) * (A.r + 2.2); col(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 1.2); } };
  K.build = (winGlow = [1.0, 0.75, 0.5]) => {
    for (const k in G) { const n = new OE.Node(G[k].build(), mats[k]); OE.scene.add(n); }
    for (const k in glows) { const c = k.split(',').map(Number), gw = new OE.Node(glows[k].build(), { mode: 2, color: [0, 0, 0], emissive: [c[0] * winGlow[0], c[1] * winGlow[1], c[2] * winGlow[2]] }); gw.castShadow = false; OE.scene.add(gw); }
    const dk = new OE.Node(DARKG.build(), { mode: 1, triA: W.tex.metal.albedo, triN: W.tex.metal.normal, triScale: 2, rough: 0.15, metal: 0.6, color: [0.12, 0.13, 0.15] }); OE.scene.add(dk); // dark glass
  };
  return K;
}

/* ---------------- Part I: the road to the field hospital ---------------- */
W.builders['4a'] = function () {
  const K = kit(2094), { G, glow, col, R, rnd } = K;
  W.ambience = 'snow'; W.arena = { c: [0, 0, 150], r: 18 }; W.bounds = [-30, 30, -8.5, 178];
  const A = W.arena, BRICK = [0.7, 0.42, 0.34, 1], BRICK2 = [0.6, 0.36, 0.3, 1];
  K.ground(-30, 200); K.road(-9, 121);
  // the Allied line at the start: sandbags, a winter-white APC, a searchlight
  K.sandbags(4, 8, 5, 0); K.sandbags(-4.5, 14, 4, 0);
  G.metal.box([13, 1.1, 2], [3, 1.6, 6.5], { col: [0.78, 0.8, 0.78, 1] }); G.metal.box([13, 2.2, 1.4], [1.6, 0.7, 2.2], { col: [0.7, 0.72, 0.7, 1] }); col(11.4, 14.6, -1.3, 5.3, 2.4);
  G.metal.cyl([-11, 0, 4], 0.1, 2.4, 6, { col: [0.2, 0.2, 0.2, 1] }); glow.cyl([-11, 2.5, 4.2], 0.35, 0.3, 10, { rx: 70, col: [2, 2, 2, 1] });
  // panel blocks down both sides of the road
  for (const [x, z, l, h] of [[-17, 18, 22, 15], [17, 22, 26, 12.5], [-17, 50, 24, 12.5], [17, 56, 20, 15], [-17, 84, 22, 15], [17, 88, 26, 12.5], [-17, 109, 16, 9], [17, 110, 14, 9]]) K.block(x, z, 10, l, h);
  for (const s of [-1, 1]) col(s * 23, s * 30, -9, 121, 6); // the yards behind them
  // the street: wrecks, tank traps, a burnt tram, a barricade
  K.hedgehog(-2.5, 27); K.hedgehog(3, 29.5); K.tram(3.2, 40, 4, true); K.car(-3.6, 47, 20); K.hedgehog(-1, 62); K.hedgehog(4, 64);
  K.pactTank(-2.6, 72, 15); K.car(3.8, 80, -10);
  for (let x = -9; x <= 9; x += 1.3) if (Math.abs(x) > 2.8) { G.stone.box([x, 0.6, 98], [1.2, 1.2, 1.2], { ry: R(-10, 10), col: [0.5, 0.5, 0.5, 1] }); } col(-9.6, -2.8, 97.3, 98.7, 1.2); col(2.8, 9.6, 97.3, 98.7, 1.2);
  for (const z of [10, 34, 58, 82, 104]) for (const s of [-1, 1]) K.lamp(s * 5.6, z, z < 30);
  for (let i = 0; i < 26; i++) K.drift(R(-11, 11), R(0, 118), R(0.6, 1.4));
  // the hospital: an old red-brick Prussian building around the courtyard
  K.gate(121, 'brick', BRICK);
  const hz = A.c[2] + A.r + 8; // main block behind the courtyard
  G.brick.box([0, 7, hz + 4], [56, 14, 10], { col: BRICK }); col(-28, 28, hz - 1, hz + 9, 14);
  for (const s of [-1, 1]) { G.brick.box([s * 25, 6, 150], [8, 12, 52], { col: BRICK2 }); col(s * 21, s * 29, 124, 176, 12); }
  for (const s of [-1, 1]) G.metal.box([s * 25, 12.4, 150], [8.4, 0.3, 52.4], { col: [0.25, 0.26, 0.28, 1] });
  G.snow.box([0, 14.2, hz + 4], [56.4, 0.3, 10.4], { col: [0.92, 0.94, 0.98, 1] });
  for (let i = 0; i < 18; i++) for (let f = 0; f < 4; f++) { const x = -25 + i * 2.95; if (Math.abs(x) < 4) continue; glow.box([x, 2 + f * 3.2, hz - 1.03], [1.1, 1.5, 0.05], { col: rnd() < 0.55 ? [1, 0.85, 0.6, 1] : [0.05, 0.05, 0.06, 1] }); }
  for (const s of [-1, 1]) for (let i = 0; i < 14; i++) for (let f = 0; f < 3; f++) glow.box([s * 20.97, 2 + f * 3.2, 128 + i * 3.4], [0.05, 1.5, 1.1], { col: rnd() < 0.4 ? [1, 0.85, 0.6, 1] : [0.05, 0.05, 0.06, 1] });
  // the entrance: lit doorway, a red cross over it, and the canvas awning where Talina lies
  glow.box([0, 2.2, hz - 1.04], [4.6, 4.4, 0.05], { col: [1.4, 1.2, 0.95, 1] });
  G.brick.box([0, 10.5, hz - 1.1], [4.2, 4.2, 0.2], { col: [0.92, 0.92, 0.9, 1] });
  glow.box([0, 10.5, hz - 1.25], [3.2, 0.9, 0.05], { col: [2.2, 0.1, 0.08, 1] }); glow.box([0, 10.5, hz - 1.25], [0.9, 3.2, 0.05], { col: [2.2, 0.1, 0.08, 1] });
  G.metal.box([0, 3.6, hz - 3.2], [8, 0.12, 5], { rx: -8, col: [0.72, 0.7, 0.62, 1] });
  for (const s of [-1, 1]) for (const zz of [hz - 5.5, hz - 1.2]) G.metal.cyl([s * 3.8, 0, zz], 0.06, 3.5, 6, { col: [0.3, 0.3, 0.3, 1] });
  G.metal.box([0, 0.45, hz - 2.4], [2.1, 0.12, 0.9], { col: [0.8, 0.8, 0.78, 1] }); // the cot, behind her
  for (const s of [-1, 1]) for (const zz of [-0.35, 0.35]) G.metal.box([s * 0.95, 0.22, hz - 2.4 + zz], [0.05, 0.45, 0.05], { col: [0.3, 0.3, 0.3, 1] });
  W.npcSpot = [0, 0, hz - 3.6];
  // field tents in the corners and an ambulance at the gate
  for (const [x, z] of [[-16, 133], [16, 133], [-16.5, 168], [16.5, 168]]) { G.metal.box([x, 1.3, z], [4.2, 2.6, 5], { col: [0.75, 0.74, 0.66, 1] }); G.snow.box([x, 2.65, z], [4.3, 0.12, 5.1], { col: [0.92, 0.94, 0.98, 1] }); glow.box([x, 1.8, z - 2.53], [1.2, 0.3, 0.04], { col: [2, 0.1, 0.08, 1] }); glow.box([x, 1.8, z - 2.53], [0.3, 1.2, 0.04], { col: [2, 0.1, 0.08, 1] }); }
  G.metal.box([8, 1.3, 113], [2.4, 2.2, 5.6], { col: [0.9, 0.9, 0.88, 1] }); glow.box([8, 1.8, 115.83], [0.4, 0.4, 0.04], { col: [2, 0.1, 0.08, 1] }); col(6.8, 9.2, 110.2, 115.8, 2.4);
  K.ring(0.2);
  W.fires.push({ pos: [-9, 0.4, 136], size: 0.7 }, { pos: [10, 0.4, 162], size: 0.7 });
  K.build([1.0, 0.75, 0.5]);
  W.beacons = [W.makeBeacon([-5, 0, 3], 'Allied Lines'), W.makeBeacon([-4.5, 0, 88], 'The Tram Stop')];
};

/* ---------------- Part II: the House of Soviets ---------------- */
W.builders['4b'] = function () {
  const K = kit(1255), { G, glow, col, R, rnd } = K;
  W.ambience = 'snow'; W.arena = { c: [0, 0, 152], r: 20 }; W.bounds = [-30, 30, -8.5, 180];
  const A = W.arena, ICE = [0.62, 0.7, 0.78, 1];
  K.ground(-30, 62); K.ground(88, 210); K.road(-9, 62, 12); K.road(88, 121, 12);
  // the start: a ruined avenue with tram lines
  K.sandbags(4.5, 6, 5, 0); K.sandbags(-4.5, 12, 4, 0);
  for (const s of [-1, 1]) G.metal.box([s * 1.4, 0.04, 26], [0.12, 0.06, 70], { col: [0.3, 0.3, 0.32, 1] });
  for (const [x, z, l, h] of [[-18, 16, 24, 15], [18, 18, 28, 15], [18, 50, 22, 12.5], [-18, 102, 18, 15], [18, 104, 22, 12.5]]) K.block(x, z, 10, l, h);
  for (const s of [-1, 1]) col(s * 23, s * 30, -9, 121, 6);
  for (let z = 0; z < 60; z += 12) for (const s of [-1, 1]) G.metal.cyl([s * 6.2, 0, z], 0.1, 7, 6, { col: [0.18, 0.18, 0.19, 1] });
  K.tram(-2.2, 30, -6, true); K.hedgehog(4, 22); K.car(4.2, 40, 15); K.hedgehog(-3, 46);
  // the collapsed apartment block: a mother and child are under it (the chapter's choice)
  G.stone.box([-18, 2.4, 52], [10, 4.8, 18], { col: [0.5, 0.5, 0.48, 1] });
  for (let i = 0; i < 46; i++) { const s = R(0.8, 2.6); G.stone.box([R(-14, -8.5) - i * 0.04, R(0, 1.8), R(43, 61)], [s * 1.6, s * 0.4, s], { rx: R(-30, 30), ry: R(0, 180), rz: R(-25, 25), col: rnd() < 0.5 ? [0.58, 0.57, 0.53, 1] : [0.48, 0.47, 0.45, 1] }); }
  for (let i = 0; i < 6; i++) G.metal.cyl([R(-13, -9), 1.2, R(45, 59)], 0.05, R(2, 4), 5, { rx: R(30, 80), ry: R(0, 180), col: [0.3, 0.18, 0.12, 1] }); // rebar
  for (let i = 0; i < 8; i++) K.drift(R(-13, -8), R(44, 60), R(0.5, 1.0));
  col(-30, -8.2, 43, 61, 4);
  // the frozen Pregel and the bridge over it
  G.snow.box([0, -1.6, 75], [130, 1, 26], { col: ICE });
  for (let i = 0; i < 30; i++) glow.box([R(-50, 50), -1.08, R(64, 86)], [R(2, 6), 0.02, 0.05], { ry: R(0, 180), col: [0.25, 0.3, 0.38, 1] }); // cracks in the ice catch the light
  G.stone.box([0, -0.3, 75], [12, 0.6, 26], { col: [0.5, 0.5, 0.5, 1] }); G.snow.box([0, 0.02, 75], [11.6, 0.05, 26], { col: [0.82, 0.84, 0.88, 1] });
  for (const s of [-1, 1]) { G.stone.box([s * 6.2, 0.55, 75], [0.5, 1.1, 26], { col: [0.45, 0.45, 0.45, 1] }); col(s * 6.0, s * 6.8, 62, 88, 1.4); col(s * 6.6, s * 30, 61, 89, 3); }
  for (const s of [-1, 1]) for (const z of [62, 88]) G.stone.box([s * 30, -0.5, z], [48, 2.2, 1.4], { col: [0.4, 0.4, 0.4, 1] }); // embankments
  for (const z of [66, 75, 84]) for (const s of [-1, 1]) K.lamp(s * 6.2, z, false);
  K.pactTank(3.0, 80, 170);
  // the approach: barricades, tank traps, burning wrecks
  K.hedgehog(-4, 96); K.hedgehog(3.5, 99); K.car(-4.5, 108, 70); K.hedgehog(1, 112); K.pactTank(-6.5, 116, -60);
  for (let i = 0; i < 18; i++) K.drift(R(-11, 11), R(90, 118), R(0.6, 1.4));
  K.gate(121, 'stone', [0.46, 0.46, 0.45, 1]);
  // the square before the House of Soviets
  G.stone.cyl([0, -0.005, 152], 22, 0.04, 40, { col: [0.68, 0.7, 0.74, 1], aoB: 1 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; K.lamp(A.c[0] + Math.cos(a) * (A.r - 0.8), A.c[2] + Math.sin(a) * (A.r - 0.8), i % 3 === 0); }
  for (const s of [-1, 1]) K.block(s * 31, 150, 12, 44, 15, { lit: 0.04 });
  const hz = 186; // the House of Soviets: the unfinished H-block, two towers joined at the top
  for (const s of [-1, 1]) { G.stone.box([s * 15, 15, hz], [14, 30, 18], { col: [0.64, 0.64, 0.6, 1] }); G.snow.box([s * 15, 30.15, hz], [14.4, 0.3, 18.4], { col: [0.92, 0.94, 0.98, 1] }); }
  G.stone.box([0, 25, hz], [16.4, 10, 12], { col: [0.6, 0.6, 0.57, 1] }); G.stone.box([0, 4, hz + 2], [16.4, 8, 10], { col: [0.56, 0.56, 0.53, 1] });
  G.stone.box([0, 10, hz + 8], [44, 20, 6], { col: [0.52, 0.52, 0.5, 1] });
  for (const s of [-1, 1]) for (let f = 0; f < 10; f++) for (let i = 0; i < 4; i++) glow.box([s * 15 - 5.2 + i * 3.45, 1.8 + f * 2.85, hz - 9.04], [2.3, 0.9, 0.05], { col: rnd() < 0.05 ? [1.4, 0.5, 0.15, 1] : [0.04, 0.05, 0.07, 1] });
  for (let i = 0; i < 6; i++) glow.box([-6.5 + i * 2.6, 25, hz - 6.04], [2.0, 6.8, 0.05], { col: [0.04, 0.05, 0.07, 1] });
  glow.box([0, 26, hz - 6.06], [12, 0.3, 0.05], { col: [0.3, 0.9, 2.2, 1] }); // the Pact's ice-blue running lights
  for (const s of [-1, 1]) glow.cyl([s * 15, 31.5, hz - 8], 0.6, 0.6, 10, { col: [0.6, 1.2, 2.4, 1] });
  col(-28, 28, hz - 9, hz + 12, 30);
  K.ring(0.2);
  W.fires.push({ pos: [-11, 0.4, 140], size: 0.8 }, { pos: [12, 0.4, 165], size: 0.9 }, { pos: [-14, 8, hz - 9.5], size: 1.2 });
  K.build([1.0, 0.75, 0.5]);
  W.beacons = [W.makeBeacon([-5, 0, 3], 'Leninsky Prospekt'), W.makeBeacon([-4.5, 0, 93], 'The Pregel Bridge')];
};
})();
