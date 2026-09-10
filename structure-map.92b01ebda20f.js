import {mapFullscreen} from './map-fullscreen.92b01ebda20f.js';
import {mapCamera} from './map-camera.92b01ebda20f.js';
export function mountStructureMap(host,{lang='zh',onOpen=()=>{}}={}){
 const zh=lang==='zh';
 const labels=[['体验形态','Experience form'],['主观感受','Subjective feelings'],['感受诱因','Eliciting factors'],['设计杠杆','Design levers']];
 const keys=['forms','feelings','factors','levers'];
 const subs={
  narrative:[['叙事建构','Narrative Architecture','故事是什么','What is the story'],['叙事呈现','Narrative Exposition','故事如何讲述','How the story is told']],
  gameplay:[['核心循环构建','Core Loop Construction','玩什么','What to play'],['手感调校','Game Feel Tuning','瞬时操作体验','Moment to moment'],['节奏控制','Pacing Control','体验如何推进','Flow buildup']],
  aesthetics:[['艺术方向','Artistic Direction','呈现什么','What to show'],['艺术呈现','Artistic Presentation','如何呈现','How to show']]
 };
 const node=(x,y,w,h,title,subtitle,key,extra='')=>`<g class="structure-map-node ${extra}" role="button" tabindex="0" data-open="${key}" aria-label="${title}" transform="translate(${x},${y})"><rect width="${w}" height="${h}" rx="6"/><text x="${w/2}" y="${h===80?30:27}" text-anchor="middle">${title}</text><text class="map-subtitle" x="${w/2}" y="${h===80?56:49}" text-anchor="middle">${subtitle}</text></g>`;
 const edge=(d,label,x,y,double=false)=>`<path class="structure-map-edge ${double?'enhancement':''}" d="${d}" marker-end="url(#structure-arrow)" ${double?'marker-start="url(#structure-arrow)"':''}/><text class="structure-edge-label" x="${x}" y="${y}" text-anchor="middle">${label}</text>`;
 let content=`<defs><marker id="structure-arrow" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="8" refY="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="currentColor"/></marker></defs>`;
 [40,180,310,440].forEach((y,i)=>{content+=node(380,y,320,64,labels[i][zh?0:1],labels[i][zh?1:0],keys[i]);});
 content+=edge('M540 104V180',zh?'感知为':'perceived as',600,150);
 content+=edge('M540 244V310',zh?'归因于':'attributed to',600,285);
 content+=edge('M540 374V440',zh?'由设计手段触发':'triggered by',643,412);
 content+=edge('M420 504L180 660',zh?'包含':'includes',290,577);
 content+=edge('M540 504V600',zh?'包含':'includes',590,556);
 content+=edge('M660 504L900 660',zh?'包含':'includes',790,577);
 content+=node(40,660,280,64,zh?'叙事':'Narrative',zh?'Narrative':'叙事','narrative');
 content+=node(400,600,280,64,zh?'玩法与挑战':'Gameplay & Challenges',zh?'Gameplay & Challenges':'玩法与挑战','gameplay');
 content+=node(760,660,280,64,zh?'美学':'Aesthetics',zh?'Aesthetics':'美学','aesthetics');
 content+=edge('M320 678L400 646',zh?'相互增强':'enhanced by',308,632,true);
 content+=edge('M680 646L760 678',zh?'相互增强':'enhanced by',772,632,true);
 content+=edge('M180 724V765H900V724',zh?'相互增强':'enhanced by',540,771,true);
 ['narrative','gameplay','aesthetics'].forEach((key,index)=>{const x=40+index*360;subs[key].forEach((row,i)=>{content+=node(x,810+i*90,280,80,row[zh?0:1],row[zh?2:3],key,'sublever');});});
 host.innerHTML=`<div class="structure-map-tools"><span>${zh?'点击节点展开内容 · 拖拽平移 · 滚轮缩放':'Select a node to open it · Drag to pan · Scroll to zoom'}</span><div><button data-map-zoom="out" aria-label="${zh?'缩小':'Zoom out'}">−</button><output></output><button data-map-zoom="in" aria-label="${zh?'放大':'Zoom in'}">＋</button><button data-map-zoom="fit">${zh?'全图':'Fit'}</button></div></div><div class="structure-map-viewport" tabindex="0" aria-label="${zh?'EGDS整体结构地图':'EGDS structure map'}"><svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1100" class="structure-map-svg" role="group">${content}</svg></div><p class="structure-map-caption">${zh?'依据作者结构图整理，采用 v0.3 术语。':'Adapted from the author’s diagrams using v0.3 terminology.'}</p>`;
 const viewport=host.querySelector('.structure-map-viewport'),svg=host.querySelector('svg');const camera=mapCamera(viewport,svg,{width:1080,height:1100,onZoom:value=>host.querySelector('output').textContent=Math.round(value*100)+'%'});camera.fit();mapFullscreen(host,host.querySelector('.structure-map-tools>div'),{lang,onResize:()=>camera.fit()});
 function open(target){if(target){onOpen(target.dataset.open);}}
 svg.addEventListener('click',e=>open(e.target.closest('[data-open]')));
 svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e.target.closest('[data-open]'));}});
 host.addEventListener('click',e=>{const b=e.target.closest('[data-map-zoom]');if(!b)return;if(b.dataset.mapZoom==='fit')camera.fit();else camera.zoomTo(camera.getScale()*(b.dataset.mapZoom==='in'?1.2:.8));});
}
