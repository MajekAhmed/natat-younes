import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LETTERS } from '../src/data/letters.js';
import { STATIONS } from '../src/data/stations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const assetsImagesDir = path.join(publicDir, 'assets', 'images');
const assetsAudioDir = path.join(publicDir, 'assets', 'audio');
const younesDir = path.join(publicDir, 'characters', 'younes');

const errors = [];
const warnings = [];

function validatePathString(field, val, context) {
  if (typeof val !== 'string') {
    errors.push(`${context}: "${field}" must be a string.`);
    return false;
  }
  if (path.isAbsolute(val) || val.startsWith('/') || val.startsWith('\\')) {
    errors.push(`${context}: "${field}" must be a relative path, got "${val}".`);
    return false;
  }
  if (val.includes('..')) {
    errors.push(`${context}: "${field}" path traversal ("..") is not allowed, got "${val}".`);
    return false;
  }
  return true;
}

// 1. Validate STATIONS
if (!Array.isArray(STATIONS) || STATIONS.length === 0) {
  errors.push('STATIONS must be a non-empty array.');
} else {
  const stationIds = new Set();
  for (const station of STATIONS) {
    const ctx = `Station ${station?.id ?? 'unknown'}`;
    if (typeof station.id !== 'number') {
      errors.push(`${ctx}: "id" must be a number.`);
    } else if (stationIds.has(station.id)) {
      errors.push(`${ctx}: duplicate station id "${station.id}".`);
    } else {
      stationIds.add(station.id);
    }

    if (!station.nameAr || typeof station.nameAr !== 'string') {
      errors.push(`${ctx}: "nameAr" is required.`);
    }
    if (typeof station.order !== 'number') {
      errors.push(`${ctx}: "order" must be a number.`);
    }
    if (!station.status || typeof station.status !== 'string') {
      errors.push(`${ctx}: "status" is required.`);
    }

    if (station.background !== null && station.background !== undefined) {
      if (validatePathString('background', station.background, ctx)) {
        const fullPath = path.join(assetsImagesDir, station.background);
        if (!fs.existsSync(fullPath)) {
          warnings.push(`Missing optional station background: ${station.background} (${ctx})`);
        }
      }
    }
  }
}

