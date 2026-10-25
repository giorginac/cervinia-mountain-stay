(() => {
  'use strict';
  const overlay=document.getElementById('gallery-overlay');
  if(!overlay)return;
  const image=overlay.querySelector('.gallery-big');
  const desc=overlay.querySelector('.gallery-description');
  const counter=overlay.querySelector('.gallery-counter');
  const close=overlay.querySelector('.gallery-close');
  const galleries=[...document.querySelectorAll('.gallery-row.gallery-curated')].map(row=>[...row.querySelectorAll('a.photo-tile[href]')]);
  let group=[],index=0,previousFocus=null,startX=null;
  function display(i){
    if(!group.length)return;
    index=(i+group.length)%group.length;
    const entry=group[index];
    const label=entry.querySelector('span')?.textContent?.trim()||entry.querySelector('img')?.alt||'Fotografia';
    image.src=entry.getAttribute('href'); image.alt=label;
    desc.textContent=label; counter.textContent=`${index+1} / ${group.length}`;
  }
  function open(groupIndex,photoIndex){
    group=galleries[groupIndex]||[];if(!group.length)return;
    previousFocus=document.activeElement;
    overlay.hidden=false;document.body.classList.add('gallery-is-open');display(photoIndex);
    close.focus();
  }
  function dismiss(){overlay.hidden=true;document.body.classList.remove('gallery-is-open');image.removeAttribute('src');previousFocus?.focus?.();}
  galleries.forEach((items,gi)=>items.forEach((a,ai)=>a.addEventListener('click',e=>{e.preventDefault();open(gi,ai)})));
  document.querySelectorAll('article.residence').forEach((article,gi)=>{
    const cover=article.querySelector('.residence-image img'); if(!cover)return;
    cover.tabIndex=0;cover.setAttribute('role','button');cover.setAttribute('aria-label','Apri le foto dell’appartamento');
    cover.addEventListener('click',()=>open(gi,0));
    cover.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(gi,0)}});
  });
  close.addEventListener('click',dismiss);
  overlay.querySelector('.gallery-back').addEventListener('click',()=>display(index-1));
  overlay.querySelector('.gallery-forward').addEventListener('click',()=>display(index+1));
  overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss()});
  document.addEventListener('keydown',e=>{
    if(overlay.hidden)return;
    if(e.key==='Escape'){e.preventDefault();dismiss()}
    else if(e.key==='ArrowRight'){e.preventDefault();display(index+1)}
    else if(e.key==='ArrowLeft'){e.preventDefault();display(index-1)}
  });
  overlay.addEventListener('touchstart',e=>{startX=e.changedTouches[0]?.clientX??null},{passive:true});
  overlay.addEventListener('touchend',e=>{if(startX===null)return;const dx=(e.changedTouches[0]?.clientX??startX)-startX;if(Math.abs(dx)>45)display(index+(dx<0?1:-1));startX=null},{passive:true});
})();
