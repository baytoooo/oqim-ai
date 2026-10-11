import test from 'node:test';
import assert from 'node:assert/strict';
import {vehicleInstances,drawCamera3D} from '../dist/camera3d.js';
import {selectedNetwork} from '../dist/junctions.js';
import {validate,compare,demand} from '../dist/engine.js';
test('stationary detections render one instance each without a cap',()=>{for(const count of [0,10,35]){const boxes=Array.from({length:count},(_,i)=>({class:'car',bbox:[i/100,.3,.02,.05]}));let roofs=0;const ctx=new Proxy({fill(){roofs++;}},{get:(o,k)=>k in o?o[k]:(()=>{})});assert.equal(drawCamera3D({width:640,height:400,getContext:()=>ctx},boxes),count);assert.equal(roofs,count*2);assert.deepEqual(vehicleInstances(boxes),vehicleInstances(boxes));}});
test('selected geographic chain runs and preserves coordinates',()=>{const points=[[69.26,41.32],[69.27,41.31],[69.28,41.3]],nodes=validate(selectedNetwork(points));assert.equal(nodes[0].next,'J2');assert.equal(nodes[2].next,null);assert.deepEqual(nodes.map(n=>n.coordinates),points);assert.throws(()=>selectedNetwork([]));assert.throws(()=>validate([{...nodes[0],next:null,coordinates:[NaN,41]}]));const p={seconds:60,rate:500,side:100,seed:7,event:false,block:false,parking:0};for(const r of compare(nodes,demand(nodes,p),p))assert.ok(Math.abs(r.metrics.conservationError)<1e-6);});
