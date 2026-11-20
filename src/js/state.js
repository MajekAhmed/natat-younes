import { renderStartScreen } from './start-screen.js';
import { renderMissionScreen } from './mission.js';
import { renderCompletionScreen } from './completion-screen.js';

let appRoot = null;
let currentScreen = 'start';
let currentParams = {};

// Programmatic navigation updates the hash; this flag prevents the
// resulting hashchange event from re-rendering the same screen twice.
let suppressHashChange = false;

function toHash(screenName, params) {
  if (screenName === 'mission' && params.letterId) {
    return `#/letter/${encodeURIComponent(params.letterId)}`;
  }
  if (screenName === 'completion') {
    return '#/done';
  }
  return '#/';
}

function applyHash(hash) {
  const letterMatch = hash.match(/^#\/letter\/([A-Za-z])$/i);
  if (letterMatch) {
    navigate('mission', { letterId: letterMatch[1].toUpperCase() });
  } else if (hash === '#/done') {
    navigate('completion');
  } else {
    navigate('start');
  }
}

export function initRouter(appElement) {
  appRoot = appElement;
  applyHash(window.location.hash || '#/');

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      if (suppressHashChange) {
        suppressHashChange = false;
        return;
      }
      applyHash(window.location.hash || '#/');
    });
  }
}

export function navigate(screenName, params = {}) {
  currentScreen = screenName;
  currentParams = params;

  if (!appRoot) return;

  if (screenName === 'start') {
    renderStartScreen(appRoot);
  } else if (screenName === 'mission') {
    renderMissionScreen(appRoot, params.letterId);
  } else if (screenName === 'completion') {
    renderCompletionScreen(appRoot);
  }

  const targetHash = toHash(screenName, params);
  if (typeof window !== 'undefined' && window.location.hash !== targetHash) {
    suppressHashChange = true;
    window.location.hash = targetHash;
  }
}

export function getCurrentScreen() {
  return { screen: currentScreen, params: currentParams };
}
