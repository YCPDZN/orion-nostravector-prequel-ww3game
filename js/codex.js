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
    combat: 'Fights with a thermal sabre whose edge burns with the colour of his conscience — blue, gold or red. Light attacks chain into combos; the heavy overhead trades speed for raw damage. Rolling, blocking and stims keep him standing — but stamina decides every exchange.',
    quote: 'Ten years of war won\'t end tonight, Tom. But tonight, London breathes.',
    show: ['Idle', 'Attack1', 'Attack2', 'Heavy', 'Block'] },
  { id: 'thomas', sec: 'CHARACTERS', name: 'Thomas Hawthorne', role: 'Apprentice · British Command', model: 'thomas', h: 1.82,
    facts: [['Born', '2074'], ['Age', '16'], ['Rank', 'Apprentice to Commander Mascar'], ['Allegiance', 'United Kingdom, allied with the United States'], ['Weapon', 'Service rifle']],
    lore: [
      'Thomas Hawthorne was six when the war began, and grew up in the shelters beneath a Britain under siege. Like Orion, he has never known a world without it.',
      'Too young for the front line, he was assigned to British Command\'s youngest commander as an apprentice — Orion Mascar\'s shadow and student, and, though neither would ever say it, the closest thing either of them has to family.',
      'He calls Orion "Commander" in front of others and "Orion" when it matters. Everything he knows about fighting, Orion taught him — and he never lets him forget it.',
    ],
    combat: 'Fights at range with a service rifle, firing aimed three-round bursts at whatever Orion is fighting or locked on to. Anything that gets too close gets the rifle stock. He is built to take punishment — three times what a normal soldier can — and against the Iron Warden he digs in even harder, shrugging off half of every blow. If he falls, give him time: he always gets back up.',
    quote: 'You didn\'t think I\'d let you finish this alone, did you?',
    show: ['Idle', 'Aim', 'Shoot', 'Shoot', 'Idle'] },
  { id: 'talina', sec: 'ADVERSARIES', name: 'Talina Alvarez', role: 'Traitor of British Command', model: 'talina', h: 1.72, unlock: 'boss2a',
    facts: [['Born', 'Seville, Spain'], ['Raised', 'London'], ['Former rank', 'Commander, British Command'], ['Allegiance', 'Sino-Russian Pact'], ['Weapon', 'Thermal sabre']],
    lore: [
      'Born in Seville and raised in London, Talina Alvarez rose to commander in British Command at twenty-three and trained half of its cadets with a sabre.',
      'When London fell, she was ordered to hold the line underground while the city burned above her. She never forgave Command for it. Within the year she had crossed to the Pact, and the Pact gave her Dover Castle.',
      'At Dover she met Orion Mascar, and took his left eye.',
    ],
    fate: { fled: 'She walked out of Dover Castle alive. What Orion told her before she went, only the two of them know.', executed: 'She died in the inner bailey of Dover Castle, at Orion\'s hand.' },
    fate3: { saved: 'In Normandy he beat her a second time, and held out his hand instead of his sword. She took it.', command: 'In Normandy he beat her a second time and handed her to British Command.', dead: 'In Normandy he beat her a second time, and she died in the church square.' },
    quote: 'Then let me leave you something to remember me by.',
    combat: 'A duelist, not a machine. She circles out of reach, parries quick strikes and answers with a riposte, and rolls clear of anything she sees coming. Heavy attacks break through her guard. At half strength she drops the act: she gets faster and finishes her combos with an unblockable lunge.',
    show: ['Idle', 'Attack1', 'Attack2', 'Heavy', 'Block', 'Idle'] },
  { id: 'ines', sec: 'ADVERSARIES', name: 'Inés Alvarez', role: 'Talina\'s Twin', model: 'ines', h: 1.72, unlock: 'boss3i',
    facts: [['Born', 'Seville, Spain'], ['Sister', 'Talina Alvarez (twin)'], ['Allegiance', 'Sino-Russian Pact'], ['Weapon', 'Twin thermal sabres']],
    lore: [
      'Talina\'s twin. Where Talina went to London and British Command, Inés stayed in Seville, until the war took everything there too.',
      'When word reached her of how her sister died at Dover, she asked the Pact for one thing: Normandy, and the man with one eye.',
    ],
    quote: 'Look at me. Do you see her?',
    combat: 'Her sister\'s footwork with twice the fury and twice the strength. Two blades: she parries, ripostes and rolls clear like Talina did, but she also spins, both sabres out, cutting anything close. Back off when she starts to turn. At half strength she spins more and abandons caution entirely.',
    fate: { companion: 'At Normandy, Orion spared her. She fights beside him now, and has not forgiven him.', command: 'At Normandy, Orion handed her to British Command.', dead: 'She died in the church square at Normandy, at Orion\'s hand, beside her sister\'s killer.' }, fateKey: 'ines',
    show: ['Idle', 'Attack1', 'SpinPose', 'Attack2', 'Heavy', 'Idle'] },
  { id: 'boss', sec: 'ADVERSARIES', name: 'The Iron Warden', role: 'Last Sentinel of the Sino-Russian Pact', enemy: 'boss', h: 4.7, unlock: 'boss',
    facts: [['Class', 'Siege sentinel'], ['Height', '4.6 m'], ['Armament', 'Breaching cleaver, orbital uplink'], ['Origin', 'Sino-Russian Pact'], ['Voice', 'Mandarin Chinese']],
    lore: [
      'The war machine that took London in a single night. The Pact left it standing guard in the ruined cathedral at the heart of New London — a monument to their victory, and a warning to anyone who would try to take the city back.',
    ],
    quote: 'The Red Sun and the Bear have united under one banner.',
    combat: 'Sweeps its cleaver in wide arcs, slams the ground hard enough to send out a shockwave — roll through it — and charges across the plaza. At half strength its core goes critical: it grows faster and calls down an orbital barrage. Watch for the red markers.' },
  { id: 'tidebreaker', sec: 'ADVERSARIES', name: 'The Tidebreaker', role: 'Spearhead of the Pact Landing Fleet', enemy: 'tidebreaker', h: 5.2, unlock: 'boss2',
    facts: [['Class', 'Amphibious assault frame'], ['Height', '5.1 m'], ['Armament', 'Anchor-hammer, forearm blade, fleet uplink'], ['Origin', 'Russian naval yards'], ['Voice', 'Russian']],
    lore: [
      'Built to walk out of the surf and hold a beach until the fleet behind it can land. The Pact sent it ashore beneath the white cliffs of Dover, and for as long as it stands, no American ship can reach England.',
      'Its anchor-hammer was made for tearing open sea walls. Its pilot rides sealed inside the reactor housing on its back.',
    ],
    quote: 'The sea will take you.',
    combat: 'Swings its anchor in heavy arcs and slams the shingle to send out a shockwave — roll through it. Charges when you keep your distance. At half strength it calls the fleet\'s guns down on its own position: watch for the red markers and keep moving.' },
  { id: 'hunter', sec: 'ADVERSARIES', name: 'The Hunter', role: 'Pact Pursuit Frame', enemy: 'hunter', h: 4.0, unlock: 'boss4a',
    facts: [['Class', 'Pursuit frame'], ['Height', '3.9 m'], ['Armament', 'Twin forearm blades, orbital uplink'], ['Origin', 'Chinese drone works'], ['Voice', 'Mandarin Chinese']],
    lore: ['Fast and patient, built to run down whatever the Pact\'s lines let slip. On the first night of the siege of Kaliningrad it was sent after a field hospital.'],
    quote: 'I can hear two heartbeats in there.',
    combat: 'Quicker than the other heavy frames, with a blade on each arm. It sweeps, slams and charges; roll through the shockwave, and keep moving when the red markers fall at half strength.' },
  { id: 'bear', sec: 'ADVERSARIES', name: 'The Bear', role: 'Guardian of Königsberg', enemy: 'bear', h: 5.7, unlock: 'boss4',
    facts: [['Class', 'Siege guardian'], ['Height', '5.6 m'], ['Armament', 'Twin breaching cleavers, artillery uplink'], ['Origin', 'Russian foundries, Kaliningrad'], ['Voice', 'Russian']],
    lore: ['The Pact\'s soldiers named it after the Bear on their banner. It was built in Kaliningrad, to hold the square before the House of Soviets for as long as the city stood.'],
    quote: 'Winter fights for us.',
    combat: 'The heaviest machine in the war: a cleaver in each fist, wide sweeps, ground slams with a wide shockwave, and a charge across the square. At half strength it calls the guns down on itself. Its reach is long; fight at its flank.' },
  { id: 'yi', sec: 'ADVERSARIES', name: 'Yi Liang', role: 'Marshal · Supreme Commander of the Pact', model: 'yi', h: 1.8, unlock: 'boss5y',
    facts: [['Rank', 'Marshal'], ['Command', 'The Sino-Russian Pact, Harbin'], ['Weapon', 'Assault rifle, grenades'], ['Voice', 'Mandarin Chinese']],
    lore: ['The officer who signed the Pact for China in Harbin in 2080, and has commanded its armies ever since. When the war came back to the city where it began, he did not leave.'],
    quote: 'You came too late. The Red Sun does not set.',
    combat: 'Keeps his distance and fires aimed bursts after a short, glowing aim: roll through the shots, then close in. Up close he clubs you with the rifle. At half strength he starts throwing grenades: watch for the red markers.',
    show: ['Idle', 'Aim', 'Shoot', 'Attack1', 'Idle'] },
  { id: 'orlov', sec: 'ADVERSARIES', name: 'Vladimir Orlov', role: 'General · Defender of Moscow', model: 'orlov', h: 1.82, unlock: 'boss5o',
    facts: [['Rank', 'General'], ['Command', 'The Russian army, Moscow'], ['Father', 'Viktor Orlov'], ['Weapon', 'Assault rifle, grenades'], ['Voice', 'English']],
    lore: ['The son of Viktor Orlov, whose "Great Trial" was stopped forty years ago. He has spent his life finishing his father\'s work, and he enjoys it.', 'When the Pact fell back, he took what was left of the Russian army to the Kremlin, and dug in to wait.'],
    quote: 'The Great Trial has no defence. Only a sentence.',
    combat: 'The toughest of the three. He fires aimed bursts from range, rifle-butts you up close and throws grenades from half strength. Roll through the shots and punish him while he reloads.',
    show: ['Idle', 'Aim', 'Shoot', 'Attack1', 'Idle'] },
  { id: 'josiah', sec: 'ADVERSARIES', name: 'Josiah Williams I', role: 'Head of British Command', model: 'josiah', h: 1.8, unlock: 'boss5j',
    facts: [['Office', 'Head of British Command'], ['Command', 'Every British soldier of the war'], ['Weapon', 'Service rifle, grenades'], ['Voice', 'English']],
    lore: ['The man in New London who gave every order Orion Mascar and Thomas Hawthorne ever followed. He sent them to Dover, to Normandy and to Kaliningrad. He never once went himself.'],
    quote: 'I gave you every order you ever followed, Mascar. Here is the last one: kneel.',
    combat: 'Fights like the generals he commanded: aimed rifle bursts at range, the rifle butt up close, grenades from half strength.',
    show: ['Idle', 'Aim', 'Shoot', 'Attack1', 'Idle'] },
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
  const swordChar = (asset, glow, dual) => { // another sword-bearer: eyepatch Orion, Talina, Ines (two blades)
    const c = new OE.Character(asset, { rim: 0.06 }); root.add(c.node);
    for (const hand of dual ? ['R_Hand', 'L_Hand'] : ['R_Hand']) {
      const s2 = new OE.Node(Wp.swordMesh, Wp.metalMat()); const g2 = new OE.Node(Wp.swordGlow, { mode: 2, color: [0, 0, 0], emissive: glow }); s2.add(g2); g2.castShadow = false;
      const m2 = M4.create(); s2.attach = () => c.boneWorld(hand, m2); s2.pos = [0, -0.085, 0.02]; c.node.add(s2);
    }
    return { ch: c, node: c.node };
  };
  C.models.orionEye = swordChar(GM.assets.orionEye, [1.2, 3.6, 5]);
  C.models.talina = swordChar(GM.assets.talina, [2.2, 0.35, 2.8]);
  C.models.ines = swordChar(GM.assets.ines, [3.0, 0.3, 1.1], true);
  // Thomas with rifle (aimed procedurally, like in game)
  const t = new OE.Character(GM.assets.thomas, { rim: 0.06 }); root.add(t.node);
  const rf = new OE.Node(Wp.rifleMesh, Wp.metalMat()); rf.mat.color = [0.7, 0.7, 0.72];
  const rg = new OE.Node(Wp.rifleGlow, { mode: 2, color: [0, 0, 0], emissive: [3, 0.6, 0.2] }); rg.castShadow = false; rf.add(rg);
  C.rifleModel = M4.create(); const rw = M4.create();
  rf.attach = () => M4.mul(rw, t.node.world, C.rifleModel);
  t.node.add(rf); C.models.thomas = { ch: t, node: t.node, rifle: rf };
  C.muzzle = { pos: [0, 0, 0], color: [1, 0.7, 0.3], intensity: 0, range: 6 };
  const gunChar = (asset, glow) => { // Chapter V's leaders, rifles aimed the same way as Thomas's
    const c = new OE.Character(asset, { rim: 0.06 }); root.add(c.node);
    const r = new OE.Node(Wp.rifleMesh, Wp.metalMat()); r.mat.color = [0.4, 0.4, 0.42]; const g = new OE.Node(Wp.rifleGlow, { mode: 2, color: [0, 0, 0], emissive: glow }); g.castShadow = false; r.add(g);
    const rm = M4.create(), w = M4.create(); r.attach = () => M4.mul(w, c.node.world, rm); c.node.add(r);
    return { ch: c, node: c.node, rifle: r, rifleModel: rm };
  };
  C.models.yi = gunChar(GM.assets.yi, [3.2, 0.35, 0.2]); C.models.orlov = gunChar(GM.assets.orlov, [0.4, 1.2, 3.4]); C.models.josiah = gunChar(GM.assets.josiah, [2.6, 2.0, 0.5]);
  // war machines
  for (const type of ['boss', 'tidebreaker', 'hunter', 'bear', 'trooper', 'drone', 'brute']) {
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
const mkey = (e) => e.model === 'orion' && GM.save.eye ? 'orionEye' : (e.model || e.enemy);
function select(id) {
  const e = ENTRIES.find((x) => x.id === id); C.cur = e; C.t = 0; C.showIdx = 0; C.yaw = 0.35;
  const locked = e.unlock && !GM.save.seen[e.unlock];
  for (const k in C.models) C.models[k].node.visible = false;
  const m = C.models[mkey(e)];
  if (m && !locked) { m.node.visible = true; if (m.ch) m.ch.play((e.show || ['Idle'])[0], 0, 1, true); }
  const b = $('cxBody');
  if (locked) { b.innerHTML = `<h1>???</h1><div class="cx-role">Unknown</div><p class="cx-lockedmsg">Not yet encountered. Venture further into New London to learn more.</p>`; }
  else {
    b.innerHTML = `<h1>${e.name}</h1><div class="cx-role">${e.role}</div>
      <dl class="cx-facts">${e.facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}${e.id === 'orion' || e.id === 'thomas' ? `<dt>Alignment</dt><dd>${GM.align.chip('', e.id === 'orion' ? 'o' : 't')}</dd>` : ''}</dl>
      ${e.lore.concat(e.fate && GM.save[e.fateKey || 'talina'] && e.fate[GM.save[e.fateKey || 'talina']] ? [e.fate[GM.save[e.fateKey || 'talina']]] : []).concat(e.fate3 && GM.save.talina3 && e.fate3[GM.save.talina3] ? [e.fate3[GM.save.talina3]] : []).map((p) => `<p>${p}</p>`).join('')}
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
  const m = C.models[mkey(e)]; const locked = e.unlock && !GM.save.seen[e.unlock];
  if (m && !locked) {
    if (m.ch) {
      const ch = m.ch; ch.update(dt);
      if (ch.finished || (ch.cur.loop && C.t > 3.2)) { C.showIdx = (C.showIdx + 1) % e.show.length; ch.play(e.show[C.showIdx], 0.25, 1, true); C.t = 0; }
      const clip = ch.cur.name; C.aim = OE.lerp(C.aim || 0, clip === 'Aim' || clip === 'Shoot' ? 1 : 0, Math.min(1, dt * 6));
      C.recoil = Math.max(0, (C.recoil || 0) - dt * 9); C.muzzle.intensity = Math.max(0, C.muzzle.intensity - dt * 40);
      if ((e.id === 'thomas' || m.rifleModel) && clip === 'Shoot') { // fire with the burst kicks
        const kt = [0.02, 0.14, 0.26]; const tt = ch.t;
        for (const k of kt) if (tt >= k && (C.lastShot === undefined || C.lastShot < k || C.lastShot > tt)) { C.recoil = 1; C.muzzle.intensity = 6; if (m.rifle.world) M4.point(C.muzzle.pos, m.rifle.world, [0, 0.04, 0.8]); GM.audio.gun(4); }
        C.lastShot = tt;
      }
      if (e.id === 'thomas' || m.rifleModel) A.rifleRig(ch, { aim: C.aim, dir: [0, 0, 1], recoil: C.recoil }, m.rifleModel || C.rifleModel);
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
