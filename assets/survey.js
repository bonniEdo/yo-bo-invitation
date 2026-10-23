(() => {
  'use strict';
  const form = document.getElementById('survey-form');
  const status = document.getElementById('form-status');
  const button = document.getElementById('submit-button');
  const count = document.getElementById('guest-count');
  let pending = false, lastPayload = '', requestId = '';
  function syncCount() {
    const attending = ['yes', 'maybe'].includes(new FormData(form).get('attendance'));
    document.getElementById('count-field').hidden = !attending;
    count.disabled = !attending;
  }
  form.addEventListener('change', syncCount);
  syncCount();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const data = new FormData(form);
    const record = {
      guestName: String(data.get('guestName') || '').trim(),
      attendance: data.get('attendance'),
      guestCount: data.get('attendance') === 'no' ? 0 : Number(data.get('guestCount')),
      cake: data.get('cake'),
      contact: String(data.get('contact') || '').trim(),
      message: String(data.get('message') || '').trim(),
    };
    if (!record.guestName) { status.textContent = '請留下讓我們認得你的名字。'; document.getElementById('guest-name').focus(); return; }
    if (!['yes','maybe','no'].includes(record.attendance) || !['yes','maybe','no'].includes(record.cake) || !Number.isInteger(record.guestCount) || record.guestCount < (record.attendance === 'no' ? 0 : 1) || record.guestCount > 4) { status.textContent = '請確認出席意願、人數與喜餅需求。'; status.focus(); return; }
    const endpoint = window.SURVEY_CONFIG?.endpoint;
    if (!endpoint) { status.textContent = '調查尚未開放送出，請稍後再來。填寫內容仍保留在這裡。'; status.focus(); return; }
    let url;
    try { url = new URL(endpoint); if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname) || url.username || url.password) throw new Error(); }
    catch { status.textContent = '目前無法送出，請直接聯絡鑫佑或宛瑩。'; return; }
    if (!navigator.onLine) { status.textContent = '目前沒有網路，連線後再送出就好。'; return; }
    const payload = JSON.stringify(record);
    if (payload !== lastPayload) { lastPayload = payload; requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
    pending = true; button.disabled = true; button.textContent = '正在送出…'; status.textContent = '';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url.href, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({type:'attendance-survey',requestId,...record}),signal:controller.signal});
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (result.ok !== true || typeof result.receipt !== 'string' || !result.receipt.trim()) throw new Error();
      form.hidden = true;
      const labels = {yes:'應該可以出席',maybe:'出席還不確定',no:'這次無法出席'};
      const cakes = {yes:'喜餅 1 份',maybe:'喜餅之後再確認',no:'不需要喜餅'};
      document.getElementById('response-summary').textContent = `${record.guestName}，${labels[record.attendance]}${record.guestCount ? `，預估 ${record.guestCount} 位` : ''}。${cakes[record.cake]}。`;
      document.getElementById('survey-success').hidden = false;
      document.getElementById('success-title').focus({preventScroll:true});
      document.getElementById('survey-success').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
    } catch {
      status.textContent = '還沒確認收到回覆，請再試一次。你填的內容都還在。'; status.focus();
    } finally { clearTimeout(timer); pending = false; button.disabled = false; button.innerHTML = '送出我的意願 <span aria-hidden="true">♡</span>'; }
  });
})();
