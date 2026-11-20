import { LETTERS } from '../data/letters.js';
import { STATIONS } from '../data/stations.js';
import { STRINGS_AR } from '../data/strings.ar.js';
import {
  getCharacterAsset,
  getStationBackground,
  getWordImage,
  getWordApiFallback,
  getLetterAudio,
  getLetterCharacterFile,
} from './assets.js';
import {
  playFile,
  playCorrectSound,
  playWrongSound,
  isMuted,
  toggleMute,
  onMuteChange,
  checkAudioAvailable,
  speak,
  stopSpeaking,
} from './audio.js';
import { markCompleted, getNextLetter } from './progress.js';
import { navigate } from './state.js';
import { triggerCelebration } from './confetti.js';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ICONS = {
  soundOn: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
  soundMuted: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
  home: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  arrowRight: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  audioWave: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
  star: `<svg width="64" height="64" viewBox="0 0 24 24" fill="#f2bd55" stroke="#b57a1f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
};

export function renderMissionScreen(app, letterId) {
  const letter = LETTERS.find((item) => item.id === letterId);
  if (!letter) {
    navigate('start');
    return;
  }

  const currentIndex = LETTERS.findIndex((item) => item.id === letterId);
  const prevLetter = currentIndex > 0 ? LETTERS[currentIndex - 1] : null;
  const nextLetter = currentIndex < LETTERS.length - 1 ? LETTERS[currentIndex + 1] : null;

  const station = STATIONS.find((s) => s.id === letter.stationId);
  const stationBg = getStationBackground(station);
  const wordImgUrl = getWordImage(letter);

  let phase = 'CHOOSE'; // 'CHOOSE' | 'RESULT'
  let preparedVideoEl = null;
  let activeKeyHandler = null;
  let thinkingTimer = null;
  let victoryTimer = null;
  let introTimer = null;
  let assistTimer = null;
  let wrongCount = 0;
  let unsubMute = null;

  app.innerHTML = `
    <div class="app-shell mission-screen">
      <div class="mission-screen__bg" ${stationBg ? `style="background-image: url('${stationBg}');"` : ''}></div>
      <div class="mission-screen__overlay"></div>

      <header class="mission-header">
        <div class="mission-header__actions">
          <button class="nav-button home-button" type="button" aria-label="${STRINGS_AR.returnHome}">
            ${ICONS.home}
            <span class="nav-button__text">${STRINGS_AR.home}</span>
          </button>
          ${
            prevLetter
              ? `<button class="nav-button prev-button" type="button" aria-label="${STRINGS_AR.previousStage}">
                   ${ICONS.arrowRight}
                   <span class="nav-button__text">${STRINGS_AR.previousStage}</span>
                 </button>`
              : ''
          }
        </div>
        <div class="mission-station-badge" aria-label="${station ? station.nameAr : ''}">
          <span class="mission-station-badge__order">${station ? station.order : ''}</span>
          <span class="mission-station-badge__name">${station ? station.nameAr : ''}</span>
          <span class="mission-station-badge__count">(${currentIndex + 1}/${LETTERS.length})</span>
        </div>
        <button class="nav-button mute-button" type="button" aria-label="${isMuted() ? STRINGS_AR.unmuteAudio : STRINGS_AR.muteAudio}">
          <span class="mute-button__icon">${isMuted() ? ICONS.soundMuted : ICONS.soundOn}</span>
        </button>
      </header>

      <main class="mission-layout">
        <!-- Younes Hero Zone on physical LEFT (direction: ltr) -->
        <section class="character-zone" aria-label="${STRINGS_AR.characterAriaLabel}">
          <div class="character-frame">
            <img class="character-image" src="${getCharacterAsset('idle') ?? ''}" alt="${STRINGS_AR.characterAriaLabel}" />
            <p class="character-fallback" hidden></p>
          </div>
        </section>

        <!-- Dynamic Content Zone -->
        <section class="mission-content-zone" aria-live="polite">
          <div class="mission-phase-container"></div>
        </section>
      </main>

      <div class="mission-sr-feedback" aria-live="assertive" aria-atomic="true"></div>
    </div>`;

  const charImage = app.querySelector('.character-image');
  const charFallback = app.querySelector('.character-fallback');
  const charFrame = app.querySelector('.character-frame');
  const phaseContainer = app.querySelector('.mission-phase-container');
  const srFeedback = app.querySelector('.mission-sr-feedback');
  const muteBtn = app.querySelector('.mute-button');
  const homeBtn = app.querySelector('.home-button');

  // Background fallback handling
  const bgEl = app.querySelector('.mission-screen__bg');
  if (stationBg && bgEl) {
    const testBg = new Image();
    testBg.onerror = () => {
      bgEl.style.backgroundImage = 'none';
    };
    testBg.src = stationBg;
  }

  // Mute button logic
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
    cleanup();
    navigate('start');
  });

  const prevBtn = app.querySelector('.prev-button');
  if (prevBtn && prevLetter) {
    prevBtn.addEventListener('click', () => {
      cleanup();
      navigate('mission', { letterId: prevLetter.id });
    });
  }

  function showMissingAsset(key) {
    charImage.hidden = true;
    if (import.meta.env.DEV) {
      charFallback.textContent = STRINGS_AR.missingAssetDev(key);
      charFallback.hidden = false;
    }
  }

  function setCharacterStill(key, bounce = false) {
    window.clearTimeout(thinkingTimer);
    const asset = getCharacterAsset(key);
    charFallback.hidden = true;

    if (!asset) {
      showMissingAsset(key);
      return;
    }

    charImage.hidden = false;
    charImage.dataset.assetKey = key;
    charImage.src = asset;
    charImage.classList.remove('character-image--bouncing');

    if (bounce) {
      requestAnimationFrame(() => charImage.classList.add('character-image--bouncing'));
    }
  }

  function setCharacterThinking() {
    window.clearTimeout(thinkingTimer);
    charFallback.hidden = true;

    const thinkingAsset = getLetterCharacterFile(letter, 'thinking');
    if (!thinkingAsset) {
      setCharacterStill('idle');
      return;
    }

    charImage.hidden = false;
    charImage.src = thinkingAsset;
    charImage.dataset.assetKey = 'thinking';

    thinkingTimer = window.setTimeout(() => {
      if (phase === 'CHOOSE') {
        setCharacterStill('idle');
      }
    }, 2000);
  }

  charImage.addEventListener('error', () => {
    // Graceful fallback chain
    if (charImage.dataset.assetKey === 'thinking') {
      const globalThinking = getCharacterAsset('thinking');
      if (globalThinking && charImage.src !== globalThinking) {
        charImage.src = globalThinking;
        return;
      }
      setCharacterStill('idle');
      return;
    }
    showMissingAsset(charImage.dataset.assetKey ?? 'idle');
  });

  // Preload victory video when entering CHOOSE
  function prepareVictoryVideo() {
    const videoUrl = getLetterCharacterFile(letter, 'victoryVideo');
    if (!videoUrl) return;

    preparedVideoEl = document.createElement('video');
    preparedVideoEl.className = 'character-video';
    preparedVideoEl.playsInline = true;
    preparedVideoEl.setAttribute('playsinline', '');
    preparedVideoEl.preload = 'auto';
    preparedVideoEl.src = videoUrl;
    preparedVideoEl.load();
  }

  // Play a letter audio file if it exists locally; otherwise use the
  // built-in speech synthesis fallback so the game is never silent.
  async function playLetterAudioOrSpeak(key, fallbackText, opts) {
    const url = getLetterAudio(letter, key);
    if (url && (await checkAudioAvailable(url))) {
      playFile(url);
      return true;
    }
    speak(fallbackText, opts);
    return false;
  }

  // Reinforce the correct letter by saying its name out loud.
  function playLetterReinforcement() {
    playLetterAudioOrSpeak('letterName', letter.upper, {
      pitch: 1.35,
      rate: 0.75,
    });
  }

  // Listen sequence for the prompt: letter name, then its sound, then the
  // word. Plays on entering the mission and via the replay button, so the
  // child always hears the letter even without touching anything.
  function playPromptAudio() {
    window.clearTimeout(introTimer);
    playLetterAudioOrSpeak('letterName', letter.upper);
    introTimer = window.setTimeout(() => {
      if (phase !== 'CHOOSE') return;
      playLetterAudioOrSpeak('letterSound', letter.word.en, {
        rate: 0.7,
      });
      introTimer = window.setTimeout(() => {
        if (phase !== 'CHOOSE') return;
        playLetterAudioOrSpeak('word', letter.word.en);
      }, 1900);
    }, 1900);
  }

  // --- PHASE 1: CHOOSE ---
  function renderChoosePhase() {
    phase = 'CHOOSE';
    wrongCount = 0;
    prepareVictoryVideo();

    // Say the letter name, its sound, then the word as soon as the
    // mission opens — no extra taps needed.
    playPromptAudio();

    const options = shuffle([letter.upper, ...letter.distractors]);

    phaseContainer.innerHTML = `
      <div class="choose-phase">
        <div class="choose-prompt-card">
          <h2 class="choose-prompt-title">${STRINGS_AR.choosePrompt}</h2>
          <div class="choose-prompt-content">
            ${
              wordImgUrl
                ? `<div class="choose-prompt-img-frame">
                     <img class="choose-prompt-img" src="${wordImgUrl}" alt="${letter.word.ar}" />
                   </div>`
                : ''
            }
            <div class="choose-prompt-words">
              <span class="choose-word-en" lang="en" dir="ltr">${letter.word.en}</span>
              <span class="choose-word-ar">${letter.word.ar}</span>
            </div>
          </div>

          <button class="audio-replay-btn prompt-replay-btn" type="button" aria-label="${STRINGS_AR.replayPrompt}">
            ${ICONS.audioWave}<span>${STRINGS_AR.replayPrompt}</span>
          </button>
        </div>

        <div class="letter-cards-grid" role="group" aria-label="${STRINGS_AR.choosePrompt}">
          ${options
            .map(
              (opt) => `
            <button class="letter-card" type="button" data-letter="${opt}" aria-label="${STRINGS_AR.letterCardAria(opt)}">
              <span class="letter-card__text" lang="en" dir="ltr">${opt}</span>
            </button>`
            )
            .join('')}
        </div>

        <p class="choose-hint-banner" role="status" aria-live="polite" hidden></p>

        <div class="choose-reduced-motion-controls" hidden>
          <button class="primary-action-btn next-letter-btn" type="button">
            ${STRINGS_AR.continue}
          </button>
        </div>
      </div>`;

    const promptImg = phaseContainer.querySelector('.choose-prompt-img');
    if (promptImg) {
      promptImg.addEventListener('error', () => {
        const apiFallback = getWordApiFallback(letter);
        if (apiFallback && promptImg.src !== apiFallback) {
          promptImg.src = apiFallback;
        } else {
          const frame = promptImg.closest('.choose-prompt-img-frame');
          if (frame) frame.hidden = true;
        }
      });
    }

    const replayBtn = phaseContainer.querySelector('.prompt-replay-btn');
    if (replayBtn) {
      replayBtn.addEventListener('click', playPromptAudio);
    }

    const cards = Array.from(phaseContainer.querySelectorAll('.letter-card'));

    function handleCardChoice(selectedCard, assisted = false) {
      const chosen = selectedCard.dataset.letter;
      const isCorrect = assisted || chosen === letter.upper;

      if (isCorrect) {
        // Correct branch: instant response <= 150ms
        cards.forEach((c) => {
          c.disabled = true;
        });
        selectedCard.classList.add('letter-card--correct');

        playCorrectSound();
        playLetterReinforcement();
        markCompleted(letter.id); // Progress saved the moment they succeed
        triggerCelebration(app.querySelector('.mission-screen') || app);
        srFeedback.textContent = STRINGS_AR.successYounes;

        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;

        if (prefersReducedMotion) {
          setCharacterStill('happy', false);
          const reducedControls = phaseContainer.querySelector(
            '.choose-reduced-motion-controls'
          );
          if (reducedControls) {
            reducedControls.hidden = false;
            const nextBtn = reducedControls.querySelector('.next-letter-btn');
            nextBtn.addEventListener('click', () => {
              renderResultPhase();
            });
          }

          // Optional manual video play button
          const videoUrl = getLetterCharacterFile(letter, 'victoryVideo');
          if (videoUrl) {
            const playVideoBtn = document.createElement('button');
            playVideoBtn.className = 'play-video-btn';
            playVideoBtn.type = 'button';
            playVideoBtn.textContent = STRINGS_AR.playVictoryVideo;
            playVideoBtn.addEventListener('click', () => {
              playVictoryVideoInHero(videoUrl, () => {});
            });
            reducedControls.prepend(playVideoBtn);
          }
          return;
        }

        // Normal motion: play victory video or fallback
        const videoUrl = getLetterCharacterFile(letter, 'victoryVideo');
        if (videoUrl && preparedVideoEl) {
          playVictoryVideoInHero(videoUrl, () => {
            setCharacterStill('happy', true);
            renderResultPhase();
          });
        } else {
          // Fallback when no victory video exists — quick hop to the badge
          setCharacterStill('happy', true);
          victoryTimer = window.setTimeout(() => {
            renderResultPhase();
          }, 1300);
        }
      } else {
        // Wrong branch: softly dim card, gentle shake, soft neutral tone
        selectedCard.classList.add('letter-card--dimmed');
        selectedCard.setAttribute('aria-disabled', 'true');
        selectedCard.disabled = true;

        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;
        if (!prefersReducedMotion) {
          selectedCard.classList.add('letter-card--shake');
          window.setTimeout(() => {
            selectedCard.classList.remove('letter-card--shake');
          }, 400);
        }

        playWrongSound();
        setCharacterThinking();
        srFeedback.textContent = STRINGS_AR.tryAgainEncouragement;

        // Progressive assist: never leave a child stuck in a failure loop.
        wrongCount += 1;

        if (wrongCount === 2) {
          // Gentle hint: make the correct card glow + say the letter slowly.
          const correctCard = cards.find((c) => c.dataset.letter === letter.upper);
          if (correctCard && !correctCard.disabled) {
            correctCard.classList.add('letter-card--hint');
          }
          speak(letter.upper, { rate: 0.6, pitch: 1.3 });

          const hintBanner = phaseContainer.querySelector('.choose-hint-banner');
          if (hintBanner) {
            hintBanner.textContent = STRINGS_AR.hintGlow;
            hintBanner.hidden = false;
          }
          srFeedback.textContent = STRINGS_AR.hintGlow;
        } else if (wrongCount === 3) {
          // Assist out: celebrate picking the correct letter together.
          const hintBanner = phaseContainer.querySelector('.choose-hint-banner');
          if (hintBanner) {
            hintBanner.textContent = `${STRINGS_AR.assistedHint} ${letter.upper}`;
            hintBanner.hidden = false;
          }

          const correctCard = cards.find((c) => c.dataset.letter === letter.upper);
          if (correctCard && !correctCard.disabled) {
            assistTimer = window.setTimeout(() => {
              if (phase === 'CHOOSE') {
                handleCardChoice(correctCard, true);
              }
            }, 900);
          }
        }
      }
    }

    function playVictoryVideoInHero(url, onEndCallback) {
      charImage.hidden = true;

      const video = preparedVideoEl || document.createElement('video');
      video.className = 'character-video';
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.title = STRINGS_AR.skipVideo;
      if (!video.src) video.src = url;

      charFrame.appendChild(video);

      let ended = false;
      const finish = () => {
        if (ended) return;
        ended = true;
        window.clearTimeout(maxTimeout);
        video.removeEventListener('ended', finish);
        video.removeEventListener('error', finish);
        video.removeEventListener('click', finish);
        video.remove();
        charImage.hidden = false;
        onEndCallback();
      };

      video.addEventListener('ended', finish, { once: true });
      video.addEventListener('error', finish, { once: true });
      video.addEventListener('click', finish); // Tap on video skips it

      const maxTimeout = window.setTimeout(finish, 8000); // 8-second limit
      video.play().catch(finish);
    }

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        if (!card.disabled) {
          handleCardChoice(card);
        }
      });
    });

    // Keyboard support: pressing letter key (a-z)
    activeKeyHandler = (e) => {
      if (e.defaultPrevented || phase !== 'CHOOSE') return;
      const key = e.key.toUpperCase();
      const targetCard = cards.find((c) => c.dataset.letter === key);
      if (targetCard && !targetCard.disabled) {
        e.preventDefault();
        handleCardChoice(targetCard);
      }
    };
    window.addEventListener('keydown', activeKeyHandler);
  }

  // --- PHASE 3: RESULT ---
  function renderResultPhase() {
    phase = 'RESULT';
    if (activeKeyHandler) {
      window.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = null;
    }

    setCharacterStill('happy', true);
    triggerCelebration(app.querySelector('.mission-screen') || app);

    phaseContainer.innerHTML = `
      <div class="result-phase">
        <div class="result-badge-card">
          <div class="result-badge-icon">${ICONS.star}</div>
          <h2 class="result-badge-title">${STRINGS_AR.successYounes}</h2>
          <div class="result-badge-letter" lang="en" dir="ltr">${letter.upper}</div>
        </div>

        <div class="result-action-zone">
          <button class="primary-action-btn result-continue-btn" type="button">
            ${STRINGS_AR.continue}
          </button>
          <div class="result-secondary-actions">
            <button class="nav-button result-home-btn" type="button" aria-label="${STRINGS_AR.returnHome}">
              ${ICONS.home}
              <span>${STRINGS_AR.home}</span>
            </button>
            ${
              prevLetter
                ? `<button class="nav-button result-prev-btn" type="button" aria-label="${STRINGS_AR.previousStage}">
                     ${ICONS.arrowRight}
                     <span>${STRINGS_AR.previousStage}</span>
                   </button>`
                : ''
            }
          </div>
        </div>
      </div>`;

    const continueBtn = phaseContainer.querySelector('.result-continue-btn');
    continueBtn.addEventListener('click', goToNextMission);

    // Little kids: the next letter arrives on its own after the celebration,
    // or instantly with any key / button press.
    victoryTimer = window.setTimeout(goToNextMission, 2800);

    activeKeyHandler = (e) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        goToNextMission();
      }
    };
    window.addEventListener('keydown', activeKeyHandler);

    const resultHomeBtn = phaseContainer.querySelector('.result-home-btn');
    if (resultHomeBtn) {
      resultHomeBtn.addEventListener('click', () => {
        cleanup();
        navigate('start');
      });
    }

    const resultPrevBtn = phaseContainer.querySelector('.result-prev-btn');
    if (resultPrevBtn && prevLetter) {
      resultPrevBtn.addEventListener('click', () => {
        cleanup();
        navigate('mission', { letterId: prevLetter.id });
      });
    }
  }

  // Advance to the next letter, or the completion screen at the very end.
  function goToNextMission() {
    window.clearTimeout(victoryTimer);
    const next = getNextLetter();
    cleanup();
    if (next) {
      navigate('mission', { letterId: next.id });
    } else {
      navigate('completion');
    }
  }

  function cleanup() {
    window.clearTimeout(thinkingTimer);
    window.clearTimeout(victoryTimer);
    window.clearTimeout(introTimer);
    window.clearTimeout(assistTimer);
    stopSpeaking();
    if (activeKeyHandler) {
      window.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = null;
    }
    if (unsubMute) {
      unsubMute();
      unsubMute = null;
    }
  }

  setCharacterStill('idle');
  renderChoosePhase();
}
