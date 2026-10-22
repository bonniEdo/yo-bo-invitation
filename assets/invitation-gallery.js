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
  function show(requested) {
    // Only explicit carousel controls change the photo; scrolling never does.
    index = (requested + frames.length) % frames.length;
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
    status.textContent = `第 ${index + 1} 張，共 ${frames.length} 張`;
  }
  function enlarge(photo) {
    const img = photo.querySelector('img');
    if (!img) return;
    const full = document.getElementById('photo-full');
    full.src = img.src; full.alt = img.alt;
    window.InvitationModal.open(document.getElementById('photo-dialog'), document.getElementById('photo-close'));
  }
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.storyGo))));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  viewer.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault(); event.stopPropagation(); return;
    }
    const photo = event.target.closest('.story-photo');
    if (photo) enlarge(photo);
  }, true);
  viewer.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a')) return;
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now()};
  }, {passive:true});
  window.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    // A swipe changes the slide; its following synthetic click never zooms.
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) suppressClickUntil = performance.now() + 450;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && performance.now() - gesture.time < 1200) show(index + (dx < 0 ? 1 : -1));
    gesture = null;
  }, {passive:true});
  window.addEventListener('pointercancel', () => { gesture = null; suppressClickUntil = performance.now() + 450; }, {passive:true});
  viewer.addEventListener('dragstart', event => event.preventDefault());
  viewer.querySelectorAll('.story-photo').forEach(photo => {
    photo.tabIndex = 0;
    photo.setAttribute('role', 'button');
    photo.setAttribute('aria-label', '放大這張合照');
    photo.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); enlarge(photo); }
    });
    const img = photo.querySelector('img');
    if (img) img.draggable = false;
  });
  show(0);
})();
