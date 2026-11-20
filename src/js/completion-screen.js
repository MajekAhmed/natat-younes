import { STRINGS_AR } from '../data/strings.ar.js';
import { getCharacterAsset } from './assets.js';
import { resetProgress } from './progress.js';
import { navigate } from './state.js';
import { isMuted, toggleMute, onMuteChange } from './audio.js';

const ICONS = {
  soundOn: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
  soundMuted: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
  star: `<svg width="72" height="72" viewBox="0 0 24 24" fill="#f2bd55" stroke="#b57a1f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
};

export function renderCompletionScreen(app) {
  const happyAsset = getCharacterAsset('happy');
  let unsubMute = null;

  app.innerHTML = `
    <div class="app-shell completion-screen">
      <header class="completion-header">
        <button class="nav-button mute-button" type="button" aria-label="${isMuted() ? STRINGS_AR.unmuteAudio : STRINGS_AR.muteAudio}">
          <span class="mute-button__icon">${isMuted() ? ICONS.soundMuted : ICONS.soundOn}</span>
        </button>
      </header>

      <main class="completion-layout">
        <section class="character-zone" aria-label="${STRINGS_AR.characterAriaLabel}">
          <div class="character-frame">
            <img class="character-image character-image--bouncing" src="${happyAsset ?? ''}" alt="${STRINGS_AR.characterAriaLabel}" />
            <p class="character-fallback" hidden></p>
          </div>
        </section>

        <section class="completion-content-zone">
          <div class="completion-card">
            <div class="completion-star">${ICONS.star}</div>
            <h1 class="completion-title">${STRINGS_AR.completionTitle}</h1>
            <p class="completion-message">${STRINGS_AR.completionMessage}</p>

            <div class="completion-actions">
              <button class="primary-action-btn completion-home-btn" type="button">
                ${STRINGS_AR.home}
              </button>
              <button class="reset-link-btn" type="button">
                ${STRINGS_AR.restart}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>`;

  const charImage = app.querySelector('.character-image');
  const charFallback = app.querySelector('.character-fallback');
  const homeBtn = app.querySelector('.completion-home-btn');
  const resetBtn = app.querySelector('.reset-link-btn');
  const muteBtn = app.querySelector('.mute-button');

  charImage.addEventListener('error', () => {
    charImage.hidden = true;
    if (import.meta.env.DEV) {
      charFallback.textContent = STRINGS_AR.missingAssetDev('happy');
      charFallback.hidden = false;
    }
  });

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

  homeBtn.addEventListener('click', () => {
    if (unsubMute) unsubMute();
    navigate('start');
  });

  resetBtn.addEventListener('click', () => {
    if (window.confirm(STRINGS_AR.confirmReset)) {
      resetProgress();
      if (unsubMute) unsubMute();
      navigate('start');
    }
  });
}
