/* World: ruined New London, 2090 — level geometry, colliders, fires, beacons, fog gate */
(function () {
'use strict';
const W = window.W = { colliders: [], fires: [], beacons: [], spawns: [], gate: null, arena: { c: [0, 0, 150], r: 21 }, glowNodes: [] };
const rnd = OE.rng(2090);
const R = (a, b) => a + (b - a) * rnd();

W.build = function () {
  const T = {
    concrete: OE.proceduralTex('concrete', 512), ground: OE.proceduralTex('ground', 512),
    metal: OE.proceduralTex('metal', 256), brick: OE.proceduralTex('brick', 512),
  };
  W.tex = T;
  const mats = {
    concrete: { mode: 1, triA: T.concrete.albedo, triN: T.concrete.normal, triScale: 0.22, rough: 0.92, metal: 0, color: [1, 1, 1] },
    brick: { mode: 1, triA: T.brick.albedo, triN: T.brick.normal, triScale: 0.28, rough: 0.9, metal: 0, color: [1, 1, 1] },
    metal: { mode: 1, triA: T.metal.albedo, triN: T.metal.normal, triScale: 0.6, rough: 0.55, metal: 0.55, color: [1, 1, 1] },
    ground: { mode: 1, triA: T.ground.albedo, triN: T.ground.normal, triScale: 0.18, rough: 0.95, metal: 0, color: [1, 1, 1] },
  };
  W.mats = mats;
  const G = { concrete: new OE.Geo(), brick: new OE.Geo(), metal: new OE.Geo(), ground: new OE.Geo() };
  const glow = new OE.Geo(); // emissive windows / fire glows
  const col = (x0, x1, z0, z1, h = 10) => W.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h });

  // ---------- ground ----------
  G.ground.box([0, -0.5, 75], [140, 1, 230], { col: [1, 1, 1, 1], aoBottom: 1 });
  // road (asphalt-ish concrete strip) with kerbs
  G.concrete.box([0, 0.01, 60], [13, 0.04, 130], { col: [0.42, 0.42, 0.44, 1], aoBottom: 1 });
  for (const s of [-1, 1]) G.concrete.box([s * 6.9, 0.09, 60], [0.5, 0.2, 130], { col: [0.8, 0.8, 0.8, 1] });
  // plaza
  G.concrete.cyl([0, -0.02, 150], 24, 0.06, 36, { col: [0.55, 0.53, 0.5, 1], aoB: 1 });
  for (let i = 0; i < 6; i++) G.concrete.cyl([0, 0.0, 150], 24 - i * 3.5, 0.05 + i * 0.002, 36, { col: i % 2 ? [0.45, 0.43, 0.4, 1] : [0.6, 0.58, 0.55, 1], aoB: 1, open: true });

  // ---------- buildings lining the street ----------
  function building(side, z0, z1, depth, floors, kind) {
    const fx = side * 9.5; // facade plane
    const bx = side * (9.5 + depth / 2);
    const g = kind === 'brick' ? G.brick : G.concrete;
    const fh = 3.3; const H = floors * fh;
    // back mass (dark interior visible through windows)
    g.box([side * (9.5 + depth - 0.4), H * 0.45, (z0 + z1) / 2], [0.8, H * 0.9, z1 - z0], { col: [0.25, 0.23, 0.22, 1] });
    // interior floor slabs (visible through windows)
    const n = Math.max(2, Math.round((z1 - z0) / 3.2));
    const cw = (z1 - z0) / n;
    const heights = [];
    for (let c = 0; c <= n; c++) heights.push(H * (rnd() < 0.35 ? R(0.45, 0.85) : R(0.9, 1.05)));
    for (let c = 0; c <= n; c++) { // pillars
      const z = z0 + c * cw; const h = heights[c];
      g.box([fx + side * 0.3, h / 2, z], [0.7, h, 0.7], { col: [0.85, 0.82, 0.8, 1] });
    }
    for (let c = 0; c < n; c++) {
      const z = z0 + (c + 0.5) * cw; const top = Math.min(heights[c], heights[c + 1]);
      for (let f = 0; f <= floors; f++) {
        const y = f * fh; if (y > top + 0.5) break;
        if (f > 0) g.box([fx + side * 0.2, y, z], [0.5, 0.45, cw], { col: [0.8, 0.78, 0.75, 1] }); // facade band
        g.box([bx, y + 0.05, z], [depth - 0.6, 0.25, cw], { col: [0.4, 0.38, 0.36, 1] }); // floor slab
        if (f === 0 && rnd() < 0.6) g.box([fx + side * 0.15, 0.6, z], [0.3, 1.2, cw - 0.6], { col: [0.6, 0.58, 0.55, 1] }); // ground floor wall
        // window glows from fires inside
        if (f < floors && y + fh < top && rnd() < 0.13) {
          const gy = y + fh * 0.55;
          glow.box([side * (9.5 + depth - 0.9), gy, z], [0.1, fh * 0.6, cw * 0.7], { col: [1, 1, 1, 1] });
          if (rnd() < 0.5) W.fires.push({ pos: [side * (9.5 + depth * 0.5), gy - 0.6, z], size: 0.7, inside: true });
        }
      }
      // broken rubble chunks at top
      if (rnd() < 0.5) g.box([fx + side * R(0.2, 1.5), top + R(-0.2, 0.3), z + R(-1, 1)], [R(0.6, 1.4), R(0.4, 1), R(0.6, 1.5)], { col: [0.7, 0.68, 0.66, 1], rx: R(-20, 20), rz: R(-20, 20) });
    }
    // side walls of block
    for (const z of [z0, z1]) g.box([bx, H * 0.4, z], [depth, H * 0.8, 0.5], { col: [0.7, 0.68, 0.66, 1] });
    col(side * 9.3, side * (9.5 + depth), z0, z1, H);
    // rubble spill onto pavement
    for (let i = 0; i < (z1 - z0) / 2.5; i++) {
      const s = R(0.25, 0.9);
      g.box([side * R(7.6, 9.2), s * 0.3, R(z0, z1)], [s, s * 0.7, s * R(0.8, 1.4)], { col: [0.75, 0.72, 0.7, 1], rx: R(-30, 30), ry: R(0, 180), rz: R(-30, 30) });
    }
  }
  const segs = [[-8, 14], [14, 30], [32, 50], [50, 66], [69, 88], [90, 110], [110, 121]];
  segs.forEach(([a, b], i) => {
    building(-1, a, b, R(7, 10), 3 + Math.floor(rnd() * 4), i % 2 ? 'brick' : 'concrete');
    building(1, a + (i % 3 === 1 ? 2 : 0), b, R(7, 10), 3 + Math.floor(rnd() * 4), i % 2 ? 'concrete' : 'brick');
  });
  // alley gaps are blocked with debris walls
  for (const z of [14, 31, 50, 67.5, 89, 110]) for (const s of [-1, 1]) {
    G.concrete.box([s * 11, 1.2, z], [4, 2.4, 1.5], { col: [0.6, 0.58, 0.56, 1], rz: R(-6, 6) });
    col(s * 9.0, s * 13, z - 1, z + 1, 2.4);
  }
  // back wall at spawn
  G.brick.box([0, 4, -9], [20, 8, 1.2], { col: [0.7, 0.66, 0.62, 1] }); col(-10, 10, -9.6, -8.4, 8);

  // ---------- props ----------
  function car(x, z, ry, burnt = true) {
    const c = burnt ? [0.35, 0.3, 0.28, 1] : [0.4, 0.42, 0.45, 1];
    const g = G.metal; const m = OE.M4.create(), q = OE.Q.create(); OE.Q.euler(q, 0, ry, 0);
    const P = (lx, ly, lz) => { const v = [lx, ly, lz]; const o = [0, 0, 0]; OE.M4.fromRTS(m, q, [x, 0, z], [1, 1, 1]); OE.M4.point(o, m, v); return o; };
    g.box(P(0, 0.65, 0), [1.9, 0.75, 4.4], { col: c, ry });
    g.box(P(0, 1.25, -0.2), [1.7, 0.55, 2.2], { col: [0.2, 0.18, 0.17, 1], ry });
    for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) G.metal.cyl(P(wx, 0.38, wz), 0.38, 0.3, 10, { rz: 90, ry, col: [0.12, 0.12, 0.12, 1] });
    const r = 2.3; col(x - r * 0.8, x + r * 0.8, z - r, z + r, 1.5);
    W.carSpots.push([x, z]);
  }
  W.carSpots = [];
  car(-4.2, 18, 12); car(3.6, 27, -35); car(-2.5, 44, 75); car(4.5, 58, 5); car(-4, 83, -20); car(2.8, 104, 160);
  // tank wreck
  (function tank(x, z, ry) {
    const g = G.metal; const c = [0.3, 0.32, 0.27, 1];
    const m = OE.M4.create(), q = OE.Q.create(); OE.Q.euler(q, 0, ry, 0); OE.M4.fromRTS(m, q, [x, 0, z], [1, 1, 1]);
    const P = (a, b, cz) => OE.M4.point([0, 0, 0], m, [a, b, cz]);
    g.box(P(0, 0.9, 0), [3.4, 1.1, 6.6], { col: c, ry }); g.box(P(-1.6, 0.55, 0), [0.8, 1.1, 7], { col: [0.12, 0.12, 0.12, 1], ry });
    g.box(P(1.6, 0.55, 0), [0.8, 1.1, 7], { col: [0.12, 0.12, 0.12, 1], ry }); g.box(P(0.3, 1.85, -0.4), [2.4, 0.9, 3], { col: c, ry: ry + 18, rz: 8 });
    g.cyl(P(0.8, 1.9, 1.2), 0.14, 4.5, 8, { rx: 78, ry: ry + 18, col: c });
    col(x - 2.6, x + 2.6, z - 3.8, z + 3.8, 2.2);
    W.fires.push({ pos: P(0.2, 2.3, -0.4), size: 1.0 });
  })(2.8, 70, -25);
  // barricades: jersey barriers + sandbags
  function barrier(x, z, ry) { G.concrete.box([x, 0.45, z], [0.6, 0.9, 2.6], { ry, col: [0.75, 0.73, 0.7, 1] }); const a = ry * Math.PI / 180; const dx = Math.abs(Math.sin(a)) * 1.3 + 0.3, dz = Math.abs(Math.cos(a)) * 1.3 + 0.3; col(x - dx, x + dx, z - dz, z + dz, 0.9); }
  barrier(-5.5, 36, 80); barrier(-2.2, 37, 95); barrier(5.2, 49, 70); barrier(0.5, 62, 10); barrier(-5.6, 92, 90); barrier(5.4, 95, 85);
  function sandbags(x, z, len, ry) {
    const a = ry * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    for (let r = 0; r < 3; r++) for (let i = 0; i < len; i++) {
      const o = (i - len / 2 + (r % 2) * 0.5) * 0.62;
      G.ground.box([x + ca * o, 0.18 + r * 0.3, z - sa * o], [0.6, 0.3, 0.42], { ry, col: [0.75, 0.68, 0.52, 1], aoBottom: 0.6 });
    }
    const hl = len * 0.31 + 0.3; col(x - Math.abs(ca) * hl - 0.3, x + Math.abs(ca) * hl + 0.3, z - Math.abs(sa) * hl - 0.3, z + Math.abs(sa) * hl + 0.3, 1.0);
  }
  sandbags(3, 40, 6, 0); sandbags(-3.5, 75, 5, 0); sandbags(0, 114, 4, 0);
  // craters
  for (const [x, z, r] of [[1, 33, 2.4], [-3, 53, 2.0], [3.5, 88, 2.6], [-1, 98, 1.8]]) {
    G.ground.cyl([x, 0.0, z], r, 0.04, 20, { col: [0.13, 0.11, 0.1, 1], aoB: 1 });
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + R(0, 0.3); const s = R(0.2, 0.55); G.ground.box([x + Math.cos(a) * r, s * 0.25, z + Math.sin(a) * r], [s * 1.6, s * 0.5, s], { ry: -a * 57.3, col: [0.5, 0.45, 0.4, 1], rx: R(-15, 15) }); }
  }
  // street lamps (broken)
  for (let z = 4; z < 118; z += 13) for (const s of [-1, 1]) {
    if (rnd() < 0.3) continue;
    const tilt = rnd() < 0.4 ? R(8, 25) * s : 0;
    G.metal.cyl([s * 6.4, 0, z + s * 3], 0.09, 5.5, 8, { rz: tilt, col: [0.25, 0.25, 0.27, 1] });
  }

  // ---------- crashed dropship (spawn) ----------
  (function dropship() {
    const g = G.metal; const c = [0.45, 0.47, 0.5, 1];
    g.cyl([-3.5, 1.2, 4], 1.7, 9, 14, { rx: 90, ry: 25, rz: 10, col: c, r2: 1.3 });
    g.box([-3.5 + 3.2, 0.8, 4 + 1.2], [5, 0.25, 2.4], { ry: 25, rz: -18, col: c });
    g.box([-3.5 - 3.0, 1.9, 4 - 1.4], [4.2, 0.25, 2.2], { ry: 25, rz: 24, col: c });
    g.box([-3.5 - 1.6, 2.8, 4 - 3.5], [0.3, 2.2, 2.0], { ry: 25, col: c });
    col(-6.2, -0.8, 0.0, 8.5, 3);
    W.fires.push({ pos: [-2.2, 1.6, 7.6], size: 1.3 }); W.fires.push({ pos: [-5.8, 1.0, 1.0], size: 0.8 });
  })();

  // ---------- collapsed overpass ----------
  (function overpass() {
    const z = 80; const g = G.concrete;
    for (const s of [-1, 1]) { g.box([s * 8.2, 3.4, z], [1.4, 6.8, 1.8], { col: [0.8, 0.78, 0.75, 1] }); col(s * 8.2 - 0.7, s * 8.2 + 0.7, z - 0.9, z + 0.9, 7); }
    g.box([2.5, 7.2, z], [12, 0.9, 7], { col: [0.75, 0.73, 0.7, 1] });
    g.box([-6.2, 3.8, z + 0.5], [8, 0.9, 7], { rz: 52, col: [0.75, 0.73, 0.7, 1] });
    for (let i = 0; i < 8; i++) g.box([-7 + R(-1, 2), R(0.3, 0.8), z + R(-3, 3)], [R(0.8, 1.8), R(0.6, 1.4), R(0.8, 1.6)], { rx: R(-30, 30), ry: R(0, 90), col: [0.7, 0.68, 0.66, 1] });
    col(-9, -4.5, z - 3.5, z + 4, 3);
    G.metal.cyl([1, 6.7, z - 3.2], 0.05, 4, 6, { rz: 70, col: [0.3, 0.2, 0.15, 1] });
  })();

  // ---------- funnel to fog gate ----------
  for (const s of [-1, 1]) {
    G.brick.box([s * 6.8, 3, 122], [5, 6, 2], { col: [0.75, 0.7, 0.66, 1] }); col(s * 4.3, s * 9.4, 121, 123, 6);
    G.concrete.box([s * 4.3, 4, 122], [1.2, 8, 2.4], { col: [0.85, 0.83, 0.8, 1] });
  }
  G.concrete.box([0, 8.3, 122], [9.8, 1.2, 2.6], { col: [0.85, 0.83, 0.8, 1] });
  // walls closing the approach between the gate and the arena
  for (const s of [-1, 1]) {
    G.brick.box([s * 5.0, 2.5, 126], [1.2, 5, 6.5], { col: [0.7, 0.66, 0.62, 1] }); col(s * 4.4, s * 5.6, 122.8, 129.5, 5);
    G.brick.box([s * 17, 2.2, 124.2], [24, 4.4, 1.2], { col: [0.66, 0.62, 0.58, 1] }); col(s * 5, s * 30, 123.6, 124.8, 4.4);
  }

  // ---------- arena: ruined cathedral plaza ----------
  const A = W.arena;
  const nW = 26;
  for (let i = 0; i < nW; i++) {
    const a = i / nW * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < 0.22) continue; // entrance (south, toward -z)
    const x = A.c[0] + Math.cos(a) * (A.r + 1.5), z = A.c[2] + Math.sin(a) * (A.r + 1.5);
    const h = rnd() < 0.3 ? R(2, 4) : R(6, 11);
    G.brick.box([x, h / 2, z], [1.6, h, 5.6], { ry: -a * 180 / Math.PI, col: [0.72, 0.66, 0.62, 1] });
    col(x - 1.6, x + 1.6, z - 1.6, z + 1.6, h);
    if (i % 3 === 0) G.concrete.cyl([A.c[0] + Math.cos(a) * (A.r - 0.5), 0, A.c[2] + Math.sin(a) * (A.r - 0.5)], 0.65, h + R(1, 5), 12, { col: [0.82, 0.8, 0.77, 1] });
  }
  // outer containment so the player can't leave arena through wall gaps
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * Math.PI * 2; if (Math.abs(OE.angDiff(a, -Math.PI / 2)) < 0.2) continue;
    const x = A.c[0] + Math.cos(a) * (A.r + 2.2), z = A.c[2] + Math.sin(a) * (A.r + 2.2); col(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 3);
  }
  // ruined tower at back of the plaza
  (function tower() {
    const x = 0, z = A.c[2] + A.r + 7;
    G.brick.box([x, 9, z], [9, 18, 7], { col: [0.7, 0.64, 0.6, 1] });
    G.brick.box([x - 2.2, 21, z], [4.5, 6, 6.5], { col: [0.68, 0.62, 0.58, 1] });
    G.concrete.box([x + 1.6, 19.5, z - 3.6], [2.2, 2.2, 0.3], { col: [0.9, 0.88, 0.85, 1] }); // clock face remnant
    for (const s of [-1, 1]) G.concrete.cyl([x + s * 5, 0, z - 3.8], 0.8, 16, 12, { col: [0.85, 0.82, 0.8, 1] });
    glow.box([x - 1, 12, z - 3.55], [3, 4, 0.1], { col: [1, 1, 1, 1] });
    W.fires.push({ pos: [x - 1, 10.5, z - 3.2], size: 1.2 });
  })();
  // debris in arena (not too much: it's a boss floor)
  for (let i = 0; i < 18; i++) {
    const a = R(0, Math.PI * 2), d = R(14, 20); const s = R(0.3, 0.9);
    G.concrete.box([A.c[0] + Math.cos(a) * d, s * 0.3, A.c[2] + Math.sin(a) * d], [s * 1.4, s * 0.6, s], { ry: R(0, 180), rx: R(-20, 20), col: [0.7, 0.68, 0.65, 1] });
  }
  W.fires.push({ pos: [-14, 0.4, 140], size: 1.1 }, { pos: [15, 0.4, 158], size: 1.0 }, { pos: [12, 0.4, 136], size: 0.9 }, { pos: [-12, 0.4, 162], size: 1.0 });

  // ground-level fires along the street
  W.fires.push({ pos: [-4.2, 1.1, 18], size: 0.9 }, { pos: [3.6, 1.0, 27], size: 0.8 }, { pos: [-2.5, 1.0, 44], size: 1.0 },
    { pos: [6.5, 0.3, 52], size: 0.7 }, { pos: [-6, 0.3, 64], size: 0.8 }, { pos: [-4, 1.0, 83], size: 0.9 }, { pos: [2.8, 1.0, 104], size: 1.0 }, { pos: [-6.2, 0.3, 116], size: 0.8 });

  // ---------- build meshes ----------
  for (const k of Object.keys(G)) { const n = new OE.Node(G[k].build(), mats[k]); OE.scene.add(n); }
  const gw = new OE.Node(glow.build(), { mode: 2, color: [0, 0, 0], emissive: [2.6, 0.9, 0.25] }); gw.castShadow = false; OE.scene.add(gw);

  // ---------- beacons ----------
  W.beacons = [makeBeacon([3.2, 0, 5.5], 'Crash Site'), makeBeacon([-3, 0, 101], 'Overpass Ruins')];
  // ---------- fog gate ----------
  const fg = new OE.Geo(); fg.box([0, 3.6, 122], [7.4, 7.2, 0.15], { col: [1, 1, 1, 1] });
  W.gate = { node: new OE.Node(fg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.9, 0.85, 0.7], alpha: 0.35, doubleSided: true }), z: 122, open: false, sealed: false };
  W.gate.node.castShadow = false; OE.scene.add(W.gate.node);
  W.gateCol = { x0: -4, x1: 4, z0: 121.6, z1: 122.4, h: 8, gate: true };
  W.colliders.push(W.gateCol);
  W.sealCol = { x0: -4, x1: 4, z0: 125.6, z1: 126.4, h: 8, gate: true, off: true };
  W.colliders.push(W.sealCol);

  // ---------- fire lights ----------
  for (const f of W.fires) {
    f.light = { pos: [f.pos[0], f.pos[1] + 0.8, f.pos[2]], color: [1.0, 0.45, 0.15], intensity: 3.2 * f.size, range: 7 + f.size * 5, base: 3.2 * f.size, ph: rnd() * 10 };
    OE.R.lights.push(f.light);
  }
};

