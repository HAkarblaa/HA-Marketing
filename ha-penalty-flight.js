// Fixed-step ball flight shared by gameplay and numerical checks. Metres / seconds.
export const SHOT_RANGE={x:5.65,minY:.23,maxY:3.85};
export function tracePenalty({x,y,power=.6,keeperX=0,keeperY=1.1}){
 const dt=1/240,r=.22,g=9.81,T=1.04-.40*power,p={x:0,y:r,z:0},v={x:x/T,y:(y-r+.5*g*T*T)/T,z:-12/T},points=[{...p,t:0}],events=[];
 let glove=false,goal=false,post=false,net=false,goalAt=null;
 function impact(type,time,n,restitution,at=p){const dot=v.x*n.x+v.y*n.y+v.z*n.z;if(dot>=0)return false;v.x-=(1+restitution)*dot*n.x;v.y-=(1+restitution)*dot*n.y;v.z-=(1+restitution)*dot*n.z;events.push({type,t:time,x:at.x,y:at.y,z:at.z});return true}
 for(let step=1;step<=960;step++){
  const t=step*dt,old={...p};v.y-=g*dt;p.x+=v.x*dt;p.y+=v.y*dt;p.z+=v.z*dt;
  if(!glove&&old.z>-11.15&&p.z<=-11.15){const f=(old.z+11.15)/(old.z-p.z),cx=old.x+(p.x-old.x)*f,cy=old.y+(p.y-old.y)*f,dx=cx-keeperX,dy=cy-keeperY,d=Math.hypot(dx,dy);
   if(d<.57){glove=true;const nz=Math.sqrt(Math.max(.025,.57*.57-d*d)),len=Math.hypot(dx,dy,nz),n={x:dx/len,y:dy/len,z:nz/len};impact('glove',t,n,.67);p.z=-11.14;p.x=cx;p.y=cy;}
  }
  // Cylindrical uprights and crossbar; all use the same ball radius.
  for(const px of [-4.75,4.75]){const dx=p.x-px,dz=p.z+12,d=Math.hypot(dx,dz),radius=r+.075;if(d<radius&&p.y<3.12&&p.y>0){const n={x:dx/(d||1),y:0,z:dz/(d||1)};if(impact('post',t,n,.77))post=true;p.x=px+n.x*(radius+.001);p.z=-12+n.z*(radius+.001)}}
  {const dy=p.y-3.04,dz=p.z+12,d=Math.hypot(dy,dz),radius=r+.075;if(Math.abs(p.x)<4.83&&d<radius){const n={x:0,y:dy/(d||1),z:dz/(d||1)};if(impact('crossbar',t,n,.77))post=true;p.y=3.04+n.y*(radius+.001);p.z=-12+n.z*(radius+.001)}}
  if(!goal&&old.z>=-12-r&&p.z<-12-r&&Math.abs(p.x)<4.75-.075-r&&p.y<3.04-.075-r&&p.y>=r-.01){goal=true;goalAt=t;events.push({type:'goal',t,...p})}
  if(goal){if(p.z<-14.45+r){p.z=-14.45+r;if(impact('net',t,{x:0,y:0,z:1},.18))net=true;v.x*=.7;v.y*=.6}
   if(p.z<-12.25&&Math.abs(p.x)>4.72-r){const sign=Math.sign(p.x);p.x=sign*(4.72-r);if(impact('net',t,{x:-sign,y:0,z:0},.18))net=true}
   if(p.z<-12.25&&p.y>2.75-r){p.y=2.75-r;if(impact('net',t,{x:0,y:-1,z:0},.15))net=true}}
  if(p.y<r){p.y=r;if(v.y<-.5){v.y=-v.y*.42;v.x*=.88;v.z*=.88}else{v.y=0;v.x*=.991;v.z*=.991}}
  points.push({...p,t});
 }
 return {points,events,goal,saved:glove,post,net,goalAt,duration:4};
}
export function sampleFlight(trace,time){const f=Math.max(0,Math.min(trace.points.length-1,time*240)),i=Math.floor(f),a=trace.points[i],b=trace.points[Math.min(i+1,trace.points.length-1)],q=f-i;return {x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q,z:a.z+(b.z-a.z)*q}}
