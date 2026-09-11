// Orthogonal focused links: aligned chains stay vertical; skipped nodes are bypassed.
export function focusEdgePath(a,b,nodes){
 const ax=a.x+a.w/2,bx=b.x+b.w/2;
 if(a.y===b.y){const lane=Math.min(a.y,b.y)-20;return `M${ax} ${a.y} L${ax} ${lane} L${bx} ${lane} L${bx} ${b.y}`;}
 const down=a.y<b.y,sign=down?1:-1,ay=a.y+(down?a.h:0),by=b.y+(down?0:b.h),lo=Math.min(ay,by),hi=Math.max(ay,by);
 const blockers=nodes.filter(n=>n.id!==a.id&&n.id!==b.id&&n.y<hi&&n.y+n.h>lo&&n.x<Math.max(ax,bx)+8&&n.x+n.w>Math.min(ax,bx)-8);
 if(blockers.length){const lane=Math.max(a.x+a.w,b.x+b.w,...blockers.map(n=>n.x+n.w))+32;
  return `M${ax} ${ay} L${ax} ${ay+sign*12} L${lane} ${ay+sign*12} L${lane} ${by-sign*12} L${bx} ${by-sign*12} L${bx} ${by}`;
 }
 const mid=(ay+by)/2;return ax===bx?`M${ax} ${ay} L${bx} ${by}`:`M${ax} ${ay} L${ax} ${mid} L${bx} ${mid} L${bx} ${by}`;
}
