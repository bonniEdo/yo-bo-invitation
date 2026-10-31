(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const settings = window.WEDDING_CONFIG?.INVITATION || {};
  const config = {
    isSample:false, coupleNames:'鑫佑 & 宛瑩', englishNames:'Walker & Bonnie', date:'2027-06-19', welcomeTime:'12:00',
    banquetTime:'12:30', endTime:'15:00',
    venueName:'晶宴・御豐館', venueRoom:'綺麗劇場',
    venueAddress:'300新竹市東區光復里公道五路三段1號2樓', venueNote:'點選導航，從你的位置出發。', mapsQuery:'', ...settings,
  };
  const date = new Date(`${config.date}T12:00:00+08:00`);
  const shortDate = config.date.replaceAll('-', '.');
  document.querySelectorAll('[data-english-couple]').forEach(el => { el.textContent = config.englishNames; });
  document.querySelectorAll('[data-couple]').forEach(el => { el.textContent = config.coupleNames; });
  document.querySelectorAll('[data-short-date]').forEach(el => { el.textContent = shortDate; });
  document.querySelectorAll('[data-weekday]').forEach(el => { el.textContent = new Intl.DateTimeFormat('zh-TW', {weekday:'long',timeZone:'Asia/Taipei'}).format(date); });
  document.querySelectorAll('[data-long-date]').forEach(el => {
    const parts = config.date.split('-');
    el.replaceChildren(...parts.map((value, index) => {
      const group = document.createElement('span');
      group.className = 'date-part';
      const number = document.createElement('span');
      number.className = 'date-number';
      number.textContent = value;
      const unit = document.createElement('span');
      unit.className = 'date-unit';
      unit.textContent = ['年', '月', '日'][index];
      group.append(number, unit);
      return group;
    }));
  });
  for (const [id, value] of Object.entries({'welcome-time':config.welcomeTime,'banquet-time':config.banquetTime,'venue-name':config.venueName,'venue-room':config.venueRoom,'venue-address':config.venueAddress})) $(id).textContent = value;
  $('venue-room').hidden = !config.venueRoom;
  $('venue-address').hidden = !config.venueAddress;
  document.title = `${config.coupleNames}｜${config.englishNames} 婚禮邀請`;
  $('sample-label').hidden = !config.isSample;
  if (config.mapsQuery) {
    $('directions-link').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(config.mapsQuery)}`;
    $('venue-map-frame').src = `https://maps.google.com/maps?q=${encodeURIComponent(config.mapsQuery)}&output=embed&hl=zh-TW`;
  }
  if (config.mapsUrl) {
    try {
      const url = new URL(config.mapsUrl);
      if (url.protocol === 'https:' && ['maps.app.goo.gl', 'maps.google.com', 'www.google.com'].includes(url.hostname) && !url.username && !url.password) {
        $('directions-link').href = url.href;
      }
    } catch { /* Keep the name-based map as a fallback. */ }
  }
  if (config.lineOfficialUrl) {
    try {
      const url = new URL(config.lineOfficialUrl);
      if (url.protocol === 'https:' && ['lin.ee', 'line.me'].includes(url.hostname) && !url.username && !url.password) {
        $('line-official-link').href = url.href;
        $('line-official-section').hidden = false;
      }
    } catch { /* Keep the contact link hidden until a valid URL is configured. */ }
  }


  // Offer web-based event creation as well as a normal HTTPS calendar file.
  // Blob downloads alone do not open Calendar reliably in mobile webviews.
  function calendarDate(time) { return new Date(`${config.date}T${time}:00+08:00`).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); }
  const calendarURL = new URL('https://calendar.google.com/calendar/render');
  calendarURL.search = new URLSearchParams({
    action: 'TEMPLATE',
    openExternalBrowser: '1',
    text: `${config.coupleNames} 的婚禮`,
    dates: `${calendarDate(config.welcomeTime)}/${calendarDate(config.endTime)}`,
    ctz: 'Asia/Taipei',
    location: [config.venueName, config.venueRoom, config.venueAddress].filter(Boolean).join(' '),
    details: `${config.welcomeTime} 入座，${config.banquetTime} 開席。期待與你分享幸福！${config.mapsUrl ? '\n交通導航：' + config.mapsUrl : ''}`,
  });
  $('calendar-google').href = calendarURL.href;
  if (/Line\//i.test(navigator.userAgent)) {
    $('calendar-help').textContent = '你正在 LINE 裡瀏覽。若行事曆無法開啟，請點右上角選單，改用 Safari（iPhone）或 Chrome 開啟喜帖，再加入行事曆。';
    $('calendar-copy').hidden = false;
  }
  $('calendar-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      $('calendar-copy-status').textContent = '已複製喜帖連結，請貼到 Safari 或 Chrome 開啟。';
    } catch {
      $('calendar-copy-status').textContent = '請使用 LINE 右上角選單，選擇以外部瀏覽器開啟。';
    }
  });
  const calendarDialog = $('calendar-dialog');
  $('calendar-button').addEventListener('click', () => openFixedDialog(calendarDialog, $('calendar-title')));
  $('calendar-close').addEventListener('click', () => calendarDialog.close());
  calendarDialog.addEventListener('click', event => {
    const box = calendarDialog.getBoundingClientRect();
    if (event.target === calendarDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) calendarDialog.close();
  });

  function openFixedDialog(dialog, focusTarget) {
    if (dialog.open) return;
    const savedScroll = window.scrollY;
    const savedBodyStyles = document.body.style.cssText;
    document.documentElement.classList.add('invitation-modal-open');
    document.dispatchEvent(new Event('invitation:lock'));
    document.body.style.position = 'fixed';
    document.body.style.top = `${-savedScroll}px`;
    document.body.style.width = '100%';
    dialog.addEventListener('close', () => {
      document.body.style.cssText = savedBodyStyles;
      document.documentElement.classList.remove('invitation-modal-open');
      window.scrollTo({ top: savedScroll, behavior: 'instant' });
      document.dispatchEvent(new Event('invitation:unlock'));
    }, {once: true});
    dialog.showModal();
    focusTarget?.focus({ preventScroll: true });
  }
  window.InvitationModal = {open: openFixedDialog};
  const storyDialog = $('story-dialog');
  $('story-read').addEventListener('click', () => openFixedDialog(storyDialog, $('story-reader-title')));
  [$('story-close'), $('story-reader-back')].forEach(button => {
    button.addEventListener('click', () => storyDialog.close());
  });
  // Incoming links from the former reply page now show the wedding details.
  const restoreLegacyLink = () => {
    if (location.hash !== '#rsvp') return;
    history.replaceState(null, '', '#details');
    window.dispatchEvent(new Event('hashchange'));
  };
  window.addEventListener('pageshow', () => requestAnimationFrame(restoreLegacyLink));
  window.addEventListener('hashchange', restoreLegacyLink);
})();
