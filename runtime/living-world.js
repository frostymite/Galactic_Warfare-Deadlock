/* Deadlock Phase 3 — Living Backgrounds.
 * Persistent ambient populations + behavior-driven background traffic.
 * Durable records are plain JSON so this layer can migrate to Godot later.
 */
(function(root){
'use strict';
const VERSION='1.2.0';
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
const routineClusters={
 blackglass_station:{
  id:'blackglass_station',
  stops:[
   {presetId:'blackglass',room:'command',theme:'hq',count:6},
   {presetId:'blackglass_briefing',room:'briefing',theme:'hq',count:5},
   {presetId:'blackglass_hangar',room:'hangar',theme:'hq',count:10},
   {presetId:'blackglass_quarters',room:'quarters',theme:'hq',count:4},
   {presetId:'blackglass_contracts',room:'contracts',theme:'hq',count:6}
  ]
 },
 'veyra_prime:port':{
  id:'veyra_prime:port',
  stops:[
   {presetId:'port:landing',room:'landing',theme:'urban',count:8},
   {presetId:'port:market',room:'market',theme:'urban',count:9},
   {presetId:'port:cantina',room:'cantina',theme:'urban',count:7},
   {presetId:'port:tunnels',room:'tunnels',theme:'urban',count:5},
   {presetId:'port:hideout',room:'hideout',theme:'urban',count:6}
  ]
 }
};
const ambientEventPools={
 blackglass_hangar:[
  {kind:'service',title:'Raven Service Cycle',detail:'A maintenance team rolls a diagnostic cradle under the Raven while a flight tech calls out power readings.',rumor:'A recurring vibration showed up under high-thrust load. ShipForge diagnostics may reveal a component worth inspecting.',barks:['We are tracing a vibration through the Raven before it becomes an expensive problem.','Service cradle is live. Give us a clean minute under the port side.']},
  {kind:'arrival',title:'Unscheduled Arrival',detail:'A ship drops into Blackglass approach control under a tightly verified transponder.',rumor:'The arriving crew requested private clearance before transmitting cargo details.',barks:['That arrival asked for sealed handling. Command has the transponder record.','Approach control cleared one visitor under Apex eyes-only handling.']},
  {kind:'cargo',title:'Salvage Intake',detail:'Loaders wheel a newly tagged salvage pallet toward the ShipForge benches.',rumor:'One recovered component carries a manufacturer mark that does not match its declared wreck.',barks:['That salvage tag is wrong for the hull it came off.','Quartermaster wants the odd component isolated before inventory.']}
 ],
 blackglass_briefing:[
  {kind:'conversation',title:'Analyst Huddle',detail:'Two analysts quietly compare route overlays and contract timestamps at the edge of the briefing floor.',rumor:'Several unrelated contracts share the same narrow transit window.',barks:['Three jobs, one transit window. That is either coincidence or coordination.','We are checking whether the timing pattern points to a common broker.']},
  {kind:'intel',title:'Secure Intelligence Burst',detail:'The tactical display flashes a short encrypted packet, then returns to standby.',rumor:'A fresh intelligence burst references a ship registry already seen in Apex traffic records.',barks:['That packet cross-referenced one of our old traffic captures.','New intel hit the board. Registry match is incomplete, but not random.']}
 ],
 blackglass_contracts:[
  {kind:'courier',title:'Secure Courier',detail:'A courier places a sealed contract shard into a shielded reader and waits for authentication.',rumor:'The courier refused to name the sponsor until Deadlock personally accepts the authentication handshake.',barks:['Sponsor identity stays sealed until command accepts the handshake.','This one came in through a broker chain designed to hide the first buyer.']},
  {kind:'conversation',title:'Broker Dispute',detail:'Two brokers keep their voices low while arguing over exclusivity on a high-risk recovery job.',rumor:'Both brokers appear to be bidding on the same missing cargo without realizing it.',barks:['Two buyers want the same crate. Neither admits knowing the other exists.','That recovery job just became more interesting than the payout.']}
 ],
 'port:landing':[
  {kind:'arrival',title:'Stacked Arrival',detail:'Landing control diverts one inbound ship to a holding loop while deck crews clear a blocked pad.',rumor:'The delayed ship is broadcasting a valid registry but carrying no public cargo declaration.',barks:['That inbound has papers, but no cargo declaration. Weird combination.','Pad three is blocked, so somebody gets to circle and think about their life choices.']},
  {kind:'service',title:'Emergency Turnaround',detail:'Mechanics swarm a recently landed ship, replacing a scorched service panel before its next departure.',rumor:'The damage pattern looks less like wear and more like a near miss from directed energy.',barks:['That panel did not burn out on its own.','Crew says debris strike. I say somebody shot close enough to scare them.']}
 ],
 'port:market':[
  {kind:'conversation',title:'Price Argument',detail:'A vendor and courier argue over a sudden surcharge while shoppers pretend not to listen.',rumor:'The surcharge traces back to a shortage in repair-grade power couplers.',barks:['Power couplers doubled because somebody bought half the clean stock.','If you need repair-grade hardware, buy it before the next convoy hears about the shortage.']},
  {kind:'cargo',title:'Quiet Bulk Purchase',detail:'A buyer clears an entire rack of maintenance supplies without haggling.',rumor:'The buyer is assembling enough repair stock for several ships, not one.',barks:['Nobody buys that much sealant for one hull.','Bulk buyer paid asking price. That is how you know they are in a hurry.']}
 ],
 'port:cantina':[
  {kind:'conversation',title:'Whispered Table',detail:'A courier and spacer stop talking the moment uniformed security crosses the doorway.',rumor:'Their conversation mentioned an unregistered transfer in the maintenance tunnels.',barks:['They were talking tunnels before security walked in.','Somebody moved something off-manifest below the port.']}
 ],
 'port:tunnels':[
  {kind:'power',title:'Power Flicker',detail:'The corridor lights dip twice and a maintenance alarm clicks once before going silent.',rumor:'The fault repeats near a junction that should be isolated from public power.',barks:['That circuit is supposed to be isolated. It should not be pulling anything.','Two flickers means the fault is downstream of the public junction.']},
  {kind:'conversation',title:'Maintenance Exchange',detail:'Two technicians compare tool readouts beside a locked conduit hatch.',rumor:'A sealed conduit is showing intermittent traffic on a line marked inactive.',barks:['Inactive line is carrying a pulse every few minutes.','Somebody either mislabeled that conduit or is using it quietly.']}
 ],
 'port:hideout':[
  {kind:'cargo',title:'Fresh Salvage Cart',detail:'A battered cart arrives loaded with mixed ship hardware and one carefully wrapped component.',rumor:'The wrapped component was removed intact from a wreck whose registry plate had been cut away.',barks:['The wrapped part came out clean. Registry did not.','Somebody took a torch to the wreck ID before our crew found it.']}
 ]
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
function fresh(data){return{schema:SCHEMA,version:VERSION,seed:hash(data?.created||'deadlock'),sequence:0,populations:{},visits:{},trafficEvents:{},ambientEvents:{},rumors:[],clockTick:0,activeSceneKey:null,createdAt:now(),dirty:false}}
function clusterFor(ctx){const loc=ctx?.loc?.id||ctx?.locationId||'',preset=ctx?.presetId||ctx?.profileId||'';if(loc==='blackglass_station'&&preset.startsWith('blackglass'))return routineClusters.blackglass_station;if(loc==='veyra_prime'&&preset.startsWith('port:'))return routineClusters['veyra_prime:port'];return null}
function contextForStop(ctx,stop){const locId=ctx?.loc?.id||ctx?.locationId||'unknown';return{page:ctx?.page||'Story',presetId:stop.presetId,profileId:stop.presetId,locationId:locId,theme:stop.theme,preset:{theme:stop.theme,room:stop.room},loc:{...(ctx?.loc||{}),id:locId}}}
function routeForRole(cluster,role,homePresetId,seed){if(!cluster)return[homePresetId];const all=cluster.stops.map(x=>x.presetId),r=String(role||'').toLowerCase(),choose=ids=>ids.filter(x=>all.includes(x));let route=[];
 if(cluster.id==='blackglass_station'){
  if(/security/.test(r))route=all;
  else if(/mechanic|flight tech|hangar|loader|quartermaster/.test(r))route=choose(['blackglass_hangar','blackglass','blackglass_contracts']);
  else if(/analyst|officer|broker/.test(r))route=choose(['blackglass','blackglass_briefing','blackglass_contracts']);
  else if(/runner|courier/.test(r))route=all;
  else route=choose([homePresetId,'blackglass']);
 }else{
  if(/security/.test(r))route=choose(['port:landing','port:market','port:tunnels']);
  else if(/mechanic|technician|salvager|scavenger|loader|flight tech/.test(r))route=choose(['port:landing','port:tunnels','port:hideout','port:market']);
  else if(/courier|runner/.test(r))route=choose(['port:landing','port:market','port:cantina','port:tunnels']);
  else if(/vendor|shopper|patron|server|spacer/.test(r))route=choose(['port:market','port:cantina']);
  else route=choose([homePresetId,'port:market']);
 }
 if(!route.includes(homePresetId))route.unshift(homePresetId);route=[...new Set(route)];if(route.length>2&&(hash(seed+'|route')%2))route=[route[0],...route.slice(1).reverse()];return route.length?route:[homePresetId]}
function routineActivity(n,preset,tick){const r=String(n.role||'').toLowerCase(),seed=hash(`${n.seed}|${preset}|${tick}`);if(/security/.test(r))return'patrol';if(/mechanic|technician|flight tech|hangar/.test(r)&&/(hangar|landing|tunnels|hideout)/.test(preset))return'service';if(/loader|salvager|scavenger/.test(r))return'carry';if(/analyst|officer|broker/.test(r)&&/(briefing|contracts|command)/.test(preset))return seed%3?'inspect':'talk';if(/courier|runner/.test(r))return seed%2?'walk':'carry';return ['walk','idle','talk','inspect'][seed%4]}
function hydrateRoutine(n,ctx){hydrateNpc(n);const homePreset=n.homePresetId||String(n.home||'').split('|')[1]||ctx?.presetId||'default',cluster=clusterFor({...ctx,presetId:homePreset});n.homePresetId=homePreset;if(!n.routine||typeof n.routine!=='object'){const route=routeForRole(cluster,n.role,homePreset,n.seed);n.routine={clusterId:cluster?.id||null,route,currentPresetId:homePreset,dwell:2+(hash(n.seed+'|dwell')%4),offset:hash(n.seed+'|offset')%11,activity:n.behavior||'idle',updatedTick:0}}else{n.routine.route=Array.isArray(n.routine.route)&&n.routine.route.length?n.routine.route:[homePreset];n.routine.dwell=Math.max(1,Number(n.routine.dwell||3));n.routine.offset=Number(n.routine.offset||0);n.routine.currentPresetId=n.routine.currentPresetId||homePreset;n.routine.activity=n.routine.activity||n.behavior||'idle'}return n.routine}
function updateRoutine(n,ctx,tick){const rt=hydrateRoutine(n,ctx),route=rt.route||[n.homePresetId];const idx=Math.floor((Number(tick||0)+rt.offset)/rt.dwell)%route.length;rt.currentPresetId=route[idx]||n.homePresetId;rt.activity=routineActivity(n,rt.currentPresetId,tick);rt.updatedTick=tick;return rt}
function hydrateNpc(n){if(!n||typeof n!=='object')return n;n.interactions=Math.max(0,Number(n.interactions||0));n.familiarity=clamp(n.familiarity||0,0,100);n.mood=n.mood||'neutral';n.history=Array.isArray(n.history)?n.history.slice(-8):[];if(n.lastBark===undefined)n.lastBark=null;return n}
function callSign(data){return data?.player?.callSign||data?.player?.callsign||data?.character?.callSign||data?.character?.callsign||'Deadlock'}
function currentEvent(data,ctx){const st=ensure(data),key=sceneKey(ctx),rows=st.ambientEvents?.[key]||[];return rows.length?rows[rows.length-1]:null}
function linePool(ctx,npc,data){const preset=ctx?.presetId||ctx?.profileId||'',theme=ctx?.preset?.theme||ctx?.theme||'default',event=currentEvent(data,ctx);return[...(event?.barks||[]),...(roleBarks[npc?.role]||[]),...(barkPools[preset]||[]),...(barkPools[theme]||[]),...barkPools.default]}
function lineFor(data,ctx,npc,intent='greet'){hydrateNpc(npc);const pool=linePool(ctx,npc,data);if(!pool.length)return'...';let i=hash(`${npc.seed}|${npc.interactions}|${intent}|${sceneKey(ctx)}`)%pool.length;if(pool.length>1&&pool[i]===npc.lastBark)i=(i+1)%pool.length;return pool[i].replace(/\{callSign\}/g,callSign(data)).replace(/\{name\}/g,npc.name||'stranger')}
function interact(data,ctx,npcId,intent='greet'){const st=ensure(data),key=sceneKey(ctx),npc=st.populations?.[key]?.npcs?.find(n=>n.id===npcId);if(!npc)return null;hydrateNpc(npc);npc.interactions++;npc.familiarity=clamp(npc.familiarity+(npc.interactions<=2?4:1),0,100);npc.lastSeenAt=now();const line=lineFor(data,ctx,npc,intent);npc.lastBark=line;npc.history.push({at:now(),intent,line});npc.history=npc.history.slice(-8);npc.mood=intent==='threat'?'alert':npc.familiarity>=12?'familiar':'neutral';st.dirty=true;return{key,intent,line,npc:clone(npc)}}
function ensure(data){if(!data||typeof data!=='object')throw new Error('Campaign data required');let st=data.livingWorld;if(!st||st.schema!==SCHEMA){st=fresh(data);data.livingWorld=st}st.version=VERSION;st.populations=st.populations||{};st.visits=st.visits||{};st.trafficEvents=st.trafficEvents||{};st.ambientEvents=st.ambientEvents||{};st.rumors=Array.isArray(st.rumors)?st.rumors:[];st.clockTick=Number(st.clockTick||0);st.activeSceneKey=st.activeSceneKey||null;st.sequence=Number(st.sequence||0);return st}
function nextId(st,prefix){st.sequence++;return`${prefix}-${st.sequence.toString(36)}-${hash(prefix+'|'+st.sequence).toString(16).slice(0,5)}`}
function nameFor(seed){const r=rng(seed);return pick(NAME_A,r)+pick(NAME_B,r)}
function profileFor(ctx){const preset=ctx?.presetId||ctx?.profileId||'';if(profiles[preset])return profiles[preset];const theme=ctx?.preset?.theme||ctx?.theme||'default';return profiles[theme]||profiles.default}
function sceneKey(ctx){const loc=ctx?.loc?.id||ctx?.locationId||'unknown';const p=ctx?.presetId||ctx?.profileId||ctx?.preset?.theme||ctx?.theme||'default';const room=ctx?.preset?.room||ctx?.room||ctx?.page||'scene';return`${loc}|${p}|${room}`}
function makeNpc(st,key,index,profile,ctx=null){const r=rng(`${st.seed}|${key}|npc|${index}`),isDroid=r()<Number(profile.droid||0),role=pick(profile.roles.length?profile.roles:['traveler'],r),behavior=pick(profile.behaviors.length?profile.behaviors:['idle'],r);const sp=isDroid?'droid':pick(species,r);const depth=pick(['far','mid','near'],r),dir=r()<.5?'from-left':'from-right',carry=behavior==='carry'?pick(['crate','toolcase','canister'],r):behavior==='service'?pick(['scanner','tool'],r):null;const npc={id:nextId(st,'amb'),name:isDroid?`Unit ${Math.floor(r()*900+100)}`:nameFor(`${key}|${index}|name`),species:sp,role,behavior,depth,direction:dir,carry,seed:hash(`${key}|${index}`),lane:Math.floor(r()*5),speed:Number((11+r()*13).toFixed(2)),scale:Number((.66+r()*.34).toFixed(2)),accent:Math.floor(r()*7),home:key,homePresetId:ctx?.presetId||String(key).split('|')[1]||'default',createdAt:now(),lastSeenAt:now(),mood:'neutral',interactions:0,familiarity:0,lastBark:null,history:[]};hydrateRoutine(npc,ctx||{presetId:npc.homePresetId,loc:{id:String(key).split('|')[0]||'unknown'}});return npc}
function desiredCount(base){return Math.max(0,Math.round(Number(base||0)*bodyQuality()))}
function ensurePopulationRecord(data,ctx,baseCount,visit=false){const st=ensure(data),key=sceneKey(ctx),profile=profileFor(ctx),target=desiredCount(baseCount);let pop=st.populations[key];if(!pop){pop={key,createdAt:now(),npcs:[]};st.populations[key]=pop;st.dirty=true}while(pop.npcs.length<target){pop.npcs.push(makeNpc(st,key,pop.npcs.length,profile,ctx));st.dirty=true}for(const n of pop.npcs){hydrateNpc(n);hydrateRoutine(n,ctx);n.lastSeenAt=now()}if(visit)st.visits[key]=Number(st.visits[key]||0)+1;return{key,profile,npcs:pop.npcs.slice(0,target)}}
function ensureCluster(data,ctx){const cluster=clusterFor(ctx);if(!cluster)return null;for(const stop of cluster.stops)ensurePopulationRecord(data,contextForStop(ctx,stop),stop.count,false);return cluster}
function ensurePopulation(data,ctx,baseCount){return ensurePopulationRecord(data,ctx,baseCount,true)}
function allClusterNpcs(data,ctx){const st=ensure(data),cluster=ensureCluster(data,ctx);if(!cluster)return[];const loc=ctx?.loc?.id||ctx?.locationId||'unknown',out=[];for(const stop of cluster.stops){const key=sceneKey(contextForStop(ctx,stop)),pop=st.populations[key];for(const n of pop?.npcs||[]){hydrateRoutine(n,{...ctx,presetId:n.homePresetId||stop.presetId});out.push(n)}}return out}
function presentPopulation(data,ctx,baseCount){const home=ensurePopulation(data,ctx,baseCount),cluster=ensureCluster(data,ctx),st=ensure(data);if(!cluster)return home;for(const n of allClusterNpcs(data,ctx))updateRoutine(n,ctx,st.clockTick);let rows=allClusterNpcs(data,ctx).filter(n=>n.routine?.currentPresetId===ctx.presetId);const target=desiredCount(baseCount);if(rows.length<target){const add=home.npcs.filter(n=>!rows.some(x=>x.id===n.id));rows=rows.concat(add.slice(0,target-rows.length))}rows.sort((a,b)=>hash(a.id+'|'+st.clockTick)-hash(b.id+'|'+st.clockTick));return{...home,npcs:rows.slice(0,target+2),cluster}}
function npcMarkup(n,i){const activity=n.routine?.activity||n.behavior||'idle',talk=activity==='talk'?'<span class="lw-chatter"><b></b><b></b><b></b></span>':'',routineCarry=['carry','service'].includes(activity)?(n.carry|| (activity==='service'?'scanner':'crate')):n.carry,carry=routineCarry?`<span class="lw-carry ${esc(routineCarry)}"></span>`:'';return`<i class="lw-npc lw-${esc(n.species)} lw-${esc(activity)} depth-${esc(n.depth)} ${esc(n.direction)} accent-${n.accent}" data-lw-id="${esc(n.id)}" data-lw-role="${esc(n.role)}" role="button" tabindex="0" aria-label="Talk to ${esc(n.name)}, ${esc(n.role)}" title="${esc(n.name)} · ${esc(n.role)}" style="--lw-i:${i};--lw-lane:${n.lane};--lw-speed:${n.speed}s;--lw-scale:${n.scale};--lw-delay:${-(i*2.37+n.lane*.71)}s"><span class="lw-ground"></span><span class="lw-rig"><span class="lw-head"></span><span class="lw-body"></span><span class="lw-arm a"></span><span class="lw-arm b"></span><span class="lw-leg a"></span><span class="lw-leg b"></span>${carry}${talk}</span></i>`}
function propsMarkup(profile,key){return`<div class="lw-props" aria-hidden="true">${(profile.props||[]).map((p,i)=>`<i class="lw-prop prop-${esc(p)}" style="--p:${i};--pd:${-(hash(key+'|prop|'+i)%50)/10}s"></i>`).join('')}</div>`}
function peopleMarkup(data,ctx,baseCount){const pop=presentPopulation(data,ctx,baseCount);if(!pop.npcs.length)return'';const layers=['far','mid','near'].map(d=>`<div class="lw-layer depth-${d}">${pop.npcs.filter(n=>n.depth===d).map(n=>npcMarkup(n,pop.npcs.indexOf(n))).join('')}</div>`).join('');return`<div class="lw-population" data-lw-key="${esc(pop.key)}" aria-hidden="true">${propsMarkup(pop.profile,pop.key)}${layers}</div>`}
function trafficClass(ctx){const t=ctx?.preset?.theme||ctx?.theme||'';if(['combat','cockpit','ship'].includes(t))return[];if(t==='hq'&&ctx?.presetId!=='blackglass_hangar')return['shuttle','light_freighter','patrol'];return['fighter','shuttle','light_freighter','freighter','cargo','patrol']}
function trafficMarkup(data,ctx,count=3){if(!F||!SF||Number(count||0)<=0)return'';const classes=trafficClass(ctx);if(!classes.length)return'';const st=ensure(data),key=`lw|${sceneKey(ctx)}|traffic`,had=!!data?.shipForge?.traffic?.[key]?.length;const rows=SF.trafficPopulation(data,key,desiredCount(count),classes);if(!had&&rows.length)st.dirty=true;return rows.map((x,i)=>{const seed=hash(`${key}|${i}`),mode=['cruise','approach','depart','landing'][seed%4],depth=['far','mid','near'][(seed>>>4)%3],dir=(seed>>>7)%2?'from-left':'from-right';return`<i class="lw-ship lw-ship-${mode} depth-${depth} ${dir}" data-lw-ship="${esc(x.record.id)}" style="--lw-ship-i:${i};--lw-ship-delay:${-(i*3.7)}s;--lw-ship-speed:${12+(seed%9)}s;--lw-ship-scale:${(.48+((seed>>>8)%40)/100).toFixed(2)}">${F.renderMarkup(x.blueprint,{label:`${F.catalog.classes[x.blueprint.classId]?.label||x.blueprint.classId} ambient traffic`})}</i>`}).join('')}
function eventShip(data,ctx,bucket){if(!F||!SF)return null;try{const key=`lw|${sceneKey(ctx)}|event-traffic`,rows=SF.trafficPopulation(data,key,3,trafficClass(ctx));if(!rows.length)return null;const x=rows[hash(key+'|'+bucket)%rows.length],classId=x.blueprint?.classId,label=F.catalog.classes[classId]?.label||classId||'ship';return{shipId:x.record?.id||null,classId,label}}catch{return null}}
function eventFor(data,ctx){const st=ensure(data),key=sceneKey(ctx),pool=ambientEventPools[ctx?.presetId]||[];if(!pool.length)return null;const bucket=Math.floor(st.clockTick/3),eventId=`${key}|event|${bucket}`,rows=st.ambientEvents[key]||(st.ambientEvents[key]=[]);let existing=rows.find(x=>x.id===eventId);if(existing)return existing;const gate=hash(`${st.seed}|${eventId}|gate`)%100;if(gate>=72)return null;const src=pool[hash(`${st.seed}|${eventId}|pick`)%pool.length],event={id:eventId,key,tick:st.clockTick,bucket,kind:src.kind,title:src.title,detail:src.detail,barks:[...(src.barks||[])],createdAt:now(),participants:[]};const present=presentPopulation(data,ctx,6).npcs;if(present.length){const a=present[hash(eventId+'|a')%present.length];event.participants.push(a.id);if(src.kind==='conversation'&&present.length>1){const b=present[(present.indexOf(a)+1+hash(eventId+'|b')%(present.length-1))%present.length];if(b&&b.id!==a.id)event.participants.push(b.id)}}if(['arrival','service'].includes(src.kind)){const ship=eventShip(data,ctx,bucket);if(ship){event.ship=ship;event.detail+=` ${ship.label} traffic is linked to the event.`}}if(src.rumor){const rumor={id:`rumor-${hash(eventId).toString(16)}`,eventId,key,tick:st.clockTick,summary:src.rumor,status:'heard',sourcePresetId:ctx.presetId,shipId:event.ship?.shipId||null,participantIds:[...event.participants]};event.rumorId=rumor.id;if(!st.rumors.some(x=>x.id===rumor.id))st.rumors.push(rumor);st.rumors=st.rumors.slice(-40)}rows.push(event);st.ambientEvents[key]=rows.slice(-8);st.dirty=true;return event}
function advanceScene(data,ctx){const st=ensure(data),key=sceneKey(ctx);ensureCluster(data,ctx);if(st.activeSceneKey!==key){st.activeSceneKey=key;st.clockTick++;for(const n of allClusterNpcs(data,ctx))updateRoutine(n,ctx,st.clockTick);eventFor(data,ctx);st.dirty=true}return{tick:st.clockTick,event:currentEvent(data,ctx)}}
function eventMarkup(data,ctx){const event=currentEvent(data,ctx);if(!event||Number(event.tick)<ensure(data).clockTick-2)return'';const ship=event.ship?.label?`<span class="lw-event-ship">${esc(event.ship.label)}</span>`:'',rumor=event.rumorId?'<span class="lw-event-rumor">RUMOR CAPTURED</span>':'';return`<aside class="lw-event-card lw-event-${esc(event.kind)}" data-lw-event="${esc(event.id)}"><div><b>${esc(event.title)}</b>${ship}${rumor}</div><p>${esc(event.detail)}</p></aside>`}
function sceneMarkup(data,ctx,count=4){advanceScene(data,ctx);return eventMarkup(data,ctx)+peopleMarkup(data,ctx,count)}
function portContext(scene){return{page:'Lower Port',presetId:`port:${scene}`,profileId:`port:${scene}`,locationId:'veyra_prime',theme:'urban',preset:{theme:'urban',room:scene},loc:{id:'veyra_prime'}}}
function portMarkup(data,portState,scene){const ctx=portContext(scene),base={landing:8,market:9,cantina:7,tunnels:5,hideout:6}[scene]||6;advanceScene(data,ctx);const traffic=['landing','market'].includes(scene)?trafficMarkup(data,ctx,scene==='landing'?3:2):'';return`<div class="lw-port-world">${traffic}${eventMarkup(data,ctx)}<div class="lw-port-ground">${peopleMarkup(data,ctx,base)}</div></div>`}
let mounted=null,observer=null,timer=0,reactionTimer=0,mountCleanup=null;
function showBark(rootEl,result){if(!rootEl||!result)return;let panel=rootEl.querySelector('[data-lw-bark]');if(!panel){panel=document.createElement('div');panel.className='lw-bark-panel';panel.dataset.lwBark='1';panel.setAttribute('aria-live','polite');rootEl.appendChild(panel)}panel.innerHTML=`<b>${esc(result.npc.name)}</b><span>${esc(result.npc.role)}</span><p>${esc(result.line)}</p>`;panel.classList.remove('show');void panel.offsetWidth;panel.classList.add('show');clearTimeout(panel._lwTimer);panel._lwTimer=setTimeout(()=>panel.classList.remove('show'),4600)}
function react(type,detail={}){if(!mounted)return false;const alert=['player-shot','enemy-shot','hit','ship-fire','ship-hit','enemy-flyby'].includes(type),attend=['narration','dialogue'].includes(type);if(!alert&&!attend)return false;clearTimeout(reactionTimer);mounted.classList.remove('lw-react-alert','lw-react-attend');mounted.classList.add(alert?'lw-react-alert':'lw-react-attend');mounted.querySelectorAll('.lw-npc').forEach((el,i)=>el.classList.toggle('lw-reacting',alert?i%3!==0:i%4===0));reactionTimer=setTimeout(()=>{if(!mounted)return;mounted.classList.remove('lw-react-alert','lw-react-attend');mounted.querySelectorAll('.lw-reacting').forEach(el=>el.classList.remove('lw-reacting'))},alert?1200:900);return true}
function mount(rootEl,data,ctx){unmount();if(!rootEl)return;mounted=rootEl;rootEl.classList.add('lw-active');const activate=e=>{const target=e.target?.closest?.('[data-lw-id]');if(!target||!rootEl.contains(target))return;if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;e.preventDefault();const result=interact(data,ctx,target.dataset.lwId,'greet');if(!result)return;target.classList.add('lw-spoke');setTimeout(()=>target.classList.remove('lw-spoke'),700);showBark(rootEl,result);try{rootEl.dispatchEvent(new CustomEvent('deadlock:living-world-dirty',{bubbles:true,detail:{npcId:result.npc.id,key:result.key,line:result.line}}))}catch{}};rootEl.addEventListener('click',activate);rootEl.addEventListener('keydown',activate);mountCleanup=()=>{rootEl.removeEventListener('click',activate);rootEl.removeEventListener('keydown',activate)};const reduce=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}})();if(reduce||bodyQuality()<.5||data?.settings?.animations===false)rootEl.classList.add('lw-reduced');try{observer=new IntersectionObserver(es=>{for(const e of es)rootEl.classList.toggle('lw-paused',!e.isIntersecting)},{threshold:.05});observer.observe(rootEl)}catch{}timer=setInterval(()=>{if(!mounted||!document.body.contains(mounted))return unmount();const t=Math.floor(Date.now()/7000);mounted.style.setProperty('--lw-cycle',String(t%12));mounted.querySelectorAll('.lw-npc').forEach((el,i)=>el.classList.toggle('lw-beat',((t+i)%5)===0))},7000)}
function unmount(){if(timer)clearInterval(timer);timer=0;if(reactionTimer)clearTimeout(reactionTimer);reactionTimer=0;try{observer?.disconnect()}catch{}observer=null;try{mountCleanup?.()}catch{}mountCleanup=null;if(mounted){mounted.classList.remove('lw-active','lw-paused','lw-react-alert','lw-react-attend');mounted=null}}
function consumeDirty(data){const st=ensure(data),v=!!st.dirty;st.dirty=false;return v}
function summary(data){const st=ensure(data),pops=Object.values(st.populations),all=pops.flatMap(p=>p.npcs||[]).map(hydrateNpc),events=Object.values(st.ambientEvents||{}).flat();return{version:st.version,tick:st.clockTick,scenes:pops.length,npcs:all.length,interactions:all.reduce((a,n)=>a+n.interactions,0),familiarNpcs:all.filter(n=>n.familiarity>=12).length,routineNpcs:all.filter(n=>n.routine?.route?.length).length,ambientEvents:events.length,rumors:st.rumors.length,trafficScenes:Object.keys(data.shipForge?.traffic||{}).filter(k=>k.startsWith('lw|')).length}}
root.DeadlockLivingWorld={schema:SCHEMA,version:VERSION,profiles,routineClusters,ensure,sceneKey,profileFor,ensurePopulation,ensureCluster,presentPopulation,peopleMarkup,sceneMarkup,trafficMarkup,portContext,portMarkup,lineFor,interact,currentEvent,eventFor,advanceScene,eventMarkup,mount,unmount,react,consumeDirty,summary,_test:{hash,rng,nameFor,desiredCount,makeNpc,hydrateNpc,linePool,clusterFor,routeForRole,routineActivity,hydrateRoutine,updateRoutine,allClusterNpcs}};
})(typeof window!=='undefined'?window:globalThis);
