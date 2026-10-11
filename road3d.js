// Dependency-free orthographic 3D renderer. All quantities come from engine snapshots.
// Cars represent aggregate volume, not reconstructed vehicle trajectories.
export function drawRoad3D(canvas,{nodes,frame,index=0,angle=-25,mode}){
 index=Math.max(0,Math.min(index,nodes.length-1));
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,s=frame?.nodes[index],node=nodes[index];
 const yaw=angle*Math.PI/180,co=Math.cos(yaw),si=Math.sin(yaw),scale=1.15;
 const project=([x,y,z])=>{const rx=x*co-y*si,ry=x*si+y*co;return [w/2+rx*scale,h*.55+ry*.46*scale-z*scale,ry+z*.05];};
 const faces=[];
 const poly=(points,color)=>{const p=points.map(project);faces.push({p,color,layer:points.some(v=>v[2]>1)?1:0,depth:p.reduce((n,v)=>n+v[2],0)/p.length});};
 const box=(x,y,z,dx,dy,dz,color,top=color)=>{const a=[x,y,z],b=[x+dx,y,z],c=[x+dx,y+dy,z],d=[x,y+dy,z],A=[x,y,z+dz],B=[x+dx,y,z+dz],C=[x+dx,y+dy,z+dz],D=[x,y+dy,z+dz];poly([a,b,B,A],color);poly([b,c,C,B],color);poly([c,d,D,C],color);poly([d,a,A,D],color);poly([A,B,C,D],top);};
 ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#172a39');bg.addColorStop(1,'#0a141e');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 poly([[-370,-260,-3],[370,-260,-3],[370,260,-3],[-370,260,-3]],'#203d3c');
 poly([[-370,-62,0],[370,-62,0],[370,62,0],[-370,62,0]],'#354452');
 poly([[-62,-260,.1],[62,-260,.1],[62,260,.1],[-62,260,.1]],'#354452');
 // Raised pavements and understated city blocks provide depth without hiding the road.
 for(const x of [-320,150])for(const y of [-190,110]){box(x,y,0,150,68,5,'#52636b','#70868a');for(let i=0;i<3;i++)box(x+8+i*45,y+10,5,32,40,18+(i%2)*14,'#314652','#4c6674');}
 for(let x=-360;x<360;x+=34)if(Math.abs(x)>70)poly([[x,-2,1],[x+18,-2,1],[x+18,2,1],[x,2,1]],'#b2c2c4');
 for(let y=-245;y<245;y+=32)if(Math.abs(y)>70)poly([[-2,y,1],[2,y,1],[2,y+17,1],[-2,y+17,1]],'#b2c2c4');
 // Stop lines for eastbound main and southbound side traffic.
 poly([[-78,5,1],[-73,5,1],[-73,56,1],[-78,56,1]],'#edf5ec');
 poly([[5,-78,1],[56,-78,1],[56,-73,1],[5,-73,1]],'#edf5ec');
 const car=(x,y,side,color)=>{const dx=side?12:22,dy=side?22:12;box(x,y,2,dx,dy,8,color);box(x+3,y+3,10,dx-6,dy-6,5,'#84bdcc','#badbe3');};
 const q=s?.q||0,bq=s?.side||0;
 for(let k=0;k<Math.min(12,Math.ceil(q));k++)car(-104-Math.floor(k/2)*30,12+(k%2)*24,false,q/node.capacity>.9?'#ef7883':'#edb96a');
 for(let k=0;k<Math.min(12,Math.ceil(bq));k++)car(12+(k%2)*24,-105-Math.floor(k/2)*28,true,'#edb96a');
 // In-transit cohorts appear beyond the junction, re-positioned by simulation time.
 const next=nodes.findIndex(n=>n.id===node.next),transit=next>=0?(frame?.nodes[next]?.transit||0):0;
 for(let k=0;k<Math.min(8,Math.ceil(transit));k++)car(90+((k*37+(frame?.t||0)*6)%230),12+(k%2)*24,false,'#70e4b7');
 const light=(x,y,phase)=>{box(x,y,0,4,4,48,'#15202b');box(x-6,y-2,42,16,9,32,'#0b151e');const p=project([x+2,y+9,58]);faces.push({p:null,depth:p[2]+1,light:p,color:phase==='go'?'#70e4b7':phase==='yellow'?'#ffcf6e':'#ff6b7c'});};
 const cycle=(((frame?.t||1)-1-node.offset)%60+60)%60;
 light(-70,70,s?.phase==='main'?'go':s?.phase==='yellow'&&cycle<50?'yellow':'stop');light(70,-70,s?.phase==='side'?'go':s?.phase==='yellow'&&cycle>=50?'yellow':'stop');
 faces.sort((a,b)=>(a.layer??1)-(b.layer??1)||a.depth-b.depth);for(const f of faces){if(f.light){ctx.shadowColor=f.color;ctx.shadowBlur=14;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.light[0],f.light[1],6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;continue;}ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();}
 const fmt=v=>(v||0).toLocaleString('ru-RU',{maximumFractionDigits:1});
 function text(str,x,y,size=15,color='#e5f0f3'){ctx.fillStyle=color;ctx.font=`${size>=19?'bold ':''}${size}px sans-serif`;ctx.fillText(str,x,y);}
 ctx.fillStyle='#0b1725dc';ctx.fillRect(20,18,350,84);text(`${node.id} · ${mode}`,34,45,21);text(`Основная очередь: ${fmt(q)} машин`,34,69,15,'#f3ce8b');text(`Боковая: ${fmt(bq)} · вне въезда: ${fmt(s?.outside)}`,34,90,14);
 ctx.fillStyle='#0b1725dc';ctx.fillRect(w-292,18,272,84);text('СВЕТОФОР СЕЙЧАС',w-276,42,12,'#a4beca');text(s?.phase==='main'?'Основная дорога →':s?.phase==='side'?'Боковая дорога ↓':s?.phase==='yellow'?'Смена сигнала':'Все стоят',w-276,66,19,s?.phase==='main'||s?.phase==='side'?'#70e4b7':'#edb96a');text(`Зелёный основного: ${s?.green??25} с`,w-276,90,14);
 text('ОСНОВНОЙ ПОТОК →',24,h-40,14,'#89efc8');text(`Связь: ${node.id} → ${node.next||'выход из сети'} · в пути: ${fmt(transit)}`,24,h-18,13,'#aac0cc');
 text('Оранжевые — очередь · зелёные — поток между узлами',w-450,h-18,12,'#aac0cc');
}
