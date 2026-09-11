import {focusEdgePath} from './edge-route.d0253496a8d6.js';
import {layoutLeverTree} from './lever-tree.d0253496a8d6.js';
import {bindImageViewer} from './image-viewer.d0253496a8d6.js';
import {drawingPanels,bindDrawings} from './drawing-viewer.d0253496a8d6.js';
import {mapFullscreen} from './map-fullscreen.d0253496a8d6.js';
import {relationName,hierarchyTypes} from './content-model.d0253496a8d6.js';
import {mapCamera} from './map-camera.d0253496a8d6.js';
import {valenceOf,displayTitle} from './feeling-groups.d0253496a8d6.js';
export const GROUPS=['negative','neutral','positive'];
const W=1200,NW=120,NH=46,GAP=8,LEFT=24;
export function graphData(catalog, selected='', scope='all',depth=1){
 const all=catalog.entries.filter(n=>n.name.startsWith('subjective feeling - ')||n.name.startsWith('objective reason - ')||(n.category==='levers'&&n.id!==catalog.hubs.levers));
 const ids=new Set(all.map(n=>n.id));
 const edges=all.flatMap(n=>n.links.filter(e=>ids.has(e.target)).map(e=>({from:n.id,to:e.target,type:e.type,origin:e.origin||'note'})));
 let visible=ids,pool=all,shownEdges=edges;
 if(scope==='focus'&&catalog.entries.some(n=>n.id===selected)){
  visible=new Set([selected]);for(const n of catalog.entries)for(const e of n.links)if((n.id===selected||e.target===selected)){visible.add(n.id);visible.add(e.target)}
  const direct=new Set(visible);const byId=new Map(catalog.entries.map(n=>[n.id,n]));
  // Follow explanations forward across EGDS stages, never through a category index's children.
  const stage={feelings:0,factors:1,levers:2,references:3},pathSeen=new Set([selected]);let frontier=[selected];
  const interpretationTypes=new Set(['support','caused by','driven by','achieved with','supported by','related','have example']);
  for(let step=0;step<3;step++){const next=[];for(const id of frontier){const n=byId.get(id);for(const e of n.links){const target=byId.get(e.target);if(!target||pathSeen.has(target.id)||!interpretationTypes.has(e.type))continue;
   const forward=stage[target.category]>stage[n.category],support=n.category==='levers'&&target.category==='levers'&&e.type==='supported by'&&n.branch===target.branch;
   if(forward||support){visible.add(target.id);pathSeen.add(target.id);next.push(target.id);}
  }}frontier=next;}
  // Broader two-hop neighborhoods still require an explicit choice.
  for(let hop=1;hop<Math.min(2,depth);hop++){
   const frontier=direct;for(const n of catalog.entries)for(const e of n.links)if(frontier.has(n.id)||frontier.has(e.target)){visible.add(n.id);visible.add(e.target);}
  }
  // Category hubs are represented by the layer headings, never by peer cards.
  for(const key of ['forms','feelings','factors','levers'])visible.delete(catalog.hubs[key]);
  pool=catalog.entries.filter(n=>visible.has(n.id));
  shownEdges=pool.flatMap(n=>n.links.filter(e=>visible.has(e.target)).map(e=>({from:n.id,to:e.target,type:e.type,origin:e.origin||'note'})));
 }

 const depths=leverDepths(all,edges);
 return {depths,nodes:pool.filter(n=>visible.has(n.id)),edges:shownEdges.filter(e=>visible.has(e.from)&&visible.has(e.to)),total:all.length,totalEdges:edges.length};
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
 const placed=[],bands=[],families=[];let y=200;
 const sections=[['feelings',GROUPS],['factors',['all']],['levers',['narrative','gameplay','aesthetics']]];
 for(const [category,groups] of sections){
  const rows=data.nodes.filter(n=>n.category===category);const top=y;
  let height=95;
  groups.forEach((group,index)=>{
   const ns=rows.filter(n=>category==='feelings'?(valenceOf(n)===group||(group==='neutral'&&valenceOf(n)==='unclassified')):category==='levers'?(n.branch||'gameplay')===group:true);
   if(category==='levers'){const tree=layoutLeverTree(ns,data.edges,{x:LEFT+index*384,y:y+78,width:368,columns:2});placed.push(...tree.nodes);families.push(...tree.families);height=Math.max(height,82+tree.height);return;}
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
 return {nodes:placed,bands,families,width:W,height:y};
}
export function focusLayout(data,selected){
 const root=data.nodes.find(n=>n.id===selected);
 // Focus changes spacing and scope, never the cognitive layer of an entry.
 const placed=[],bands=[],families=[];let y=200;
 for(const category of ['feelings','factors','levers',...(data.nodes.some(n=>!['feelings','factors','levers'].includes(n.category))?['references']:[])]){
  const ns=data.nodes.filter(n=>category==='references'?!['feelings','factors','levers'].includes(n.category):n.category===category),depths=data.depths||leverDepths(data.nodes,data.edges);
  if(category==='levers'){const tree=layoutLeverTree(ns,data.edges,{x:24,y:y+56,width:1152,centerRoots:true});placed.push(...tree.nodes);families.push(...tree.families);const height=Math.max(100,tree.height+64);bands.push({category,groups:[],y,height});y+=height+24;continue;}
  const ranks=new Map(ns.map(n=>[n.id,category==='levers'?(depths[n.id]||0):0]));
  let rowY=y+60;
  for(const rank of [...new Set(ranks.values())].sort((a,b)=>a-b)){
   const row=ns.filter(n=>ranks.get(n.id)===rank);const preferred=row.some(n=>n.id===selected)?selected:category==='references'?data.edges.find(e=>e.origin==='case-interpretation'&&row.some(n=>n.id===e.to))?.to:selected;const active=row.find(n=>n.id===preferred);
   const others=row.filter(n=>n!==active);if(active)others.unshift(active);
   const cols=Math.min(5,others.length);
   for(let i=0;i<others.length;i++){
    const line=Math.floor(i/cols),count=Math.min(cols,others.length-line*cols);
    const start=(W-count*200-(count-1)*24)/2;const position=active&&others.length<=5?W/2-100+(i===0?0:(i%2?-1:1)*Math.ceil(i/2)*224):start+(i%cols)*224;
    placed.push({...others[i],x:position,y:rowY+line*66,w:200,h:46});
   }
   rowY+=Math.ceil(others.length/cols)*66;
  }
  const height=Math.max(100,rowY-y+10);bands.push({category,groups:[],y,height});y+=height+24;
 }
 return {nodes:placed,bands,families,width:W,height:y};
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function lines(text,limit=104,font=14){
 const out=[];let line='',width=0;
 for(const c of text){const cw=c.charCodeAt(0)>255?font:font/2;if(width+cw>limit){out.push(line);line='';width=0;}line+=c;width+=cw;}if(line)out.push(line);
 return out.length>2?[out[0],out[1].slice(0,-1)+'…']:out;
}
export function mountNetwork(host,catalog,{lang='zh',selected='',scope='all',onChange=()=>{},renderBody=()=>''}={}){
 const zh=lang==='zh',allMap=new Map(catalog.entries.map(n=>[n.id,n]));
 const valid=new Set(catalog.entries.map(n=>n.id));
 let depth=1,scale=1,current=valid.has(selected)?selected:scope==='focus'?catalog.entries.find(n=>n.name==='subjective feeling - 探索 exploration')?.id:'',mode=scope==='focus'?'focus':'all';
 const label=n=>displayTitle(n,lang);
 const groupLabel={negative:zh?'负向':'Negative',neutral:zh?'中性 / 复合':'Neutral / mixed',positive:zh?'正向':'Positive',all:zh?'感受诱因':'Eliciting factors',gameplay:zh?'玩法与挑战':'Gameplay & challenges',narrative:zh?'叙事':'Narrative',aesthetics:zh?'美学':'Aesthetics'};
 const layerLabel={feelings:zh?'02 主观感受':'02 Subjective feelings',factors:zh?'03 感受诱因':'03 Eliciting factors',levers:zh?'04 设计杠杆':'04 Design levers',references:zh?'案例与素材 · 不属于认知层级':'Examples & sources · outside the cognitive layers'};
 host.innerHTML=`<div class="network-toolbar"><div class="network-modes"><button data-mode="focus">${zh?'选中节点的关系':'Selected neighborhood'}</button><button data-mode="all">${zh?'全部关系':'All relationships'}</button></div><label class="network-depth">${zh?'关联深度':'Link depth'} <select data-depth><option value="1">${zh?'解释链 · 默认':'Explanation chain'}</option><option value="2">${zh?'扩展 · 两跳关联':'Expand two hops'}</option></select></label><div class="network-zoom"><button data-zoom="out" aria-label="${zh?'缩小':'Zoom out'}">−</button><output>100%</output><button data-zoom="in" aria-label="${zh?'放大':'Zoom in'}">＋</button><button data-zoom="reset">100%</button><button data-zoom="fit">${zh?'全图':'Fit graph'}</button></div></div><p class="network-help">${zh?'拖拽平移，滚轮缩放；点选词条聚拢关联内容，同类保持同层，点击空白返回全图。感受按倾向分区，连线依据笔记与作者补充。':'Drag to pan, scroll to zoom. Select a node to gather its connections while retaining their layers; click blank space to return to the full map.'}</p><p class="network-hierarchy-key">${zh?'设计杠杆内部：深色箭头标示包含、组成与支撑关系；点选词条查看具体关系。':'Within design levers, stronger arrows show inclusion, composition and support. Select an entry for relationship labels.'}</p><div class="network-jumps">${['feelings','factors','levers'].map(k=>`<button data-jump="${k}">${layerLabel[k]} ↓</button>`).join('')}</div><div class="network-materials"></div><div class="network-viewport" tabindex="0" aria-label="${zh?'可拖拽缩放的关系地图':'Pannable and zoomable relationship map'}"><div class="network-space"><svg class="network-svg" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${zh?'体验形态、主观感受、感受诱因、设计杠杆':'Experience forms, feelings, factors, and design levers'}"></svg></div></div><div class="network-status" role="status"></div><section class="network-inspector" aria-live="polite"></section>`;
 const viewport=host.querySelector('.network-viewport'),svg=host.querySelector('svg'),space=host.querySelector('.network-space');let layout,data,camera;
 const workspace=document.createElement('div');workspace.className='network-workspace';viewport.before(workspace);workspace.append(viewport);
 const panel=document.createElement('aside');panel.className='network-detail-panel';panel.setAttribute('aria-label',zh?'选中词条的内容':'Selected entry content');panel.tabIndex=0;
 const inspector=host.querySelector('.network-inspector'),materials=host.querySelector('.network-materials');panel.append(inspector,materials);workspace.append(panel);
 function zoom(){if(!camera){camera=mapCamera(viewport,svg,{width:layout.width,height:layout.height,onZoom:value=>{scale=value;host.querySelector('output').textContent=Math.round(value*100)+'%';}});camera.center(layout.width/2,viewport.clientHeight/2,1);}else{camera.setSize(layout.width,layout.height);camera.apply();}}
 function draw(){
  data=graphData(catalog,current,mode,depth);layout=mode==='focus'?focusLayout(data,current):graphLayout(data);const map=new Map(layout.nodes.map(n=>[n.id,n]));const connected=new Set(current?[current]:[]);for(const e of data.edges)if(e.from===current||e.to===current){connected.add(e.from);connected.add(e.to);}
  svg.setAttribute('width',layout.width);svg.setAttribute('height',layout.height);
  let html=`<defs><marker id="recorded-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="currentColor"/></marker></defs>`;
  html+=`<rect x="0" y="0" width="1200" height="174" class="network-band"/><text x="24" y="30" class="network-layer-title">${zh?'01 体验形态 · 观察尺度':'01 Experience form · observation scale'}</text>`;
  const forms=zh?['体验曲线','体验段落','体验循环','体验瞬间']:['Experience curve','Experience passage','Experience loop','Experience moment'];
  forms.forEach((name,i)=>{html+=`<a href="#/entry/form-${i}" class="network-form"><rect x="${468}" y="${43+i*30}" width="264" height="26" rx="3"/><text x="${480}" y="${61+i*30}">${i+1}. ${name}</text></a>`});
  for(const band of layout.bands){html+=`<rect x="0" y="${band.y}" width="1200" height="${band.height}" class="network-band ${band.category}"/><text x="24" y="${band.y+28}" class="network-layer-title">${layerLabel[band.category]}</text>`;
   band.groups.forEach((g,i)=>{html+=`<text x="${LEFT+i*384}" y="${band.y+59}" class="network-group ${g}">${escape(groupLabel[g])}</text>`});
  }
  if(mode==='focus')for(const group of layout.focusGroups||[]){html+=`<rect x="${group.x}" y="${group.y}" width="${group.width}" height="${group.height}" rx="4" class="focus-group-bg"/><text x="${group.x+12}" y="${group.y+22}" class="focus-group-label">${escape(relationName(group.type,lang))}</text><text x="${group.x+12}" y="${group.y+41}" class="focus-group-direction">${group.direction==='out'?(zh?'从选中词条出发':'From selected entry'):group.direction==='in'?(zh?'指向选中词条':'To selected entry'):(zh?'下级支撑链':'Supporting chain')}</text>`;}
  for(const family of [...(layout.families||[])].sort((a,b)=>b.height-a.height))html+=`<rect class="lever-family" data-family="${family.id}" x="${family.x}" y="${family.y}" width="${family.width}" height="${family.height}" rx="5"/>`;
  for(const e of data.edges){const a=map.get(e.from),b=map.get(e.to);const adjacent=e.from===current||e.to===current;const hierarchy=a.category==='levers'&&b.category==='levers'&&hierarchyTypes.includes(e.type);let path;
   if(Math.abs(a.y-b.y)<NH+GAP){const ax=a.x+a.w/2,bx=b.x+b.w/2,ay=a.y;path=`M${ax} ${ay} C${ax} ${ay-25} ${bx} ${b.y-25} ${bx} ${b.y}`;}
   else {const down=a.y<b.y;const ax=a.x+a.w/2,ay=a.y+(down?a.h:0),bx=b.x+b.w/2,by=b.y+(down?0:b.h);const mid=(ay+by)/2;path=`M${ax} ${ay} C${ax} ${mid} ${bx} ${mid} ${bx} ${by}`;
    const obstructed=layout.nodes.some(n=>n.id!==a.id&&n.id!==b.id&&n.y>Math.min(a.y,b.y)&&n.y<Math.max(a.y,b.y)&&Math.abs(n.x+n.w/2-ax)<n.w/2+16);
    if(mode==='focus'&&obstructed&&Math.abs(ax-bx)<24){const side=ax+(b.category==='references'?-240:240),sign=down?1:-1;path=`M${ax} ${ay} C${side} ${ay} ${side} ${ay+sign*24} ${side} ${ay+sign*42} L${side} ${by-sign*42} C${side} ${by} ${bx} ${by-sign*24} ${bx} ${by}`;}
}
   if(mode==='focus')path=focusEdgePath(a,b,layout.nodes);
   html+=`<path d="${path}" class="network-edge ${hierarchy?'hierarchy-edge':''} ${e.origin==='case-interpretation'?'case-interpretation':''} ${adjacent?'highlight':mode==='all'&&current?'muted-edge':mode==='focus'?'focus-edge':''}" data-from="${e.from}" data-to="${e.to}" data-relation="${escape(e.type)}" ${hierarchy||adjacent||mode==='focus'?'marker-end="url(#recorded-arrow)"':''}><title>${escape(label(a)+' — '+e.type+' → '+label(b)+(e.origin==='case-interpretation'?(zh?'（案例解读）':' (case interpretation)'):''))}</title></path>`;
   if(hierarchy&&mode==='focus'&&(e.type==='supported by'||(adjacent&&data.edges.filter(x=>x.from===e.from&&x.type===e.type).length<=3))){const x=(a.x+a.w/2+b.x+b.w/2)/2+9,y=(a.y+a.h+b.y)/2;html+=`<text class="hierarchy-edge-label" x="${x}" y="${y}">${escape(relationName(e.type,lang))}</text>`;}
  }
  for(const n of layout.nodes){const ls=lines(label(n),n.w-16,n.id===current&&mode==='focus'?16:14);html+=`<g class="network-node ${n.id===current?'selected':''} ${mode==='all'&&current&&!connected.has(n.id)?'unrelated':''} ${n.category==='feelings'?valenceOf(n):n.category}" tabindex="0" role="button" aria-pressed="${n.id===current}" aria-label="${escape(label(n))}" data-layer="${n.category}" data-node="${n.id}" transform="translate(${n.x},${n.y})"><title>${escape(label(n))}</title><rect width="${n.w}" height="${n.h}" rx="3"/>${ls.map((l,i)=>`<text x="${n.id===current&&mode==='focus'?n.w/2:8}" text-anchor="${n.id===current&&mode==='focus'?'middle':'start'}" y="${ls.length===1?n.h/2+5:n.h/2-4+i*17}">${escape(l)}</text>`).join('')}</g>`;}
  svg.innerHTML=html;zoom();
  if(mode==='focus')camera.fit();host.querySelector('.network-jumps').hidden=mode==='focus';svg.classList.toggle('focus-layout',mode==='focus');
  host.querySelector('[data-depth]').disabled=mode==='all';
  host.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  host.querySelector('.network-status').textContent=zh?`当前 ${data.nodes.length} / ${data.total} 个词条（含关联素材），${data.edges.length} 条关系。${mode==='focus'?'关联内容已聚拢，保留所属层级。':''}`:`${data.nodes.length} / ${data.total} entries including connected sources; ${data.edges.length} recorded links.${mode==='focus'?' Connections gathered within their original layers.':''}`;
  const n=allMap.get(current);const edges=n?data.edges.filter(e=>e.from===current||e.to===current):[];
  workspace.classList.toggle('has-selection',Boolean(n));panel.hidden=!n;panel.querySelector(':scope > .network-relations')?.remove();
  renderMaterials(materials,catalog,n,data,lang);
  host.querySelector('.network-inspector').innerHTML=n?`<div><span>${zh?'已选择':'Selected'} · ${layerLabel[n.category]||''}</span><h2>${escape(label(n))}</h2><a href="#/entry/${n.id}">${zh?'阅读词条':'Read entry'} →</a>${n.body?`<div class="prose selected-entry-body">${renderBody(n.body)}</div>`:''}</div><div class="network-relations">${edges.length?relationGroups(edges,current,allMap,label,zh):`<p>${zh?'当前范围内尚无已记录连线。':'No recorded connections in this view.'}</p>`}</div>`:`<p>${zh?'选择一个词条，查看它的分组关系。':'Select an entry to inspect its grouped relationships.'}</p>`;
  const relations=inspector.querySelector('.network-relations');if(relations)panel.append(relations);panel.scrollTop=0;camera.setSize(layout.width,layout.height);if(mode==='focus')camera.fit();
 }
 host.querySelector('[data-depth]').onchange=e=>{depth=Number(e.target.value);draw();};
 function select(id){current=id;mode='focus';depth=1;host.querySelector('[data-depth]').value='1';draw();svg.querySelector(`[data-node="${id}"]`)?.focus({preventScroll:true});viewport.scrollIntoView({block:'nearest',behavior:'instant'});onChange({selected:current,scope:mode});}
 function reset(){current='';mode='all';depth=1;host.querySelector('[data-depth]').value='1';draw();camera.fit();onChange({selected:'',scope:'all'});}
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
  return `<section class="network-relation-direction"><h3>${heading}</h3>${[...groups].map(([type,items])=>`<details class="network-relation-group" open><summary>${escape(zh?(translations[type]||type):type)} <small>${items.length}</small></summary><ul>${items.map(e=>{const id=direction==='out'?e.to:e.from;return `<li><button data-select="${id}">${escape(label(allMap.get(id)))}${e.origin==='author-clarification'?` <small>${zh?'作者补充':'Author clarification'}</small>`:e.origin==='case-interpretation'?` <small>${zh?'案例解读':'Case interpretation'}</small>`:''}</button></li>`}).join('')}</ul></details>`).join('')}</section>`;
 }).join('');
}

function renderMaterials(host,catalog,selected,data,lang){
 if(!selected){host.innerHTML='';return;}
 const zh=lang==='zh',materials=selected.resources?.length?[selected]:data.nodes.filter(n=>n.resources?.length),owners=catalog.entries.filter(n=>(n.drawings||[]).some(d=>n.id===selected.id||d.references.some(r=>r.target===selected.id)));
 const count=materials.reduce((sum,n)=>sum+n.resources.length,0);
 const interpretation=data.edges.some(e=>e.origin==='case-interpretation');
 host.innerHTML=`${interpretation?`<p class="case-reading">${zh?'案例解读（虚线）：通过角色与武器的大小对比，产生“不匹配”的感受诱因，以突出年轻。依据卓拉原图及作者说明；这两条虚线不是 PKM 原有连线。':'Case interpretation (dashed): contrasting the sizes of the character and weapon creates a mismatch that emphasizes youth. Based on the Zora source image and the author’s explanation; these two edges are not imported PKM links.'}</p>`:''}${count||owners.length?`<section class="network-source-details"><h3 class="source-heading">${zh?'素材与画布':'Material & drawings'} <strong>${count} ${zh?'素材':'sources'} · ${owners.reduce((sum,n)=>sum+n.drawings.length,0)} Excalidraw</strong></h3><div class="network-source-content">${materials.map(n=>`<section><h3>${n.id===selected.id?'':`<button data-select="${n.id}">${escape(displayTitle(n,lang))} →</button>`}</h3>${n.resources.map(r=>r.kind==='image'?`<figure><img data-source-image="${escape(r.url)}" alt="${escape(displayTitle(n,lang))}" loading="lazy"></figure>`:`<p><a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.label)} ↗</a></p>`).join('')}</section>`).join('')}${owners.length?`<details class="original-drawing-reference"><summary>${zh?'查看原始画布':'View original drawings'} · Excalidraw</summary>${owners.map(n=>drawingPanels(n,lang)).join('')}</details>`:''}</div></section>`:`<p>${zh?'当前关联范围内尚无图片或已收录的 Excalidraw。':'No images or imported Excalidraw drawings in this neighborhood.'}</p>`}`;
 if(selected.resources?.length&&!owners.length)host.querySelector('.source-heading')?.remove();
 const explanation=host.querySelector('.case-reading');if(explanation)host.append(explanation);
 for(const img of host.querySelectorAll('[data-source-image]')){img.src=img.dataset.sourceImage;bindImageViewer(img,host,lang);}

 for(const owner of owners)bindDrawings(owner,lang,{targetId:selected.id});
}
