import fs from 'node:fs/promises';
import {benchmark} from '../dist/benchmark.js';
const report=benchmark();
await fs.mkdir(new URL('../dist/evidence/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../dist/evidence/network-benchmark.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,rows:undefined},null,2));