function makeBeacon(pos, name) {
  const g = new OE.Geo();
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.cyl([pos[0] + Math.cos(a) * 0.55, 0, pos[2] + Math.sin(a) * 0.55], 0.06, 1.5, 6, { rz: Math.cos(a) * 14, rx: -Math.sin(a) * 14, col: [0.35, 0.35, 0.38, 1] }); }
  g.box([pos[0], 1.45, pos[2]], [0.5, 0.18, 0.5], { col: [0.3, 0.3, 0.32, 1] });
  g.cyl([pos[0], 0, pos[2]], 0.9, 0.12, 12, { col: [0.25, 0.25, 0.27, 1] });
  const base = new OE.Node(g.build(), { mode: 1, triA: W.tex.metal.albedo, triN: W.tex.metal.normal, triScale: 0.8, rough: 0.5, metal: 0.6, color: [1, 1, 1] });
  OE.scene.add(base);
  const cg = new OE.Geo(); cg.sphere([0, 0, 0], 0.18, 8, { col: [1, 1, 1, 1] });
  const core = new OE.Node(cg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.2, 0.5, 1.0] }); core.pos = [pos[0], 1.8, pos[2]]; core.castShadow = false; OE.scene.add(core);
  const bg = new OE.Geo(); bg.cyl([0, 0, 0], 0.08, 40, 8, { col: [1, 1, 1, 1], open: true });
  const beam = new OE.Node(bg.build(), { mode: 2, color: [0, 0, 0], emissive: [0.4, 0.8, 1.6], alpha: 0.18, doubleSided: true }); beam.pos = [pos[0], 1.8, pos[2]]; beam.castShadow = false; beam.visible = false; OE.scene.add(beam);
  const light = { pos: [pos[0], 2.0, pos[2]], color: [0.35, 0.6, 1.0], intensity: 0.6, range: 9 };
  OE.R.lights.push(light);
  return { pos, name, core, beam, light, lit: false };
}

