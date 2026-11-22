/* Actors: Orion (player), Thomas Hawthorne (companion), war machines (enemies), projectiles */
(function () {
'use strict';
const A = window.A = {};
const { M4, Q } = OE;
const rnd = Math.random; const R = (a, b) => a + (b - a) * rnd();
const fwdOf = (yaw) => [Math.sin(yaw), 0, Math.cos(yaw)];
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const yawTo = (a, b) => Math.atan2(b[0] - a[0], b[2] - a[2]);
A.yawTo = yawTo; A.dist2 = dist2;

/* ---------------- weapons ---------------- */
let swordMesh, swordGlow, rifleMesh, rifleGlow;
function buildWeapons() {
  const g = new OE.Geo();
  g.cyl([0, 0, -0.14], 0.022, 0.3, 8, { rx: 90, col: [0.12, 0.12, 0.13, 1] });       // grip (along z)
  g.box([0, 0, 0.17], [0.2, 0.05, 0.06], { col: [0.35, 0.36, 0.4, 1] });            // guard
  g.box([0, 0, 0.72], [0.018, 0.075, 1.05], { col: [0.55, 0.57, 0.62, 1] });          // blade spine
  g.box([0, 0, 1.28], [0.016, 0.05, 0.1], { col: [0.55, 0.57, 0.62, 1], rx: 0 });
  g.box([0, 0, -0.3], [0.05, 0.05, 0.05], { col: [0.3, 0.3, 0.33, 1] });             // pommel
  swordMesh = g.build();
  const e = new OE.Geo(); e.box([0, 0.042, 0.72], [0.01, 0.012, 1.0], { col: [1, 1, 1, 1] }); e.box([0, -0.042, 0.72], [0.01, 0.012, 1.0], { col: [1, 1, 1, 1] });
  swordGlow = e.build();
  const r = new OE.Geo(); const c = [0.16, 0.16, 0.17, 1], c2 = [0.32, 0.3, 0.27, 1];
  r.box([0, 0.02, 0.15], [0.07, 0.12, 0.62], { col: c });      // receiver
  r.box([0, -0.1, 0.05], [0.05, 0.16, 0.06], { col: c, rx: -15 }); // grip
  r.box([0, -0.12, 0.25], [0.05, 0.2, 0.08], { col: c2, rx: 10 }); // magazine
  r.box([0, 0.0, -0.32], [0.06, 0.13, 0.36], { col: c2 });     // stock
  r.cyl([0, 0.04, 0.45], 0.022, 0.55, 8, { rx: 90, col: c });  // barrel
  r.box([0, 0.11, 0.18], [0.04, 0.05, 0.16], { col: c });      // optic
  rifleMesh = r.build();
  const rg = new OE.Geo(); rg.box([0.037, 0.02, 0.15], [0.004, 0.015, 0.4], { col: [1, 1, 1, 1] }); rg.box([0, 0.11, 0.1], [0.03, 0.03, 0.01], { col: [1, 1, 1, 1] });
  rifleGlow = rg.build();
}
const metalMat = () => ({ mode: 1, triA: W.tex.metal.albedo, triN: W.tex.metal.normal, triScale: 2.5, rough: 0.35, metal: 0.8, color: [1, 1, 1] });
A.weapons = () => { if (!swordMesh) buildWeapons(); return { swordMesh, swordGlow, rifleMesh, rifleGlow, metalMat }; };
A.TYPES = () => TYPES;
/* Rifle handling: rifle placed in model space (stock in the right shoulder when aiming, angled across the
   chest when carrying), then both arms are solved onto it with IK: right hand on the grip, left on the handguard. */
A.rifleRig = function (ch, s, out) {
  const V = OE.V; ch.modelPose(); const bi = ch.boneIndex, P = ch.mP;
  const sh = P[bi.R_UpperArm], lsh = P[bi.L_UpperArm], chest = P[bi.Chest];
  const zAim = V.norm(s.dir || [0, 0, 1]);
  const butt = [sh[0] + 0.1, sh[1] - 0.08, sh[2] + 0.08];
  const oAim = V.add(butt, V.sc(zAim, 0.34));
  const zCar = V.norm([0.3, -0.55, 0.78]);
  const oCar = [chest[0] - 0.06, chest[1] - 0.08, chest[2] + 0.22];
  const b = s.aim; let z = V.norm([OE.lerp(zCar[0], zAim[0], b), OE.lerp(zCar[1], zAim[1], b), OE.lerp(zCar[2], zAim[2], b)]);
  let o = [OE.lerp(oCar[0], oAim[0], b), OE.lerp(oCar[1], oAim[1], b), OE.lerp(oCar[2], oAim[2], b)];
  o = V.add(o, V.sc(z, -0.06 * (s.recoil || 0) + 0.38 * (s.thrust || 0)));
  let x = V.norm([z[2], 0, -z[0]]); const y = V.cross(z, x);
  out.set([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1]);
  const pt = (lx, ly, lz) => [o[0] + x[0]*lx + y[0]*ly + z[0]*lz, o[1] + x[1]*lx + y[1]*ly + z[1]*lz, o[2] + x[2]*lx + y[2]*ly + z[2]*lz];
  const w = s.w ?? 1;
  ch.ik(['R_UpperArm', 'R_ForeArm', 'R_Hand'], pt(0, -0.14, -0.02), [sh[0] - 0.5, sh[1] - 0.55, sh[2] - 0.1], w);
  ch.ik(['L_UpperArm', 'L_ForeArm', 'L_Hand'], pt(0, -0.09, 0.24), [lsh[0] + 0.45, lsh[1] - 0.6, lsh[2] - 0.05], w);
  return out;
};

/* muzzle flash, tracer, casing and impact for one rifle round */
A.rifleFx = function (rifleNode, muzzle, tp, hit, listener) {
  const W_ = rifleNode.world; const m = M4.point([0, 0, 0], W_, [0, 0.04, 0.74]);
  const d = [tp[0] - m[0], tp[1] - m[1], tp[2] - m[2]]; const l = Math.hypot(...d) || 1; const u = [d[0] / l, d[1] / l, d[2] / l];
  GM.parts.emit({ pos: [m[0] + u[0] * 1.2, m[1] + u[1] * 1.2, m[2] + u[2] * 1.2], vel: [u[0] * 90, u[1] * 90, u[2] * 90], stretch: 1.1, size: 0.03, life: Math.min(0.25, l / 90), col: [5, 3.2, 1.2, 1], soft: 0.2, fade: 0 });
  GM.parts.emit({ pos: m.slice(), vel: [0, 0, 0], life: 0.07, size: 0.22, col: [5, 3, 1.2, 1], soft: 0, fade: 0, rot: R(0, 6) });
  GM.parts.emit({ pos: m.slice(), vel: [u[0] * 1.5 + R(-0.2, 0.2), R(0.2, 0.6), u[2] * 1.5 + R(-0.2, 0.2)], drag: 2, life: R(0.6, 1.0), size: 0.08, grow: 0.4, col: [0.35, 0.33, 0.3, 0.35], add: false, soft: 0 });
  const ej = M4.point([0, 0, 0], W_, [0.05, 0.05, 0.2]); const rx = [W_[0], W_[1], W_[2]];
  GM.parts.emit({ pos: ej, vel: [rx[0] * 2.5 + R(-0.3, 0.3), R(1.5, 2.5), rx[2] * 2.5 + R(-0.3, 0.3)], grav: 9.8, floor: 0.02, life: 1.2, size: 0.012, stretch: 0.02, col: [2.2, 1.6, 0.6, 1], soft: 0.4, fade: 1, add: true });
  if (hit) GM.fx.sparks(tp, [-u[0], 0.3, -u[2]], 10, [3.5, 2.2, 1]); else GM.fx.dust([tp[0], Math.max(0.1, tp[1]), tp[2]], 2);
  muzzle.pos = m.slice(); muzzle.intensity = 6;
  GM.audio.gun(listener);
};

/* ---------------- player: Orion Mascar (sword) or Thomas Hawthorne (rifle) ---------------- */
const ATK = {
  Attack1: { hit: [0.27, 0.44], dmg: 30, stam: 16, lunge: [0.16, 0.36, 2.0], range: 2.7, arc: 120, next: [0.40, 0.78] },
  Attack2: { hit: [0.30, 0.46], dmg: 34, stam: 18, lunge: [0.18, 0.38, 2.2], range: 2.7, arc: 100, next: [0.42, 0.82] },
  Heavy: { hit: [0.55, 0.70], dmg: 68, stam: 30, lunge: [0.44, 0.62, 2.4], range: 3.0, arc: 80, heavy: true },
  Butt: { clip: 'Attack1', hit: [0.24, 0.38], dmg: 40, stam: 20, lunge: [0.12, 0.3, 1.4], range: 2.4, arc: 110, heavy: true }, // Thomas's rifle-butt strike
};
const RIFLE = { dmg: 21, stam: 9, gap: 0.12, rounds: 3, range: 26, cone: 0.7 };
A.Player = class {
  constructor(asset, kit = 'sword') {
    if (!swordMesh) buildWeapons();
    this.kit = kit; this.who = kit === 'rifle' ? 't' : 'o';
    this.ch = new OE.Character(asset, { rim: 0.06 }); this.node = this.ch.node; OE.scene.add(this.node);
    this.pos = [0, 0, 0]; this.yaw = 0; this.vel = [0, 0, 0];
    this.state = 'move'; this.t = 0; this.hp = 1; this.stam = 1; this.stamDelay = 0; this.iframe = false;
    this.stims = 4; this.hitSet = new Set(); this.combo = 0; this.queued = null; this.radius = 0.42; this.alive = true; this.poise = 0;
    this.light = { pos: [0, 1, 0], color: [0.3, 0.8, 1.0], intensity: 0.0, range: 4 }; OE.R.lights.push(this.light);
    if (kit === 'rifle') { // Thomas: rifle held with two-hand IK, like the companion
      const rf = new OE.Node(rifleMesh, metalMat()); rf.mat.color = [0.7, 0.7, 0.72];
      const rg = new OE.Node(rifleGlow, { mode: 2, color: [0, 0, 0], emissive: [3, 0.6, 0.2] }); rg.castShadow = false; rf.add(rg); this.rifleGlowNode = rg;
      this.rifleModel = M4.create(); this._rw = M4.create(); this._hm = M4.create(); this._hp = [0, 0, 0]; this._rm = M4.create();
      rf.attach = () => this.useIK ? M4.mul(this._rw, this.node.world, this.rifleModel) : this.handRifle();
      this.node.add(rf); this.rifle = rf; this.aimBlend = 0; this.aimHold = 0; this.recoil = 0; this.aimDir = [0, 0, 1];
      this.muzzle = { pos: [0, 0, 0], color: [1, 0.7, 0.3], intensity: 0, range: 7 }; OE.R.lights.push(this.muzzle);
      return;
    }
    const sw = new OE.Node(swordMesh, metalMat()); const gl = new OE.Node(swordGlow, { mode: 2, color: [0, 0, 0], emissive: [0.6, 2.2, 3.2] });
    sw.add(gl); gl.castShadow = false;
    sw.attach = () => this.ch.boneWorld('R_Hand', this._hm || (this._hm = M4.create()));
    sw.pos = [0.0, -0.085, 0.02]; OE.Q.euler(sw.rot, 0, 0, 0);
    this.node.add(sw); this.sword = sw; this.swordGlow = gl;
    this.tipW = [0, 0, 0]; this.baseW = [0, 0, 0];
  }
  handRifle() { // rifle carried in the right hand (rolling, healing, falling)
    const hw = this.ch.boneWorld('R_Hand', this._hm); const hp = M4.point(this._hp, hw, [0, -0.075, 0.02]);
    const f = fwdOf(this.yaw); let z = [f[0] * 0.8, -0.6, f[2] * 0.8]; let l = Math.hypot(...z); z = [z[0] / l, z[1] / l, z[2] / l];
    let x = [z[2], 0, -z[0]]; l = Math.hypot(...x) || 1; x = [x[0] / l, 0, x[2] / l];
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const o = [hp[0] - z[0] * 0.06, hp[1] - z[1] * 0.06 + 0.1, hp[2] - z[2] * 0.06];
    this._rm.set([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1]); return this._rm;
  }
  /* best target for a rifle burst: the lock-on, else whoever is nearest the aim line */
  rifleTarget(aimYaw) {
    if (GM.lock && GM.lock.alive) return GM.lock;
    let best = null, bs = -1e9; const f = [Math.sin(aimYaw), Math.cos(aimYaw)];
    for (const e of GM.enemies) {
      if (!e.alive || (e.boss && !e.active)) continue; const dx = e.pos[0] - this.pos[0], dz = e.pos[2] - this.pos[2], d = Math.hypot(dx, dz);
      if (d > RIFLE.range) continue; const dot = (dx * f[0] + dz * f[1]) / (d || 1); if (dot < RIFLE.cone) continue;
      if (W.ray([this.pos[0], 1.5, this.pos[2]], [e.pos[0], e.hitY(), e.pos[2]], 1.6) < 0.98) continue;
      const sc = dot * 3 - d / 10; if (sc > bs) { bs = sc; best = e; }
    }
    return best;
  }
  fireRound() {
    const tg = this.shotTarget; const ads = this.ads;
    let tp, hit = false;
    if (tg && tg.alive) {
      hit = rnd() < (ads ? 0.97 : 0.88);
      tp = hit ? [tg.pos[0] + R(-0.12, 0.12), tg.hitY() + R(-0.15, 0.15), tg.pos[2] + R(-0.12, 0.12)] : [tg.pos[0] + R(-1, 1), tg.hitY() + R(-0.5, 0.8), tg.pos[2] + R(-1, 1)];
      if (hit) tg.damage(RIFLE.dmg * this.dmgMul * (ads ? 1.25 : 1) * R(0.92, 1.08), this.pos, { from: 'player', light: true });
    } else { const f = fwdOf(this.yaw); tp = [this.pos[0] + f[0] * 24, 1.3, this.pos[2] + f[2] * 24]; }
    A.rifleFx(this.rifle, this.muzzle, tp, hit, 0); this.recoil = 1; GM.shake(0.05);
  }
  get maxHp() { return Math.round(420 * (1 + 0.1 * GM.save.vig)); }
  get maxStam() { return 100 + 8 * GM.save.end; }
  /* alignment of whoever you are playing: Evil hits twice as hard but takes 1.5x damage; Good hits 1.5x harder and takes 1.5x less */
  get alignTier() { return GM.align ? GM.align.tier(this.who) : 'neutral'; }
  get dmgMul() { return (1 + 0.08 * GM.save.str) * ({ good: 1.5, evil: 2 }[this.alignTier] || 1); }
  get hurtMul() { return { good: 1 / 1.5, evil: 1.5 }[this.alignTier] || 1; }
  reset(pos, yaw) {
    this.pos = pos.slice(); this.yaw = yaw; this.hp = this.maxHp; this.stam = this.maxStam; this.state = 'move'; this.alive = true;
    this.stims = GM.save.maxStims; this.ch.play('Idle', 0); this.queued = null;
  }
  setState(s, clip, fade = 0.12, speed = 1) { this.state = s; this.t = 0; if (clip) this.ch.play(clip, fade, speed, true); }
  useStam(v) { if (this.stam <= 0) return false; this.stam -= v; this.stamDelay = 0.75; return true; }
  faceTowards(targetYaw, rate, dt) { this.yaw += OE.angDiff(this.yaw, targetYaw) * Math.min(1, rate * dt); }
  update(dt, inp) {
    const st = this.state; this.t += dt;
    if (!this.alive) { this.ch.update(dt); this.syncNode(); return; }
    // stamina regen
    this.stamDelay -= dt;
    if (this.stamDelay <= 0 && st !== 'attack' && st !== 'roll') this.stam = Math.min(this.maxStam, this.stam + dt * (st === 'block' ? 18 : 42));
    const camYaw = GM.cam.yaw;
    let mx = inp.mx, mz = inp.my; const mag = Math.min(1, Math.hypot(mx, mz));
    // world move dir relative to camera
    const wx = -mx * Math.cos(camYaw) + mz * Math.sin(camYaw), wz = mx * Math.sin(camYaw) + mz * Math.cos(camYaw);
    const lock = GM.lock && GM.lock.alive ? GM.lock : null;
    // buffered inputs
    if (inp.attack) this.queued = 'light'; else if (inp.heavy) this.queued = 'heavy'; else if (inp.roll) this.queued = 'roll'; else if (inp.heal) this.queued = 'heal';
    if (this.queuedAge === undefined) this.queuedAge = 0;
    if (inp.attack || inp.heavy || inp.roll || inp.heal) this.queuedAge = 0; else this.queuedAge += dt;
    if (this.queuedAge > 0.45) this.queued = null;

    const canAct = st === 'move' || st === 'block';
    const startAttack = (clip) => {
      const a = ATK[clip]; if (this.stam <= 0) return false;
      this.useStam(a.stam); this.hitSet.clear(); this.atk = a; this.atkClip = clip;
      if (lock) this.yaw = yawTo(this.pos, lock.pos); else if (mag > 0.2) this.yaw = Math.atan2(wx, wz);
      this.setState('attack', a.clip || clip, 0.08); GM.audio.swing(clip === 'Heavy'); this.queued = null; return true;
    };
    const rifle = this.kit === 'rifle';
    const canShoot = rifle && (st === 'move' || (st === 'shoot' && this.t > 0.34));
    if (rifle && this.queued === 'light' && canShoot && this.stam > 0) { // fire a burst
      this.queued = null; this.useStam(RIFLE.stam);
      const aimYaw = lock ? yawTo(this.pos, lock.pos) : (this.ads || mag < 0.2 ? camYaw : Math.atan2(wx, wz));
      this.shotTarget = this.rifleTarget(aimYaw); this.yaw = this.shotTarget ? yawTo(this.pos, this.shotTarget.pos) : aimYaw;
      this.burst = RIFLE.rounds; this.burstT = 0; this.aimHold = 1.4; this.setState('shoot', 'Shoot', 0.06);
    }
    if ((canAct || (rifle && st === 'shoot' && this.t > 0.3)) && this.queued) {
      const q = this.queued;
      if (q === 'light') { if (!rifle) { this.combo = 0; startAttack('Attack1'); } }
      else if (q === 'heavy') startAttack(rifle ? 'Butt' : 'Heavy');
      else if (q === 'roll' && this.stam > 0) {
        this.useStam(20); this.queued = null;
        this.rollDir = mag > 0.2 ? Math.atan2(wx, wz) : this.yaw; this.yaw = this.rollDir; this.setState('roll', 'Roll', 0.06); GM.audio.roll();
      } else if (q === 'heal' && this.stims > 0) { this.queued = null; this.healed = false; this.setState('heal', 'Heal', 0.15); }
      else if (q === 'heal') { this.queued = null; GM.hud.toast('No stims remaining'); }
    }
    const S = this.state;
    if (rifle && S === 'shoot') {
      this.burstT -= dt;
      if (this.burst > 0 && this.burstT <= 0) { if (this.shotTarget && this.shotTarget.alive) this.yaw = yawTo(this.pos, this.shotTarget.pos); this.fireRound(); this.burst--; this.burstT = RIFLE.gap; }
      this.pos[0] += wx * 1.4 * dt; this.pos[2] += wz * 1.4 * dt;
      if (this.t > 0.5) this.setState('move', null);
    }
    this.ads = rifle && inp.block && (this.state === 'move' || this.state === 'shoot');
    if (rifle && this.ads) this.aimHold = Math.max(this.aimHold, 0.3);
    if (S === 'move' || S === 'block') {
      const blocking = !rifle && inp.block && this.stam > 0;
      if (blocking && S !== 'block') { this.setState('block', 'Block', 0.12); }
      if (!blocking && S === 'block') { this.setState('move', null); }
      const sprint = (inp.sprint || mag > 0.92) && !blocking && mag > 0.5;
      let speed = blocking ? 1.6 : (mag < 0.6 ? 2.2 * mag / 0.6 : (sprint ? 5.6 : 4.2));
      if (this.ads) speed = Math.min(speed, 1.9);
      if (inp.sprint && mag > 0.5 && !blocking) { speed = 6.2; this.stam -= dt * 14; this.stamDelay = 0.4; if (this.stam < 0) this.stam = 0; }
      if (mag > 0.08) {
        this.pos[0] += wx / Math.max(mag, 1e-3) * speed * dt * Math.min(1, mag * 1.2);
        this.pos[2] += wz / Math.max(mag, 1e-3) * speed * dt * Math.min(1, mag * 1.2);
        if (lock && !sprint) this.faceTowards(yawTo(this.pos, lock.pos), 10, dt);
        else if (this.ads) this.faceTowards(camYaw, 12, dt);
        else this.faceTowards(Math.atan2(wx, wz), 12, dt);
      } else if (lock) this.faceTowards(yawTo(this.pos, lock.pos), 8, dt);
      else if (this.ads) this.faceTowards(camYaw, 12, dt);
      if (rifle && this.aimHold > 0 && this.state === 'move') this.ch.play(mag < 0.08 ? 'Aim' : 'WalkAim', 0.18);
      else if (this.state !== 'block') {
        if (mag < 0.08) this.ch.play('Idle', 0.25);
        else if (speed < 3.0) this.ch.play('Walk', 0.2, Math.max(0.6, speed / 2.2));
        else this.ch.play('Run', 0.2, speed / 4.6);
      }
      this.stepSound(dt, mag > 0.08 ? speed : 0);
    } else if (S === 'attack') {
      const a = this.atk, t = this.ch.t;
      if (t > a.lunge[0] && t < a.lunge[1]) {
        const f = fwdOf(this.yaw); let sp = a.lunge[2] / (a.lunge[1] - a.lunge[0]);
        if (lock && dist2(this.pos, lock.pos) < lock.radius + 1.2) sp *= 0.1;
        this.pos[0] += f[0] * sp * dt; this.pos[2] += f[2] * sp * dt;
        if (lock) this.faceTowards(yawTo(this.pos, lock.pos), 6, dt);
      }
      this.swordLit = t > a.hit[0] - 0.08 && t < a.hit[1] + 0.05;
      if (t >= a.hit[0] && t <= a.hit[1]) this.doHits(a);
      if (a.next && t > a.next[0] && t < a.next[1] && this.queued === 'light' && this.atkClip !== 'Heavy') {
        this.combo++; startAttack(this.combo % 2 ? 'Attack2' : 'Attack1');
      } else if (this.queued === 'roll' && a.next && t > a.next[0]) { this.state = 'move'; }
      if (this.ch.finished || t > this.ch.cur.dur - 0.05) { this.setState('move', null); this.swordLit = false; }
    } else if (S === 'roll') {
      const u = this.ch.t / this.ch.cur.dur;
      this.iframe = u > 0.06 && u < 0.62;
      const f = fwdOf(this.rollDir); const sp = u < 0.75 ? 6.4 * (1 - u * 0.6) : 1.0;
      this.pos[0] += f[0] * sp * dt; this.pos[2] += f[2] * sp * dt;
      if (this.ch.finished) { this.iframe = false; this.setState('move', null); }
    } else if (S === 'heal') {
      this.pos[0] += wx * 0.9 * dt; this.pos[2] += wz * 0.9 * dt;
      if (!this.healed && this.ch.t > 0.55) {
        this.healed = true; this.stims--; this.healTo = Math.min(this.maxHp, this.hp + this.maxHp * 0.45); GM.audio.heal();
        for (let i = 0; i < 24; i++) GM.parts.emit({ pos: [this.pos[0] + R(-0.4, 0.4), R(0.3, 1.8), this.pos[2] + R(-0.4, 0.4)], vel: [0, R(0.6, 1.5), 0], life: R(0.6, 1.2), size: 0.05, col: [0.5, 2.5, 1.2, 1], soft: 0.2 });
      }
      if (this.healTo && this.hp < this.healTo) { this.hp = Math.min(this.healTo, this.hp + this.maxHp * 0.9 * dt); }
      if (this.ch.finished) { this.healTo = 0; this.setState('move', null); }
    } else if (S === 'hit') {
      const f = fwdOf(this.knockYaw); const k = Math.max(0, 1 - this.t / 0.3) * 3.5;
      this.pos[0] += f[0] * k * dt; this.pos[2] += f[2] * k * dt;
      if (this.t > 0.42) this.setState('move', null);
    }
    W.collide(this.pos, this.radius);
    this.ch.update(dt);
    this.syncNode();
    if (rifle) { this.updateRifle(dt); return; }
    // sword glow light and trail
    const tg = this.swordLit ? 1 : 0; this.glowAmt = OE.lerp(this.glowAmt || 0, tg, Math.min(1, dt * 18));
    const AT = GM.align ? GM.align.info('o') : { glow: [0.6, 2.2, 3.2], light: [0.3, 0.8, 1.0], trail: [0.35, 1.1, 2.0] }; // blade colour follows Orion's alignment
    this.swordGlow.mat.emissive = AT.glow.map((c) => c * (1 + 1.1 * this.glowAmt)); this.light.color = AT.light;
    M4.point(this.tipW, this.sword.world, [0, 0, 1.25]); M4.point(this.baseW, this.sword.world, [0, 0, 0.3]);
    this.light.pos = [(this.tipW[0] + this.baseW[0]) / 2, (this.tipW[1] + this.baseW[1]) / 2, (this.tipW[2] + this.baseW[2]) / 2];
    this.light.intensity = 0.12 + this.glowAmt * 2.2;
    if (this.glowAmt > 0.3) {
      for (let i = 0; i < 4; i++) { const u = rnd(); GM.parts.emit({ pos: [OE.lerp(this.baseW[0], this.tipW[0], u), OE.lerp(this.baseW[1], this.tipW[1], u), OE.lerp(this.baseW[2], this.tipW[2], u)], vel: [0, 0, 0], life: 0.14, size: 0.03, col: [AT.trail[0], AT.trail[1], AT.trail[2], 0.55], soft: 0.0, fade: 1 }); }
    }
  }
  updateRifle(dt) {
    this.aimHold -= dt; this.recoil = Math.max(0, this.recoil - dt * 9); this.muzzle.intensity = Math.max(0, this.muzzle.intensity - dt * 40);
    const st = this.state; const want = (this.aimHold > 0 || st === 'shoot') && st !== 'roll' && st !== 'heal' && st !== 'hit' && this.alive ? 1 : 0;
    this.aimBlend += (want - this.aimBlend) * Math.min(1, dt * 10);
    this.useIK = this.alive && st !== 'roll' && st !== 'heal';
    const melee = st === 'attack' ? Math.sin(Math.min(1, this.ch.progress) * Math.PI) : 0;
    if (this.useIK) A.rifleRig(this.ch, { aim: Math.max(this.aimBlend, melee), dir: [0, -0.02, 1], recoil: this.recoil, thrust: melee }, this.rifleModel);
    if (this.rifleGlowNode && GM.align) this.rifleGlowNode.mat.emissive = GM.align.info('t').glow;
    this.light.intensity = 0;
  }
  stepSound(dt, speed) {
    if (speed <= 0) { this.stepT = 0; return; }
    this.stepT = (this.stepT || 0) + dt * speed * 0.55;
    if (this.stepT > 1) { this.stepT = 0; GM.audio.step(); }
  }
  syncNode() { this.node.pos = this.pos; Q.yaw(this.node.rot, this.yaw); }
  doHits(a) {
    const f = fwdOf(this.yaw);
    for (const e of GM.enemies) {
      if (!e.alive || this.hitSet.has(e)) continue;
      const d = dist2(this.pos, e.pos); if (d > a.range + e.radius) continue;
      if (e.hover && e.pos[1] > 3.2) continue;
      const ang = Math.abs(OE.angDiff(this.yaw, yawTo(this.pos, e.pos)));
      if (ang > a.arc / 2 * Math.PI / 180 && d > e.radius + 0.6) continue;
      this.hitSet.add(e);
      const dmg = a.dmg * this.dmgMul * R(0.92, 1.08);
      e.damage(dmg, this.pos, { heavy: a.heavy, from: 'player' });
      const hp = [e.pos[0] - f[0] * e.radius * 0.6, e.hitY(), e.pos[2] - f[2] * e.radius * 0.6];
      GM.fx.sparks(hp, f, a.heavy ? 40 : 24, [3, 2.2, 1.2]); GM.fx.sparks(hp, f, 10, [0.6, 2.2, 3.5]);
      GM.audio.hit(a.heavy); GM.hitstop(a.heavy ? 0.11 : 0.06); GM.shake(a.heavy ? 0.35 : 0.18);
    }
  }
  damage(amount, fromPos, opts = {}) {
    if (!this.alive || this.iframe || GM.state !== 'play') return false;
    amount *= this.hurtMul;
    const ay = yawTo(this.pos, fromPos);
    if (this.state === 'block' && Math.abs(OE.angDiff(this.yaw, ay)) < 1.2 && !opts.unblockable) {
      this.stam -= amount * 0.9 + 6; this.stamDelay = 1.0;
      GM.fx.sparks([this.pos[0] + Math.sin(ay) * 0.5, 1.3, this.pos[2] + Math.cos(ay) * 0.5], [Math.sin(ay), 0, Math.cos(ay)], 18, [3, 2.5, 1.5]);
      GM.audio.block();
      if (this.stam < 0) { this.stam = 0; this.hp -= amount * 0.5; this.knockYaw = ay + Math.PI; this.setState('hit', 'Hit', 0.05); GM.hud.toast('GUARD BROKEN'); }
      else { this.hp -= amount * 0.1; }
      GM.shake(0.12);
    } else {
      this.hp -= amount; this.knockYaw = ay + Math.PI;
      if (!(this.state === 'attack' && this.atkClip === 'Heavy' && this.ch.t < 0.6)) { this.setState('hit', 'Hit', 0.05); this.swordLit = false; }
      GM.fx.blood([this.pos[0], 1.3, this.pos[2]]); GM.audio.hurt(); GM.shake(0.3); OE.R.hurt = 0.8;
    }
    if (this.hp <= 0) { this.hp = 0; this.die(); }
    return true;
  }
  die() { this.alive = false; this.state = 'dead'; this.ch.play('Death', 0.1, 1, true); this.swordLit = false; GM.onPlayerDeath(); }
};

/* ---------------- duelist boss: Talina Alvarez ----------------
   A human swordswoman on the same rig as Orion. She circles, guards and ripostes, rolls away from
   telegraphed attacks and chains combos; at half strength she drops the act and speeds up. */
const DUEL = {
  Attack1: { hit: [0.27, 0.44], dmg: 1.0, lunge: [0.16, 0.36, 2.2], range: 2.4, arc: 110 },
  Attack2: { hit: [0.30, 0.46], dmg: 1.1, lunge: [0.18, 0.38, 2.4], range: 2.4, arc: 100 },
  Heavy: { hit: [0.55, 0.70], dmg: 1.7, lunge: [0.40, 0.62, 3.6], range: 2.8, arc: 80, unblockable: true },
};
A.Duelist = class {
  constructor(asset, pos, yaw, T) {
    if (!swordMesh) buildWeapons();
    this.T = T; this.type = 'duelist'; this.boss = true; this.hover = false; this.radius = 0.45; this.home = pos.slice(); this.homeYaw = yaw;
    this.ch = new OE.Character(asset, { rim: 0.06 }); this.root = this.node = this.ch.node; OE.scene.add(this.node);
    const sw = new OE.Node(swordMesh, metalMat()); const gl = new OE.Node(swordGlow, { mode: 2, color: [0, 0, 0], emissive: T.glow });
    sw.add(gl); gl.castShadow = false; sw.attach = () => this.ch.boneWorld('R_Hand', this._hm || (this._hm = M4.create()));
    sw.pos = [0.0, -0.085, 0.02]; this.node.add(sw); this.sword = sw; this.swordGlow = gl; this.tipW = [0, 0, 0]; this.baseW = [0, 0, 0];
    this.light = { pos: [0, 1, 0], color: T.light, intensity: 0, range: 4 }; OE.R.lights.push(this.light);
    this.reset();
  }
  reset() {
    this.pos = this.home.slice(); this.yaw = this.homeYaw; this.maxHp = this.T.hp; this.hp = this.T.hp; this.alive = true; this.active = false;
    this.state = 'idle'; this.t = 0; this.cd = 1; this.phase2 = false; this.showBar = 0; this.poiseDmg = 0; this.combo = []; this.circ = 1; this.iframe = false;
    this.node.visible = true; this.ch.play('Idle', 0); this.lit = 0; this.deadT = 0;
    this.T = this.T0 || (this.T0 = this.T); if (this.sword) this.sword.visible = true; // undo any cutscene changes
  }
  hitY() { return 1.15; }
  get spd() { return this.phase2 ? 1.22 : 1; }
  set(s, clip, fade = 0.1, speed = 1) { this.state = s; this.t = 0; if (clip) this.ch.play(clip, fade, speed, true); }
  damage(amount, fromPos, opts = {}) {
    if (!this.alive || !this.active || this.iframe || this.state === 'defeated') return false;
    const ay = yawTo(this.pos, fromPos), facing = Math.abs(OE.angDiff(this.yaw, ay)) < 1.1;
    const free = this.state === 'chase' || this.state === 'guard';
    if (facing && (this.state === 'guard' || (free && !opts.heavy && !opts.light && rnd() < (this.phase2 ? 0.42 : 0.3)))) {
      // parried
      if (this.state !== 'guard') this.set('guard', 'Block', 0.06); this.guardT = 0.45; this.riposte = rnd() < 0.6;
      GM.fx.sparks([this.pos[0] + Math.sin(ay) * 0.5, 1.3, this.pos[2] + Math.cos(ay) * 0.5], [Math.sin(ay), 0, Math.cos(ay)], 22, [2.6, 1.2, 3.2]);
      GM.audio.block(); this.hp -= amount * 0.08; this.showBar = 3; return true;
    }
    this.hp -= amount; this.showBar = 3; GM.fx.blood([this.pos[0], 1.3, this.pos[2]]);
    this.poiseDmg += amount;
    if (!this.phase2 && this.hp < this.maxHp * 0.5) { this.phase2 = true; this.set('taunt', 'Block', 0.1); GM.onBossPhase2(this); this.poiseDmg = 0; }
    else if (this.poiseDmg > (opts.heavy ? 60 : 95) && this.state !== 'attack') { this.poiseDmg = 0; this.knockYaw = ay + Math.PI; this.set('hit', 'Hit', 0.05); }
    if (this.hp <= 0) { this.hp = 0; this.defeat(); }
    return true;
  }
  defeat() { // she doesn't die: she drops to one knee
    this.alive = false; this.state = 'defeated'; this.t = 0; this.ch.play('Kneel', 0.15, 1, true); this.lit = 0; GM.onEnemyKilled(this);
  }
  startCombo() {
    const r = rnd(); const p2 = this.phase2;
    this.combo = r < 0.35 ? ['Attack1', 'Attack2'] : r < 0.6 ? ['Attack1', 'Attack2', p2 ? 'Heavy' : 'Attack1'] : r < 0.8 ? ['Attack2', 'Attack1'] : ['Heavy'];
    if (rnd() < 0.3) GM.wardenTaunt();
    this.nextSwing();
  }
  nextSwing() { const c = this.combo.shift(); if (!c) { this.set('chase', null); this.cd = R(0.7, 1.5) / this.spd; return; } this.atk = DUEL[c]; this.hitDone = false; this.set('attack', c, 0.08, this.spd); }
  update(dt) {
    this.t += dt; this.showBar -= dt;
    const P = GM.player, S = this.state;
    const sync = () => { this.node.pos = this.pos; Q.yaw(this.node.rot, this.yaw); this.ch.update(dt); this.glow(dt); };
    if (S === 'defeated' || S === 'cut') { sync(); return; }
    if (!this.active || !P.alive) { if (S !== 'idle') this.set('idle', 'Idle', 0.3); sync(); return; }
    const d = dist2(this.pos, P.pos), ty = yawTo(this.pos, P.pos), sp = this.spd;
    this.cd -= dt;
    const face = (rate) => { this.yaw += OE.angDiff(this.yaw, ty) * Math.min(1, dt * rate); };
    if (S === 'idle') this.set('chase', null);
    else if (S === 'roar' || S === 'taunt') { face(6); this.ch.play('Block', 0.2); if (this.t > (S === 'roar' ? 1.6 : 1.1)) { this.set('chase', null); this.cd = 0.3; } }
    else if (S === 'chase') {
      face(8);
      // dodge a telegraphed swing
      if (P.state === 'attack' && d < 3.2 && P.ch.t < 0.25 && rnd() < dt * (this.phase2 ? 9 : 6)) {
        this.rollDir = ty + Math.PI + (rnd() < 0.5 ? 1 : -1) * R(0.6, 1.3); this.set('roll', 'Roll', 0.06, 1.05); return sync();
      }
      if (d > 2.6) {
        const v = (d > 6 ? 5.0 : 2.8) * sp; this.pos[0] += Math.sin(this.yaw) * v * dt; this.pos[2] += Math.cos(this.yaw) * v * dt;
        this.ch.play(d > 6 ? 'Run' : 'Walk', 0.2, d > 6 ? 1.05 : 1.1);
      } else { // circle, sword ready
        if (rnd() < dt * 0.5) this.circ = -this.circ;
        const a = ty + Math.PI / 2 * this.circ; const v = 1.5 * sp;
        this.pos[0] += Math.sin(a) * v * dt; this.pos[2] += Math.cos(a) * v * dt;
        if (d < 1.6) { this.pos[0] -= Math.sin(ty) * 1.5 * dt; this.pos[2] -= Math.cos(ty) * 1.5 * dt; }
        this.ch.play('Walk', 0.25, 0.8);
      }
      if (this.cd <= 0 && d < 3.0) this.startCombo();
      else if (this.cd <= 0 && d > 7 && rnd() < dt * 1.5) { this.combo = []; this.atk = DUEL.Heavy; this.hitDone = false; this.set('attack', 'Heavy', 0.1, sp); }
    } else if (S === 'attack') {
      const a = this.atk, t = this.ch.t;
      if (t < a.lunge[0]) face(7);
      if (t > a.lunge[0] && t < a.lunge[1] && d > 1.3) { const v = a.lunge[2] / (a.lunge[1] - a.lunge[0]); this.pos[0] += Math.sin(this.yaw) * v * dt; this.pos[2] += Math.cos(this.yaw) * v * dt; }
      this.lit = t > a.hit[0] - 0.1 && t < a.hit[1] + 0.05 ? 1 : 0;
      if (!this.hitDone && t >= a.hit[0] && t <= a.hit[1] && d < a.range + P.radius && Math.abs(OE.angDiff(this.yaw, ty)) < a.arc / 2 * Math.PI / 180) {
        this.hitDone = true; P.damage(this.T.dmg * a.dmg * (this.phase2 ? 1.1 : 1), this.pos, { boss: true, unblockable: a.unblockable });
      }
      if (this.ch.finished || t > this.ch.cur.dur - 0.04) { this.lit = 0; this.nextSwing(); }
    } else if (S === 'roll') {
      const u = this.ch.t / this.ch.cur.dur; this.iframe = u > 0.05 && u < 0.6;
      const v = u < 0.75 ? 6.0 * (1 - u * 0.6) : 1; this.pos[0] += Math.sin(this.rollDir) * v * dt; this.pos[2] += Math.cos(this.rollDir) * v * dt;
      if (this.ch.finished) { this.iframe = false; this.set('chase', null); this.cd = Math.min(this.cd, 0.25); }
    } else if (S === 'guard') {
      face(10); this.guardT -= dt;
      if (this.guardT <= 0) { if (this.riposte && d < 3.2) { this.combo = ['Attack2']; this.nextSwing(); } else this.set('chase', null); }
    } else if (S === 'hit') {
      const k = Math.max(0, 1 - this.t / 0.3) * 3; this.pos[0] += Math.sin(this.knockYaw) * k * dt; this.pos[2] += Math.cos(this.knockYaw) * k * dt;
      if (this.t > 0.5) { this.set('chase', null); this.cd = 0.15; }
    }
    W.collide(this.pos, this.radius);
    const A_ = W.arena, dx = this.pos[0] - A_.c[0], dz = this.pos[2] - A_.c[2], dd = Math.hypot(dx, dz);
    if (dd > A_.r - 1) { this.pos[0] = A_.c[0] + dx / dd * (A_.r - 1); this.pos[2] = A_.c[2] + dz / dd * (A_.r - 1); }
    const pd = dist2(this.pos, P.pos); if (pd < 0.9) { const a = yawTo(P.pos, this.pos); this.pos[0] = P.pos[0] + Math.sin(a) * 0.9; this.pos[2] = P.pos[2] + Math.cos(a) * 0.9; }
    sync();
  }
  glow(dt) {
    this.glowAmt = OE.lerp(this.glowAmt || 0, this.lit, Math.min(1, dt * 18));
    this.swordGlow.mat.emissive = this.T.glow.map((c) => c * (1 + 1.1 * this.glowAmt));
    M4.point(this.tipW, this.sword.world, [0, 0, 1.25]); M4.point(this.baseW, this.sword.world, [0, 0, 0.3]);
    this.light.pos = [(this.tipW[0] + this.baseW[0]) / 2, (this.tipW[1] + this.baseW[1]) / 2, (this.tipW[2] + this.baseW[2]) / 2]; this.light.intensity = 0.15 + this.glowAmt * 2.2;
    if (this.glowAmt > 0.3) for (let i = 0; i < 3; i++) { const u = rnd(); GM.parts.emit({ pos: [OE.lerp(this.baseW[0], this.tipW[0], u), OE.lerp(this.baseW[1], this.tipW[1], u), OE.lerp(this.baseW[2], this.tipW[2], u)], vel: [0, 0, 0], life: 0.14, size: 0.03, col: [this.T.glow[0] * 0.7, this.T.glow[1] * 0.7, this.T.glow[2] * 0.7, 0.55], soft: 0, fade: 1 }); }
  }
};

/* ---------------- companion: Thomas Hawthorne ---------------- */
A.Companion = class {
  constructor(asset) {
    this.ch = new OE.Character(asset, { rim: 0.06 }); this.node = this.ch.node; OE.scene.add(this.node);
    this.pos = [1.5, 0, -1.5]; this.yaw = 0; this.state = 'follow'; this.t = 0; this.cool = 1; this.maxHp = 780; this.hp = 780; // 3x durability this.alive = true; this.radius = 0.42;
    const rf = new OE.Node(rifleMesh, metalMat()); rf.mat.color = [0.7, 0.7, 0.72];
    const rg = new OE.Node(rifleGlow, { mode: 2, color: [0, 0, 0], emissive: [3, 0.6, 0.2] }); rg.castShadow = false; rf.add(rg); this.rifleGlowNode = rg;
    // the rifle is aimed procedurally: grip sits in the right hand, barrel points along the aim direction
    this.aimDir = [0, 0, 1]; this.aimBlend = 0; this.recoil = 0; this._rm = M4.create(); this._hm = M4.create(); this._hp = [0, 0, 0];
    this.rifleModel = M4.create(); this._rw = M4.create();
    rf.attach = () => this.alive ? M4.mul(this._rw, this.node.world, this.rifleModel) : this.rifleMatrix();
    rf.pos = [0, 0, 0]; this.node.add(rf); this.rifle = rf;
    this.burst = 0; this.burstT = 0;
    this.muzzle = { pos: [0, 0, 0], color: [1, 0.7, 0.3], intensity: 0, range: 7 }; OE.R.lights.push(this.muzzle);
    this.target = null; this.barkT = 0; this.downT = 0;
  }
  reset(pos) { this.pos = pos.slice(); this.hp = this.maxHp; this.alive = true; this.state = 'follow'; this.ch.play('Idle', 0); this.burst = 0; }
  rifleMatrix() {
    const hw = this.ch.boneWorld('R_Hand', this._hm); const hp = M4.point(this._hp, hw, [0, -0.075, 0.02]);
    // carry direction (low ready: forward and down) blended with the aim direction
    const f = fwdOf(this.yaw); const carry = [f[0] * 0.8, -0.6, f[2] * 0.8];
    const b = this.alive ? this.aimBlend : 0;
    let z = [OE.lerp(carry[0], this.aimDir[0], b), OE.lerp(carry[1], this.aimDir[1], b), OE.lerp(carry[2], this.aimDir[2], b)];
    let l = Math.hypot(...z); z = [z[0] / l, z[1] / l, z[2] / l];
    let x = [z[2], 0, -z[0]]; l = Math.hypot(...x) || 1; x = [x[0] / l, 0, x[2] / l]; // right-hand side, level
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const k = this.recoil * 0.07; // kick back along the barrel
    const o = [hp[0] - z[0] * (0.06 + k), hp[1] - z[1] * (0.06 + k) + 0.1, hp[2] - z[2] * (0.06 + k)];
    const m = this._rm; m[0] = x[0]; m[1] = x[1]; m[2] = x[2]; m[3] = 0; m[4] = y[0]; m[5] = y[1]; m[6] = y[2]; m[7] = 0; m[8] = z[0]; m[9] = z[1]; m[10] = z[2]; m[11] = 0; m[12] = o[0]; m[13] = o[1]; m[14] = o[2]; m[15] = 1;
    return m;
  }
  update(dt) {
    const P = GM.player; this.t += dt; this.cool -= dt;
    this.muzzle.intensity = Math.max(0, this.muzzle.intensity - dt * 40);
    this.recoil = Math.max(0, this.recoil - dt * 9);
    const wantAim = this.alive && this.target && this.target.alive && this.state === 'follow' ? 1 : 0;
    this.aimBlend += (wantAim - this.aimBlend) * Math.min(1, dt * 8);
    if (this.target && this.target.alive) {
      const m = this._hp; const tp = [this.target.pos[0], this.target.hitY(), this.target.pos[2]];
      const d = [tp[0] - m[0], tp[1] - m[1], tp[2] - m[2]]; const l = Math.hypot(...d) || 1;
      const ad = [d[0] / l, d[1] / l, d[2] / l];
      // never aim more than ~50 degrees off his facing (keeps it believable)
      const f = fwdOf(this.yaw); if (ad[0] * f[0] + ad[2] * f[2] < 0.6) { ad[0] = f[0]; ad[2] = f[2]; ad[1] = 0; }
      for (let i = 0; i < 3; i++) this.aimDir[i] += (ad[i] - this.aimDir[i]) * Math.min(1, dt * 14);
    } else { const f = fwdOf(this.yaw); this.aimDir = [f[0], 0, f[2]]; }
    if (!this.alive) {
      this.downT -= dt; this.ch.update(dt); this.sync();
      if (this.downT <= 0 && GM.state === 'play') { this.alive = true; this.hp = this.maxHp * 0.6; this.ch.play('Idle', 0.4); GM.say('thomas', 'I\'m up! You didn\'t think I\'d let you finish this alone, did you?', 4.3, 10); }
      return;
    }
    if (this.state === 'melee') {
      if (this.ch.t > 0.28 && !this.meleeDone && this.target) {
        this.meleeDone = true;
        if (this.target.alive && dist2(this.pos, this.target.pos) < 2.4 + this.target.radius) { this.target.damage(16, this.pos, { from: 'thomas' }); GM.audio.hit(false); GM.fx.sparks([this.target.pos[0], this.target.hitY(), this.target.pos[2]], fwdOf(this.yaw), 12, [3, 2, 1]); }
      }
      if (this.ch.finished) this.state = 'follow';
      this.ch.update(dt); W.collide(this.pos, this.radius); this.sync(); return;
    }
    if (this.state === 'hit') { if (this.t > 0.45) this.state = 'follow'; this.ch.update(dt); this.sync(); return; }
    // choose target
    if (!this.target || !this.target.alive || dist2(this.pos, this.target.pos) > 22 || rnd() < dt * 0.3) {
      let best = null, bd = 18;
      for (const e of GM.enemies) { if (!e.alive || !e.active) continue; const d = dist2(this.pos, e.pos); if (d < bd && W.ray([this.pos[0], 1.5, this.pos[2]], [e.pos[0], e.hitY(), e.pos[2]], 1.6) > 0.98) { bd = d; best = e; } }
      if (GM.lock && GM.lock.alive && dist2(this.pos, GM.lock.pos) < 18) best = GM.lock;
      this.target = best;
    }
    const tgt = this.target;
    // desired position: behind-right of player, or flanking the target
    const py = P.yaw; let dx, dz;
    if (tgt) { const a = yawTo(tgt.pos, P.pos) + 0.9; const r = tgt.boss ? 9 : 6.5; dx = tgt.pos[0] + Math.sin(a) * r; dz = tgt.pos[2] + Math.cos(a) * r; }
    else { dx = P.pos[0] + Math.sin(py + 2.4) * 2.4; dz = P.pos[2] + Math.cos(py + 2.4) * 2.4; }
    const ddx = dx - this.pos[0], ddz = dz - this.pos[2]; const dd = Math.hypot(ddx, ddz);
    if (dist2(this.pos, P.pos) > 28) { this.pos = [P.pos[0] - Math.sin(py) * 2, 0, P.pos[2] - Math.cos(py) * 2]; }
    let moving = false;
    if (dd > (tgt ? 1.5 : 1.2)) {
      const sp = dd > 5 ? 5.0 : 2.4; moving = true;
      this.pos[0] += ddx / dd * sp * dt; this.pos[2] += ddz / dd * sp * dt;
      if (!tgt) this.yaw += OE.angDiff(this.yaw, Math.atan2(ddx, ddz)) * Math.min(1, dt * 8);
      this.ch.play(sp > 3 ? 'Run' : (tgt ? 'WalkAim' : 'Walk'), 0.2, sp > 3 ? 1 : 1.05);
    }
    // keep apart from player
    const pd = dist2(this.pos, P.pos); if (pd < 1.1) { const a = yawTo(P.pos, this.pos); this.pos[0] = P.pos[0] + Math.sin(a) * 1.1; this.pos[2] = P.pos[2] + Math.cos(a) * 1.1; }
    if (tgt) {
      const ty = yawTo(this.pos, tgt.pos); this.yaw += OE.angDiff(this.yaw, ty) * Math.min(1, dt * 10);
      const d = dist2(this.pos, tgt.pos);
      if (d < 1.9 + tgt.radius && !tgt.boss && this.cool < 0.5 && !this.burst) { this.state = 'melee'; this.meleeDone = false; this.ch.play('Attack1', 0.1, 1, true); this.cool = 1.4; }
      else {
        const aimed = Math.abs(OE.angDiff(this.yaw, ty)) < 0.3 && this.aimBlend > 0.8;
        if (!this.burst && this.cool <= 0 && aimed && (!moving || dd < 5)) { this.burst = 3; this.burstT = 0; this.ch.play('Shoot', 0.06, 1, true); }
        if (this.burst) {
          this.burstT -= dt;
          if (this.burstT <= 0) { this.shoot(tgt); this.burst--; this.burstT = 0.12; if (!this.burst) this.cool = R(0.7, 1.1); }
        } else if (!moving) this.ch.play('Aim', 0.15);
      }
    } else if (!moving) this.ch.play('Idle', 0.3);
    W.collide(this.pos, this.radius);
    this.ch.update(dt); this.sync();
    // barks
    this.barkT -= dt;
  }
  shoot(tgt) {
    if (!tgt.alive) { this.burst = 0; return; }
    const W_ = this.rifle.world;
    const m = M4.point([0, 0, 0], W_, [0, 0.04, 0.74]);          // muzzle
    const hit = rnd() < 0.82;
    const tp = hit ? [tgt.pos[0] + R(-0.15, 0.15), tgt.hitY() + R(-0.2, 0.2), tgt.pos[2] + R(-0.15, 0.15)]
                   : [tgt.pos[0] + R(-1.2, 1.2), tgt.hitY() + R(-0.6, 0.9), tgt.pos[2] + R(-1.2, 1.2)];
    if (hit) tgt.damage(tgt.boss ? 8 : 9, this.pos, { from: 'thomas', light: true });
    const d = [tp[0] - m[0], tp[1] - m[1], tp[2] - m[2]]; const l = Math.hypot(...d); const u = [d[0] / l, d[1] / l, d[2] / l];
    // tracer: a bright streak travelling to the target
    GM.parts.emit({ pos: [m[0] + u[0] * 1.2, m[1] + u[1] * 1.2, m[2] + u[2] * 1.2], vel: [u[0] * 90, u[1] * 90, u[2] * 90], stretch: 1.1, size: 0.03, life: Math.min(0.2, l / 90), col: [5, 3.2, 1.2, 1], soft: 0.2, fade: 0 });
    // muzzle flash: star + glow + smoke
    GM.parts.emit({ pos: m.slice(), vel: [0, 0, 0], life: 0.07, size: 0.22, col: [5, 3, 1.2, 1], soft: 0, fade: 0, rot: R(0, 6) });
    GM.parts.emit({ pos: [m[0] + u[0] * 0.15, m[1] + u[1] * 0.15, m[2] + u[2] * 0.15], vel: [u[0] * 0.01, u[1] * 0.01, u[2] * 0.01], stretch: 0.22, life: 0.05, size: 0.08, col: [5, 3.5, 1.5, 1], soft: 0, fade: 0 });
    GM.parts.emit({ pos: m.slice(), vel: [u[0] * 1.5 + R(-0.2, 0.2), R(0.2, 0.6), u[2] * 1.5 + R(-0.2, 0.2)], drag: 2, life: R(0.6, 1.0), size: 0.08, grow: 0.4, col: [0.35, 0.33, 0.3, 0.35], add: false, soft: 0 });
    // ejected shell casing (to his right)
    const ej = M4.point([0, 0, 0], W_, [0.05, 0.05, 0.2]); const rx = [W_[0], W_[1], W_[2]];
    GM.parts.emit({ pos: ej, vel: [rx[0] * 2.5 + R(-0.3, 0.3), R(1.5, 2.5), rx[2] * 2.5 + R(-0.3, 0.3)], grav: 9.8, floor: 0.02, life: 1.2, size: 0.012, stretch: 0.02, col: [2.2, 1.6, 0.6, 1], soft: 0.4, fade: 1, add: true });
    // impact
    if (hit) { GM.fx.sparks(tp, [-u[0], 0.3, -u[2]], 10, [3.5, 2.2, 1]); }
    else GM.fx.dust([tp[0], 0.1, tp[2]], 2);
    this.muzzle.pos = m.slice(); this.muzzle.intensity = 6; this.recoil = 1;
    GM.audio.gun(dist2(this.pos, GM.player.pos));
  }
  sync() {
    this.node.pos = this.pos; Q.yaw(this.node.rot, this.yaw);
    if (GM.align && this.rifleGlowNode) this.rifleGlowNode.mat.emissive = GM.align.info('t').glow; // rifle stripe follows Thomas's alignment
    if (!this.alive) return;
    // aim direction from world into Thomas's model space
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), d = this.aimDir;
    const dir = [d[0] * c - d[2] * s, d[1], d[0] * s + d[2] * c];
    const melee = this.state === 'melee' ? Math.sin(Math.min(1, this.ch.progress) * Math.PI) : 0;
    A.rifleRig(this.ch, { aim: Math.max(this.aimBlend, melee), dir: this.state === 'melee' ? [0, -0.1, 1] : dir, recoil: this.recoil, thrust: melee }, this.rifleModel);
  }
  damage(amount, fromPos, opts = {}) {
    if (!this.alive) return false;
    // extra hardened against the Iron Warden: its blows, shockwaves and barrage do half damage to him
    if (opts.boss || GM.inBoss) amount *= 0.5;
    this.hp -= amount; GM.fx.blood([this.pos[0], 1.3, this.pos[2]]);
    if (this.hp <= 0) { this.alive = false; this.downT = GM.inBoss ? 10 : 20; this.ch.play('Death', 0.1, 1, true); GM.say('thomas', 'I\'m down! Commander — keep fighting, I\'ll patch myself up!', 4.8, 9); return true; }
    if (opts.boss || GM.inBoss) return true; // shrugs off the Warden's hits without flinching
    this.state = 'hit'; this.t = 0; this.ch.play('Hit', 0.05, 1, true); return true;
  }
};

/* ---------------- enemies: war machines ---------------- */
const PARTS = {};
function partMeshes() {
  if (PARTS.done) return; PARTS.done = true;
  const mk = (f) => { const g = new OE.Geo(); f(g); return g.build(); };
  const plate = [0.55, 0.56, 0.6, 1], dark = [0.16, 0.16, 0.18, 1], acc = [0.45, 0.2, 0.15, 1];
  PARTS.pelvis = mk(g => { g.box([0, 0, 0], [0.42, 0.22, 0.26], { col: dark }); g.box([0, -0.05, 0.12], [0.3, 0.2, 0.06], { col: plate }); });
  PARTS.torso = mk(g => {
    g.box([0, 0.12, 0], [0.22, 0.3, 0.18], { col: dark });             // spine core
    g.box([0, 0.42, 0.02], [0.56, 0.36, 0.34], { col: plate });         // chest
    g.box([0, 0.46, 0.17], [0.4, 0.26, 0.06], { col: plate, rx: -8 });  // chest plate
    g.box([0, 0.5, -0.2], [0.36, 0.42, 0.14], { col: dark });           // power pack
    g.cyl([0.1, 0.5, -0.28], 0.05, 0.42, 8, { col: acc }); g.cyl([-0.1, 0.5, -0.28], 0.05, 0.42, 8, { col: acc });
  });
  PARTS.head = mk(g => { g.box([0, 0.12, 0], [0.24, 0.24, 0.26], { col: plate }); g.box([0, 0.06, 0.07], [0.28, 0.08, 0.2], { col: dark }); g.cyl([0, -0.02, 0], 0.07, 0.08, 8, { col: dark }); });
  PARTS.visor = mk(g => { g.box([0, 0.14, 0.135], [0.18, 0.045, 0.01], { col: [1, 1, 1, 1] }); });
  PARTS.shoulder = mk(g => { g.sphere([0, 0, 0], 0.11, 6, { col: dark }); g.box([0, 0.06, 0], [0.24, 0.12, 0.26], { col: plate }); });
  PARTS.upper = mk(g => { g.box([0, -0.16, 0], [0.12, 0.32, 0.12], { col: dark }); g.box([0, -0.1, 0], [0.15, 0.16, 0.15], { col: plate }); });
  PARTS.fore = mk(g => { g.box([0, -0.16, 0], [0.13, 0.32, 0.13], { col: plate }); g.box([0, -0.36, 0.0], [0.1, 0.1, 0.1], { col: dark }); });
  PARTS.blade = mk(g => { g.box([0, -0.36, 0.25], [0.03, 0.08, 0.7], { col: [0.4, 0.4, 0.42, 1] }); });
  PARTS.bladeGlow = mk(g => { g.box([0, -0.405, 0.25], [0.012, 0.01, 0.68], { col: [1, 1, 1, 1] }); });
  PARTS.thigh = mk(g => { g.box([0, -0.2, 0], [0.16, 0.4, 0.17], { col: dark }); g.box([0, -0.18, 0.04], [0.18, 0.3, 0.14], { col: plate }); });
  PARTS.shin = mk(g => { g.box([0, -0.22, 0], [0.14, 0.44, 0.15], { col: plate }); g.box([0, -0.02, 0.06], [0.12, 0.12, 0.1], { col: dark }); });
  PARTS.foot = mk(g => { g.box([0, -0.05, 0.06], [0.16, 0.1, 0.3], { col: dark }); });
  PARTS.anchor = mk(g => { // the Tidebreaker's anchor-hammer
    g.cyl([0, -1.9, 0.05], 0.07, 1.75, 8, { col: dark });
    g.box([0, -2.05, 0.05], [0.5, 0.42, 0.42], { col: [0.42, 0.44, 0.47, 1] });
    for (const s of [-1, 1]) g.box([0, -2.15, 0.05 + s * 0.42], [0.12, 0.2, 0.5], { rx: s * 35, col: [0.4, 0.42, 0.45, 1] });
    g.box([0, -0.22, 0.05], [0.1, 0.1, 0.5], { col: dark }); });
  PARTS.anchorGlow = mk(g => { g.box([0, -2.05, 0.268], [0.3, 0.08, 0.012], { col: [1, 1, 1, 1] }); g.box([0, -2.05, -0.168], [0.3, 0.08, 0.012], { col: [1, 1, 1, 1] }); });
  PARTS.cleaver = mk(g => { g.box([0, -0.4, 0.0], [0.05, 0.5, 0.06], { col: dark }); g.box([0, -1.25, 0.12], [0.06, 1.3, 0.38], { col: [0.5, 0.48, 0.47, 1] }); g.box([0, -0.62, 0.0], [0.08, 0.06, 0.3], { col: dark }); });
  PARTS.cleaverGlow = mk(g => { g.box([0, -1.25, 0.315], [0.02, 1.25, 0.012], { col: [1, 1, 1, 1] }); });
  PARTS.droneBody = mk(g => { g.sphere([0, 0, 0], 0.34, 10, { col: plate }); g.cyl([0, -0.05, 0], 0.5, 0.1, 16, { col: dark }); for (const s of [-1, 1]) g.box([s * 0.48, -0.02, 0.1], [0.1, 0.12, 0.5], { col: dark }); });
  PARTS.droneEye = mk(g => { g.sphere([0, 0, 0.3], 0.09, 6, { col: [1, 1, 1, 1] }); });
}
const TYPES = {
  trooper: { s: 1.0, hp: 120, dmg: 36, speed: 2.4, run: 3.8, range: 2.0, wind: 0.55, strike: 0.18, rec: 0.75, poise: 45, scrap: 60, radius: 0.5, aggro: 13, name: 'Pact Revenant' },
  brute: { s: 1.38, hp: 340, dmg: 66, speed: 1.9, run: 2.8, range: 2.9, wind: 0.95, strike: 0.22, rec: 1.1, poise: 110, scrap: 220, radius: 0.75, aggro: 14, name: 'Pact Juggernaut' },
  drone: { s: 1.0, hp: 55, dmg: 28, speed: 3.5, run: 4.5, range: 9, wind: 0.7, strike: 0.1, rec: 1.6, poise: 30, scrap: 45, radius: 0.55, aggro: 17, name: 'Seeker Drone', hover: true },
  tidebreaker: { s: 2.55, hp: 2100, dmg: 90, speed: 2.2, run: 3.3, range: 5.3, wind: 0.95, strike: 0.3, rec: 1.0, poise: 9999, scrap: 3600, radius: 1.6, aggro: 40,
    name: 'TIDEBREAKER, Spearhead of the Pact Landing Fleet', boss: true, color: [0.5, 0.56, 0.62], color2: [0.6, 0.5, 0.5], weapon: 'anchor' },
  boss: { s: 2.3, color: [0.75, 0.62, 0.55], color2: [0.85, 0.5, 0.42], weapon: 'cleaver', hp: 1700, dmg: 85, speed: 2.4, run: 3.4, range: 5.0, wind: 0.9, strike: 0.3, rec: 1.0, poise: 9999, scrap: 3000, radius: 1.5, aggro: 40, name: 'IRON WARDEN, Last Sentinel of the Sino-Russian Pact', boss: true },
};

A.Enemy = class {
  constructor(type, pos, yaw = Math.PI) {
    partMeshes(); const T = this.T = TYPES[type]; this.type = type; this.home = pos.slice(); this.homeYaw = yaw;
    this.radius = T.radius; this.boss = !!T.boss; this.hover = !!T.hover;
    this.mat = metalMat(); this.mat.triScale = 1.2 / T.s; this.mat.color = T.color ? T.color.slice() : type === 'brute' ? [0.62, 0.6, 0.55] : [0.72, 0.74, 0.8];
    this.glowMat = { mode: 2, color: [0, 0, 0], emissive: [3.5, 0.25, 0.1] };
    this.root = new OE.Node(); OE.scene.add(this.root);
    this.root.scl = [T.s, T.s, T.s];
    this.n = {};
    if (this.hover) this.buildDrone(); else this.buildBiped(type);
    this.light = { pos: [0, 0, 0], color: [1, 0.15, 0.05], intensity: 0.0, range: 3.5 * T.s }; OE.R.lights.push(this.light);
    this.reset();
  }
  part(mesh, parent, pos, mat) { const n = new OE.Node(mesh, mat || this.mat); n.pos = pos; (parent || this.root).add(n); return n; }
  buildBiped(type) {
    const n = this.n; const s = 1;
    n.hips = this.part(PARTS.pelvis, this.root, [0, 1.0, 0]);
    n.torso = this.part(null, n.hips, [0, 0.08, 0]); n.torsoM = this.part(PARTS.torso, n.torso, [0, 0, 0]);
    n.head = this.part(PARTS.head, n.torso, [0, 0.66, 0.02]); this.part(PARTS.visor, n.head, [0, 0, 0], this.glowMat);
    for (const [side, sg] of [['L', 1], ['R', -1]]) {
      const sh = this.part(PARTS.shoulder, n.torso, [sg * 0.36, 0.52, 0]);
      const up = this.part(PARTS.upper, sh, [0, -0.04, 0]); const fo = this.part(PARTS.fore, up, [0, -0.32, 0]);
      n['sh' + side] = sh; n['el' + side] = fo;
      const hip = this.part(PARTS.thigh, n.hips, [sg * 0.13, -0.06, 0]); const kn = this.part(PARTS.shin, hip, [0, -0.42, 0]); this.part(PARTS.foot, kn, [0, -0.46, 0]);
      n['leg' + side] = hip; n['kn' + side] = kn;
    }
    if (this.T.weapon === 'anchor') {
      const c = this.part(PARTS.anchor, n.elR, [0, -0.3, 0.05]); this.part(PARTS.anchorGlow, c, [0, 0, 0], this.glowMat); n.weapon = c;
      OE.Q.euler(c.rot, -90, 0, 0);
      this.part(PARTS.blade, n.elL, [0, 0, 0]); this.part(PARTS.bladeGlow, n.elL, [0, 0, 0], this.glowMat);
      this.part(PARTS.shoulder, n.torso, [0, 0.62, -0.28]); // reactor housing on its back
    } else if (this.T.weapon === 'cleaver') {
      const c = this.part(PARTS.cleaver, n.elR, [0, -0.36, 0.05]); this.part(PARTS.cleaverGlow, c, [0, 0, 0], this.glowMat); n.weapon = c;
      OE.Q.euler(c.rot, -90, 0, 0);
    } else {
      this.part(PARTS.blade, n.elR, [0, 0, 0]); this.part(PARTS.bladeGlow, n.elR, [0, 0, 0], this.glowMat);
      if (type === 'brute') { this.part(PARTS.blade, n.elL, [0, 0, 0]); this.part(PARTS.bladeGlow, n.elL, [0, 0, 0], this.glowMat); }
    }
  }
  buildDrone() {
    const n = this.n; n.body = this.part(PARTS.droneBody, this.root, [0, 0, 0]); this.part(PARTS.droneEye, n.body, [0, 0, 0], this.glowMat);
  }
  reset() {
    const T = this.T; this.pos = this.home.slice(); if (this.hover) this.pos[1] = 2.6; this.yaw = this.homeYaw;
    this.maxHp = T.hp; this.hp = T.hp; this.alive = true; this.state = 'idle'; this.t = 0; this.poiseDmg = 0; this.cd = R(0.5, 1.5);
    this.walkPh = 0; this.deadT = 0; this.root.visible = true; this.active = !this.boss; this.target = null; this.phase2 = false; this.showBar = 0;
    this.root.pos = this.pos; this.mat.flash = 0; this.glowMat.emissive = [3.5, 0.25, 0.1];
    this.pose({});
  }
  hitY() { return this.hover ? this.pos[1] : 1.3 * this.T.s; }
  pose(p) {
    const n = this.n; if (this.hover) return;
    const e = (node, x = 0, y = 0, z = 0) => Q.euler(node.rot, x, y, z);
    n.hips.pos = [0, 1.0 + (p.y || 0), p.hz || 0];
    e(n.hips, p.hp || 0, p.hy || 0, p.hr || 0); e(n.torso, p.tp || 0, p.ty || 0, p.tr || 0); e(n.head, p.np || 0, p.ny || 0, 0);
    e(n.shL, p.sLx ?? -10, p.sLy || 0, p.sLz ?? 12); e(n.shR, p.sRx ?? -20, p.sRy || 0, p.sRz ?? -12);
    e(n.elL, p.eL ?? -25, 0, 0); e(n.elR, p.eR ?? -45, 0, 0);
    e(n.legL, p.lL || 0, 0, 3); e(n.legR, p.lR || 0, 0, -3); e(n.knL, p.kL || 6, 0, 0); e(n.knR, p.kR || 6, 0, 0);
  }
  damage(amount, fromPos, opts = {}) {
    if (!this.alive) return false;
    if (this.boss && !this.active) return false;
    this.hp -= amount; this.mat.flash = 0.45; this.showBar = 4;
    if (this.state === 'idle') { this.state = 'chase'; GM.alert(this); }
    if (opts.from === 'thomas' && rnd() < 0.15) this.target = GM.companion;
    this.poiseDmg += amount * (opts.heavy ? 1.6 : 1);
    if (this.hp <= 0) { this.die(); return true; }
    if (this.poiseDmg >= this.T.poise && this.state !== 'strike') { this.poiseDmg = 0; this.state = 'stagger'; this.t = 0; this.knockYaw = yawTo(fromPos, this.pos); }
    if (this.boss && !this.phase2 && this.hp < this.maxHp * 0.5) { this.phase2 = true; this.state = 'roar'; this.t = 0; GM.onBossPhase2(this); }
    return true;
  }
  die() {
    this.alive = false; this.state = 'dead'; this.t = 0; this.light.intensity = 0;
    GM.onEnemyKilled(this);
    GM.fx.explode([this.pos[0], this.hitY(), this.pos[2]], this.boss ? 3 : this.T.s);
  }
  update(dt) {
    const T = this.T, P = GM.player; this.t += dt; this.cd -= dt; this.showBar -= dt;
    this.mat.flash = Math.max(0, (this.mat.flash || 0) - dt * 4);
    this.root.pos = this.pos; Q.yaw(this.root.rot, this.yaw);
    if (this.state === 'dead') return this.updateDead(dt);
    if (!this.active) { this.pose({}); return; }
    if (!this.target || !this.target.alive || rnd() < dt * 0.2) {
      this.target = P.alive ? P : (GM.companion.alive ? GM.companion : null);
      if (GM.companion.alive && P.alive && rnd() < 0.25 && dist2(this.pos, GM.companion.pos) < dist2(this.pos, P.pos) * 0.8) this.target = GM.companion;
    }
    const tg = this.target; if (!tg) { this.pose({}); return; }
    const d = dist2(this.pos, tg.pos), ty = yawTo(this.pos, tg.pos);
    const spd = this.phase2 ? 1.3 : 1;
    if (this.hover) return this.updateDrone(dt, tg, d, ty);
    const glow = (v) => { this.glowMat.emissive = [3.5 * v, 0.25 * v + 0.1 * (v > 1.2 ? v : 0), 0.1 * v]; this.light.intensity = (v - 0.8) * 2; };
    const S = this.state;
    if (S === 'idle') {
      this.pose({ sRx: -25, eR: -55 }); glow(1);
      if ((d < T.aggro && (W.ray([this.pos[0], 1.5, this.pos[2]], [tg.pos[0], 1.5, tg.pos[2]], 1.6) > 0.98 || d < 5)) || this.hp < this.maxHp) { this.state = 'chase'; GM.alert(this); }
    } else if (S === 'chase') {
      this.yaw += OE.angDiff(this.yaw, ty) * Math.min(1, dt * 5 * spd);
      const want = this.boss ? T.range * 0.8 : T.range * 0.85;
      let moved = 0;
      if (d > want) { const sp = (d > 6 ? T.run : T.speed) * spd; this.pos[0] += Math.sin(this.yaw) * sp * dt; this.pos[2] += Math.cos(this.yaw) * sp * dt; moved = sp; }
      else if (d < want * 0.5) { this.pos[0] -= Math.sin(this.yaw) * 1.2 * dt; this.pos[2] -= Math.cos(this.yaw) * 1.2 * dt; moved = 1.2; }
      this.walk(dt, moved);
      glow(1);
      if (this.cd <= 0 && d < T.range + (this.boss ? 3 : 0.3) && Math.abs(OE.angDiff(this.yaw, ty)) < 0.5) this.chooseAttack(d);
      else if (this.boss && this.cd <= 0 && d > 9) { this.atk = 'charge'; this.state = 'windup'; this.t = 0; }
      else if (this.boss && this.phase2 && this.cd <= -1.5 && rnd() < dt * 0.6) { this.atk = 'barrage'; this.state = 'windup'; this.t = 0; }
    } else if (S === 'windup') {
      const w = this.windTime() / spd; const u = Math.min(1, this.t / w);
      if (this.atk !== 'charge' || u < 0.7) this.yaw += OE.angDiff(this.yaw, ty) * Math.min(1, dt * (this.boss ? 2.2 : 4));
      this.poseAttack(u, 0); glow(1 + u * 1.5);
      if (this.t >= w) { this.state = 'strike'; this.t = 0; this.hitDone = new Set(); this.onStrike(); }
    } else if (S === 'strike') {
      const sd = this.strikeTime(); const u = Math.min(1, this.t / sd);
      this.poseAttack(1, u); glow(2.5);
      if (this.atk === 'charge') { const sp = 15 * spd; this.pos[0] += Math.sin(this.yaw) * sp * dt; this.pos[2] += Math.cos(this.yaw) * sp * dt; this.walk(dt * 2.5, 6);
        if (this.t % 0.1 < dt) GM.fx.dust([this.pos[0], 0.2, this.pos[2]], 2); }
      this.strikeHits(u);
      if (this.t >= sd) { this.state = 'recover'; this.t = 0; }
    } else if (S === 'recover') {
      const r = T.rec * (this.atk === 'charge' ? 1.3 : 1) / spd; const u = Math.min(1, this.t / r);
      this.poseAttack(1 - u * 0.999, 1); glow(1.3 - u * 0.3);
      if (this.t >= r) { this.state = 'chase'; this.cd = this.boss ? R(0.4, 1.2) / spd : R(0.8, 2.2); }
    } else if (S === 'stagger') {
      const u = this.t / 0.75; this.pose({ tp: -20 * Math.sin(u * Math.PI), np: -15, sLz: 40, sRz: -40, y: -0.1, kL: 25, kR: 25, lL: -15, lR: -15 });
      this.pos[0] += Math.sin(this.knockYaw) * (1 - u) * 2.2 * dt; this.pos[2] += Math.cos(this.knockYaw) * (1 - u) * 2.2 * dt; glow(0.5);
      if (u >= 1) { this.state = 'chase'; this.cd = 0.3; }
    } else if (S === 'roar') {
      const u = this.t / 1.8; this.pose({ tp: -25, np: -30, sLx: -60, sLz: 70, sRx: -60, sRz: -70, eL: -60, eR: -60, y: -0.05 });
      glow(2 + Math.sin(this.t * 30)); if (this.t % 0.08 < dt) GM.fx.sparks([this.pos[0], 2.5 * this.T.s * 0.6, this.pos[2]], [0, 1, 0], 6, [3, 0.6, 0.2]);
      if (u >= 1) { this.state = 'chase'; this.cd = 0.2; this.mat.color = (T.color2 || [0.85, 0.5, 0.42]).slice(); }
    }
    this.separate();
    W.collide(this.pos, this.radius);
    if (this.boss) { const A_ = W.arena; const dx = this.pos[0] - A_.c[0], dz = this.pos[2] - A_.c[2]; const dd = Math.hypot(dx, dz); if (dd > A_.r - 1.5) { this.pos[0] = A_.c[0] + dx / dd * (A_.r - 1.5); this.pos[2] = A_.c[2] + dz / dd * (A_.r - 1.5); } }
    const hp = M4.point([0, 0, 0], this.n.head.world, [0, 0.14, 0.2]); this.light.pos = hp;
  }
  windTime() { const T = this.T; if (!this.boss) return T.wind; return { sweep: 1.0, slam: 1.25, charge: 0.75, barrage: 1.0 }[this.atk]; }
  strikeTime() { if (!this.boss) return this.T.strike; return { sweep: 0.35, slam: 0.25, charge: 0.95, barrage: 0.3 }[this.atk]; }
  chooseAttack(d) {
    if (this.boss) { if (GM.wardenChildren) { GM.wardenChildren = false; GM.warden('children', false); } else GM.wardenTaunt(); }
    if (this.boss) { const r = rnd(); this.atk = d < 4.5 ? (r < 0.55 ? 'sweep' : 'slam') : (r < 0.5 ? 'slam' : 'charge'); }
    else this.atk = this.type === 'brute' ? 'slam' : (rnd() < 0.6 ? 'slash' : 'thrust');
    this.state = 'windup'; this.t = 0;
  }
  onStrike() {
    GM.audio.enemySwing(this.boss || this.type === 'brute');
    if (this.atk === 'barrage') {
      GM.warden('barrage', false);
      const tg = this.target || GM.player;
      for (let i = 0; i < (this.phase2 ? 7 : 5); i++) { const a = rnd() * Math.PI * 2, r = i === 0 ? 0 : R(1.5, 5); GM.addMarker([tg.pos[0] + Math.cos(a) * r, 0, tg.pos[2] + Math.sin(a) * r], 1.3 + i * 0.12, 2.3, 60); }
    }
  }
  strikeHits(u) {
    const T = this.T; const P = GM.player, C = GM.companion;
    for (const tg of [P, C]) {
      if (!tg.alive || this.hitDone.has(tg)) continue;
      const d = dist2(this.pos, tg.pos); const ang = Math.abs(OE.angDiff(this.yaw, yawTo(this.pos, tg.pos)));
      let hit = false, dmg = T.dmg, opts = {};
      if (this.atk === 'slash' || this.atk === 'thrust') hit = u > 0.3 && d < T.range + 0.6 && ang < (this.atk === 'slash' ? 1.2 : 0.6);
      else if (this.atk === 'slam' && !this.boss) { hit = u > 0.5 && d < T.range + 0.5 && ang < 0.9; if (u > 0.5 && !this.slamFx) { this.slamFx = true; this.impact(2.5); } }
      else if (this.atk === 'sweep') hit = u > 0.25 && u < 0.9 && d < 6.2 && ang < 1.9;
      else if (this.atk === 'slam') { const ip = [this.pos[0] + Math.sin(this.yaw) * 4.2, 0, this.pos[2] + Math.cos(this.yaw) * 4.2]; if (u > 0.6 && !this.slamFx) { this.slamFx = true; this.impact(4, ip); } hit = u > 0.6 && dist2(ip, tg.pos) < 2.6; dmg = T.dmg * 1.25; }
      else if (this.atk === 'charge') { hit = d < this.radius + 0.9; dmg = T.dmg * 0.9; }
      if (hit) { this.hitDone.add(tg); tg.damage(dmg * (this.phase2 ? 1.15 : 1), this.pos, Object.assign({ boss: this.boss }, opts)); }
    }
    if (u >= 1) this.slamFx = false;
  }
  impact(r, at) {
    const p = at || [this.pos[0] + Math.sin(this.yaw) * 1.8 * this.T.s, 0, this.pos[2] + Math.cos(this.yaw) * 1.8 * this.T.s];
    GM.fx.dust(p, 30); GM.fx.sparks([p[0], 0.2, p[2]], [0, 1, 0], 30, [3, 1.5, 0.5]); GM.shake(this.boss ? 0.6 : 0.35); GM.audio.slam();
    if (this.boss) GM.addShockwave(p, this.phase2 ? 9 : 7, 40);
  }
  walk(dt, speed) {
    this.walkPh += dt * (1.4 + speed * 1.1) / Math.sqrt(this.T.s);
    const s = Math.sin(this.walkPh * 2), c = Math.cos(this.walkPh * 2); const a = Math.min(1, speed / 3);
    this.pose({ lL: -28 * s * a, lR: 28 * s * a, kL: 8 + 40 * Math.max(0, c) * a, kR: 8 + 40 * Math.max(0, -c) * a, tp: 8 * a, ty: 6 * s * a,
      sLx: -10 + 22 * s * a, sRx: -25 - 10 * s * a, eR: -55, y: -0.03 * Math.abs(c) * a, hy: -5 * s * a });
    if (a > 0.3 && Math.abs(s) > 0.98 && !this._stepped) { this._stepped = true; if (dist2(this.pos, GM.player.pos) < 14) GM.audio.mechStep(this.T.s); } if (Math.abs(s) < 0.5) this._stepped = false;
  }
  poseAttack(w, st) { // w: windup amount 0..1, st: strike progress 0..1
    const a = this.atk; const e = (x) => x * x * (3 - 2 * x); w = e(Math.min(1, w)); const s = e(Math.min(1, st));
    const L = OE.lerp;
    if (a === 'slash' || a === 'sweep') {
      this.pose({ ty: L(L(0, -45, w), 50, s), tp: 10, sRx: L(L(-20, -110, w), -80, s), sRy: L(L(0, -60, w), 80, s), sRz: L(-12, -60, w), eR: L(-45, -30, w),
        lL: -20 * w, kL: 20 * w, lR: 10, kR: 15, y: -0.08 * w, sLz: 30 });
    } else if (a === 'thrust') {
      this.pose({ ty: L(-20 * w, 10, s), tp: L(0, 20, s), sRx: L(L(-20, -40, w), -95, s), sRz: -15, eR: L(L(-45, -110, w), -5, s), lL: L(-10 * w, -40, s), kL: L(15, 35, s), lR: 15, kR: 10, y: L(-0.05, -0.18, s), hz: L(0, 0.4, s) });
    } else if (a === 'slam') {
      this.pose({ tp: L(L(0, -20, w), 40, s), sRx: L(L(-20, -175, w), -60, s), sLx: L(L(-10, -175, w), -60, s), sRz: -5, sLz: 5, eR: L(-45, -40, w), eL: L(-25, -40, w), lL: L(0, -30, s), kL: L(10, 50, s), lR: L(0, 20, s), kR: L(10, 30, s), y: L(L(0, 0.05, w), -0.3, s), np: L(10, -20, s) });
    } else if (a === 'charge') {
      this.pose({ tp: L(20, 35, w), sRx: 20, sLx: 20, sRz: -25, sLz: 25, eR: -30, eL: -30, y: -0.15 * w, lL: -30 * Math.sin(this.t * 14), lR: 30 * Math.sin(this.t * 14), kL: 40, kR: 40 });
    } else if (a === 'barrage') {
      this.pose({ tp: -15 * w, sLx: L(-10, -165, w), sLz: 15, eL: -10, np: -25 * w, sRx: -30, eR: -50 });
    }
  }
  separate() {
    for (const o of GM.enemies) {
      if (o === this || !o.alive || o.hover !== this.hover) continue;
      const dx = this.pos[0] - o.pos[0], dz = this.pos[2] - o.pos[2]; const d = Math.hypot(dx, dz); const m = this.radius + o.radius;
      if (d < m && d > 1e-4) { const k = (m - d) * 0.5; this.pos[0] += dx / d * k; this.pos[2] += dz / d * k; }
    }
    for (const c of [GM.player, GM.companion]) {
      if (!c.alive || this.hover) continue;
      const dx = c.pos[0] - this.pos[0], dz = c.pos[2] - this.pos[2]; const d = Math.hypot(dx, dz); const m = this.radius + c.radius;
      if (d < m && d > 1e-4) { const k = (m - d); c.pos[0] += dx / d * k * 0.7; c.pos[2] += dz / d * k * 0.7; this.pos[0] -= dx / d * k * 0.3; this.pos[2] -= dz / d * k * 0.3; }
    }
  }
  updateDrone(dt, tg, d, ty) {
    const T = this.T; const glowV = this.state === 'windup' ? 1 + this.t / T.wind * 2 : 1;
    this.glowMat.emissive = [3.5 * glowV, 0.3 * glowV, 0.15]; this.light.intensity = glowV * 0.8; this.light.pos = [this.pos[0], this.pos[1], this.pos[2]];
    this.yaw += OE.angDiff(this.yaw, ty) * Math.min(1, dt * 4);
    const bob = Math.sin(this.t * 2.3) * 0.25; this.pos[1] = OE.lerp(this.pos[1], 2.6 + bob + (this.state === 'windup' ? -0.3 : 0), dt * 3);
    Q.euler(this.n.body.rot, Math.sin(this.t * 1.7) * 8, 0, Math.sin(this.t * 1.3) * 10);
    if (this.state === 'idle') { if (d < T.aggro) { this.state = 'chase'; GM.alert(this); } return; }
    if (this.state === 'stagger') { if (this.t > 0.5) this.state = 'chase'; return; }
    const want = 8; const side = Math.sin(this.t * 0.6 + this.home[2]) * 2.2;
    const mv = (d > want + 1.5 ? 1 : d < want - 2 ? -1 : 0);
    this.pos[0] += (Math.sin(this.yaw) * mv * T.speed + Math.cos(this.yaw) * side * 0.6) * dt;
    this.pos[2] += (Math.cos(this.yaw) * mv * T.speed - Math.sin(this.yaw) * side * 0.6) * dt;
    this.separate(); W.collide(this.pos, this.radius);
    if (this.state === 'chase' && this.cd <= 0 && d < 15) { this.state = 'windup'; this.t = 0; GM.audio.charge(); }
    if (this.state === 'windup' && this.t > T.wind) {
      this.state = 'chase'; this.cd = R(1.6, 2.8);
      const o = [this.pos[0] + Math.sin(this.yaw) * 0.4, this.pos[1], this.pos[2] + Math.cos(this.yaw) * 0.4];
      const tp = [tg.pos[0], 1.2, tg.pos[2]]; const v = [tp[0] - o[0], tp[1] - o[1], tp[2] - o[2]]; const l = Math.hypot(...v);
      GM.projectiles.push({ pos: o, vel: [v[0] / l * 15, v[1] / l * 15, v[2] / l * 15], dmg: T.dmg, life: 2.5, r: 0.45 });
      GM.audio.plasma();
    }
  }
  updateDead(dt) {
    this.deadT += dt;
    if (this.hover) { this.pos[1] = Math.max(0.35, this.pos[1] - dt * 6); Q.euler(this.n.body.rot, 40, 0, 25); if (this.deadT > 2.5) this.root.visible = false; this.glowMat.emissive = [0, 0, 0]; return; }
    const u = Math.min(1, this.deadT / 0.9);
    this.pose({ y: -0.62 * u, tp: 70 * u, np: 30 * u, kL: 90 * u, kR: 80 * u, lL: -60 * u, lR: -50 * u, sLz: 30, sRz: -30, sLx: 40 * u, sRx: 30 * u, eR: -20 });
    this.glowMat.emissive = [3.5 * (1 - u), 0.25 * (1 - u), 0.1 * (1 - u)];
    if (this.deadT > 0.5 && this.deadT < 2.5 && rnd() < dt * 8) GM.fx.sparks([this.pos[0] + R(-0.3, 0.3), 0.8 * this.T.s, this.pos[2] + R(-0.3, 0.3)], [0, 1, 0], 5, [3, 2, 1]);
    if (this.deadT > 3) { const k = (this.deadT - 3) / 2; this.root.pos = [this.pos[0], -k * 1.2 * this.T.s, this.pos[2]]; if (k >= 1) this.root.visible = false; }
  }
};
})();
