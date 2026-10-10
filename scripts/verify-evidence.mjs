import fs from 'node:fs/promises';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import{benchmark}from'../dist/benchmark.js';
const read=async p=>JSON.parse(await fs.readFile(new URL('../'+p,import.meta.url),'utf8'));
const saved=await read('dist/evidence/network-benchmark.json'),actual=benchmark();
assert.deepEqual(actual.rows,saved.rows);assert.deepEqual(actual.summary,saved.summary);
const cv=await read('dist/evidence/cv-evaluation.json'),m=await read('evaluation/motorway-measurement.json'),gt=await read('evaluation/reference/motorway_inbound_gt.json');
const clip=await fs.readFile(new URL('../dist/samples/motorway-a40.mp4',import.meta.url));
assert.equal(crypto.createHash('sha256').update(clip).digest('hex'),m.video.sha256);
assert.equal(cv.predicted,m.events.filter(e=>e.direction==='down').length);assert.equal(cv.referenceCount,gt.crossings.length);
assert.equal(cv.strict.tp+cv.strict.fp,cv.predicted);assert.equal(cv.strict.tp+cv.strict.fn,cv.referenceCount);
const predictionIds=new Set(),referenceIds=new Set();for(const match of cv.strict.matches){assert.ok(match.signedFrameError>=-1-1e-8&&match.signedFrameError<=4+1e-8);assert.ok(!predictionIds.has(match.prediction.id));assert.ok(!referenceIds.has(match.reference.id));predictionIds.add(match.prediction.id);referenceIds.add(match.reference.id);}
console.log('Evidence verified: all120scenario outcomes reproduced; clip hash and one-to-one event matches checked. No GPU inference rerun by this check.');
