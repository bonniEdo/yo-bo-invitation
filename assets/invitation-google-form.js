(function(root){
  'use strict';
  const url='https://docs.google.com/forms/d/e/1FAIpQLSdkKuTSGS_u79FWXt1khwJmPGU2kSHNyYj_vrZDTjfjGS4UZg/viewform';
  const fields={
    guestName:{id:'422131427',title:'姓名',type:0},
    attending:{id:'1516813007',title:'是否參加',type:2},
    guestCount:{id:'1699498460',title:'出席人數',type:0},
    childSeats:{id:'265044724',title:'兒童座椅',type:0},
    vegetarian:{id:'216919246',title:'是否素食',type:2},
    message:{id:'1228328755',title:'給新人的話',type:1},
  };
  function build(record,formURL=url){
    const target=new URL(formURL);
    if(target.origin!=='https://docs.google.com' || !/^\/forms\/d\/e\/[a-zA-Z0-9_-]+\/viewform$/.test(target.pathname) || target.username || target.password)throw new Error('Google 表單網址設定不正確，請聯絡新人。');
    const attending=record.attending===true;
    const count=attending?Number(record.guestCount):0;
    const vegetarianCount=attending?Number(record.vegetarianCount):0;
    const childSeats=attending?Number(record.childSeats||0):0;
    if(!String(record.guestName||'').trim())throw new Error('請留下你的姓名。');
    if(!Number.isInteger(count)||count<(attending?1:0)||count>4||!Number.isInteger(vegetarianCount)||vegetarianCount<0||vegetarianCount>count||!Number.isInteger(childSeats)||childSeats<0||childSeats>Math.min(2,count))throw new Error('請確認出席、素食與兒童座椅的人數。');
    const extra=attending?[`素食人數：${vegetarianCount} 位`,...(record.dietNotes?[`飲食備註：${record.dietNotes}`]:[])]:[];
    const message=[record.message||'',...(extra.length?[`【用餐補充】\n${extra.join('\n')}`]:[])].filter(Boolean).join('\n\n');
    const values={guestName:String(record.guestName).trim(),attending:attending?'是':'否',guestCount:String(count),childSeats:String(childSeats),vegetarian:vegetarianCount>0?'是':'否',message};
    const inputs={fvv:'1',pageHistory:'0'};
    for(const [key,field] of Object.entries(fields)){
      inputs[`entry.${field.id}`]=values[key];
      if(field.type===2)inputs[`entry.${field.id}_sentinel`]='';
    }
    return {action:target.origin+target.pathname.replace(/\/viewform$/,'/formResponse'),inputs};
  }
  const api=Object.freeze({url,fields,build});
  if(typeof module==='object' && module.exports)module.exports=api;
  else root.InvitationGoogleForm=api;
})(typeof window==='object'?window:globalThis);
