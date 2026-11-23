/* Chapters — each entry is one mission of ORION: The Third World War.
   To add a chapter: append an entry with available: true and give it a level / spawns in a later update. */
const CH4_PARTS = [
  { numeral: 'I', title: 'Born Under Siege', place: 'Kaliningrad Outskirts',
    prologue: ['Winter, 2094.',
      'Three years after Normandy, the war has moved east, to the Pact\'s last foothold on the Baltic: Kaliningrad, the old Königsberg.',
      'Talina Alvarez never went back to the Pact. In the spring, she told Orion she was carrying his child.',
      'Tonight the siege began, and Talina went into labour at a field hospital that is now cut off. The Pact\'s hunters are already at its gates.'] },
  { numeral: 'II', title: 'The Bear', place: 'House of Soviets',
    prologue: ['Talina and the child are safe behind the line.', 'Orion goes back to the front. In the heart of the city, the Bear is waiting.'] },
];
/* ---------------- Chapter V: where the war ends ----------------
   Every choice in the game moves Orion's and Thomas's alignment; after Kaliningrad the two tiers decide the final battle.
   9 outcomes. Each part: where it is fought, the boss, and who you play. */
const CH5_PLACE = { harbin: 'Harbin', moscow: 'Moscow', london: 'New London' };
const CH5_BOSS = { yi: 'Marshal Yi Liang', orlov: 'General Vladimir Orlov', thomas: 'Thomas Hawthorne', orion: 'Orion Mascar', josiah: 'Josiah Williams I' };
const P5 = (place, boss, hero) => ({ place, boss, hero });
const CH5_ROUTES = {
  'good/good': [P5('harbin', 'yi', 'orion')],
  'good/neutral': [P5('harbin', 'yi', 'orion')],
  'good/evil': [P5('harbin', 'yi', 'orion'), P5('london', 'thomas', 'orion')],
  'neutral/neutral': [P5('moscow', 'orlov', 'orion')],
  'neutral/good': [P5('moscow', 'orlov', 'orion')],
  'neutral/evil': [P5('moscow', 'orlov', 'orion'), P5('london', 'thomas', 'orion')],
  'evil/good': [P5('london', 'orion', 'thomas'), P5('harbin', 'yi', 'thomas')],
  'evil/neutral': [P5('london', 'orion', 'thomas'), P5('moscow', 'orlov', 'thomas')],
  'evil/evil': [P5('london', 'josiah', 'orion')],
};
const tierFor = (S, who) => { const a = (S && S.align) || { o: 0, t: 0 }, v = who === 't' ? a.t : a.o; return v >= 30 ? 'good' : v <= -30 ? 'evil' : 'neutral'; };
/* the route the war takes, from a save (defaults to the game in play) */
window.CH5 = {
  PLACE: CH5_PLACE, BOSS: CH5_BOSS, ROUTES: CH5_ROUTES,
  route(S) { if (S && S.alignAt && S.alignAt[5]) S = { align: S.alignAt[5] }; const key = tierFor(S, 'o') + '/' + tierFor(S, 't'); return { key, o: tierFor(S, 'o'), t: tierFor(S, 't'), parts: CH5_ROUTES[key] }; }, // decided by how Chapter IV ended
  summary(S) { const r = this.route(S); return r.parts.map((p, i) => (r.parts.length > 1 ? 'Part ' + (i ? 'II' : 'I') + ': ' : '') + CH5_PLACE[p.place] + ', against ' + CH5_BOSS[p.boss] + (p.hero === 'thomas' ? ' (as Thomas)' : '')).join(' · '); },
};
/* the war record: every choice made so far, as Orion's and Thomas's histories */
const REC = {
  core: { good: 'destroyed the Iron Warden\'s core in New London', neutral: 'handed the Iron Warden\'s core to British Command', evil: 'kept the Iron Warden\'s core for himself' },
  pilot: { good: 'let a Pact pilot go free on Dover beach', neutral: 'took the pilot on Dover beach prisoner', evil: 'left the pilot on Dover beach to the drones' },
  talina3: { good: 'saved her at Normandy', neutral: 'gave her to British Command at Normandy', evil: 'killed her in the church square at Normandy' },
  ines: { good: 'spared her sister Inés at Normandy', neutral: 'sent her sister Inés to British Command', evil: 'killed her sister Inés at Normandy' },
  garrison: { good: 'fed the Kaliningrad garrison that surrendered to him', neutral: 'left the Kaliningrad garrison under guard in the snow', evil: 'left none of the Kaliningrad garrison alive' },
  rubble: { good: 'dug a mother and her daughter out of the rubble of Kaliningrad', neutral: 'left a mother and her daughter under the rubble for the rescue teams', evil: 'took the supplies of a mother and her daughter trapped in the rubble' },
};
const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + (a.length > 2 ? ',' : '') + ' and ' + a[a.length - 1];
const LABEL = { o: { good: 'Chaotic Good', neutral: 'Chaotic Neutral', evil: 'Chaotic Evil' }, t: { good: 'Lawful Good', neutral: 'Lawful Neutral', evil: 'Lawful Evil' } };
const ROUTE_TEXT = {
  'good/good': ['Together, Orion and Thomas lead the Allied advance east, to Harbin, the city where the Red Sun and the Bear first swore their alliance.',
    'Marshal Yi Liang holds it with the last of the Pact. The war will end where it began.'],
  'good/neutral': ['Orion leads the advance east, to Harbin, where the Pact was born. Thomas follows his orders, as he always has.',
    'Marshal Yi Liang holds the city with the last of the Pact. The war will end where it began.'],
  'good/evil': ['Orion leads the advance east, to Harbin, to end the war against Marshal Yi Liang.',
    'Thomas Hawthorne does not go with him. He has gone home to New London, with plans of his own. When Harbin falls, Orion will have to follow him there.'],
  'neutral/neutral': ['British Command gives the order, and Orion and Thomas carry it out: Moscow.',
    'General Vladimir Orlov holds the Kremlin with what is left of the Russian army. Command wants it taken. They do not ask why.'],
  'neutral/good': ['Command sends them to Moscow. Orion goes because he is ordered to. Thomas goes because the people of Moscow will need someone on their side when it falls.',
    'General Vladimir Orlov holds the Kremlin with what is left of the Russian army.'],
  'neutral/evil': ['Orion takes the road to Moscow on Command\'s orders, to break General Vladimir Orlov and the Russian army.',
    'Behind him, Thomas Hawthorne has stopped taking orders from anyone. When Moscow falls, Orion will have to go home to New London, and face him.'],
  'evil/good': ['Orion Mascar has turned on his own side. With the war all but won, he has taken New London for himself.',
    'Thomas Hawthorne goes home alone, to stop the man who taught him everything. Then the war still has to be ended, in Harbin, against Marshal Yi Liang.'],
  'evil/neutral': ['Orion Mascar has turned on his own side. With the war all but won, he has taken New London for himself.',
    'British Command sends Thomas Hawthorne to bring him down. He does not argue. Then the war still has to be ended, in Moscow, against General Vladimir Orlov.'],
  'evil/evil': ['Orion and Thomas have no more use for British Command, or for the war it made of their lives.',
    'They are going home to New London, for Josiah Williams I: the head of British Command, the man who has given them every order they ever followed.'],
};
/* each part's title card and opening crawl, by where it is fought and who is playing */
const OPEN5 = {
  'harbin/yi/orion': ['Spring, 2095. Harbin.', 'The city where the Red Sun and the Bear first swore their alliance. Russian domes, Chinese neon, and the Pact\'s last army.', 'Marshal Yi Liang is waiting in the square before the Church of Saint Sophia.'],
  'harbin/yi/thomas': ['Harbin.', 'Thomas Hawthorne has brought down the man who taught him everything. The war still has to be ended, and there is no one left to end it but him.', 'Marshal Yi Liang is waiting in the square before the Church of Saint Sophia.'],
  'moscow/orlov/orion': ['Spring, 2095. Moscow.', 'Rain on the boulevards, and the Pact\'s banners on every building. What is left of the Russian army has fallen back to the Kremlin.', 'General Vladimir Orlov is holding Red Square.'],
  'moscow/orlov/thomas': ['Moscow.', 'Thomas Hawthorne has brought down Orion Mascar, because those were his orders. Now his orders are Moscow.', 'General Vladimir Orlov is holding Red Square.'],
  'london/thomas/orion': ['New London.', 'Orion comes home to the city where it began. Five years ago he and Thomas fought through these streets together.', 'Thomas Hawthorne is holding the cathedral plaza, and he is not answering anyone.'],
  'london/orion/thomas': ['Spring, 2095. New London.', 'The city Orion Mascar freed in 2090 is burning again, and this time he lit the fire. He has taken it for himself.', 'Thomas Hawthorne goes in alone.'],
  'london/josiah/orion': ['Spring, 2095. New London.', 'Orion Mascar and Thomas Hawthorne come home, and turn their weapons on the men who sent them to war.', 'Josiah Williams I, head of British Command, is waiting in the cathedral plaza.'],
};
const TITLE5 = { harbin: 'The Last Fortress', moscow: 'Red Square', london: 'Homecoming' };
window.CH5.open = (p) => OPEN5[p.place + '/' + p.boss + '/' + p.hero];
window.CH5.partDefs = function (S) { const r = CH5.route(S); if (r.parts.length < 2) return null;
  return r.parts.map((p, i) => ({ numeral: i ? 'II' : 'I', title: TITLE5[p.place], place: CH5_PLACE[p.place], prologue: CH5.open(p) })); };

