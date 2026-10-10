import {benchmark} from './benchmark.js';
self.onmessage=()=>{const result=benchmark(progress=>{if(progress%10===0)self.postMessage({progress});});self.postMessage(result);};
