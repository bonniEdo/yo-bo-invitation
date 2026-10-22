(() => {
  'use strict';
  const viewer = document.querySelector('.story-viewer');
  if (!viewer) return;
  const track = viewer.querySelector('.story-track');
  const frames = [...viewer.querySelectorAll('[data-story-frame]')];
  const previous = document.getElementById('story-prev');
  const next = document.getElementById('story-next');
  const dots = [...viewer.querySelectorAll('[data-story-go]')];
  const status = document.getElementById('story-slide-status');
  let index = 0, gesture = null, suppressClickUntil = 0;
  viewer.classList.add('gallery-ready');
  viewer.tabIndex = 0;
  viewer.querySelector('.story-controls').hidden = false;
  viewer.querySelector('.story-progress').hidden = false;
  document.getElementById('story-enlarge').hidden = false;
  function show(requested) {
    index = Math.max(0, Math.min(frames.length - 1, requested));
    track.style.transform = `translateX(${-index * 100}%)`;
    frames.forEach((frame, i) => {
      frame.classList.toggle('is-current', i === index);
      frame.inert = i !== index;
      frame.setAttribute('aria-hidden', String(i !== index));
    });
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    previous.disabled = index === 0;
    next.disabled = index === frames.length - 1;
    status.textContent = `第 ${index + 1} 張，共 ${frames.length} 張`;
  }
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.storyGo))));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  // A normal image tap chooses a direction; an actual swipe must not also tap.
  viewer.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault(); event.stopPropagation(); return;
    }
    const photo = event.target.closest('.story-photo');
    if (!photo) return;
    const box = photo.getBoundingClientRect();
    show(index + (event.clientX < box.left + box.width / 2 ? -1 : 1));
  }, true);
  viewer.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a')) return;
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now()};
  }, {passive:true});
  window.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && performance.now() - gesture.time < 1200) {
      suppressClickUntil = performance.now() + 400;
      show(index + (dx < 0 ? 1 : -1));
    }
    gesture = null;
  }, {passive:true});
  window.addEventListener('pointercancel', () => { gesture = null; }, {passive:true});
  viewer.addEventListener('dragstart', event => event.preventDefault());
  viewer.querySelectorAll('.story-photo img').forEach(img => { img.draggable = false; });
  document.getElementById('story-enlarge').addEventListener('click', () => {
    const img = frames[index].querySelector('img');
    if (!img) return;
    const full = document.getElementById('photo-full');
    full.src = img.src; full.alt = img.alt;
    window.InvitationModal.open(document.getElementById('photo-dialog'), document.getElementById('photo-close'));
  });
  show(0);
})();
