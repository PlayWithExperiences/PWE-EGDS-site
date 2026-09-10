import {mapFullscreen} from './map-fullscreen.daefac7c5923.js';
import {relationName,hierarchyTypes} from './content-model.daefac7c5923.js';
import {mapCamera} from './map-camera.daefac7c5923.js';
import {valenceOf,displayTitle} from './feeling-groups.daefac7c5923.js';
export const GROUPS=['negative','neutral','positive'];
const W=1200,NW=120,NH=46,GAP=8,LEFT=24;
export function graphData(catalog, selected='', scope='all'){
 const all=catalog.entries.filter(n=>n.name.startsWith('subjective feeling - ')||n.name.startsWith('objective reason - ')||(n.category==='levers'&&n.id!==catalog.hubs.levers));
 const ids=new Set(all.map(n=>n.id));
 const edges=all.flatMap(n=>n.links.filter(e=>ids.has(e.target)).map(e=>({from:n.id,to:e.target,type:e.type,origin:e.origin||'note'})));
 let visible=ids;
 if(scope==='focus'&&ids.has(selected)){
  visible=new Set([selected]);for(const e of edges)if(e.from===selected||e.to===selected){visible.add(e.from);visible.add(e.to)}
  // Preserve the support chain beneath a selected hub, without expanding all sibling leaves.
  const byId=new Map(all.map(n=>[n.id,n]));
  for(let step=0;step<3;step++)for(const e of edges)if(e.type==='supported by'&&visible.has(e.from)&&['游戏系统 game systems','游戏机制 game mechanics'].includes(byId.get(e.from)?.name))visible.add(e.to);

 }
 const depths=leverDepths(all,edges);
 return {depths,nodes:all.filter(n=>visible.has(n.id)),edges:edges.filter(e=>visible.has(e.from)&&visible.has(e.to)),total:all.length,totalEdges:edges.length};
}
export function leverDepths(nodes,edges){
 const ids=new Set(nodes.filter(n=>n.category==='levers').map(n=>n.id)),parents=new Map([...ids].map(id=>[id,[]]));
 for(const e of edges)if(ids.has(e.from)&&ids.has(e.to)&&hierarchyTypes.includes(e.type))parents.get(e.to).push(e.from);
 const memo=new Map();function depth(id,path=new Set()){
  if(path.has(id))return 0;if(memo.has(id))return memo.get(id);
  const next=new Set(path).add(id),up=parents.get(id).filter(p=>!path.has(p));
  const value=up.length?1+Math.max(...up.map(p=>depth(p,next))):0;memo.set(id,value);return value;
 }
 return Object.fromEntries([...ids].map(id=>[id,depth(id)]));
}
export function graphLayout(data){
 const placed=[],bands=[];let y=200;
 const sections=[['feelings',GROUPS],['factors',['all']],['levers',['narrative','gameplay','aesthetics']]];
 for(const [category,groups] of sections){
  const rows=data.nodes.filter(n=>n.category===category);const top=y;
  let height=95;
  groups.forEach((group,index)=>{
   const ns=rows.filter(n=>category==='feelings'?(valenceOf(n)===group||(group==='neutral'&&valenceOf(n)==='unclassified')):category==='levers'?(n.branch||'gameplay')===group:true);
   const columns=category==='factors'?9:3;
   const x=LEFT+(groups.length===1?0:index*384);
   let offset=0;const depths=data.depths||leverDepths(data.nodes,data.edges);
   const ranks=category==='levers'?[...new Set(ns.map(n=>depths[n.id]||0))].sort((a,b)=>a-b):[0];
   for(const rank of ranks){const row=category==='levers'?ns.filter(n=>(depths[n.id]||0)===rank):ns;
    row.forEach((n,i)=>placed.push({...n,x:x+(i%columns)*(NW+GAP),y:y+78+offset+Math.floor(i/columns)*(NH+GAP),w:NW,h:NH}));
    offset+=Math.ceil(row.length/columns)*(NH+GAP)+24;
   }
   height=Math.max(height,82+offset);
  });
  bands.push({category,groups,y:top,height});y+=height+24;
 }
 return {nodes:placed,bands,width:W,height:y};
}
export function focusLayout(data,selected){
 const root=data.nodes.find(n=>n.id===selected);if(!root)return graphLayout(data);
 // Focus changes spacing and scope, never the cognitive layer of an entry.
 const placed=[],bands=[];let y=200;
 for(const category of ['feelings','factors','levers']){
  const ns=data.nodes.filter(n=>n.category===category),depths=data.depths||leverDepths(data.nodes,data.edges);
  const ranks=new Map(ns.map(n=>[n.id,category==='levers'?(depths[n.id]||0):0]));
  let rowY=y+60;
  for(const rank of [...new Set(ranks.values())].sort((a,b)=>a-b)){
   const row=ns.filter(n=>ranks.get(n.id)===rank),active=row.find(n=>n.id===selected);
   const others=row.filter(n=>n!==active);if(active)others.splice(Math.floor(others.length/2),0,active);
   const cols=Math.min(5,others.length);
   for(let i=0;i<others.length;i++){
    const line=Math.floor(i/cols),count=Math.min(cols,others.length-line*cols);
    const start=(W-count*200-(count-1)*24)/2;
    placed.push({...others[i],x:start+(i%cols)*224,y:rowY+line*66,w:200,h:46});
   }
   rowY+=Math.ceil(others.length/cols)*66;
  }
  const height=Math.max(100,rowY-y+10);bands.push({category,groups:[],y,height});y+=height+24;
 }
 return {nodes:placed,bands,width:W,height:y};
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function lines(text,limit=104,font=14){
 const out=[];let line='',width=0;
 for(const c of text){const cw=c.charCodeAt(0)>255?font:font/2;if(width+cw>limit){out.push(line);line='';width=0;}line+=c;width+=cw;}if(line)out.push(line);
 return out.length>2?[out[0],out[1].slice(0,-1)+'…']:out;
}
export function mountNetwork(host,catalog,{lang='zh',selected='',scope='all',onChange=()=>{}}={}){
 const zh=lang==='zh',allMap=new Map(catalog.entries.map(n=>[n.id,n]));
 const valid=new Set(graphData(catalog).nodes.map(n=>n.id));
 let scale=1,current=valid.has(selected)?selected:scope==='focus'?catalog.entries.find(n=>n.name==='subjective feeling - 探索 exploration')?.id:'',mode=scope==='focus'?'focus':'all';
 const label=n=>displayTitle(n,lang);
 const groupLabel={negative:zh?'负向':'Negative',neutral:zh?'中性 / 复合':'Neutral / mixed',positive:zh?'正向':'Positive',all:zh?'感受诱因':'Eliciting factors',gameplay:zh?'玩法与挑战':'Gameplay & challenges',narrative:zh?'叙事':'Narrative',aesthetics:zh?'美学':'Aesthetics'};
 const layerLabel={feelings:zh?'02 主观感受':'02 Subjective feelings',factors:zh?'03 感受诱因':'03 Eliciting factors',levers:zh?'04 设计杠杆':'04 Design levers'};
 host.innerHTML=`<div class="network-toolbar"><div class="network-modes"><button data-mode="focus">${zh?'选中节点的关系':'Selected neighborhood'}</button><button data-mode="all">${zh?'全部关系':'All relationships'}</button></div><div class="network-zoom"><button data-zoom="out" aria-label="${zh?'缩小':'Zoom out'}">−</button><output>100%</output><button data-zoom="in" aria-label="${zh?'放大':'Zoom in'}">＋</button><button data-zoom="reset">100%</button><button data-zoom="fit">${zh?'全图':'Fit graph'}</button></div></div><p class="network-help">${zh?'拖拽平移，滚轮缩放；点选词条聚拢关联内容，同类保持同层，点击空白返回全图。感受按倾向分区，连线依据笔记与作者补充。':'Drag to pan, scroll to zoom. Select a node to gather its connections while retaining their layers; click blank space to return to the full map.'}</p><div class="network-jumps">${['feelings','factors','levers'].map(k=>`<button data-jump="${k}">${layerLabel[k]} ↓</button>`).join('')}</div><div class="network-viewport" tabindex="0" aria-label="${zh?'可拖拽缩放的关系地图':'Pannable and zoomable relationship map'}"><div class="network-space"><svg class="network-svg" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${zh?'体验形态、主观感受、感受诱因、设计杠杆':'Experience forms, feelings, factors, and design levers'}"></svg></div></div><div class="network-status" role="status"></div><section class="network-inspector" aria-live="polite"></section>`;
 const viewport=host.querySelector('.network-viewport'),svg=host.querySelector('svg'),space=host.querySelector('.network-space');let layout,data,camera;
 function zoom(){if(!camera){camera=mapCamera(viewport,svg,{width:layout.width,height:layout.height,onZoom:value=>{scale=value;host.querySelector('output').textContent=Math.round(value*100)+'%';}});camera.center(layout.width/2,viewport.clientHeight/2,1);}else{camera.setSize(layout.width,layout.height);camera.apply();}}
 function draw(){
  data=graphData(catalog,current,mode);layout=mode==='focus'?focusLayout(data,current):graphLayout(data);const map=new Map(layout.nodes.map(n=>[n.id,n]));const connected=new Set(current?[current]:[]);for(const e of data.edges)if(e.from===current||e.to===current){connected.add(e.from);connected.add(e.to);}
  svg.setAttribute('width',layout.width);svg.setAttribute('height',layout.height);
  let html=`<defs><marker id="recorded-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="currentColor"/></marker></defs>`;
  html+=`<rect x="0" y="0" width="1200" height="174" class="network-band"/><text x="24" y="30" class="network-layer-title">${zh?'01 体验形态 · 观察尺度':'01 Experience form · observation scale'}</text>`;
  const forms=zh?['体验曲线','体验段落','体验循环','体验瞬间']:['Experience curve','Experience passage','Experience loop','Experience moment'];
  forms.forEach((name,i)=>{html+=`<a href="#/entry/form-${i}" class="network-form"><rect x="${468}" y="${43+i*30}" width="264" height="26" rx="3"/><text x="${480}" y="${61+i*30}">${i+1}. ${name}</text></a>`});
  for(const band of layout.bands){html+=`<rect x="0" y="${band.y}" width="1200" height="${band.height}" class="network-band ${band.category}"/><text x="24" y="${band.y+28}" class="network-layer-title">${layerLabel[band.category]}</text>`;
   band.groups.forEach((g,i)=>{html+=`<text x="${LEFT+i*384}" y="${band.y+59}" class="network-group ${g}">${escape(groupLabel[g])}</text>`});
  }
  if(mode==='focus')for(const group of layout.focusGroups||[]){html+=`<rect x="${group.x}" y="${group.y}" width="${group.width}" height="${group.height}" rx="4" class="focus-group-bg"/><text x="${group.x+12}" y="${group.y+22}" class="focus-group-label">${escape(relationName(group.type,lang))}</text><text x="${group.x+12}" y="${group.y+41}" class="focus-group-direction">${group.direction==='out'?(zh?'从选中词条出发':'From selected entry'):group.direction==='in'?(zh?'指向选中词条':'To selected entry'):(zh?'下级支撑链':'Supporting chain')}</text>`;}
  for(const e of data.edges){const a=map.get(e.from),b=map.get(e.to);const adjacent=e.from===current||e.to===current;let path;
   if(Math.abs(a.y-b.y)<NH+GAP){const ax=a.x+a.w/2,bx=b.x+b.w/2,ay=a.y;path=`M${ax} ${ay} C${ax} ${ay-25} ${bx} ${b.y-25} ${bx} ${b.y}`;}
   else {const down=a.y<b.y;const ax=a.x+a.w/2,ay=a.y+(down?a.h:0),bx=b.x+b.w/2,by=b.y+(down?0:b.h);const mid=(ay+by)/2;path=`M${ax} ${ay} C${ax} ${mid} ${bx} ${mid} ${bx} ${by}`;}
   html+=`<path d="${path}" class="network-edge ${adjacent?'highlight':mode==='all'&&current?'muted-edge':mode==='focus'?'focus-edge':''}" data-from="${e.from}" data-to="${e.to}" data-relation="${escape(e.type)}" ${adjacent||mode==='focus'?'marker-end="url(#recorded-arrow)"':''}><title>${escape(label(a)+' — '+e.type+' → '+label(b))}</title></path>`;
  }
  for(const n of layout.nodes){const ls=lines(label(n),n.w-16,n.id===current&&mode==='focus'?16:14);html+=`<g class="network-node ${n.id===current?'selected':''} ${mode==='all'&&current&&!connected.has(n.id)?'unrelated':''} ${n.category==='feelings'?valenceOf(n):n.category}" tabindex="0" role="button" aria-pressed="${n.id===current}" aria-label="${escape(label(n))}" data-layer="${n.category}" data-node="${n.id}" transform="translate(${n.x},${n.y})"><title>${escape(label(n))}</title><rect width="${n.w}" height="${n.h}" rx="3"/>${ls.map((l,i)=>`<text x="${n.id===current&&mode==='focus'?n.w/2:8}" text-anchor="${n.id===current&&mode==='focus'?'middle':'start'}" y="${ls.length===1?n.h/2+5:n.h/2-4+i*17}">${escape(l)}</text>`).join('')}</g>`;}
  svg.innerHTML=html;zoom();
  if(mode==='focus')camera.fit();host.querySelector('.network-jumps').hidden=mode==='focus';svg.classList.toggle('focus-layout',mode==='focus');
  host.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  host.querySelector('.network-status').textContent=zh?`当前 ${data.nodes.length} / ${data.total} 个核心词条，${data.edges.length} 条关系。${mode==='focus'?'关联内容已聚拢，保留所属层级。':''}`:`${data.nodes.length} / ${data.total} core entries; ${data.edges.length} recorded links.${mode==='focus'?' Connections gathered within their original layers.':''}`;
  const n=allMap.get(current);const edges=n?graphData(catalog).edges.filter(e=>e.from===current||e.to===current):[];
  host.querySelector('.network-inspector').innerHTML=n?`<div><span>${zh?'已选择':'Selected'} · ${layerLabel[n.category]||''}</span><h2>${escape(label(n))}</h2><a href="#/entry/${n.id}">${zh?'阅读词条':'Read entry'} →</a></div><div class="network-relations">${edges.length?relationGroups(edges,current,allMap,label,zh):`<p>${zh?'当前范围内尚无已记录连线。':'No recorded connections in this view.'}</p>`}</div>`:`<p>${zh?'选择一个词条，查看它的分组关系。':'Select an entry to inspect its grouped relationships.'}</p>`;
 }
 function select(id){current=id;mode='focus';draw();svg.querySelector(`[data-node="${id}"]`)?.focus({preventScroll:true});viewport.scrollIntoView({block:'nearest',behavior:'instant'});onChange({selected:current,scope:mode});}
 function reset(){current='';mode='all';draw();camera.fit();onChange({selected:'',scope:'all'});}
 viewport.addEventListener('click',e=>{if(!e.target.closest('[data-node],a,button,.network-edge'))reset();});
 svg.addEventListener('click',e=>{const n=e.target.closest('[data-node]');if(n)select(n.dataset.node)});
 svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const n=e.target.closest('[data-node]');if(n){e.preventDefault();select(n.dataset.node);svg.querySelector(`[data-node="${n.dataset.node}"]`)?.focus({preventScroll:true})}}});
 host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mode){mode=b.dataset.mode;if(mode==='all')current='';if(mode==='focus'&&!current)current=catalog.entries.find(n=>n.name==='subjective feeling - 探索 exploration')?.id;scale=1;draw();onChange({selected:current,scope:mode});camera.fit()}
  if(b.dataset.select)select(b.dataset.select);
  if(b.dataset.zoom){if(b.dataset.zoom==='fit')camera.fit();else camera.zoomTo(b.dataset.zoom==='reset'?1:camera.getScale()+(b.dataset.zoom==='in'?.15:-.15));}
  if(b.dataset.jump){const band=layout.bands.find(x=>x.category===b.dataset.jump);camera.center(layout.width/2,band.y+Math.min(band.height,500)/2,Math.min(1,(viewport.clientWidth-30)/layout.width));}

 });
 draw();
 mapFullscreen(host,host.querySelector('.network-zoom'),{lang,onResize:()=>camera.fit()});
}

