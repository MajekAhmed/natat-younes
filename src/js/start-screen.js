import { STATIONS } from '../data/stations.js';
import { LETTERS } from '../data/letters.js';
import { STRINGS_AR } from '../data/strings.ar.js';
import { getCharacterAsset, getStartBackground } from './assets.js';
import { getNextLetter, isCompleted } from './progress.js';
import { navigate } from './state.js';
import { isMuted, toggleMute, onMuteChange } from './audio.js';

const ICONS = {
  soundOn: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
  soundMuted: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
};

export function renderStartScreen(app) {
  const idleAsset = getCharacterAsset('idle');
  const nextLetter = getNextLetter();
  const currentStationId = nextLetter ? nextLetter.stationId : STATIONS[STATIONS.length - 1].id;

  const stationsMarkup = STATIONS.map((station) => {
    const lettersOfStation = LETTERS.filter((l) => l.stationId === station.id);
    const isStationCompleted =
      lettersOfStation.length > 0 && lettersOfStation.every((l) => isCompleted(l.id));
    const isCurrent = station.id === currentStationId && !isStationCompleted;

    return `
      <li class="station${isCurrent ? ' station--current' : isStationCompleted ? ' station--completed' : ' station--locked'}${isStationCompleted ? ' station--has-star' : ''}"
          ${isCurrent ? 'aria-current="step"' : isStationCompleted ? '' : 'aria-disabled="true"'}>
        <span class="station__number" aria-hidden="true">${station.order}</span>
        <span class="station__name">${station.nameAr}</span>
        ${
          isStationCompleted
            ? `<span class="station__star" aria-label="${STRINGS_AR.completedStation}">⭐</span>`
            : isCurrent
              ? ''
              : `<span class="station__lock" aria-hidden="true">${STRINGS_AR.lockedStation}</span>`
        }
      </li>`;
  }).join('');

  app.innerHTML = `
    <div class="app-shell">
      <header class="page-header">
        <button class="nav-button mute-button start-mute-button" type="button" aria-label="${isMuted() ? STRINGS_AR.unmuteAudio : STRINGS_AR.muteAudio}">
          <span class="mute-button__icon">${isMuted() ? ICONS.soundMuted : ICONS.soundOn}</span>
        </button>
        <h1 class="page-title">${STRINGS_AR.appTitle}</h1>
      </header>
      <main class="start-layout">
        <section class="character-zone" aria-label="${STRINGS_AR.characterAriaLabel}">
          <div class="character-frame">
            <img class="character-image" src="${idleAsset ?? ''}" alt="${STRINGS_AR.characterAriaLabel}" />
            <p class="character-fallback" hidden></p>
          </div>
        </section>
        <section class="action-zone" aria-label="${STRINGS_AR.startJourney}">
          <button class="start-button" type="button">${STRINGS_AR.startJourney}</button>
        </section>
        <aside class="journey-zone" aria-labelledby="journey-title">
          <h2 class="journey-title" id="journey-title">${STRINGS_AR.journeyTitle}</h2>
          <ol class="journey-list">${stationsMarkup}</ol>
        </aside>
      </main>
    </div>`;

  const image = app.querySelector('.character-image');
  const fallback = app.querySelector('.character-fallback');
  const button = app.querySelector('.start-button');
  const muteBtn = app.querySelector('.mute-button');
  let idleTimer;
  let unsubMute;

  // Background fallback handling for start screen
  const startBg = getStartBackground();
  if (startBg) {
    const testBg = new Image();
    testBg.onload = () => {
      const shell = app.querySelector('.app-shell');
      if (shell) {
        shell.style.setProperty('--start-background-image', `url('${startBg}')`);
      }
    };
    testBg.src = startBg;
  }

  function updateMuteState() {
    const muted = isMuted();
    muteBtn.setAttribute('aria-label', muted ? STRINGS_AR.unmuteAudio : STRINGS_AR.muteAudio);
    const iconSpan = muteBtn.querySelector('.mute-button__icon');
    if (iconSpan) {
      iconSpan.innerHTML = muted ? ICONS.soundMuted : ICONS.soundOn;
    }
  }

  muteBtn.addEventListener('click', () => {
    toggleMute();
    updateMuteState();
  });
  unsubMute = onMuteChange(updateMuteState);

  function showMissingAsset(key) {
    image.hidden = true;
    if (import.meta.env.DEV) {
      fallback.textContent = STRINGS_AR.missingAssetDev(key);
      fallback.hidden = false;
    }
  }

  function setCharacterState(key, bounce = false) {
    window.clearTimeout(idleTimer);
    const asset = getCharacterAsset(key);
    fallback.hidden = true;

    if (!asset) {
      showMissingAsset(key);
      return;
    }

    image.hidden = false;
    image.dataset.assetKey = key;
    image.src = asset;
    image.classList.remove('character-image--bouncing');

    if (bounce) {
      requestAnimationFrame(() => image.classList.add('character-image--bouncing'));
    }
  }

  image.addEventListener('error', () => {
    showMissingAsset(image.dataset.assetKey ?? 'idle');
  });

  function cleanup() {
    window.clearTimeout(idleTimer);
    document.removeEventListener('keydown', onKeyDown);
    if (unsubMute) unsubMute();
  }

  function startJourney() {
    const nextLetter = getNextLetter();
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    setCharacterState('happy', true);

    const doNavigate = () => {
      cleanup();
      if (nextLetter) {
        navigate('mission', { letterId: nextLetter.id });
      } else {
        navigate('completion');
      }
    };

    if (prefersReducedMotion) {
      doNavigate();
    } else {
      idleTimer = window.setTimeout(doNavigate, 500); // <= 600 ms
    }
  }

  button.addEventListener('click', startJourney);

  function onKeyDown(event) {
    if (event.key !== 'Enter' || event.defaultPrevented) return;

    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement !== document.body &&
      activeElement !== document.documentElement &&
      activeElement.matches('button, a, input, select, textarea, [contenteditable="true"]')
    ) {
      return;
    }

    event.preventDefault();
    startJourney();
  }

  document.addEventListener('keydown', onKeyDown);
}
