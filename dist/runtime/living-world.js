/* Deadlock Phase 3 — Living Backgrounds.
 * Persistent ambient populations + behavior-driven background traffic.
 * Durable records are plain JSON so this layer can migrate to Godot later.
 */
(function(root){
'use strict';
const VERSION='1.1.0';
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
const barkPools={
 default:['Keep your head on a swivel.','Traffic is heavier than it looks.','Something about this place feels off today.','If you are buying, I know who to ask.'],
 urban:['Dock control has been noisy all shift.','Freight lanes are moving, barely.','Watch the service corridors; crews are rerouting around a bad junction.','Everybody in a port hears something eventually.'],
 hq:['{callSign}. Ops are green on this deck.','Apex traffic is clean. No unexpected transponders.','Quartermaster flagged a few parts for review.','Blackglass is quiet. That usually means work is about to find us.'],
 blackglass_hangar:["Raven's lane is clear, {callSign}.",'Flight techs finished the latest pass on the launch clamps.','The Kestrels are fueled and locked down.','Salvage crew left a component crate tagged for ShipForge inspection.'],
 blackglass_briefing:['Briefing net is synced to the current contract board.','Analysts are cross-checking the newest leads.','Nothing leaves this room unless you say it does, {callSign}.'],
 blackglass_contracts:['Three leads came in. Two smell clean. One does not.','Broker traffic is up; somebody is shopping for deniable work.','Contract board is current, {callSign}.'],
 'port:landing':['Landing control is stacking arrivals again.','That freighter has circled twice. Somebody is waiting on clearance.','Keep clear of the yellow deck marks unless you want a loader droid arguing with you.'],
 'port:market':['Prices shifted after the last convoy came through.','Someone is buying repair parts in bulk.','Market gossip says security is leaning harder on couriers today.'],
 'port:cantina':['Everybody talks eventually. The trick is knowing what matters.','A quiet table is worth more than a loud drink in this place.','Half the room is listening to the other half.'],
 'port:tunnels':['Maintenance says the lower junction is still temperamental.','Footsteps carry a long way down here.','If the lights flicker twice, use the next corridor.'],
 'port:hideout':['Salvage is sorted. Mostly.','We found one clean power coupler in the last haul.','Keep the good tools away from the loaner bin.']
};
const roleBarks={
 security:['Perimeter is clean.','I have the next sweep.','No trouble on my lane.'],
 mechanic:['Give me a machine and enough time and I can usually make it regret breaking.','I am still chasing one bad reading.','The tools are behaving better than the hardware.'],
 technician:['Systems are stable enough to stop staring at them. For now.','Diagnostics are clean on my side.','One sensor is lying. I just have to figure out which one.'],
 courier:['Route is open if you do not mind taking the ugly way.','I have seen worse traffic. Not much worse.','Fast delivery costs extra for a reason.'],
 analyst:['The numbers agree, which makes me suspicious.','I am still separating signal from noise.','There is a pattern here. I just do not trust it yet.'],
 broker:['Work is easy to find. Good work takes longer.','Somebody is paying to keep a name off the board.','I can find a buyer. The question is whether you want one.']
};
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
function hydrateNpc(n){if(!n||typeof n!=='object')return n;n.interactions=Math.max(0,Number(n.interactions||0));n.familiarity=clamp(n.familiarity||0,0,100);n.mood=n.mood||'neutral';n.history=Array.isArray(n.history)?n.history.slice(-8):[];if(n.lastBark===undefined)n.lastBark=null;return n}
function callSign(data){return data?.player?.callSign||data?.player?.callsign||data?.character?.callSign||data?.character?.callsign||'Deadlock'}
function linePool(ctx,npc){const preset=ctx?.presetId||ctx?.profileId||'',theme=ctx?.preset?.theme||ctx?.theme||'default';return[...(roleBarks[npc?.role]||[]),...(barkPools[preset]||[]),...(barkPools[theme]||[]),...barkPools.default]}
function lineFor(data,ctx,npc,intent='greet'){hydrateNpc(npc);const pool=linePool(ctx,npc);if(!pool.length)return'...';let i=hash(`${npc.seed}|${npc.interactions}|${intent}|${sceneKey(ctx)}`)%pool.length;if(pool.length>1&&pool[i]===npc.lastBark)i=(i+1)%pool.length;return pool[i].replace(/\{callSign\}/g,callSign(data)).replace(/\{name\}/g,npc.name||'stranger')}
function interact(data,ctx,npcId,intent='greet'){const st=ensure(data),key=sceneKey(ctx),npc=st.populations?.[key]?.npcs?.find(n=>n.id===npcId);if(!npc)return null;hydrateNpc(npc);npc.interactions++;npc.familiarity=clamp(npc.familiarity+(npc.interactions<=2?4:1),0,100);npc.lastSeenAt=now();const line=lineFor(data,ctx,npc,intent);npc.lastBark=line;npc.history.push({at:now(),intent,line});npc.history=npc.history.slice(-8);npc.mood=intent==='threat'?'alert':npc.familiarity>=12?'familiar':'neutral';st.dirty=true;return{key,intent,line,npc:clone(npc)}}
function ensure(data){if(!data||typeof data!=='object')throw new Error('Campaign data required');let st=data.livingWorld;if(!st||st.schema!==SCHEMA){st=fresh(data);data.livingWorld=st}st.version=VERSION;st.populations=st.populations||{};st.visits=st.visits||{};st.trafficEvents=st.trafficEvents||{};st.sequence=Number(st.sequence||0);return st}
function nextId(st,prefix){st.sequence++;return`${prefix}-${st.sequence.toString(36)}-${hash(prefix+'|'+st.sequence).toString(16).slice(0,5)}`}
function nameFor(seed){const r=rng(seed);return pick(NAME_A,r)+pick(NAME_B,r)}
function profileFor(ctx){const preset=ctx?.presetId||ctx?.profileId||'';if(profiles[preset])return profiles[preset];const theme=ctx?.preset?.theme||ctx?.theme||'default';return profiles[theme]||profiles.default}
function sceneKey(ctx){const loc=ctx?.loc?.id||ctx?.locationId||'unknown';const p=ctx?.presetId||ctx?.profileId||ctx?.preset?.theme||ctx?.theme||'default';const room=ctx?.preset?.room||ctx?.room||ctx?.page||'scene';return`${loc}|${p}|${room}`}
function makeNpc(st,key,index,profile){const r=rng(`${st.seed}|${key}|npc|${index}`),isDroid=r()<Number(profile.droid||0),role=pick(profile.roles.length?profile.roles:['traveler'],r),behavior=pick(profile.behaviors.length?profile.behaviors:['idle'],r);const sp=isDroid?'droid':pick(species,r);const depth=pick(['far','mid','near'],r),dir=r()<.5?'from-left':'from-right',carry=behavior==='carry'?pick(['crate','toolcase','canister'],r):behavior==='service'?pick(['scanner','tool'],r):null;return{id:nextId(st,'amb'),name:isDroid?`Unit ${Math.floor(r()*900+100)}`:nameFor(`${key}|${index}|name`),species:sp,role,behavior,depth,direction:dir,carry,seed:hash(`${key}|${index}`),lane:Math.floor(r()*5),speed:Number((11+r()*13).toFixed(2)),scale:Number((.66+r()*.34).toFixed(2)),accent:Math.floor(r()*7),home:key,createdAt:now(),lastSeenAt:now(),mood:'neutral',interactions:0,familiarity:0,lastBark:null,history:[]}}
function desiredCount(base){return Math.max(0,Math.round(Number(base||0)*bodyQuality()))}
function ensurePopulation(data,ctx,baseCount){const st=ensure(data),key=sceneKey(ctx),profile=profileFor(ctx),target=desiredCount(baseCount);let pop=st.populations[key];if(!pop){pop={key,createdAt:now(),npcs:[]};st.populations[key]=pop;st.dirty=true}while(pop.npcs.length<target){pop.npcs.push(makeNpc(st,key,pop.npcs.length,profile));st.dirty=true}for(const n of pop.npcs){hydrateNpc(n);n.lastSeenAt=now();}st.visits[key]=Number(st.visits[key]||0)+1;return{key,profile,npcs:pop.npcs.slice(0,target)}}
function npcMarkup(n,i){const talk=n.behavior==='talk'?'<span class="lw-chatter"><b></b><b></b><b></b></span>':'';const carry=n.carry?`<span class="lw-carry ${esc(n.carry)}"></span>`:'';return`<i class="lw-npc lw-${esc(n.species)} lw-${esc(n.behavior)} depth-${esc(n.depth)} ${esc(n.direction)} accent-${n.accent}" data-lw-id="${esc(n.id)}" data-lw-role="${esc(n.role)}" role="button" tabindex="0" aria-label="Talk to ${esc(n.name)}, ${esc(n.role)}" title="${esc(n.name)} · ${esc(n.role)}" style="--lw-i:${i};--lw-lane:${n.lane};--lw-speed:${n.speed}s;--lw-scale:${n.scale};--lw-delay:${-(i*2.37+n.lane*.71)}s"><span class="lw-ground"></span><span class="lw-rig"><span class="lw-head"></span><span class="lw-body"></span><span class="lw-arm a"></span><span class="lw-arm b"></span><span class="lw-leg a"></span><span class="lw-leg b"></span>${carry}${talk}</span></i>`}
function propsMarkup(profile,key){return`<div class="lw-props" aria-hidden="true">${(profile.props||[]).map((p,i)=>`<i class="lw-prop prop-${esc(p)}" style="--p:${i};--pd:${-(hash(key+'|prop|'+i)%50)/10}s"></i>`).join('')}</div>`}
function peopleMarkup(data,ctx,baseCount){const pop=ensurePopulation(data,ctx,baseCount);if(!pop.npcs.length)return'';const layers=['far','mid','near'].map(d=>`<div class="lw-layer depth-${d}">${pop.npcs.filter(n=>n.depth===d).map(n=>npcMarkup(n,pop.npcs.indexOf(n))).join('')}</div>`).join('');return`<div class="lw-population" data-lw-key="${esc(pop.key)}" aria-hidden="true">${propsMarkup(pop.profile,pop.key)}${layers}</div>`}
function trafficClass(ctx){const t=ctx?.preset?.theme||ctx?.theme||'';if(['combat','cockpit','ship'].includes(t))return[];if(t==='hq'&&ctx?.presetId!=='blackglass_hangar')return['shuttle','light_freighter','patrol'];return['fighter','shuttle','light_freighter','freighter','cargo','patrol']}
function trafficMarkup(data,ctx,count=3){if(!F||!SF||Number(count||0)<=0)return'';const classes=trafficClass(ctx);if(!classes.length)return'';const st=ensure(data),key=`lw|${sceneKey(ctx)}|traffic`,had=!!data?.shipForge?.traffic?.[key]?.length;const rows=SF.trafficPopulation(data,key,desiredCount(count),classes);if(!had&&rows.length)st.dirty=true;return rows.map((x,i)=>{const seed=hash(`${key}|${i}`),mode=['cruise','approach','depart','landing'][seed%4],depth=['far','mid','near'][(seed>>>4)%3],dir=(seed>>>7)%2?'from-left':'from-right';return`<i class="lw-ship lw-ship-${mode} depth-${depth} ${dir}" data-lw-ship="${esc(x.record.id)}" style="--lw-ship-i:${i};--lw-ship-delay:${-(i*3.7)}s;--lw-ship-speed:${12+(seed%9)}s;--lw-ship-scale:${(.48+((seed>>>8)%40)/100).toFixed(2)}">${F.renderMarkup(x.blueprint,{label:`${F.catalog.classes[x.blueprint.classId]?.label||x.blueprint.classId} ambient traffic`})}</i>`}).join('')}
function sceneMarkup(data,ctx,count=4){return peopleMarkup(data,ctx,count)}
function portContext(scene){return{page:'Lower Port',presetId:`port:${scene}`,profileId:`port:${scene}`,locationId:'veyra_prime',theme:'urban',preset:{theme:'urban',room:scene},loc:{id:'veyra_prime'}}}
function portMarkup(data,portState,scene){const ctx=portContext(scene),base={landing:8,market:9,cantina:7,tunnels:5,hideout:6}[scene]||6,traffic=['landing','market'].includes(scene)?trafficMarkup(data,ctx,scene==='landing'?3:2):'';return`<div class="lw-port-world">${traffic}<div class="lw-port-ground">${peopleMarkup(data,ctx,base)}</div></div>`}
let mounted=null,observer=null,timer=0,reactionTimer=0,mountCleanup=null;
function showBark(rootEl,result){if(!rootEl||!result)return;let panel=rootEl.querySelector('[data-lw-bark]');if(!panel){panel=document.createElement('div');panel.className='lw-bark-panel';panel.dataset.lwBark='1';panel.setAttribute('aria-live','polite');rootEl.appendChild(panel)}panel.innerHTML=`<b>${esc(result.npc.name)}</b><span>${esc(result.npc.role)}</span><p>${esc(result.line)}</p>`;panel.classList.remove('show');void panel.offsetWidth;panel.classList.add('show');clearTimeout(panel._lwTimer);panel._lwTimer=setTimeout(()=>panel.classList.remove('show'),4600)}
function react(type,detail={}){if(!mounted)return false;const alert=['player-shot','enemy-shot','hit','ship-fire','ship-hit','enemy-flyby'].includes(type),attend=['narration','dialogue'].includes(type);if(!alert&&!attend)return false;clearTimeout(reactionTimer);mounted.classList.remove('lw-react-alert','lw-react-attend');mounted.classList.add(alert?'lw-react-alert':'lw-react-attend');mounted.querySelectorAll('.lw-npc').forEach((el,i)=>el.classList.toggle('lw-reacting',alert?i%3!==0:i%4===0));reactionTimer=setTimeout(()=>{if(!mounted)return;mounted.classList.remove('lw-react-alert','lw-react-attend');mounted.querySelectorAll('.lw-reacting').forEach(el=>el.classList.remove('lw-reacting'))},alert?1200:900);return true}
function mount(rootEl,data,ctx){unmount();if(!rootEl)return;mounted=rootEl;rootEl.classList.add('lw-active');const activate=e=>{const target=e.target?.closest?.('[data-lw-id]');if(!target||!rootEl.contains(target))return;if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;e.preventDefault();const result=interact(data,ctx,target.dataset.lwId,'greet');if(!result)return;target.classList.add('lw-spoke');setTimeout(()=>target.classList.remove('lw-spoke'),700);showBark(rootEl,result);try{rootEl.dispatchEvent(new CustomEvent('deadlock:living-world-dirty',{bubbles:true,detail:{npcId:result.npc.id,key:result.key,line:result.line}}))}catch{}};rootEl.addEventListener('click',activate);rootEl.addEventListener('keydown',activate);mountCleanup=()=>{rootEl.removeEventListener('click',activate);rootEl.removeEventListener('keydown',activate)};const reduce=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}})();if(reduce||bodyQuality()<.5||data?.settings?.animations===false)rootEl.classList.add('lw-reduced');try{observer=new IntersectionObserver(es=>{for(const e of es)rootEl.classList.toggle('lw-paused',!e.isIntersecting)},{threshold:.05});observer.observe(rootEl)}catch{}timer=setInterval(()=>{if(!mounted||!document.body.contains(mounted))return unmount();const t=Math.floor(Date.now()/7000);mounted.style.setProperty('--lw-cycle',String(t%12));mounted.querySelectorAll('.lw-npc').forEach((el,i)=>el.classList.toggle('lw-beat',((t+i)%5)===0))},7000)}
function unmount(){if(timer)clearInterval(timer);timer=0;if(reactionTimer)clearTimeout(reactionTimer);reactionTimer=0;try{observer?.disconnect()}catch{}observer=null;try{mountCleanup?.()}catch{}mountCleanup=null;if(mounted){mounted.classList.remove('lw-active','lw-paused','lw-react-alert','lw-react-attend');mounted=null}}
function consumeDirty(data){const st=ensure(data),v=!!st.dirty;st.dirty=false;return v}
function summary(data){const st=ensure(data),pops=Object.values(st.populations),all=pops.flatMap(p=>p.npcs||[]).map(hydrateNpc);return{version:st.version,scenes:pops.length,npcs:all.length,interactions:all.reduce((a,n)=>a+n.interactions,0),familiarNpcs:all.filter(n=>n.familiarity>=12).length,trafficScenes:Object.keys(data.shipForge?.traffic||{}).filter(k=>k.startsWith('lw|')).length}}
root.DeadlockLivingWorld={schema:SCHEMA,version:VERSION,profiles,ensure,sceneKey,profileFor,ensurePopulation,peopleMarkup,sceneMarkup,trafficMarkup,portContext,portMarkup,lineFor,interact,mount,unmount,react,consumeDirty,summary,_test:{hash,rng,nameFor,desiredCount,makeNpc,hydrateNpc,linePool}};
})(typeof window!=='undefined'?window:globalThis);
