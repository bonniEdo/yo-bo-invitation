(() => {
  'use strict';
  const book = document.getElementById('invitation-book');
  if (!book || !window.ResizeObserver || !CSS.supports('position', 'sticky')) return;

  const stage = book.querySelector('.book-stage');
  const pages = [...book.querySelectorAll('[data-book-page]')];
  const lastPage = pages.length - 1;
  const coverLink = document.querySelector('.site-header a[href="#invitation"]');
  const headings = pages.map(page => document.getElementById(page.getAttribute('aria-labelledby')) || page.querySelector('h1, h2'));
  const anchor = book.querySelector('.paper-anchor');
  const flight = book.querySelector('.paper-flight');
  const paper = book.querySelector('.invitation-paper');
  const intro = book.querySelector('.hero-copy');
  const storyIndex = pages.findIndex(page => page.id === 'story');
  const storyViewer = book.querySelector('.story-viewer');
  const storyFrames = [...book.querySelectorAll('[data-story-frame]')];
  const storyDots = [...book.querySelectorAll('.story-progress span')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  let layout = {}, frame = 0, measureFrame = 0, active = -1;
  let animationFrame = 0, animationTarget = null;

  pages.forEach((page, index) => { page.style.zIndex = String(pages.length - index); });
  document.documentElement.classList.add('book-enabled');

  function renderStory(offset) {
    const entry = layout.entries[storyIndex];
    const progress = layout.storyHold ? clamp((offset - entry.enter - layout.storyHoldAt) / layout.storyHold) : 0;
    const raw = progress * (storyFrames.length - 1);
    const step = Math.floor(raw);
    const fraction = raw - step;
    const position = step + fraction * fraction * (3 - 2 * fraction);
    const current = Math.round(position);
    storyFrames.forEach((photo, index) => {
      const visible = reducedMotion.matches || index === current;
      // Fade the incoming image over an opaque previous image. Keep captions
      // separate so two paragraphs never overlap during the dissolve.
      photo.querySelector('.story-photo').style.opacity = String(reducedMotion.matches ? 1 : clamp(position - index + 1));
      photo.classList.toggle('is-current', visible);
      photo.inert = !visible;
      photo.setAttribute('aria-hidden', String(!visible));
      photo.style.pointerEvents = visible ? '' : 'none';
    });
    storyDots.forEach((dot, index) => dot.classList.toggle('is-current', index === current));
  }

  function readOffset(index, offset) {
    if (index === lastPage) return 0; // The last sheet scrolls in normal flow.
    const entry = layout.entries[index];
    const local = clamp(offset - entry.enter, 0, entry.read);
    // Hold the story's photo window in place while its three frames crossfade.
    return index === storyIndex ? local - clamp(local - layout.storyHoldAt, 0, layout.storyHold) : local;
  }

  function render() {
    frame = 0;
    const offset = window.scrollY - layout.start;
    const zoom = clamp((offset - layout.coverRead) / layout.zoom);
    const turns = layout.entries.map((entry, index) => index === lastPage ? 0 : clamp((offset - entry.turnStart) / layout.turn));
    const reads = pages.map((_, index) => index === 0 ? clamp(offset, 0, layout.coverRead) : readOffset(index, offset));
    const coverRead = reads[0];
    const fit = reducedMotion.matches ? 0 : zoom;
    book.style.setProperty('--cover-presence', String(1 - zoom));
    book.style.setProperty('--depth-scroll', String(reducedMotion.matches ? 0 : clamp(offset / Math.max(1, layout.coverRead + layout.zoom))));

    let sheet = 0;
    while (sheet < lastPage && offset >= layout.entries[sheet + 1].enter) sheet++;
    const currentHeight = sheet === 0 ? mix(layout.heights[0] - coverRead, layout.scene, zoom) : layout.heights[sheet] - reads[sheet];
    const visibleHeight = sheet === lastPage ? currentHeight : mix(currentHeight, layout.heights[sheet + 1], turns[sheet]);
    stage.style.clipPath = `inset(-50px -50px ${Math.max(0, layout.height - visibleHeight)}px -50px)`;

    // Keep the existing cover: fit the magazine to the stage, then turn it left.
    pages[0].style.transform = `translateY(${-coverRead}px)`;
    const introOpacity = reducedMotion.matches ? 1 : 1 - clamp(zoom * 1.8);
    const focusedIntro = intro.contains(document.activeElement);
    intro.inert = introOpacity === 0;
    if (intro.inert && focusedIntro) coverLink?.focus({ preventScroll: true });
    pages[0].style.setProperty('--intro-opacity', introOpacity);
    pages[0].style.visibility = turns[0] >= (reducedMotion.matches ? 0.5 : 1) ? 'hidden' : 'visible';
    flight.style.width = `${mix(layout.paper.width, layout.width, fit)}px`;
    flight.style.height = `${mix(layout.paper.height, layout.scene, fit)}px`;
    flight.style.transform = `translate(${-layout.paper.left * fit}px, ${(coverRead - layout.paper.top) * fit}px) rotate(${-5 * (1 - fit)}deg)`;
    flight.style.setProperty('--paper-fit', fit);
    paper.style.transform = reducedMotion.matches ? 'none' : `perspective(5000px) rotateY(${-180 * turns[0]}deg)`;
    paper.style.setProperty('--turn-shade', Math.sin(turns[0] * Math.PI) * 0.19);

    pages.slice(1).forEach((page, relative) => {
      const index = relative + 1;
      page.style.transform = reducedMotion.matches
        ? `translateY(${-reads[index]}px)`
        : `translateY(${-reads[index]}px) perspective(5000px) rotateY(${-180 * turns[index]}deg)`;
      const notOpened = index === 1 ? zoom < 1 : turns[index - 1] === 0;
      const turned = index !== lastPage && turns[index] >= (reducedMotion.matches ? 0.5 : 1);
      page.style.visibility = notOpened || turned ? 'hidden' : 'visible';
      page.style.setProperty('--turn-shade', Math.sin(turns[index] * Math.PI) * 0.19);
    });
    renderStory(offset);

    const next = turns.reduce((index, progress, turning) => progress >= 0.5 ? turning + 1 : index, 0);
    if (next !== active) {
      const focusedPage = pages.findIndex(page => page.contains(document.activeElement));
      active = next;
      pages.forEach((page, index) => {
        page.inert = index !== active;
        page.setAttribute('aria-hidden', String(index !== active));
      });
      if (focusedPage !== -1 && focusedPage !== active) {
        (active === 0 && intro.inert ? coverLink : headings[active])?.focus({ preventScroll: true });
      }
    }
    book.dataset.page = String(active);
  }

  function measure() {
    measureFrame = 0;
    const previous = layout.entries?.[active];
    const local = previous ? window.scrollY - layout.start - previous.enter : 0;
    const preserveReading = active > 0 && previous && local >= 0 && (active === lastPage || local <= previous.read) && !animationFrame;
    const top = window.innerWidth <= 760 ? 16 : 24;
    const scene = Math.max(300, window.innerHeight - top - 24);
    const zoom = Math.max(320, Math.round(scene * 0.75));
    const turn = Math.max(420, Math.round(scene * 0.9));
    book.style.setProperty('--scene-height', `${scene}px`);
    const heights = pages.map(page => page.offsetHeight);
    const storyHold = reducedMotion.matches ? 0 : Math.round(scene * 1.6);
    const storyHoldAt = clamp(storyViewer.offsetTop - scene * 0.08, 0, Math.max(0, heights[storyIndex] - scene));
    const coverRead = Math.max(0, heights[0] - scene);
    const entries = [];
    pages.forEach((page, index) => {
      const enter = index === 0 ? 0 : entries[index - 1].turnStart + turn;
      const read = index === lastPage ? 0 : Math.max(0, heights[index] - scene) + (index === storyIndex ? storyHold : 0);
      entries.push({ enter, read, turnStart: enter + read + (index === 0 ? zoom : 0) });
    });
    const end = entries[lastPage].enter;
    const height = Math.max(scene, ...heights);
    book.style.setProperty('--book-height', `${height}px`);
    book.style.height = `${height + end}px`;
    book.style.marginBottom = `${heights[lastPage] - height}px`;
    const geometry = { width: anchor.offsetWidth, height: anchor.offsetHeight, left: 0, top: 0 };
    for (let node = anchor; node && node !== stage; node = node.offsetParent) {
      geometry.left += node.offsetLeft;
      geometry.top += node.offsetTop;
    }
    layout = { scene, zoom, turn, coverRead, entries, storyHold, storyHoldAt, end, heights, height, paper: geometry, width: stage.offsetWidth,
      start: window.scrollY + book.getBoundingClientRect().top - top };
    if (preserveReading) {
      const nextLocal = active === lastPage ? local : clamp(local, 0, entries[active].read);
      const nextTop = layout.start + entries[active].enter + nextLocal;
      if (Math.abs(window.scrollY - nextTop) > 1) window.scrollTo({ top: nextTop, behavior: 'instant' });
    }
    render();
  }

  function requestRender() { if (!frame) frame = requestAnimationFrame(render); }
  function requestMeasure() { if (!measureFrame) measureFrame = requestAnimationFrame(measure); }
  function chapterPosition(index) { return layout.start + layout.entries[index].enter; }
  function cancelAnimation() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    animationTarget = null;
  }
  function goToPage(index, focus = true) {
    cancelAnimation();
    const from = window.scrollY;
    const to = chapterPosition(index);
    const finish = () => {
      animationFrame = 0;
      animationTarget = null;
      if (focus) headings[index].focus({ preventScroll: true });
    };
    const scrollTo = top => {
      window.scrollTo({ top, behavior: 'instant' });
      cancelAnimationFrame(frame);
      render();
    };
    if (reducedMotion.matches || Math.abs(to - from) < 4) {
      scrollTo(to);
      finish();
      return;
    }
    const zoomStart = layout.start + layout.coverRead;
    const zoomEnd = zoomStart + layout.zoom;
    const forward = to > from;
    const boundaries = [...new Set([zoomStart, zoomEnd, ...layout.entries.flatMap((entry, page) =>
      page === lastPage ? [layout.start + entry.enter] : [layout.start + entry.enter, layout.start + entry.turnStart])])].sort((a, b) => a - b);
    if (!forward) boundaries.reverse();
    const stops = boundaries.filter(point => forward ? point > from && point < to : point < from && point > to);
    const points = [from, ...stops, to];
    const phases = points.slice(1).map((point, i) => {
      const middle = (point + points[i]) / 2;
      const turning = middle >= zoomStart && middle <= zoomEnd || layout.entries.some((entry, page) =>
        page < lastPage && middle >= layout.start + entry.turnStart && middle <= layout.start + entry.turnStart + layout.turn);
      return { from: points[i], to: point, duration: turning ? 1000 : 350 };
    });
    const duration = phases.reduce((total, phase) => total + phase.duration, 0);
    const started = performance.now();
    animationTarget = index;
    function tick(now) {
      let elapsed = Math.max(0, now - started);
      if (elapsed >= duration) { scrollTo(to); finish(); return; }
      let phase = phases[0];
      for (const segment of phases) {
        phase = segment;
        if (elapsed < phase.duration) break;
        elapsed -= phase.duration;
      }
      const progress = elapsed / phase.duration;
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      scrollTo(mix(phase.from, phase.to, eased));
      animationFrame = requestAnimationFrame(tick);
    }
    animationFrame = requestAnimationFrame(tick);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = pages.findIndex(page => `#${page.id}` === link.getAttribute('href'));
    if (index === -1) return;
    event.preventDefault();
    try { history.replaceState(null, '', `#${pages[index].id}`); } catch { /* Local HTML can disallow history changes. */ }
    goToPage(index);
  });
  window.addEventListener('scroll', requestRender, { passive: true });
  ['wheel', 'touchstart', 'pointerdown'].forEach(type => {
    window.addEventListener(type, cancelAnimation, { passive: true });
  });
  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.target?.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancelAnimation();
  });
  window.addEventListener('resize', () => { cancelAnimation(); requestMeasure(); }, { passive: true });
  window.addEventListener('hashchange', () => {
    const index = pages.findIndex(page => `#${page.id}` === location.hash);
    if (index !== -1) goToPage(index);
  });
  reducedMotion.addEventListener('change', () => {
    measure();
    if (reducedMotion.matches && animationTarget !== null) goToPage(animationTarget);
    else requestRender();
  });

  const observer = new ResizeObserver(requestMeasure);
  pages.forEach(page => observer.observe(page));
  document.fonts?.ready.then(requestMeasure);
  measure();
  window.addEventListener('pageshow', () => requestAnimationFrame(() => {
    measure();
    const initialPage = pages.findIndex(page => `#${page.id}` === location.hash);
    if (initialPage !== -1) {
      window.scrollTo({ top: chapterPosition(initialPage), behavior: 'instant' });
      render();
    }
  }));
})();
