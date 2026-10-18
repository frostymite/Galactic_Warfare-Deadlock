/* Deadlock v13 diegetic HUD — page-specific physical instrumentation, read-only presentation. */
(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const gauge=(label,value,max=100,unit='')=>{const pct=clamp(value/max*100,0,100);return `<div class="dh-gauge" style="--p:${pct}"><i></i><div><b>${esc(Math.round(value))}${unit}</b><span>${esc(label)}</span></div></div>`};
  const shipSilhouette=()=>`<svg class="dh-ship-svg" viewBox="0 0 200 80" aria-hidden="true"><path d="M12 43 55 24l34 3 17-15 23 14 47 8 14 11-31 9-38-2-16 17-26-13-43 2z"/><path d="M78 33h48M63 45h82"/></svg>`;
  const radar=(count=2)=>`<div class="dh-radar"><i class="sweep"></i><i class="ring r1"></i><i class="ring r2"></i>${Array.from({length:Math.max(1,Math.min(5,count||1))},(_,i)=>`<b style="--a:${i*73+25}deg;--r:${28+(i%3)*15}%"></b>`).join('')}<em></em></div>`;
  const pitch=()=>`<div class="dh-pitch"><i></i><i></i><i></i><i></i><i></i><b>0°</b></div>`;
  const compass=()=>`<div class="dh-compass"><i></i><span>N</span><b>270</b><b>000</b><b>090</b></div>`;
  const waveform=()=>`<div class="dh-wave">${Array.from({length:20},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`;
  class DiegeticHUD{
    constructor(){this.root=null;this.page='Overview';this.state=null;this.enabled=true;this.mount=null;}
    init(){if(this.root)return;const d=document.createElement('div');d.id='diegeticHud';d.className='diegetic-hud';d.setAttribute('aria-hidden','true');d.innerHTML=`<div class="dh-corner tl"></div><div class="dh-corner tr"></div><div class="dh-corner bl"></div><div class="dh-corner br"></div><div class="dh-left"></div><div class="dh-right"></div><div class="dh-center-top"></div><div class="dh-reticle"><i></i><i></i><i></i><i></i><b></b></div><div class="dh-bottom"></div>`;document.body.appendChild(d);this.root=d;}
    setEnabled(v){this.enabled=v!==false;this.init();this.root.style.display=this.enabled?'block':'none';document.body.classList.toggle('diegetic-hud-on',this.enabled);}
    mountForPage(page){this.init();const scene=document.querySelector('[data-living-scene]');const scenePages=new Set(['Story','HQ','Galaxy','Ship','Combat','Dogfight']);if(scene&&scenePages.has(page)){if(this.root.parentElement!==scene)scene.appendChild(this.root);this.root.classList.add('scene-mounted');this.mount=scene;return true;}this.root.classList.remove('scene-mounted');this.mount=null;if(this.root.parentElement!==document.body)document.body.appendChild(this.root);return false;}
    update(page,state={}){this.init();this.page=page||'Overview';this.state=state||{};const mounted=this.mountForPage(this.page);const supported=mounted;if(!this.enabled||!supported){this.root.style.display='none';return}else this.root.style.display='block';this.root.dataset.page=this.page;const L=this.root.querySelector('.dh-left'),R=this.root.querySelector('.dh-right'),B=this.root.querySelector('.dh-bottom'),C=this.root.querySelector('.dh-center-top');const c=state.character||{},ship=state.ship||{},story=state.story||{},enc=state.encounter||{},galaxy=state.galaxy||{},weapon=state.weapon||{},npc=state.npc||{};
      this.root.className=`diegetic-hud hud-${String(this.page).toLowerCase().replace(/\s/g,'-')} ${enc.active?'combat-lock':''} ${['Combat','Dogfight'].includes(this.page)?'show-reticle':''} ${mounted?'scene-mounted':''}`;
      C.innerHTML='';
      if(this.page==='Combat'){
        L.innerHTML=`<div class="dh-kicker dangerline">GROUND TACTICAL // DEADLOCK</div>${gauge('HEALTH',c.health||0,c.healthMax||100)}${gauge('STAMINA',c.stamina||0,c.staminaMax||100)}<div class="dh-weapon-read"><span>SELECTED</span><b>${esc(weapon.name||'BLACKWAKE')}</b><small>${esc(weapon.mode||'READY')}</small></div>`;
        R.innerHTML=`${radar(enc.groundEnemies||2)}<div class="dh-threat"><span>HOSTILES TRACKED</span><b>${Math.max(1,enc.groundEnemies||0)} CONTACT${Number(enc.groundEnemies||0)===1?'':'S'}</b><small>${esc(enc.objective||'NEUTRALIZE / BREAK CONTACT')}</small></div>`;
        C.innerHTML=`<div class="dh-lock-box"><span>TACTICAL LOCK</span><b>${esc(enc.reason||'HOSTILE CONTACT')}</b></div>`;
        B.innerHTML=`<span class="dh-chip danger">WEAPONS LIVE</span><span class="dh-chip">DEF ${10+Math.max(0,Math.floor(((c.agility||10)-10)/2))}</span><span class="dh-chip cyan">${esc(weapon.mode||'READY')}</span>`;
      } else if(this.page==='Dogfight'){
        L.innerHTML=`<div class="dh-kicker">RAVEN // FLIGHT COMBAT</div>${gauge('SHIELDS',ship.shields||0,ship.shieldsMax||100)}${gauge('HULL',ship.hull||0,ship.hullMax||100)}${pitch()}`;
        R.innerHTML=`${radar(enc.spaceEnemies||2)}<div class="dh-threat"><span>TARGETING COMPUTER</span><b>${Math.max(1,enc.spaceEnemies||0)} HOSTILE CRAFT</b><small>BREAK PURSUIT OR DESTROY THREAT</small></div>`;
        C.innerHTML=`<div class="dh-flight-lock"><i></i><span>LOCK / LEAD COMPUTE</span></div>`;
        B.innerHTML=`<span class="dh-chip danger">COMBAT SPACE</span><span class="dh-chip">FUEL ${Math.round(ship.fuel||0)}</span><span class="dh-chip cyan">RAVEN CONTROL</span>`;
      } else if(this.page==='Ship'){
        L.innerHTML=`<div class="dh-kicker">RAVEN // LIVE TELEMETRY</div>${gauge('SHIELDS',ship.shields||0,ship.shieldsMax||100)}${gauge('HULL',ship.hull||0,ship.hullMax||100)}${gauge('FUEL',ship.fuel||0,ship.fuelMax||100)}`;
        R.innerHTML=`<div class="dh-ship-panel">${shipSilhouette()}<div><span>VESSEL</span><b>${esc(ship.name||'THE RAVEN')}</b><small>${esc((state.presentation?.shipScene||'cockpit').toUpperCase())}</small></div></div><div class="dh-powerbus">${Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`;
        C.innerHTML=`<div class="dh-system-label">DEADLOCK // SHIPBOARD SYSTEMS</div>`;
        B.innerHTML=`<span class="dh-chip cyan">FLIGHT SYSTEMS</span><span class="dh-chip">DEADLOCK CONTROL</span><span class="dh-chip">LOCAL TELEMETRY</span>`;
      } else if(this.page==='Galaxy'){
        L.innerHTML=`<div class="dh-kicker">NAVCOM // LIVING GALAXY</div>${gauge('FUEL',ship.fuel||0,ship.fuelMax||100)}${compass()}`;
        R.innerHTML=`${radar(galaxy.phase==='transit'?3:1)}<div class="dh-threat stable"><span>NAVIGATION STATE</span><b>${esc(galaxy.location||'UNKNOWN SPACE')}</b><small>${esc((galaxy.phase||'IDLE').toUpperCase())}</small></div>`;
        C.innerHTML=`<div class="dh-route-label"><span>ROUTE</span><b>${esc(galaxy.route||'NO COURSE')}</b></div>`;
        B.innerHTML=`<span class="dh-chip cyan">NAVCOM ACTIVE</span><span class="dh-chip">HQ BLACKGLASS</span>`;
      } else if(this.page==='Story'){
        L.innerHTML=`<div class="dh-kicker">FIELD NARRATIVE // DEADLOCK</div>${gauge('DANGER',story.danger||0,100,'%')}<div class="dh-npc-state"><span>ACTIVE CONTACT</span><b>${esc(npc.name||'NO CONTACT')}</b><small>${esc(npc.voice||npc.relationship||'FIELD CHANNEL')}</small></div>`;
        R.innerHTML=`<div class="dh-threat ${Number(story.danger||0)>=70?'':'stable'}"><span>CURRENT OBJECTIVE</span><b>${esc(story.objective||'Choose your next move')}</b><small>${esc(story.location||'UNCONFIRMED LOCATION')}</small></div>${waveform()}`;
        C.innerHTML=`<div class="dh-story-status"><i></i><span>SCENE LIVE</span></div>`;
        B.innerHTML=`<span class="dh-chip">TURN ${Math.round(story.turn||0)}</span><span class="dh-chip cyan">FREEFORM ENABLED</span>`;
      } else if(this.page==='Holonet'){
        L.innerHTML=`<div class="dh-kicker">HOLONET // ENCRYPTED RELAY</div>${waveform()}<div class="dh-cipher">${Array.from({length:6},(_,i)=>`<i style="--i:${i}">0${(i*7+3)%10}A${i}</i>`).join('')}</div>`;
        R.innerHTML=`<div class="dh-threat stable"><span>CIPHER STATUS</span><b>DEADLOCK CHANNEL</b><small>LOCAL DOSSIER / OFFLINE CACHE</small></div><div class="dh-signal"><i></i><i></i><i></i><i></i><b>SECURE</b></div>`;
        C.innerHTML=`<div class="dh-link-state"><i></i><span>ENCRYPTION VERIFIED</span></div>`;
        B.innerHTML=`<span class="dh-chip cyan">ENCRYPTION ACTIVE</span><span class="dh-chip">VOICE LINK READY</span>`;
      } else if(this.page==='HQ'){
        L.innerHTML=`<div class="dh-kicker">BLACKGLASS // DEADLOCK HQ</div><div class="dh-hq-lines"><i></i><i></i><i></i><span>SECURE LOCAL GRID</span></div>`;
        R.innerHTML=`<div class="dh-threat stable"><span>HOME NODE</span><b>BLACKGLASS STATION</b><small>DEADLOCK OPERATIONS</small></div>`;
        C.innerHTML=`<div class="dh-system-label">HQ INTERNAL NETWORK</div>`;B.innerHTML=`<span class="dh-chip cyan">SECURE</span><span class="dh-chip">RAVEN LINK</span><span class="dh-chip">CONTRACT NET</span>`;
      } else {
        L.innerHTML=`<div class="dh-kicker">DEADLOCK // ${esc(this.page).toUpperCase()}</div>`;R.innerHTML='';B.innerHTML=`<span class="dh-chip cyan">ROVAN KES</span><span class="dh-chip">THE RAVEN</span>`;
      }
    }
  }
  window.DeadlockHUD=new DiegeticHUD();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>window.DeadlockHUD.init(),{once:true});else window.DeadlockHUD.init();
})();