function relationGroups(edges,current,allMap,label,zh){
 const directions=[['out',zh?'这个词条指向':'Links from this entry'],['in',zh?'指向这个词条':'Links to this entry']];
 const translations={'caused by':'由……引发','driven by':'由……驱动','enhanced by':'由……增强','supported by':'由……支持','achieved with':'通过……实现','affected by':'受……影响','related':'相关','including':'包含','contributes to':'有助于','against':'相对','have example':'案例'};
 return directions.map(([direction,heading])=>{
  const selected=edges.filter(e=>direction==='out'?e.from===current:e.to===current);if(!selected.length)return '';
  const groups=new Map();for(const e of selected){if(!groups.has(e.type))groups.set(e.type,[]);groups.get(e.type).push(e);}
  return `<section class="network-relation-direction"><h3>${heading}</h3>${[...groups].map(([type,items])=>`<details class="network-relation-group" open><summary>${escape(zh?(translations[type]||type):type)} <small>${items.length}</small></summary><ul>${items.map(e=>{const id=direction==='out'?e.to:e.from;return `<li><button data-select="${id}">${escape(label(allMap.get(id)))}${e.origin==='author-clarification'?` <small>${zh?'作者补充':'Author clarification'}</small>`:''}</button></li>`}).join('')}</ul></details>`).join('')}</section>`;
 }).join('');
}
