/* Deadlock Phase 3 — Living Backgrounds.
 * Persistent ambient populations + behavior-driven background traffic.
 * Durable records are plain JSON so this layer can migrate to Godot later.
 */
(function(root){
'use strict';
const VERSION='1.0.0';
const SCHEMA='deadlock.living-world.v1';
const F=root.ShipForge;
const SF=root.DeadlockShipForge;
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function hash(v){if(F?.hashSeed)return F.hashSeed(v);let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let s=hash(seed)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function pick(a,r){return a[Math.min(a.length-1,Math.floor(r()*a.length))]}
function now(){try{return new Date().toISOString()}catch{return ''}}
function bodyQuality(){try{const q=document.body?.dataset?.graphics;return q==='performance'?.48:q==='balanced'?.74:1}catch{return 1}}
const NAME_A=['Ka','Ve','Tor','Ren','Sai','Dre','Mal','Jex','Niv','Orr','Tav','Kes','Vey','Rin','Sol','Zan','Ari','Bex','Cor','Lio'];
const NAME_B=['ra','en','ik','os','an','el','or','is','et','un','ax','ir','on','ev','ar','in','a','o','yn','esh'];
const species=['humanoid','hooded','lekku','horned','helmeted'];
const profiles={
 default:{roles:['traveler','courier','worker','security'],behaviors:['walk','idle','talk','inspect'],droid:.10,props:['holo']},
 urban:{roles:['dockworker','courier','vendor','mechanic','security','spacer'],behaviors:['walk','carry','talk','inspect','patrol','service'],droid:.18,props:['cargo','holo','service']},
 hq:{roles:['analyst','technician','security','quartermaster','runner'],behaviors:['walk','talk','inspect','patrol','service'],droid:.12,props:['holo','console']},
 ship:{roles:['crew','technician'],behaviors:['walk','inspect','service'],droid:.08,props:['console']},
 cockpit:{roles:['crew'],behaviors:['idle','inspect'],droid:0,props:['console']},
 combat:{roles:[],behaviors:[],droid:0,props:[]},
 orbit:{roles:[],behaviors:[],droid:0,props:[]},
 asteroid:{roles:['miner','technician','security'],behaviors:['walk','carry','inspect','patrol'],droid:.16,props:['cargo','service']},
 desert:{roles:['traveler','trader','security','mechanic'],behaviors:['walk','carry','talk','patrol'],droid:.12,props:['cargo']},
 jungle:{roles:['scout','researcher','guide'],behaviors:['walk','inspect','talk'],droid:.05,props:['holo']},
 ice:{roles:['worker','researcher','security'],behaviors:['walk','carry','inspect'],droid:.14,props:['cargo','service']},
 volcanic:{roles:['worker','technician','security'],behaviors:['walk','inspect','patrol'],droid:.18,props:['service']},
 ocean:{roles:['dockworker','courier','vendor','security'],behaviors:['walk','carry','talk','service'],droid:.15,props:['cargo','holo']},
 ruins:{roles:['scavenger','researcher','security'],behaviors:['walk','inspect','carry'],droid:.10,props:['cargo']},
 unknown:{roles:['traveler','scout'],behaviors:['walk','inspect'],droid:.04,props:['holo']},
 'blackglass_hangar':{roles:['hangar crew','mechanic','loader','security','flight tech'],behaviors:['walk','carry','inspect','patrol','service'],droid:.25,props:['cargo','service','holo']},
 'blackglass_briefing':{roles:['analyst','officer','technician'],behaviors:['walk','talk','inspect'],droid:.08,props:['holo','console']},
 'blackglass_contracts':{roles:['broker','analyst','courier','security'],behaviors:['walk','talk','inspect','patrol'],droid:.08,props:['holo','console']},
 'veyra_upper':{roles:['resident','courier','security','executive','vendor'],behaviors:['walk','talk','patrol','idle'],droid:.10,props:['holo']},
 'veyra_undercity':{roles:['scavenger','vendor','runner','mechanic','security'],behaviors:['walk','carry','talk','inspect','patrol'],droid:.20,props:['cargo','service']},
 'port:landing':{roles:['dockworker','loader','flight tech','courier','security'],behaviors:['walk','carry','inspect','patrol','service'],droid:.28,props:['cargo','service']},
 'port:market':{roles:['vendor','shopper','courier','dockworker','security'],behaviors:['walk','carry','talk','patrol'],droid:.18,props:['cargo','holo']},
 'port:cantina':{roles:['patron','server','spacer','courier'],behaviors:['walk','talk','idle','service'],droid:.08,props:['holo']},
 'port:tunnels':{roles:['technician','scavenger','security','runner'],behaviors:['walk','inspect','carry','patrol'],droid:.22,props:['service']},
 'port:hideout':{roles:['mechanic','salvager','loader','runner'],behaviors:['walk','carry','inspect','service'],droid:.24,props:['cargo','service']}
};
function fresh(data){return{schema:SCHEMA,version:VERSION,seed:hash(data?.created||'deadlock'),sequence:0,populations:{},visits:{},trafficEvents:{},createdAt:now(),dirty:false}}
function ensure(data){if(!data||typeof data!=='object')throw new Error('Campaign data required');let st=data.livingWorld;if(!st||st.schema!==SCHEMA){st=fresh(data);data.livingWorld=st}st.version=VERSION;st.populations=st.populations||{};st.visits=st.visits||{};st.trafficEvents=st.trafficEvents||{};st.sequence=Number(st.sequence||0);return st}
function nextId(st,prefix){st.sequence++;return`${prefix}-${st.sequence.toString(36)}-${hash(prefix+'|'+st.sequence).toString(16).slice(0,5)}`}
function nameFor(seed){const r=rng(seed);return pick(NAME_A,r)+pick(NAME_B,r)}
function profileFor(ctx){const preset=ctx?.presetId||ctx?.profileId||'';if(profiles[preset])return profiles[preset];const theme=ctx?.preset?.theme||ctx?.theme||'default';return profiles[theme]||profiles.default}
function sceneKey(ctx){const loc=ctx?.loc?.id||ctx?.locationId||'unknown';const p=ctx?.presetId||ctx?.profileId||ctx?.preset?.theme||ctx?.theme||'default';const room=ctx?.preset?.room||ctx?.room||ctx?.page||'scene';return`${loc}|${p}|${room}`}
function makeNpc(st,key,index,profile){const r=rng(`${st.seed}|${key}|npc|${index}`),isDroid=r()<Number(profile.droid||0),role=pick(profile.roles.length?profile.roles:['traveler'],r),behavior=pick(profile.behaviors.length?profile.behaviors:['idle'],r);const sp=isDroid?'droid':pick(species,r);const depth=pick(['far','mid','near'],r),dir=r()<.5?'from-left':'from-right',carry=behavior==='carry'?pick(['crate','toolcase','canister'],r):behavior==='service'?pick(['scanner','tool'],r):null;return{id:nextId(st,'amb'),name:isDroid?`Unit ${Math.floor(r()*900+100)}`:nameFor(`${key}|${index}|name`),species:sp,role,behavior,depth,direction:dir,carry,seed:hash(`${key}|${index}`),lane:Math.floor(r()*5),speed:Number((11+r()*13).toFixed(2)),scale:Number((.66+r()*.34).toFixed(2)),accent:Math.floor(r()*7),home:key,createdAt:now(),lastSeenAt:now()}}
function desiredCount(base){return Math.max(0,Math.round(Number(base||0)*bodyQuality()))}
function ensurePopulation(data,ctx,baseCount){const st=ensure(data),key=sceneKey(ctx),profile=profileFor(ctx),target=desiredCount(baseCount);let pop=st.populations[key];if(!pop){pop={key,createdAt:now(),npcs:[]};st.populations[key]=pop;st.dirty=true}while(pop.npcs.length<target){pop.npcs.push(makeNpc(st,key,pop.npcs.length,profile));st.dirty=true}for(const n of pop.npcs)n.lastSeenAt=now();st.visits[key]=Number(st.visits[key]||0)+1;return{key,profile,npcs:pop.npcs.slice(0,target)}}
function npcMarkup(n,i){const talk=n.behavior==='talk'?'<span class="lw-chatter"><b></b><b></b><b></b></span>':'';const carry=n.carry?`<span class="lw-carry ${esc(n.carry)}"></span>`:'';return`<i class="lw-npc lw-${esc(n.species)} lw-${esc(n.behavior)} depth-${esc(n.depth)} ${esc(n.direction)} accent-${n.accent}" data-lw-id="${esc(n.id)}" data-lw-role="${esc(n.role)}" title="${esc(n.name)} · ${esc(n.role)}" style="--lw-i:${i};--lw-lane:${n.lane};--lw-speed:${n.speed}s;--lw-scale:${n.scale};--lw-delay:${-(i*2.37+n.lane*.71)}s"><span class="lw-ground"></span><span class="lw-rig"><span class="lw-head"></span><span class="lw-body"></span><span class="lw-arm a"></span><span class="lw-arm b"></span><span class="lw-leg a"></span><span class="lw-leg b"></span>${carry}${talk}</span></i>`}
function propsMarkup(profile,key){return`<div class="lw-props" aria-hidden="true">${(profile.props||[]).map((p,i)=>`<i class="lw-prop prop-${esc(p)}" style="--p:${i};--pd:${-(hash(key+'|prop|'+i)%50)/10}s"></i>`).join('')}</div>`}
function peopleMarkup(data,ctx,baseCount){const pop=ensurePopulation(data,ctx,baseCount);if(!pop.npcs.length)return'';const layers=['far','mid','near'].map(d=>`<div class="lw-layer depth-${d}">${pop.npcs.filter(n=>n.depth===d).map(n=>npcMarkup(n,pop.npcs.indexOf(n))).join('')}</div>`).join('');return`<div class="lw-population" data-lw-key="${esc(pop.key)}" aria-hidden="true">${propsMarkup(pop.profile,pop.key)}${layers}</div>`}
function trafficClass(ctx){const t=ctx?.preset?.theme||ctx?.theme||'';if(['combat','cockpit','ship'].includes(t))return[];if(t==='hq'&&ctx?.presetId!=='blackglass_hangar')return['shuttle','light_freighter','patrol'];return['fighter','shuttle','light_freighter','freighter','cargo','patrol']}
function trafficMarkup(data,ctx,count=3){if(!F||!SF||Number(count||0)<=0)return'';const classes=trafficClass(ctx);if(!classes.length)return'';const st=ensure(data),key=`lw|${sceneKey(ctx)}|traffic`,had=!!data?.shipForge?.traffic?.[key]?.length;const rows=SF.trafficPopulation(data,key,desiredCount(count),classes);if(!had&&rows.length)st.dirty=true;return rows.map((x,i)=>{const seed=hash(`${key}|${i}`),mode=['cruise','approach','depart','landing'][seed%4],depth=['far','mid','near'][(seed>>>4)%3],dir=(seed>>>7)%2?'from-left':'from-right';return`<i class="lw-ship lw-ship-${mode} depth-${depth} ${dir}" data-lw-ship="${esc(x.record.id)}" style="--lw-ship-i:${i};--lw-ship-delay:${-(i*3.7)}s;--lw-ship-speed:${12+(seed%9)}s;--lw-ship-scale:${(.48+((seed>>>8)%40)/100).toFixed(2)}">${F.renderMarkup(x.blueprint,{label:`${F.catalog.classes[x.blueprint.classId]?.label||x.blueprint.classId} ambient traffic`})}</i>`}).join('')}
function sceneMarkup(data,ctx,count=4){return peopleMarkup(data,ctx,count)}
function portContext(scene){return{page:'Lower Port',presetId:`port:${scene}`,profileId:`port:${scene}`,locationId:'veyra_prime',theme:'urban',preset:{theme:'urban',room:scene},loc:{id:'veyra_prime'}}}
function portMarkup(data,portState,scene){const ctx=portContext(scene),base={landing:8,market:9,cantina:7,tunnels:5,hideout:6}[scene]||6,traffic=['landing','market'].includes(scene)?trafficMarkup(data,ctx,scene==='landing'?3:2):'';return`<div class="lw-port-world">${traffic}<div class="lw-port-ground">${peopleMarkup(data,ctx,base)}</div></div>`}
let mounted=null,observer=null,timer=0;
function mount(rootEl,data,ctx){unmount();if(!rootEl)return;mounted=rootEl;rootEl.classList.add('lw-active');const reduce=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}})();if(reduce||bodyQuality()<.5||data?.settings?.animations===false)rootEl.classList.add('lw-reduced');try{observer=new IntersectionObserver(es=>{for(const e of es)rootEl.classList.toggle('lw-paused',!e.isIntersecting)},{threshold:.05});observer.observe(rootEl)}catch{}timer=setInterval(()=>{if(!mounted||!document.body.contains(mounted))return unmount();const t=Math.floor(Date.now()/7000);mounted.style.setProperty('--lw-cycle',String(t%12));mounted.querySelectorAll('.lw-npc').forEach((el,i)=>el.classList.toggle('lw-beat',((t+i)%5)===0))},7000)}
function unmount(){if(timer)clearInterval(timer);timer=0;try{observer?.disconnect()}catch{}observer=null;if(mounted){mounted.classList.remove('lw-active','lw-paused');mounted=null}}
function consumeDirty(data){const st=ensure(data),v=!!st.dirty;st.dirty=false;return v}
function summary(data){const st=ensure(data),pops=Object.values(st.populations);return{version:st.version,scenes:pops.length,npcs:pops.reduce((a,p)=>a+p.npcs.length,0),trafficScenes:Object.keys(data.shipForge?.traffic||{}).filter(k=>k.startsWith('lw|')).length}}
root.DeadlockLivingWorld={schema:SCHEMA,version:VERSION,profiles,ensure,sceneKey,profileFor,ensurePopulation,peopleMarkup,sceneMarkup,trafficMarkup,portContext,portMarkup,mount,unmount,consumeDirty,summary,_test:{hash,rng,nameFor,desiredCount,makeNpc}};
})(typeof window!=='undefined'?window:globalThis);
