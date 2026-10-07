// Display corrections are explicit and reproducible; the imported PKM snapshot stays intact.
export function contentModel(snapshot){
 const entries=snapshot.entries.map(n=>({...n,links:n.links.map(e=>({...e}))}));
 for(const n of entries)if(/^(game systems|game mechanics) - /.test(n.name)){n.category='levers';n.branch='gameplay';n.title=Object.fromEntries(Object.entries(n.title).map(([lang,value])=>[lang,value.replace(/^(game systems|game mechanics) - /,'')]));}
 const systems=entries.find(n=>n.name==='游戏系统 game systems'),mechanics=entries.find(n=>n.name==='游戏机制 game mechanics');
 if(!systems||!mechanics)throw new Error('Required game-system or game-mechanic hub is missing from the snapshot');
 if(!systems.links.some(e=>e.target===mechanics.id&&e.type==='supported by'))systems.links.push({target:mechanics.id,type:'supported by',origin:'author-clarification'});
 const narrative=entries.find(n=>n.name==='叙事 narrative');
 const namedParts=new Set(entries.filter(n=>['叙事结构 narrative structure','叙事内容 narrative content'].includes(n.name)).map(n=>n.id));
 if(narrative)narrative.links=narrative.links.map(e=>e.type==='related'&&namedParts.has(e.target)?{...e,type:'including',sourceType:'related',origin:'author-clarification'}:e);
 // Case interpretation grounded in the author's Zora example, not an imported PKM edge.
 const mismatch=entries.find(n=>n.name==='objective reason - 不匹配 unmatch'),size=entries.find(n=>n.name==='aesthetics - visual - 大小 size'),zora=entries.find(n=>n.name==='character - 卓拉 zora');
 if(mismatch&&size&&zora){
  for(const [from,to,type] of [[mismatch,size,'achieved with'],[size,zora,'have example']])if(!from.links.some(e=>e.target===to.id&&e.type===type))from.links.push({target:to.id,type,origin:'case-interpretation',evidence:zora.id});
 }
 return {...snapshot,entries};
}
export const hierarchyTypes=['supported by','achieved with','including','consist of','have example'];
export function hierarchyEdges(node,nodes){
 return node.links.filter(e=>nodes.get(e.target)?.category==='levers'&&(hierarchyTypes.includes(e.type)||(node.name==='叙事 narrative'&&e.type==='related'))).sort((a,b)=>(hierarchyTypes.indexOf(a.type)<0?99:hierarchyTypes.indexOf(a.type))-(hierarchyTypes.indexOf(b.type)<0?99:hierarchyTypes.indexOf(b.type)));
}
export function relationName(type,lang='zh'){
 return lang==='zh'?({'supported by':'由……支撑','achieved with':'通过……实现',including:'包含','consist of':'由……组成','have example':'案例',related:'相关主题','caused by':'由……引发','driven by':'由……驱动','enhanced by':'由……增强','contributes to':'有助于','affected by':'受……影响'}[type]||type):type;
}
