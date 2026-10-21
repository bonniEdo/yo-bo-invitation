(() => {
  'use strict';
  const book = document.getElementById('invitation-book');
  const cover = document.getElementById('invitation');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0, x = 0, y = 0;
  function paint() {
    frame = 0;
    cover.style.setProperty('--tilt-x', `${x * 7}deg`);
    cover.style.setProperty('--tilt-y', `${-y * 5}deg`);
    cover.style.setProperty('--depth-x', `${x * 16}px`);
    cover.style.setProperty('--depth-y', `${y * 12}px`);
    cover.style.setProperty('--light-x', `${50 + x * 35}%`);
    cover.style.setProperty('--light-y', `${35 + y * 25}%`);
  }
  function reset() { x = 0; y = 0; cancelAnimationFrame(frame); paint(); }
  cover.addEventListener('pointermove', event => {
    if (reduced.matches || !pointer.matches || event.pointerType !== 'mouse' || book.dataset.page !== '0') return;
    const rect = cover.getBoundingClientRect();
    x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });
  cover.addEventListener('pointerleave', reset);
  reduced.addEventListener('change', reset);
  pointer.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
})();
