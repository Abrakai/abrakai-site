/* V2.7.1: message creation stays entirely in the browser. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const themes = {note:['🕊️','一份小心意'],birthday:['🎂','生日快樂'],newyear:['🏮','新年祝福'],love:['💌','想對你說']};
  const fields = document.createElement('div'); fields.className='pigeon-fields';
  fields.innerHTML='<label>想送給誰？（可留白）<input id="pigeon-to" maxlength="30" placeholder="暱稱也可以，例如：小晴"></label><label>誰的小心意？（可留白）<input id="pigeon-from" maxlength="30" placeholder="例如：阿凱"></label><label class="pigeon-full">這份心意叫什麼？（可留白）<input id="pigeon-title" maxlength="50" placeholder="例如：送給你的一點陽光"></label><label>心意樣式<select id="pigeon-theme"><option value="note">🕊️ 一份小心意</option><option value="birthday">🎂 生日驚喜</option><option value="newyear">🏮 新年祝福</option><option value="love">💌 想對你說</option></select></label><label>QR 深色<select id="pigeon-color"><option value="#153b55">深海藍</option><option value="#145a43">森林綠</option><option value="#542d64">葡萄紫</option><option value="#742637">莓果紅</option></select></label><label class="pigeon-full">QR 卡片小圖示<select id="pigeon-logo-choice"><option value="none">使用主題小圖示</option><option value="studio">阿布拉.凱工作室</option><option value="custom">選自己的圖片</option></select><input id="pigeon-logo-file" type="file" accept="image/png,image/jpeg,image/webp" hidden><small class="pigeon-note">圖示放在 QR 上方，不遮住碼面。自己的圖片只在本機處理，用於下載卡片，不會放進收件連結。圖片限 2 MB。</small></label>';
  $('pigeon-input').before(fields);
  const notice=document.createElement('p'); notice.className='pigeon-note'; notice.textContent='搶先體驗中，歡迎珍惜並善用資源。未來方案若有調整，將另行公告。AI 好好玩，讓 AI 走進你我的生活。';$('pigeon-create-view').append(notice);
  const status=document.createElement('p'); status.className='pigeon-note';status.id='pigeon-qr-status';status.setAttribute('role','status');$('pigeon-result-box').append(status);
  const cardTitle=document.createElement('h3');cardTitle.className='pigeon-card-title';const cardMeta=document.createElement('p');cardMeta.className='pigeon-card-meta';const cardLogo=document.createElement('img');cardLogo.className='pigeon-card-logo';cardLogo.alt='心意卡片圖示';cardLogo.hidden=true;
  $('pigeon-qrcode-container').before(cardLogo,cardTitle,cardMeta);
  const actions=document.createElement('div');actions.className='pigeon-actions';actions.innerHTML='<button id="pigeon-copy-link" type="button">複製分享連結</button><button id="pigeon-download" type="button">下載 QR 心意卡</button>';$('pigeon-result-box').append(actions);
  const readerTitle=document.createElement('h2');readerTitle.className='pigeon-card-title';const readerMeta=document.createElement('p');readerMeta.className='pigeon-card-meta';$('pigeon-opened-box').prepend(readerTitle,readerMeta);
  const readerActions=document.createElement('div');readerActions.className='pigeon-actions';readerActions.innerHTML='<button id="pigeon-reader-wide" type="button" aria-pressed="false">放大閱讀</button>';$('pigeon-opened-box').prepend(readerActions);
  let shareURL='',packet=null,customLogo='',logoSequence=0,qrCanvas=null;
  const chars=text=>Array.from(text).length;
  $('pigeon-input').addEventListener('input',()=>{$('pigeon-count').textContent=`${chars($('pigeon-input').value)}／1000 字`;});
  window.insertEmoji=emoji=>{const input=$('pigeon-input');if(chars(input.value+emoji)>1000){showToast('已達 1000 字，請先精簡內容','⚠️');return;}input.value+=emoji;input.dispatchEvent(new Event('input'));input.focus();};
  $('pigeon-logo-choice').addEventListener('change',()=>{$('pigeon-logo-file').hidden=$('pigeon-logo-choice').value!=='custom';});
  $('pigeon-logo-file').addEventListener('change',async event=>{
    const file=event.target.files[0],sequence=++logoSequence; customLogo='';
    if(!file)return;
    if(file.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){showToast('請選 2 MB 以內的 PNG、JPG 或 WebP 圖片','⚠️');event.target.value='';return;}
    const url=URL.createObjectURL(file);
    try{const image=new Image();image.src=url;await image.decode();if(sequence!==logoSequence)return;const canvas=document.createElement('canvas');canvas.width=canvas.height=160;const scale=Math.min(160/image.width,160/image.height);canvas.getContext('2d').drawImage(image,(160-image.width*scale)/2,(160-image.height*scale)/2,image.width*scale,image.height*scale);customLogo=canvas.toDataURL('image/png');showToast('圖示已在本機準備好，請重新產生心意卡','✨');}catch{showToast('圖片無法讀取，請換一張','⚠️');}finally{URL.revokeObjectURL(url);}
  });
  function metadata(p){return [p.to?`送給：${p.to}`:'',p.from?`來自：${p.from}`:''].filter(Boolean).join('\n');}
  window.generatePigeonQR=()=>{
    const text=$('pigeon-input').value.trim();
    if(!text||chars(text)>1000){showToast(text?'內容超過 1000 字，請分成兩份心意':'先寫下想說的話吧','⚠️');return;}
    packet={v:2,text,to:$('pigeon-to').value.trim().slice(0,30),from:$('pigeon-from').value.trim().slice(0,30),title:$('pigeon-title').value.trim().slice(0,50),theme:$('pigeon-theme').value};
    shareURL=`${location.origin}${location.pathname}#pigeon=${LZString.compressToEncodedURIComponent(JSON.stringify(packet))}`;
    cardTitle.textContent=`${themes[packet.theme][0]} ${packet.title||themes[packet.theme][1]}`;cardMeta.textContent=metadata(packet);
    const logo=$('pigeon-logo-choice').value;cardLogo.hidden=logo==='none'||(logo==='custom'&&!customLogo);if(!cardLogo.hidden)cardLogo.src=logo==='studio'?'/assets/images/abrakai-studio-logo.webp':customLogo;
    $('pigeon-preview-text').textContent=text;$('pigeon-preview-text').classList.add('hidden');$('pigeon-privacy-status').textContent='🙈 內容預覽已收合';$('pigeon-privacy-btn-text').textContent='顯示原文';$('pigeon-result-box').classList.remove('hidden');
    const container=$('pigeon-qrcode-container');container.replaceChildren();qrCanvas=null;$('pigeon-download').disabled=true;
    const bytes=new TextEncoder().encode(shareURL).length;
    if(bytes>1800){status.textContent=`文字已封裝，但連結 ${bytes} bytes 太長，本次不產生過密 QR。仍可複製分享連結；或將內容分成兩張卡。`;return;}
    try{new QRCode(container,{text:shareURL,width:960,height:960,colorDark:$('pigeon-color').value,colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});qrCanvas=container.querySelector('canvas');if(!qrCanvas)throw Error('QR canvas unavailable');$('pigeon-download').disabled=false;status.textContent=bytes>1000?'內容較多，建議下載原圖或改分享連結，並先用另一支手機試掃。':'QR 已在您的裝置產生。可下載原圖分享，請先用另一支手機試掃。';}catch{container.replaceChildren();status.textContent='QR 無法產生，請縮短內容；仍可複製分享連結。';}
  };
  $('pigeon-copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(shareURL);showToast('心意連結已複製','💌');}catch{status.textContent='瀏覽器無法複製，請長按下方連結文字。';const box=document.createElement('textarea');box.value=shareURL;box.readOnly=true;box.setAttribute('aria-label','分享連結');status.after(box);box.select();}});
  $('pigeon-download').addEventListener('click',async()=>{
    if(!qrCanvas||!packet)return;
    const currentCanvas=qrCanvas,currentPacket={...packet},title=cardTitle.textContent,logo=cardLogo.hidden?'':cardLogo.src;
    try{const canvas=document.createElement('canvas');canvas.width=1088;canvas.height=1430;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#173e49';ctx.textAlign='center';ctx.font='bold 34px sans-serif';const short=Array.from(title);for(let i=0;i<short.length;i+=24)ctx.fillText(short.slice(i,i+24).join(''),544,55+(i/24)*45);ctx.font='24px sans-serif';metadata(currentPacket).split('\n').forEach((line,i)=>ctx.fillText(line,544,190+i*34));if(logo){const image=new Image();image.src=logo;await image.decode();ctx.drawImage(image,494,260,100,100);}ctx.drawImage(currentCanvas,64,384,960,960);ctx.font='24px sans-serif';ctx.fillText('掃碼打開一份心意 · 阿布拉.凱工作室',544,1390);const a=document.createElement('a');a.download=(currentPacket.title||'飛鴿傳書心意卡').replace(/[\\/:*?"<>|]/g,'-')+'.png';a.href=canvas.toDataURL('image/png');a.click();}catch{showToast('下載失敗，請再試一次','⚠️');}
  });
  const oldReader=window.showPigeonReader;
  window.showPigeonReader=data=>{
    if(typeof data!=='string'||data.length>10000){oldReader('');return;}
    let raw;try{raw=LZString.decompressFromEncodedURIComponent(data);}catch{oldReader('');return;}
    let p={text:raw,to:'',from:'',title:'',theme:'note'};
    try{const parsed=JSON.parse(raw);if(parsed?.v===2){if(typeof parsed.text!=='string'||chars(parsed.text)>1000||!themes[parsed.theme]||['to','from','title'].some(k=>typeof parsed[k]!=='string')||parsed.to.length>30||parsed.from.length>30||parsed.title.length>50)throw Error('invalid');p=parsed;}}catch(e){if(raw?.startsWith('{"v":2')){oldReader('');return;}}
    oldReader(data);if(typeof p.text!=='string'||p.text.length>10000)return;
    $('pigeon-secret-content').textContent=p.text;$('pigeon-read-view').dataset.theme=p.theme;readerTitle.textContent=`${themes[p.theme][0]} ${p.title||themes[p.theme][1]}`;readerMeta.textContent=metadata(p);
    $('pigeon-sealed-box').querySelector('h2').textContent=p.to?`${p.to}，有一份心意送給你！`:'有一份心意送給你！';
    $('pigeon-sealed-box').classList.remove('hidden');$('pigeon-opened-box').classList.add('hidden');
  };
  const spark=document.createElement('div');spark.className='pigeon-spark';spark.setAttribute('aria-hidden','true');$('pigeon-opened-box').prepend(spark);
  const oldUnseal=window.unsealPigeon;window.unsealPigeon=()=>{oldUnseal();const icon=themes[$('pigeon-read-view').dataset.theme||'note'][0];spark.textContent=`✨ ${icon} 🎉 ${icon} ✨`;$('pigeon-opened-box').classList.add('pigeon-celebrate');};
  $('pigeon-reader-wide').addEventListener('click',()=>{const wide=$('pigeon-read-view').classList.toggle('pigeon-wide');$('pigeon-reader-wide').textContent=wide?'回一般閱讀':'放大閱讀';$('pigeon-reader-wide').setAttribute('aria-pressed',String(wide));});
})();