// 2. Validate LETTERS
if (!Array.isArray(LETTERS) || LETTERS.length === 0) {
  errors.push('LETTERS must be a non-empty array.');
} else {
  const letterIds = new Set();
  const stationIdSet = new Set(STATIONS.map((s) => s.id));

  for (const letter of LETTERS) {
    const ctx = `Letter ${letter?.id ?? 'unknown'}`;

    if (!letter.id || typeof letter.id !== 'string') {
      errors.push(`${ctx}: "id" must be a non-empty string.`);
    } else if (letterIds.has(letter.id)) {
      errors.push(`${ctx}: duplicate letter id "${letter.id}".`);
    } else {
      letterIds.add(letter.id);
    }

    // Upper and lower checks
    if (!letter.upper || typeof letter.upper !== 'string' || !/^[A-Z]$/.test(letter.upper)) {
      errors.push(`${ctx}: "upper" must be a single uppercase letter A-Z.`);
    }
    if (!letter.lower || typeof letter.lower !== 'string' || !/^[a-z]$/.test(letter.lower)) {
      errors.push(`${ctx}: "lower" must be a single lowercase letter a-z.`);
    }

    if (
      letter.upper &&
      letter.lower &&
      (letter.upper.toLowerCase() !== letter.lower || letter.lower.toUpperCase() !== letter.upper)
    ) {
      errors.push(`${ctx}: "upper" ('${letter.upper}') and "lower" ('${letter.lower}') do not match.`);
    }
    if (letter.id && letter.upper && letter.id !== letter.upper) {
      errors.push(`${ctx}: "id" ('${letter.id}') must match "upper" ('${letter.upper}').`);
    }

    // Station relation
    if (typeof letter.stationId !== 'number' || !stationIdSet.has(letter.stationId)) {
      errors.push(`${ctx}: "stationId" (${letter.stationId}) does not exist in STATIONS.`);
    }

    // Distractors
    if (!Array.isArray(letter.distractors) || letter.distractors.length !== 2) {
      errors.push(`${ctx}: "distractors" must be an array of exactly 2 items.`);
    } else {
      const [d1, d2] = letter.distractors;
      if (!/^[A-Z]$/.test(d1) || !/^[A-Z]$/.test(d2)) {
        errors.push(`${ctx}: distractors must both be single uppercase letters A-Z.`);
      }
      if (d1 === letter.upper || d2 === letter.upper) {
        errors.push(`${ctx}: distractors must never include the target letter ('${letter.upper}').`);
      }
      if (d1 === d2) {
        errors.push(`${ctx}: distractors must be distinct from each other ('${d1}' == '${d2}').`);
      }
    }

    // Word
    if (!letter.word || typeof letter.word !== 'object') {
      errors.push(`${ctx}: "word" must be an object.`);
    } else {
      if (!letter.word.en || typeof letter.word.en !== 'string') {
        errors.push(`${ctx}: "word.en" is required.`);
      }
      if (!letter.word.ar || typeof letter.word.ar !== 'string') {
        errors.push(`${ctx}: "word.ar" is required.`);
      }
      if (!letter.word.image || typeof letter.word.image !== 'string') {
        errors.push(`${ctx}: "word.image" is required.`);
      } else if (validatePathString('word.image', letter.word.image, ctx)) {
        const fullPath = path.join(assetsImagesDir, letter.word.image);
        if (!fs.existsSync(fullPath)) {
          warnings.push(`Missing optional word image: ${letter.word.image} (${ctx})`);
        }
      }
    }

    // IPA (documentation only)
    if (!letter.ipa || typeof letter.ipa !== 'object') {
      errors.push(`${ctx}: "ipa" must be an object.`);
    } else {
      if (!letter.ipa.name || typeof letter.ipa.name !== 'string') {
        errors.push(`${ctx}: "ipa.name" is required.`);
      }
      if (!letter.ipa.sound || typeof letter.ipa.sound !== 'string') {
        errors.push(`${ctx}: "ipa.sound" is required.`);
      }
    }

    // Audio
    if (!letter.audio || typeof letter.audio !== 'object') {
      errors.push(`${ctx}: "audio" must be an object.`);
    } else {
      const audioKeys = ['letterName', 'letterSound', 'word'];
      for (const k of audioKeys) {
        const val = letter.audio[k];
        if (!val || typeof val !== 'string') {
          errors.push(`${ctx}: "audio.${k}" is required.`);
        } else if (validatePathString(`audio.${k}`, val, ctx)) {
          const fullPath = path.join(assetsAudioDir, val);
          if (!fs.existsSync(fullPath)) {
            warnings.push(`Missing optional audio file: ${val} (${ctx})`);
          }
        }
      }
    }

    // Character
    if (!letter.character || typeof letter.character !== 'object') {
      errors.push(`${ctx}: "character" must be an object.`);
    } else {
      if (letter.character.victoryVideo !== null && letter.character.victoryVideo !== undefined) {
        if (validatePathString('character.victoryVideo', letter.character.victoryVideo, ctx)) {
          const fullPath = path.join(younesDir, letter.character.victoryVideo);
          if (!fs.existsSync(fullPath)) {
            warnings.push(`Missing optional victory video: ${letter.character.victoryVideo} (${ctx})`);
          }
        }
      }
      if (letter.character.thinking !== null && letter.character.thinking !== undefined) {
        if (validatePathString('character.thinking', letter.character.thinking, ctx)) {
          const fullPath = path.join(younesDir, letter.character.thinking);
          if (!fs.existsSync(fullPath)) {
            warnings.push(`Missing optional thinking image: ${letter.character.thinking} (${ctx})`);
          }
        }
      }
    }
  }
}

// Print results
console.log('--- Data Validation Report ---');
if (warnings.length > 0) {
  console.log(`[WARNINGS] (${warnings.length} optional assets not yet present on disk):`);
  for (const w of warnings) {
    console.log(`  - ${w}`);
  }
}

if (errors.length > 0) {
  console.error(`\n[ERRORS] Validation failed with ${errors.length} error(s):`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
} else {
  console.log(`\n[SUCCESS] All ${LETTERS.length} letter(s) and ${STATIONS.length} station(s) validated successfully!`);
  process.exit(0);
}
