/* Deadlock Phase 3 — Autonomous NPC Social Simulation v1 */
(function(root){'use strict';
const VERSION='1.0.0',SCHEMA='deadlock.social-sim.v1',clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number(n)||0));
const hash=s=>String(s).split('').reduce((a,c)=>((a*33)^c.charCodeAt(0))>>>0,5381),pick=(arr,seed)=>arr[seed%arr.length];
function ensure(data){data.story=data.story||{};let s=data.story.socialSimulation;if(!s||s.schema!==SCHEMA)s=data.story.socialSimulation={schema:SCHEMA,version:VERSION,lastTurn:-1,sequence:0,privateEvents:[],discoveries:[]};s.version=VERSION;s.privateEvents=Array.isArray(s.privateEvents)?s.privateEvents:[];s.discoveries=Array.isArray(s.discoveries)?s.discoveries:[];return s}
function people(data){const seen=new Set();return [...(data.story?.npcs||[]),...(data.contacts||[])].filter(x=>x?.id&&!seen.has(x.id)&&seen.add(x.id))}
function status(r){if(r.tension>=70)return'hostile';if(r.grudge>=55)return'grudge';if(r.trust>=75&&r.respect>=65)return'loyal';if(r.trust>=65)return'allied';if(r.respect>=70)return'respectful';if(r.tension>=45)return'strained';if(r.trust<=35)return'distrustful';return'professional'}
const TEMPLATES=[
 {kind:'favor',tone:'good',dt:7,dr:4,dx:-3,summary:(a,b)=>a+' quietly helps '+b+' solve a problem before it becomes public.'},
 {kind:'cooperation',tone:'good',dt:5,dr:7,dx:-4,summary:(a,b)=>a+' and '+b+' coordinate effectively on an Apex matter.'},
 {kind:'defense',tone:'good',dt:4,dr:8,dx:-2,summary:(a,b)=>a+' backs '+b+' during a tense internal discussion.'},
 {kind:'dispute',tone:'friction',dt:-5,dr:-2,dx:10,summary:(a,b)=>a+' and '+b+' clash over how a situation should be handled.'},
 {kind:'suspicion',tone:'friction',dt:-7,dr:0,dx:8,summary:(a,b)=>a+' begins questioning '+b+"'s motives after an inconsistency."},
 {kind:'rivalry',tone:'friction',dt:-3,dr:4,dx:12,summary:(a,b)=>a+' and '+b+' develop a competitive edge that is becoming personal.'},
 {kind:'confidence',tone:'private',dt:8,dr:3,dx:-5,summary:(a,b)=>a+' trusts '+b+' with information not shared with the rest of the room.'},
 {kind:'debt',tone:'private',dt:6,dr:6,dx:-2,summary:(a,b)=>a+' now owes '+b+' a meaningful personal favor.'}
];
function step(data,opts={}){
 const s=ensure(data),turn=Number(data.story?.director?.turn||0),P=people(data),I=root.DeadlockSocialIntel,K=root.DeadlockSocialKnowledge;if(!I||P.length<2||(!opts.force&&turn<=s.lastTurn))return null;s.lastTurn=turn;
 const seed=hash(turn+'|'+P.map(x=>x.id).join('|')+'|'+s.sequence),a=P[seed%P.length],others=P.filter(x=>x.id!==a.id),b=others[(seed>>>4)%others.length],old=I.relation(data,a.id,b.id)||{a:a.id,b:b.id,trust:50,respect:50,tension:10,status:'professional',known:false,grudge:0};
 const weighted=TEMPLATES.filter(t=>old.tension>55?t.tone!=='private':old.trust>65?t.kind!=='suspicion':true),t=pick(weighted,seed>>>7),event={id:'social-'+(++s.sequence).toString(36),turn,a:a.id,b:b.id,kind:t.kind,tone:t.tone,summary:t.summary(a.name||a.id,b.name||b.id),discovered:false};
 const grudge=clamp(Number(old.grudge||0)+(t.tone==='friction'?Math.max(1,t.dx/4):-2)),next=I.setRelation(data,a.id,b.id,{trust:clamp(old.trust+t.dt),respect:clamp(old.respect+t.dr),tension:clamp(old.tension+t.dx),grudge,known:!!old.known});next.status=status(next);event.after={trust:next.trust,respect:next.respect,tension:next.tension,grudge,status:next.status};s.privateEvents.unshift(event);s.privateEvents=s.privateEvents.slice(0,80);
 // Discovery is deterministic and knowledge-gated. Existing known ties are easier to update; otherwise only some events leak.
 const leak=((seed>>>12)%100),threshold=old.known?58:(t.kind==='dispute'||t.kind==='defense'?28:14);if(leak<threshold)discover(data,event,{source:old.known?'ongoing_intel':'apex_report',confidence:old.known?.82:.62});
 return event;
}
function discover(data,event,meta={}){
 const s=ensure(data),I=root.DeadlockSocialIntel,K=root.DeadlockSocialKnowledge;if(!event||event.discovered)return null;event.discovered=true;event.discoveredTurn=Number(data.story?.director?.turn||0);event.discoverySource=meta.source||'rumor';event.confidence=Number(meta.confidence||.55);const r=I.relation(data,event.a,event.b);if(r)r.known=true;s.discoveries.unshift({eventId:event.id,turn:event.discoveredTurn,source:event.discoverySource,confidence:event.confidence});s.discoveries=s.discoveries.slice(0,50);
 const f=K?.record?.(data,{id:'social-intel-'+event.id,kind:'npc_relationship',summary:event.summary,tone:event.tone==='friction'?'danger':'neutral',publicity:0,channels:[],subject:event.a,source:'social_intelligence'});if(f){K.learn(data,event.a,f.id,'direct_report',event.confidence);K.learn(data,event.b,f.id,'direct_report',event.confidence)}
 return event;
}
function investigate(data,a,b){
 const s=ensure(data),candidates=s.privateEvents.filter(e=>!e.discovered&&((e.a===a&&e.b===b)||(e.a===b&&e.b===a)));if(!candidates.length)return{ok:false,message:'No new relationship intelligence surfaced.'};const e=candidates[0];discover(data,e,{source:'blackglass_investigation',confidence:.9});return{ok:true,event:e,message:e.summary};
}
function visibleHistory(data,a,b,limit=6){return ensure(data).privateEvents.filter(e=>e.discovered&&(!a||((e.a===a&&e.b===b)||(e.a===b&&e.b===a)))).slice(0,limit)}
function recentPrivate(data,limit=10){return ensure(data).privateEvents.slice(0,limit)}
root.DeadlockSocialSimulation={version:VERSION,schema:SCHEMA,ensure,step,discover,investigate,visibleHistory,recentPrivate};
})(typeof window!=='undefined'?window:globalThis);