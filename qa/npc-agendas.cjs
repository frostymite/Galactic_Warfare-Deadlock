const fs=require('fs'),vm=require('vm'),path=require('path');
let checks=0,fail=[];const ok=(name,v,detail)=>{checks++;if(!v)fail.push({name,detail})};
const box={console};box.window=box;box.globalThis=box;vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../runtime/npc-agendas.js'),'utf8'),box);
const A=box.DeadlockNpcAgendas;
ok('agenda engine exposed',!!A);ok('agenda schema',A.schema==='deadlock.npc-agendas.v1');ok('agenda version',A.version==='1.0.0');
const make=()=>({created:'agenda-qa',character:{credits:358400},apex:{reserve:1420000},ship:{id:'raven',owner:'rovan'},contracts:[{id:'marr',title:'Marr Recovery',status:'Active',progress:35,reward:70000}],story:{director:{turn:1},danger:72,location:'Blackglass Station — Hangar',proceduralLeads:[{id:'lead1',summary:'A sealed arrival used a private clearance lane',status:'active',contractId:'marr'}]},livingWorld:{rumors:[{id:'r1',summary:'A mechanic saw an unmarked crate moved after lights-out',status:'heard',tick:12,participantIds:['amb1']}]}}); 
const data=make(),contract=data.contracts[0],ctx={contract,location:data.story.location,danger:82,weakestSystem:{id:'engines',name:'Engines',condition:54}};
const state=A.ensure(data);
ok('four persistent actors',Object.keys(state.actors).length===4,Object.keys(state.actors));ok('six relationship edges',Object.keys(state.relations).length===6,Object.keys(state.relations));
const protectedBefore={credits:data.character.credits,reserve:data.apex.reserve,status:contract.status,progress:contract.progress,reward:contract.reward,shipOwner:data.ship.owner};
const activities=[];
for(let t=1;t<=60;t++){data.story.director.turn=t;const a=A.advance(data,ctx,{force:true});ok('forced activity '+t,!!a&&a.turn===t,a);activities.push(a)}
ok('all actors act',new Set(activities.map(x=>x.actorId)).size===4,[...new Set(activities.map(x=>x.actorId))]);
ok('cross-NPC activity occurs',activities.some(x=>x.targetId),activities.filter(x=>x.targetId).slice(0,3));
ok('cooperation occurs',activities.some(x=>x.tone==='cooperative'));ok('friction occurs',activities.some(x=>x.tone==='friction'));
ok('high-attention activity occurs',activities.some(x=>x.attention>=7),Math.max(...activities.map(x=>x.attention)));
ok('activity history bounded',A.recent(data,100).length<=50,A.recent(data,100).length);
ok('actor history bounded',Object.values(A.ensure(data).actors).every(x=>x.history.length<=20));
ok('relation history bounded',Object.values(A.ensure(data).relations).every(x=>x.history.length<=16));
ok('relation state changes',A.summary(data).relations.some(x=>x.score!==0||x.tension!==0),A.summary(data).relations);
ok('rumor receives agenda reference',data.livingWorld.rumors[0].agendaReferences>0,data.livingWorld.rumors[0]);
ok('lead receives agenda reference',data.story.proceduralLeads[0].agendaReferences>0,data.story.proceduralLeads[0]);
ok('attention helper finds important beat',!!A.attention(data,7),A.attention(data,7));
ok('actor lookup works',A.actor(data,'jessa')?.name==='Jessa');
ok('relation lookup stable',A.relation(data,'dren','nera')?.key==='dren|nera');
const sameTurn=A.advance(data,ctx);ok('same turn does not advance twice',sameTurn===null,sameTurn);
ok('credits untouched',data.character.credits===protectedBefore.credits,[data.character.credits,protectedBefore.credits]);
ok('Apex reserve untouched',data.apex.reserve===protectedBefore.reserve,[data.apex.reserve,protectedBefore.reserve]);
ok('contract status untouched',contract.status===protectedBefore.status,[contract.status,protectedBefore.status]);
ok('contract progress untouched',contract.progress===protectedBefore.progress,[contract.progress,protectedBefore.progress]);
ok('contract reward untouched',contract.reward===protectedBefore.reward,[contract.reward,protectedBefore.reward]);
ok('ship ownership untouched',data.ship.owner===protectedBefore.shipOwner,[data.ship.owner,protectedBefore.shipOwner]);
const natural=make(),naturalRows=[];for(let t=1;t<=120;t++){natural.story.director.turn=t;const a=A.advance(natural,{...ctx,contract:natural.contracts[0]});if(a)naturalRows.push(a)}
ok('natural background activity occurs',naturalRows.length>=30,naturalRows.length);ok('natural engine does not fire every turn',naturalRows.length<120,naturalRows.length);ok('natural activity has actor variety',new Set(naturalRows.map(x=>x.actorId)).size>=3,[...new Set(naturalRows.map(x=>x.actorId))]);
const clone1=make(),clone2=make(),sig1=[],sig2=[];for(let t=1;t<=20;t++){clone1.story.director.turn=t;clone2.story.director.turn=t;const a=A.advance(clone1,{...ctx,contract:clone1.contracts[0]},{force:true}),b=A.advance(clone2,{...ctx,contract:clone2.contracts[0]},{force:true});sig1.push(a.actorId+'|'+a.kind+'|'+a.targetId);sig2.push(b.actorId+'|'+b.kind+'|'+b.targetId)}
ok('deterministic replay',JSON.stringify(sig1)===JSON.stringify(sig2),{sig1,sig2});
const result={checks,passed:checks-fail.length,failed:fail.length,failures:fail,activityCount:A.summary(data).activities,actors:[...new Set(activities.map(x=>x.actorName))],relations:A.summary(data).relations,naturalCount:naturalRows.length};
fs.writeFileSync(path.join(__dirname,'npc-agendas-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(fail.length)process.exit(1);
