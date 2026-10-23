/* Deadlock Phase 3 — Social Intelligence component v1 */
(function(root){'use strict';
const VERSION='1.1.0';
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

function contacts(data){const seen=new Set(),out=[];for(const n of [...(data.story?.npcs||[]),...(data.contacts||[])])if(n?.id&&!seen.has(n.id)){seen.add(n.id);out.push({id:n.id,name:n.name||n.id,role:n.role||n.relationship||'Contact'})}return out}
function evidence(data,a,b){const K=root.DeadlockSocialKnowledge,ka=K?.recent?.(data,a,20)||[],kb=K?.recent?.(data,b,20)||[],shared=[];for(const x of ka){const y=kb.find(z=>z.fact?.id===x.fact?.id);if(y)shared.push({summary:x.fact.summary,sourceA:x.knowledge.provenance,sourceB:y.knowledge.provenance,confidence:Math.round(Math.min(x.knowledge.confidence,y.knowledge.confidence)*100)})}return shared.slice(0,5)}
function board(data){
 seedKnown(data);const s=ensure(data),people=contacts(data);if(!s.selectedNpc||!people.some(x=>x.id===s.selectedNpc))s.selectedNpc=people[0]?.id||null;
 const selected=s.selectedNpc,m=selected?model(data,selected):null,rels=selected?knownRelations(data,selected):[],nodes=people.map((p,i)=>{const active=p.id===selected,known=p.id===selected||knownRelations(data,p.id).length||root.DeadlockSocialKnowledge?.recent?.(data,p.id,1)?.length;return '<button class="intel-node '+(active?'active ':'')+(known?'known':'dim')+'" data-social-npc="'+p.id+'" style="--node-i:'+i+'"><b>'+p.name+'</b><small>'+p.role+'</small></button>'}).join('');
 const edges=rels.map((r,i)=>{const other=r.a===selected?r.b:r.a;return '<button class="intel-edge" data-social-relation="'+selected+'|'+other+'"><span>'+name(data,other)+'</span><b>'+String(r.status||'known').toUpperCase()+'</b><small>T '+Math.round(r.trust)+' · R '+Math.round(r.respect)+' · X '+Math.round(r.tension)+'</small></button>'}).join('')||'<p class="small muted">No known connections from this contact yet.</p>';
 return '<section class="intel-board"><div class="intel-board-head"><div><span class="micro">BLACKGLASS // SOCIAL INTELLIGENCE BOARD</span><h2>Relationship Network</h2></div><span class="pill cyan">ROVAN-KNOWN DATA ONLY</span></div><div class="intel-board-layout"><div class="intel-network"><div class="intel-center"><span>FOCUS</span><b>'+(m?.name||'NO CONTACT')+'</b></div>'+nodes+'</div><div class="intel-board-detail">'+(m?render(data,m.id):'')+'<h4>Connections</h4><div class="intel-edge-list">'+edges+'</div></div></div></section>';
}
function relationEvidence(data,a,b){const r=relation(data,a,b);if(!r||!r.known)return null;return{a,nameA:name(data,a),b,nameB:name(data,b),status:r.status,trust:r.trust,respect:r.respect,tension:r.tension,evidence:evidence(data,a,b)}}

function render(data,npcId){
 seedKnown(data);const m=model(data,npcId),t=m.traits||{},pct=n=>Math.round(Number(n||0)),fact=m.facts.length?m.facts.map(f=>'<div class="social-intel-fact"><b>'+String(f.provenance).replaceAll('_',' ').toUpperCase()+'</b><span>'+Math.round(f.confidence*100)+'% confidence</span><p>'+f.summary+'</p></div>').join(''):'<p class="small muted">No attributable knowledge has reached this contact yet.</p>';
 const rel=m.relations.length?m.relations.map(r=>'<div class="social-intel-relation"><b>'+r.otherName+'</b><span>'+String(r.status).toUpperCase()+'</span><small>Trust '+pct(r.trust)+' · Respect '+pct(r.respect)+' · Tension '+pct(r.tension)+'</small></div>').join(''):'<p class="small muted">No interpersonal relationship is known to Deadlock yet.</p>';
 return '<section class="social-intel"><div class="social-intel-head"><div><span class="micro">BLACKGLASS SOCIAL INTELLIGENCE</span><h3>'+m.name+'</h3></div><span class="pill cyan">KNOWLEDGE-GATED</span></div><div class="social-intel-traits"><span>TRUST <b>'+pct(t.trust)+'</b></span><span>RESPECT <b>'+pct(t.respect)+'</b></span><span>FEAR <b>'+pct(t.fear)+'</b></span><span>SUSPICION <b>'+pct(t.suspicion)+'</b></span><span>FAVOR <b>'+pct(t.favor)+'</b></span><span>GRUDGE <b>'+pct(t.grudge)+'</b></span></div><div class="social-intel-grid"><div><h4>What They Know</h4>'+fact+'</div><div><h4>Known Relationships</h4>'+rel+'</div></div></section>';
}
root.DeadlockSocialIntel={version:VERSION,ensure,model,relation,setRelation,knownRelations,seedKnown,render,board,contacts,relationEvidence};
})(typeof window!=='undefined'?window:globalThis);