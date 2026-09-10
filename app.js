import {contentModel,hierarchyEdges,relationName} from './content-model.js';
import {mountStructureMap} from './structure-map.js';
import {valenceOf,displayTitle} from './feeling-groups.js';
import {mountNetwork,graphData} from './network.js';
import { marked } from './vendor/marked.js';
import { text } from './copy.js';
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const requestedLanguage=new URLSearchParams(location.search).get('lang');
let lang=requestedLanguage||'zh'; try {if(!requestedLanguage)lang=localStorage.getItem('egds-lang') || 'zh';} catch {}
if(!text[lang])lang='zh';
let catalog, nodes, names, backlinks;
const t=()=>text[lang];
const catKeys=['forms','feelings','factors','levers','references'];
const english=['Experience form','Subjective feelings','Eliciting factors','Design levers'];
const verbs=['Perception','Understanding','Attribution','Reconstruction'];
const title=n=>displayTitle(n,lang);
const href=id=>`#/entry/${encodeURIComponent(id)}`;
const link=(url,label,cl='')=>`<a class="${cl}" href="${esc(url)}">${label}</a>`;
const external=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
function atlasURL(params={}){const q=new URLSearchParams(Object.entries({view:'list',...params}).filter(([,v])=>v));return '#/atlas'+(q.size?'?'+q:'');}
function categoryName(cat){return t().atlasSections[catKeys.indexOf(cat)]||t().reference;}
function readURL(){const raw=location.hash.slice(1)||'/';const [path,query]=raw.split('?');return {path,params:new URLSearchParams(query||'')};}
function bindTheme(){
 const button=$('#theme-toggle');
 function update(){const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'☀':'☾';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',lang==='zh'?(dark?'切换浅色主题':'切换暗色主题'):(dark?'Switch to light theme':'Switch to dark theme'));button.title=button.getAttribute('aria-label');document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#171c19':'#f3f0e8');}
 button.onclick=()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('egds-theme',theme)}catch{}update();};update();
}
function nav(){
 $('#header').innerHTML=`<div class="header-inner">${link('#/','<span class="logo">EGDS<span class="logo-dot">↗</span></span><span class="brand-sub">PLAY WITH EXPERIENCES</span>','brand')}<nav aria-label="${lang==='zh'?'主导航':'Main navigation'}">${link('#/',t().overview)}${link('#/atlas',t().details)}</nav><div class="header-tools"><button id="search-open" aria-label="${t().searchLabel}" title="${t().searchLabel} (/)"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="1.6"/><path d="m15 15 5 5" stroke="currentColor" stroke-width="1.6"/></svg></button><button id="theme-toggle" type="button"></button><button id="language" aria-label="${lang==='zh'?'Switch to English':'切换为中文'}">${lang==='zh'?'EN':'中文'}</button></div></div>`;
 bindTheme();
 $('#language').onclick=()=>{lang=lang==='zh'?'en':'zh';try{localStorage.setItem('egds-lang',lang)}catch{} const url=new URL(location.href);if(url.searchParams.has('lang')){url.searchParams.set('lang',lang);history.replaceState(null,'',url)}render(false);};
 $('#search-open').onclick=()=>{if(readURL().path==='/atlas'&&$('#search'))$('#search').focus();else location.hash='/atlas?view=list&focus=search';};
 document.documentElement.lang=lang==='zh'?'zh-CN':'en'; $('.skip').textContent=t().skip;
 $('#footer').innerHTML=`<div class="wrap footer-inner"><div><a class="logo" href="#/">EGDS ↗</a><p>${t().footer}</p></div><div class="footer-meta"><span>${t().edition}</span><span>© 2026 無涘 · Play With Experiences</span></div></div>`;
}
function glyph(i,cls=''){
 const paths=[`<path d="M2 45C20 45 14 19 32 24S48 59 63 33S79 6 98 29"/>`, `<circle cx="50" cy="34" r="26"/><circle cx="41" cy="28" r="2" fill="currentColor"/><circle cx="59" cy="28" r="2" fill="currentColor"/><path d="M37 41Q50 55 63 41"/>`, `<circle cx="60" cy="35" r="17"/><path d="M6 35h35M29 23l12 12-12 12M60 7v5M85 15l-4 4M89 35h6M81 51l4 4M60 58v5"/>`,`<path d="M8 18h83M8 35h83M8 52h83"/><path d="M28 10v16M68 27v16M44 44v16" stroke-width="5"/>`];
 return `<svg class="glyph ${cls}" viewBox="0 0 100 70" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${paths[i]}</svg>`;
}
const curvePath='M10 60 C35 60 40 25 65 30 S90 92 120 65 S145 20 170 40 S195 83 220 52 S245 15 270 35 S295 85 320 52 S360 12 390 40';
function scaleGraphic(i){
 const [x,width]=[[8,384],[220,70],[256,22],[270,0]][i];
 return `<svg class="scale-graphic" viewBox="0 0 400 110" role="img" aria-label="${esc(t().forms[i][0]+': '+t().forms[i][2])}"><path d="${curvePath}" fill="none" stroke="currentColor" opacity=".18" stroke-width="2"/>${i<3?`<svg x="${x}" y="0" width="${width}" height="110" viewBox="${x} 0 ${width} 110" overflow="hidden"><path d="${curvePath}" fill="none" stroke="currentColor" stroke-width="3"/></svg><path d="M${x} 83v9h${width}v-9" fill="none" stroke="currentColor" stroke-width="1.5"/>`:'<circle cx="270" cy="35" r="6" fill="currentColor"/><path d="M270 47v45" stroke="currentColor" stroke-dasharray="3 4"/>'}</svg>`;
}
function formsMarkup(){return `<ol class="scale-list">${t().forms.map((f,i)=>`<li data-form="${i}">${link(href('form-'+i),`<span class="scale-number">${i+1}</span><div><h3>${f[0]}</h3><span class="small-en">${f[1]}</span><p>${f[2]}</p></div>${scaleGraphic(i)}<span class="scale-open" aria-hidden="true">↗</span>`,'scale-row')}</li>`).join('')}</ol>`;}
function caseContent(c){return `<blockquote class="case-question">${c.question}</blockquote><ol class="case-steps">${c.steps.map((step,i)=>`<li><span>0${i+1} / ${t().stageNames[i]}</span><p>${step}</p></li>`).join('')}</ol><div class="prose">${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}</div><div class="entry-relations"><h3>${t().relatedConcepts}</h3>${relationList(c.names.map(name=>({target:names.get(name)?.id,type:'related'})).filter(e=>e.target))}</div><div class="case-source">${external(c.link,lang==='zh'?'原文与资料':'Original article & material')}</div>`;}
function casesMarkup(){return t().cases.map(c=>`<details class="inline-case" id="case-${c.id}"><summary><span class="eyebrow">${c.tag}</span><h3>${c.title}</h3><p>${c.description}</p><span class="text-link">${lang==='zh'?'展开阅读':'Read here'} ↓</span></summary><div class="inline-case-body">${caseContent(c)}</div></details>`).join('');}
function balancedCopy(value){if(value.length<24)return esc(value);if(lang==='en'){const words=value.split(' ');const count=words.slice(-3).join(' ').length<=30?3:2;return esc(words.slice(0,-count).join(' '))+' '+`<span class="copy-tail">${esc(words.slice(-count).join(' '))}</span>`;}return esc(value.slice(0,-8))+`<span class="copy-tail">${esc(value.slice(-8))}</span>`;}
function landing(){return `<nav class="overview-toc wrap" aria-label="${lang==='zh'?'总览目录':'Overview contents'}">${link('#/',lang==='zh'?'↑ 页首':'↑ Top','toc-top')}${['why','system','cases','about'].map((x,i)=>link('#/'+x,lang==='zh'?t().nav[[0,1,3,4][i]]:['Why','System','Practice','About'][i])).join('')}</nav>
<section class="hero" id="home"><div class="hero-top wrap"><div class="hero-copy"><span class="eyebrow">${t().eyebrow}</span><div class="hero-brand">EGDS<span>↗</span></div></div><div class="hero-statement"><h1>${t().hero}</h1><p class="hero-identity">${t().identity.split(' · ').map(part=>`<span class="identity-name">${esc(part)}</span>`).join('<span class="identity-separator"> · </span>')}</p><p class="hero-intro">${t().intro}</p><div class="hero-actions">${link('#/system',lang==='zh'?'了解系统 ↓':'Understand the system ↓','primary')}${link('#/atlas',t().explore+' →','text-link')}</div></div></div></section>
<section class="wrap section" id="why"><div class="why-grid">${t().whys.map(w=>`<article><span class="eyebrow">${w[0]}</span><h3>${w[1]}</h3><p>${balancedCopy(w[2])}</p></article>`).join('')}</div><div class="north-star"><span class="north-symbol" aria-hidden="true">✳</span><div><span class="eyebrow">${t().northLabel}</span><p>${t().north}</p></div></div></section>
<section class="system-section" id="system"><div class="wrap section"><div class="section-heading"><span class="section-no">${t().nav[1]}</span><div><h2>${(lang==='zh'?['从体验形态','深入到设计杠杆。']:['From experience form','to design levers.']).map(part=>`<span class="heading-phrase">${part}</span>`).join(lang==='zh'?'<wbr>':' <wbr>')}</h2><p>${t().systemSub}</p></div></div><div class="system-table">${[0,1,2,3].map(i=>`<article class="system-row" data-layer="${catKeys[i]}"><div class="process"><span class="row-no">0${i+1}</span><div><h3>${t().stageNames[i]}</h3><span class="small-en">${lang==='zh'?verbs[i]:text.zh.stageNames[i]}</span></div></div><span class="process-arrow" aria-hidden="true">→</span><div class="artifact">${glyph(i)}<div><h3>${t().artifactNames[i]}</h3><p>${t().stageDescriptions[i]}</p>${i===0?`<details class="form-inset"><summary>${t().formTitle}</summary>${formsMarkup()}</details>`:link(atlasURL({cat:catKeys[i]}),t().go+' →','text-link')}</div></div></article>`).join('')}</div><div class="direction"><span class="loop-symbol" aria-hidden="true">↻</span><div><h3>${t().directionTitle}</h3>${t().directionParts.map(part=>`<p class="direction-part">${part}</p>`).join('')}<p class="method-note">${t().directionNote}</p></div></div></div></section>
<section class="wrap section" id="cases"><div class="section-heading"><span class="section-no">${t().nav[3]}</span><div><h2>${t().casesTitle}</h2><p>${t().casesSub}</p></div></div><div class="cases-grid">${casesMarkup()}</div></section>
<section class="about-section" id="about"><div class="wrap section about-grid"><div><span class="section-no">${t().nav[4]}</span><h2>${t().aboutTitle}</h2><span class="signature">Play With Experiences.</span></div><div><p class="about-intro">${t().aboutText}</p><p>${t().aboutNote}</p><div class="about-links">${external('https://play-with-experiences-digital-garden.vercel.app/',t().garden)}${external('https://medill-east.github.io/',t().blog)}${external('https://lhd-gamedesign.figma.site/',t().portfolio)}</div></div></div></section>`;}
function formNode(i){return {id:'form-'+i,name:t().forms[i].join(' '),title:{zh:text.zh.forms[i][0],en:text.en.forms[i][0]},category:'forms',status:'note',body:t().forms[i][2],links:[]};}
function hierarchy(branch){
 const seen=new Set();
 function tree(id,path=new Set(),open=false){
  const n=nodes.get(id);if(!n)return '';seen.add(id);
  const ref=link(href(id),esc(title(n)),'tree-title');
  if(path.has(id))return `<div class="tree-leaf">${ref} <span aria-label="${lang==='zh'?'已在上层出现':'Already shown above'}">↩</span></div>`;
  const edges=hierarchyEdges(n,nodes),next=new Set([...path,id]);if(!edges.length)return `<div class="tree-leaf">${ref}</div>`;
  const grouped=new Map();for(const e of edges){if(!grouped.has(e.type))grouped.set(e.type,[]);grouped.get(e.type).push(e);}
  return `<details class="tree-node" data-tree-node="${id}" ${open?'open':''}><summary><span>${esc(title(n))}</span><span class="tree-count">${edges.length}</span>${link(href(id),`<span class="sr-only">${esc(title(n))}</span>↗`,'tree-open')}</summary><div class="tree-children">${[...grouped].map(([type,list])=>`<section class="typed-tree-group" data-tree-relation="${esc(type)}"><h4>${esc(relationName(type,lang))}${list.some(e=>e.origin==='author-clarification')?` <small>${lang==='zh'?'作者补充':'Author clarification'}</small>`:''}</h4>${list.map(e=>tree(e.target,next)).join('')}</section>`).join('')}</div></details>`;
 }
 const branches=branch?[branch]:['gameplay','narrative','aesthetics'];
 const trees=branches.map(k=>tree(catalog.hubs[k],new Set(),Boolean(branch))).join('');
 const rest=catalog.entries.filter(n=>n.category==='levers'&&(!branch||n.branch===branch)&&!seen.has(n.id)&&n.id!==catalog.hubs.levers);
 const extra=rest.length?`<details class="tree-extra"><summary>${lang==='zh'?'其他已收录词条':'Other collected entries'} (${rest.length})</summary>${compactEntries(rest)}</details>`:'';
 if(branch)return `<div class="branch-hierarchy">${trees}${extra}</div>`;
 return `<details class="structure-browser"><summary>${lang==='zh'?'浏览设计杠杆的层级':'Browse the design-lever hierarchy'} ↳</summary><div class="tree-roots">${trees}</div>${extra}</details>`;
}
function isGraph(params){return params.get('view')==='graph';}
function isStructure(params){return !params.has('view')&&!params.has('cat')&&!params.has('q')&&!params.has('focus')&&!params.has('status')||params.get('view')==='structure';}
function viewSwitch(params){return `<nav class="content-view-switch" aria-label="${lang==='zh'?'内容视图':'Content view'}">${link('#/atlas',lang==='zh'?'整体结构':'Structure',isStructure(params)?'active':'')}${link(atlasURL({cat:params.get('cat')}),lang==='zh'?'词条目录':'Directory',!isGraph(params)&&!isStructure(params)?'active':'')}${link('#/atlas?view=graph&scope=all',lang==='zh'?'关系图':'Connections',isGraph(params)?'active':'')}</nav>`;}
function compactEntries(entries){return `<div class="compact-entries">${entries.map(n=>link(href(n.id),esc(title(n)))).join('')}</div>`;}
function structurePage(params){return `<div class="wrap structure-page"><div class="atlas-heading"><span class="eyebrow">${t().catalogEyebrow}</span><h1>${lang==='zh'?'EGDS 的整体结构':'The structure of EGDS'}</h1><p>${lang==='zh'?'从体验形态到设计杠杆，沿着图中的关系展开内容。':'Follow the connections from experience forms to design levers. Select a node to explore its contents.'}</p></div>${viewSwitch(params)}<div id="structure-map"></div><div class="structure-layers diagram-details">${catKeys.slice(0,4).map((cat,i)=>`<details class="content-layer" data-content-layer="${cat}"><summary><span class="layer-order">0${i+1}</span>${glyph(i)}<div><h2>${t().artifactNames[i]}</h2><p>${lang==='zh'?english[i]:text.zh.artifactNames[i]}</p></div><span class="layer-action">${lang==='zh'?'展开':'Open'} ＋</span></summary><div class="layer-content">${cat==='forms'?formsMarkup():cat==='feelings'?compactFeelings(catalog.entries.filter(n=>n.category===cat)):cat==='factors'?compactEntries(catalog.entries.filter(n=>n.name.startsWith('objective reason - '))):`<div class="lever-sections">${['gameplay','narrative','aesthetics'].map(branch=>`<details class="lever-section"><summary>${esc(title(nodes.get(catalog.hubs[branch])))}</summary>${hierarchy(branch)}</details>`).join('')}</div>`}${link(atlasURL({cat}),lang==='zh'?'搜索这一层的词条 →':'Search entries in this layer →','text-link')}</div></details>`).join('')}</div></div>`;}
function networkPage(params){
 const graph=graphData(catalog);return `<div class="wrap network-page"><div class="atlas-heading"><span class="eyebrow">${t().catalogEyebrow}</span><h1>${lang==='zh'?'体验背后的关系。':'The connections behind experience.'}</h1><p>${lang==='zh'?'体验形态在上，主观感受、感受诱因与设计杠杆逐层向下。点选一个词条，沿着关系继续探索。':'Experience forms at the top, followed by feelings, eliciting factors, and design levers. Select an entry to follow its connections.'}</p></div>${viewSwitch(params)}<div class="network-search"><label for="network-find">${lang==='zh'?'定位词条':'Find an entry'}</label><input id="network-find" list="network-options" placeholder="${lang==='zh'?'如：探索、压力、资源有限':'e.g. exploration, stress, limited resources'}" autocomplete="off"><datalist id="network-options">${graph.nodes.map(n=>`<option value="${esc(title(n)+' · '+categoryName(n.category))}"></option>`).join('')}</datalist><span id="network-search-state" role="status"></span></div><div id="relationship-network"></div></div>`;
}
function bindNetwork(params){
 function start(selected=params.get('node'),scope=params.get('scope')||'all'){
  mountNetwork($('#relationship-network'),catalog,{lang,selected,scope,onChange:state=>{params.set('view','graph');params.set('node',state.selected);params.set('scope',state.scope);history.replaceState(null,'',atlasURL(Object.fromEntries(params)));}});
 }
 start();$('#network-find').onchange=()=>{const value=$('#network-find').value.trim().toLocaleLowerCase();const candidates=graphData(catalog).nodes.filter(n=>[title(n)+' · '+categoryName(n.category),title(n),n.title.en,n.title.zh,n.name].some(s=>s.toLocaleLowerCase()===value));const n=candidates.length===1?candidates[0]:null;
  if(n){$('#network-search-state').textContent='';params.set('node',n.id);params.set('scope','focus');params.set('view','graph');history.replaceState(null,'',atlasURL(Object.fromEntries(params)));start(n.id,'focus');}else $('#network-search-state').textContent=lang==='zh'?'请选择下拉列表中的词条。':'Choose an entry from the list.';
 };
}
function compactFeelings(matches){
 const labels=lang==='zh'?['负向','中性 / 复合','正向']:['Negative','Neutral / mixed','Positive'];
 const groups=['negative','neutral','positive'];const entries=matches.filter(n=>n.name.startsWith('subjective feeling - '));
 return `<p class="valence-note">${lang==='zh'?'按感受倾向分区，不代表体验优劣；复合感受可随情境变化。':'Grouped by feeling tone, not by the value of an experience. Mixed feelings depend on context.'}</p><div class="feeling-tables">${groups.map((g,i)=>{const ns=entries.filter(n=>valenceOf(n)===g);return `<table class="feeling-table ${g}"><caption>${labels[i]} <span>${ns.length}</span></caption><tbody>${Array.from({length:Math.ceil(ns.length/2)},(_,r)=>`<tr>${[ns[r*2],ns[r*2+1]].map(n=>`<td>${n?`<a class="feeling-cell" href="${href(n.id)}" title="${esc(title(n))}" data-valence="${g}">${esc(title(n))}</a>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table>`}).join('')}</div>${matches.some(n=>!n.name.startsWith('subjective feeling - ')||valenceOf(n)==='unclassified')?`<div class="feeling-extras"><h3>${lang==='zh'?'分类与扩展':'Categories & extensions'}</h3>${matches.filter(n=>!n.name.startsWith('subjective feeling - ')||valenceOf(n)==='unclassified').map(n=>link(href(n.id),esc(title(n))+' →')).join('')}</div>`:''}`;
}
function atlas(params){
 if(isStructure(params))return structurePage(params);
 if(isGraph(params))return networkPage(params);
 const cat=params.get('cat')||'',q=params.get('q')||'',status=params.get('status')||'',branch=params.get('branch')||'';
 return `<div class="wrap atlas-page"><div class="atlas-heading"><span class="eyebrow">${t().catalogEyebrow}</span><h1>${t().catalogTitle}</h1><p>${t().catalogDesc}</p></div>${viewSwitch(params)}<div class="atlas-layout"><aside class="atlas-sidebar"><span class="eyebrow">${t().nav[1]}</span>${link(atlasURL({q,status}),`${t().all} <span>${catalog.entries.length+4}</span>`,!cat?'active':'')}${catKeys.map((c,i)=>link(atlasURL({cat:c,q,status}),`<span>${i<4?String(i+1).padStart(2,'0')+' · ':''}${categoryName(c)}</span><span>${c==='forms'?4:catalog.entries.filter(n=>n.category===c).length}</span>`,cat===c?'active':'')).join('')}<div class="sidebar-note"><span class="eyebrow">v0.3</span><p>${t().sourceLanguage}</p></div></aside><div class="atlas-results">${cat==='levers'?hierarchy():''}<form id="search-form" role="search"><label class="sr-only" for="search">${t().searchLabel}</label><input type="search" id="search" placeholder="${t().search}" value="${esc(q)}" autocomplete="off"><button type="submit" aria-label="${t().searchLabel}">↗</button></form><div class="filter-row"><label for="status" class="sr-only">${t().allStatus}</label><select id="status"><option value="">${t().allStatus}</option><option value="note" ${status==='note'?'selected':''}>${t().note}</option><option value="index" ${status==='index'?'selected':''}>${t().index}</option></select><span id="result-count" role="status" aria-live="polite"></span>${q||status||branch?link(atlasURL({cat}),t().clear,'clear-link'):''}</div>${cat==='levers'?`<div class="branch-filters">${['gameplay','narrative','aesthetics'].map(k=>link(atlasURL({cat,q,status,branch:catalog.hubs[k]}),title(nodes.get(catalog.hubs[k])),branch===catalog.hubs[k]?'selected':'')).join('')}</div>`:''}<div id="result-list"></div></div></div></div>`;
}
function fillResults(params){
 const q=(params.get('q')||'').trim().toLocaleLowerCase(),cat=params.get('cat'),status=params.get('status'),branch=params.get('branch');
 const branchKey=Object.keys(catalog.hubs).find(k=>catalog.hubs[k]===branch);
 const branchSet=branch?new Set(catalog.entries.filter(n=>n.branch===branchKey).map(n=>n.id)):null;
 let matches=[...[0,1,2,3].map(formNode),...catalog.entries].filter(n=>(!cat||n.category===cat)&&(!status||n.status===status)&&(!branchSet||branchSet.has(n.id))&&(!q||[n.name,n.title.zh,n.title.en,n.body].join(' ').toLocaleLowerCase().includes(q)));
 matches.sort((a,b)=>{if(a.category==='forms'||b.category==='forms')return a.category==='forms'&&b.category==='forms'?Number(a.id.at(-1))-Number(b.id.at(-1)):a.category==='forms'?-1:1;return catKeys.indexOf(a.category)-catKeys.indexOf(b.category)||Number(b.status==='note')-Number(a.status==='note')||title(a).localeCompare(title(b),lang)});
 $('#result-count').textContent=matches.length+' '+t().results;
 if(cat==='feelings'&&matches.length){$('#result-list').innerHTML=compactFeelings(matches);return;}
 if(cat==='forms'&&!q&&!status){$('#result-list').innerHTML=formsMarkup();return;}
 $('#result-list').innerHTML=matches.length?matches.map(n=>link(href(n.id),`<span class="result-type">${categoryName(n.category)}</span><div><h2>${esc(title(n))}</h2><span class="entry-subtitle">${esc(lang==='zh'?n.title.en:n.title.zh)}</span>${n.body?`<p>${esc(plain(n.body).slice(0,105))}${plain(n.body).length>105?'…':''}</p>`:''}</div><span class="entry-status ${n.body?'has-body':''}">${n.body?t().note:t().index}</span><span class="result-arrow" aria-hidden="true">↗</span>`,'result-row')).join(''):`<div class="empty"><h2>${t().noResults}</h2><p>${t().noResultsHint}</p>${link(atlasURL(),t().all+' →','text-link')}</div>`;
}
function bindAtlas(params){
 if(isStructure(params)){mountStructureMap($('#structure-map'),{lang,onOpen:key=>{const branch=['gameplay','narrative','aesthetics'].includes(key);const layer=branch?'levers':key;document.querySelectorAll('.content-layer').forEach(el=>el.open=el.dataset.contentLayer===layer);const target=document.querySelector(`[data-content-layer="${layer}"]`);if(branch){const index=['gameplay','narrative','aesthetics'].indexOf(key);target.querySelectorAll('.lever-section').forEach((el,i)=>el.open=i===index);}target.scrollIntoView({behavior:'smooth',block:'start'});}});return;}
 if(isGraph(params)){bindNetwork(params);return;}
 const update=()=>{params.delete('focus');params.set('q',$('#search').value);params.set('status',$('#status').value);history.replaceState(null,'',atlasURL(Object.fromEntries(params)));fillResults(params)};
 $('#search-form').onsubmit=e=>{e.preventDefault();update()};$('#search').oninput=update;$('#status').onchange=update;fillResults(params);
 if(params.get('focus')==='search')$('#search').focus();
}
function plain(s){return s.replace(/\[\[([^\]]+)\]\]/g,(_,v)=>v.split('|').pop().split('#')[0]).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*`|>\n]/g,' ').replace(/\s+/g,' ').trim();}
function markdown(body){
 let safe=body.replace(/</g,'&lt;').replace(/>/g,'&gt;');
 safe=safe.replace(/\[\[([^\]]+)\]\]/g,(_,raw)=>{const ref=raw.split('|')[0].split('#')[0].replace(/\.md$/,'').split('/').pop();const n=names.get(ref);const label=raw.includes('|')?raw.split('|').slice(1).join('|'):ref;return n?`[${label.replace(/[\[\]]/g,'')}](${href(n.id)})`:label;});
 const html=marked.parse(safe,{breaks:true,gfm:true});
 const template=document.createElement('template');template.innerHTML=html;
 for(const el of template.content.querySelectorAll('*')){
  if(!['P','A','STRONG','EM','DEL','UL','OL','LI','BLOCKQUOTE','H1','H2','H3','H4','H5','H6','CODE','PRE','BR','HR','TABLE','THEAD','TBODY','TR','TD','TH'].includes(el.tagName)){el.replaceWith(document.createTextNode(el.textContent));continue;}
  const url=el.getAttribute('href');for(const attr of [...el.attributes])el.removeAttribute(attr.name);
  if(el.tagName==='A'){
   if(url&&(url.startsWith('#/entry/')||/^https?:\/\//i.test(url))){el.setAttribute('href',url);if(!url.startsWith('#')){el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer');}}
   else el.replaceWith(document.createTextNode(el.textContent));
  }
 }
 return template.innerHTML;
}
function edgeLabel(s){return ({including:t().includes,'consist of':t().includes,'have example':t().examples,related:t().related})[s]||s.replace(/^./,c=>c.toUpperCase());}
function relationList(edges){if(!edges.length)return `<p class="muted">${t().noEdges}</p>`;const grouped=Map.groupBy?Map.groupBy(edges,e=>e.type):edges.reduce((m,e)=>(m.has(e.type)?m.get(e.type).push(e):m.set(e.type,[e]),m),new Map());return [...grouped].map(([type,list])=>`<div class="relation-group"><h3>${esc(edgeLabel(type))}</h3><div>${list.map(e=>{const n=nodes.get(e.target);return n?link(href(n.id),`${esc(title(n))}${e.origin==='author-clarification'?`<small>${lang==='zh'?'作者补充':'Author clarification'}</small>`:''}<span>↗</span>`):''}).join('')}</div></div>`).join('');}
function entry(id){
 if(id.startsWith('form-')&&/^form-[0-3]$/.test(id))return formPage(Number(id.at(-1)));
 const n=nodes.get(id);if(!n)return notFound();
 const incoming=backlinks.get(id)||[];const parent=incoming.find(e=>['including','consist of'].includes(e.type));
 return `<div class="wrap entry-page"><div class="breadcrumbs">${link('#/atlas',t().nav[2])}<span>/</span>${link(atlasURL({cat:n.category}),categoryName(n.category))}${parent?`<span>/</span>${link(href(parent.target),esc(title(nodes.get(parent.target))))}`:''}</div><header class="entry-heading"><span class="eyebrow">${categoryName(n.category)} / ${n.body?t().note:t().index}</span><h1>${esc(title(n))}</h1><p>${esc(lang==='zh'?n.title.en:n.title.zh)}</p></header><div class="entry-layout"><article><div class="editor-note">${t().inherited}${n.category==='factors'?' '+t().oldTerm:''}</div><h2 class="eyebrow">${t().bodyTitle}</h2><div class="prose">${n.body?markdown(n.body):`<p class="index-notice">${t().emptyBody}</p>`}</div>${resourceMarkup(n)}${["gameplay","narrative","aesthetics"].some(k=>catalog.hubs[k]===n.id)?`<div class="hub-branch-link">${link(atlasURL({cat:"levers",branch:n.id}),t().branch+" ↗","primary")}</div>`:""}<div class="entry-relations"><h2>${t().relations} <small>${n.links.length}</small></h2>${relationList(n.links)}</div><div class="source-box"><h2 class="eyebrow">${t().source}</h2><p>${t().sourceText}</p><code>${esc(n.source.path)}</code><span class="source-fingerprint">SHA-256 · ${n.source.sha256.slice(0,16)}… / ${catalog.snapshotDate}</span>${external('https://play-with-experiences-digital-garden.vercel.app/',t().garden)}</div></article><aside class="entry-aside"><h2>${t().backlinks} <small>${incoming.length}</small></h2>${relationList(incoming)}${link(atlasURL({cat:n.category}),t().backAtlas+' ↗','text-link')}</aside></div></div>`;
}
function resourceMarkup(n){
 if(!n.resources?.length)return '';
 const label=lang==='zh'?'原笔记中的素材与链接':'Media & links from the source';
 return `<div class="note-resources"><h2>${label}</h2><p>${lang==='zh'?'按需打开原始素材；外部内容由原站提供。':'Open original material on demand. External content is hosted by its source.'}</p>${n.resources.map((r,i)=>external(r.url,`${String(i+1).padStart(2,'0')} / ${r.label==='Video'?(lang==='zh'?'视频片段':'Video excerpt'):r.label==='Image'?(lang==='zh'?'原始图片':'Source image'):r.label}`)).join('')}</div>`;
}
function formPage(i){return `<div class="wrap reading-page"><div class="breadcrumbs">${link('#/atlas',t().nav[2])}<span>/</span>${link(atlasURL({cat:'forms'}),categoryName('forms'))}</div><span class="eyebrow">EXPERIENCE FORM / v0.3</span><h1>${t().forms[i][0]}</h1><p class="reading-subtitle">${t().forms[i][1]}</p><div class="form-feature">${scaleGraphic(i)}</div><div class="prose"><p>${t().forms[i][2]}</p><p>${t().formSub}</p><p>${lang==='zh'?'从整条曲线中取出体验段落，再关注其中反复出现的体验循环，最后落到某一个体验瞬间。':'Take a passage from the overall curve, examine recurring loops within it, then focus on a particular moment.'}</p></div><p class="editor-note">${lang==='zh'?'依据 EGDS v0.3 原图与方法论记录整理的网站导读。':'Website reading guide based on the EGDS v0.3 drawing and methodology record.'}</p>${formsMarkup()}<div class="next-layers">${link(href(catalog.hubs.feelings),t().artifactNames[1]+' ↗')}${link(atlasURL({cat:'forms'}),t().formTitle+' →')}</div></div>`;}
function casePage(id){const c=t().cases.find(c=>c.id===id);if(!c)return notFound();return `<div class="wrap reading-page"><div class="breadcrumbs">${link('#/cases',t().caseBack)}</div><span class="eyebrow">${c.tag}</span><h1>${c.title}</h1>${caseContent(c)}</div>`;}
function notFound(){return `<div class="wrap empty"><h1>${t().notFound}</h1>${link('#/atlas',t().backAtlas+' →','primary')}</div>`;}
function render(scroll=true){
 const previousOverview=Boolean($('.overview-toc'));nav();const {path,params}=readURL();const landingPaths=['/','/why','/system','/cases','/about'];
 if(scroll&&previousOverview&&landingPaths.includes(path)){
  $('#main').dataset.route=path;$('#header nav a').setAttribute('aria-current','page');
  if(path==='/')window.scrollTo({top:0,behavior:'instant'});else document.getElementById(path.slice(1))?.scrollIntoView({behavior:'instant'});return;
 }
 if(landingPaths.includes(path)){
  $('#main').innerHTML=landing();
 }else if(path==='/atlas'){ $('#main').innerHTML=atlas(params);bindAtlas(params); }
 else if(path.startsWith('/entry/'))$('#main').innerHTML=entry(decodeURIComponent(path.slice(7)));
 else if(path.startsWith('/case/'))$('#main').innerHTML=casePage(path.slice(6));
 else $('#main').innerHTML=notFound();
 $('#main').dataset.route=path;
 const routeName=path.startsWith('/entry/')?nodes.get(path.slice(7)):null;
 document.title=(routeName?title(routeName)+' — ':'')+'EGDS · Experiential Game Design System';
 document.querySelectorAll('#header nav a').forEach(a=>{if(a.getAttribute('href')===(landingPaths.includes(path)||path.startsWith('/case/')?'#/':'#/atlas'))a.setAttribute('aria-current','page')});
 if(scroll){if(landingPaths.includes(path)&&path!=='/')requestAnimationFrame(()=>document.getElementById(path.slice(1))?.scrollIntoView({behavior:'instant'}));else window.scrollTo(0,0);}
}
window.addEventListener('hashchange',()=>{try{render()}catch(e){console.error(e);$('#main').innerHTML=notFound()}});
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&a&&$('.overview-toc')&&a.getAttribute('href')===location.hash&&['/','/why','/system','/cases','/about'].includes(readURL().path)){e.preventDefault();if(readURL().path==='/')window.scrollTo({top:0,behavior:'smooth'});else document.getElementById(readURL().path.slice(1))?.scrollIntoView({behavior:'smooth'})}});
window.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();$('#search-open').click()}});
try{
 const response=await fetch('./data/catalog.json');if(!response.ok)throw new Error(`Catalog HTTP ${response.status}`);catalog=contentModel(await response.json());
 nodes=new Map(catalog.entries.map(n=>[n.id,n]));names=new Map(catalog.entries.map(n=>[n.name,n]));backlinks=new Map();
 for(const n of nodes.values())for(const e of n.links){if(!backlinks.has(e.target))backlinks.set(e.target,[]);backlinks.get(e.target).push({target:n.id,type:e.type,origin:e.origin})}
 render();
}catch(error){console.error(error);$('#main').innerHTML=`<div class="wrap empty"><h1>${t().failed}</h1><button class="primary" onclick="location.reload()">${t().retry}</button></div>`;}

let tocFrame=0;
window.addEventListener('scroll',()=>{if(tocFrame)return;tocFrame=requestAnimationFrame(()=>{tocFrame=0;const toc=$('.overview-toc');if(!toc)return;const threshold=$('#header').offsetHeight+toc.offsetHeight+35;let active='/';for(const id of ['why','system','cases','about'])if(document.getElementById(id)?.getBoundingClientRect().top<=threshold)active='/'+id;toc.querySelectorAll('a').forEach(a=>{if(a.getAttribute('href')==='#'+active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});});},{passive:true});
