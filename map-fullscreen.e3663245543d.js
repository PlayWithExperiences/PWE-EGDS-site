export function mapFullscreen(host,toolbar,{lang='zh',onResize=()=>{}}={}){
 const button=document.createElement('button');button.type='button';button.dataset.fullscreen='';toolbar.append(button);let fallback=false,oldOverflow='';
 const active=()=>document.fullscreenElement===host||fallback;
 function update(){button.textContent=lang==='zh'?(active()?'退出全屏':'全屏浏览'):(active()?'Exit fullscreen':'Fullscreen');button.setAttribute('aria-pressed',String(active()));requestAnimationFrame(()=>requestAnimationFrame(onResize));}
 function exitFallback(){fallback=false;host.classList.remove('is-map-fullscreen');document.body.style.overflow=oldOverflow;update();button.focus({preventScroll:true});}
 button.onclick=async()=>{if(fallback){exitFallback();return;}if(document.fullscreenElement===host){await document.exitFullscreen();return;}if(host.requestFullscreen){try{await host.requestFullscreen();return;}catch{}}
 oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';fallback=true;host.classList.add('is-map-fullscreen');update();};
 const observer=new MutationObserver(()=>{if(!host.isConnected){if(fallback)document.body.style.overflow=oldOverflow;observer.disconnect();}});observer.observe(document.body,{childList:true,subtree:true});
 host.addEventListener('fullscreenchange',update);host.addEventListener('keydown',e=>{if(e.key==='Escape'&&fallback){e.preventDefault();exitFallback();}});update();
}
