/* Deadlock v13 Actor Rig Runtime — non-destructive micro-animation over established character art. */
(() => {
  'use strict';
  class ActorRigRuntime {
    constructor(){this.data=null;this.instances=new Map();this.started=false;this.pointerBound=new WeakSet();}
    async init(){
      if(this.started)return;this.started=true;
      try{this.data=await fetch('actor-rigs.json').then(r=>r.json())}catch(e){console.warn('Actor rig metadata unavailable',e);this.data={characters:{}}}
      this.sync();
      const obs=new MutationObserver(()=>this.sync());obs.observe(document.documentElement,{childList:true,subtree:true});this.observer=obs;
      window.addEventListener('deadlock:page-rendered',()=>this.sync());
    }
    profile(id){return this.data?.characters?.[id]||this.data?.characters?.unknown||{};}
    sync(){
      document.querySelectorAll('.scene-actor[data-scene-actor]').forEach(el=>this.attach(el));
      for(const [el,inst] of this.instances){if(!document.body.contains(el)){this.stopInstance(inst);this.instances.delete(el)}}
      document.querySelectorAll('[data-living-scene]').forEach(scene=>this.bindPointer(scene));
    }
    attach(el){
      if(this.instances.has(el))return;
      const id=el.dataset.sceneActor||'unknown',p=this.profile(id),img=el.querySelector(':scope > img');if(!img)return;
      el.classList.add('actor-rigged');el.style.setProperty('--head-x',(p.headAnchor?.[0]??50)+'%');el.style.setProperty('--head-y',(p.headAnchor?.[1]??35)+'%');
      const face=document.createElement('div');face.className='actor-face-rig';face.setAttribute('aria-hidden','true');
      const eye=p.eyeBand||[25,27,50,8],mouth=p.mouthBand||[32,44,36,11];
      face.innerHTML=`<div class="rig-eye-band" style="--x:${eye[0]}%;--y:${eye[1]}%;--w:${eye[2]}%;--h:${eye[3]}%"><i></i><i></i></div><div class="rig-mouth-band" style="--x:${mouth[0]}%;--y:${mouth[1]}%;--w:${mouth[2]}%;--h:${mouth[3]}%"></div><div class="rig-focus-glint"></div>`;
      el.appendChild(face);
      const headClone=img.cloneNode(false);headClone.removeAttribute('alt');headClone.className='rig-head-clone';headClone.setAttribute('aria-hidden','true');headClone.style.clipPath='inset(0 18% 45% 18%)';el.appendChild(headClone);
      const torsoClone=img.cloneNode(false);torsoClone.removeAttribute('alt');torsoClone.className='rig-torso-clone';torsoClone.setAttribute('aria-hidden','true');torsoClone.style.clipPath='inset(43% 9% 0 9%)';el.appendChild(torsoClone);
      const mouthClone=img.cloneNode(false);mouthClone.removeAttribute('alt');mouthClone.className='rig-mouth-clone';mouthClone.setAttribute('aria-hidden','true');mouthClone.style.clipPath=`inset(${mouth[1]}% ${100-mouth[0]-mouth[2]}% ${100-mouth[1]-mouth[3]}% ${mouth[0]}%)`;el.appendChild(mouthClone);
      const inst={el,id,p,face,headClone,torsoClone,mouthClone,blinkTimer:0,speechTimer:0,blinkAt:0,speaking:false};this.instances.set(el,inst);this.scheduleBlink(inst,true);
      el.classList.add('actor-entering');setTimeout(()=>el.classList.remove('actor-entering'),650);
    }
    scheduleBlink(inst,initial=false){
      clearTimeout(inst.blinkTimer);const min=Number(inst.p.blinkMin||3),max=Number(inst.p.blinkMax||7);const delay=(initial?.7:1)*(min+Math.random()*(max-min))*1000;
      inst.blinkTimer=setTimeout(()=>{if(!document.body.contains(inst.el))return;inst.el.classList.add('actor-blink');setTimeout(()=>inst.el.classList.remove('actor-blink'),145+Math.random()*55);this.scheduleBlink(inst)},delay);
    }
    bindPointer(scene){
      if(this.pointerBound.has(scene))return;this.pointerBound.add(scene);
      scene.addEventListener('pointermove',e=>{const r=scene.getBoundingClientRect(),x=((e.clientX-r.left)/Math.max(1,r.width)-.5),y=((e.clientY-r.top)/Math.max(1,r.height)-.5);scene.querySelectorAll('.scene-actor.actor-rigged').forEach(el=>{const p=this.profile(el.dataset.sceneActor),g=Number(p.gaze??.7);el.style.setProperty('--gaze-x',(x*g).toFixed(3));el.style.setProperty('--gaze-y',(y*g).toFixed(3));});},{passive:true});
      scene.addEventListener('pointerleave',()=>scene.querySelectorAll('.scene-actor.actor-rigged').forEach(el=>{el.style.setProperty('--gaze-x','0');el.style.setProperty('--gaze-y','0')}),{passive:true});
    }
    setSpeaking(id,on=true){
      for(const inst of this.instances.values())if(inst.id===id||(id==='nera'&&inst.id==='kade')){inst.speaking=!!on;inst.el.classList.toggle('rig-speaking',!!on);clearInterval(inst.speechTimer);if(on&&inst.p.lip!==false){inst.speechTimer=setInterval(()=>this.pulseSpeech(id),115+Math.random()*70)}else inst.el.classList.remove('mouth-pulse')}
    }
    pulseSpeech(id,intensity=1){
      for(const inst of this.instances.values())if(inst.id===id||(id==='nera'&&inst.id==='kade')){if(inst.p.lip===false)continue;inst.el.style.setProperty('--mouth-open',String(Math.max(.35,Math.min(1.4,Number(intensity)||1))));inst.el.classList.remove('mouth-pulse');void inst.el.offsetWidth;inst.el.classList.add('mouth-pulse');setTimeout(()=>inst.el.classList.remove('mouth-pulse'),90)}
    }
    react(id,type='notice'){
      for(const inst of this.instances.values())if(inst.id===id){const cls='actor-react-'+type;inst.el.classList.remove(cls);void inst.el.offsetWidth;inst.el.classList.add(cls);setTimeout(()=>inst.el.classList.remove(cls),650)}
    }
    stopInstance(inst){clearTimeout(inst.blinkTimer);clearInterval(inst.speechTimer)}
  }
  window.DeadlockActors=new ActorRigRuntime();
  const boot=()=>window.DeadlockActors.init();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
