/* Alignment — Orion's choices shape who he becomes, and Thomas follows his lead.
   Values run from -100 (evil) to +100 (good). Both start at 0 (neutral).
   Tiers: >= +30 GOOD (blue) · between NEUTRAL (yellow) · <= -30 EVIL (red). */
(function () {
'use strict';
const $ = (id) => document.getElementById(id);
const AL = window.GM.align = {};
const THOMAS_SHARE = 0.9;          // how strongly Orion's choices pull Thomas
const STEP = 35;                   // alignment change per good/evil choice
AL.TIERS = {
  good: { name: 'GOOD', css: '#3d8bff', glow: [0.6, 2.2, 3.4], light: [0.3, 0.6, 1.0], trail: [0.35, 1.0, 2.2] },
  neutral: { name: 'NEUTRAL', css: '#f2c94c', glow: [3.0, 2.3, 0.45], light: [1.0, 0.8, 0.25], trail: [2.0, 1.5, 0.3] },
  evil: { name: 'EVIL', css: '#e5484d', glow: [3.4, 0.35, 0.25], light: [1.0, 0.18, 0.12], trail: [2.4, 0.25, 0.2] },
};
AL.value = (who) => { const a = GM.save.align || (GM.save.align = { o: 0, t: 0 }); return who === 't' ? a.t : a.o; };
AL.tierOf = (v) => v >= 30 ? 'good' : v <= -30 ? 'evil' : 'neutral';
AL.tier = (who) => AL.tierOf(AL.value(who));
AL.info = (who) => AL.TIERS[AL.tier(who)];

/* ---------------- the choices ---------------- */
const CHOICES = [
  { id: 'rubble', pos: [-7.2, 0, 21.5], title: 'Survivors in the Rubble',
    text: 'Three civilians are trapped beneath a collapsed shopfront — an old man, a mother and her daughter. Digging them out will take time, and the noise may draw the machines.',
    options: [
      { align: 'good', label: 'Dig them out.', result: 'The girl clings to Thomas until her mother pulls her away. The mother presses a field stim into Orion\'s hand.', thomas: 'That\'s why we fight, Commander. Not for Command — for them.', reward: { stims: 1 } },
      { align: 'neutral', label: 'Mark their position for the rescue teams.', result: 'Orion sprays a beacon mark on the rubble. Someone will come. Maybe.', thomas: 'Right. Command will send someone... if there\'s anyone left to send.' },
      { align: 'evil', label: 'Take their supplies and move on.', result: 'Their ration packs and scrap go into Orion\'s pack. Nobody says a word.', thomas: '...Orion. They\'re our people.', reward: { scrap: 150 } },
    ] },
  { id: 'pilot', pos: [6.6, 0, 75.2], title: 'The Pilot',
    text: 'A Pact drone operator drags himself out of the burning tank. He is barely older than Thomas. He raises his empty hands and says something you don\'t understand.',
    options: [
      { align: 'good', label: 'Let him go.', result: 'He stares, then runs into the smoke. Thomas watches him until he is gone.', thomas: 'He\'s just a kid. Like me. ...Thank you, Commander.' },
      { align: 'neutral', label: 'Take him prisoner for British Command.', result: 'Thomas zip-ties his wrists and radios his position for pickup. Command pays a bounty for prisoners.', thomas: 'Zip-ties on. He\'ll keep until the pickup team gets here.', reward: { scrap: 100 } },
      { align: 'evil', label: 'Strip his gear and leave him to the machines.', result: 'Orion takes his kit and walks away. Behind them, the drones are already circling.', thomas: 'We\'re supposed to be better than them.', reward: { scrap: 220 } },
    ] },
  { id: 'hospital', pos: [-6.2, 0, 104.6], title: 'The Field Hospital',
    text: 'An abandoned field hospital. Most of the stims are gone, but a few remain — and there are wounded soldiers on the cots, still breathing.',
    options: [
      { align: 'good', label: 'Leave the stims for the wounded.', result: 'Thomas kneels by each cot and makes sure every soldier has one within reach.', thomas: 'They\'ll make it now. Some of them, anyway.' },
      { align: 'neutral', label: 'Take one. Leave the rest.', result: 'One stim for the road. The rest stay where they are.', thomas: 'Fair. We\'ll need it for the Warden.', reward: { stims: 1 } },
      { align: 'evil', label: 'Take them all.', result: 'Every stim goes into Orion\'s pack. One of the wounded watches him do it.', thomas: 'They needed those more than we do, Orion.', reward: { stims: 3 } },
    ] },
  { id: 'core', title: 'The Warden\'s Core', auto: true,
    text: 'The Iron Warden\'s core still burns in the wreckage — enough power to light a city, or to build another Warden.',
    options: [
      { align: 'good', label: 'Destroy it. No one should ever build another.', result: 'Orion drives his sabre into the core. The light dies, and the plaza goes quiet.', thomas: 'Good. Let it stay dead.' },
      { align: 'neutral', label: 'Recover it for British Command.', result: 'Thomas seals the core in a containment case for Command\'s engineers.', thomas: 'Command will want to study it. Let\'s hope that\'s all they do.', reward: { scrap: 500 } },
      { align: 'evil', label: 'Keep its power for yourself.', result: 'Orion lifts the core. Its red light spills across his armour.', thomas: 'Orion... what are you becoming?', reward: { scrap: 1000 } },
    ] },
];
AL.CHOICES = CHOICES;
const done = (id) => !!(GM.save.choices && GM.save.choices[id]);

/* ---------------- props marking each choice in the world ---------------- */
AL.build = function () {
  const M = W.mats; const props = { concrete: new OE.Geo(), ground: new OE.Geo(), metal: new OE.Geo() }; const cloth = new OE.Geo(); const cross = new OE.Geo();
  const person = (g, x, z, ry, sit, col) => { // simple seated / kneeling figure
    const q = OE.Q.create(); OE.Q.euler(q, 0, ry, 0); const m = OE.M4.create(); OE.M4.fromRTS(m, q, [x, 0, z], [1, 1, 1]);
    const P = (a, b, c) => OE.M4.point([0, 0, 0], m, [a, b, c]);
    g.box(P(0, sit ? 0.45 : 0.75, 0), [0.38, sit ? 0.55 : 0.7, 0.24], { ry, col });
    g.sphere(P(0, sit ? 0.88 : 1.28, 0), 0.12, 6, { col: [0.55, 0.42, 0.34, 1] });
    g.box(P(0, 0.12, sit ? 0.22 : 0.1), [0.34, 0.22, sit ? 0.5 : 0.3], { ry, col: [0.18, 0.18, 0.2, 1] });
    if (!sit) for (const s of [-1, 1]) g.box(P(s * 0.25, 1.45, 0), [0.08, 0.42, 0.08], { ry, col }); // hands raised
  };
  // 1 rubble with trapped civilians
  const r = CHOICES[0].pos;
  for (let i = 0; i < 9; i++) props.concrete.box([r[0] + (i % 3 - 1) * 0.7, 0.3 + Math.floor(i / 3) * 0.28, r[2] + (i % 2) * 0.5 - 0.4], [0.9, 0.35, 0.7], { rx: i * 13 % 25, ry: i * 41, col: [0.72, 0.7, 0.67, 1] });
  person(cloth, r[0] + 1.0, r[2] + 1.0, 200, true, [0.42, 0.3, 0.25, 1]); person(cloth, r[0] + 1.5, r[2] + 0.4, 240, true, [0.25, 0.32, 0.4, 1]);
  // 2 surrendering pilot
  const p = CHOICES[1].pos; person(cloth, p[0], p[2], 220, false, [0.35, 0.37, 0.3, 1]);
  // 3 field hospital: cots, crates, a canvas wall with a red cross
  const h = CHOICES[2].pos;
  for (let i = 0; i < 3; i++) { props.metal.box([h[0] - 0.6 + i * 1.0, 0.35, h[2] + 0.9], [0.7, 0.08, 1.9], { col: [0.4, 0.42, 0.38, 1] }); cloth.box([h[0] - 0.6 + i * 1.0, 0.45, h[2] + 0.9], [0.5, 0.18, 1.5], { col: [0.45, 0.42, 0.35, 1] }); }
  props.metal.box([h[0] + 1.2, 0.3, h[2] - 0.6], [0.6, 0.6, 0.6], { col: [0.35, 0.4, 0.3, 1] });
  cloth.box([h[0] - 0.2, 1.3, h[2] + 2.1], [3.2, 2.6, 0.08], { col: [0.62, 0.6, 0.52, 1] });
  cross.box([h[0] - 0.2, 1.7, h[2] + 2.05], [0.7, 0.18, 0.02], { col: [1, 1, 1, 1] }); cross.box([h[0] - 0.2, 1.7, h[2] + 2.05], [0.18, 0.7, 0.02], { col: [1, 1, 1, 1] });
  for (const k in props) OE.scene.add(new OE.Node(props[k].build(), M[k]));
  OE.scene.add(new OE.Node(cloth.build(), { mode: 2, color: [1, 1, 1], rough: 0.9 }));
  const cn = new OE.Node(cross.build(), { mode: 2, color: [0, 0, 0], emissive: [1.4, 0.1, 0.08] }); cn.castShadow = false; OE.scene.add(cn);
  W.colliders.push({ x0: r[0] - 1.2, x1: r[0] + 1.0, z0: r[2] - 0.8, z1: r[2] + 0.6, h: 1 });
  W.colliders.push({ x0: h[0] - 1.2, x1: h[0] + 1.5, z0: h[2] - 1.0, z1: h[2] + 2.2, h: 1 });
};

/* ---------------- interaction ---------------- */
AL.nearby = function (pos) {
  for (const c of CHOICES) {
    if (c.auto || done(c.id)) continue;
    if (Math.hypot(pos[0] - c.pos[0], pos[2] - c.pos[2]) < 2.6) return { type: 'choice', id: c.id, label: 'Investigate — ' + c.title };
  }
  return null;
};
AL.markers = function (time) { // gentle white glow over undecided choice points
  for (const c of CHOICES) {
    if (c.auto || done(c.id) || Math.random() > 0.35) continue;
    GM.parts.emit({ pos: [c.pos[0] + (Math.random() - 0.5) * 0.5, 0.6 + Math.random() * 0.8, c.pos[2] + (Math.random() - 0.5) * 0.5], vel: [0, 0.5, 0], size: 0.035, life: 1.3, col: [2.2, 2.1, 1.8, 1], soft: 0.3 });
  }
};
let current = null, onClose = null, prevState = 'play';
AL.open = function (id, after) {
  const c = CHOICES.find((x) => x.id === id); if (!c || done(id)) { if (after) after(); return; }
  current = c; onClose = after || null; prevState = GM.state; GM.state = 'choice';
  if (document.pointerLockElement) document.exitPointerLock();
  $('chTitle').textContent = c.title; $('chText').textContent = c.text; $('chResult').textContent = ''; $('chResult').style.display = 'none';
  $('chOpts').innerHTML = c.options.map((o, i) => `<button class="btn chopt" data-i="${i}" style="border-color:${AL.TIERS[o.align].css}"><span class="dot" style="background:${AL.TIERS[o.align].css}"></span>${o.label}</button>`).join('');
  $('chOpts').querySelectorAll('.chopt').forEach((b) => b.onclick = () => choose(+b.dataset.i));
  $('chLeave').style.display = c.auto ? 'none' : ''; $('chLeave').textContent = 'STEP AWAY';
  $('choice').classList.remove('hidden');
};
function choose(i) {
  const c = current, o = c.options[i]; const S = GM.save;
  S.choices = S.choices || {}; S.choices[c.id] = o.align;
  const d = o.align === 'good' ? STEP : o.align === 'evil' ? -STEP : 0;
  const a = S.align || (S.align = { o: 0, t: 0 });
  const before = [AL.tier('o'), AL.tier('t')];
  a.o = OE.clamp(a.o + d, -100, 100); a.t = OE.clamp(a.t + d * THOMAS_SHARE, -100, 100);
  if (o.reward) {
    if (o.reward.scrap) S.scrap += o.reward.scrap;
    if (o.reward.stims) GM.player.stims += o.reward.stims;
  }
  GM.audio.ui();
  $('chOpts').innerHTML = ''; $('chResult').style.display = ''; $('chResult').innerHTML = o.result +
    (o.reward ? `<div class="rw">${o.reward.scrap ? '+' + o.reward.scrap + ' scrap ' : ''}${o.reward.stims ? '+' + o.reward.stims + ' stim' + (o.reward.stims > 1 ? 's' : '') : ''}</div>` : '') +
    `<div class="al">${chip('ORION', 'o')} ${chip('THOMAS', 't')}</div>`;
  $('chLeave').style.display = ''; $('chLeave').textContent = 'CONTINUE';
  GM.say('thomas', o.thomas, Math.max(3.5, o.thomas.length * 0.065));
  const after = [AL.tier('o'), AL.tier('t')];
  if (after[0] !== before[0]) GM.pendingAlignBanner = 'o';
  else if (after[1] !== before[1]) GM.pendingAlignBanner = 't';
  AL.hud(true);
}
function chip(name, who) { const t = AL.info(who); return `<span class="alchip"><i style="background:${t.css};box-shadow:0 0 8px ${t.css}"></i>${name} <b style="color:${t.css}">${t.name}</b></span>`; }
AL.chip = chip;
function close() {
  $('choice').classList.add('hidden'); GM.state = prevState === 'choice' ? 'play' : prevState; current = null;
  if (GM.pendingAlignBanner) { const w = GM.pendingAlignBanner; GM.pendingAlignBanner = null; const t = AL.info(w); GM.hud.toast((w === 'o' ? 'ORION' : 'THOMAS') + ' IS NOW ' + t.name); }
  const cb = onClose; onClose = null; if (cb) cb(); else if (GM.ui && GM.ui.lock) GM.ui.lock();
}
$('chLeave').onclick = () => { GM.audio.ui(); close(); };

/* ---------------- HUD chips ---------------- */
let last = '';
AL.hud = function (force) {
  const key = AL.tier('o') + AL.tier('t');
  if (!force && key === last) return; last = key;
  $('alHud').innerHTML = chip('ORION', 'o') + chip('THOMAS', 't');
};
})();
