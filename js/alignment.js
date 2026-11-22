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

/* ---------------- one dialogue choice per chapter ----------------
   Thomas raises the dilemma; Orion picks his reply; Thomas answers. Only the current chapter's choice is live. */
const CHOICES = [
  { id: 'core', chapter: 1, title: 'The Warden\'s Core', auto: true,
    scene: 'The Iron Warden lies in pieces across the plaza. Its core still burns in the wreckage.',
    thomas: 'Commander... the core\'s still live. You can feel it humming. That\'s enough power to light half of London — or to build another one of those things. What do we do with it?',
    options: [
      { align: 'good', say: 'We destroy it. No one ever builds another Warden — not them, and not us.', reply: 'Good. Let it stay dead.', result: 'Orion drives his sabre into the core. The light dies, and the plaza goes quiet.' },
      { align: 'neutral', say: 'Seal it up and hand it to Command. It\'s their call, not ours.', reply: 'Command will want to study it. Let\'s hope that\'s all they do.', result: 'Thomas seals the core in a containment case for Command\'s engineers.', reward: { scrap: 500 } },
      { align: 'evil', say: 'We keep it. With power like that, nobody gives us orders again.', reply: 'Orion... what are you becoming?', result: 'Orion lifts the core. Its red light spills across his armour.', reward: { scrap: 1000 } },
    ] },
  { id: 'pilot', chapter: 2, title: 'The Pilot',
    scene: 'A Pact drone operator drags himself out of a burning wreck on the beach and raises his empty hands.',
    thomas: 'He\'s just a kid, Commander. Younger than me, maybe. He\'s got his hands up. What do we do with him?',
    options: [
      { align: 'good', say: 'Let him go. Tell him to run, and never come back.', reply: '...Thank you, Commander. He\'s just like me.', result: 'He stares, then runs into the smoke. Thomas watches him until he is gone.' },
      { align: 'neutral', say: 'Zip-tie him. Command can decide what he\'s worth.', reply: 'Right. He\'ll keep until the pickup team gets here.', result: 'Thomas binds his wrists and radios his position for pickup.', reward: { scrap: 100 } },
      { align: 'evil', say: 'Take his gear and leave him for the drones.', reply: 'We\'re supposed to be better than them.', result: 'Orion takes his kit and walks away. Behind them, the drones are already circling.', reward: { scrap: 220 } },
    ] },
  { id: 'hospital', chapter: 3, title: 'The Field Hospital',
    scene: 'An abandoned field hospital. Wounded soldiers on every cot, and a handful of stims left on the shelf.',
    thomas: 'There\'s wounded on every cot, Orion. And there\'s stims — not many. We\'re running low ourselves. Your call.',
    options: [
      { align: 'good', say: 'Leave them. They need them more than we do.', reply: 'They\'ll make it now. Some of them, anyway.', result: 'Thomas kneels by each cot and leaves a stim within reach.' },
      { align: 'neutral', say: 'Take one. Leave the rest.', reply: 'Fair. One for the road.', result: 'One stim goes into Orion\'s pack. The rest stay where they are.', reward: { stims: 1 } },
      { align: 'evil', say: 'Take them all. We\'re the ones still fighting.', reply: 'They needed those more than we do, Orion.', result: 'Every stim goes into Orion\'s pack. One of the wounded watches him do it.', reward: { stims: 3 } },
    ] },
  { id: 'rubble', chapter: 4, title: 'Survivors in the Rubble',
    scene: 'A collapsed apartment block. Somewhere under the concrete, someone is knocking.',
    thomas: 'There\'s people under there, Commander — a mother and her little girl. If we dig, the machines will hear us.',
    options: [
      { align: 'good', say: 'Then let them hear us. Start digging.', reply: 'That\'s why we fight. Not for Command — for them.', result: 'The girl clings to Thomas until her mother pulls her away.' },
      { align: 'neutral', say: 'Mark it for the rescue teams. We can\'t stop.', reply: 'Command will send someone... if there\'s anyone left to send.', result: 'Orion sprays a beacon mark on the rubble and moves on.' },
      { align: 'evil', say: 'Take whatever supplies they had and keep moving.', reply: '...Orion. They\'re people.', result: 'Their supplies go into Orion\'s pack. The knocking stops.', reward: { scrap: 150 } },
    ] },
  { id: 'surrender', chapter: 5, title: 'The Surrender',
    scene: 'The Pact\'s marshal kneels before Orion, offering the surrender of his whole army in exchange for his life.',
    thomas: 'That\'s the marshal, Orion. The whole Pact army, if we guarantee his life. It ends the war... or we end him. It\'s your call. It always was.',
    options: [
      { align: 'good', say: 'Accept. If it ends the war, he lives.', reply: 'Then it\'s over. It\'s actually over.', result: 'The marshal gives the order. Across the front, the war machines go still.' },
      { align: 'neutral', say: 'Hand him to Command. Let a tribunal decide.', reply: 'By the book, then. Like you taught me.', result: 'The marshal is taken into British custody. The fighting winds down, front by front.' },
      { align: 'evil', say: 'No deals. The Pact ends with him.', reply: 'This isn\'t who you were, Orion.', result: 'Orion raises his sabre. Thomas turns away.' },
    ] },
];
AL.CHOICES = CHOICES;
AL.forChapter = (n) => CHOICES.find((c) => c.chapter === n);
const done = (id) => !!(GM.save.choices && GM.save.choices[id]);

