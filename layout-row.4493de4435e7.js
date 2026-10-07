// Center the actual rendered row, including a partial final row, on its parent's axis.
export function centeredRow(items,{center,y,width,height=46,gap=14}){
 const total=items.length*width+Math.max(0,items.length-1)*gap;
 return items.map((item,i)=>({...item,x:center-total/2+i*(width+gap),y,w:width,h:height}));
}