/* collision: push circle out of AABBs */
W.collide = function (p, r) {
  for (const c of W.colliders) {
    if (c.off) continue;
    const cx = Math.max(c.x0, Math.min(p[0], c.x1)), cz = Math.max(c.z0, Math.min(p[2], c.z1));
    let dx = p[0] - cx, dz = p[2] - cz; const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-8) { const d = Math.sqrt(d2); p[0] = cx + dx / d * r; p[2] = cz + dz / d * r; }
      else { // inside: push along smallest axis
        const o = [p[0] - c.x0, c.x1 - p[0], p[2] - c.z0, c.z1 - p[2]]; const m = Math.min(...o);
        if (m === o[0]) p[0] = c.x0 - r; else if (m === o[1]) p[0] = c.x1 + r; else if (m === o[2]) p[2] = c.z0 - r; else p[2] = c.z1 + r;
      }
    }
  }
  // world bounds
  p[0] = OE.clamp(p[0], -30, 30); p[2] = OE.clamp(p[2], -8.5, 180);
};
/* segment vs boxes (for camera / line of sight). returns fraction 0..1 */
W.ray = function (a, b, ignoreLow = 0) {
  let best = 1;
  for (const c of W.colliders) {
    if (c.off || c.h < ignoreLow || (c.gate && ignoreLow > 0)) continue;
    let t0 = 0, t1 = 1;
    const box = [[c.x0, c.x1], [-1, c.h], [c.z0, c.z1]];
    let ok = true;
    for (let k = 0; k < 3; k++) {
      const d = b[k] - a[k];
      if (Math.abs(d) < 1e-9) { if (a[k] < box[k][0] || a[k] > box[k][1]) { ok = false; break; } continue; }
      let ta = (box[k][0] - a[k]) / d, tb = (box[k][1] - a[k]) / d; if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) { ok = false; break; }
    }
    if (ok && t0 < best) best = t0;
  }
  return best;
};

