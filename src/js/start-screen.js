import { STATIONS } from '../data/stations.js';
import { getCharacterAsset } from './assets.js';

export function renderStartScreen(app) {
  const idleAsset = getCharacterAsset('idle');
  const stationsMarkup = STATIONS.map((station) => {
    const isCurrent = station.status === 'current';
    return `
      <li class="station${isCurrent ? ' station--current' : ' station--locked'}"
          ${isCurrent ? 'aria-current="step"' : 'aria-disabled="true"'}>
        <span class="station__number" aria-hidden="true">${station.order}</span>
        <span class="station__name">${station.nameAr}</span>
        ${isCurrent ? '' : '<span class="station__lock" aria-hidden="true">مقفولة</span>'}
      </li>`;
  }).join('');

  app.innerHTML = `
    <div class="app-shell">
      <header class="page-header">
        <h1 class="page-title">نطّط يونس</h1>
      </header>
      <main class="start-layout">
        <section class="character-zone" aria-label="يونس">
          <div class="character-frame">
            <img class="character-image" src="${idleAsset ?? ''}" alt="يونس" />
            <p class="character-fallback" hidden></p>
          </div>
        </section>
        <section class="action-zone" aria-label="بدء الرحلة">
          <button class="start-button" type="button">يلا ننط</button>
        </section>
        <aside class="journey-zone" aria-labelledby="journey-title">
          <h2 class="journey-title" id="journey-title">رحلتنا</h2>
          <ol class="journey-list">${stationsMarkup}</ol>
        </aside>
      </main>
    </div>`;

  const image = app.querySelector('.character-image');
  const fallback = app.querySelector('.character-fallback');
  const button = app.querySelector('.start-button');
  let idleTimer;

  function showMissingAsset(key) {
    image.hidden = true;
    if (import.meta.env.DEV) {
      fallback.textContent = `الصورة غير متوفرة بعد: ${key}`;
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

  function startJourney() {
    setCharacterState('happy', true);
    idleTimer = window.setTimeout(() => setCharacterState('idle'), 1500);
  }

  button.addEventListener('click', startJourney);
  document.addEventListener('keydown', (event) => {
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
  });
}
