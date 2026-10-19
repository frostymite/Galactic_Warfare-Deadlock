/* Deadlock v13 World FX — canvas weather, smoke, sparks, dust, crowd light and environmental motion. */
(() => {
 'use strict';
 const TYPES={rain:{count:150,speed:1.9},snow:{count:105,speed:.45},dust:{count:85,speed:.32},mist:{count:46,speed:.15},embers:{count:80,speed:.7},debris:{count:60,speed:.28},smoke:{count:42,speed:.13},anomaly:{count:70,speed:.5},space:{count:36,speed:.15},interior:{count:18,speed:.08},ambient:{count:28,speed:.12}};
 class WorldFx{
  constructor(){this.canvas=null;this.ctx=null;this.raf=0;this.particles=[];this.type='ambient';this.theme='unknown';this.scene=null;this.last=0;this.profile='high';}
  attach(scene,preset={}){this.detach();if(!scene)return;this.scene=scene;this.type=preset.weather||'ambient';this.theme=preset.theme||'unknown';const c=document.createElement('canvas');c.className='world-fx-canvas';c.setAttribute('aria-hidden','true');scene.querySelector('.scene-camera')?.appendChild(c);this.canvas=c;this.ctx=c.getContext('2d',{alpha:true});this.resize();this.seed();this.last=performance.now();this.loop(this.last);}
  resize(){if(!this.canvas||!this.scene)return;const r=this.scene.getBoundingClientRect();const q=document.body.dataset.graphics||'high';const dpr=Math.min(devicePixelRatio||1,q==='performance'?1:q==='balanced'?1.25:1.6);this.canvas.width=Math.max(1,Math.round(r.width*dpr));this.canvas.height=Math.max(1,Math.round(r.height*dpr));this.canvas.style.width=r.width+'px';this.canvas.style.height=r.height+'px';this.dpr=dpr;}
  seed(){const cfg=TYPES[this.type]||TYPES.ambient;const q=document.body.dataset.graphics||'high',scale=q==='performance'?.45:q==='balanced'?.72:1;const n=Math.max(8,Math.round(cfg.count*scale));this.particles=Array.from({length:n},()=>this.makeParticle(true));}
  makeParticle(randomY=false){const w=this.canvas?.width||800,h=this.canvas?.height||450;return{x:Math.random()*w,y:randomY?Math.random()*h:h+20,sz:.5+Math.random()*2.5,v:.25+Math.random(),drift:(Math.random()-.5)*.5,life:Math.random(),phase:Math.random()*6.28}}
  drawParticle(p,dt,t){const c=this.ctx,w=this.canvas.width,h=this.canvas.height,cfg=TYPES[this.type]||TYPES.ambient,s=cfg.speed*dt*this.dpr*55;p.phase+=dt*.7;
    c.save();
    if(this.type==='rain'){p.y+=s*(1.8+p.v);p.x-=s*.35;c.strokeStyle='rgba(145,224,255,.24)';c.lineWidth=Math.max(1,p.sz*.55);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-5*this.dpr,p.y-18*this.dpr);c.stroke()}
    else if(this.type==='snow'){p.y+=s*(.35+p.v*.35);p.x+=Math.sin(p.phase)*.45*this.dpr;c.fillStyle='rgba(225,250,255,.46)';c.beginPath();c.arc(p.x,p.y,p.sz*this.dpr,0,6.28);c.fill()}
    else if(this.type==='embers'){p.y-=s*(.5+p.v);p.x+=Math.sin(p.phase)*.7*this.dpr;c.fillStyle=`rgba(255,${95+Math.round(p.v*80)},50,${.25+p.v*.28})`;c.shadowBlur=8*this.dpr;c.shadowColor='#ff4d1f';c.beginPath();c.arc(p.x,p.y,p.sz*this.dpr,0,6.28);c.fill()}
    else if(this.type==='dust'||this.type==='debris'){p.x+=s*(.45+p.v);p.y+=Math.sin(p.phase)*.22*this.dpr;c.fillStyle=this.type==='dust'?'rgba(245,191,126,.18)':'rgba(180,210,220,.16)';c.fillRect(p.x,p.y,p.sz*3*this.dpr,p.sz*this.dpr)}
    else if(this.type==='mist'||this.type==='smoke'){p.x+=s*.18;p.y-=s*.05;const rad=(16+p.sz*18)*this.dpr,g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,rad);g.addColorStop(0,this.type==='smoke'?'rgba(110,120,125,.065)':'rgba(125,235,220,.045)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(p.x-rad,p.y-rad,rad*2,rad*2)}
    else if(this.type==='anomaly'){p.x+=Math.sin(t*.001+p.phase)*.25*this.dpr;p.y-=s*.2;c.strokeStyle='rgba(196,91,255,.22)';c.beginPath();c.arc(p.x,p.y,(3+p.sz*2)*this.dpr,0,6.28);c.stroke()}
    else {p.y-=s*.08;p.x+=Math.sin(p.phase)*.08*this.dpr;c.fillStyle=this.type==='interior'?'rgba(109,235,255,.06)':'rgba(155,225,255,.10)';c.fillRect(p.x,p.y,p.sz*this.dpr,p.sz*this.dpr)}
    c.restore();if(p.y>h+40||p.y<-50||p.x>w+60||p.x<-60)Object.assign(p,this.makeParticle(false),{x:this.type==='rain'?w+20:Math.random()*w,y:this.type==='embers'?h+20:Math.random()*h});
  }
  drawEnvironment(now){const c=this.ctx,w=this.canvas.width,h=this.canvas.height,t=now/1000;c.save();
    if(this.theme==='urban'){for(let i=0;i<6;i++){const x=((t*(30+i*11)+i*137)%(w+240))-120;c.fillStyle=i%2?'rgba(255,53,190,.07)':'rgba(20,226,255,.08)';c.fillRect(x,h*.68,75*this.dpr,h*.28)}}
    else if(this.theme==='jungle'){for(let i=0;i<12;i++){const x=(i*137+Math.sin(t*.3+i)*55)%w,y=h*(.25+(i%6)*.095)+Math.sin(t*.8+i)*12*this.dpr;c.fillStyle=`rgba(122,255,196,${.05+(i%3)*.025})`;c.beginPath();c.arc(x,y,(2+(i%2))*this.dpr,0,6.28);c.fill()}}
    else if(this.theme==='ice'){const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(70,255,230,0)');g.addColorStop(.3,'rgba(90,230,255,.05)');g.addColorStop(.55+Math.sin(t*.08)*.1,'rgba(130,105,255,.09)');g.addColorStop(1,'rgba(60,240,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h*.42)}
    else if(this.theme==='volcanic'){const glow=.04+.035*(.5+.5*Math.sin(t*1.7));const g=c.createLinearGradient(0,h*.55,0,h);g.addColorStop(0,'rgba(255,60,15,0)');g.addColorStop(1,`rgba(255,60,15,${glow})`);c.fillStyle=g;c.fillRect(0,h*.45,w,h*.55)}
    else if(this.theme==='ocean'){for(let i=0;i<8;i++){const y=h*(.62+i*.035),off=Math.sin(t*.55+i)*28*this.dpr;c.strokeStyle=`rgba(100,225,255,${.035+i*.008})`;c.lineWidth=1*this.dpr;c.beginPath();c.moveTo(-30+off,y);c.bezierCurveTo(w*.25,y-10*this.dpr,w*.7,y+12*this.dpr,w+30+off,y);c.stroke()}}
    else if(this.theme==='asteroid'){for(let i=0;i<8;i++){const x=((i*211+t*13*(1+i*.07))%(w+100))-50,y=(i*97%Math.max(1,h));c.save();c.translate(x,y);c.rotate(t*.04+i);c.fillStyle='rgba(140,165,175,.09)';c.fillRect(-8*this.dpr,-4*this.dpr,16*this.dpr,8*this.dpr);c.restore()}}
    else if(this.theme==='hq'||this.theme==='ship'){const x=((t*55)%(w*1.5))-w*.25;c.fillStyle='rgba(90,235,255,.025)';c.transform(1,0,-.25,1,0,0);c.fillRect(x,0,90*this.dpr,h)}
    c.restore();}
  loop(now){if(!this.canvas||!this.ctx||!document.body.contains(this.canvas))return;this.raf=requestAnimationFrame(t=>this.loop(t));const dt=Math.min(.05,(now-this.last)/1000||.016);this.last=now;const c=this.ctx;c.clearRect(0,0,this.canvas.width,this.canvas.height);this.drawEnvironment(now);for(const p of this.particles)this.drawParticle(p,dt,now);}
  burst(kind='sparks',x=.5,y=.5){if(!this.ctx||!this.canvas)return;const c=this.ctx,w=this.canvas.width,h=this.canvas.height;let n=kind==='explosion'?34:18;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,len=(15+Math.random()*70)*this.dpr;c.strokeStyle=kind==='explosion'?'rgba(255,94,37,.8)':'rgba(255,211,105,.75)';c.lineWidth=(.6+Math.random()*2)*this.dpr;c.beginPath();c.moveTo(w*x,h*y);c.lineTo(w*x+Math.cos(a)*len,h*y+Math.sin(a)*len);c.stroke();}}
  detach(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.canvas?.remove();this.canvas=null;this.ctx=null;this.scene=null;}
 }
 window.DeadlockWorldFX=new WorldFx();
 addEventListener('resize',()=>window.DeadlockWorldFX.resize(),{passive:true});
})();
