export function triggerCelebration(container = document.body) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const confettiWrapper = document.createElement('div');
  confettiWrapper.className = 'celebration-particles-layer';
  confettiWrapper.setAttribute('aria-hidden', 'true');

  const colors = [
    '#f2bd55', // Gold
    '#167c80', // Teal
    '#e53935', // Red
    '#43a047', // Green
    '#9c27b0', // Purple
    '#ff9800', // Orange
    '#00bcd4', // Cyan
    '#ff4081', // Pink
  ];
  const symbols = ['★', '✦', '●', '▲', '◆', '★', '✦'];

  const count = 38;
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'celebration-particle';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];

    const angle = Math.random() * 360;
    const distance = 80 + Math.random() * 280;
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * distance;
    const dy = Math.sin(rad) * distance - 80; // initial burst upwards
    const rot = Math.floor(Math.random() * 720 - 360);
    const size = 16 + Math.random() * 20;
    const delay = Math.random() * 0.15;
    const duration = 1.3 + Math.random() * 0.7;

    particle.textContent = symbol;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    particle.style.setProperty('--rot', `${rot}deg`);
    particle.style.setProperty('--size', `${size}px`);
    particle.style.setProperty('--color', color);
    particle.style.setProperty('--delay', `${delay}s`);
    particle.style.setProperty('--duration', `${duration}s`);

    confettiWrapper.appendChild(particle);
  }

  container.appendChild(confettiWrapper);

  window.setTimeout(() => {
    confettiWrapper.remove();
  }, 2300);
}
