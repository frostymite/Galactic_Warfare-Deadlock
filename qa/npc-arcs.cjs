const fs=require('fs'),vm=require('vm'),path=require('path');
let checks=0,fail=[];const ok=(name,v,detail)=>{checks++;if(!v)fail.push({name,detail})};
const box={console};box.window=box;box.globalThis=box;vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../runtime/npc-agendas.js'),'utf8'),box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../runtime/npc-arcs.js'),'utf8'),box);
const A=box.DeadlockNpcAgendas,X=box.DeadlockNpcArcs;
ok('arc engine exposed',!!X);ok('arc schema',X.schema==='deadlock.npc-arcs.v1');ok('arc version',X.version==='1.0.0');
const make=()=>({created:'arc-qa',character:{credits:358400},apex:{reserve:1420000},ship:{owner:'rovan'},contracts:[{id:'marr',title:'Marr Recovery',status:'Active',progress:35,reward:70000}],story:{director:{turn:1},danger:84,location:'Blackglass Station — Hangar',proceduralLeads:[{id:'lead1',summary:'A sealed arrival used a private lane',status:'active',contractId:'marr'}]},livingWorld:{rumors:[{id:'r1',summary:'A crate changed hands after lights-out',status:'heard',tick:9}]}});
const data=make(),ctx={contract:data.contracts[0],location:data.story.location,danger:84,weakestSystem:{id:'engines',name:'Engines',condition:52}};
const protectedBefore=JSON.stringify({credits:data.character.credits,reserve:data.apex.reserve,contract:data.contracts[0],owner:data.ship.owner});
for(let t=1;t<=140;t++){data.story.director.turn=t;A.advance(data,ctx,{force:true});X.advance(data,ctx,{force:true})}
const state=X.ensure(data),sum=X.summary(data);
ok('four personal arcs spawned',new Set(state.arcs.map(x=>x.actorId)).size===4,state.arcs);
ok('arcs came from agenda history',state.arcs.every(x=>!!x.lastAgendaId),state.arcs);
ok('secret threads generated',state.secrets.length>=4,state.secrets);
ok('secrets remain hidden without player action',state.secrets.every(x=>x.status==='hidden'),state.secrets);
ok('favor threads generated',state.favors.length>=4,state.favors);
ok('decision threads generated',state.threads.some(x=>x.type==='decision'),state.threads.filter(x=>x.type==='decision'));
ok('turning points await player',state.arcs.every(x=>x.status==='awaiting_player'),state.arcs);
ok('background progress freezes at turning point',state.arcs.every(x=>x.progress<60),state.arcs.map(x=>({id:x.id,progress:x.progress,stage:x.stage,status:x.status})));
ok('only one open decision per arc',state.arcs.every(a=>state.threads.filter(t=>t.arcId===a.id&&t.type==='decision'&&!['resolved','declined'].includes(t.status)).length<=1));
ok('relationship trust/strain can emerge naturally',sum.relationshipStates.some(x=>x.state!=='neutral'),sum.relationshipStates);
const grudgeData=make(),grudgeCtx={...ctx,contract:grudgeData.contracts[0]},grudgeAgenda=A.ensure(grudgeData);
for(let t=1;t<=6;t++){grudgeData.story.director.turn=t;A._test.applyRelation(grudgeAgenda,'dren','nera','friction',t,'qa-friction-'+t,'Repeated proof-vs-instinct friction.');X.advance(grudgeData,grudgeCtx,{force:true})}
ok('repeated Dren Nera friction creates grudge',X.summary(grudgeData).relationshipStates.some(x=>x.key==='dren|nera'&&x.state==='grudge'),{edge:A.relation(grudgeData,'dren','nera'),arcs:X.summary(grudgeData).relationshipStates});
const allianceData=make(),allianceCtx={...ctx,contract:allianceData.contracts[0]},allianceAgenda=A.ensure(allianceData);
for(let t=1;t<=6;t++){allianceData.story.director.turn=t;A._test.applyRelation(allianceAgenda,'dren','renn','cooperative',t,'qa-coop-'+t,'Repeated field cooperation.');X.advance(allianceData,allianceCtx,{force:true})}
ok('repeated Renn Dren cooperation creates alliance',X.summary(allianceData).relationshipStates.some(x=>x.key==='dren|renn'&&x.state==='alliance'),{edge:A.relation(allianceData,'dren','renn'),arcs:X.summary(allianceData).relationshipStates});
const protectedAfterBackground=JSON.stringify({credits:data.character.credits,reserve:data.apex.reserve,contract:data.contracts[0],owner:data.ship.owner});
ok('background arcs preserve protected state',protectedAfterBackground===protectedBefore,{protectedBefore,protectedAfterBackground});
const secretThread=state.threads.find(x=>x.type==='secret'&&x.status==='offered'),secret=state.secrets.find(x=>x.id===secretThread.secretId);
data.story.director.turn=141;const sr=X.respond(data,{arcThreadId:secretThread.id,actionType:'arc_secret_probe'},{success:true});
ok('player can reveal secret',sr?.outcome==='revealed'&&secret.status==='revealed',sr);
ok('revealed secret becomes visible',X.visibleSecrets(data).some(x=>x.id===secret.id));
const favorThread=state.threads.find(x=>x.type==='favor'&&x.status==='offered'),favor=state.favors.find(x=>x.id===favorThread.favorId);
data.story.director.turn=142;const fr=X.respond(data,{arcThreadId:favorThread.id,actionType:'arc_favor'},{success:true});
ok('player can fulfill favor',fr?.outcome==='fulfilled'&&favor.status==='fulfilled',fr);
const relationThread=state.threads.find(x=>x.type==='relationship'&&x.status==='offered');
data.story.director.turn=143;const rr=X.respond(data,{arcThreadId:relationThread.id,actionType:'arc_relationship'},{success:true});
ok('player can resolve relationship thread',rr?.outcome==='mediated'&&relationThread.status==='resolved',rr);
const decision=state.threads.find(x=>x.type==='decision'&&x.status==='offered'),decisionArc=state.arcs.find(x=>x.id===decision.arcId);
data.story.director.turn=144;const dr=X.respond(data,{arcThreadId:decision.id,actionType:'arc_commit'},{success:true});
ok('player can resolve personal arc',dr?.outcome==='resolved'&&decisionArc.status==='resolved'&&decisionArc.progress===100,dr);
ok('resolving arc closes sibling threads',state.threads.filter(x=>x.arcId===decisionArc.id).every(x=>['resolved','declined'].includes(x.status)),state.threads.filter(x=>x.arcId===decisionArc.id));
ok('resolving arc closes unfulfilled favors',state.favors.filter(x=>x.arcId===decisionArc.id).every(x=>['fulfilled','declined','closed'].includes(x.status)),state.favors.filter(x=>x.arcId===decisionArc.id));
ok('resolved arc no longer active',!X.summary(data).activeArcs||!state.arcs.filter(x=>x.id===decisionArc.id&&!['resolved','declined'].includes(x.status)).length);
const protectedAfterResponses=JSON.stringify({credits:data.character.credits,reserve:data.apex.reserve,contract:data.contracts[0],owner:data.ship.owner});
ok('player arc responses preserve protected state',protectedAfterResponses===protectedBefore,{protectedBefore,protectedAfterResponses});
const previousCount=state.arcs.filter(x=>x.actorId===decisionArc.actorId).length;
for(let t=145;t<=175;t++){data.story.director.turn=t;A.advance(data,ctx,{force:true});X.advance(data,ctx,{force:true})}
ok('resolved actor can begin later second arc',state.arcs.filter(x=>x.actorId===decisionArc.actorId).length>previousCount,state.arcs.filter(x=>x.actorId===decisionArc.actorId));
const clone1=make(),clone2=make(),sig1=[],sig2=[];
for(let t=1;t<=60;t++){clone1.story.director.turn=t;clone2.story.director.turn=t;A.advance(clone1,{...ctx,contract:clone1.contracts[0]},{force:true});A.advance(clone2,{...ctx,contract:clone2.contracts[0]},{force:true});const x1=X.advance(clone1,{...ctx,contract:clone1.contracts[0]},{force:true}),x2=X.advance(clone2,{...ctx,contract:clone2.contracts[0]},{force:true});sig1.push((x1.arc?.templateId||'-')+'|'+(x1.stageChange?.to||'-')+'|'+(x1.relationChanges?.map(x=>x.relationship.state).join(',')||'-'));sig2.push((x2.arc?.templateId||'-')+'|'+(x2.stageChange?.to||'-')+'|'+(x2.relationChanges?.map(x=>x.relationship.state).join(',')||'-'))}
ok('deterministic arc replay',JSON.stringify(sig1)===JSON.stringify(sig2),{sig1,sig2});
const result={checks,passed:checks-fail.length,failed:fail.length,failures:fail,summary:X.summary(data),actors:[...new Set(state.arcs.map(x=>x.actorId))],relationshipStates:X.summary(data).relationshipStates};
fs.writeFileSync(path.join(__dirname,'npc-arcs-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(fail.length)process.exit(1);
