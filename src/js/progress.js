import { LETTERS } from '../data/letters.js';

const STORAGE_KEY = 'natat-younes:progress:v1';

let memoryProgress = { completed: [] };

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.completed)) {
        memoryProgress = { completed: [...parsed.completed] };
        return;
      }
    }
  } catch {
    // Keep in-memory fallback
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryProgress));
  } catch {
    // Keep in-memory fallback
  }
}

loadProgress();

export function getCompleted() {
  return [...memoryProgress.completed];
}

export function isCompleted(id) {
  return memoryProgress.completed.includes(id);
}

export function markCompleted(id) {
  if (!id) return;
  if (!memoryProgress.completed.includes(id)) {
    memoryProgress.completed.push(id);
    saveProgress();
  }
}

export function getNextLetter() {
  return LETTERS.find((letter) => !memoryProgress.completed.includes(letter.id)) || null;
}

export function resetProgress() {
  memoryProgress = { completed: [] };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Keep in-memory fallback
  }
}
