// Explicit teaching parameters, not estimates derived from camera footage.
export function recommend(counts, congestion=false) {
  return [{id:'A',capacity:3,drive:4+counts.A*1.5+(congestion?6:0),walk:2},{id:'B',capacity:4,drive:6+counts.B,walk:3}]
    .map(p=>({...p,free:Math.max(0,p.capacity-counts[p.id]),total:p.drive+p.walk}))
    .filter(p=>p.free>0).sort((a,b)=>a.total-b.total)[0]||null;
}
