const MUTE_KEY = 'natat-younes:muted';

let muted = false;
try {
  const stored = localStorage.getItem(MUTE_KEY);
  if (stored !== null) {
    muted = stored === 'true';
  }
} catch {
  // In-memory fallback
}

const muteListeners = new Set();

export function isMuted() {
  return muted;
}

export function setMuted(val) {
  muted = Boolean(val);
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // In-memory fallback
  }
  muteListeners.forEach((listener) => {
    try {
      listener(muted);
    } catch {
      // Ignore listener error
    }
  });
}

export function toggleMute() {
  setMuted(!muted);
  return muted;
}

export function onMuteChange(listener) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

if (typeof window !== 'undefined') {
  const opts = { once: true, passive: true };
  window.addEventListener('pointerdown', unlockAudio, opts);
  window.addEventListener('keydown', unlockAudio, opts);
  window.addEventListener('touchstart', unlockAudio, opts);
}

export function playFile(url) {
  if (isMuted() || !url) return null;
  try {
    const audio = new Audio(url);
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
    return audio;
  } catch {
    return null;
  }
}

export function playCorrectSound() {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  } catch {
    // Silent no-op
  }
}

export function playWrongSound() {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.22);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch {
    // Silent no-op
  }
}

export async function checkAudioAvailable(url) {
  if (!url) return false;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return false;
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('text/html')) return false;
    return true;
  } catch {
    return false;
  }
}

// --- Speech synthesis fallback (used when a local audio file is missing) ---
let cachedVoice = null;
let voicesWarmedUp = false;

function pickEnglishVoice(synth) {
  if (cachedVoice) return cachedVoice;
  const voices = synth.getVoices();
  if (!voices.length) return null;
  const preferred =
    voices.find((v) => v.lang === 'en-US' && v.localService) ||
    voices.find((v) => v.lang.startsWith('en') && v.localService) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang.startsWith('en'));
  cachedVoice = preferred || null;
  return cachedVoice;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  // Warm voice list (populated asynchronously in some browsers)
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null;
    const synth = window.speechSynthesis;
    synth.getVoices();
    if (voicesWarmedUp) return;
    voicesWarmedUp = true;
    speak(' ', { rate: 1, volume: 0 });
  });
}

export function speak(text, opts = {}) {
  if (isMuted() || !text) return null;
  try {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) return null;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = opts.rate ?? 0.85;
    utterance.pitch = opts.pitch ?? 1.2;
    utterance.volume = opts.volume ?? 1;

    const voice = pickEnglishVoice(synth);
    if (voice) utterance.voice = voice;

    synth.speak(utterance);
    return utterance;
  } catch {
    return null;
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // Silent no-op
  }
}
