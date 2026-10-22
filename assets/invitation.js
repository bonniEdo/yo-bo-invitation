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
  for (const [id, value] of Object.entries({'welcome-time':config.welcomeTime,'banquet-time':config.banquetTime,'venue-name':config.venueName,'venue-room':config.venueRoom,'venue-address':config.venueAddress,'reply-by':config.replyBy.replaceAll('-','.')})) $(id).textContent = value;
  $('venue-room').hidden = !config.venueRoom;
  $('venue-address').hidden = !config.venueAddress;
  document.title = `${config.englishNames} ${config.coupleNames}｜我們結婚了`;
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
  $('calendar-button').addEventListener('click', () => calendarDialog.showModal());
  $('calendar-close').addEventListener('click', () => calendarDialog.close());
  calendarDialog.addEventListener('click', event => {
    const box = calendarDialog.getBoundingClientRect();
    if (event.target === calendarDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) calendarDialog.close();
  });

  const form = $('rsvp-form');
  let submitting = false;
  const rsvpDialog = $('rsvp-dialog');
  let savedScroll = 0;
  let savedBodyStyles = '';
  function openRsvp() {
    if (rsvpDialog.open) return;
    form.hidden = false;
    savedScroll = window.scrollY;
    savedBodyStyles = document.body.style.cssText;
    document.documentElement.classList.add('rsvp-modal-open');
    document.dispatchEvent(new Event('rsvp:lock'));
    document.body.style.position = 'fixed';
    document.body.style.top = `${-savedScroll}px`;
    document.body.style.width = '100%';
    rsvpDialog.showModal();
    $('rsvp-dialog-title').focus({ preventScroll: true });
  }
  $('rsvp-open').addEventListener('click', openRsvp);
  $('rsvp-close').addEventListener('click', () => rsvpDialog.close());
  rsvpDialog.addEventListener('close', () => {
    document.body.style.cssText = savedBodyStyles;
    document.documentElement.classList.remove('rsvp-modal-open');
    window.scrollTo({ top: savedScroll, behavior: 'instant' });
    document.dispatchEvent(new Event('rsvp:unlock'));
  });
  function syncVegetarians() {
    const previous = Number($('vegetarian-count').value);
    $('vegetarian-count').replaceChildren(...Array.from({length:Math.min(4,Number($('guest-count').value))+1}, (_,i) => new Option(i ? `${i} 位素食` : '無素食需求', i)));
    $('vegetarian-count').value = Math.min(previous, Number($('guest-count').value));
    const seats = Number($('child-seats').value);
    $('child-seats').replaceChildren(...Array.from({length:Math.min(2,Number($('guest-count').value))+1}, (_,i) => new Option(i ? `${i} 張` : '不需要', i)));
    $('child-seats').value = Math.min(seats, 2, Number($('guest-count').value));
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
  syncVegetarians();
  let requestId = null;
  let lastPayload = null;
  function showReceipt(confirmed, record) {
    const message = confirmed ? '回覆已收到，謝謝你。' : '回覆已送出，收件待確認。';
    rsvpDialog.close();
    $('rsvp-prompt').hidden = true;
    $('success-panel').hidden = false;
    $('success-title').textContent = '謝謝你的回覆。';
    $('success-message').textContent = message;
    $('success-summary').textContent = record.attending
      ? `${record.guestName}・${record.guestCount} 位出席・素食 ${record.vegetarianCount} 位・兒童椅 ${record.childSeats} 張`
      : `${record.guestName}・無法出席`;
    $('rsvp-receipt').textContent = message;
    $('rsvp-receipt').hidden = false;
    // Wait for the resized RSVP sheet to be measured before turning it.
    requestAnimationFrame(() => requestAnimationFrame(() => $('rsvp-next').click()));
  }
  $('rsvp-edit').addEventListener('click', () => {
    openRsvp();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    if (!$('guest-name').value.trim()) {
      $('guest-name').setCustomValidity('請填寫姓名。'); $('guest-name').reportValidity(); return;
    }
    const data = new FormData(form);
    const attending = data.get('attendance') === 'yes';
    const record = {
      guestName: String(data.get('guestName')).trim(), attending,
      guestCount: attending ? Number(data.get('guestCount')) : 0,
      vegetarianCount: attending ? Number(data.get('vegetarianCount')) : 0,
      childSeats: attending ? Number(data.get('childSeats')) : 0,
      dietNotes: attending ? String(data.get('dietNotes') || '') : '',
      message: String(data.get('message') || ''),
    };
    let timeout;
    try {
      if (navigator.onLine === false) throw new Error('目前沒有網路，請連線後再送出。');
      const submission = window.InvitationGoogleForm.build(record, config.googleFormUrl || window.InvitationGoogleForm.url);
      const payload = JSON.stringify(record);
      if (payload !== lastPayload) {
        requestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        lastPayload = payload;
      }
      submitting = true;
      $('submit-button').disabled = true;
      form.setAttribute('aria-busy', 'true');
      $('form-status').textContent = '正在送出…';
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 20000);
      let confirmed = false;
      if (config.rsvpEndpoint) {
        const endpoint = new URL(config.rsvpEndpoint);
        if (endpoint.origin !== 'https://script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname)) throw new Error('回覆連線設定有誤，請聯絡新人。');
        const response = await fetch(endpoint.href, {
          method: 'POST', headers: {'Content-Type': 'text/plain;charset=UTF-8'},
          body: JSON.stringify({requestId, ...record}), credentials: 'omit', signal: controller.signal,
        });
        if (!response.ok) throw new Error('目前無法確認收件，請稍後再試。');
        const result = await response.json();
        if (result.ok !== true || typeof result.receipt !== 'string' || !result.receipt) throw new Error(result.error || '目前無法確認收件，請稍後再試。');
        confirmed = true;
      } else {
        // Google Forms returns an opaque cross-origin response. This only
        // establishes a send attempt, never a verified saved response.
        await fetch(submission.action, {
          method: 'POST', mode: 'no-cors', credentials: 'omit',
          body: new URLSearchParams(submission.inputs), signal: controller.signal,
        });
      }
      $('form-status').textContent = '';
      showReceipt(confirmed, record);
    } catch (error) {
      $('form-status').textContent = error.name === 'AbortError'
        ? '連線逾時，收件狀態未確認。請稍後聯絡新人確認。'
        : error instanceof TypeError ? '連線中斷，收件狀態未確認。請稍後再試。' : error.message;
      $('form-status').focus();
    } finally {
      clearTimeout(timeout);
      submitting = false;
      $('submit-button').disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
  $('guest-name').addEventListener('input', () => $('guest-name').setCustomValidity(''));
})();
