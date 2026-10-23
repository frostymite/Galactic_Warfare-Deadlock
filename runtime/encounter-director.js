/* Deadlock Phase 3 — Procedural Encounter Director v1.
 * Offline deterministic encounters driven by campaign, Apex, NPC and Raven/ShipForge state.
 */
(function(root){
'use strict';
const VERSION='1.0.0',SCHEMA='deadlock.encounter-director.v1';
const hash=v=>{let h=2166136261;for(const c of String(v??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rng=s=>{let x=hash(s)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}};
const pick=(a,r)=>a[Math.min(a.length-1,Math.floor(r()*a.length))];
function ensure(data){data.story=data.story||{};let s=data.story.encounters;if(!s||s.schema!==SCHEMA)s=data.story.encounters={schema:SCHEMA,version:VERSION,sequence:0,recent:[],history:[],active:null};s.version=VERSION;s.recent=Array.isArray(s.recent)?s.recent:[];s.history=Array.isArray(s.history)?s.history:[];return s}
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
 const e={schema:'deadlock.encounter.v1',id:'enc-'+(++s.sequence).toString(36)+'-'+hash(loc+'|'+turn+'|'+s.sequence).toString(16).slice(0,6),kind:t.kind,location:loc,turn,title:t.kind.replace(/(^|_)(\w)/g,(_,a,b)=>' '+b.toUpperCase()).trim(),summary:pick(t.text,r),contractId:ctx.contract?.id||null,options:[]};
 e.options=options(data,e,ctx,r);s.active=e;s.recent.unshift(e.kind);s.recent=s.recent.slice(0,10);return e;
}
function resolve(data,encounterId,optionId,result={}){
 const s=ensure(data),e=s.active?.id===encounterId?s.active:s.history.find(x=>x.id===encounterId);if(!e)return null;
 const o=e.options.find(x=>x.id===optionId);if(!o)return null;
 const row={...e,resolution:{optionId:o.id,label:o.label,source:o.source,success:result.success!==false,outcome:result.outcome||null,resolvedTurn:Number(data.story?.director?.turn||0)}};
 s.history.unshift(row);s.history=s.history.slice(0,40);if(s.active?.id===encounterId)s.active=null;
 data.story.consequences=data.story.consequences||{};data.story.consequences.recent=Array.isArray(data.story.consequences.recent)?data.story.consequences.recent:[];
 data.story.consequences.recent.unshift({title:'Encounter: '+e.title,kind:row.resolution.success?'success':'danger',encounterId:e.id,contractId:e.contractId,source:o.source});data.story.consequences.recent=data.story.consequences.recent.slice(0,12);
 root.DeadlockStoryDirector?.recordChoice?.(data,{label:o.label,intent:o.intent,actionType:'encounter_'+o.id},o.label);return row;
}
function choice(data,ctx={}){const s=ensure(data),e=s.active||generate(data,ctx);return e.options.map(o=>({...o,encounterId:e.id,actionType:'encounter_option',purpose:'LIVE ENCOUNTER'}))}
root.DeadlockEncounterDirector={version:VERSION,schema:SCHEMA,ensure,generate,resolve,choice,ravenCapabilities:raven,apexState:apex};
})(typeof window!=='undefined'?window:globalThis);
