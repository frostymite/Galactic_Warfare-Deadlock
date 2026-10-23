/* Deadlock Phase 3 — Procedural Encounter Director v1.
 * Offline deterministic encounters driven by campaign, Apex, NPC and Raven/ShipForge state.
 */
(function(root){
'use strict';
const VERSION='1.1.0',SCHEMA='deadlock.encounter-director.v1';
const hash=v=>{let h=2166136261;for(const c of String(v??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rng=s=>{let x=hash(s)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}};
const pick=(a,r)=>a[Math.min(a.length-1,Math.floor(r()*a.length))];
function ensure(data){data.story=data.story||{};let s=data.story.encounters;if(!s||s.schema!==SCHEMA)s=data.story.encounters={schema:SCHEMA,version:VERSION,sequence:0,recent:[],history:[],memory:[],active:null};s.version=VERSION;s.recent=Array.isArray(s.recent)?s.recent:[];s.history=Array.isArray(s.history)?s.history:[];s.memory=Array.isArray(s.memory)?s.memory:[];return s}
function raven(data){
 const R=root.DeadlockRavenVisual,F=root.ShipForge,out={parts:[],tags:new Set(),capabilities:new Set()};
 const state=R?.partState?.(data),ids=Object.values(state?.parts||{});
 for(const id of ids){const p=F?.part?.(id);if(!p)continue;out.parts.push(p);for(const t of p.tags||[])out.tags.add(String(t).toLowerCase());const text=[p.id,p.name,p.design,...(p.tags||[])].join(' ').toLowerCase();
  if(/sensor|radar|scan|recon/.test(text))out.capabilities.add('sensors');
  if(/jam|stealth|smuggl|cloak/.test(text))out.capabilities.add('electronic');
  if(p.slot==='weapon'||Number(p.damage||0)>0)out.capabilities.add('weapons');
  if(p.slot==='cargo'||Number(p.capacity||0)>0)out.capabilities.add('cargo');
  if(p.slot==='engine'||Number(p.speed||0)>0)out.capabilities.add('mobility');
  if(/repair|tow|tractor/.test(text)||Number(p.utility||0)>0)out.capabilities.add('utility');
 }
 return{...out,tags:[...out.tags],capabilities:[...out.capabilities],state};
}
function apex(data){const a=data.apex||data.story?.apex||{};return{leader:true,influence:Number(a.influence||a.reputation||0),heat:Number(a.heat||0),members:Array.isArray(a.members)?a.members.length:Number(a.memberCount||0)}}
const templates=[
 {kind:'intercept',locations:['space','raven','orbit'],text:['An unidentified patrol cuts across the Raven’s vector and demands a registry handshake.','A pursuit craft emerges from passive scan and begins matching the Raven’s course.']},
 {kind:'distress',locations:['space','raven','orbit'],text:['A damaged ship broadcasts a narrow-band distress call with no transponder.','A broken freighter drifts near the route, broadcasting only fragments of a crew manifest.']},
 {kind:'blackglass',locations:['blackglass'],text:['Blackglass security flags a visitor using credentials tied to an old Apex operation.','A hangar controller quietly reports a ship that has been watching Apex traffic patterns.']},
 {kind:'underworld',locations:['port','veyra','market'],text:['A broker offers fresh target movement data, but wants an Apex favor instead of credits.','Word spreads that another hunter is asking questions using Deadlock’s name.']},
 {kind:'contract',locations:['any'],text:['A new detail contradicts the cleanest lead on the active contract.','Someone connected to the current target makes an unexpected move before Deadlock can act.']}
];
function location(ctx){return String(ctx.location||ctx.scene||ctx.stage?.location||'any').toLowerCase()}
function options(data,e,ctx,r){
 const rv=raven(data),ap=apex(data),rows=[];
 const add=(id,label,intent,skill,dc,source)=>rows.push({id,label,intent,skill,dc,source});
 add('observe','Hold position and read the situation before committing.','investigate','Investigation',11,'baseline');
 add('talk',pick(['Open a channel and make them explain themselves.','Talk first, but give away nothing useful.'],r),'dialogue','Negotiation',11,'baseline');
 if(rv.capabilities.includes('sensors'))add('raven-sensors','Use the Raven’s installed sensors to identify what is not being broadcast.','ship','Technical',10,'raven:sensors');
 if(rv.capabilities.includes('electronic'))add('raven-electronic','Use the Raven’s electronic systems to mask the approach and probe their signal.','ship','Technical',12,'raven:electronic');
 if(rv.capabilities.includes('mobility'))add('raven-mobility','Use the Raven’s drive package to change the geometry before they can react.','ship','Piloting',12,'raven:mobility');
 if(rv.capabilities.includes('cargo')&&e.kind==='underworld')add('raven-cargo','Use the Raven’s cargo configuration as cover for a smuggling play.','deception','Deception',12,'raven:cargo');
 if(rv.capabilities.includes('weapons')&&['intercept','distress'].includes(e.kind))add('raven-weapons','Bring the Raven’s weapons online without firing and force a decision.','action','Intimidation',13,'raven:weapons');
 if(ap.leader)add('apex-command','Issue an Apex Protocol order: verify the contact, lock down exits, and feed Deadlock the cleanest route.','command','Leadership',11,'apex:leader');
 const seen=new Set(),out=[];for(const x of rows){const sig=x.source+'|'+x.intent;if(seen.has(sig))continue;seen.add(sig);out.push(x)}return out.slice(0,6);
}
function generate(data,ctx={}){
 const s=ensure(data),turn=Number(data.story?.director?.turn||0),loc=location(ctx),r=rng([data.created,turn,s.sequence,loc,ctx.contract?.id||'free'].join('|'));
 let pool=templates.filter(t=>t.locations.includes('any')||t.locations.some(x=>loc.includes(x)));if(!pool.length)pool=templates;
 const recent=new Set(s.recent.slice(0,4)),fresh=pool.filter(x=>!recent.has(x.kind));const t=pick(fresh.length?fresh:pool,r);
 const e={schema:'deadlock.encounter.v1',id:'enc-'+(++s.sequence).toString(36)+'-'+hash(loc+'|'+turn+'|'+s.sequence).toString(16).slice(0,6),kind:t.kind,location:loc,turn,title:t.kind.replace(/(^|_)(\w)/g,(_,a,b)=>' '+b.toUpperCase()).trim(),summary:pick(t.text,r),contractId:ctx.contract?.id||null,stage:1,maxStage:3,pressure:0,options:[]};
 e.options=options(data,e,ctx,r);s.active=e;s.recent.unshift(e.kind);s.recent=s.recent.slice(0,10);return e;
}
function reaction(source,success){
 if(source==='apex:leader')return success?'Apex operatives remember that Deadlock used the syndicate as a disciplined force.':'Apex operatives remember an order that failed under pressure.';
 if(String(source).startsWith('raven:'))return success?'The encounter reinforces confidence in the Raven configuration.':'The encounter exposes a weakness in how the Raven loadout was used.';
 if(source==='baseline')return success?'Witnesses remember Deadlock staying controlled under pressure.':'Witnesses remember the situation getting away from Deadlock.';
 return success?'The encounter leaves a favorable impression.':'The encounter leaves unfinished tension.';
}
function escalate(data,e,o,success,result={}){
 const s=ensure(data);e.stage=Number(e.stage||1)+1;e.pressure=Math.max(0,Number(e.pressure||0)+(success?-1:2));
 const tone=success?'advantage':'pressure',r=rng(e.id+'|stage|'+e.stage+'|'+o.id);
 const lines=success?['The first move works, but the situation changes before it can fully close.','The opposition gives ground and reveals a second problem.']:['The move does not settle it. The other side reacts and the encounter tightens.','The situation pushes back, forcing Deadlock to adapt instead of repeating the same play.'];
 e.summary=pick(lines,r);e.previousOption=o.id;e.previousSource=o.source;e.previousSuccess=success;
 e.options=options(data,e,{location:e.location,contract:e.contractId?{id:e.contractId}:null},r).filter(x=>x.id!==o.id);
 if(e.options.length<3)e.options=options(data,e,{location:e.location},r);
 s.active=e;return{status:'escalated',encounter:e,tone};
}
function resolve(data,encounterId,optionId,result={}){
 const s=ensure(data),e=s.active?.id===encounterId?s.active:s.history.find(x=>x.id===encounterId);if(!e)return null;
 const o=e.options.find(x=>x.id===optionId);if(!o)return null;const success=result.success!==false;
 s.memory.unshift({encounterId:e.id,kind:e.kind,stage:Number(e.stage||1),source:o.source,success,npcId:result.npcId||null,text:reaction(o.source,success),turn:Number(data.story?.director?.turn||0)});s.memory=s.memory.slice(0,50);
 root.DeadlockStoryDirector?.recordChoice?.(data,{label:o.label,intent:o.intent,actionType:'encounter_'+o.id},o.label);
 if(Number(e.stage||1)<Number(e.maxStage||3)&&result.final!==true)return escalate(data,e,o,success,result);
 const row={...e,resolution:{optionId:o.id,label:o.label,source:o.source,success,outcome:result.outcome||null,resolvedTurn:Number(data.story?.director?.turn||0)}};
 s.history.unshift(row);s.history=s.history.slice(0,40);if(s.active?.id===encounterId)s.active=null;
 data.story.consequences=data.story.consequences||{};data.story.consequences.recent=Array.isArray(data.story.consequences.recent)?data.story.consequences.recent:[];
 data.story.consequences.recent.unshift({title:'Encounter: '+e.title,kind:success?'success':'danger',encounterId:e.id,contractId:e.contractId,source:o.source});data.story.consequences.recent=data.story.consequences.recent.slice(0,12);
 return{status:'resolved',encounter:row};
}
function recentMemory(data,npcId=null,limit=6){const rows=ensure(data).memory.filter(x=>!npcId||x.npcId===npcId);return rows.slice(0,limit)}
function choice(data,ctx={}){const s=ensure(data),e=s.active||generate(data,ctx);return e.options.map(o=>({...o,encounterId:e.id,actionType:'encounter_option',purpose:'LIVE ENCOUNTER'}))}
root.DeadlockEncounterDirector={version:VERSION,schema:SCHEMA,ensure,generate,resolve,choice,recentMemory,ravenCapabilities:raven,apexState:apex};
})(typeof window!=='undefined'?window:globalThis);
