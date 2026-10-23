/* Deadlock Phase 3 — Social Intelligence component v1 */
(function(root){'use strict';
const VERSION='1.0.0';
function name(data,id){return (data.story?.npcs||[]).find(x=>x.id===id)?.name||(data.contacts||[]).find(x=>x.id===id)?.name||id}
function ensure(data){data.story=data.story||{};let s=data.story.socialIntel;if(!s)s=data.story.socialIntel={version:VERSION,selectedNpc:null,relations:{}};s.version=VERSION;s.relations=s.relations||{};return s}
function relation(data,a,b){const s=ensure(data),key=[a,b].sort().join('|');return s.relations[key]||null}
function setRelation(data,a,b,patch={}){if(!a||!b||a===b)return null;const s=ensure(data),key=[a,b].sort().join('|'),old=s.relations[key]||{a,b,trust:50,respect:50,tension:0,status:'unknown',known:false};s.relations[key]={...old,...patch,a:old.a||a,b:old.b||b};return s.relations[key]}
function knownRelations(data,npcId){return Object.values(ensure(data).relations).filter(x=>x.known&&(x.a===npcId||x.b===npcId))}
function model(data,npcId){
 const K=root.DeadlockSocialKnowledge,n=K?.npcState?.(data,npcId)||{traits:{}},facts=K?.recent?.(data,npcId,8)||[],rels=knownRelations(data,npcId);
 return{id:npcId,name:name(data,npcId),traits:n.traits||{},facts:facts.map(x=>({summary:x.fact.summary,provenance:x.knowledge.provenance,confidence:x.knowledge.confidence,tone:x.fact.tone})),relations:rels.map(x=>({other:x.a===npcId?x.b:x.a,otherName:name(data,x.a===npcId?x.b:x.a),trust:x.trust,respect:x.respect,tension:x.tension,status:x.status}))};
}
function seedKnown(data){
 const ids=(data.story?.npcs||[]).map(x=>x.id);if(ids.length<2)return;
 const pairs=[['dren','jessa','professional'],['dren','nera','guarded'],['jessa','krail','trusted'],['nera','renn','uncertain']];
 for(const [a,b,status] of pairs)if(ids.includes(a)&&ids.includes(b)&&!relation(data,a,b))setRelation(data,a,b,{status,known:true,trust:status==='trusted'?68:status==='guarded'?42:52,respect:status==='professional'?62:55,tension:status==='guarded'?28:8});
}
function render(data,npcId){
 seedKnown(data);const m=model(data,npcId),t=m.traits||{},pct=n=>Math.round(Number(n||0)),fact=m.facts.length?m.facts.map(f=>'<div class="social-intel-fact"><b>'+String(f.provenance).replaceAll('_',' ').toUpperCase()+'</b><span>'+Math.round(f.confidence*100)+'% confidence</span><p>'+f.summary+'</p></div>').join(''):'<p class="small muted">No attributable knowledge has reached this contact yet.</p>';
 const rel=m.relations.length?m.relations.map(r=>'<div class="social-intel-relation"><b>'+r.otherName+'</b><span>'+String(r.status).toUpperCase()+'</span><small>Trust '+pct(r.trust)+' · Respect '+pct(r.respect)+' · Tension '+pct(r.tension)+'</small></div>').join(''):'<p class="small muted">No interpersonal relationship is known to Deadlock yet.</p>';
 return '<section class="social-intel"><div class="social-intel-head"><div><span class="micro">BLACKGLASS SOCIAL INTELLIGENCE</span><h3>'+m.name+'</h3></div><span class="pill cyan">KNOWLEDGE-GATED</span></div><div class="social-intel-traits"><span>TRUST <b>'+pct(t.trust)+'</b></span><span>RESPECT <b>'+pct(t.respect)+'</b></span><span>FEAR <b>'+pct(t.fear)+'</b></span><span>SUSPICION <b>'+pct(t.suspicion)+'</b></span><span>FAVOR <b>'+pct(t.favor)+'</b></span><span>GRUDGE <b>'+pct(t.grudge)+'</b></span></div><div class="social-intel-grid"><div><h4>What They Know</h4>'+fact+'</div><div><h4>Known Relationships</h4>'+rel+'</div></div></section>';
}
root.DeadlockSocialIntel={version:VERSION,ensure,model,relation,setRelation,knownRelations,seedKnown,render};
})(typeof window!=='undefined'?window:globalThis);