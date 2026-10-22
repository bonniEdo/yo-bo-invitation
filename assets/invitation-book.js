(() => {
  'use strict';
  const book = document.getElementById('invitation-book');
  if (!book || !window.ResizeObserver || !CSS.supports('position', 'sticky')) return;

  const stage = book.querySelector('.book-stage');
  const pages = [...book.querySelectorAll('[data-book-page]')];
  const lastPage = pages.length - 1;
  const coverLink = document.getElementById('hero-title');
  const header = document.querySelector('.site-header');
  const headings = pages.map(page => document.getElementById(page.getAttribute('aria-labelledby')) || page.querySelector('h1, h2'));
  const anchor = book.querySelector('.paper-anchor');
  const flight = book.querySelector('.paper-flight');
  const paper = book.querySelector('.invitation-paper');
  const intro = book.querySelector('.hero-copy');
  const backAnchor = book.querySelector('.backcover-anchor');
  const backFlight = book.querySelector('.backcover-flight');
  const backMagazine = book.querySelector('.backcover-magazine');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  let layout = {}, frame = 0, measureFrame = 0, active = -1;
  let animationFrame = 0, animationTarget = null, wholeFlip = null, modalLocked = false;
  let settleTimer = 0, touchActive = false, manualScroll = false, scrollDirection = 1, previousScroll = window.scrollY, snapping = false;

  pages.forEach((page, index) => { page.style.zIndex = String(pages.length - index); });
  document.documentElement.classList.add('book-enabled');

  function readOffset(index, offset) {
    if (index === lastPage) return 0;
    const entry = layout.entries[index];
    return clamp(offset - entry.enter, 0, entry.read);
  }

  function render() {
    frame = 0;
    if (modalLocked) return;
    const offset = window.scrollY - layout.start;
    const zoom = clamp((offset - layout.coverRead) / layout.zoom);
    const turns = layout.entries.map((entry, index) => index === lastPage ? 0 : clamp((offset - entry.turnStart) / layout.turn));
    const reads = pages.map((_, index) => index === 0 ? clamp(offset, 0, layout.coverRead) : readOffset(index, offset));
    const coverRead = reads[0];
    const fit = reducedMotion.matches ? 0 : zoom;
    const closing = reducedMotion.matches ? 1 : clamp((offset - layout.entries[lastPage].enter) / layout.zoom);
    const backFit = 1 - closing;
    const closingTurn = turns[lastPage - 1];
    backFlight.style.transformOrigin = closingTurn < 1 ? '0 50%' : '50% 50%';
    backFlight.style.width = `${mix(layout.back.width, layout.width, backFit)}px`;
    backFlight.style.height = `${mix(layout.back.height, layout.scene, backFit)}px`;
    // The final sheet has two faces. Its right edge sweeps left around the
    // spine, revealing the photo printed on its reverse before settling down.
    const hinge = reducedMotion.matches ? '' : ` translateX(${layout.width * closingTurn}px) perspective(5000px) rotateY(${-180 * closingTurn}deg) translateX(${layout.width}px) rotateY(180deg)`;
    backFlight.style.transform = `translate(${-layout.back.left * backFit}px, ${-layout.back.top * backFit}px)${closingTurn < 1 ? hinge : ''} rotate(${-5 * closing}deg)`;
    backMagazine.style.setProperty('--back-fit', backFit);
    pages[lastPage].style.setProperty('--closing-progress', closing);
    book.style.setProperty('--cover-presence', String(1 - zoom));
    book.style.setProperty('--depth-scroll', String(reducedMotion.matches ? 0 : clamp(offset / Math.max(1, layout.coverRead + layout.zoom))));

    let sheet = 0;
    while (sheet < lastPage && offset >= layout.entries[sheet + 1].enter) sheet++;
    const currentHeight = sheet === 0 ? mix(layout.heights[0] - coverRead, layout.scene, zoom) : layout.heights[sheet] - reads[sheet];
    const visibleHeight = sheet === lastPage ? currentHeight : mix(currentHeight, layout.heights[sheet + 1], turns[sheet]);
    // Size the sticky stage to the visible sheet. A tallest-sheet spacer with
    // a negative margin leaves overflow below the footer and breaks its links.
    stage.style.height = `${visibleHeight}px`;
    stage.style.clipPath = 'inset(-50px -50px 0px -50px)';

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
      if (index === lastPage - 1 && !reducedMotion.matches) {
        page.style.transform = `translateY(${-reads[index]}px) translateX(${layout.width * turns[index]}px) perspective(5000px) rotateY(${-180 * turns[index]}deg)`;
      }
      const notOpened = index === 1 ? zoom < 1 : turns[index - 1] === 0;
      const turned = index !== lastPage && turns[index] >= (reducedMotion.matches ? 0.5 : 1);
      page.style.visibility = notOpened || turned ? 'hidden' : 'visible';
      page.style.setProperty('--turn-shade', Math.sin(turns[index] * Math.PI) * 0.19);
    });

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
    document.documentElement.classList.toggle('is-cover', active === 0);
    document.documentElement.classList.toggle('is-backcover', active === lastPage);
    if (header) header.inert = active === 0 || active === lastPage;
  }

  function measure() {
    measureFrame = 0;
    if (modalLocked) return;
    const resumeSnap = snapping;
    if (resumeSnap) { cancelAnimation(); manualScroll = true; }
    const previous = layout.entries?.[active];
    const local = previous ? window.scrollY - layout.start - previous.enter : 0;
    const preserveReading = active > 0 && previous && local >= 0 && (active === lastPage || local <= previous.read) && !animationFrame;
    const top = window.innerWidth <= 760 ? 16 : 24;
    const scene = Math.max(300, window.innerHeight - top - 24);
    const zoom = Math.max(320, Math.round(scene * 0.75));
    const turn = Math.max(420, Math.round(scene * 0.9));
    book.style.setProperty('--scene-height', `${scene}px`);
    const heights = pages.map(page => page.offsetHeight);
    const coverRead = Math.max(0, heights[0] - scene);
    const entries = [];
    pages.forEach((page, index) => {
      const enter = index === 0 ? 0 : entries[index - 1].turnStart + turn;
      const read = index === lastPage ? 0 : Math.max(0, heights[index] - scene);
      entries.push({ enter, read, turnStart: enter + read + (index === 0 ? zoom : 0) });
    });
    const end = entries[lastPage].enter + zoom;
    const height = Math.max(scene, ...heights);
    book.style.setProperty('--book-height', `${height}px`);
    book.style.height = `${heights[lastPage] + end}px`;
    book.style.marginBottom = '0px';
    const geometry = { width: anchor.offsetWidth, height: anchor.offsetHeight, left: 0, top: 0 };
    for (let node = anchor; node && node !== stage; node = node.offsetParent) {
      geometry.left += node.offsetLeft;
      geometry.top += node.offsetTop;
    }
    backAnchor.style.width = `${geometry.width}px`;
    backAnchor.style.height = `${geometry.height}px`;
    const backGeometry = { width: backAnchor.offsetWidth, height: backAnchor.offsetHeight, left: backAnchor.offsetLeft - backAnchor.offsetWidth / 2, top: backAnchor.offsetTop - backAnchor.offsetHeight / 2 };
    layout = { back: backGeometry, scene, zoom, turn, coverRead, entries, end, heights, height, paper: geometry, width: stage.offsetWidth,
      start: window.scrollY + book.getBoundingClientRect().top - top };
    if (preserveReading) {
      const nextLocal = active === lastPage ? local : clamp(local, 0, entries[active].read);
      const nextTop = layout.start + entries[active].enter + nextLocal;
      if (Math.abs(window.scrollY - nextTop) > 1) window.scrollTo({ top: nextTop, behavior: 'instant' });
    }
    render();
    if (resumeSnap) scheduleSettle();
  }

  function requestRender() { if (!frame) frame = requestAnimationFrame(render); }
  function requestMeasure() { if (!measureFrame) measureFrame = requestAnimationFrame(measure); }
  function chapterPosition(index) { return layout.start + layout.entries[index].enter + (index === lastPage ? layout.zoom : 0); }
  function cancelAnimation() {
    clearTimeout(settleTimer);
    snapping = false;
    if (wholeFlip) { wholeFlip.cancel(); wholeFlip = null; }
    document.querySelector('.whole-book-flip')?.remove();
    stage.style.opacity = '';
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    animationTarget = null;
  }
  function goToPage(index, focus = true) {
    cancelAnimation();
    manualScroll = false;
    if (index === 0 && active === lastPage && !reducedMotion.matches) {
      flipWholeBook(focus);
      return;
    }
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
      page === lastPage ? [layout.start + entry.enter, chapterPosition(lastPage)] : [layout.start + entry.enter, layout.start + entry.turnStart])])].sort((a, b) => a - b);
    if (!forward) boundaries.reverse();
    const stops = boundaries.filter(point => forward ? point > from && point < to : point < from && point > to);
    const points = [from, ...stops, to];
    const phases = points.slice(1).map((point, i) => {
      const middle = (point + points[i]) / 2;
      const turning = middle >= zoomStart && middle <= zoomEnd || middle >= layout.start + layout.entries[lastPage].enter && middle <= chapterPosition(lastPage) || layout.entries.some((entry, page) =>
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

  // Two faces of one physical book: jump the document while the overlay turns.
  // No intermediate chapter is visited or announced when returning to the cover.
  function flipWholeBook(focus) {
    const start = backMagazine.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'whole-book-flip';
    overlay.setAttribute('aria-hidden', 'true');
    const back = backMagazine.cloneNode(true);
    const front = paper.cloneNode(true);
    [back, front].forEach(face => {
      face.removeAttribute('id');
      face.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      face.classList.add('whole-book-face');
      face.style.cssText = '';
      face.inert = true;
    });
    front.classList.remove('whole-book-face');
    const frontFace = document.createElement('div');
    frontFace.className = 'book-cover whole-book-face whole-book-front';
    frontFace.append(front);
    overlay.append(back, frontFace);
    document.body.append(overlay);
    stage.style.opacity = '0';
    window.scrollTo({ top: chapterPosition(0), behavior: 'instant' });
    render();
    const end = flight.getBoundingClientRect();
    animationTarget = 0;
    const animation = overlay.animate([
      { left: `${start.left + (start.width - backMagazine.offsetWidth) / 2}px`, top: `${start.top + (start.height - backMagazine.offsetHeight) / 2}px`, width: `${backMagazine.offsetWidth}px`, height: `${backMagazine.offsetHeight}px`, transform: 'perspective(1800px) rotateY(0deg) rotateZ(-5deg)' },
      { left: `${end.left + (end.width - flight.offsetWidth) / 2}px`, top: `${end.top + (end.height - flight.offsetHeight) / 2}px`, width: `${flight.offsetWidth}px`, height: `${flight.offsetHeight}px`, transform: 'perspective(1800px) rotateY(180deg) rotateZ(5deg)' }
    ], { duration: 1100, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
    wholeFlip = animation;
    animation.finished.then(() => {
      if (wholeFlip !== animation) return;
      wholeFlip = null;
      overlay.remove();
      stage.style.opacity = '';
      animationTarget = null;
      if (focus) coverLink?.focus({ preventScroll: true });
    }).catch(() => {});
  }

  // Let native scrolling read long pages; settle only a partly turned sheet.
  function scheduleSettle() {
    clearTimeout(settleTimer);
    if (!manualScroll || modalLocked || touchActive || animationFrame || wholeFlip) return;
    settleTimer = setTimeout(settleTurn, 220);
  }
  function settleTurn() {
    if (!manualScroll || modalLocked || touchActive || animationFrame || wholeFlip) return;
    manualScroll = false;
    const offset = window.scrollY - layout.start;
    const intervals = [
      {start: layout.coverRead, end: layout.coverRead + layout.zoom, kind: 'cover'},
      ...layout.entries.slice(0, -1).map((entry, index) => ({start: entry.turnStart, end: entry.turnStart + layout.turn, kind: index === 0 ? 'cover' : index === lastPage - 1 ? 'close' : 'sheet'})),
      {start: layout.entries[lastPage].enter, end: layout.end, kind: 'close'}
    ];
    const interval = intervals.find(part => offset > part.start + 1 && offset < part.end - 1);
    if (!interval) return;
    const fraction = (offset - interval.start) / (interval.end - interval.start);
    const forward = scrollDirection >= 0 ? fraction > 0.18 : fraction >= 0.82;
    let target = layout.start + (forward ? interval.end : interval.start);
    if (interval.kind === 'cover') target = chapterPosition(forward ? 1 : 0);
    if (interval.kind === 'close') target = forward ? chapterPosition(lastPage) : layout.start + layout.entries[lastPage - 1].turnStart;
    const from = window.scrollY;
    const move = top => { window.scrollTo({top, behavior: 'instant'}); cancelAnimationFrame(frame); render(); };
    if (reducedMotion.matches || Math.abs(target - from) < 2) { move(target); return; }
    const started = performance.now();
    snapping = true;
    function tick(now) {
      const progress = clamp((now - started) / 560);
      const eased = 1 - (1 - progress) ** 3;
      move(mix(from, target, eased));
      if (progress === 1) { animationFrame = 0; snapping = false; return; }
      animationFrame = requestAnimationFrame(tick);
    }
    animationFrame = requestAnimationFrame(tick);
  }
  function returnToCover() {
    if (active !== lastPage || Number(pages[lastPage].style.getPropertyValue('--closing-progress')) < 0.95) return;
    try { history.replaceState(null, '', '#invitation'); } catch { /* File previews may restrict history. */ }
    goToPage(0);
  }
  backMagazine.addEventListener('click', returnToCover);
  backMagazine.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); returnToCover(); }
  });
  document.addEventListener('invitation:lock', () => { cancelAnimation(); manualScroll = false; modalLocked = true; });
  document.addEventListener('invitation:unlock', () => { modalLocked = false; previousScroll = window.scrollY; manualScroll = true; requestMeasure(); scheduleSettle(); });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = pages.findIndex(page => `#${page.id}` === link.getAttribute('href'));
    if (index === -1) return;
    event.preventDefault();
    try { history.replaceState(null, '', `#${pages[index].id}`); } catch { /* Local HTML can disallow history changes. */ }
    goToPage(index);
  });
  window.addEventListener('scroll', () => {
    if (manualScroll && Math.abs(window.scrollY - previousScroll) > 1) scrollDirection = Math.sign(window.scrollY - previousScroll);
    previousScroll = window.scrollY;
    requestRender();
    scheduleSettle();
  }, {passive: true});
  window.addEventListener('wheel', event => {
    if (modalLocked) return;
    cancelAnimation(); manualScroll = true;
    if (event.deltaY) scrollDirection = Math.sign(event.deltaY);
    scheduleSettle();
  }, {passive: true});
  window.addEventListener('pointerdown', () => {
    if (modalLocked) return;
    cancelAnimation(); manualScroll = true; scheduleSettle();
  }, {passive: true});
  window.addEventListener('touchstart', () => {
    if (modalLocked) return;
    touchActive = true; cancelAnimation(); manualScroll = true;
  }, {passive: true});
  ['touchend', 'touchcancel'].forEach(type => window.addEventListener(type, () => {
    touchActive = false; scheduleSettle();
  }, {passive: true}));
  window.addEventListener('scrollend', scheduleSettle, {passive: true});
  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.target?.closest('input, textarea, select, [contenteditable="true"]') || modalLocked) return;
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
      cancelAnimation(); manualScroll = true;
      scrollDirection = ['ArrowUp', 'PageUp', 'Home'].includes(event.key) ? -1 : 1;
      scheduleSettle();
    }
  });
  window.addEventListener('resize', () => {
    const continueSnap = snapping || manualScroll || Boolean(animationFrame);
    cancelAnimation(); requestMeasure();
    if (continueSnap) { manualScroll = true; scheduleSettle(); }
  }, {passive: true});
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
