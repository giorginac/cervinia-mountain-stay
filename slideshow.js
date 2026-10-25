(()=>{
'use strict';
document.querySelectorAll('[data-slideshow]').forEach(shell=>{
 const slides=(shell.dataset.slides||'').split('|').filter(Boolean), img=shell.querySelector('img'), count=shell.querySelector('.preview-counter');
 if(slides.length<2||!img)return;
 let pos=0, timer=null;
 slides.forEach(src=>{const i=new Image();i.src=src});
 function show(step){pos=(pos+step+slides.length)%slides.length;img.src=slides[pos];count.textContent=`${pos+1} / ${slides.length}`;}
 function stop(){if(timer!==null){clearInterval(timer);timer=null}}
 function start(){stop();if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden)timer=setInterval(()=>show(1),5500)}
 shell.querySelector('.preview-prev').addEventListener('click',ev=>{ev.stopPropagation();show(-1);start()});
 shell.querySelector('.preview-next').addEventListener('click',ev=>{ev.stopPropagation();show(1);start()});
 shell.addEventListener('mouseenter',stop);shell.addEventListener('mouseleave',start);
 shell.addEventListener('focusin',stop);shell.addEventListener('focusout',ev=>{if(!shell.contains(ev.relatedTarget))start()});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 start();
});
})();