/* the end of the war: what happened to the last enemy, to Orion and Thomas, and to Croxian */
const FINAL5 = {
  'good/good': 'Orion and Thomas came home together. New London rebuilt its cathedral, and carved their names inside it.',
  'good/neutral': 'Thomas stayed in the army and rose through British Command the way Orion never would. Orion went home, and did not leave it again.',
  'good/evil': 'Thomas Hawthorne died in the cathedral plaza where their war began. Orion carried him out himself, and never said a word about it.',
  'neutral/neutral': 'Command had its victory. Orion and Thomas were given medals and a parade, and neither of them went.',
  'neutral/good': 'Thomas stayed in Moscow to help the city bury its dead. Orion went home.',
  'neutral/evil': 'Orion came back from Moscow to fight the boy he had trained, and won. He never spoke of it again.',
  'evil/good': 'Thomas Hawthorne brought down the man who taught him everything, then finished the war in Harbin. When people asked what Orion Mascar had been like, he said: the best of us, once.',
  'evil/neutral': 'Thomas Hawthorne brought down Orion Mascar, then took Moscow, because those were his orders. He never asked for different ones.',
  'evil/evil': 'Josiah Williams I died in the cathedral plaza, and British Command died with him. Orion Mascar and Thomas Hawthorne rule what is left of New London now. Nobody gives them orders.',
};
const LAST5 = { // the defeated general, by the surrender choice
  yi: { good: 'Marshal Yi Liang surrendered the Pact\'s last army and lived to see the peace he had fought against.', neutral: 'Marshal Yi Liang was handed to a tribunal in Geneva, and answered for fifteen years of war.', evil: 'Marshal Yi Liang died on the steps of Saint Sophia. The Pact died with him.' },
  orlov: { good: 'General Vladimir Orlov surrendered Moscow, and the guns across Russia fell silent one by one.', neutral: 'General Vladimir Orlov was handed to a tribunal, and answered for the Kremlin and everything before it.', evil: 'General Vladimir Orlov died on Red Square, under the Kremlin wall.' },
};
window.CH5.ending = function (S) {
  S = S || {}; const r = CH5.route(S), C = S.choices || {}, out = [], last = r.parts[r.parts.length - 1];
  const pick = C.surrender || C.surrender_t;
  if (LAST5[last.boss]) out.push(LAST5[last.boss][pick || 'neutral']);
  out.push(FINAL5[r.key]);
  const fallen = r.o === 'evil' && r.t !== 'evil'; // Orion was brought down by Thomas
  if (S.child === 'born') out.push(fallen ? 'Croxian Mascar grew up with his mother in Seville, carrying his father\'s name and none of his war.'
    : r.key === 'evil/evil' ? 'Croxian Mascar grew up in his father\'s city, the son of the man who ruled it.'
    : 'Croxian Mascar grew up in a country at peace, with his mother\'s temper and his father\'s eyes. Both of them.');
  if (S.ines === 'companion' && !fallen) out.push('Inés Alvarez went home to Seville at last. She never forgave Orion, and she never stayed away for long.');
  out.push('The Third World War ended in the spring of 2095. It had lasted fifteen years.');
  return out;
};

