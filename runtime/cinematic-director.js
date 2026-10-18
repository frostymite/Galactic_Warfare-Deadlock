/* Deadlock v13 Cinematic Director — short in-engine transitions and action staging. */
(() => {
 'use strict';
 class CinematicDirector{
  constructor(){this.root=null;this.active=false;this.timer=0;}
  init(){if(this.root)return;const r=document.createElement('div');r.id='deadlockCinematicLayer';r.className='cinematic-layer';r.innerHTML='<div class="cine-bars"><i></i><i></i></div><div class="cine-stage"><div class="cine-stars"></div><div class="cine-planet"></div><div class="cine-raven"><img src="assets/raven_dedicated.jpg" alt=""></div><div class="cine-flare"></div><div class="cine-caption"><b></b><span></span></div><button class="cine-skip" type="button">SKIP</button></div>';document.body.appendChild(r);this.root=r;r.querySelector('.cine-skip').onclick=()=>this.stop();}
  play(name,detail={}){this.init();if(document.body.classList.contains('no-anim'))return;clearTimeout(this.timer);this.root.className='cinematic-layer show cine-'+name;this.active=true;const title=this.root.querySelector('.cine-caption b'),sub=this.root.querySelector('.cine-caption span');
   const labels={departure:['DEPARTURE','THE RAVEN CLEARS LOCAL SPACE'],hyperspace:['HYPERSPACE','ROUTE LOCKED // TRANSIT ACTIVE'],arrival:['ARRIVAL',detail.destination||'TARGET SYSTEM'],landing:['FINAL APPROACH',detail.destination||'LOCAL OPERATIONS'],docking:['DOCKING VECTOR',detail.destination||'BERTH CONTROL'],combat:['WEAPONS LIVE',detail.reason||'HOSTILE CONTACT'],victory:['AREA SECURED',detail.reason||'THREAT RESOLVED'],defeat:['BREAK CONTACT',detail.reason||'TACTICAL WITHDRAWAL']};const l=labels[name]||[String(name).toUpperCase(),detail.subtitle||''];title.textContent=l[0];sub.textContent=l[1];
   const dur=Number(detail.duration||({departure:2200,hyperspace:2600,arrival:2300,landing:2200,docking:1900,combat:1200,victory:1500,defeat:1600}[name]||1600));this.timer=setTimeout(()=>this.stop(),dur);window.DeadlockNative?.impact?.(name==='combat'?'heavy':'light').catch?.(()=>{});
  }
  stop(){if(!this.root)return;clearTimeout(this.timer);this.root.classList.remove('show');this.active=false;}
  action(type,detail={}){const scene=document.querySelector('[data-living-scene]');if(type==='critical')document.body.classList.add('cine-critical');setTimeout(()=>document.body.classList.remove('cine-critical'),450);window.DeadlockWorldFX?.burst?.(type==='explosion'?'explosion':'sparks',detail.x??.5,detail.y??.48);}
 }
 window.DeadlockCinematics=new CinematicDirector();
 const boot=()=>window.DeadlockCinematics.init();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
