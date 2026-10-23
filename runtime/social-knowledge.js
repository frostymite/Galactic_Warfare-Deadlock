/* Deadlock Phase 3 — Social Knowledge & Reputation Propagation v1
 * NPC knowledge has provenance: witness, direct report, or rumor.
 */
(function(root){'use strict';
const VERSION='1.0.0',SCHEMA='deadlock.social-knowledge.v1';
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number(n)||0));
function ensure(data){data.story=data.story||{};let s=data.story.socialKnowledge;if(!s||s.schema!==SCHEMA)s=data.story.socialKnowledge={schema:SCHEMA,version:VERSION,sequence:0,facts:[],npc:{},rumors:[]};s.version=VERSION;s.facts=Array.isArray(s.facts)?s.facts:[];s.rumors=Array.isArray(s.rumors)?s.rumors:[];s.npc=s.npc||{};return s}
function npcState(data,id){const s=ensure(data);return s.npc[id]||(s.npc[id]={known:{},traits:{trust:50,respect:50,fear:0,suspicion:0,favor:0,grudge:0},lastReactionTurn:-1})}
function sourceWeight(kind){return kind==='witness'?1:kind==='direct_report'?.82:kind==='credible_report'?.66:.42}
function record(data,event={}){
 const s=ensure(data),id=event.id||'fact-'+(++s.sequence).toString(36),turn=Number(data.story?.director?.turn||0);
 let f=s.facts.find(x=>x.id===id);if(!f){f={id,turn,kind:event.kind||'encounter',summary:String(event.summary||'Deadlock changed the situation.'),tone:event.tone||'neutral',publicity:clamp(event.publicity??20),channels:[...(event.channels||[])],subject:event.subject||'rovan',source:event.source||null};s.facts.unshift(f);s.facts=s.facts.slice(0,100)}
 for(const npcId of event.witnesses||[])learn(data,npcId,id,'witness',1);
 for(const npcId of event.reportedTo||[])learn(data,npcId,id,'direct_report',.82);
 return f;
}
function learn(data,npcId,factId,provenance='rumor',confidence=.45){
 if(!npcId)return null;const s=ensure(data),f=s.facts.find(x=>x.id===factId);if(!f)return null;const n=npcState(data,npcId),old=n.known[factId];
 const row={factId,provenance,confidence:Math.max(Number(old?.confidence||0),clamp(confidence,0,1)),learnedTurn:Number(data.story?.director?.turn||0),reacted:!!old?.reacted};
 n.known[factId]=row;return row;
}
function reactionDelta(fact,known){
 const w=sourceWeight(known.provenance)*Number(known.confidence||.5),good=['good','success','honorable','controlled'].includes(fact.tone),bad=['danger','failure','brutal','betrayal'].includes(fact.tone);
 const d={trust:0,respect:0,fear:0,suspicion:0,favor:0,grudge:0};
 if(good){d.respect=3*w;d.trust=2*w}else if(bad){d.fear=2*w;d.suspicion=3*w;d.grudge=1*w}else d.respect=1*w;
 if(/apex/i.test(fact.source||''))d.respect+=2*w;
 if(/weapon|intimid/i.test(fact.source||'')){d.fear+=3*w;d.trust-=1*w}
 if(/deception|lie/i.test(fact.source||'')){d.suspicion+=3*w;d.trust-=2*w}
 return d;
}
function react(data,npcId,apply=null){
 const s=ensure(data),n=npcState(data,npcId),out=[];
 for(const k of Object.values(n.known)){if(k.reacted)continue;const f=s.facts.find(x=>x.id===k.factId);if(!f)continue;const d=reactionDelta(f,k);for(const [key,val] of Object.entries(d))n.traits[key]=clamp(Number(n.traits[key]||0)+val);k.reacted=true;n.lastReactionTurn=Number(data.story?.director?.turn||0);out.push({fact:f,knowledge:k,delta:d});if(typeof apply==='function')apply(npcId,f,k,d)}
 return out;
}
function propagate(data,opts={}){
 const s=ensure(data),turn=Number(data.story?.director?.turn||0),ids=(opts.npcIds||[]).filter(Boolean),spread=[];
 for(const f of s.facts){const age=Math.max(0,turn-Number(f.turn||0));if(age<1||Number(f.publicity||0)<=0)continue;
  for(const id of ids){const n=npcState(data,id);if(n.known[f.id])continue;const channelMatch=(f.channels||[]).some(c=>String(id).includes(c)||String(c).includes('underworld')||String(c).includes('apex'));const chance=Math.min(.85,(Number(f.publicity||0)/100)*(channelMatch?.9:.35)*(1+Math.min(age,5)*.08));const seed=((f.id+id+turn).split('').reduce((a,c)=>((a*33)^c.charCodeAt(0))>>>0,5381)%1000)/1000;if(seed<chance){learn(data,id,f.id,channelMatch?'credible_report':'rumor',channelMatch?.68:.42);spread.push({npcId:id,factId:f.id})}}
 }
 return spread;
}
function knows(data,npcId,factId){return npcState(data,npcId).known[factId]||null}
function recent(data,npcId,limit=5){const s=ensure(data),n=npcState(data,npcId);return Object.values(n.known).sort((a,b)=>b.learnedTurn-a.learnedTurn).slice(0,limit).map(k=>({knowledge:k,fact:s.facts.find(x=>x.id===k.factId)})).filter(x=>x.fact)}
root.DeadlockSocialKnowledge={version:VERSION,schema:SCHEMA,ensure,record,learn,react,propagate,knows,recent,npcState};
})(typeof window!=='undefined'?window:globalThis);