/* the narration after Kaliningrad (and Chapter V's prologue): the war record, Croxian, and where it ends */
window.CH5.narration = function (S) {
  S = S || {}; const C = S.choices || {}, r = CH5.route(S), out = ['Spring, 2095.',
    'Kaliningrad has fallen. The war that began in 2080 is ending, and how it ends has been decided by two men.'];
  if (S.child === 'born') out.push('Behind the lines, Talina Alvarez is raising their son, Croxian Mascar, born on the first night of the siege. His father has held him twice.');
  else if (S.ines === 'companion') out.push('Inés Alvarez still marches with them. She has never said a word about her sister.');
  const o = [];
  if (C.core) o.push(REC.core[C.core]);
  if (S.talina === 'executed') o.push('executed Talina Alvarez at Dover'); else if (S.talina === 'fled') o.push('let Talina Alvarez walk away at Dover');
  if (C.talina3) o.push(REC.talina3[C.talina3]); if (C.ines) o.push(REC.ines[C.ines]);
  if (C.rubble) o.push(REC.rubble[C.rubble]); if (C.garrison) o.push(REC.garrison[C.garrison]);
  if (o.length) out.push('Since the night New London burned, Orion Mascar ' + list(o) + '.');
  if (C.pilot) out.push('Thomas Hawthorne ' + REC.pilot[C.pilot] + ', and followed Orion everywhere else.');
  out.push('The war has made Orion ' + LABEL.o[r.o] + ', and Thomas ' + LABEL.t[r.t] + '.');
  return out.concat(ROUTE_TEXT[r.key]);
};

