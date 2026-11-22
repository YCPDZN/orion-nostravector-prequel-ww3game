/* Chapters — each entry is one mission of ORION: The Third World War.
   To add a chapter: append an entry with available: true and give it a level / spawns in a later update. */
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
    summary: 'With the Warden gone, British Command sends Orion and Thomas to the white cliffs to break the Pact beachhead, so American reinforcements can finally land.',
    objective: 'Destroy the Tidebreaker',
    prologue: ['December, 2090.',
  'New London is free. For the first time in ten years, the Pact is falling back — but not far.',
  'Beneath the white cliffs of Dover, the Sino-Russian landing fleet still holds a beachhead. While it stands, no American ship can reach England.',
  'British Command sends the only two soldiers who have ever brought down one of the Pact\'s great machines.',
  'Commander Orion Mascar, twenty-one. His apprentice, Thomas Hawthorne, sixteen.',
  'On the shingle below the cliffs, the Tidebreaker is waiting.'],
  },
  // Chapters III–V: story outlines and dialogue choices are written; levels to come
  { id: 3, numeral: 'III', title: 'Iron Tide', place: 'Normandy', date: 'February 2091', available: false,
    summary: 'The Allies cross the Channel the other way. Orion and Thomas fight alongside American armour through the bocage, where the Pact\'s war machines dig in.' },
  { id: 4, numeral: 'IV', title: 'Winter of the Bear', place: 'Kaliningrad', date: 'March 2091', available: false,
    summary: 'The front pushes east into the frozen Russian enclave. In a city of snow and ruins, the Pact makes its stand — and the people caught between the armies pay for it.' },
  { id: 5, numeral: 'V', title: 'Under One Banner', place: 'Harbin', date: 'Summer 2091', available: false,
    summary: 'Where the Red Sun and the Bear first united, the Sino-Russian Pact holds its last fortress. Ten years of war come down to one decision.' },
];
