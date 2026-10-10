import {MultiTracker} from './vendor/tracker.js';
const classes={car:2,motorcycle:3,bus:5,truck:7},labels=Object.fromEntries(Object.entries(classes).map(([k,v])=>[v,k]));
// ByteTrack browser port by PariVision (AGPL-3.0); OQIM adds line crossing accounting.
export class Tracker{
constructor(fps=5){this.fps=fps;this.reset();}
reset(){this.core=new MultiTracker(this.fps,1.5,{GROUPS:{vehicle:[2,3,5,7]},bytetrack:{track_high_thresh:.3,track_low_thresh:.1,new_track_thresh:.3,match_thresh:.8,fuse_score:true}});this.tracks=[];this.memory=new Map();this.counts={car:0,bus:0,truck:0,motorcycle:0};this.events=[];}
update(boxes,time,line=.55){const detections=boxes.map(b=>({x1:b.bbox[0]*1000,y1:b.bbox[1]*1000,x2:(b.bbox[0]+b.bbox[2])*1000,y2:(b.bbox[1]+b.bbox[3])*1000,conf:b.score,cls:classes[b.class]}));const rows=this.core.update(detections,[1000,1000]);this.tracks=rows.map(([x1,y1,x2,y2,id,score,cls])=>{const x=(x1+x2)/2000,y=(y1+y2)/2000,label=labels[cls];let mem=this.memory.get(id);if(!mem){mem={side:y<line?-1:1,counted:false};this.memory.set(id,mem);}const side=y<line-.01?-1:y>line+.01?1:mem.side;if(side!==mem.side&&!mem.counted){mem.counted=true;this.counts[label]++;this.events.push({time,class:label,id,direction:side>0?'down':'up'});}mem.side=side;mem.time=time;return{id,class:label,x,y,time,bbox:[x1/1000,y1/1000,(x2-x1)/1000,(y2-y1)/1000],score};});for(const[id,m]of this.memory)if(time-m.time>30)this.memory.delete(id);return this.tracks;}
}
