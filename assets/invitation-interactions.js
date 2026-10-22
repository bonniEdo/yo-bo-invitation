(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const config = window.WEDDING_CONFIG?.INVITATION || {};
  function celebrate(x = innerWidth / 2, y = innerHeight / 2) {
    if (reducedMotion.matches) return;
    for (let i = 0; i < 28; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti-bit';
      bit.style.left = `${x}px`; bit.style.top = `${y}px`;
      bit.style.background = ['#e2de8a', '#9ca682', '#242622', '#d4dac6'][i % 4];
      bit.style.borderRadius = i % 3 === 0 ? '50%' : '0';
      document.body.append(bit);
      const dx = (Math.random() - 0.5) * 350;
      const animation = bit.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${dx * 0.65}px,-100px) rotate(${i * 30}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,220px) rotate(${i * 65}deg)`, opacity: 0 }
      ], { duration: 1300 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' });
      animation.onfinish = () => bit.remove();
    }
  }
  document.querySelectorAll('.profile-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.personality');
      const extra = card.querySelector('.personality-extra');
      button.setAttribute('aria-expanded', 'true');
      card.classList.add('is-expanded');
      extra.hidden = false;
      extra.tabIndex = -1;
      extra.focus({preventScroll: true});
      button.hidden = true;
    });
  });

  const canvas = document.getElementById('scratch-canvas');
  const card = document.getElementById('scratch-card');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const revealButton = document.getElementById('scratch-reveal');
  const status = document.getElementById('scratch-status');
  const strokes = [];
  let revealed = false, drawing = false, last = null, width = 0, height = 0;
  function reveal() {
    if (revealed) return;
    revealed = true;
    card.classList.add('is-revealed');
    revealButton.textContent = '再刮一次 ↻';
    status.textContent = '恭喜你獲得神祕小禮物！婚禮當天，出示這個畫面找我們兌換。只限現場領取，禮物內容見面才揭曉。';
    const box = card.getBoundingClientRect();
    if (box.bottom > 0 && box.top < innerHeight) celebrate(box.x + box.width / 2, box.y + box.height / 2);
  }
  revealButton.addEventListener('click', () => {
    if (!revealed) { reveal(); return; }
    revealed = false; drawing = false; last = null; strokes.length = 0;
    width = 0; height = 0;
    card.classList.remove('is-revealed');
    revealButton.textContent = '直接揭曉 →';
    status.textContent = '可以再刮一次囉！';
    paint();
  });
  function erase(stroke) {
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = Math.max(34, width * 0.1);
    context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(stroke[0] * width, stroke[1] * height);
    context.lineTo(stroke[2] * width + 0.01, stroke[3] * height + 0.01);
    context.stroke();
  }
  function paint() {
    if (!context || revealed) return;
    const nextWidth = card.clientWidth, nextHeight = card.clientHeight;
    if (!nextWidth || !nextHeight) return;
    if (width === nextWidth && height === nextHeight) return;
    width = nextWidth; height = nextHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#e8e6ad'; context.fillRect(0, 0, width, height);
    context.strokeStyle = '#d6d39a'; context.lineWidth = 1;
    for (let x = -height; x < width; x += 15) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x + height, height); context.stroke();
    }
    context.fillStyle = '#30382b'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.font = '42px Georgia'; context.fillText('✷', width / 2, height / 2 - 42);
    context.font = '20px "LXGW WenKai TC"'; context.fillText('要刮不刮的🤭', width / 2, height / 2 + 7);
    context.font = '12px Arial, sans-serif'; context.fillText('A LITTLE LOVE, RESERVED FOR YOU', width / 2, height / 2 + 38);
    context.strokeStyle = '#000';
    strokes.forEach(erase);
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height];
  }
  function scratch(event) {
    if (!drawing || revealed || !context) return;
    const next = point(event), stroke = [...(last || next), ...next];
    strokes.push(stroke); erase(stroke); last = next;
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !context || revealed) return;
    event.preventDefault();
    drawing = true; last = point(event); canvas.setPointerCapture(event.pointerId); scratch(event);
  });
  canvas.addEventListener('pointermove', scratch);
  function endStroke() {
    if (!drawing) return;
    drawing = false; last = null;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0, total = 0;
    for (let i = 3; i < pixels.length; i += 64) { total++; if (pixels[i] < 80) clear++; }
    if (clear / total > 0.42) reveal();
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('lostpointercapture', endStroke);
  if (context) { new ResizeObserver(paint).observe(card); paint(); document.fonts?.ready.then(() => { width = 0; height = 0; paint(); }); }
  else canvas.hidden = true;

  const dialog = document.getElementById('photo-dialog');
  const fullPhoto = document.getElementById('photo-full');
  document.querySelectorAll('[data-photo]').forEach(slot => {
    const photo = config.photos?.[Number(slot.dataset.photo)];
    if (!photo || typeof photo !== 'string') {
      slot.closest('.photo-item')?.setAttribute('hidden', '');
      return;
    }
    let url;
    try { url = new URL(photo, location.href); } catch { return; }
    if (!['http:', 'https:'].includes(url.protocol) && !(location.protocol === 'file:' && url.protocol === 'file:')) return;
    const img = new Image();
    img.alt = Number(slot.dataset.photo) === 0 ? '鑫佑與宛瑩的合照' : '鑫佑與宛瑩的生活照片';
    img.loading = Number(slot.dataset.photo) === 0 ? 'eager' : 'lazy';
    img.addEventListener('load', () => {
      slot.querySelector('.photo-placeholder')?.remove();
      slot.classList.add('has-photo');
    });
    img.addEventListener('error', () => img.remove());
    img.src = url.href; slot.append(img);
  });
  document.querySelectorAll('.photo-open').forEach(button => {
    button.addEventListener('click', () => {
      const image = document.querySelector(`[data-photo="${Number(button.dataset.photoIndex)}"] img`);
      if (!image) return;
      fullPhoto.src = image.src;
      fullPhoto.alt = image.alt;
      window.InvitationModal.open(dialog, document.getElementById('photo-close'));
    });
  });
  document.getElementById('photo-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  function updateCountdown() {
    const target = new Date(`${config.date || '2027-06-19'}T00:00:00+08:00`).getTime();
    const days = Math.ceil((target - Date.now()) / 86400000);
    document.getElementById('days-left').textContent = String(Math.max(0, days));
    document.getElementById('countdown-label').textContent = days > 0 ? 'DAYS TO GO' : days === 0 ? 'TODAY IS THE DAY' : 'OUR NEXT CHAPTER HAS BEGUN';
  }
  updateCountdown(); setInterval(updateCountdown, 60000);

  const hearts = document.createElement('div');
  hearts.id = 'heart-layer'; hearts.setAttribute('aria-hidden', 'true');
  document.body.append(hearts);
  document.addEventListener('click', event => {
    if (reducedMotion.matches || event.detail === 0 || event.button !== 0 ||
        event.target.closest('input, textarea, select, option, label, #scratch-canvas')) return;
    for (let i = 0; i < 6; i++) {
      while (hearts.childElementCount >= 72) {
        const oldest = hearts.firstElementChild;
        oldest.getAnimations().forEach(animation => animation.cancel());
        oldest.remove();
      }
      const heart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      heart.setAttribute('viewBox', '0 0 24 24'); heart.classList.add('tap-heart');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12Z');
      heart.append(path);
      heart.style.left = `${event.clientX}px`; heart.style.top = `${event.clientY}px`;
      heart.style.width = `${12 + Math.random() * 12}px`;
      heart.style.color = ['#ee9857', '#e77835', '#f5b477'][i % 3];
      hearts.append(heart);
      const dx = (Math.random() - .5) * 130, rise = 65 + Math.random() * 100;
      const animation = heart.animate([
        {transform:'translate(-50%,-50%) scale(.35) rotate(0deg)', opacity:0},
        {transform:`translate(calc(-50% + ${dx * .3}px),-35px) scale(1) rotate(${dx * .2}deg)`, opacity:1, offset:.2},
        {transform:`translate(calc(-50% + ${dx}px),-${rise}px) scale(.7) rotate(${dx * .5}deg)`, opacity:0}
      ], {duration:900 + Math.random() * 450, easing:'cubic-bezier(.2,.6,.4,1)', fill:'forwards'});
      animation.onfinish = animation.oncancel = () => heart.remove();
    }
  });
})();
