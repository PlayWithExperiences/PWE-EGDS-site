// Build a display forest from recorded containment/support edges; cross-links stay separate.
export function leverForest(nodes,edges){
 const byId=new Map(nodes.map(n=>[n.id,n])),parent=new Map(),children=new Map(nodes.map(n=>[n.id,[]]));
 const allowed=edges.filter(e=>byId.has(e.from)&&byId.has(e.to)&&e.from!==e.to&&byId.get(e.from).branch===byId.get(e.to).branch&&['including','consist of'].includes(e.type));
 allowed.sort((a,b)=>(['including','consist of','supported by','have example'].indexOf(a.type)-['including','consist of','supported by','have example'].indexOf(b.type))||a.from.localeCompare(b.from));
 for(const e of allowed){if(parent.has(e.to))continue;let id=e.from,cycle=false;while(id){if(id===e.to){cycle=true;break;}id=parent.get(id)?.from;}if(!cycle){parent.set(e.to,e);children.get(e.from).push(e.to);}}
 return {roots:nodes.filter(n=>!parent.has(n.id)),parent,children,byId};
}
export function layoutLeverTree(nodes,edges,{x=24,y=0,width=1152,columns=4}={}){
 const tree=leverForest(nodes,edges),placed=[],families=[];const gap=14,h=46,row=64;
 function node(id,left,top,w){placed.push({...tree.byId.get(id),x:left,y:top,w:Math.min(200,w),h});}
 function branch(id,left,top,w){
  const kids=tree.children.get(id);node(id,left+14,top+14,w-28);let cursor=top+78;
  const leaves=kids.filter(k=>!tree.children.get(k).length),branches=kids.filter(k=>tree.children.get(k).length);
  const cols=Math.max(1,Math.min(columns,Math.floor((w-40)/145))),cell=(w-40-(cols-1)*gap)/cols;
  leaves.forEach((k,i)=>node(k,left+26+(i%cols)*(cell+gap),cursor+Math.floor(i/cols)*row,cell));cursor+=Math.ceil(leaves.length/cols)*row;
  for(const k of branches){cursor=branch(k,left+20,cursor,w-32)+14;}
  if(kids.length)families.push({id,x:left,y:top,width:w,height:cursor-top+8});
  return kids.length?cursor+8:top+row;
 }
 const rootIds=new Set(tree.roots.map(n=>n.id)),supports=edges.filter(e=>e.type==='supported by'&&rootIds.has(e.from)&&rootIds.has(e.to)),ordered=[],seen=new Set();
 function order(id){if(seen.has(id))return;seen.add(id);ordered.push(id);for(const e of supports.filter(e=>e.from===id))order(e.to);}
 for(const n of tree.roots.filter(n=>!supports.some(e=>e.to===n.id)))order(n.id);for(const n of tree.roots)order(n.id);
 let cursor=y;for(const id of ordered){cursor=branch(id,x,cursor,width)+16;}
 return {nodes:placed,families,height:cursor-y,parent:tree.parent};
}
