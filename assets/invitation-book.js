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
  const soften = t => t * t * t * (t * (t * 6 - 15) + 10);
  const mix = (from, to, amount) => from + (to - from) * amount;
  let viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
  let layout = {}, frame = 0, measureFrame = 0, active = -1;
  let animationFrame = 0, animationTarget = null, wholeFlip = null, modalLocked = false;
  let settleTimer = 0, touchActive = false, manualScroll = false, scrollDirection = 1, previousScroll = window.scrollY, snapping = false;

  pages.forEach((page, index) => { page.style.zIndex = String(pages.length - index); });
  document.documentElement.classList.add('book-enabled');

  // Preserve the original mobile document order. On desktop, move the same
  // live nodes into facing leaves; existing controls keep their event handlers.
  const spreadGroups = [
    {page: pages[1], left: ['.couple-intro', '.story-introduction', '.story-next-chapter'], right: ['.story-viewer']},
    {page: pages[2], left: ['.section-heading', '.time-card', '.attendance-reminder'], right: ['.venue-card']},
    {page: pages[3], left: ['.scratch-section'], right: ['.thankyou-footer']},
  ].map(group => ({...group, body: null, nodes: ['left','right'].flatMap(side => group[side].map(selector => {
    const node = group.page.querySelector(selector);
    const marker = document.createComment('single-page position');
    node.before(marker);
    return {node, marker, side};
  }))}));
  let spreadMounted = false;
  function syncSpreads() {
    const desktop = window.innerWidth >= 1000;
    if (desktop === spreadMounted) return desktop;
    const focused = document.activeElement;
    spreadGroups.forEach(group => {
      if (desktop) {
        const body = document.createElement('div'); body.className = 'spread-body';
        const leaves = {};
        ['left','right'].forEach(side => {
          const leaf = document.createElement('div'); leaf.className = `spread-leaf spread-leaf-${side}`;
          body.append(leaf); leaves[side] = leaf;
        });
        group.nodes.forEach(item => leaves[item.side].append(item.node));
        group.page.prepend(body); group.body = body;
      } else {
        group.nodes.forEach(item => item.marker.after(item.node));
        group.body.remove(); group.body = null;
        group.page.querySelectorAll('.page-actions,.page-folio').forEach(footer => {
          footer.style.opacity = ''; footer.style.pointerEvents = ''; footer.inert = false;
        });
      }
    });
    spreadMounted = desktop;
    book.classList.toggle('has-spreads', desktop);
    if (focused !== document.body && document.activeElement !== focused && focused?.isConnected) focused.focus({preventScroll: true});
    return desktop;
  }

  function readOffset(index, offset) {
    if (index === lastPage) return 0;
    const entry = layout.entries[index];
    return clamp(offset - entry.enter, 0, entry.read);
  }

  function render() {
    frame = 0;
    if (modalLocked) return;
    const offset = window.scrollY - layout.start;
    const zoom = soften(clamp((offset - layout.coverRead) / layout.zoom));
    const turns = layout.entries.map((entry, index) => index === lastPage ? 0 : soften(clamp((offset - entry.turnStart) / layout.turn)));
    const reads = pages.map((_, index) => index === 0 ? clamp(offset, 0, layout.coverRead) : readOffset(index, offset));
    const coverRead = reads[0];
    const fit = reducedMotion.matches ? 0 : zoom;
    const closing = reducedMotion.matches ? 1 : soften(clamp((offset - layout.entries[lastPage].enter) / layout.zoom));
    const backFit = 1 - closing;
    const closingTurn = turns[lastPage - 1];
    const backWidth = mix(layout.open.width, layout.back.width, closing);
    backFlight.style.width = `${backWidth}px`;
    backFlight.style.height = `${backWidth * 1.5}px`;
    if (closingTurn < 1 && !reducedMotion.matches) {
      // The reverse of the final right leaf becomes visible after the hinge
      // passes 90 degrees. On desktop it lands to the left of the spine.
      backFlight.style.transformOrigin = '0 50%';
      const travel = layout.desktop ? 0 : layout.open.width * closingTurn;
      backFlight.style.transform = `translate(${layout.open.left - layout.back.left + travel}px, ${layout.open.top - layout.back.top}px) perspective(5000px) rotateY(${-180 * closingTurn}deg) translateX(${layout.open.width}px) rotateY(180deg)`;
    } else {
      backFlight.style.transformOrigin = '50% 50%';
      const openLeft = layout.desktop ? layout.open.left - layout.open.width : layout.open.left;
      backFlight.style.transform = `translate(${(openLeft - layout.back.left) * backFit}px, ${(layout.open.top - layout.back.top) * backFit}px) rotate(${-5 * closing}deg)`;
    }
    backMagazine.style.setProperty('--back-fit', backFit);
    pages[lastPage].style.setProperty('--closing-progress', closing);
    book.style.setProperty('--cover-presence', String(1 - zoom));
    book.style.setProperty('--cover-stack-opacity', String(1 - clamp(turns[0] * 1.4)));
    book.style.setProperty('--depth-scroll', String(reducedMotion.matches ? 0 : clamp(offset / Math.max(1, layout.coverRead + layout.zoom))));

    let sheet = 0;
    while (sheet < lastPage && offset >= layout.entries[sheet + 1].enter) sheet++;
    const currentHeight = sheet === 0 ? mix(layout.heights[0] - coverRead, layout.scene, zoom) : layout.heights[sheet] - reads[sheet];
    const visibleHeight = sheet === lastPage ? currentHeight : mix(currentHeight, layout.heights[sheet + 1], turns[sheet]);
    // Size the sticky stage to the visible sheet. A tallest-sheet spacer with
    // a negative margin leaves overflow below the footer and breaks its links.
    stage.style.height = `${visibleHeight}px`;
    stage.style.clipPath = sheet === 0 || sheet === lastPage
      ? 'inset(-50px -50px -48px -50px)' : 'inset(-50px -50px 0px -50px)';

    // A single scale controls both axes: the printed photo always stays 2:3.
    pages[0].style.transform = `translateY(${-coverRead}px)`;
    const introOpacity = reducedMotion.matches ? 1 : 1 - clamp(zoom * 1.8);
    const focusedIntro = intro.contains(document.activeElement);
    intro.inert = introOpacity === 0;
    if (intro.inert && focusedIntro) coverLink?.focus({ preventScroll: true });
    pages[0].style.setProperty('--intro-opacity', introOpacity);
    pages[0].style.visibility = turns[0] >= (reducedMotion.matches ? 0.5 : 1) ? 'hidden' : 'visible';
    const coverWidth = mix(layout.paper.width, layout.open.width, fit);
    flight.style.width = `${coverWidth}px`;
    flight.style.height = `${coverWidth * 1.5}px`;
    flight.style.transform = `translate(${(layout.open.left - layout.paper.left) * fit}px, ${(coverRead + layout.open.top - layout.paper.top) * fit}px) rotate(${-5 * (1 - fit)}deg)`;
    flight.style.setProperty('--paper-fit', fit);
    paper.style.transform = reducedMotion.matches ? 'none' : `perspective(5000px) rotateY(${-180 * turns[0]}deg)`;
    paper.style.setProperty('--turn-shade', Math.sin(turns[0] * Math.PI) * 0.19);

    // An incoming spread must fit inside the outgoing paper's visible body,
    // rather than exposing its taller lower content below the current gallery.
    const turningIndex = turns.findIndex((progress, index) => index > 0 && progress > 0 && progress < 1);
    const outgoingBody = layout.desktop && turningIndex > 0 ? pages[turningIndex].querySelector('.spread-body') : null;
    const revealBottom = outgoingBody ? Math.max(0, outgoingBody.offsetTop + outgoingBody.offsetHeight - reads[turningIndex]) : null;

    pages.slice(1).forEach((page, relative) => {
      const index = relative + 1;
      if (layout.desktop && index < lastPage) {
        page.style.transform = `translateY(${-reads[index]}px)`;
        const left = page.querySelector('.spread-leaf-left');
        const right = page.querySelector('.spread-leaf-right');
        // Swap the resting left leaf edge-on; overlapping text must never fade through.
        left.style.opacity = !reducedMotion.matches && (turns[index] >= .5 || turns[index - 1] < .5) ? '0' : '1';
        right.style.transform = reducedMotion.matches ? 'none' : `perspective(5000px) rotateY(${-180 * turns[index]}deg)`;
        right.style.setProperty('--leaf-shade', Math.sin(turns[index] * Math.PI) * .12);
        // Chapter navigation stays on its own spread, without two footers
        // overlapping while the right leaf exposes the following chapter.
        const resting = turns[index] === 0 && turns[index - 1] === 1;
        page.querySelectorAll('.page-actions,.page-folio').forEach(footer => {
          footer.style.opacity = resting ? '1' : '0';
          footer.style.pointerEvents = resting ? '' : 'none'; footer.inert = !resting;
        });
      } else {
        page.style.transform = reducedMotion.matches
          ? `translateY(${-reads[index]}px)`
          : `translateY(${-reads[index]}px) perspective(5000px) rotateY(${-180 * turns[index]}deg)`;
        if (index === lastPage - 1 && !reducedMotion.matches) {
          page.style.transform = `translateY(${-reads[index]}px) translateX(${layout.width * turns[index]}px) perspective(5000px) rotateY(${-180 * turns[index]}deg)`;
        }
      }
      // The reverse cover must not show through the front of the final leaf.
      // Explicit visibility also covers independently composited paper-edge layers.
      const notOpened = index === lastPage ? closingTurn <= .5 : index === 1 ? zoom < 1 : turns[index - 1] === 0;
      const turned = index !== lastPage && turns[index] >= (reducedMotion.matches ? .5 : 1);
      const hidden = notOpened || turned;
      page.style.visibility = hidden ? 'hidden' : 'visible';
      // Opacity also hides separately composited iframe layers in WebKit.
      page.style.opacity = hidden ? '0' : '1';
      page.style.pointerEvents = hidden ? 'none' : '';
      page.style.clipPath = revealBottom !== null && index === turningIndex + 1
        ? `inset(0px 0px ${Math.max(0, layout.heights[index] - revealBottom)}px 0px)` : '';
      page.style.setProperty('--turn-shade', layout.desktop ? 0 : Math.sin(turns[index] * Math.PI) * .19);
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
    const desktop = syncSpreads();
    const top = window.innerWidth <= 760 ? 16 : 24;
    const scene = Math.max(300, viewportHeight - top - 24);
    const zoom = Math.max(420, Math.round(scene * 0.95));
    const turn = Math.max(640, Math.round(scene * 1.35));
    const pause = Math.max(180, Math.round(scene * 0.3));
    book.style.setProperty('--scene-height', `${scene}px`);
    const heights = pages.map(page => page.offsetHeight);
    const coverRead = Math.max(0, heights[0] - scene);
    const entries = [];
    pages.forEach((page, index) => {
      const enter = index === 0 ? 0 : entries[index - 1].turnStart + turn;
      const read = index === lastPage ? 0 : Math.max(0, heights[index] - scene);
      entries.push({ enter, read, turnStart: enter + read + (index === 0 ? zoom : pause) });
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
    const width = stage.offsetWidth;
    // Desktop opens around the middle spine. Mobile has one centered portrait.
    const openWidth = Math.min(desktop ? width / 2 : width, (scene - 24) * 2 / 3);
    const open = {width: openWidth, height: openWidth * 1.5,
      left: desktop ? width / 2 : (width - openWidth) / 2,
      top: (scene - openWidth * 1.5) / 2};
    layout = {desktop, open, back: backGeometry, scene, zoom, turn, coverRead, entries, end, heights, height, paper: geometry, width,
      start: window.scrollY + book.getBoundingClientRect().top - top};
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
      return { from: points[i], to: point, duration: turning ? 1350 : 420 };
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
    ], { duration: 1450, easing: 'cubic-bezier(.42,0,.25,1)', fill: 'forwards' });
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
    settleTimer = setTimeout(settleTurn, 420);
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
    const forward = scrollDirection >= 0 ? fraction > 0.55 : fraction >= 0.45;
    let target = layout.start + (forward ? interval.end : interval.start);
    if (interval.kind === 'cover') target = chapterPosition(forward ? 1 : 0);
    if (interval.kind === 'close') target = forward ? chapterPosition(lastPage) : layout.start + layout.entries[lastPage - 1].turnStart;
    const from = window.scrollY;
    const move = top => { window.scrollTo({top, behavior: 'instant'}); cancelAnimationFrame(frame); render(); };
    if (reducedMotion.matches || Math.abs(target - from) < 2) { move(target); return; }
    const started = performance.now();
    snapping = true;
    function tick(now) {
      const progress = clamp((now - started) / 950);
      const eased = soften(progress);
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
  window.addEventListener('pointerdown', event => {
    if (modalLocked) return;
    if (event.target.closest('#scratch-card')) { cancelAnimation(); manualScroll = false; return; }
    cancelAnimation(); manualScroll = true; scheduleSettle();
  }, {passive: true});
  window.addEventListener('touchstart', event => {
    if (modalLocked) return;
    if (event.target.closest('#scratch-card')) { cancelAnimation(); manualScroll = false; return; }
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
    // iPhone toolbars change height during a swipe. Keep the reading geometry
    // until a real resize/orientation change, rather than jumping under a finger.
    const width = window.innerWidth, height = window.innerHeight;
    if (width === viewportWidth && width <= 760 && Math.abs(height - viewportHeight) < viewportHeight * 0.25) return;
    viewportWidth = width; viewportHeight = height;
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
