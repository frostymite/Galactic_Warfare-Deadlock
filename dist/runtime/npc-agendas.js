/* Deadlock Phase 3 — Persistent NPC Agendas + relationship web.
 * Background actors may pursue bounded goals and affect each other without
 * spending player resources, accepting/finishing contracts, or rewriting canon.
 */
(function(root){
'use strict';
const VERSION='1.0.0',SCHEMA='deadlock.npc-agendas.v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
function hash(v){let h=2166136261;for(const c of String(v??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let s=hash(seed)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function pick(a,r){return a&&a.length?a[Math.min(a.length-1,Math.floor(r()*a.length))]:null}
const ACTORS={
 jessa:{name:'Jessa',role:'Technology and Research',goal:'Keep Blackglass and the Raven technically reliable while separating useful intelligence from noise.'},
 dren:{name:'Dren Voss',role:'Independent field contact',goal:'Stay ahead of rival hunters, protect useful leverage, and keep weak intelligence from becoming a bad move.'},
 nera:{name:'Nera Kade',role:'Contract contact',goal:'Protect contract outcomes, timelines, and leverage without taking operational control from Deadlock.'},
 renn:{name:'Renn',role:'Operational contact',goal:'Keep routes, exits, and field assumptions survivable when Deadlock operations become complicated.'}
};
function edgeKey(a,b){return[a,b].sort().join('|')}
function ensureActor(state,id){
 const base=ACTORS[id];if(!base)return null;
 state.actors[id]=state.actors[id]||{id,name:base.name,role:base.role,goal:base.goal,progress:0,momentum:0,pressure:0,lastTurn:-99,lastAction:null,recentKinds:[],history:[]};
 const a=state.actors[id];a.name=base.name;a.role=base.role;a.goal=base.goal;a.progress=clamp(a.progress,0,100);a.momentum=clamp(a.momentum,-100,100);a.pressure=clamp(a.pressure,0,100);a.recentKinds=Array.isArray(a.recentKinds)?a.recentKinds:[];a.history=Array.isArray(a.history)?a.history:[];return a;
}
function ensureRelation(state,a,b){
 const key=edgeKey(a,b);
 state.relations[key]=state.relations[key]||{key,a:[a,b].sort()[0],b:[a,b].sort()[1],score:0,tension:0,lastTurn:-99,history:[]};
 const e=state.relations[key];e.score=clamp(e.score,-100,100);e.tension=clamp(e.tension,0,100);e.history=Array.isArray(e.history)?e.history:[];return e;
}
function ensure(data){
 if(!data?.story)throw new Error('Story state required');
 let state=data.story.npcAgendas;
 if(!state||state.schema!==SCHEMA)state=data.story.npcAgendas={schema:SCHEMA,version:VERSION,sequence:0,lastAdvanceTurn:-99,recentActors:[],actors:{},relations:{},activity:[]};
 state.version=VERSION;state.sequence=Number(state.sequence||0);state.lastAdvanceTurn=Number(state.lastAdvanceTurn??-99);state.recentActors=Array.isArray(state.recentActors)?state.recentActors:[];state.actors=state.actors||{};state.relations=state.relations||{};state.activity=Array.isArray(state.activity)?state.activity:[];
 Object.keys(ACTORS).forEach(id=>ensureActor(state,id));
 [['jessa','dren'],['jessa','nera'],['jessa','renn'],['dren','nera'],['dren','renn'],['nera','renn']].forEach(([a,b])=>ensureRelation(state,a,b));
 return state;
}
function nextId(state,p='agenda'){state.sequence++;return p+'-'+state.sequence.toString(36)+'-'+hash(p+'|'+state.sequence).toString(16).slice(0,5)}
function activeRumors(data){return(data.livingWorld?.rumors||[]).filter(x=>x&&['heard','investigating','uncertain'].includes(x.status||'heard')).slice().sort((a,b)=>Number(b.tick||0)-Number(a.tick||0))}
function activeLeads(data){return(data.story?.proceduralLeads||[]).filter(x=>x&&x.status!=='resolved'&&x.status!=='dismissed').slice().reverse()}
function actorCandidates(data,ctx,state,id,turn,r){
 const contract=ctx.contract||null,lead=activeLeads(data)[0]||null,rumor=activeRumors(data)[0]||null,weak=ctx.weakestSystem||null,danger=Number(ctx.danger??data.story?.danger??0),loc=String(ctx.location||data.story?.location||'the current operation'),rows=[];
 if(id==='jessa'){
  if(weak&&Number(weak.condition??100)<88)rows.push({kind:'maintenance_audit',tone:'cooperative',attention:Number(weak.condition)<60?8:5,systemId:weak.id||null,summary:`Jessa pulls ${weak.name||'the Raven\'s weakest system'} into a Blackglass diagnostic queue and starts checking why it is sitting at ${Math.round(Number(weak.condition||0))}%.`});
  if(lead)rows.push({kind:'intel_audit',targetId:'dren',tone:(hash(lead.id+'|jessa')%3===0?'friction':'professional'),attention:5,leadId:lead.id,contractId:lead.contractId||contract?.id||null,summary:`Jessa asks Dren for the raw timestamps behind “${String(lead.summary).replace(/[.]+$/,'')}” before she lets the lead influence Blackglass planning.`});
  if(rumor)rows.push({kind:'rumor_quarantine',tone:'professional',attention:4,rumorId:rumor.id,summary:`Jessa tags the report “${String(rumor.summary).replace(/[.]+$/,'')}” for isolated verification instead of letting an unverified rumor spread through the operations board.`});
  rows.push({kind:'lab_review',tone:'cooperative',attention:2,summary:`Jessa uses a quiet stretch at ${loc} to review technical logs and leaves a short list of anomalies for the next briefing.`});
 }
 if(id==='dren'){
  if(lead)rows.push({kind:'independent_trace',targetId:(hash(lead.id)%2?'renn':'jessa'),tone:'cooperative',attention:6,leadId:lead.id,contractId:lead.contractId||contract?.id||null,summary:`Dren works “${String(lead.summary).replace(/[.]+$/,'')}” without waiting for Deadlock and asks ${hash(lead.id)%2?'Renn to check the escape geometry':'Jessa to attack the data for weak assumptions'}.`});
  if(contract)rows.push({kind:'timeline_pushback',targetId:'nera',tone:'friction',attention:contract.id==='kade'?7:5,contractId:contract.id,summary:`Dren pushes back on Nera Kade's preferred timeline for ${contract.title}, arguing that bad timing will burn the trail faster than caution will.`});
  if(rumor)rows.push({kind:'source_check',targetId:'renn',tone:'professional',attention:4,rumorId:rumor.id,summary:`Dren sends Renn the source pattern behind “${String(rumor.summary).replace(/[.]+$/,'')}” and asks whether the movement matches anything real.`});
  rows.push({kind:'competition_watch',tone:'professional',attention:3,summary:'Dren spends time checking whether another hunter is quietly working the same operational space instead of waiting for one to announce themselves.'});
 }
 if(id==='nera'){
  if(contract)rows.push({kind:'contract_pressure',targetId:'dren',tone:(contract.id==='kade'?'friction':'professional'),attention:contract.id==='kade'?8:5,contractId:contract.id,summary:`Nera Kade challenges Dren to separate verified progress from instinct on ${contract.title}; she wants the next status update to contain facts, not confidence.`});
  if(lead)rows.push({kind:'leverage_review',targetId:'jessa',tone:'professional',attention:5,leadId:lead.id,contractId:lead.contractId||contract?.id||null,summary:`Kade asks Jessa whether the lead “${String(lead.summary).replace(/[.]+$/,'')}” changes operational leverage or merely adds another assumption.`});
  rows.push({kind:'terms_watch',tone:'professional',attention:3,contractId:contract?.id||null,summary:'Kade reviews the active terms and leaves the payout and authority exactly where they are; she is looking for changed risk, not inventing new terms.'});
 }
 if(id==='renn'){
  if(danger>=55)rows.push({kind:'exit_check',targetId:'dren',tone:'cooperative',attention:danger>=78?8:6,contractId:contract?.id||null,summary:`Renn quietly checks escape routes around ${loc} and tells Dren which exits stop being viable if the current pressure climbs any higher.`});
  if(lead)rows.push({kind:'route_scout',targetId:'dren',tone:'cooperative',attention:5,leadId:lead.id,contractId:lead.contractId||contract?.id||null,summary:`Renn cross-checks the route implied by “${String(lead.summary).replace(/[.]+$/,'')}” and sends Dren the parts that look survivable versus the parts that look staged.`});
  if(rumor)rows.push({kind:'rumor_route_check',tone:'professional',attention:4,rumorId:rumor.id,summary:`Renn compares “${String(rumor.summary).replace(/[.]+$/,'')}” against recent movement patterns and marks the parts that do not fit normal traffic.`});
  rows.push({kind:'contingency_map',tone:'cooperative',attention:2,summary:`Renn updates a contingency route around ${loc} without changing Deadlock's plan, just making sure there is somewhere to go if it fails.`});
 }
 const actor=state.actors[id],recent=actor.recentKinds.slice(0,2),fresh=rows.filter(x=>!recent.includes(x.kind));return fresh.length?fresh:rows;
}
function relationEffect(tone){if(tone==='cooperative')return{score:2,tension:-2};if(tone==='friction')return{score:-1,tension:4};if(tone==='hostile')return{score:-3,tension:8};return{score:0,tension:-1}}
function applyRelation(state,a,b,tone,turn,activityId,summary){
 if(!a||!b||a===b)return null;const e=ensureRelation(state,a,b),before={score:e.score,tension:e.tension},d=relationEffect(tone);e.score=clamp(e.score+d.score,-100,100);e.tension=clamp(e.tension+d.tension,0,100);e.lastTurn=turn;e.history.unshift({turn,activityId,tone,summary});e.history=e.history.slice(0,16);return{key:e.key,before,after:{score:e.score,tension:e.tension}};
}
function advance(data,ctx={},opts={}){
 const state=ensure(data),turn=Number(data.story?.director?.turn||0);
 if(!opts.force&&turn===state.lastAdvanceTurn)return null;
 if(!opts.force&&turn<1)return null;
 const gate=hash(`${data.created||'deadlock'}|agenda-gate|${turn}|${state.activity.length}`)%100;
 if(!opts.force&&gate>=74){state.lastAdvanceTurn=turn;return null}
 const r=rng(`${data.created||'deadlock'}|agenda|${turn}|${state.activity.length}`);
 let ids=Object.keys(ACTORS).filter(id=>!state.recentActors.slice(0,1).includes(id));if(!ids.length)ids=Object.keys(ACTORS);
 const actorId=opts.actorId&&ACTORS[opts.actorId]?opts.actorId:pick(ids,r),actor=state.actors[actorId],actions=actorCandidates(data,ctx,state,actorId,turn,r);
 if(!actions.length){state.lastAdvanceTurn=turn;return null}
 const action=opts.kind?actions.find(x=>x.kind===opts.kind)||pick(actions,r):pick(actions,r);
 const activity={id:nextId(state),turn,actorId,actorName:actor.name,targetId:action.targetId||null,targetName:action.targetId?ACTORS[action.targetId]?.name||action.targetId:null,kind:action.kind,tone:action.tone||'professional',attention:clamp(action.attention||3,0,10),summary:action.summary,location:ctx.location||data.story?.location||null,contractId:action.contractId||null,rumorId:action.rumorId||null,leadId:action.leadId||null,systemId:action.systemId||null};
 const rel=applyRelation(state,actorId,activity.targetId,activity.tone,turn,activity.id,activity.summary);if(rel)activity.relation=rel;
 actor.lastTurn=turn;actor.lastAction=activity.id;actor.progress=clamp(actor.progress+1+(activity.attention>=6?1:0),0,100);actor.momentum=clamp(actor.momentum+(activity.tone==='cooperative'?2:activity.tone==='friction'?-1:1),-100,100);actor.pressure=clamp(actor.pressure+(activity.attention>=7?3:-1),0,100);actor.recentKinds.unshift(activity.kind);actor.recentKinds=actor.recentKinds.slice(0,6);actor.history.unshift(activity.id);actor.history=actor.history.slice(0,20);
 state.activity.unshift(activity);state.activity=state.activity.slice(0,50);state.recentActors.unshift(actorId);state.recentActors=state.recentActors.slice(0,6);state.lastAdvanceTurn=turn;
 if(activity.rumorId){const rumor=(data.livingWorld?.rumors||[]).find(x=>x.id===activity.rumorId);if(rumor)rumor.agendaReferences=Number(rumor.agendaReferences||0)+1}
 if(activity.leadId){const lead=(data.story?.proceduralLeads||[]).find(x=>x.id===activity.leadId);if(lead)lead.agendaReferences=Number(lead.agendaReferences||0)+1}
 return activity;
}
function recent(data,limit=6){const state=ensure(data);return state.activity.slice(0,Math.max(0,limit))}
function actor(data,id){return ensure(data).actors[id]||null}
function relation(data,a,b){return ensureRelation(ensure(data),a,b)}
function attention(data,min=7){return recent(data,12).find(x=>Number(x.attention||0)>=min)||null}
function summary(data){
 const state=ensure(data);return{version:state.version,activities:state.activity.length,lastAdvanceTurn:state.lastAdvanceTurn,actors:Object.values(state.actors).map(x=>({id:x.id,progress:x.progress,momentum:x.momentum,pressure:x.pressure,lastTurn:x.lastTurn})),relations:Object.values(state.relations).map(x=>({key:x.key,score:x.score,tension:x.tension}))};
}
root.DeadlockNpcAgendas={schema:SCHEMA,version:VERSION,actors:ACTORS,ensure,advance,recent,actor,relation,attention,summary,_test:{hash,rng,edgeKey,actorCandidates,relationEffect,applyRelation}};
})(typeof window!=='undefined'?window:globalThis);
