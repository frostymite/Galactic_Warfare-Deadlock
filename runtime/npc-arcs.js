/* Deadlock Phase 3 — Long-term NPC arcs, favors, secrets and relationship threads.
 * Arcs grow from existing agenda/relationship history. They may create optional
 * Story threads, but never spend player resources, accept/finish contracts, or
 * make command decisions for Rovan.
 */
(function(root){
'use strict';
const VERSION='1.0.0',SCHEMA='deadlock.npc-arcs.v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
function hash(v){let h=2166136261;for(const c of String(v??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let s=hash(seed)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function pick(a,r){return a&&a.length?a[Math.min(a.length-1,Math.floor(r()*a.length))]:null}
const STAGES=['seed','developing','active','turning_point','awaiting_player','resolved'];
const TEMPLATES={
 jessa_signal:{
  actorId:'jessa',title:'Signal Beneath the Noise',theme:'Jessa is separating real technical anomalies from the noise around Blackglass and the Raven.',
  triggers:['intel_audit','rumor_quarantine','lab_review'],
  seed:'Jessa has started keeping a separate anomaly list instead of putting every questionable reading on the main board.',
  secretHint:'Jessa is holding one technical concern off the general board until she can tell whether it is noise, equipment drift, or deliberate interference.',
  secretReveal:'Jessa has isolated a repeating anomaly that overlaps both technical telemetry and operational timing. She still does not claim a cause; she wants it verified before anyone builds a theory around it.',
  favor:'Jessa asks Deadlock to give her one uninterrupted verification window before the next major move, so she can compare Raven and Blackglass telemetry against recent lead timestamps.',
  decision:'Jessa needs Deadlock to choose whether the anomaly stays compartmentalized for one more verification cycle or gets shared with the wider Apex planning board now.'
 },
 jessa_reliability:{
  actorId:'jessa',title:'The Cost of Perfect Systems',theme:'Jessa is carrying more of Blackglass and Raven reliability than she admits.',
  triggers:['maintenance_audit','lab_review'],
  seed:'Jessa has begun auditing the same systems twice, not because they always fail, but because she is no longer satisfied with “probably fine.”',
  secretHint:'Jessa has a private concern about how much operational risk is being normalized around the Raven and Blackglass maintenance load.',
  secretReveal:'Jessa is not hiding a known failure. She is worried that repeated small compromises are becoming normal enough that nobody notices the cumulative risk.',
  favor:'Jessa asks Deadlock to review one maintenance priority with her and explicitly decide what can wait, instead of leaving her to silently absorb every risk.',
  decision:'Jessa wants a standing rule for when technical caution can delay an operation and when Deadlock expects her to accept the risk and move.'
 },
 dren_hunter:{
  actorId:'dren',title:'The Hunter Behind the Hunt',theme:'Dren suspects the operational trail is being observed by someone who understands hunters.',
  triggers:['competition_watch','independent_trace','source_check'],
  seed:'Dren has stopped treating rival-hunter signs as background noise and started mapping who reacts when the trail changes.',
  secretHint:'Dren has a private theory that somebody is learning the habits of the people chasing the target, not just chasing the target themselves.',
  secretReveal:'Dren cannot name a rival with confidence, but he has enough repeated reactions to believe someone is studying hunter behavior and source movement.',
  favor:'Dren asks Deadlock to let him seed one controlled false trail and watch who moves on it before the real operation advances.',
  decision:'Dren wants Deadlock to decide whether the suspected watcher becomes an active side objective or stays a monitored risk behind the main contract.'
 },
 dren_instinct:{
  actorId:'dren',title:'Proof and Instinct',theme:'Dren is being forced to decide how much of his field instinct he is willing to expose to scrutiny.',
  triggers:['timeline_pushback','independent_trace'],
  seed:'Dren has started defending not just his conclusions, but the field instincts that got him there.',
  secretHint:'Dren is keeping one unverified instinct to himself because he knows Nera will treat it as noise and Jessa will ask for evidence he does not yet have.',
  secretReveal:'Dren thinks one quiet pattern matters more than the obvious lead, but he has deliberately withheld it from the main board until he can produce something testable.',
  favor:'Dren asks Deadlock for room to test the quiet pattern once before it is dismissed or formalized.',
  decision:'Deadlock has to decide whether Dren gets discretion to act on a narrow instinct again, or whether future moves require corroboration first.'
 },
 nera_risk:{
  actorId:'nera',title:'The Risk She Won’t Price',theme:'Nera Kade is tracking operational risk that does not fit neatly into contract terms.',
  triggers:['contract_pressure','terms_watch','leverage_review'],
  seed:'Kade has begun separating contractual risk from operational risk instead of pretending the two are the same thing.',
  secretHint:'Kade has a private risk assessment she has not treated as a contract term because it is not verified enough to price.',
  secretReveal:'Kade’s private assessment says the current operation may carry a secondary leverage risk beyond the written objective. She has not changed the deal because the evidence is not strong enough.',
  favor:'Kade asks Deadlock for one clean, verified status packet before the next negotiation—no optimistic assumptions and no field shorthand.',
  decision:'Kade wants Deadlock to decide whether the unpriced risk belongs inside the operation’s planning or remains outside the contract until it becomes verifiable.'
 },
 nera_control:{
  actorId:'nera',title:'Leverage Without Control',theme:'Kade is testing how much influence she can exercise without crossing into command authority.',
  triggers:['contract_pressure','leverage_review'],
  seed:'Kade has started pushing harder on timing and proof while carefully avoiding direct operational orders.',
  secretHint:'Kade is privately measuring how much influence Deadlock will tolerate before he treats advice as interference.',
  secretReveal:'Kade’s concern is not hidden ownership of the operation; it is whether her leverage disappears if she cannot shape timing, information quality, or negotiation posture.',
  favor:'Kade asks Deadlock to hear one recommendation as advice rather than a contract demand, then give her a direct answer instead of leaving the boundary ambiguous.',
  decision:'Deadlock must define the line between Kade’s legitimate contract leverage and command decisions that remain exclusively his.'
 },
 renn_exit:{
  actorId:'renn',title:'The Exit Nobody Wants',theme:'Renn keeps building fallback routes around assumptions nobody likes discussing.',
  triggers:['exit_check','contingency_map','route_scout'],
  seed:'Renn has started maintaining contingency routes even when nobody asked, because too many plans assume the primary exit will still exist.',
  secretHint:'Renn has one fallback route he has not circulated because it depends on an ugly assumption about how the current operation could fail.',
  secretReveal:'Renn’s hidden route is not a betrayal or escape plan from Deadlock. It assumes the operation may need to abandon a clean objective in order to extract people alive.',
  favor:'Renn asks Deadlock to walk through the fallback with him once, without treating the exercise as a prediction that the main plan will fail.',
  decision:'Renn wants to know whether survival contingencies stay private until needed or become standard parts of Apex field planning.'
 },
 renn_routes:{
  actorId:'renn',title:'Routes Don’t Lie',theme:'Renn is using movement patterns to test whether the world around an operation is behaving normally.',
  triggers:['route_scout','rumor_route_check','exit_check'],
  seed:'Renn has started treating route changes as evidence instead of logistics.',
  secretHint:'Renn has noticed a movement pattern he does not want to call hostile yet, but it is consistent enough that he stopped dismissing it.',
  secretReveal:'Renn has verified that several “normal” route changes cluster around the same operational windows. He still cannot prove intent, but the pattern is real.',
  favor:'Renn asks Deadlock to let him shadow the route pattern one more cycle before the team changes behavior and tips off whoever might be watching.',
  decision:'Deadlock must decide whether the movement pattern becomes an active intelligence thread or stays a passive warning in the route plan.'
 }
};
const ACTOR_NAMES={jessa:'Jessa',dren:'Dren Voss',nera:'Nera Kade',renn:'Renn'};
function nextId(state,p='arc'){state.sequence=Number(state.sequence||0)+1;return p+'-'+state.sequence.toString(36)+'-'+hash(p+'|'+state.sequence).toString(16).slice(0,5)}
function ensure(data){
 if(!data?.story)throw new Error('Story state required');
 let s=data.story.npcArcs;
 if(!s||s.schema!==SCHEMA)s=data.story.npcArcs={schema:SCHEMA,version:VERSION,sequence:0,lastAdvanceTurn:-99,arcs:[],relationshipArcs:{},threads:[],secrets:[],favors:[],beats:[]};
 s.version=VERSION;s.sequence=Number(s.sequence||0);s.lastAdvanceTurn=Number(s.lastAdvanceTurn??-99);s.arcs=Array.isArray(s.arcs)?s.arcs:[];s.relationshipArcs=s.relationshipArcs||{};s.threads=Array.isArray(s.threads)?s.threads:[];s.secrets=Array.isArray(s.secrets)?s.secrets:[];s.favors=Array.isArray(s.favors)?s.favors:[];s.beats=Array.isArray(s.beats)?s.beats:[];
 return s;
}
function activeArc(state,actorId){return state.arcs.find(x=>x.actorId===actorId&&!['resolved','declined'].includes(x.status))||null}
function latestArc(state,actorId){return state.arcs.filter(x=>x.actorId===actorId).slice(-1)[0]||null}
function templateFor(actorId,agendaBeat,state,turn){
 const rows=Object.entries(TEMPLATES).filter(([,t])=>t.actorId===actorId);if(!rows.length)return null;
 const existing=new Set(state.arcs.filter(x=>x.actorId===actorId).map(x=>x.templateId));
 const matches=rows.filter(([id,t])=>!existing.has(id)&&(!agendaBeat||t.triggers.includes(agendaBeat.kind)));
 const pool=matches.length?matches:rows.filter(([id])=>!existing.has(id));
 if(!pool.length)return null;
 return pool[hash(actorId+'|'+(agendaBeat?.kind||'none')+'|'+turn)%pool.length];
}
function spawnArc(data,state,actorId,agendaBeat,turn){
 const selected=templateFor(actorId,agendaBeat,state,turn);if(!selected)return null;
 const [templateId,t]=selected,arc={id:nextId(state,'arc'),templateId,actorId,title:t.title,theme:t.theme,status:'developing',stage:0,stageName:STAGES[0],progress:0,pressure:0,playerResponses:0,createdTurn:turn,lastTurn:turn,lastAgendaId:agendaBeat?.id||null,threadIds:[],secretIds:[],favorIds:[],history:[]};
 state.arcs.push(arc);state.arcs=state.arcs.slice(-16);
 const beat={id:nextId(state,'arcbeat'),turn,arcId:arc.id,actorId,kind:'arc_seed',attention:4,summary:t.seed};state.beats.unshift(beat);state.beats=state.beats.slice(0,40);arc.history.unshift(beat.id);
 createThread(data,state,arc,'side_objective',0,turn);
 return arc;
}
function threadPrompt(template,type,stage){
 if(type==='side_objective')return template.seed+' Deadlock can follow it now or let it develop in the background.';
 if(type==='secret')return template.secretHint;
 if(type==='favor')return template.favor;
 if(type==='decision')return template.decision;
 return template.theme;
}
function createThread(data,state,arc,type,stage,turn,extra={}){
 const existing=state.threads.find(x=>x.arcId===arc.id&&x.stage===stage&&x.type===type&&!['resolved','declined'].includes(x.status));if(existing)return existing;
 const t=TEMPLATES[arc.templateId],thread={id:nextId(state,'thread'),arcId:arc.id,actorId:arc.actorId,type,stage,status:'offered',attention:type==='decision'?8:type==='favor'?7:type==='secret'?6:5,prompt:threadPrompt(t,type,stage),createdTurn:turn,lastTurn:turn,attempts:0,...extra};
 state.threads.unshift(thread);state.threads=state.threads.slice(0,40);arc.threadIds.push(thread.id);
 if(type==='secret'){
  const secret={id:nextId(state,'secret'),arcId:arc.id,actorId:arc.actorId,status:'hidden',hint:t.secretHint,reveal:t.secretReveal,createdTurn:turn,revealedTurn:null};state.secrets.push(secret);state.secrets=state.secrets.slice(-24);arc.secretIds.push(secret.id);thread.secretId=secret.id;
 }
 if(type==='favor'){
  const favor={id:nextId(state,'favor'),arcId:arc.id,actorId:arc.actorId,status:'requested',request:t.favor,createdTurn:turn,resolvedTurn:null};state.favors.push(favor);state.favors=state.favors.slice(-24);arc.favorIds.push(favor.id);thread.favorId=favor.id;
 }
 return thread;
}
function stageFor(progress){if(progress>=60)return 4;if(progress>=42)return 3;if(progress>=26)return 2;if(progress>=12)return 1;return 0}
function advanceArcStage(data,state,arc,turn){
 const next=stageFor(arc.progress);if(next<=arc.stage)return null;
 const old=arc.stage;arc.stage=next;arc.stageName=STAGES[next];arc.lastTurn=turn;
 const template=TEMPLATES[arc.templateId],kind=next===1?'secret':next===2?'favor':next>=3?'decision':'side_objective';
 const thread=createThread(data,state,arc,kind,next,turn);
 const summary=next===1?template.secretHint:next===2?template.favor:next>=3?template.decision:template.theme;
 const beat={id:nextId(state,'arcbeat'),turn,arcId:arc.id,actorId:arc.actorId,kind:'stage_'+next,attention:thread.attention,summary};state.beats.unshift(beat);state.beats=state.beats.slice(0,40);arc.history.unshift(beat.id);arc.history=arc.history.slice(0,20);
 if(next>=3)arc.status='awaiting_player';
 return{from:old,to:next,thread,beat};
}
function relationState(edge){
 if(!edge)return'neutral';
 if(Number(edge.tension||0)>=18&&Number(edge.score||0)<=-4)return'grudge';
 if(Number(edge.score||0)>=12&&Number(edge.tension||0)<=7)return'alliance';
 if(Number(edge.tension||0)>=10)return'strain';
 if(Number(edge.score||0)>=7&&Number(edge.tension||0)<=8)return'trust';
 return'neutral';
}
function relationshipTitle(edge,state){
 const a=ACTOR_NAMES[edge.a]||edge.a,b=ACTOR_NAMES[edge.b]||edge.b;
 if(state==='grudge')return a+' & '+b+': Open Grudge';
 if(state==='strain')return a+' & '+b+': Fault Line';
 if(state==='alliance')return a+' & '+b+': Working Alliance';
 if(state==='trust')return a+' & '+b+': Working Trust';
 return a+' & '+b;
}
function relationshipPrompt(edge,state){
 const a=ACTOR_NAMES[edge.a]||edge.a,b=ACTOR_NAMES[edge.b]||edge.b;
 if(state==='grudge')return a+' and '+b+' are no longer treating their disagreement as temporary. Deadlock can hear both sides before the grudge starts shaping future operations.';
 if(state==='strain')return 'Tension between '+a+' and '+b+' is becoming operationally relevant. Deadlock can mediate it, exploit it for competing perspectives, or leave them to work it out.';
 if(state==='alliance')return a+' and '+b+' have developed a reliable working rhythm. Deadlock can ask them to test that partnership on a bounded side problem without giving away command authority.';
 if(state==='trust')return a+' and '+b+' are starting to trust each other’s judgment. That trust can be examined before it quietly becomes an assumption.';
 return null;
}
function evaluateRelationships(data,state,turn){
 const A=root.DeadlockNpcAgendas;if(!A)return[];
 const agendaState=A.ensure(data),changes=[];
 for(const edge of Object.values(agendaState.relations||{})){
  const next=relationState(edge),key=edge.key,cur=state.relationshipArcs[key]||{key,a:edge.a,b:edge.b,state:'neutral',title:relationshipTitle(edge,'neutral'),sinceTurn:turn,lastTurn:turn,history:[],threadId:null};
  if(next!==cur.state){
   const prev=cur.state;cur.state=next;cur.title=relationshipTitle(edge,next);cur.sinceTurn=turn;cur.lastTurn=turn;cur.history.unshift({turn,from:prev,to:next,score:edge.score,tension:edge.tension});cur.history=cur.history.slice(0,16);
   if(next!=='neutral'){
    const thread={id:nextId(state,'relthread'),arcId:null,relationshipKey:key,actorId:edge.a,targetId:edge.b,type:'relationship',stage:0,status:'offered',attention:next==='grudge'?9:next==='strain'?7:6,prompt:relationshipPrompt(edge,next),createdTurn:turn,lastTurn:turn,attempts:0};
    state.threads.unshift(thread);state.threads=state.threads.slice(0,40);cur.threadId=thread.id;
    const beat={id:nextId(state,'arcbeat'),turn,relationshipKey:key,actorId:edge.a,targetId:edge.b,kind:'relationship_'+next,attention:thread.attention,summary:thread.prompt};state.beats.unshift(beat);state.beats=state.beats.slice(0,40);changes.push({relationship:cur,thread,beat});
   }
  }
  state.relationshipArcs[key]=cur;
 }
 return changes;
}
function advance(data,ctx={},opts={}){
 const state=ensure(data),turn=Number(data.story?.director?.turn||0),A=root.DeadlockNpcAgendas;
 if(!opts.force&&turn===state.lastAdvanceTurn)return null;
 if(!A){state.lastAdvanceTurn=turn;return null}
 const agenda=A.recent(data,1)?.[0]||null,actorId=opts.actorId||agenda?.actorId||null;let arc=actorId?activeArc(state,actorId):null;
 if(actorId&&!arc){
  const prev=latestArc(state,actorId),cooldown=prev&&['resolved','declined'].includes(prev.status)?turn-Number(prev.resolvedTurn||prev.lastTurn||0):99;
  if(!prev||cooldown>=12)arc=spawnArc(data,state,actorId,agenda,turn);
 }
 let stageChange=null;
 if(arc){
  const relevant=agenda&&agenda.actorId===arc.actorId&&TEMPLATES[arc.templateId].triggers.includes(agenda.kind);
  arc.progress=clamp(arc.progress+(relevant?3:agenda&&agenda.actorId===arc.actorId?1:0),0,100);
  arc.pressure=clamp(arc.pressure+(agenda?.attention>=7&&agenda.actorId===arc.actorId?2:-1),0,100);
  arc.lastTurn=turn;arc.lastAgendaId=agenda?.actorId===arc.actorId?agenda.id:arc.lastAgendaId;stageChange=advanceArcStage(data,state,arc,turn);
 }
 const relationChanges=evaluateRelationships(data,state,turn);state.lastAdvanceTurn=turn;
 return{turn,arc,stageChange,relationChanges};
}
function candidate(data,opts={}){
 const state=ensure(data),actorId=opts.actorId||null;
 const rows=state.threads.filter(x=>!['resolved','declined'].includes(x.status)&&(actorId?(x.actorId===actorId||x.targetId===actorId):true));
 const priority={decision:5,relationship:4,favor:3,secret:2,side_objective:1};
 rows.sort((a,b)=>(Number(b.attention||0)-Number(a.attention||0))||((priority[b.type]||0)-(priority[a.type]||0))||(Number(b.createdTurn||0)-Number(a.createdTurn||0)));
 return rows[0]||null;
}
function secretForThread(state,thread){return thread?.secretId?state.secrets.find(x=>x.id===thread.secretId)||null:null}
function favorForThread(state,thread){return thread?.favorId?state.favors.find(x=>x.id===thread.favorId)||null:null}
function respond(data,choice={},result={}){
 const state=ensure(data),thread=state.threads.find(x=>x.id===choice.arcThreadId||x.id===choice.threadId);if(!thread)return null;
 const turn=Number(data.story?.director?.turn||0),success=result.success!==false,arc=thread.arcId?state.arcs.find(x=>x.id===thread.arcId):null;thread.attempts=Number(thread.attempts||0)+1;thread.lastTurn=turn;
 const action=String(choice.actionType||'');
 if(action==='arc_decline'){
  thread.status='declined';if(arc){arc.pressure=clamp(arc.pressure+4,0,100);arc.playerResponses++;}return{thread,arc,outcome:'declined'};
 }
 if(thread.type==='secret'){
  const secret=secretForThread(state,thread);
  if(success||thread.attempts>=2){if(secret){secret.status='revealed';secret.revealedTurn=turn}thread.status='resolved';if(arc){arc.progress=clamp(arc.progress+7,0,100);arc.playerResponses++;advanceArcStage(data,state,arc,turn)}return{thread,arc,secret,outcome:'revealed'}}
  thread.status='active';if(arc)arc.progress=clamp(arc.progress+1,0,100);return{thread,arc,secret,outcome:'unconfirmed'};
 }
 if(thread.type==='favor'){
  const favor=favorForThread(state,thread);
  if(success){thread.status='resolved';if(favor){favor.status='fulfilled';favor.resolvedTurn=turn}if(arc){arc.progress=clamp(arc.progress+9,0,100);arc.playerResponses++;advanceArcStage(data,state,arc,turn)}return{thread,arc,favor,outcome:'fulfilled'}}
  thread.status='active';if(favor)favor.status='attempted';if(arc)arc.pressure=clamp(arc.pressure+2,0,100);return{thread,arc,favor,outcome:'complicated'};
 }
 if(thread.type==='relationship'){
  thread.status=success?'resolved':'active';return{thread,outcome:success?'mediated':'unsettled'};
 }
 if(thread.type==='decision'){
  if(action==='arc_commit'||success){thread.status='resolved';if(arc){arc.status='resolved';arc.stage=5;arc.stageName='resolved';arc.resolvedTurn=turn;arc.playerResponses++;arc.progress=100}return{thread,arc,outcome:'resolved'}}
  thread.status='active';return{thread,arc,outcome:'deferred'};
 }
 if(success){thread.status='resolved';if(arc){arc.progress=clamp(arc.progress+6,0,100);arc.playerResponses++;advanceArcStage(data,state,arc,turn)}return{thread,arc,outcome:'advanced'}}
 thread.status='active';if(arc)arc.progress=clamp(arc.progress+1,0,100);return{thread,arc,outcome:'complicated'};
}
function arc(data,id){return ensure(data).arcs.find(x=>x.id===id)||null}
function recentBeats(data,limit=6){return ensure(data).beats.slice(0,Math.max(0,limit))}
function visibleSecrets(data){return ensure(data).secrets.filter(x=>x.status==='revealed')}
function unresolvedFavors(data){return ensure(data).favors.filter(x=>!['fulfilled','declined'].includes(x.status))}
function summary(data){
 const s=ensure(data);return{version:s.version,arcs:s.arcs.length,activeArcs:s.arcs.filter(x=>!['resolved','declined'].includes(x.status)).length,resolvedArcs:s.arcs.filter(x=>x.status==='resolved').length,threads:s.threads.length,openThreads:s.threads.filter(x=>!['resolved','declined'].includes(x.status)).length,revealedSecrets:visibleSecrets(data).length,openFavors:unresolvedFavors(data).length,relationshipStates:Object.values(s.relationshipArcs).map(x=>({key:x.key,state:x.state,title:x.title}))};
}
root.DeadlockNpcArcs={schema:SCHEMA,version:VERSION,stages:STAGES,templates:TEMPLATES,ensure,advance,candidate,respond,arc,recentBeats,visibleSecrets,unresolvedFavors,summary,_test:{hash,rng,stageFor,relationState,relationshipTitle,relationshipPrompt,templateFor,spawnArc,advanceArcStage,evaluateRelationships}};
})(typeof window!=='undefined'?window:globalThis);
