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

// Network view uses actual directed links and source-tagged in-transit cohorts.
export function drawNetwork3D(canvas,{nodes,frame,index=0,angle=-25,mode,fraction=0}){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cols=Math.min(4,nodes.length),rows=Math.ceil(nodes.length/cols);
 const yaw=angle*Math.PI/360,co=Math.cos(yaw),si=Math.sin(yaw),scale=Math.min(1,(h-135)/(rows*135));
 const world=nodes.map((_,i)=>({x:(i%cols-(cols-1)/2)*235,y:(Math.floor(i/cols)-(rows-1)/2)*245}));
 const p=(x,y,z=0)=>({x:w/2+(x*co-y*si)*scale,y:h/2+25+(x*si+y*co)*.48*scale-z*scale});
 function polygon(vertices,color){c.fillStyle=color;c.beginPath();vertices.forEach((v,i)=>{const a=p(...v);i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y);});c.closePath();c.fill();}
 function box(x,y,dx,dy,dz,color){polygon([[x,y,0],[x+dx,y,0],[x+dx,y,dz],[x,y,dz]],'#375760');polygon([[x+dx,y,0],[x+dx,y+dy,0],[x+dx,y+dy,dz],[x+dx,y,dz]],'#47636c');polygon([[x,y,dz],[x+dx,y,dz],[x+dx,y+dy,dz],[x,y+dy,dz]],color);}
 function road(a,b,width,color){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len*width/2,ny=dx/len*width/2;polygon([[a.x+nx,a.y+ny,0],[b.x+nx,b.y+ny,0],[b.x-nx,b.y-ny,0],[a.x-nx,a.y-ny,0]],color);}
 c.fillStyle='#101f2b';c.fillRect(0,0,w,h);c.fillStyle='#cce6e9';c.font='bold 22px sans-serif';c.fillText(`Вся сеть · ${mode}`,24,34);c.font='14px sans-serif';c.fillStyle='#9db9c5';c.fillText('Зелёные группы едут по стрелкам. Оранжевые ждут перед светофором.',24,60);
 // Draw roads before elevated objects so roads never cover the cars.
 nodes.forEach((n,i)=>{const a=world[i],j=nodes.findIndex(v=>v.id===n.next);road({x:a.x-100,y:a.y},{x:a.x+95,y:a.y},52,'#354a59');road({x:a.x,y:a.y-78},{x:a.x,y:a.y+66},35,'#354a59');if(j>=0)road(a,world[j],48,'#354a59');});
 nodes.forEach((n,i)=>{const a=world[i],j=nodes.findIndex(v=>v.id===n.next),s=frame?.nodes[i];if(j>=0){const b=world[j],m=p((a.x+b.x)/2,(a.y+b.y)/2),dx=b.x-a.x,dy=b.y-a.y;const u=p(a.x+dx*.58,a.y+dy*.58);c.strokeStyle='#7ba49e';c.lineWidth=2;c.beginPath();c.moveTo(m.x,m.y);c.lineTo(u.x,u.y);c.stroke();const theta=Math.atan2(u.y-m.y,u.x-m.x);c.beginPath();c.moveTo(u.x-9*Math.cos(theta-.5),u.y-9*Math.sin(theta-.5));c.lineTo(u.x,u.y);c.lineTo(u.x-9*Math.cos(theta+.5),u.y-9*Math.sin(theta+.5));c.stroke();const batches=(frame?.nodes[j]?.batches||[]).filter(v=>v.from===n.id);for(const batch of batches.slice(0,12)){const f=Math.max(0,Math.min(.98,1-(batch.eta-fraction)/nodes[j].travel));box(a.x+dx*f-7,a.y+dy*f+14,14,8,7,'#70e4b7');}}
 for(let k=0;k<Math.min(6,Math.ceil(s?.q||0));k++)box(a.x-30-k*12,a.y+10,10,7,6,'#edb96a');for(let k=0;k<Math.min(4,Math.ceil(s?.side||0));k++)box(a.x+8,a.y-28-k*12,7,10,6,'#edb96a');box(a.x+24,a.y-24,4,4,35,'#a5bcc1');const light=p(a.x+26,a.y-22,40);c.fillStyle=s?.phase==='main'?'#70e4b7':s?.phase==='yellow'?'#edb96a':'#ef7883';c.beginPath();c.arc(light.x,light.y,6*scale,0,Math.PI*2);c.fill();});
 const hits=nodes.map((n,i)=>{const a=world[i],loc=p(a.x,a.y),s=frame?.nodes[i],label=p(a.x,a.y-90);c.fillStyle=i===index?'#234f46':'#152b38';c.fillRect(label.x-70,label.y-40,140,52);c.strokeStyle=i===index?'#70e4b7':'#395363';c.strokeRect(label.x-70,label.y-40,140,52);c.textAlign='center';c.font='bold 16px sans-serif';c.fillStyle='#e0f4f1';c.fillText(n.id.slice(0,14),label.x,label.y-20);c.font='12px sans-serif';c.fillStyle='#edb96a';c.fillText(`Очередь ${(s?.q||0).toFixed(1)}`,label.x,label.y);c.textAlign='left';return {...loc,index:i};});
 c.font='13px sans-serif';c.fillStyle='#a6bfca';c.fillText('Объёмная схема: положение узлов условное. 1 зелёный значок = группа потока, не отдельная машина.',24,h-24);return hits;
}
