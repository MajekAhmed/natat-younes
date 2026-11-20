export const LETTERS = [
  {
    id: 'A',
    upper: 'A',
    lower: 'a',
    stationId: 1,
    word: { en: 'Apple', ar: 'تفاحة', image: 'words/apple.svg' }, // relative to public/assets/images/
    ipa: { name: '/eɪ/', sound: '/æ/' }, // documentation only; NEVER shown on screen
    audio: {
      letterName: 'letters/a-name.mp3',
      letterSound: 'letters/a-sound.mp3',
      word: 'words/apple.mp3',
    }, // relative to public/assets/audio/ ; extensions are placeholders; files may not exist yet
    distractors: ['M', 'O'],
    character: {
      victoryVideo: 'victory/victory-a.mp4',
      thinking: 'thinking/thinking-a.webp',
    }, // relative to public/characters/younes/ ; both optional
  },
];
