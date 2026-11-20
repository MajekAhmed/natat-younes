import { CHARACTER } from '../data/characters.js';

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

export function getWordImage(letter) {
  if (!letter || !letter.word || !letter.word.image) return null;
  return `${import.meta.env.BASE_URL}assets/images/${letter.word.image}`;
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
