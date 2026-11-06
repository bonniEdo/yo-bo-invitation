(() => {
  'use strict';
  const dialog = document.getElementById('survey-dialog');
  const form = document.getElementById('survey-form');
  const status = document.getElementById('form-status');
  const submit = document.getElementById('submit-button');

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pageHearts = document.createElement('div');
  const dialogHearts = document.createElement('div');
  [pageHearts, dialogHearts].forEach(layer => {
    layer.className = 'survey-heart-layer'; layer.setAttribute('aria-hidden','true');
  });
  document.body.append(pageHearts); dialog.append(dialogHearts);
  document.addEventListener('click', event => {
    if (reducedMotion.matches || event.detail === 0 || event.button !== 0 || event.target.closest('input,textarea,select,option,label,#love-charge')) return;
    const layer = dialog.open ? dialogHearts : pageHearts;
    const rect = dialog.open ? dialog.getBoundingClientRect() : {left:0,top:0};
    for (let i=0;i<6;i++) {
      while (layer.childElementCount>=72) {
        const old=layer.firstElementChild;
        old.getAnimations().forEach(animation=>animation.cancel()); old.remove();
      }
      const heart=document.createElementNS('http://www.w3.org/2000/svg','svg');
      heart.setAttribute('viewBox','0 0 24 24'); heart.classList.add('survey-tap-heart');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12Z');heart.append(path);
      heart.style.left=`${event.clientX-rect.left}px`;heart.style.top=`${event.clientY-rect.top}px`;
      heart.style.width=`${12+Math.random()*12}px`;heart.style.color=['#ee9857','#e77835','#f5b477'][i%3];
      layer.append(heart);
      const dx=(Math.random()-.5)*130,rise=65+Math.random()*100;
      const animation=heart.animate([
        {transform:'translate(-50%,-50%) scale(.35)',opacity:0},
        {transform:`translate(calc(-50% + ${dx*.3}px),-35px) scale(1)`,opacity:1,offset:.2},
        {transform:`translate(calc(-50% + ${dx}px),-${rise}px) scale(.7) rotate(${dx*.5}deg)`,opacity:0}
      ],{duration:900+Math.random()*450,easing:'cubic-bezier(.2,.6,.4,1)',fill:'forwards'});
      animation.onfinish=animation.oncancel=()=>heart.remove();
    }
  });

  const charge = document.getElementById('love-charge');
  const water = charge.querySelector('.love-water-level');
  const chargeArt = charge.querySelector('.love-charge-art');
  const loveCelebration = document.getElementById('love-celebration');
  const chargeStatus = document.getElementById('love-charge-status');
  let loveLevel = 20, loveBusy = false, lovePulse = null;
  function burstLove() {
    charge.classList.add('is-full');
    loveCelebration.hidden = false;
    chargeStatus.textContent = '愛心補滿了，送你一個飛吻！😘';
    charge.setAttribute('aria-label','愛心已補滿，再點一次重新開始');
    if (reducedMotion.matches) { loveBusy = false; return; }
    loveCelebration.animate([
      {transform:'translate(-50%,-50%) scale(.2) rotate(-18deg)',opacity:0},
      {transform:'translate(-50%,-50%) scale(1.3) rotate(-5deg)',opacity:1,offset:.55},
      {transform:'translate(-50%,-50%) scale(1) rotate(-8deg)',opacity:1}
    ], {duration:850,easing:'cubic-bezier(.2,.7,.3,1)'});
    const bloom = chargeArt.animate([
      {transform:'scale(1)'}, {transform:'scale(.9)',offset:.12},
      {transform:'scale(1.9)',offset:.46}, {transform:'scale(1.12)',offset:.78},
      {transform:'scale(1.18)'}
    ], {duration:900,easing:'cubic-bezier(.2,.7,.3,1)'});
    const ring = document.createElementNS('http://www.w3.org/2000/svg','svg');
    ring.setAttribute('viewBox','0 0 100 100');ring.classList.add('love-burst-ring');ring.setAttribute('aria-hidden','true');
    const outline = document.createElementNS('http://www.w3.org/2000/svg','use');outline.setAttribute('href','#love-shape');ring.append(outline);charge.append(ring);
    const ripple=ring.animate([
      {transform:'translate(-50%,-50%) scale(.7)',opacity:.8},
      {transform:'translate(-50%,-50%) scale(2.8)',opacity:0}
    ],{duration:850,easing:'ease-out'});
    ripple.onfinish=ripple.oncancel=()=>ring.remove();
    for(let i=0;i<12;i++){
      const heart=document.createElementNS('http://www.w3.org/2000/svg','svg');heart.setAttribute('viewBox','0 0 24 24');heart.setAttribute('aria-hidden','true');heart.classList.add('love-burst-heart');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12Z');heart.append(path);charge.append(heart);
      const angle=i/12*Math.PI*2,dx=Math.cos(angle)*95,dy=Math.sin(angle)*85;
      const flight=heart.animate([
        {transform:'translate(-50%,-50%) scale(.3)',opacity:0},
        {transform:`translate(calc(-50% + ${dx*.55}px),calc(-50% + ${dy*.55}px)) scale(1)`,opacity:1,offset:.25},
        {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy+20}px)) scale(.5)`,opacity:0}
      ],{duration:1000,easing:'cubic-bezier(.2,.7,.3,1)'});
      flight.onfinish=flight.oncancel=()=>heart.remove();
    }
    bloom.finished.catch(()=>{}).finally(()=>{loveBusy=false;});
  }
  charge.addEventListener('click',()=>{
    if(loveBusy)return;
    if(loveLevel===100){loveLevel=20;charge.classList.remove('is-full');loveCelebration.hidden=true;}
    else loveLevel+=20;
    charge.dataset.charge=String(loveLevel);
    // Fill from the tapered tip to above both rounded lobes.
    water.style.transform=`translateY(${90-loveLevel*.75}px)`;
    charge.setAttribute('aria-label',`點一下幫愛心加滿，目前 ${loveLevel}%`);
    chargeStatus.textContent=`愛心已補滿 ${loveLevel}%`;
    if(lovePulse){lovePulse.cancel();lovePulse=null;}
    if(!reducedMotion.matches&&loveLevel<100)lovePulse=chargeArt.animate([
      {transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}
    ],{duration:280,easing:'ease-out'});
    if(loveLevel===100){loveBusy=true;setTimeout(burstLove,reducedMotion.matches?0:460);}
  });

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
    const confirmed = data.get('attendance') === 'yes';
    const digitalOnly = ['maybe','no'].includes(data.get('attendance'));
    form.querySelectorAll('[name=invitationFormat]').forEach(input => {
      const unavailable = digitalOnly && input.value !== 'digital';
      if (unavailable) input.checked = false;
      input.disabled = unavailable;
      input.closest('label').hidden = unavailable;
    });
    document.getElementById('count-field').hidden = !confirmed; count.disabled = !confirmed;
    document.getElementById('no-attendance-reaction').hidden = data.get('attendance') !== 'no';
    document.getElementById('bus-field').hidden = !confirmed; document.getElementById('bus-field').disabled = !confirmed;
    const takingBus = confirmed && form.querySelector('[name=bus]:checked')?.value === 'yes';
    document.getElementById('bus-count-field').hidden = !takingBus; busCount.disabled = !takingBus;
    const guests = Number(count.value);
    if (Number.isSafeInteger(guests) && guests >= 1) {
      busCount.max = String(guests);
      if (Number(busCount.value) > guests) busCount.value = String(guests);
    } else busCount.removeAttribute('max');
  }
  form.addEventListener('change',sync); count.addEventListener('input',sync); sync();
  // Inline, accessible validation replaces the browser's unstyled popup.
  form.noValidate = true;
  let validationAttempted = false;
  const errorNodes = new Map();
  function validateSurvey(focusFirst = false) {
    errorNodes.forEach(({node, controls}, id) => {
      node.remove();
      controls.forEach(control => {
        control.removeAttribute('aria-invalid');
        const descriptions = (control.getAttribute('aria-describedby') || '').split(' ').filter(value => value && value !== id);
        if (descriptions.length) control.setAttribute('aria-describedby', descriptions.join(' '));
        else control.removeAttribute('aria-describedby');
      });
    });
    errorNodes.clear();
    let first = null;
    const visited = new Set();
    [...form.elements].filter(control => control.willValidate).forEach(control => {
      if (control.validity.valid && !(control.name === 'guestName' && !control.value.trim())) return;
      if (visited.has(control.name)) return;
      visited.add(control.name);
      first ||= control;
      const message = control.name === 'guestName' ? '請填寫您的姓名。'
        : control.name === 'attendance' ? '請選擇您的出席意願。'
        : control.name === 'invitationFormat' ? '請選擇您想收到的喜帖形式。'
        : control.name === 'bus' ? '請選擇是否搭乘遊覽車。'
        : control.name === 'busCount' ? `請填寫 1 至 ${count.value} 位搭車人數。`
        : '請填寫至少 1 位的整數人數。';
      const id = 'error-' + control.name;
      const node = document.createElement('p'); node.id = id; node.className = 'field-error'; node.textContent = message;
      const controls = [...form.elements].filter(item => item.name === control.name);
      controls.forEach(item => {
        item.setAttribute('aria-invalid', 'true');
        item.setAttribute('aria-describedby', [item.getAttribute('aria-describedby'),id].filter(Boolean).join(' '));
      });
      (control.closest('.field') || control.closest('fieldset')).append(node);
      errorNodes.set(id, {node, controls});
    });
    if (first && focusFirst) first.focus({preventScroll:false});
    return !first;
  }
  ['input','change'].forEach(type => form.addEventListener(type, () => { if (validationAttempted) validateSurvey(); }));
  if (!window.SURVEY_CONFIG?.googleFields || !window.SURVEY_CONFIG?.choiceValues) {
    status.textContent = '調查表設定中，暫未開放送出。';
    submit.disabled = true;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    validationAttempted = true;
    if (!validateSurvey(true)) return;
    const data = new FormData(form);
    const record = {invitationFormat:data.get('invitationFormat'),guestName:String(data.get('guestName')||'').trim(),attendance:data.get('attendance'),guestCount:data.get('attendance')==='yes'?Number(count.value):data.get('attendance')==='no'?0:null,bus:data.get('attendance')==='yes'?data.get('bus'):data.get('attendance')==='maybe'?'maybe':'no',busCount:data.get('attendance')==='yes'&&data.get('bus')==='yes'?Number(busCount.value):0,message:String(data.get('message')||'').trim()};
    if (!record.guestName) { status.textContent='請填寫您的姓名。'; document.getElementById('guest-name').focus(); return; }
    if (!['yes','maybe','no'].includes(record.attendance)||!['yes','maybe','no'].includes(record.bus)||(record.attendance==='yes'&&(!Number.isSafeInteger(record.guestCount)||record.guestCount<1))||!Number.isSafeInteger(record.busCount)||record.busCount<0||record.busCount>(record.guestCount||0)) { status.textContent='請確認出席與搭車人數。'; return; }
    if (record.invitationFormat && !['digital','paper','both'].includes(record.invitationFormat)) { status.textContent='請選擇您想收到的喜帖形式。'; return; }
    if (record.attendance !== 'yes' && record.invitationFormat && record.invitationFormat !== 'digital') { status.textContent='請選擇電子喜帖。'; return; }
    const config=window.SURVEY_CONFIG||{},fields=config.googleFields,choices=config.choiceValues;
    if (!fields || !choices) { status.textContent='表單連線設定中，暫時請直接告訴鑫佑或宛瑩。'; status.focus(); return; }
    if (record.attendance !== 'yes' && !choices.guestCount?.['0']) {
      status.textContent='無法出席的回覆尚未開放送出，請先直接告訴鑫佑或宛瑩。'; status.focus(); return;
    }
    let url,body;
    try {
      url=new URL(config.googleFormUrl);
      if(url.origin!=='https://docs.google.com'||!/^\/forms\/d\/e\/[\w-]+\/viewform$/.test(url.pathname)||url.username||url.password)throw new Error();
      const params=new URLSearchParams({fvv:'1',pageHistory:'0'});
      const message=[record.message,record.invitationFormat ? `【喜帖形式】${{digital:'電子喜帖',paper:'紙本喜帖',both:'我都要（電子喜帖＋紙本喜帖）'}[record.invitationFormat]}` : '',record.attendance==='no'?'【出席人數】不出席':record.attendance==='maybe'?'【出席人數】尚未確定，暫未填寫':`【出席人數】${record.guestCount} 位`,`【基隆遊覽車】${{yes:'需要搭乘',no:'自行前往',maybe:'尚未確定'}[record.bus]}${record.busCount?`，${record.busCount} 位`:''}`].filter(Boolean).join('\n');
      const values={...record,attendance:choices.attendance?.[record.attendance],guestCount:record.attendance==='yes'?(choices.guestCount?.[String(record.guestCount)]||config.customGuestCount):choices.guestCount?.['0'],bus:choices.bus?.[record.bus],message};
      for(const key of ['guestName','attendance','guestCount','message'])if(!/^entry\.\d+$/.test(fields[key]||''))throw new Error();
      if(typeof values.attendance!=='string'||!values.attendance||typeof values.guestCount!=='string'||!values.guestCount)throw new Error();
      for(const [key,id] of Object.entries(fields)){
        if(!/^entry\.\d+$/.test(id)||!(key in values)||values[key]==null)throw new Error();
        params.set(id,String(values[key]));
        if (config.checkboxFields?.includes(key)) params.set(`${id}_sentinel`, '');
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
      document.getElementById('receipt-note').textContent='若有變動\n再跟我們說';
      document.getElementById('receipt-note').hidden=record.attendance==='maybe';
      document.getElementById('response-summary').textContent={yes:"太棒了！婚禮見！ 🥳",maybe:"好的\n猶豫好再跟我們說",no:"那就另約啦 ☺️"}[record.attendance];
      document.getElementById('invitation-confirmation').textContent={digital:'已預定『電子喜帖』',paper:'已預訂『紙本喜帖』',both:'已預訂『兩種喜帖』'}[record.invitationFormat] || '';
      document.getElementById('invitation-confirmation').hidden=!record.invitationFormat;
      document.getElementById('success-title').focus({preventScroll:true});
    }catch{status.textContent='尚未確認送出，請稍後重試，填寫內容已保留。';status.focus();}
    finally{clearTimeout(timer);pending=false;submit.disabled=false;submit.textContent='送出意願 ♡';}
  });
})();
