import {network,demand,compare} from './engine.js';
export function benchmark(onProgress){
const rows=[];const started=performance.now();
// Fixed Cartesian grid, specified before inspecting results. No cases filtered by outcome.
for(const rate of [300,650,1200,1800])for(const side of [120,360])for(const scenario of ['steady','surge','blockage'])for(const seed of [11,23,42,71,101]){
 const parameters={seconds:600,rate,side,seed,event:scenario==='surge',block:scenario==='blockage',parking:0},nodes=network(4);
 const results=compare(nodes,demand(nodes,parameters),parameters).map(({mode,metrics})=>({mode,metrics}));
 const [f,r,p]=results.map(x=>x.metrics);
 if(onProgress)onProgress(rows.length+1);
 rows.push({scenario,parameters,results,gainVsFixedPercent:100*(f.delay-p.delay)/f.delay,gainVsReactivePercent:100*(r.delay-p.delay)/r.delay});
}
const summary=key=>{const a=rows.map(r=>r[key]).sort((a,b)=>a-b);return{cases:a.length,mean:a.reduce((a,b)=>a+b,0)/a.length,median:(a[a.length/2-1]+a[a.length/2])/2,min:a[0],max:a.at(-1),wins:a.filter(x=>x>1e-8).length,ties:a.filter(x=>Math.abs(x)<=1e-8).length,losses:a.filter(x=>x< -1e-8).length};};
const report={schema:'oqim.benchmark.v2',method:'120 fixed Cartesian scenarios: 4 main rates × 2 side rates × 3 conditions × 5 seeds. Four nodes; 600 s. Same arrivals in every mode. No case excluded.',scope:'Synthetic fluid queue model only. No real-world effect, statistical population inference or generalization claim.',summary:{vsFixed:summary('gainVsFixedPercent'),vsReactive:summary('gainVsReactivePercent')},maxConservationError:Math.max(...rows.flatMap(r=>r.results.map(x=>x.metrics.conservationError))),runtimeMs:performance.now()-started,rows};
return report;
}