AL.build = function () { }; // Chapter I's choice happens after the boss; later chapters will place theirs in their own levels

/* ---------------- interaction ---------------- */
AL.nearby = function (pos) {
  for (const c of CHOICES) {
    if (c.auto || !c.pos || c.chapter !== GM.save.chapter || done(c.id)) continue;
    if (Math.hypot(pos[0] - c.pos[0], pos[2] - c.pos[2]) < 2.6) return { type: 'choice', id: c.id, label: 'Talk to Thomas — ' + c.title };
  }
  return null;
};
AL.markers = function (time) { // gentle white glow over undecided choice points
  for (const c of CHOICES) {
    if (c.auto || !c.pos || c.chapter !== GM.save.chapter || done(c.id) || Math.random() > 0.35) continue;
    GM.parts.emit({ pos: [c.pos[0] + (Math.random() - 0.5) * 0.5, 0.6 + Math.random() * 0.8, c.pos[2] + (Math.random() - 0.5) * 0.5], vel: [0, 0.5, 0], size: 0.035, life: 1.3, col: [2.2, 2.1, 1.8, 1], soft: 0.3 });
  }
};
let current = null, onClose = null, prevState = 'play';
const subQ_clear = () => { if (GM.clearSubs) GM.clearSubs(); };
AL.open = function (id, after) {
  const c = CHOICES.find((x) => x.id === id); if (!c || done(id)) { if (after) after(); return; }
  current = c; onClose = after || null; prevState = GM.state; GM.state = 'choice';
  if (document.pointerLockElement) document.exitPointerLock();
  $('chTitle').textContent = c.title; $('chText').innerHTML = `<i>${c.scene}</i><div class="tline"><b>Thomas:</b> “${c.thomas}”</div>`;
  $('chResult').textContent = ''; $('chResult').style.display = 'none';
  $('chOpts').innerHTML = `<div class="orionsay">ORION</div>` + c.options.map((o, i) => `<button class="btn chopt" data-i="${i}" style="border-color:${AL.TIERS[o.align].css}"><span class="dot" style="background:${AL.TIERS[o.align].css}"></span>“${o.say}”</button>`).join('');
  $('chOpts').querySelectorAll('.chopt').forEach((b) => b.onclick = () => choose(+b.dataset.i));
  GM.say('thomas', c.thomas, Math.max(4, c.thomas.length * 0.06));
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
  $('chOpts').innerHTML = ''; $('chResult').style.display = '';
  $('chResult').innerHTML = `<div class="tline"><b class="o">Orion:</b> “${o.say}”</div><div class="tline"><b>Thomas:</b> “${o.reply}”</div><div class="res">${o.result}</div>` +
    (o.reward ? `<div class="rw">${o.reward.scrap ? '+' + o.reward.scrap + ' scrap ' : ''}${o.reward.stims ? '+' + o.reward.stims + ' stim' + (o.reward.stims > 1 ? 's' : '') : ''}</div>` : '') +
    `<div class="al">${chip('ORION', 'o')} ${chip('THOMAS', 't')}</div>`;
  $('chLeave').style.display = ''; $('chLeave').textContent = 'CONTINUE';
  subQ_clear(); GM.say('orion', o.say, Math.max(3, o.say.length * 0.055)); GM.say('thomas', o.reply, Math.max(3, o.reply.length * 0.065));
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
