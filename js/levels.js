/* Levels — per-chapter gameplay: enemies, boss, voice lines, environment.
   Geometry lives in world.js (New London) and world_dover.js (Dover). */
(function () {
'use strict';
const say = (...a) => GM.say(...a);

window.LEVELS = {
  /* ---------------- Chapter I: New London ---------------- */
  1: {
    loading: 'Building New London',
    spawns: [['trooper', [2, 0, 24]], ['trooper', [-3, 0, 38.6]], ['drone', [0, 0, 46]], ['trooper', [4, 0, 53]], ['trooper', [-2, 0, 58]],
      ['brute', [-3, 0, 64]], ['drone', [3, 0, 78]], ['trooper', [-1, 0, 87]], ['trooper', [4, 0, 91]], ['drone', [-2, 0, 93]],
      ['brute', [1, 0, 111]], ['trooper', [-4, 0, 115.5]], ['trooper', [4, 0, 117]]],
    boss: { type: 'boss', pos: [0, 0, 157], seen: 'boss' },
    choice: 'core',
    ambience: 'ash',
    env: null, // engine defaults: burning night
    voice: { who: 'warden', lang: 'zh-CN', file: (n) => 'voice/warden' + String(n).padStart(2, '0') + '.mp3', lines: {
      intro: ['入侵者。伦敦现在属于中俄同盟。', 'Intruder. London belongs to the Sino-Russian Pact now.', 1, 4.75],
      children: ['你们的指挥官把孩子送来送死。', 'Your commanders send children to die.', 2, 3.0],
      taunts: [
        ['红日与巨熊，已在同一面旗帜下联合。', 'The Red Sun and the Bear have united under one banner.', 3, 3.71],
        ['跪下！', 'Kneel!', 11, 1.57],
        ['无处可逃。', 'There is nowhere to run.', 8, 2.19],
        ['你的剑救不了伦敦。', 'Your sword will not save London.', 6, 2.27],
        ['为了同盟！', 'For the Pact!', 9, 1.8],
      ],
      barrage: ['轨道打击，锁定目标。', 'Orbital strike. Target locked.', 4, 2.27],
      phase2: ['核心过载……我不会倒下！', 'Core overloading… I will not fall!', 5, 2.93],
      kill: ['又一个英国人倒下了。', 'Another Briton falls.', 10, 2.27],
      death: ['不可能……同盟……是永恒的……', 'Impossible… the Pact… is eternal…', 7, 3.71],
    } },
    intro() {
      say('thomas', 'Commander! Orion — you\'re awake. The dropship\'s gone. The whole squad... it\'s just us now.', 7.4, 1);
      say('orion', 'Then we finish the job, Tom. British Command sent us to break this siege, and the Iron Warden still holds the cathedral.', 7.9, 2);
      say('thomas', 'There\'s a signal beacon right here. Light it and Command will know we\'re still breathing.', 5.2, 3);
    },
    beacon(i) {
      if (i === 0) say('thomas', 'Beacon\'s live! British Command will know we\'re still in the fight. If things go south, we regroup here.', 6.9, 7);
      else say('thomas', 'Second beacon\'s up. The cathedral\'s just past those barricades, Commander.', 4.9, 8);
    },
    bossIntro() {
      say('orion', 'Iron Warden. Ten years of war, and you\'re all that stands between London and the dawn. Not for long.', 7.8, 11);
      say('thomas', 'Watch the slam — it sends out a shockwave. Roll through it, just like training!', 5.8, 12);
    },
    phase2() { say('thomas', 'Its core\'s going critical — it\'s gone berserk! Keep moving, Orion!', 5.1, 13); },
    victory() {
      say('thomas', '...It\'s down. We actually did it.', 3.4, 14);
      say('orion', 'Ten years of war won\'t end tonight, Tom. But tonight, London breathes.', 6.1, 15);
      say('thomas', 'Then let\'s light every beacon we\'ve got. Let the whole city see it.', 4.9, 16);
      say('radio', 'British Command to Commander Mascar. We see your signal. Hold position — the Americans are crossing the Atlantic. Dawn is coming.', 8.8, 17);
      return { banner: ['WARDEN DESTROYED', 'NEW LONDON BREATHES'], endIn: 25 };
    },
    endings: { good: 'London will remember the commander who fought for its people.', neutral: 'A soldier who did his duty — no more, no less.', evil: 'London is free. But the man who freed it is not the man who arrived.' },
  },

  /* ---------------- Chapter II: Dover ---------------- */
  2: {
    loading: 'Landing at Dover',
    spawns: [['trooper', [2, 0, 20]], ['drone', [7, 0, 27]], ['trooper', [-4, 0, 33]], ['trooper', [4, 0, 41]], ['drone', [-3, 0, 47]],
      ['brute', [1, 0, 58]], ['drone', [8, 0, 64]], ['trooper', [-6, 0, 71]], ['trooper', [3, 0, 79]], ['drone', [-1, 0, 85]], ['drone', [8, 0, 88]],
      ['brute', [-2, 0, 105]], ['trooper', [4, 0, 109]], ['trooper', [-8, 0, 113]], ['drone', [1, 0, 116]]],
    boss: { type: 'tidebreaker', pos: [-5, 0, 158], seen: 'boss2' },
    choice: 'pilot',
    ambience: 'rain',
    env: { // a cold, grey Channel dawn
      sunDir: [0.72, 0.3, 0.3], sunCol: [1.05, 0.9, 0.78], sky: [0.2, 0.22, 0.26], ground: [0.11, 0.1, 0.095],
      fogCol: [0.27, 0.29, 0.33], fogDen: 0.013, exposure: 1.05,
      skyPal: { top: [0.13, 0.15, 0.19], hor: [0.5, 0.47, 0.45], glow: [0.18, 0.07, 0.02], clLo: [0.16, 0.17, 0.19], clHi: [0.44, 0.43, 0.43], stars: 0, moon: 0 },
    },
    voice: { who: 'tide', lang: 'ru-RU', file: null, lines: {
      intro: ['Британские дети. Флот уже у ваших берегов.', 'British children. The fleet is already at your shores.'],
      children: ['Ваша Англия послала мальчиков против стали.', 'Your England sent boys against steel.'],
      taunts: [
        ['Красное Солнце и Медведь — под одним знаменем.', 'The Red Sun and the Bear — under one banner.'],
        ['На колени!', 'Kneel!'],
        ['Море заберёт вас.', 'The sea will take you.'],
        ['Этот берег наш.', 'This shore is ours.'],
        ['За Союз!', 'For the Pact!'],
      ],
      barrage: ['Флот, огонь по моей позиции!', 'Fleet — fire on my position!'],
      phase2: ['Реактор на пределе… Я не отступлю!', 'Reactor at its limit… I will not retreat!'],
      kill: ['Ещё один англичанин — в море.', 'Another Englishman for the sea.'],
      death: ['Берег… потерян…', 'The shore… is lost…'],
    } },
    intro() {
      say('radio', 'British Command to Commander Mascar. The Pact holds a beachhead under the cliffs at Dover. The American fleet can\'t land until it\'s gone. Break it.', 8.5);
      say('thomas', 'The white cliffs, Commander. My gran used to sing about these. Never thought I\'d see them.', 6);
      say('orion', 'Take a good look, Tom. We\'re taking them back. Light the beacon — Command will want to know we\'ve landed.', 6.5);
    },
    beacon(i) {
      if (i === 0) say('thomas', 'Beacon\'s live. They can see it from across the water. If it goes bad down there, we fall back here.', 6);
      else say('thomas', 'This old pillbox held this beach once before, in the last war. The landing zone\'s just past that ship, Commander.', 6.5);
    },
    bossIntro() {
      say('orion', 'So that\'s what\'s been holding the beach. Tom — whatever happens, keep it off the water.', 6);
      say('thomas', 'It\'s built for the surf. Watch the slam, and roll through the shockwave!', 5);
    },
    phase2() { say('thomas', 'Its reactor\'s spiking — it\'s calling the fleet down on us! Watch for the markers!', 5); },
    victory() {
      say('thomas', 'It\'s down! The beachhead\'s broken!', 3.5);
      say('radio', 'Command to Mascar. We see it from here. The beach is clear — the American fleet is turning for Dover. Well done, both of you.', 8);
      say('orion', 'Not yet, Tom. Something\'s moving in the wreck.', 4);
      return { banner: ['TIDEBREAKER DESTROYED', 'THE BEACH IS OURS'], endIn: 17 };
    },
    endings: { good: 'Somewhere, a boy from that wreck is still alive — and he will remember the British commander who let him go.', neutral: 'The beach is clear and the orders were followed. The fleet can land.', evil: 'Dover is free. Its cliffs will remember a different kind of soldier.' },
  },
};
})();
