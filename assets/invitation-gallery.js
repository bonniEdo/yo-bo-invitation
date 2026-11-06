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
  let changing = false;
  let index = 0, gesture = null, suppressClickUntil = 0;
  viewer.classList.add('gallery-ready');
  viewer.tabIndex = 0;
  const swipeHint = document.createElement('span');
  swipeHint.className = 'photo-swipe-hint';
  swipeHint.textContent = '↔ 左右滑動，翻翻我們的照片';
  viewer.append(swipeHint);
  viewer.querySelector('.story-controls').hidden = false;
  viewer.querySelector('.story-progress').hidden = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let introduced = false, effects = [], sourcePhoto = null, closingPhoto = false;
  function celebrate() {
    effects.forEach(animation => animation.cancel()); effects = [];
    if (reduced.matches) return;
    const frame = frames[index], photo = frame.querySelector('.story-photo');
    const animate = (node, keys, options) => { if (node) effects.push(node.animate(keys, options)); };
    const timing = {duration: 850, easing: 'cubic-bezier(.2,.7,.2,1)'};
    animate(photo.querySelector('img'), [{transform:'scale(1.045)',opacity:.45},{transform:'scale(1)',opacity:1}], timing);
    animate(frame.querySelector('figcaption'), [{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}], {...timing,delay:150,fill:'backwards'});
    animate(dots[index], [{transform:'scale(1)'},{transform:'scale(1.28)',offset:.5},{transform:'scale(1)'}], {duration:650});
    let light = photo.querySelector('.photo-golden-light');
    if (!light) { light = document.createElement('span'); light.className='photo-golden-light'; light.setAttribute('aria-hidden','true'); photo.append(light); }
    animate(light, [{transform:'translateX(-120%)',opacity:0},{opacity:.55,offset:.45},{transform:'translateX(120%)',opacity:0}], {duration:1000,easing:'ease-in-out'});
  }
  function show(requested, animate = true) {
    if (changing) return;
    if (animate && !reduced.matches) {
      changing = true;
      const direction = requested < index ? -1 : 1;
      const outgoing = frames[index];
      outgoing.animate([{transform:getComputedStyle(outgoing).transform,opacity:1},{transform:`translateX(${-direction*viewer.clientWidth}px) rotate(${-direction*14}deg)`,opacity:0}],{duration:260,easing:'cubic-bezier(.4,0,.2,1)'}).finished.catch(()=>{}).finally(()=>{
        changing=false;show(requested,false);
        frames[index].animate([{transform:'translateY(10px) scale(.96)'},{transform:'none'}],{duration:240,easing:'ease-out'});
      });
      return;
    }
    // Reorder the stacked cards without a horizontal carousel track.
    index = (requested + frames.length) % frames.length;
    track.style.transform = 'none';
    frames.forEach((frame, i) => {
      frame.style.setProperty('--card-order', String((i-index+frames.length)%frames.length));
      frame.classList.toggle('is-current', i === index);
      frame.classList.toggle('is-next-card', i === (index+1)%frames.length);
      frame.inert = i !== index;
      frame.setAttribute('aria-hidden', String(i !== index));
    });
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (animate) { introduced = true; celebrate(); }
    status.textContent = `第 ${index + 1} 張，共 ${frames.length} 張`;
  }
  function enlarge(photo) {
    const img = photo.querySelector('img');
    if (!img) return;
    const full = document.getElementById('photo-full');
    sourcePhoto = img;
    const start = img.getBoundingClientRect();
    full.src = img.src; full.alt = img.alt;
    window.InvitationModal.open(document.getElementById('photo-dialog'), document.getElementById('photo-close'));
    if (!reduced.matches) {
      const end = full.getBoundingClientRect();
      if (end.width && end.height) full.animate([{transform:`translate(${start.x-end.x}px,${start.y-end.y}px) scale(${start.width/end.width},${start.height/end.height})`},{transform:'none'}],{duration:700,easing:'cubic-bezier(.2,.7,.2,1)'});
    }
  }
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.storyGo))));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      viewer.classList.add('has-interacted');
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
    if (changing || !event.isPrimary || event.button !== 0 || event.target.closest('button, a')) return;
    frames[index].getAnimations().forEach(animation => animation.cancel());
    viewer.classList.add('has-interacted');
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now()};
  }, {passive:true});
  window.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId || changing) return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if (!gesture.axis && Math.max(Math.abs(dx),Math.abs(dy)) > 8) gesture.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (gesture.axis === "y") return;
    if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>8) {
      viewer.setPointerCapture(event.pointerId);
      suppressClickUntil=performance.now()+450;
      frames[index].style.transform=`translateX(${dx}px) rotate(${dx/25}deg)`;
    }
  }, {passive:true});
  window.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    // A swipe changes the slide; its following synthetic click never zooms.
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) suppressClickUntil = performance.now() + 450;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(index + (dx < 0 ? 1 : -1));
    frames.forEach(frame=>frame.style.transform='');
    if (viewer.hasPointerCapture(event.pointerId)) viewer.releasePointerCapture(event.pointerId);
    gesture = null;
  }, {passive:true});
  window.addEventListener('pointercancel', () => { frames.forEach(frame=>frame.style.transform=''); gesture = null; suppressClickUntil = performance.now() + 450; }, {passive:true});
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
  const dialog = document.getElementById('photo-dialog');
  function closePhoto(event) {
    if (!sourcePhoto || reduced.matches) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (closingPhoto) return;
    closingPhoto = true;
    const full = document.getElementById('photo-full'), start = full.getBoundingClientRect(), end = sourcePhoto.getBoundingClientRect();
    full.getAnimations().forEach(a => a.cancel());
    const animation = full.animate([{transform:'none',opacity:1},{transform:`translate(${end.x-start.x}px,${end.y-start.y}px) scale(${end.width/start.width},${end.height/start.height})`,opacity:.2}],{duration:450,easing:'cubic-bezier(.4,0,.2,1)'});
    animation.finished.catch(() => {}).finally(() => { dialog.close(); closingPhoto=false; sourcePhoto=null; });
  }
  document.getElementById('photo-close').addEventListener('click', closePhoto, true);
  dialog.addEventListener('cancel', closePhoto);
  dialog.addEventListener('click', event => { if(event.target===dialog) closePhoto(event); }, true);
  const observer = new IntersectionObserver(entries => {
    if (introduced || innerWidth >= 1000 || document.getElementById('story').getAttribute('aria-hidden') === 'true') return;
    if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .45)) { introduced=true; celebrate(); observer.disconnect(); }
  }, {threshold:[0,.45,.7]});
  observer.observe(frames[0].querySelector('.story-photo'));
  show(0, false);
})();
