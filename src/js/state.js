import { renderStartScreen } from './start-screen.js';
import { renderMissionScreen } from './mission.js';
import { renderCompletionScreen } from './completion-screen.js';

let appRoot = null;
let currentScreen = 'start';
let currentParams = {};

export function initRouter(appElement) {
  appRoot = appElement;
  navigate('start');
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
}

export function getCurrentScreen() {
  return { screen: currentScreen, params: currentParams };
}
