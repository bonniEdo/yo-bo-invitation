(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const settings = window.WEDDING_CONFIG?.INVITATION || {};
  const config = {
    isSample:false, coupleNames:'鑫佑 & 宛瑩', englishNames:'Walker & Bonnie', date:'2027-06-19', welcomeTime:'12:00',
    banquetTime:'12:30', endTime:'15:00', replyBy:'2027-04-30',
    venueName:'晶宴・御豐館', venueRoom:'',
    venueAddress:'300新竹市東區光復里公道五路三段1號2樓', venueNote:'點選導航，從你的位置出發。', mapsQuery:'', ...settings,
  };
  const date = new Date(`${config.date}T12:00:00+08:00`);
  const shortDate = config.date.replaceAll('-', '.');
  document.querySelectorAll('[data-english-couple]').forEach(el => { el.textContent = config.englishNames; });
  document.querySelectorAll('[data-couple]').forEach(el => { el.textContent = config.coupleNames; });
  document.querySelectorAll('[data-short-date]').forEach(el => { el.textContent = shortDate; });
  document.querySelectorAll('[data-weekday]').forEach(el => { el.textContent = new Intl.DateTimeFormat('zh-TW', {weekday:'long',timeZone:'Asia/Taipei'}).format(date); });
  document.querySelectorAll('[data-long-date]').forEach(el => { el.textContent = new Intl.DateTimeFormat('zh-TW', {year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Taipei'}).format(date); });
  for (const [id, value] of Object.entries({'welcome-time':config.welcomeTime,'banquet-time':config.banquetTime,'venue-name':config.venueName,'venue-room':config.venueRoom,'venue-address':config.venueAddress,'venue-note':config.venueNote,'reply-by':config.replyBy.replaceAll('-','.')})) $(id).textContent = value;
  $('venue-room').hidden = !config.venueRoom;
  $('venue-address').hidden = !config.venueAddress;
  document.title = `${config.coupleNames}｜我們結婚了`;
  $('sample-label').hidden = !config.isSample;
  if (config.mapsQuery) {
    $('map-link').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.mapsQuery)}`;
    $('map-link').hidden = false;
    $('directions-link').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(config.mapsQuery)}`;
    $('venue-map-frame').src = `https://maps.google.com/maps?q=${encodeURIComponent(config.mapsQuery)}&output=embed&hl=zh-TW`;
  }
  if (config.mapsUrl) {
    try {
      const url = new URL(config.mapsUrl);
      if (url.protocol === 'https:' && ['maps.app.goo.gl', 'maps.google.com', 'www.google.com'].includes(url.hostname) && !url.username && !url.password) {
        $('map-link').href = url.href;
        $('directions-link').href = url.href;
        $('map-link').hidden = false;
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
  $('calendar-button').addEventListener('click', () => calendarDialog.showModal());
  $('calendar-close').addEventListener('click', () => calendarDialog.close());
  calendarDialog.addEventListener('click', event => {
    const box = calendarDialog.getBoundingClientRect();
    if (event.target === calendarDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) calendarDialog.close();
  });

  const form = $('rsvp-form');
  document.querySelector('.memory-field').hidden = true;
  $('memory-photos').disabled = true;
  let submitting = false;
  function syncVegetarians() {
    const previous = Number($('vegetarian-count').value);
    $('vegetarian-count').replaceChildren(...Array.from({length:Number($('guest-count').value)+1}, (_,i) => new Option(i ? `${i} 位素食` : '無素食需求', i)));
    $('vegetarian-count').value = Math.min(previous, Number($('guest-count').value));
    const seats = Number($('child-seats').value);
    $('child-seats').replaceChildren(...Array.from({length:Number($('guest-count').value)+1}, (_,i) => new Option(i ? `${i} 張` : '不需要', i)));
    $('child-seats').value = Math.min(seats, Number($('guest-count').value));
  }
  form.addEventListener('change', event => {
    if (event.target.name === 'attendance') {
      const attending = event.target.value === 'yes';
      $('attending-details').hidden = !attending;
      $('attending-details').disabled = !attending;
    }
    if (event.target.id === 'guest-count') syncVegetarians();
  });
  form.addEventListener('input', () => {
    $('message-count').textContent = `${$('guest-message').value.length} / 2000`;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (submitting || !form.reportValidity()) return;
    if (!$('guest-name').value.trim()) {$('guest-name').setCustomValidity('請留下你的姓名。');$('guest-name').reportValidity();return;}
    const data = new FormData(form);
    const attending = data.get('attendance') === 'yes';
    try {
      if (navigator.onLine === false) throw new Error('目前沒有網路連線，請連上網路後再試。');
      const submission = window.InvitationGoogleForm.build({
        guestName:data.get('guestName'), attending,
        guestCount:data.get('guestCount'), vegetarianCount:data.get('vegetarianCount'),
        childSeats:data.get('childSeats'), dietNotes:data.get('dietNotes'), message:data.get('message'),
      }, config.googleFormUrl || window.InvitationGoogleForm.url);
      submitting = true;
      $('submit-button').disabled = true;
      $('form-status').textContent = '正在送出你的回覆，請稍候。';
      // A visible Google response page exposes validation errors and real confirmation.
      const transport = document.createElement('form');
      transport.method = 'POST'; transport.action = submission.action;
      transport.target = '_self'; transport.hidden = true;
      for (const [name, value] of Object.entries(submission.inputs)) {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = name; input.value = value; transport.append(input);
      }
      document.body.append(transport);
      try { HTMLFormElement.prototype.submit.call(transport); }
      finally { transport.remove(); }
    } catch (error) {
      $('form-status').textContent = error.message; $('form-status').focus();
    } finally {
      submitting = false; $('submit-button').disabled = false;
    }
  });
  $('guest-name').addEventListener('input', () => $('guest-name').setCustomValidity(''));
})();
