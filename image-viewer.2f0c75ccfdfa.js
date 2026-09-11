const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function bindImageViewer(img,host,lang='zh'){
 const zh=lang==='zh';img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',(zh?'放大图片：':'Enlarge image: ')+img.alt);
 const open=()=>{const dialog=document.createElement('dialog');dialog.className='material-image-dialog';dialog.setAttribute('aria-label',img.alt);dialog.innerHTML=`<div class="material-image-controls"><span>${zh?'拖拽浏览图片':'Drag to pan'}</span><button data-size>${zh?'原始尺寸':'Original size'}</button><button data-close>${zh?'关闭':'Close'} ×</button></div><div class="material-image-scroll" tabindex="0"><img style="width:100%" draggable="false" src="${escape(img.src)}" alt="${escape(img.alt)}"></div>`;host.append(dialog);
 const scroller=dialog.querySelector('.material-image-scroll'),large=scroller.querySelector('img'),size=dialog.querySelector('[data-size]');let original=false,drag;
 size.onclick=()=>{original=!original;large.style.width=original?img.naturalWidth+'px':'100%';size.textContent=original?(zh?'适应窗口':'Fit window'):(zh?'原始尺寸':'Original size');scroller.scrollTo(0,0);};
 scroller.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,left:scroller.scrollLeft,top:scroller.scrollTop};scroller.setPointerCapture(e.pointerId);e.preventDefault();});
 scroller.addEventListener('pointermove',e=>{if(drag){scroller.scrollLeft=drag.left+drag.x-e.clientX;scroller.scrollTop=drag.top+drag.y-e.clientY;}});
 const stop=()=>{drag=null;};scroller.addEventListener('pointerup',stop);scroller.addEventListener('pointercancel',stop);scroller.addEventListener('lostpointercapture',stop);
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
 };img.onclick=open;img.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
}
