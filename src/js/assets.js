import { CHARACTER } from '../data/characters.js';

export function getCharacterAsset(key) {
  const file = CHARACTER.assets[key];
  if (!file) return null;

  return `${import.meta.env.BASE_URL}${CHARACTER.basePath}${file}`;
}
