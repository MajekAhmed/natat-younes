import { CHARACTER } from '../data/characters.js';
import { WORD_API_MAP } from '../data/word-api.js';

export function getCharacterAsset(key) {
  if (!key) return null;
  const file = CHARACTER.assets[key];
  if (!file) return null;

  return `${import.meta.env.BASE_URL}${CHARACTER.basePath}${file}`;
}

export function getStationBackground(station) {
  if (!station || !station.background) return null;
  return `${import.meta.env.BASE_URL}assets/images/${station.background}`;
}

export function getStartBackground() {
  return `${import.meta.env.BASE_URL}assets/images/backgrounds/start-bg.webp`;
}

export function getWordImage(letter) {
  if (!letter || !letter.word || !letter.word.image) return null;
  return `${import.meta.env.BASE_URL}assets/images/${letter.word.image}`;
}

export function getWordApiFallback(letter) {
  if (!letter || !letter.id) return null;
  return WORD_API_MAP[letter.id] || null;
}

export function getLetterAudio(letter, key) {
  if (!letter || !letter.audio || !letter.audio[key]) return null;
  return `${import.meta.env.BASE_URL}assets/audio/${letter.audio[key]}`;
}

export function getLetterCharacterFile(letter, key) {
  if (letter && letter.character && letter.character[key]) {
    return `${import.meta.env.BASE_URL}${CHARACTER.basePath}${letter.character[key]}`;
  }
  if (key === 'thinking') {
    return getCharacterAsset('thinking');
  }
  return null;
}
