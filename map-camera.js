// A map camera: transform the drawing, never scroll an inner document.
export function mapCamera(viewport, drawing, {width,height,onZoom=()=>{}}){
 let scale=1,x=0,y=0,drag=null,suppressClick=false;
 const clamp=v=>Math.max(.12,Math.min(2.5,v));
 function apply(){drawing.style.transformOrigin='0 0';drawing.style.transform=`translate(${x}px, ${y}px) scale(${scale})`;viewport.dataset.camera=`${x},${y},${scale}`;onZoom(scale);}
 function zoomTo(next,anchor={x:viewport.clientWidth/2,y:viewport.clientHeight/2}){next=clamp(next);const ratio=next/scale;x=anchor.x-(anchor.x-x)*ratio;y=anchor.y-(anchor.y-y)*ratio;scale=next;apply();}
 function fit(){scale=clamp(Math.min((viewport.clientWidth-32)/width,(viewport.clientHeight-32)/height,1));x=(viewport.clientWidth-width*scale)/2;y=(viewport.clientHeight-height*scale)/2;apply();}
 function center(cx,cy,next=scale){scale=clamp(next);x=viewport.clientWidth/2-cx*scale;y=viewport.clientHeight/2-cy*scale;apply();}
 viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x,y,moved:false};});
 viewport.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;if(!drag.moved&&Math.hypot(dx,dy)>4){drag.moved=true;viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');}if(drag.moved){x=drag.x+dx;y=drag.y+dy;apply();}});
 function end(e){if(!drag||drag.id!==e.pointerId)return;suppressClick=drag.moved;drag=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);}
 viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 viewport.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
 viewport.addEventListener('wheel',e=>{e.preventDefault();const box=viewport.getBoundingClientRect();zoomTo(scale*Math.exp(-e.deltaY*.0015),{x:e.clientX-box.left,y:e.clientY-box.top});},{passive:false});
 viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const moves={ArrowLeft:[70,0],ArrowRight:[-70,0],ArrowUp:[0,70],ArrowDown:[0,-70]};if(moves[e.key]){e.preventDefault();x+=moves[e.key][0];y+=moves[e.key][1];apply();}if(['+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0')fit();else zoomTo(scale*(e.key==='-'?.85:1.15));}});
 const observer=new ResizeObserver(()=>{if(!viewport.isConnected)observer.disconnect();});observer.observe(viewport);
 return {fit,center,zoomTo,getScale:()=>scale,setSize(w,h){width=w;height=h;},apply};
}
