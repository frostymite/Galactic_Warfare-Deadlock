const fs=require('fs'),vm=require('vm'),path=require('path');
let checks=0,fail=[];const ok=(name,v)=>{checks++;if(!v)fail.push(name)};
const box={console};box.window=box;box.globalThis=box;vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../runtime/story-director.js'),'utf8'),box);
const D=box.DeadlockStoryDirector;
const data={created:'director-qa',story:{director:{turn:1},location:'Blackglass Station — Hangar',currentNpc:'dren',proceduralLeads:[],consequences:{recent:[{title:'Rival hunter spotted',tone:'danger',contractId:'marr'}]}},livingWorld:{rumors:[
 {id:'r1',summary:'A sealed arrival requested private handling',status:'heard',tick:9,sourcePresetId:'blackglass_hangar',shipId:'ship-a',participantIds:['amb-1']},
 {id:'r2',summary:'A salvage component carries the wrong manufacturer mark',status:'heard',tick:8,sourcePresetId:'blackglass_hangar',participantIds:['amb-2']}
]}};
const ctx={contract:{id:'marr',title:'Marr Recovery',status:'Active',progress:35,targetId:'marr'},stage:{index:2,key:'trail'},target:{name:'Marr'},currentNpc:{id:'dren',name:'Dren Voss'},currentNpcId:'dren',location:data.story.location,weakestSystem:{id:'engines',name:'Engines',condition:88}};
ok('engine exposed',!!D);ok('story director schema',D.schema==='deadlock.story-director.v1');ok('story director version',D.version==='1.0.0');
const menus=[],labels=[];
for(let i=0;i<10;i++){
 data.story.director.turn=i+1;
 const choices=D.missionChoices(data,ctx);menus.push(choices.map(x=>x.label));labels.push(...choices.map(x=>x.label));
 ok('mission menu size '+i,choices.length>=4&&choices.length<=5);
 ok('mission labels unique '+i,new Set(choices.map(x=>x.label)).size===choices.length);
 ok('mission ids unique '+i,new Set(choices.map(x=>x.id)).size===choices.length);
 D.recordChoice(data,choices[0],choices[0].label);
}
ok('mission options rotate broadly',new Set(labels).size>=20);
ok('recent consequence enters menu',labels.some(x=>x.includes('Rival hunter spotted')));
for(let i=1;i<menus.length;i++)ok('adjacent mission menu changes '+i,menus[i].filter(x=>menus[i-1].includes(x)).length<=2);
ok('living rumor appears as story option',labels.some(x=>/arrival|manufacturer|rumor|report/i.test(x)));
const dialogue=[];
for(let i=0;i<8;i++){
 data.story.director.turn=30+i;
 const rows=D.dialogueChoices(data,{npc:{id:'dren',name:'Dren Voss'},analysis:{topic:i%3===0?'trust':'intel',tone:'professional'},contract:ctx.contract,location:data.story.location});
 ok('dialogue menu size '+i,rows.length>=4&&rows.length<=5);dialogue.push(...rows.map(x=>x.label));D.recordChoice(data,rows[0],rows[0].label);
}
ok('dialogue options rotate',new Set(dialogue).size>=14);
const beatGood=D.narrativeBeat(data,{choice:{intent:'investigate',actionType:'crosscheck'},roll:{success:true},contract:ctx.contract,stage:ctx.stage,target:ctx.target,location:data.story.location});
const beatBad=D.narrativeBeat(data,{choice:{intent:'deception',actionType:'bait_network'},roll:{success:false},contract:ctx.contract,stage:ctx.stage,target:ctx.target,location:data.story.location});
ok('procedural narration generated',beatGood.length>30&&beatBad.length>30&&beatGood!==beatBad);
ok('procedural continue beat generated',D.continueBeat(data,ctx).length>25);
const first=D.factOrUpdate(data,'dren',"Marr's trail is still too wide.",'marr'),second=D.factOrUpdate(data,'dren',"Marr's trail is still too wide.",'marr');
ok('first verified fact preserved',first==="Marr's trail is still too wide.");ok('repeat factual reply changes',second!==first);
const lead=D.resolveRumor(data,'r1',{success:true,contractId:'marr'});
ok('rumor becomes active lead',lead?.status==='active'&&lead?.rumorId==='r1');ok('lead keeps ShipForge link',lead?.shipId==='ship-a');ok('lead keeps participant link',lead?.participantIds?.includes('amb-1'));ok('rumor marked promoted',data.livingWorld.rumors.find(x=>x.id==='r1')?.status==='promoted');
const again=D.resolveRumor(data,'r1',{success:true,contractId:'marr'});ok('rumor promotion idempotent',again?.id===lead?.id&&data.story.proceduralLeads.length===1);
ok('promoted rumor no longer raw rumor',!D.activeRumors(data,10).some(x=>x.id==='r1'));
const generic=D.genericChoices(data,ctx);ok('generic menu contextual',generic.length>=4&&generic.some(x=>x.leadId||x.rumorId||x.actionType==='location_intel'));
const sum=D.summary(data);ok('summary remembers shown options',sum.recentPresented>0);ok('summary remembers player branches',sum.branchMemory>0);ok('summary counts procedural leads',sum.leads===1);
const result={checks,passed:checks-fail.length,failed:fail.length,failures:fail,uniqueMissionLabels:new Set(labels).size,uniqueDialogueLabels:new Set(dialogue).size,summary:sum};
fs.writeFileSync(path.join(__dirname,'story-director-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(fail.length)process.exit(1);
