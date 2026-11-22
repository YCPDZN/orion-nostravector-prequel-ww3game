/* Codex — character and adversary entries with a live 3D turntable of each model */
(function () {
'use strict';
const $ = (id) => document.getElementById(id);
const { Q, M4 } = OE;
const STAGE = [0, 0, -300];

const ENTRIES = [
  { id: 'orion', sec: 'CHARACTERS', name: 'Orion Mascar', role: 'Commander · British Command', model: 'orion', h: 1.82,
    facts: [['Born', '2069'], ['Age', '21'], ['Rank', 'Commander — the youngest in British Command'], ['Allegiance', 'United Kingdom, allied with the United States'], ['Weapon', 'Thermal sabre']],
    lore: [
      'Orion Mascar was eleven years old when the Third World War began in 2080. He has never known a world at peace — only blackout sirens, ration queues and the long shadow of the Sino-Russian Pact.',
      'He enlisted the day he was old enough and rose faster than anyone in British Command\'s history. At twenty-one he is its youngest commander: trusted, feared, and — some whisper — sent where older officers will not go.',
      'When London fell in a single night, Command gave him one order: break the siege of New London and destroy the Iron Warden. His dropship never reached the line. He walked the rest of the way.',
    ],
    combat: 'Fights with a thermal sabre whose edge burns cyan as it strikes. Light attacks chain into combos; the heavy overhead trades speed for raw damage. Rolling, blocking and stims keep him standing — but stamina decides every exchange.',
    quote: 'Ten years of war won\'t end tonight, Tom. But tonight, London breathes.',
    show: ['Idle', 'Attack1', 'Attack2', 'Heavy', 'Block'] },
  { id: 'thomas', sec: 'CHARACTERS', name: 'Thomas Hawthorne', role: 'Apprentice · British Command', model: 'thomas', h: 1.82,
    facts: [['Born', '2074'], ['Age', '16'], ['Rank', 'Apprentice to Commander Mascar'], ['Allegiance', 'United Kingdom, allied with the United States'], ['Weapon', 'Service rifle']],
    lore: [
      'Thomas Hawthorne was six when the war began, and grew up in the shelters beneath a Britain under siege. Like Orion, he has never known a world without it.',
      'Too young for the front line, he was assigned to British Command\'s youngest commander as an apprentice — Orion Mascar\'s shadow and student, and, though neither would ever say it, the closest thing either of them has to family.',
      'He calls Orion "Commander" in front of others and "Orion" when it matters. Everything he knows about fighting, Orion taught him — and he never lets him forget it.',
    ],
    combat: 'Fights at range with a service rifle, firing aimed three-round bursts at whatever Orion is fighting or locked on to. Anything that gets too close gets the rifle stock. If he falls, give him time — he always gets back up.',
    quote: 'You didn\'t think I\'d let you finish this alone, did you?',
    show: ['Idle', 'Aim', 'Shoot', 'Shoot', 'Idle'] },
  { id: 'boss', sec: 'ADVERSARIES', name: 'The Iron Warden', role: 'Last Sentinel of the Sino-Russian Pact', enemy: 'boss', h: 4.7, unlock: 'boss',
    facts: [['Class', 'Siege sentinel'], ['Height', '4.6 m'], ['Armament', 'Breaching cleaver, orbital uplink'], ['Origin', 'Sino-Russian Pact']],
    lore: [
      'The war machine that took London in a single night. The Pact left it standing guard in the ruined cathedral at the heart of New London — a monument to their victory, and a warning to anyone who would try to take the city back.',
    ],
    combat: 'Sweeps its cleaver in wide arcs, slams the ground hard enough to send out a shockwave — roll through it — and charges across the plaza. At half strength its core goes critical: it grows faster and calls down an orbital barrage. Watch for the red markers.' },
  { id: 'trooper', sec: 'ADVERSARIES', name: 'Pact Revenant', role: 'Russian-built blade infantry', enemy: 'trooper', h: 2.1, unlock: 'alert_trooper',
    facts: [['Class', 'Assault automaton'], ['Height', '2.0 m'], ['Armament', 'Forearm blade'], ['Origin', 'Russian foundries']],
    lore: ['The Pact\'s foot soldiers: tireless, fearless, built by the tens of thousands to hold what the heavier machines conquer.'],
    combat: 'Hits hard, but its swings are slow to recover. Wait for the strike, roll or block it, then punish the opening.' },
  { id: 'drone', sec: 'ADVERSARIES', name: 'Seeker Drone', role: 'Chinese hunter drone', enemy: 'drone', h: 1.2, unlock: 'alert_drone',
    facts: [['Class', 'Autonomous hunter'], ['Armament', 'Plasma emitter'], ['Origin', 'Chinese drone works']],
    lore: ['Hovering hunters that circle at range and pick off anything that moves. Their red eye brightens just before they fire.'],
    combat: 'Fires plasma bolts after a short charge. Don\'t try to outrun them — roll through the bolt, then close the distance.' },
  { id: 'brute', sec: 'ADVERSARIES', name: 'Pact Juggernaut', role: 'Heavy assault frame', enemy: 'brute', h: 2.9, unlock: 'alert_brute',
    facts: [['Class', 'Heavy assault frame'], ['Height', '2.8 m'], ['Armament', 'Twin forearm blades'], ['Origin', 'Sino-Russian Pact']],
    lore: ['A walking siege engine sent in where the Revenants fail. Slow, enormously strong, and almost impossible to stagger.'],
    combat: 'Never trade blows with it. Dodge the overhead slam, then strike from behind while it recovers.' },
];

const C = GM.codex = { root: null, cur: null, yaw: 0, t: 0, drag: null, models: {}, ret: 'title' };

function build() {
  const root = C.root = new OE.Node();
  const prev = OE.scene; OE.scene = root;
  const g = new OE.Geo();
  g.cyl([STAGE[0], -0.02, STAGE[2]], 2.4, 0.16, 40, { col: [0.62, 0.6, 0.57, 1] });
  g.cyl([STAGE[0], -0.1, STAGE[2]], 2.6, 0.1, 40, { col: [0.4, 0.38, 0.36, 1] });
  root.add(new OE.Node(g.build(), W.mats.concrete));
  const gg = new OE.Geo(); gg.box([STAGE[0], -0.15, STAGE[2]], [60, 0.2, 60], { col: [0.5, 0.45, 0.4, 1], aoBottom: 1 });
  root.add(new OE.Node(gg.build(), W.mats.ground));
  const Wp = A.weapons();
  // Orion with sabre
  const o = new OE.Character(GM.assets.orion, { rim: 0.06 }); root.add(o.node);
  const sw = new OE.Node(Wp.swordMesh, Wp.metalMat()); const sg = new OE.Node(Wp.swordGlow, { mode: 2, color: [0, 0, 0], emissive: [1.2, 3.6, 5] }); sw.add(sg); sg.castShadow = false;
  const hm = M4.create(); sw.attach = () => o.boneWorld('R_Hand', hm); sw.pos = [0, -0.085, 0.02]; o.node.add(sw);
  C.models.orion = { ch: o, node: o.node };
  // Thomas with rifle (aimed procedurally, like in game)
  const t = new OE.Character(GM.assets.thomas, { rim: 0.06 }); root.add(t.node);
  const rf = new OE.Node(Wp.rifleMesh, Wp.metalMat()); rf.mat.color = [0.7, 0.7, 0.72];
  const rg = new OE.Node(Wp.rifleGlow, { mode: 2, color: [0, 0, 0], emissive: [3, 0.6, 0.2] }); rg.castShadow = false; rf.add(rg);
  C.rifleModel = M4.create(); const rw = M4.create();
  rf.attach = () => M4.mul(rw, t.node.world, C.rifleModel);
  t.node.add(rf); C.models.thomas = { ch: t, node: t.node, rifle: rf };
  C.muzzle = { pos: [0, 0, 0], color: [1, 0.7, 0.3], intensity: 0, range: 6 };
  // war machines
  for (const type of ['boss', 'trooper', 'drone', 'brute']) {
    const e = new A.Enemy(type, STAGE.slice(), 0); e.reset(); e.root.pos = STAGE.slice(); if (e.hover) e.root.pos = [STAGE[0], 1.5, STAGE[2]];
    e.light.intensity = 0; C.models[type] = { enemy: e, node: e.root };
  }
  for (const k in C.models) C.models[k].node.visible = false;
  C.lights = [
    { pos: [STAGE[0] - 2.6, 3.2, STAGE[2] + 3.2], color: [1, 0.62, 0.32], intensity: 5, range: 14 },
    { pos: [STAGE[0] + 2.8, 2.6, STAGE[2] - 2.8], color: [0.45, 0.6, 1], intensity: 4, range: 12 },
    { pos: [STAGE[0], 0.4, STAGE[2] + 2.2], color: [1, 0.4, 0.15], intensity: 1.2, range: 5 }, C.muzzle];
  OE.scene = prev;
}

function renderTabs() {
  let html = '', sec = '';
  for (const e of ENTRIES) {
    if (e.sec !== sec) { sec = e.sec; html += `<div class="cx-sec">${sec}</div>`; }
    const locked = e.unlock && !GM.save.seen[e.unlock];
    html += `<button class="cx-tab ${C.cur === e ? 'on' : ''} ${locked ? 'locked' : ''}" data-id="${e.id}">${locked ? '???' : e.name}</button>`;
  }
  $('cxTabs').innerHTML = html;
  $('cxTabs').querySelectorAll('.cx-tab').forEach((b) => b.onclick = () => { GM.audio.ui(); select(b.dataset.id); });
}
function select(id) {
  const e = ENTRIES.find((x) => x.id === id); C.cur = e; C.t = 0; C.showIdx = 0; C.yaw = 0.35;
  const locked = e.unlock && !GM.save.seen[e.unlock];
  for (const k in C.models) C.models[k].node.visible = false;
  const m = C.models[e.model || e.enemy];
  if (m && !locked) { m.node.visible = true; if (m.ch) m.ch.play((e.show || ['Idle'])[0], 0, 1, true); }
  const b = $('cxBody');
  if (locked) { b.innerHTML = `<h1>???</h1><div class="cx-role">Unknown</div><p class="cx-lockedmsg">Not yet encountered. Venture further into New London to learn more.</p>`; }
  else {
    b.innerHTML = `<h1>${e.name}</h1><div class="cx-role">${e.role}</div>
      <dl class="cx-facts">${e.facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
      ${e.lore.map((p) => `<p>${p}</p>`).join('')}
      <h3>IN COMBAT</h3><p>${e.combat}</p>${e.quote ? `<p class="cx-quote">“${e.quote}”</p>` : ''}`;
  }
  b.scrollTop = 0; renderTabs();
}

C.open = function (ret) {
  if (!C.root) build();
  C.ret = ret; C.prevState = GM.state; C.prevScene = OE.scene; C.prevCam = JSON.parse(JSON.stringify(GM.cam));
  OE.scene = C.root; for (const l of C.lights) OE.R.lights.push(l);
  GM.state = 'codex'; GM.ui.show('codex'); GM.ui.hudVisible(false); $('codex').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  select(C.cur ? C.cur.id : 'orion');
};
C.close = function () {
  OE.scene = C.prevScene; OE.R.lights = OE.R.lights.filter((l) => !C.lights.includes(l));
  Object.assign(GM.cam, C.prevCam); $('codex').classList.add('hidden');
  GM.state = C.prevState; GM.ui.show(C.ret);
};
$('cxClose').onclick = () => { GM.audio.ui(); C.close(); };

// drag to rotate the model
const cv = $('c');
cv.addEventListener('pointerdown', (e) => { if (GM.state === 'codex') { C.drag = e.clientX; C.spin = 0; } });
addEventListener('pointerup', () => { C.drag = null; });
addEventListener('pointermove', (e) => { if (GM.state === 'codex' && C.drag !== null) { const d = (e.clientX - C.drag) * 0.012; C.yaw += d; C.spin = d * 30; C.drag = e.clientX; } });

C.update = function (dt, inp) {
  if (inp && inp.pause) { C.close(); return; }
  const e = C.cur; if (!e) return; C.t += dt;
  if (C.drag === null) { C.spin = (C.spin || 0) * Math.exp(-dt * 3); C.yaw += dt * 0.25 + C.spin * dt; }
  const m = C.models[e.model || e.enemy]; const locked = e.unlock && !GM.save.seen[e.unlock];
  if (m && !locked) {
    if (m.ch) {
      const ch = m.ch; ch.update(dt);
      if (ch.finished || (ch.cur.loop && C.t > 3.2)) { C.showIdx = (C.showIdx + 1) % e.show.length; ch.play(e.show[C.showIdx], 0.25, 1, true); C.t = 0; }
      const clip = ch.cur.name; C.aim = OE.lerp(C.aim || 0, clip === 'Aim' || clip === 'Shoot' ? 1 : 0, Math.min(1, dt * 6));
      C.recoil = Math.max(0, (C.recoil || 0) - dt * 9); C.muzzle.intensity = Math.max(0, C.muzzle.intensity - dt * 40);
      if (e.id === 'thomas' && clip === 'Shoot') { // fire with the burst kicks
        const kt = [0.02, 0.14, 0.26]; const tt = ch.t;
        for (const k of kt) if (tt >= k && (C.lastShot === undefined || C.lastShot < k || C.lastShot > tt)) { C.recoil = 1; C.muzzle.intensity = 6; if (m.rifle.world) M4.point(C.muzzle.pos, m.rifle.world, [0, 0.04, 0.8]); GM.audio.gun(4); }
        C.lastShot = tt;
      }
      if (e.id === 'orion') { // gentle wind on the cape
        C.capeQ = C.capeQ || [Q.create(), Q.create(), Q.create()]; const w = Math.sin(C.t * 1.6 + C.yaw) * 2 + Math.sin(C.t * 2.7) * 1.2;
        ['Cape1', 'Cape2', 'Cape3'].forEach((b, i) => { Q.euler(C.capeQ[i], 3 + w * (0.5 + i * 0.6), 0, w * 0.3 * i); ch.override[b] = C.capeQ[i]; });
      }
      if (e.id === 'thomas') A.rifleRig(ch, { aim: C.aim, dir: [0, 0, 1], recoil: C.recoil }, C.rifleModel);
      Q.yaw(m.node.rot, C.yaw); m.node.pos = STAGE.slice();
    } else {
      const en = m.enemy; Q.yaw(m.node.rot, C.yaw);
      if (en.hover) { m.node.pos = [STAGE[0], 1.4 + Math.sin(C.t * 2) * 0.12, STAGE[2]]; Q.euler(en.n.body.rot, Math.sin(C.t * 1.7) * 6, 0, Math.sin(C.t * 1.3) * 8); }
      else { const s = Math.sin(C.t * 1.6); en.pose({ tp: 4 + s * 1.5, np: -4, sRx: -25 + s * 2, eR: -55, sLz: 14, y: -0.01 * (s + 1) }); }
      en.glowMat.emissive = [3.5 + Math.sin(C.t * 3) * 0.6, 0.25, 0.1];
    }
  }
  // camera: frame the model in the space left of the panel (or above it in portrait)
  const cam = GM.cam, R = OE.R; const h = e.h; const asp = R.w / R.h; const portrait = asp < 0.9;
  const d = h * 1.55 + 1.3; cam.fov = 0.75; const hh = Math.tan(cam.fov / 2) * d, hw = hh * asp;
  let tx = STAGE[0], ty = h * 0.52;
  if (portrait) ty -= hh * 0.42; else tx += hw * 0.42;
  cam.pos = [tx, ty + h * 0.08, STAGE[2] + d]; cam.target = [tx, ty, STAGE[2]]; cam.shadowCenter = STAGE;
};
})();