window.CHAPTERS = [
  {
    id: 1, numeral: 'I', title: 'The Siege of New London', place: 'New London', date: 'November 2090',
    available: true,
    summary: 'Shot down short of the line, Commander Orion Mascar and his apprentice Thomas Hawthorne must fight through the burning ruins of London, light the signal beacons, and destroy the Iron Warden in the cathedral plaza.',
    objective: 'Destroy the Iron Warden',
    // first-person memory narrated by Orion before the chapter begins
    opening: {
      year: '2069 AD',
      // narration recordings, one per line: [file, seconds]
      voice: [['voice/intro1.mp3', 4.6], ['voice/intro2.mp3', 8.9], ['voice/intro3.mp3', 9.3], ['voice/intro4.mp3', 7.1], ['voice/intro5.mp3', 8.2], ['voice/intro6.mp3', 6.1]],
      lines: [
        'I was born in London, in the spring of 2069.',
        'I don\'t remember it, of course. Nobody does. But sometimes, in the quiet before a battle, I think I can.',
        'A blur of white light. Warm hands. Voices I couldn\'t understand yet — soft, and tired, and happy.',
        'Somewhere beyond the window, the city was still whole. Still lit. Still breathing.',
        'My mother used to say I didn\'t cry. I just opened my eyes and stared at the light, as if I was waiting for something.',
        'Eleven years later, the war came. I think it had been waiting for me too.',
      ],
    },
    prologue: ['November, 2090.',
  'For ten years the Third World War has burned. Since 2080, the United States has fought the combined might of China and Russia — across every continent, every sea, every sky.',
  'Britain stood with America. When the war machines of the Sino-Russian Pact crossed the Channel, London fell in a single night. What remains is called New London — a ruin lit only by fire.',
  'British Command sent its youngest commander to break the siege: Orion Mascar. Born in 2069, he is twenty-one years old, and has never known a world at peace.',
  'At his side marched his apprentice, Thomas Hawthorne, born in 2074. Their dropship never reached the line.',
  'Now only the two of them remain. Between them and the dawn stands the Iron Warden.'],
  },
  {
    id: 2, numeral: 'II', title: 'Ashes of Dover', place: 'Dover', date: 'December 2090',
    available: true,
    summary: 'Orion climbs alone to Dover Castle to face the traitor Talina Alvarez. Then Thomas, alone, must break the Pact beachhead below and destroy the Tidebreaker.',
    objective: 'Break the Pact beachhead at Dover',
    parts: [
      { numeral: 'I', title: 'The Traitor', place: 'Dover Castle', vo: [1, 2, 3, 4, 5],
        prologue: ['December, 2090.',
          'New London is free. For the first time in ten years, the Pact is falling back — but not far.',
          'Beneath the white cliffs of Dover, the Sino-Russian landing fleet holds a beachhead. While it stands, no American ship can reach England.',
          'Thomas Hawthorne goes down to the beach with the assault force. Orion Mascar goes up, alone — to Dover Castle, where the Pact\'s spotters direct the fleet\'s guns.',
          'The castle garrison answers to Talina Alvarez: born in Seville, raised in London, once one of British Command\'s finest. Now she fights for the Pact.'] },
      { numeral: 'II', title: 'The Apprentice', place: 'Dover Beach', vo: [45, 46, 47],
        prologue: ['Orion Mascar was carried off the clifftop alive. He will not fight again this winter.',
          'The Tidebreaker still holds the beach, and the assault force is pinned beneath the cliffs.',
          'Thomas Hawthorne, sixteen years old, goes down to the shingle alone.'] },
    ],
    prologue: [],
  },
  // Chapters III–V: story outlines and dialogue choices are written; levels to come
  { id: 3, numeral: 'III', title: 'Iron Tide', place: 'Normandy', date: 'June 2091', available: true,
    summary: 'The Allies cross the Channel the other way. Orion, one eye fewer, and Thomas fight alongside American armour through the bocage, where the Pact\'s war machines dig in, and someone from Dover is waiting.',
    objective: 'Take the church square',
    prologue: (S) => ['June, 2091.',
      'Six months after Dover, the Allies cross the Channel the other way. American armour rolls ashore on the beaches of Normandy, where another army landed a century and a half before.',
      'Commander Orion Mascar is back in the field, one eye fewer. Thomas Hawthorne, seventeen now, has not left his side.',
      S && S.talina === 'executed'
        ? 'Inland, in the hedgerows of the bocage, the Pact has dug in its war machines. And someone is hunting the man who killed Talina Alvarez.'
        : 'Inland, in the hedgerows of the bocage, the Pact has dug in its war machines. And British Command has word of a sabre in the dark: Talina Alvarez is in Normandy.'] },
  { id: 4, numeral: 'IV', title: 'The Siege of Kaliningrad', place: 'Kaliningrad', date: 'Winter 2094', available: true,
    summary: 'The front pushes east into the frozen Russian enclave. In the old Königsberg, under snow and fire, the Pact makes its stand around the House of Soviets, guarded by the war machine its soldiers call the Bear.',
    objective: 'Destroy the Bear',
    /* two parts only if Talina is alive and at Orion's side (saved at Normandy): Part I is the night their child is born */
    get parts() { const S = window.GM && GM.save && GM.save.started ? GM.save : window.GM && GM.baseSave ? GM.baseSave() : null; return GM.labour && GM.labour(S) ? CH4_PARTS : null; },
    epilogue: (S) => CH5.narration(S), epilogueHead: ['AFTER KALININGRAD', 'Spring 2095'], // after the Bear falls: the war record, and where it ends
    prologue: (S) => ['Winter, 2094.',
      'Three years after Normandy, the war has moved east. The Allies have driven the Pact back across Europe, to its last foothold on the Baltic: Kaliningrad, the old Königsberg.',
      S && S.ines === 'companion' ? 'Inés Alvarez marches with Orion and Thomas now. She has still not said a word about her sister.'
        : S && S.talina3 === 'command' ? 'Talina Alvarez is in a British cell. Orion has not visited her.' : 'Orion Mascar is twenty-five. Thomas Hawthorne is twenty. Neither of them remembers peace.',
      'In the heart of the city, before the House of Soviets, the Pact\'s last war machine holds the square.'] },
  /* Chapter V: the place, the bosses and who you play depend on Orion's and Thomas's alignment after Kaliningrad (see CH5 above) */
  { id: 5, numeral: 'V', title: 'Under One Banner', date: 'Spring 2095', available: true,
    objective: 'End the war',
    get parts() { const S = window.GM && GM.save && GM.save.started ? GM.save : window.GM && GM.baseSave ? GM.baseSave() : null; return CH5.partDefs(S); },
    epilogue: (S) => CH5.ending(S), epilogueHead: ['THE END OF THE WAR', 'Spring 2095'],
    get place() { const S = window.GM && GM.baseSave ? GM.baseSave() : null; return CH5.route(S).parts.map((p) => CH5.PLACE[p.place]).join(' · '); },
    get summary() { const S = window.GM && GM.baseSave ? GM.baseSave() : null; return 'Fifteen years of war come down to one battle, and your choices decide where it is fought. ' + CH5.summary(S) + '.'; },
    prologue: (S) => CH5.open(CH5.route(S).parts[0]) },
];
