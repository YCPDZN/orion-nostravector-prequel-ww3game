/* Levels — per-chapter gameplay: enemies, boss, voice lines, environment.
   Geometry lives in world.js (New London) and world_dover.js (Dover). */
(function () {
'use strict';
const say = (...a) => GM.say(...a);
/* numbered Chapter II lines: plays voice/doverNN.mp3 when that recording exists, and keeps the subtitle up for as long as it plays */
const sayN = (n, who, text, dur) => GM.say(who, text, GM.voDur(n, dur), GM.vo(n));
/* numbered Chapter III lines: voice/normandyNN.mp3 */
const say3 = (n, who, text, dur) => GM.say(who, text, GM.voDur3(n, dur), GM.vo3(n));
/* numbered Chapter IV lines: voice/kaliningradNN.mp3 */
const say4 = (n, who, text, dur) => GM.say(who, text, GM.voDur4(n, dur), GM.vo4(n));
const SNOW_NIGHT = { // Kaliningrad, a winter night: snow cloud lit by the fires below
  sunDir: [-0.32, 0.55, -0.48], sunCol: [0.5, 0.58, 0.78], sky: [0.09, 0.1, 0.13], ground: [0.13, 0.13, 0.15], fogCol: [0.17, 0.19, 0.24], fogDen: 0.02, exposure: 1.3,
  skyPal: { top: [0.02, 0.025, 0.04], hor: [0.24, 0.22, 0.24], glow: [0.26, 0.1, 0.03], clLo: [0.08, 0.085, 0.1], clHi: [0.32, 0.31, 0.34], stars: 0, moon: 0 } };

const TALINA3 = { who: 'talina', lang: null, file: null, vo: 3, lines: {
  intro: [null, 'Orion. I see you kept my gift.', 11],
  taunts: [[null, 'One eye, Orion. You will not see the next one coming.', 12], [null, '¡Otra vez, niño!', 13], [null, 'Did you think I would stay away?', 14],
    [null, 'The Red Sun and the Bear sent me back for you.', 15], [null, 'You told me something at Dover. Did you mean it?', 16]],
  phase2: [null, 'Ya basta. Now I fight for real.', 17],
  kill: [null, 'Adiós, Orion. This time, for good.', 18],
  death: [null, 'Again... you beat me again...', 19],
} };
const INES = { who: 'ines', lang: null, file: null, vo: 3, lines: {
  intro: [null, 'So you are the one. You have the face she wrote about in her letters.', 29],
  taunts: [[null, 'She taught me everything. Every cut.', 30], [null, 'Look at me. Do you see her?', 31], [null, '¡Por Talina!', 32],
    [null, 'You took everything I had left.', 33], [null, 'The Red Sun and the Bear gave me this blade. You will give me your life.', 34]],
  phase2: [null, '¡Por mi hermana! For my sister!', 35],
  kill: [null, 'It is done, Talina. It is done.', 36],
  death: [null, 'Talina... lo siento...', 37],
} };
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
    voice: { who: 'talina', lang: null, file: null, vo: true, lines: {
      intro: [null, 'Commander Mascar. I hoped they\'d send someone I didn\'t have to respect.', 15],
      taunts: [
        [null, 'The Red Sun and the Bear don\'t need Britain. But they wanted me.', 18],
        [null, '¡Vamos, niño! Is that all?', 19],
        [null, 'Too slow, Commander.', 20],
        [null, 'I trained half of Command\'s cadets. Who do you think taught your teachers?', 21],
        [null, 'Britain is already dead. You just haven\'t noticed.', 22],
      ],
      phase2: [null, 'Basta de juegos. Enough games.', 23],
      kill: [null, 'Lo siento, Orion. You were good. Just not good enough.', 24],
      death: [null, 'Bien hecho, Comandante... You really are what they say.', 25],
    } },
    intro() {
      sayN(6, 'radio', 'Command to Mascar. Hawthorne\'s with the assault force on the beach. Pact spotters in Dover Castle are calling the fleet\'s guns down on them. Clear the clifftop.', 8.5);
      sayN(7, 'orion', 'Understood. Tell Tom to keep his head down. I\'ll be back for him.', 5);
      sayN(8, 'radio', 'One more thing, Commander. The castle garrison answers to Talina Alvarez.', 5);
      sayN(9, 'orion', '...Alvarez. She trained half of Command. She was one of us.', 5);
    },
    beacon(i) {
      if (i === 0) sayN(10, 'orion', 'Beacon\'s lit. Command knows I\'m up here.', 3.5);
      else sayN(11, 'orion', 'The old Roman lighthouse. Two thousand years it\'s watched the Channel. It can watch one more fight.', 6);
    },
    bossIntro() {
      sayN(16, 'orion', 'Talina Alvarez. You swore the same oath I did.', 4);
      sayN(17, 'talina', 'And I watched London burn while Command hid underground. The Pact keeps its promises, Orion. Does Britain?', 7);
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
    voice: { who: 'tide', lang: 'ru-RU', file: null, vo: true, lines: {
      intro: ['Британские дети. Флот уже у ваших берегов.', 'British children. The fleet is already at your shores.', 58],
      children: ['Ваша Англия послала мальчиков против стали.', 'Your England sent boys against steel.', 65],
      taunts: [
        ['Красное Солнце и Медведь — под одним знаменем.', 'The Red Sun and the Bear — under one banner.', 60],
        ['На колени!', 'Kneel!', 61],
        ['Море заберёт вас.', 'The sea will take you.', 62],
        ['Этот берег наш.', 'This shore is ours.', 63],
        ['За Союз!', 'For the Pact!', 64],
      ],
      barrage: ['Флот, огонь по моей позиции!', 'Fleet — fire on my position!', 66],
      phase2: ['Реактор на пределе… Я не отступлю!', 'Reactor at its limit… I will not retreat!', 67],
      kill: ['Ещё один англичанин — в море.', 'Another Englishman for the sea.', 69],
      death: ['Берег… потерян…', 'The shore… is lost…', 70],
    } },
    intro() {
      sayN(48, 'radio', 'Command to Hawthorne. Commander Mascar is being flown out. He\'s alive, Tom — but he\'s out of this fight.', 7);
      sayN(49, 'thomas', '...What happened up there?', 3);
      if (GM.save.talina === 'executed') sayN(51, 'radio', 'Alvarez is dead. He... did it himself. Hawthorne, the beachhead still has to fall, and you\'re all we\'ve got left on the shingle.', 8);
      else sayN(50, 'radio', 'Alvarez. She got away. The beachhead still has to fall, and you\'re all we\'ve got left on the shingle. It\'s down to you.', 7.5);
      sayN(52, 'thomas', 'Understood. I won\'t let him down. Beacon first — then the Tidebreaker.', 5.5);
    },
    beacon(i) {
      if (i === 0) sayN(53, 'thomas', 'Beacon\'s live. Command can see me from across the water.', 4.5);
      else sayN(54, 'thomas', 'The old pillbox. It held this beach once before. The landing zone\'s just past that ship.', 5.5);
    },
    bossIntro() {
      sayN(59, 'thomas', 'So you\'re what\'s been holding the beach. The Commander\'s not here. You\'ve got me instead.', 6);
    },
    phase2() { sayN(68, 'thomas', 'Its reactor\'s spiking — it\'s calling the fleet down! Keep moving, Tom. Keep moving...', 5); },
    victory() {
      sayN(71, 'thomas', 'It\'s down... It\'s down! Command, the beachhead\'s broken!', 4.5);
      sayN(72, 'radio', 'We see it, Hawthorne. The American fleet is turning for Dover. ...He\'d be proud of you, son.', 7);
      sayN(73, 'thomas', 'Something\'s moving in the wreck.', 3.5);
      return { banner: ['TIDEBREAKER DESTROYED', 'THE BEACH IS OURS'], endIn: 16 };
    },
    endings: { good: 'Thomas let him go. Somewhere, a boy from that wreck is alive because of him.', neutral: 'Thomas followed his orders to the letter. The beach is clear, and the fleet can land.', evil: 'The beach is clear. But Thomas Hawthorne came back from Dover colder than he went.' },
  },

  /* ---------------- Chapter III: Normandy, June 2091 — Orion (eyepatch) with Thomas ----------------
     The boss is Talina Alvarez if she walked away from Dover; if Orion executed her, it is her twin sister Inés. */
  3: {
    loading: 'Crossing to Normandy',
    spawns: [['trooper', [2, 0, 20]], ['drone', [-3, 0, 30]], ['trooper', [3, 0, 38]], ['trooper', [-2, 0, 50]], ['brute', [4, 0, 60]],
      ['drone', [-6, 0, 64]], ['trooper', [7, 0, 74]], ['trooper', [-2, 0, 78]], ['drone', [2, 0, 92]], ['trooper', [-3, 0, 100]],
      ['brute', [0, 0, 110]], ['trooper', [-4, 0, 116]], ['trooper', [4, 0, 117]]],
    boss: { duelist: 'talina', pos: [0, 0, 158], seen: 'boss3',
      T: { name: 'TALINA ALVAREZ, Traitor of British Command', hp: 1900, dmg: 50, scrap: 3800, s: 1, glow: [2.2, 0.35, 2.8], light: [0.8, 0.2, 1.0] } },
    // if Orion executed Talina at Dover, her twin is here instead: two blades, spinning cuts, twice her sister's strength
    bossAlt: { duelist: 'ines', pos: [0, 0, 158], when: () => GM.save.talina === 'executed',
      T: { name: 'INÉS ALVAREZ, Talina\'s Twin', hp: 3800, dmg: 100, scrap: 5200, s: 1, dual: true, spin: true, glow: [3.0, 0.3, 1.1], light: [1.0, 0.15, 0.35] } },
    get choice() { return GM.save.talina === 'executed' ? 'ines' : 'talina3'; },
    ambience: 'summer',
    env: { // a clear June morning over the bocage
      sunDir: [0.45, 0.62, 0.42], sunCol: [1.45, 1.32, 1.1], sky: [0.34, 0.4, 0.52], ground: [0.16, 0.15, 0.1], fogCol: [0.55, 0.64, 0.78], fogDen: 0.0055, exposure: 1.0,
      skyPal: { top: [0.12, 0.26, 0.56], hor: [0.7, 0.72, 0.72], glow: [0.04, 0.03, 0.01], clLo: [0.6, 0.62, 0.66], clHi: [0.98, 0.96, 0.92], stars: 0, moon: 0 } },
    // Talina (or her sister) speaks English with some Spanish; subtitles only until recorded
    get voice() { return GM.save.talina === 'executed' ? INES : TALINA3; },
    intro() {
      say3(1, 'radio', 'Command to Mascar. The Americans are pinned at the hedgerows. There\'s a Pact machine in every field between here and the village. Clear the lanes and take the church square.', 8.5);
      say3(2, 'thomas', 'Good to have you back, Commander. How\'s the eye?', 3.5);
      say3(3, 'orion', 'Gone, Tom. The rest of me works fine. Light the beacon.', 4);
    },
    beacon(i) {
      if (i === 0) say3(4, 'thomas', 'Beacon\'s lit. The Yanks can see us now.', 3.5);
      else say3(5, 'thomas', 'Orchard\'s clear. The church is just past those houses, Commander.', 4.5);
    },
    bossIntro() {
      if (GM.save.talina === 'executed') {
        GM.save.seen.boss3i = 1;
        say3(27, 'orion', 'Who are you?', 2.5);
        say3(28, 'ines', 'Inés Alvarez. You left my sister on her knees in the mud at Dover. I came to return the favour.', 6.5);
      } else {
        say3(9, 'orion', 'You should have stayed gone, Talina.', 3.5);
        say3(10, 'talina', 'And miss this? Draw, Comandante. Let us finish the lesson.', 4.5);
      }
    },
    phase2() { say3(6, 'thomas', 'She\'s getting faster, Commander — stay on her!', 3.5); },
    victory() {
      const ines = GM.save.talina === 'executed';
      say3(7, 'thomas', 'She\'s down! Commander, she\'s down!', 3);
      say3(8, 'radio', 'Command to Mascar. The square is ours. The Americans are moving up — Normandy is open.', 6);
      return { banner: [ines ? 'INÉS ALVAREZ DEFEATED' : 'TALINA ALVAREZ DEFEATED', 'THE BOCAGE IS OURS'], endIn: 10 };
    },
    ending(S) {
      return ({ saved: 'Talina Alvarez walked out of Normandy at Orion\'s side. Command does not know yet. Neither, for now, does anyone else.',
        command: 'Talina Alvarez went to British Command in chains. Normandy is free.', dead: 'Talina Alvarez died in the church square. Normandy is free, and Orion did not look back.',
        companion: 'Inés Alvarez will fight beside the man who killed her sister. Neither of them has said a word about it.',
        icommand: 'Inés Alvarez went to British Command in chains. She is still waiting.', idead: 'Both Alvarez sisters are gone now. Normandy is free.' })[S.talina === 'executed' ? (S.ines === 'companion' ? 'companion' : 'i' + (S.ines || 'command')) : (S.talina3 || 'command')];
    },
  },
  /* ---------------- Chapter IV: Kaliningrad ---------------- */
  /* Part I (only if Orion saved Talina at Normandy): she is in labour at the field hospital, and the Pact's Hunter is at its gates */
  '4a': {
    loading: 'Marching on Kaliningrad',
    spawns: [['trooper', [2, 0, 20]], ['drone', [-3, 0, 31]], ['trooper', [-2, 0, 44]], ['trooper', [3, 0, 52]], ['brute', [0, 0, 60]],
      ['drone', [5, 0, 70]], ['trooper', [-4, 0, 78]], ['trooper', [3, 0, 92]], ['drone', [-3, 0, 103]], ['brute', [2, 0, 110]], ['trooper', [-3, 0, 116]]],
    boss: { type: 'hunter', pos: [0, 0, 158], seen: 'boss4a' },
    npc: { asset: 'talinaP', clip: 'Kneel', yaw: Math.PI }, // Talina, under the awning at the hospital door
    cutscene: 'birth',
    ambience: 'snow',
    env: SNOW_NIGHT,
    voice: { who: 'hunter', lang: 'zh-CN', file: null, vo: 4, lines: {
      intro: ['找到你了。医院里的人，一个也跑不掉。', 'Found you. No one in that hospital gets away.', 2],
      death: ['熊……会完成……', 'The Bear... will finish it...', 3],
    } },
    intro() { say4(1, 'radio', 'Mascar, the field hospital is cut off. Pact hunters are at the gates. Get there first.', 6); },
    beacon() { },
    bossIntro() { },
    phase2() { },
    victory() {
      return { banner: ['THE HUNTER DESTROYED', 'THE HOSPITAL IS SAFE'], endIn: 9 };
    },
    endings: { good: '', neutral: '', evil: '' },
  },
  /* Part II (or the whole chapter, if Talina is dead): the Bear holds the square before the House of Soviets */
  '4b': {
    loading: 'Entering Kaliningrad',
    spawns: [['trooper', [2, 0, 22]], ['drone', [-4, 0, 30]], ['trooper', [3, 0, 36]], ['trooper', [-2, 0, 44]], ['brute', [2, 0, 56]],
      ['drone', [0, 0, 70]], ['trooper', [-2, 0, 78]], ['trooper', [3, 0, 84]], ['brute', [-1, 0, 100]], ['drone', [4, 0, 106]],
      ['trooper', [-4, 0, 112]], ['trooper', [3, 0, 116]], ['drone', [0, 0, 118]]],
    boss: { type: 'bear', pos: [0, 0, 162], seen: 'boss4' },
    ally: 'ines', // fights beside Orion if he spared her at Normandy
    choice: 'rubble',
    ambience: 'snow',
    env: SNOW_NIGHT,
    voice: { who: 'bear', lang: 'ru-RU', file: null, vo: 4, lines: {
      intro: ['Кёнигсберг не падёт.', 'Königsberg will not fall.', 21],
      death: ['Медведь… засыпает…', 'The Bear... sleeps...', 22],
    } },
    intro() { say4(13, 'radio', 'All units: the Bear holds the square at the House of Soviets. Break it, and Kaliningrad falls.', 6); },
    beacon() { },
    bossIntro() { },
    phase2() { },
    victory() {
      return { banner: ['THE BEAR DESTROYED', 'KALININGRAD IS OURS'], endIn: 9 };
    },
    ending(S) {
      const t = GM.align.tier('o');
      const city = { good: 'Kaliningrad is free, and Orion still remembers why he fights.', neutral: 'Kaliningrad is free. One more city off the list.', evil: 'Kaliningrad is free, and its people are afraid of the man who freed it.' }[t];
      const who = S.child === 'born' ? ' Somewhere behind the line, Talina is holding their child.' : S.ines === 'companion' ? ' Inés Alvarez cleaned her blades and said nothing.' : '';
      return city + who;
    },
  },
};
})();
