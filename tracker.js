import {MultiTracker} from './vendor/tracker.js';
const classes={car:2,motorcycle:3,bus:5,truck:7},labels=Object.fromEntries(Object.entries(classes).map(([k,v])=>[v,k]));
// ByteTrack browser port by PariVision (AGPL-3.0); OQIM adds bounded line accounting.
export class Tracker {
  constructor(fps=10){this.fps=fps;this.reset();}
  reset(){this.core=new MultiTracker(this.fps,1.5,{GROUPS:{vehicle:[2,3,5,7]},bytetrack:{track_high_thresh:.3,track_low_thresh:.1,new_track_thresh:.3,match_thresh:.8,fuse_score:true}});this.tracks=[];this.memory=new Map();this.counts={car:0,bus:0,truck:0,motorcycle:0};this.events=[];}
  update(boxes,time,line=.55,gate={}){
    const {start=0,end=1,anchor='centre'}=gate;
    if(!(start>=0&&end<=1&&start<end&&line>0&&line<1)||!['centre','bottom'].includes(anchor))throw Error('Некорректная линия учёта');
    const detections=boxes.filter(b=>classes[b.class]!==undefined).map(b=>({x1:b.bbox[0]*1000,y1:b.bbox[1]*1000,x2:(b.bbox[0]+b.bbox[2])*1000,y2:(b.bbox[1]+b.bbox[3])*1000,conf:b.score,cls:classes[b.class]}));
    this.tracks=this.core.update(detections,[1000,1000]).map(([x1,y1,x2,y2,id,score,cls])=>{
      const x=(x1+x2)/2000,y=(y1+y2)/2000,ay=anchor==='bottom'?y2/1000:y,label=labels[cls];
      let mem=this.memory.get(id);if(!mem){mem={counted:false,votes:{}};this.memory.set(id,mem);}
      mem.votes[label]=(mem.votes[label]||0)+score;
      const side=ay<line-.01?-1:ay>line+.01?1:0;
      if(side){
        if(mem.side&&side!==mem.side&&!mem.counted&&time-mem.seen<=Math.max(.6,3/this.fps)+1e-8){
          const fraction=(line-mem.y)/(ay-mem.y),crossX=mem.x+(x-mem.x)*fraction;
          if(crossX>=start&&crossX<=end){const stableClass=Object.keys(mem.votes).sort((a,b)=>mem.votes[b]-mem.votes[a])[0];mem.counted=true;this.counts[stableClass]++;this.events.push({time:mem.time+(time-mem.time)*fraction,confirmedAt:time,class:stableClass,id,x:crossX,direction:side>0?'down':'up'});}
        }
        mem.side=side;mem.x=x;mem.y=ay;mem.time=time;
      }
      mem.seen=time;
      return{id,class:label,x,y,anchorY:ay,time,bbox:[x1/1000,y1/1000,(x2-x1)/1000,(y2-y1)/1000],score};
    });
    for(const[id,m]of this.memory)if(time-m.seen>30)this.memory.delete(id);
    return this.tracks;
  }
}
