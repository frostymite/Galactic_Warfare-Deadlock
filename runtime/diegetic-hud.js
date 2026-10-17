/* Deadlock v12 diegetic HUD — page-aware instrumentation overlay. */
(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const gauge=(label,value,max=100,unit='')=>{const pct=clamp(value/max*100,0,100);return `<div class="dh-gauge" style="--p:${pct}"><i></i><div><b>${esc(Math.round(value))}${unit}</b><span>${esc(label)}</span></div></div>`};
  class DiegeticHUD{
    constructor(){this.root=null;this.page='Overview';this.state=null;this.enabled=true;}
    init(){if(this.root)return;const d=document.createElement('div');d.id='diegeticHud';d.className='diegetic-hud';d.setAttribute('aria-hidden','true');d.innerHTML=`<div class="dh-corner tl"></div><div class="dh-corner tr"></div><div class="dh-corner bl"></div><div class="dh-corner br"></div><div class="dh-left"></div><div class="dh-right"></div><div class="dh-reticle"><i></i><i></i><i></i><i></i></div><div class="dh-bottom"></div>`;document.body.appendChild(d);this.root=d;}
    setEnabled(v){this.enabled=v!==false;this.init();this.root.style.display=this.enabled?'block':'none';}
    update(page,state={}){this.init();if(!this.enabled){this.root.style.display='none';return}else this.root.style.display='block';this.page=page||'Overview';this.state=state||{};this.root.dataset.page=this.page;const L=this.root.querySelector('.dh-left'),R=this.root.querySelector('.dh-right'),B=this.root.querySelector('.dh-bottom');const c=state.character||{},ship=state.ship||{},story=state.story||{},enc=state.encounter||{},galaxy=state.galaxy||{};
      this.root.classList.toggle('combat-lock',!!enc.active);
      this.root.classList.toggle('show-reticle',['Combat','Dogfight'].includes(this.page));
      if(this.page==='Combat'){
        L.innerHTML=`<div class="dh-kicker">DEADLOCK // GROUND ENGAGEMENT</div>${gauge('HEALTH',c.health||0,c.healthMax||100)}${gauge('STAMINA',c.stamina||0,c.staminaMax||100)}`;
        R.innerHTML=`<div class="dh-threat"><span>THREAT LOCK</span><b>${esc(enc.reason||'HOSTILE CONTACT')}</b><small>${esc(enc.objective||'SURVIVE / BREAK CONTACT')}</small></div>`;
        B.innerHTML=`<span class="dh-chip danger">FORCED ENCOUNTER</span><span class="dh-chip">WEAPONS HOT</span><span class="dh-chip">${esc(enc.source||'CONTACT').toUpperCase()}</span>`;
      } else if(this.page==='Dogfight'){
        L.innerHTML=`<div class="dh-kicker">THE RAVEN // FLIGHT COMBAT</div>${gauge('SHIELDS',ship.shields||0,ship.shieldsMax||100)}${gauge('HULL',ship.hull||0,ship.hullMax||100)}`;
        R.innerHTML=`<div class="dh-threat"><span>TARGETING COMPUTER</span><b>${esc(enc.reason||'HOSTILE CRAFT')}</b><small>BREAK PURSUIT OR DESTROY THREAT</small></div>`;
        B.innerHTML=`<span class="dh-chip danger">COMBAT SPACE</span><span class="dh-chip">FUEL ${Math.round(ship.fuel||0)}</span>`;
      } else if(this.page==='Ship'){
        L.innerHTML=`<div class="dh-kicker">RAVEN // LIVE TELEMETRY</div>${gauge('SHIELDS',ship.shields||0,ship.shieldsMax||100)}${gauge('HULL',ship.hull||0,ship.hullMax||100)}${gauge('FUEL',ship.fuel||0,ship.fuelMax||100)}`;
        R.innerHTML=`<div class="dh-threat stable"><span>VESSEL STATUS</span><b>${esc(ship.name||'THE RAVEN')}</b><small>${esc(ship.class||'LIGHT FREIGHTER / FIGHTER')}</small></div>`;
        B.innerHTML=`<span class="dh-chip cyan">FLIGHT SYSTEMS</span><span class="dh-chip">DEADLOCK CONTROL</span>`;
      } else if(this.page==='Galaxy'){
        L.innerHTML=`<div class="dh-kicker">NAVCOM // LIVING GALAXY</div>${gauge('FUEL',ship.fuel||0,ship.fuelMax||100)}`;
        R.innerHTML=`<div class="dh-threat stable"><span>NAVIGATION STATE</span><b>${esc(galaxy.location||'UNKNOWN SPACE')}</b><small>${esc((galaxy.phase||'IDLE').toUpperCase())}</small></div>`;
        B.innerHTML=`<span class="dh-chip cyan">ROUTE ${esc(galaxy.route||'NONE')}</span><span class="dh-chip">HQ BLACKGLASS</span>`;
      } else if(this.page==='Story'){
        L.innerHTML=`<div class="dh-kicker">FIELD NARRATIVE // DEADLOCK</div>${gauge('DANGER',story.danger||0,100,'%')}`;
        R.innerHTML=`<div class="dh-threat ${Number(story.danger||0)>=70?'':'stable'}"><span>CURRENT OBJECTIVE</span><b>${esc(story.objective||'Choose your next move')}</b><small>${esc(story.location||'UNCONFIRMED LOCATION')}</small></div>`;
        B.innerHTML=`<span class="dh-chip">TURN ${Math.round(story.turn||0)}</span><span class="dh-chip cyan">FREEFORM ENABLED</span>`;
      } else if(this.page==='Holonet'){
        L.innerHTML=`<div class="dh-kicker">HOLONET // ENCRYPTED RELAY</div><div class="dh-signal"><i></i><i></i><i></i><i></i><b>SECURE</b></div>`;
        R.innerHTML=`<div class="dh-threat stable"><span>CIPHER STATUS</span><b>DEADLOCK CHANNEL</b><small>LOCAL DOSSIER / OFFLINE CACHE</small></div>`;
        B.innerHTML=`<span class="dh-chip cyan">ENCRYPTION ACTIVE</span><span class="dh-chip">VOICE LINK READY</span>`;
      } else {
        L.innerHTML=`<div class="dh-kicker">DEADLOCK // ${esc(this.page).toUpperCase()}</div>`;
        R.innerHTML='';B.innerHTML=`<span class="dh-chip cyan">ROVAN KES</span><span class="dh-chip">THE RAVEN</span>`;
      }
    }
  }
  window.DeadlockHUD=new DiegeticHUD();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>window.DeadlockHUD.init(),{once:true});else window.DeadlockHUD.init();
})();
