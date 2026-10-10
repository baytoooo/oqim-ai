import fs from 'node:fs/promises';
import {matchCrossings} from '../dist/measurement.js';
const measurement=JSON.parse(await fs.readFile(new URL('../evaluation/motorway-measurement.json',import.meta.url),'utf8'));
const reference=JSON.parse(await fs.readFile(new URL('../evaluation/reference/motorway_inbound_gt.json',import.meta.url),'utf8'));
const predictions=measurement.events.filter(e=>e.direction==='down'),labels=reference.crossings.map(x=>({...x,time:x.frame/30,direction:'down'}));
// Reference protocol: asymmetric [-1,+4] frame tolerance and greedy nearest-first.
const candidates=[];for(let i=0;i<predictions.length;i++)for(let j=0;j<labels.length;j++){
 const delta=predictions[i].time*30-labels[j].frame;
 if(delta>=-1-1e-8&&delta<=4+1e-8)candidates.push({i,j,delta});
}
candidates.sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta)||a.i-b.i||a.j-b.j);
const usedP=new Set(),usedR=new Set(),matches=[];
for(const c of candidates)if(!usedP.has(c.i)&&!usedR.has(c.j)){usedP.add(c.i);usedR.add(c.j);matches.push({prediction:predictions[c.i],reference:labels[c.j],signedFrameError:c.delta});}
// Bipartite augmenting paths give a maximum-cardinality comparison for same eligibility.
const assigned=new Map();function augment(i,seen){for(const c of candidates.filter(c=>c.i===i)){if(seen.has(c.j))continue;seen.add(c.j);if(!assigned.has(c.j)||augment(assigned.get(c.j),seen)){assigned.set(c.j,i);return true;}}return false;}
let maximum=0;for(let i=0;i<predictions.length;i++)if(augment(i,new Set()))maximum++;
const tp=matches.length,strict={intervalFrames:[-1,4],fps:30,matching:'greedy nearest absolute frame error, ties prediction then label index',tp,fp:predictions.length-tp,fn:labels.length-tp,precision:predictions.length?tp/predictions.length:null,recall:tp/labels.length,f1:2*tp/(predictions.length+labels.length),maximumCardinalityTP:maximum,certainMatched:matches.filter(x=>x.reference.confidence==='certain').length,certainTotal:labels.filter(x=>x.confidence==='certain').length,matches};
const coarse=matchCrossings(predictions,labels,.5);
const report={schema:'oqim.cv-evaluation.v1',reference:{repository:'https://github.com/safdar-hussain1/trafficlens',commit:'f0eaf0181c1d25e2c05ef95ae7f3cc312e3e1150',author:'Safdar Hussain',license:'MIT',certain:7,probable:10},video:measurement.video,model:measurement.model,backend:measurement.backend,gate:measurement.gate,line:measurement.line,threshold:measurement.threshold,samplingHz:measurement.samplingHz,hardware:'Apple M5, 16 GiB RAM, macOS, Chromium in Codex',predicted:predictions.length,referenceCount:labels.length,absoluteCountError:Math.abs(predictions.length-labels.length),strict,coarseDiagnostic:coarse,elapsedSeconds:measurement.elapsedSeconds,inferenceMeanMs:measurement.inferenceMeanMs,limitations:'One daylight clip, transcoded960px, partly uncertain external labels, no per-class accuracy, no night/rain/local or mobile validation. Coarse diagnostic is not the reference protocol and cannot replace the strict score.'};
report.displaySummary=`A40: ${predictions.length} пересечений против ${labels.length} внешних меток, ошибка общего счёта ${report.absoluteCountError}. Строгое совпадение по времени (−1/+4 кадра): ${tp}/${labels.length}, F1 ${(100*strict.f1).toFixed(1)}%. По уверенным меткам: ${strict.certainMatched}/${strict.certainTotal}. При диагностическом допуске ±0,5 с: ${coarse.tp}/${labels.length}. ${measurement.sampledFrames} кадров за ${measurement.elapsedSeconds.toFixed(1)} с на Apple M5 / 16 ГБ (${measurement.backend}). Совпадение итогового количества не означает правильность отдельных событий.`;
await fs.writeFile(new URL('../dist/evidence/cv-evaluation.json',import.meta.url),JSON.stringify(report,null,2));console.log(report.displaySummary);
