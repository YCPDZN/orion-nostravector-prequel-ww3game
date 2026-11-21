/* Chapters — each entry is one mission of ORION: The Third World War.
   To add a chapter: append an entry with available: true and give it a level / spawns in a later update. */
window.CHAPTERS = [
  {
    id: 1, numeral: 'I', title: 'The Siege of New London', place: 'New London', date: 'November 2090',
    available: true,
    summary: 'Shot down short of the line, Commander Orion Mascar and his apprentice Thomas Hawthorne must fight through the burning ruins of London, light the signal beacons, and destroy the Iron Warden in the cathedral plaza.',
    objective: 'Destroy the Iron Warden',
    prologue: ['November, 2090.',
  'For ten years the Third World War has burned. Since 2080, the United States has fought the combined might of China and Russia — across every continent, every sea, every sky.',
  'Britain stood with America. When the war machines of the Sino-Russian Pact crossed the Channel, London fell in a single night. What remains is called New London — a ruin lit only by fire.',
  'British Command sent its youngest commander to break the siege: Orion Mascar. Born in 2069, he is twenty-one years old, and has never known a world at peace.',
  'At his side marched his apprentice, Thomas Hawthorne, born in 2074. Their dropship never reached the line.',
  'Now only the two of them remain. Between them and the dawn stands the Iron Warden.'],
  },
  {
    id: 2, numeral: 'II', title: 'Classified', available: false,
    summary: 'British Command has not yet issued your next orders.',
  },
];
