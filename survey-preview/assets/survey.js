(() => {
  'use strict';
  const dialog = document.getElementById('survey-dialog');
  const form = document.getElementById('survey-form');
  const status = document.getElementById('form-status');
  const submit = document.getElementById('submit-button');
  const count = document.getElementById('guest-count');
  const busCount = document.getElementById('bus-count');
  let saved = null, pending = false;
  function close() { dialog.close(); }
  document.querySelectorAll('[data-survey-open]').forEach(button => button.addEventListener('click', () => {
    if (dialog.open) return;
    saved = {top:scrollY,css:document.body.style.cssText,trigger:button};
    document.body.style.position = 'fixed';
    document.body.style.top = `${-saved.top}px`;
    document.body.style.width = '100%';
    dialog.showModal();
    document.getElementById('survey-dialog-title').focus({preventScroll:true});
  }));
  dialog.addEventListener('close', () => {
    if (!saved) return;
    document.body.style.cssText = saved.css;
    window.scrollTo({top:saved.top,behavior:'instant'});
    saved.trigger.focus({preventScroll:true}); saved = null;
  });
  document.getElementById('survey-close').addEventListener('click', close);
  document.getElementById('survey-done').addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) close(); } });
  function sync() {
    const data = new FormData(form);
    const attending = ['yes','maybe'].includes(data.get('attendance'));
    document.getElementById('count-field').hidden = !attending; count.disabled = !attending;
    document.getElementById('bus-field').hidden = !attending; document.getElementById('bus-field').disabled = !attending;
    const takingBus = attending && form.querySelector('[name=bus]:checked')?.value === 'yes';
    document.getElementById('bus-count-field').hidden = !takingBus; busCount.disabled = !takingBus;
    const previous = busCount.value;
    busCount.replaceChildren(...Array.from({length:Number(count.value)},(_,i)=>new Option(`${i+1} 位`,String(i+1))));
    busCount.value = String(Math.min(Number(previous)||1,Number(count.value)));
  }
  form.addEventListener('change',sync); sync();
  if (!window.SURVEY_CONFIG?.googleFields || !window.SURVEY_CONFIG?.choiceValues) {
    status.textContent = '調查表設定中，暫未開放送出。';
    submit.disabled = true;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const data = new FormData(form);
    const record = {guestName:String(data.get('guestName')||'').trim(),attendance:data.get('attendance'),guestCount:data.get('attendance')==='no'?0:Number(count.value),bus:data.get('attendance')==='no'?'no':data.get('bus'),busCount:data.get('attendance')!=='no'&&data.get('bus')==='yes'?Number(busCount.value):0,message:String(data.get('message')||'').trim()};
    if (!record.guestName) { status.textContent='請填寫您的姓名。'; document.getElementById('guest-name').focus(); return; }
    if (!['yes','maybe','no'].includes(record.attendance)||!['yes','maybe','no'].includes(record.bus)||!Number.isInteger(record.guestCount)||record.guestCount<0||record.guestCount>4||!Number.isInteger(record.busCount)||record.busCount<0||record.busCount>record.guestCount) { status.textContent='請確認出席與搭車人數。'; return; }
    const config=window.SURVEY_CONFIG||{},fields=config.googleFields,choices=config.choiceValues;
    if (!fields || !choices) { status.textContent='表單連線設定中，暫時請直接告訴鑫佑或宛瑩。'; status.focus(); return; }
    let url,body;
    try {
      url=new URL(config.googleFormUrl);
      if(url.origin!=='https://docs.google.com'||!/^\/forms\/d\/e\/[\w-]+\/viewform$/.test(url.pathname)||url.username||url.password)throw new Error();
      const params=new URLSearchParams({fvv:'1',pageHistory:'0'});
      const message=[record.message,`【基隆遊覽車】${{yes:'需要搭乘',no:'自行前往',maybe:'尚未確定'}[record.bus]}${record.busCount?`，${record.busCount} 位`:''}`].filter(Boolean).join('\n');
      const values={...record,attendance:choices.attendance?.[record.attendance],bus:choices.bus?.[record.bus],message};
      for(const key of ['guestName','attendance','guestCount','message'])if(!/^entry\.\d+$/.test(fields[key]||''))throw new Error();
      if(typeof values.attendance!=='string'||!values.attendance)throw new Error();
      for(const [key,id] of Object.entries(fields)){
        if(!/^entry\.\d+$/.test(id)||!(key in values)||values[key]==null)throw new Error();
        params.set(id,String(values[key]));
      }
      body=params;
    }catch{status.textContent='目前無法送出，請直接聯絡鑫佑或宛瑩。';return;}
    if(!navigator.onLine){status.textContent='目前沒有網路，請連線後再試一次。';return;}
    pending=true;submit.disabled=true;submit.textContent='正在送出…';status.textContent='';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{
      await fetch(url.href.replace('/viewform','/formResponse'),{method:'POST',mode:'no-cors',body,signal:controller.signal});
      // An opaque response cannot confirm Google has stored the submission.
      form.hidden=true;document.getElementById('survey-success').hidden=false;
      document.getElementById('success-title').textContent='回覆已送出';
      document.getElementById('receipt-note').textContent='收件待確認；若有變動，再告訴我們就好。';
      document.getElementById('response-summary').textContent=`${record.guestName}，謝謝您的回覆。`;
      document.getElementById('success-title').focus({preventScroll:true});
    }catch{status.textContent='尚未確認送出，請稍後重試，填寫內容已保留。';status.focus();}
    finally{clearTimeout(timer);pending=false;submit.disabled=false;submit.textContent='送出意願 ♡';}
  });
})();
