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

  /* ---------------- Chapter II, Part I: Dover Castle — Orion alone ---------------- */
  '2a': {
    loading: 'Climbing to Dover Castle',
    hero: 'orion', solo: true,
    spawns: [['trooper', [2, 0, 22]], ['drone', [-4, 0, 34]], ['trooper', [5, 0, 46]], ['trooper', [-3, 0, 74]], ['drone', [6, 0, 82]],
      ['brute', [0, 0, 90]], ['trooper', [-8, 0, 104]], ['drone', [3, 0, 108]], ['trooper', [8, 0, 113]], ['brute', [-3, 0, 116]]],
    boss: { duelist: 'talina', pos: [0, 0, 158], seen: 'boss2a',
      T: { name: 'TALINA ALVAREZ, Traitor of British Command', hp: 1500, dmg: 44, scrap: 2500, s: 1, glow: [2.2, 0.35, 2.8], light: [0.8, 0.2, 1.0] } },
    cutscene: 'eye',
    ambience: 'rain',
    env: { sunDir: [0.72, 0.3, 0.3], sunCol: [1.05, 0.9, 0.78], sky: [0.2, 0.22, 0.26], ground: [0.11, 0.1, 0.095], fogCol: [0.27, 0.29, 0.33], fogDen: 0.013, exposure: 1.05,
      skyPal: { top: [0.13, 0.15, 0.19], hor: [0.5, 0.47, 0.45], glow: [0.18, 0.07, 0.02], clLo: [0.16, 0.17, 0.19], clHi: [0.44, 0.43, 0.43], stars: 0, moon: 0 } },
    // Talina speaks English with some Spanish; subtitles only for now
    voice: { who: 'talina', lang: null, file: null, lines: {
      intro: [null, 'Commander Mascar. I hoped they\'d send someone I didn\'t have to respect.'],
      taunts: [
        [null, 'The Red Sun and the Bear don\'t need Britain. But they wanted me.'],
        [null, '¡Vamos, niño! Is that all?'],
        [null, 'Too slow, Commander.'],
        [null, 'I trained half of Command\'s cadets. Who do you think taught your teachers?'],
        [null, 'Britain is already dead. You just haven\'t noticed.'],
      ],
      phase2: [null, 'Basta de juegos. Enough games.'],
      kill: [null, 'Lo siento, Orion. You were good. Just not good enough.'],
      death: [null, 'Bien hecho, Comandante... You really are what they say.'],
    } },
    intro() {
      say('radio', 'Command to Mascar. Hawthorne\'s with the assault force on the beach. Pact spotters in Dover Castle are calling the fleet\'s guns down on them. Clear the clifftop.', 8.5);
      say('orion', 'Understood. Tell Tom to keep his head down. I\'ll be back for him.', 5);
      say('radio', 'One more thing, Commander. The castle garrison answers to Talina Alvarez.', 5);
      say('orion', '...Alvarez. She trained half of Command. She was one of us.', 5);
    },
    beacon(i) {
      if (i === 0) say('orion', 'Beacon\'s lit. Command knows I\'m up here.', 3.5);
      else say('orion', 'The old Roman lighthouse. Two thousand years it\'s watched the Channel. It can watch one more fight.', 6);
    },
    bossIntro() {
      say('orion', 'Talina Alvarez. You swore the same oath I did.', 4);
      say('talina', 'And I watched London burn while Command hid underground. The Pact keeps its promises, Orion. Does Britain?', 7);
    },
    phase2() { },
    victory() { return { endIn: 4.4 }; },
    endings: {},
  },

  /* ---------------- Chapter II, Part II: Dover Beach — Thomas alone ---------------- */
  '2b': {
    loading: 'Landing at Dover',
    hero: 'thomas', solo: true, endingBy: 't', // Thomas's story: the closing line follows his alignment
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
      say('radio', 'Command to Hawthorne. Commander Mascar is being flown out. He\'s alive, Tom — but he\'s out of this fight.', 7);
      say('thomas', '...What happened up there?', 3);
      if (GM.save.talina === 'executed') say('radio', 'Alvarez is dead. He... did it himself. Hawthorne, the beachhead still has to fall, and you\'re all we\'ve got left on the shingle.', 8);
      else say('radio', 'Alvarez. She got away. The beachhead still has to fall, and you\'re all we\'ve got left on the shingle. It\'s down to you.', 7.5);
      say('thomas', 'Understood. I won\'t let him down. Beacon first — then the Tidebreaker.', 5.5);
    },
    beacon(i) {
      if (i === 0) say('thomas', 'Beacon\'s live. Command can see me from across the water.', 4.5);
      else say('thomas', 'The old pillbox. It held this beach once before. The landing zone\'s just past that ship.', 5.5);
    },
    bossIntro() {
      say('thomas', 'So you\'re what\'s been holding the beach. The Commander\'s not here. You\'ve got me instead.', 6);
    },
    phase2() { say('thomas', 'Its reactor\'s spiking — it\'s calling the fleet down! Keep moving, Tom. Keep moving...', 5); },
    victory() {
      say('thomas', 'It\'s down... It\'s down! Command, the beachhead\'s broken!', 4.5);
      say('radio', 'We see it, Hawthorne. The American fleet is turning for Dover. ...He\'d be proud of you, son.', 7);
      say('thomas', 'Something\'s moving in the wreck.', 3.5);
      return { banner: ['TIDEBREAKER DESTROYED', 'THE BEACH IS OURS'], endIn: 16 };
    },
    endings: { good: 'Thomas let him go. Somewhere, a boy from that wreck is alive because of him.', neutral: 'Thomas followed his orders to the letter. The beach is clear, and the fleet can land.', evil: 'The beach is clear. But Thomas Hawthorne came back from Dover colder than he went.' },
  },
};
})();