W.update = function (dt, t, P) {
  for (const f of W.fires) {
    const fl = f.light; fl.intensity = fl.base * (0.75 + 0.25 * Math.sin(t * 13 + fl.ph) * Math.sin(t * 7.3 + fl.ph * 2) + 0.1 * Math.sin(t * 31 + fl.ph));
    // particles only for fires near the camera (performance)
    const dx = f.pos[0] - P.camPos[0], dz = f.pos[2] - P.camPos[2];
    if (dx * dx + dz * dz > 50 * 50) continue;
    f.acc = (f.acc || 0) + dt * (f.inside ? 8 : 26) * f.size;
    while (f.acc > 1) {
      f.acc -= 1;
      const s = f.size;
      P.parts.emit({ pos: [f.pos[0] + R(-0.3, 0.3) * s, f.pos[1] + R(0, 0.2), f.pos[2] + R(-0.3, 0.3) * s], vel: [R(-0.2, 0.2), R(1.2, 2.2) * s, R(-0.2, 0.2)],
        life: R(0.35, 0.7), size: R(0.14, 0.28) * s, grow: -0.18 * s, col: rnd() < 0.5 ? [2.4, 0.55, 0.08, 0.8] : [2.0, 0.9, 0.2, 0.7], soft: 0.0, rot: R(0, 6), spin: R(-2, 2) });
      if (rnd() < 0.35) P.parts.emit({ pos: [f.pos[0], f.pos[1] + 0.8 * s, f.pos[2]], vel: [R(-0.3, 0.3) + 0.4, R(0.8, 1.4), R(-0.3, 0.3)], life: R(2.5, 4),
        size: R(0.4, 0.7) * s, grow: 0.7 * s, col: [0.05, 0.045, 0.04, 0.55], soft: 0.0, add: false, rot: R(0, 6), spin: R(-0.5, 0.5) });
      if (rnd() < 0.2) P.parts.emit({ pos: [f.pos[0] + R(-0.3, 0.3), f.pos[1] + 0.3, f.pos[2] + R(-0.3, 0.3)], vel: [R(-0.6, 0.6), R(1.5, 3.5), R(-0.6, 0.6)], life: R(1, 2.2),
        size: 0.03, col: [4, 1.5, 0.3, 1], soft: 0.3, drag: 0.4 });
    }
  }
};
})();
