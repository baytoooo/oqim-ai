// Measurement-to-simulation boundary. Statistical uncertainty is not detector accuracy.
export function summarizeFlow(measurement, direction='all') {
  if (!['all','up','down'].includes(direction)) throw Error('Неизвестное направление');
  if (!measurement || !Number.isFinite(measurement.duration) || measurement.duration <= 0) throw Error('Нет обработанного интервала');
  const events=measurement.events.filter(e=>direction==='all'||e.direction===direction);
  const count=events.length, scale=3600/measurement.duration, z=1.959963984540054;
  // Inverted normal-score test for a Poisson mean; approximate, not exact Garwood.
  const centre=count+z*z/2, half=z*Math.sqrt(count+z*z/4);
  return {direction,count,rate:count*scale,interval95:[Math.max(0,centre-half)*scale,(centre+half)*scale],
    intervalMethod:'Approximate Poisson score interval, constant independent arrivals; excludes detector errors',
    shortWindow:measurement.duration<60,complete:measurement.complete};
}

// Ordered one-to-one temporal matching maximizes cardinality, then minimizes timing error.
// Direction required, class deliberately ignored: this is crossing evaluation, not detection mAP.
export function matchCrossings(predictions, references, tolerance=.5) {
  if(!Number.isFinite(tolerance)||tolerance<0)throw Error('Invalid tolerance');
  const p=[...predictions].sort((a,b)=>a.time-b.time),r=[...references].sort((a,b)=>a.time-b.time);
  const dp=Array.from({length:p.length+1},()=>Array(r.length+1));
  for(let i=0;i<=p.length;i++)for(let j=0;j<=r.length;j++){
    if(!i||!j){dp[i][j]={n:0,error:0,pairs:[]};continue;}
    const candidates=[dp[i-1][j],dp[i][j-1]],delta=Math.abs(p[i-1].time-r[j-1].time);
    if(delta<=tolerance&&p[i-1].direction===r[j-1].direction){const prev=dp[i-1][j-1];candidates.push({n:prev.n+1,error:prev.error+delta,pairs:[...prev.pairs,{prediction:p[i-1],reference:r[j-1],errorSeconds:delta}]});}
    dp[i][j]=candidates.sort((a,b)=>b.n-a.n||a.error-b.error)[0];
  }
  const best=dp[p.length][r.length],tp=best.n,fp=p.length-tp,fn=r.length-tp;
  return{toleranceSeconds:tolerance,classMatching:false,tp,fp,fn,predicted:p.length,reference:r.length,
    precision:p.length?tp/p.length:null,recall:r.length?tp/r.length:null,f1:p.length+r.length?2*tp/(p.length+r.length):null,
    absoluteCountError:Math.abs(p.length-r.length),meanTimingErrorSeconds:tp?best.error/tp:null,matches:best.pairs};
}
