/* Deadlock Phase 3 — Procedural Story Director.
 * Offline choice rotation, dialogue freshness, and rumor -> lead promotion.
 * Durable state is plain JSON for browser/native portability.
 */
(function(root){
'use strict';
const VERSION='1.1.0',SCHEMA='deadlock.story-director.v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
function hash(v){let h=2166136261;for(const c of String(v??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let s=hash(seed)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function pick(a,r){return a&&a.length?a[Math.min(a.length-1,Math.floor(r()*a.length))]:null}
function uid(st,p='storyopt'){st.sequence=Number(st.sequence||0)+1;return p+'-'+st.sequence.toString(36)+'-'+hash(p+'|'+st.sequence).toString(16).slice(0,5)}
function ensure(data){
 if(!data?.story)throw new Error('Story state required');
 let st=data.story.proceduralDirector;
 if(!st||st.schema!==SCHEMA)st=data.story.proceduralDirector={schema:SCHEMA,version:VERSION,sequence:0,recentChoices:[],recentLabels:[],recentPresented:[],recentReplies:{},recentContexts:[],branchMemory:[],initiative:{lastTurn:-99,cooldownUntil:0,recentKinds:[],recentNpcIds:[],history:[]},createdAt:new Date().toISOString()};
 st.version=VERSION;st.recentChoices=Array.isArray(st.recentChoices)?st.recentChoices:[];st.recentLabels=Array.isArray(st.recentLabels)?st.recentLabels:[];st.recentPresented=Array.isArray(st.recentPresented)?st.recentPresented:[];st.recentReplies=st.recentReplies||{};st.recentContexts=Array.isArray(st.recentContexts)?st.recentContexts:[];st.branchMemory=Array.isArray(st.branchMemory)?st.branchMemory:[];st.initiative=st.initiative||{lastTurn:-99,cooldownUntil:0,recentKinds:[],recentNpcIds:[],history:[]};st.initiative.lastTurn=Number(st.initiative.lastTurn??-99);st.initiative.cooldownUntil=Number(st.initiative.cooldownUntil||0);st.initiative.recentKinds=Array.isArray(st.initiative.recentKinds)?st.initiative.recentKinds:[];st.initiative.recentNpcIds=Array.isArray(st.initiative.recentNpcIds)?st.initiative.recentNpcIds:[];st.initiative.history=Array.isArray(st.initiative.history)?st.initiative.history:[];st.sequence=Number(st.sequence||0);
 data.story.proceduralLeads=Array.isArray(data.story.proceduralLeads)?data.story.proceduralLeads:[];
 return st;
}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function signature(c){return [c.intent,c.actionType,c.topic,c.rumorId,c.npcId,c.skill,norm(c.label).split(' ').slice(0,6).join('-')].filter(Boolean).join('|')}
function add(st,c){const sig=signature(c);if(st.recentChoices.includes(sig))return false;const label=norm(c.label);if(st.recentLabels.includes(label))return false;st.recentChoices.unshift(sig);st.recentChoices=st.recentChoices.slice(0,18);st.recentLabels.unshift(label);st.recentLabels=st.recentLabels.slice(0,18);return true}
function rememberPresented(st,rows=[]){for(const c of rows){const label=norm(c?.label);if(label)st.recentPresented.unshift(label)}st.recentPresented=[...new Set(st.recentPresented)].slice(0,30);return rows}
function recordChoice(data,choice=null,action=''){
 const st=ensure(data);
 if(choice){const sig=signature(choice);st.recentChoices.unshift(sig);st.recentChoices=[...new Set(st.recentChoices)].slice(0,18);const label=norm(choice.label);if(label){st.recentLabels.unshift(label);st.recentLabels=[...new Set(st.recentLabels)].slice(0,18)}}
 if(action){st.branchMemory.unshift({turn:Number(data.story?.director?.turn||0),type:'action',text:String(action).slice(0,180)});st.branchMemory=st.branchMemory.slice(0,24)}
 if(choice?.rumorId){const rumor=(data.livingWorld?.rumors||[]).find(x=>x.id===choice.rumorId);if(rumor){rumor.status=rumor.status==='heard'?'investigating':rumor.status;rumor.storyReferences=Number(rumor.storyReferences||0)+1}}
 return st;
}
function activeRumors(data,limit=5){
 const rows=(data.livingWorld?.rumors||[]).filter(r=>r&&['heard','investigating','uncertain'].includes(r.status||'heard'));
 return rows.slice().sort((a,b)=>Number(b.tick||0)-Number(a.tick||0)).slice(0,limit);
}
function activeLeads(data,limit=5){return (data.story?.proceduralLeads||[]).filter(x=>x.status!=='resolved'&&x.status!=='dismissed').slice(-limit).reverse()}
function choice(st,c){return{id:uid(st),...c}}
function rumorChoice(st,rumor,contractId=null,r){
 if(!rumor)return null;
 const verbs=['Pull on the rumor','Verify the report','Trace the source behind the rumor','Cross-check the new report'];
 const lead=String(rumor.summary||'the newest local report').replace(/[.]+$/,'');
 return choice(st,{label:`${pick(verbs,r)}: ${lead}.`,intent:'investigate',actionType:'rumor_lead',rumorId:rumor.id,contractId:contractId||null,skill:'Investigation',dc:11+(hash(rumor.id)%3),purpose:'WORK LIVE RUMOR',topic:'intel'});
}
function leadChoice(st,lead,contractId=null,r){
 if(!lead)return null;
 const verbs=['Follow the lead','Pressure the lead','Work the new lead before it cools','Test the lead in the field'];
 return choice(st,{label:`${pick(verbs,r)}: ${String(lead.summary||lead.title||'new lead').replace(/[.]+$/,'')}.`,intent:'investigate',actionType:'procedural_lead',leadId:lead.id,contractId:contractId||lead.contractId||null,skill:pick(['Investigation','Survival','Stealth'],r),dc:12,purpose:'FOLLOW PROCEDURAL LEAD',topic:'intel'});
}
function consequenceChoice(st,data,ctx,r){
 const x=data.story?.consequences?.recent?.[0];if(!x?.title)return null;
 const title=String(x.title).replace(/[.]+$/,''),tone=String(x.tone||x.kind||'').toLowerCase(),cid=ctx.contract?.id||x.contractId||null;
 if(/danger|warn|bad|hostile/.test(tone))return choice(st,{label:`Deal with the fallout from ${title} before it becomes the next problem.`,intent:'action',actionType:'consequence_response',contractId:cid,skill:'Survival',dc:12,purpose:'CONTROL THE FALLOUT'});
 if(/good|success|win/.test(tone))return choice(st,{label:`Exploit the opening created by ${title} before the advantage disappears.`,intent:'action',actionType:'consequence_opportunity',contractId:cid,skill:'Survival',dc:11,purpose:'USE THE OPENING'});
 return choice(st,{label:`Re-check the current plan against what changed during ${title}.`,intent:'investigate',actionType:'consequence_review',contractId:cid,skill:'Investigation',dc:11,purpose:'ADAPT TO CHANGE'});
}
function locationChoice(st,ctx,r){
 const loc=String(ctx.location||'').toLowerCase(),cid=ctx.contract?.id||null;
 if(loc.includes('blackglass'))return choice(st,{label:pick(['Cross-check Blackglass traffic logs for a pattern the field data missed.','Pull Blackglass sensor history and compare it against the current trail.','Have the HQ analysts correlate the newest lead with station traffic records.','Compare hangar arrivals against contract timestamps and known transponder patterns.','Ask Blackglass security to reconstruct who moved through the station around the latest lead.','Use the isolated data vault to compare the current trail against older Apex records.'],r),intent:'investigate',actionType:'location_intel',contractId:cid,skill:'Investigation',dc:12,purpose:'USE BLACKGLASS'});
 if(loc.includes('port')||loc.includes('veyra'))return choice(st,{label:pick(['Work the Lower Port traffic pattern instead of the obvious lead.','Ask around the port without naming the target and see what changes.','Trace recent arrivals through the freight lanes and maintenance routes.','Compare freight manifests against the newest rumor and look for a missing shipment.','Shadow the service routes and see who avoids the public lanes.','Work the cantina and market separately, then compare which story changes.'],r),intent:'investigate',actionType:'location_intel',contractId:cid,skill:pick(['Investigation','Negotiation','Survival'],r),dc:12,purpose:'WORK THE LOCATION'});
 if(loc.includes('raven'))return choice(st,{label:pick(['Use the Raven as a quiet listening post and sweep for traffic tied to the trail.','Run a passive sensor sweep before committing to another move.'],r),intent:'ship',actionType:'diagnostic',contractId:cid,skill:'Technical',dc:11,purpose:'USE THE RAVEN'});
 return choice(st,{label:pick(['Study the local traffic and look for the detail everyone else is ignoring.','Change vantage points and watch who reacts to Deadlock being here.','Use the location itself as evidence: exits, traffic, witnesses, and blind spots.','Walk the scene backward and reconstruct who had to pass through it.','Ignore the obvious lead and inspect the route someone would use to stay unseen.','Watch the scene long enough to establish what normal looks like before acting.'],r),intent:'investigate',actionType:'location_intel',contractId:cid,skill:'Investigation',dc:12,purpose:'USE THE SCENE'});
}
function contactChoice(st,ctx,r){
 const npc=ctx.currentNpc||{},name=npc.name||'the most relevant contact',cid=ctx.contract?.id||null;
 const labels=[`Ask ${name} for the part of the story they are least certain about.`,`Put the newest lead in front of ${name} and watch what they challenge.`,`Call ${name} and ask what changed since the last conversation.`,`Ask ${name} who benefits if the current trail is wrong.`,`Ask ${name} what they would check before betting their life on this lead.`,`Have ${name} attack the current theory and identify the weakest assumption.`,`Ask ${name} for one fact they have not been able to reconcile yet.`];
 return choice(st,{label:pick(labels,r),intent:'dialogue',actionType:'intel_contact',npcId:npc.id||ctx.currentNpcId||'dren',contractId:cid,skill:'Negotiation',dc:11+(hash(name+'|'+ctx.turn)%3),purpose:'WORK A CONTACT',topic:'intel'});
}
function fieldChoice(st,ctx,r){
 const stage=Number(ctx.stage?.index||1),name=ctx.target?.name||ctx.contract?.title||'the objective',cid=ctx.contract?.id||null;
 const byStage=stage>=5?[
  {label:`Cut off ${name}'s cleanest exit and force the decision on your terms.`,intent:'resolve',actionType:'contain',skill:'Survival',dc:13,purpose:'CONTROL THE ENDGAME'},
  {label:`Stay invisible until ${name} exposes a clean capture window.`,intent:'resolve',actionType:'shadow_capture',skill:'Stealth',dc:13,purpose:'SET THE CAPTURE'},
  {label:`Use a cover identity to get inside ${name}'s decision loop before the reveal.`,intent:'resolve',actionType:'cover_capture',skill:'Deception',dc:14,purpose:'GET CLOSE'},
  {label:`Force ${name} to choose between a blocked route and a controlled surrender lane.`,intent:'resolve',actionType:'contain',skill:'Survival',dc:14,purpose:'BOX IN TARGET'},
  {label:`Stage a false opening, then close it when ${name} commits.`,intent:'resolve',actionType:'bait_capture',skill:'Deception',dc:14,purpose:'TRAP THE EXIT'},
  {label:`Wait for ${name} to separate from support and make the capture with minimum noise.`,intent:'resolve',actionType:'shadow_capture',skill:'Stealth',dc:13,purpose:'CLEAN CAPTURE'}
 ]:stage>=3?[
  {label:`Shadow the strongest thread tied to ${name} and see where it actually terminates.`,intent:'action',actionType:'field_shadow',skill:'Stealth',dc:12,purpose:'PRESS THE TRAIL'},
  {label:'Set a quiet observation point and let the network move first.',intent:'investigate',actionType:'surveillance',skill:'Survival',dc:12,purpose:'WATCH THE NETWORK'},
  {label:'Feed one false detail into the trail and trace who repeats it.',intent:'deception',actionType:'bait_network',skill:'Deception',dc:13,purpose:'BAIT THE NETWORK'},
  {label:'Follow the money and logistics instead of the person; somebody is keeping the trail supplied.',intent:'investigate',actionType:'logistics_trace',skill:'Investigation',dc:12,purpose:'TRACE SUPPORT'},
  {label:'Change the surveillance pattern and see whether anyone adjusts to keep watching Deadlock.',intent:'action',actionType:'counterwatch',skill:'Survival',dc:13,purpose:'FIND THE WATCHER'},
  {label:'Leak two conflicting routes to different channels and see which one draws movement.',intent:'deception',actionType:'split_bait',skill:'Deception',dc:14,purpose:'SPLIT THE NETWORK'}
 ]:[
  {label:`Break ${name}'s trail into independent claims and verify the weakest one first.`,intent:'investigate',actionType:'crosscheck',skill:'Investigation',dc:11,purpose:'VERIFY A LEAD'},
  {label:'Follow the least obvious lead before other hunters notice it.',intent:'action',actionType:'field_shadow',skill:'Survival',dc:12,purpose:'PRESS A QUIET LEAD'},
  {label:'Plant a harmless false detail and watch where it travels.',intent:'deception',actionType:'bait_network',skill:'Deception',dc:13,purpose:'MAP THE NETWORK'},
  {label:'Compare independent timestamps and discard every lead that depends on the same source.',intent:'investigate',actionType:'source_audit',skill:'Investigation',dc:12,purpose:'AUDIT SOURCES'},
  {label:'Follow the support chain: fuel, parts, lodging, and comm traffic around the trail.',intent:'investigate',actionType:'logistics_trace',skill:'Survival',dc:12,purpose:'TRACE SUPPORT'},
  {label:'Approach the weakest witness indirectly and see what they volunteer without knowing the real question.',intent:'deception',actionType:'soft_probe',skill:'Deception',dc:12,purpose:'SOFT PROBE'}
 ];
 return choice(st,{...pick(byStage,r),contractId:cid});
}
function shipChoice(st,ctx,r){
 const sys=ctx.weakestSystem||{},cid=ctx.contract?.id||null,condition=Math.round(Number(sys.condition??100));
 const labels=condition<80?[ `Repair ${sys.name||'the Raven\'s weakest system'} before the trail turns into a pursuit.`,`Run a focused diagnostic on ${sys.name||'the Raven'} and decide whether the risk is acceptable.`,`Patch the weakest Raven system now so it cannot become the mission's failure point.`,`Have Jessa verify the weak-system reading before committing the ship.`]:['Run a fast Raven readiness check before committing to the next move.','Sweep weapons, shields, and escape systems before pushing the trail harder.','Use the Raven sensors to build an escape route before going deeper.','Pre-stage the Raven for a fast departure if the next lead turns hostile.'];
 return choice(st,{label:pick(labels,r),intent:'ship',actionType:condition<65?'repair':'diagnostic',systemId:sys.id||null,contractId:cid,skill:'Technical',dc:condition<65?12:10,purpose:'SHIP READINESS'});
}
function missionChoices(data,ctx={}){
 const st=ensure(data),turn=Number(data.story?.director?.turn||0),seed=`${data.created||'deadlock'}|mission|${ctx.contract?.id||'free'}|${ctx.stage?.index||0}|${turn}|${st.sequence}`,r=rng(seed),candidates=[],cid=ctx.contract?.id||null;
 if(ctx.contract?.status==='Completed')candidates.push(choice(st,{label:'Review unresolved leads and choose what becomes the next job.',intent:'bounty',actionType:'review_leads',purpose:'NEXT THREAD'}),shipChoice(st,ctx,r));
 else if(Number(ctx.contract?.progress||0)>=100)candidates.push(choice(st,{label:ctx.target?.name?`Deliver ${ctx.target.name} and complete the handoff.`:'Complete the contract handoff and collect the payout.',intent:'turnin',contractId:cid,purpose:'TURN IN'}),contactChoice(st,ctx,r),shipChoice(st,ctx,r));
 else{
  const rumor=pick(activeRumors(data,4),r),lead=pick(activeLeads(data,4),r),consequence=consequenceChoice(st,data,ctx,r);
  if(rumor)candidates.push(rumorChoice(st,rumor,cid,r));
  if(lead)candidates.push(leadChoice(st,lead,cid,r));
  if(consequence)candidates.push(consequence);
  candidates.push(fieldChoice(st,ctx,r),contactChoice(st,ctx,r),locationChoice(st,ctx,r),shipChoice(st,ctx,r));
  if(Number(ctx.stage?.index||1)>=4)candidates.push(fieldChoice(st,{...ctx,turn:turn+7},r));
 }
 const chosen=[],seen=new Set();
 for(const c of candidates.filter(Boolean)){
  const sig=signature(c);if(seen.has(sig))continue;seen.add(sig);
  const recent=st.recentChoices.includes(sig)||st.recentLabels.includes(norm(c.label))||st.recentPresented.includes(norm(c.label));
  if(!recent||chosen.length<2)chosen.push(c);
  if(chosen.length>=5)break;
 }
 if(chosen.length<4){for(const c of candidates.filter(Boolean)){if(!chosen.includes(c))chosen.push(c);if(chosen.length>=4)break}}
 return rememberPresented(st,chosen.slice(0,5));
}
function dialogueChoices(data,ctx={}){
 const st=ensure(data),npc=ctx.npc||{},analysis=ctx.analysis||{},topic=analysis.topic||ctx.topic||'intel',active=ctx.contract||{},turn=Number(data.story?.director?.turn||0),r=rng(`${data.created||'deadlock'}|dialogue|${npc.id||'npc'}|${topic}|${turn}|${st.sequence}`),rumor=pick(activeRumors(data,3),r),lead=pick(activeLeads(data,3),r);
 const pools={
  probe:[`“Give me the part you are least certain about.”`,`“What changed since the last time we talked?”`,`“What would make you abandon your current theory?”`,`“Which detail are you treating as fact that is still only an assumption?”`],
  pressure:[`“That answer was safe. Give me the useful version.”`,`“What are you leaving out because you think I will react badly?”`,`“Start with what you can actually prove.”`,`“Who benefits if I believe the wrong version of this?”`],
  strategy:[`“If you were making the next move, what would you do?”`,`“Where does this go wrong if I move now?”`,`“What is the quiet option nobody else is watching?”`,`“Tell me which risk matters and which one is noise.”`],
  relationship:[`“Forget the job for a second. Where do we actually stand?”`,`“Do you trust my judgment, or just my results?”`,`“What have I done that changed how you read me?”`,`“What would make working together easier next time?”`],
  exit:[`“Good. I have enough. Send me anything new and stay reachable.”`,`“That gives me a move. I am going to act on it.”`,`“Hold the channel. I will come back when I have something concrete.”`]
 };
 const rows=[
  choice(st,{label:pick(pools.probe,r),intent:'dialogue',npcId:npc.id,contractId:active.id||null,skill:'Negotiation',dc:11,purpose:'PROBE FOR CHANGE',topic}),
  choice(st,{label:pick(analysis.tone==='hostile'?pools.pressure:pools.strategy,r),intent:'dialogue',npcId:npc.id,contractId:active.id||null,skill:analysis.tone==='hostile'?'Insight':'Negotiation',dc:12,purpose:'TEST THE ANSWER',topic}),
  choice(st,{label:pick(pools.relationship,r),intent:'dialogue',npcId:npc.id,contractId:active.id||null,skill:'Insight',dc:11,purpose:'RELATIONSHIP',topic:'trust'})
 ];
 if(rumor)rows.push(choice(st,{label:`“I heard this: ${String(rumor.summary||'a new local rumor').replace(/[.]+$/,'')}. What does that change?”`,intent:'dialogue',actionType:'rumor_discussion',rumorId:rumor.id,npcId:npc.id,contractId:active.id||null,skill:'Insight',dc:12,purpose:'DISCUSS LIVE RUMOR',topic:'intel'}));
 else if(lead)rows.push(choice(st,{label:`“We picked up a lead: ${String(lead.summary||lead.title).replace(/[.]+$/,'')}. What am I missing?”`,intent:'dialogue',actionType:'lead_discussion',leadId:lead.id,npcId:npc.id,contractId:active.id||null,skill:'Insight',dc:12,purpose:'TEST A LEAD',topic:'intel'}));
 rows.push(choice(st,{label:pick(pools.exit,r),intent:'action',actionType:'leave_dialogue',contractId:active.id||null,purpose:'ACT ON IT'}));
 const out=[];for(const c of rows){const sig=signature(c);if(!st.recentChoices.includes(sig)&&!st.recentLabels.includes(norm(c.label))&&!st.recentPresented.includes(norm(c.label)))out.push(c);if(out.length>=5)break}
 if(out.length<4)for(const c of rows){if(!out.includes(c))out.push(c);if(out.length>=4)break}
 return rememberPresented(st,out.slice(0,5));
}
function genericChoices(data,ctx={}){
 const st=ensure(data),r=rng(`${data.created||'deadlock'}|generic|${data.story?.director?.turn||0}|${st.sequence}`),rows=[],rumor=pick(activeRumors(data,4),r),lead=pick(activeLeads(data,4),r);
 if(rumor)rows.push(rumorChoice(st,rumor,ctx.contract?.id||null,r));if(lead)rows.push(leadChoice(st,lead,ctx.contract?.id||null,r));
 const consequence=consequenceChoice(st,data,ctx,r);if(consequence)rows.push(consequence);rows.push(locationChoice(st,ctx,r),contactChoice(st,ctx,r),fieldChoice(st,ctx,r),shipChoice(st,ctx,r));
 const out=[];for(const c of rows.filter(Boolean)){if(!st.recentLabels.includes(norm(c.label))&&!st.recentPresented.includes(norm(c.label)))out.push(c);if(out.length>=5)break}
 return rememberPresented(st,(out.length>=4?out:rows.filter(Boolean)).slice(0,5));
}
function ambientNpcById(data,id){
 if(!id)return null;
 for(const pop of Object.values(data.livingWorld?.populations||{})){const n=(pop?.npcs||[]).find(x=>x.id===id);if(n)return n}
 return null;
}
function initiativeChoice(st,c){return{id:uid(st,'initiative-choice'),...c}}
function contactInitiative(data,ctx,st,r){
 const contract=ctx.contract||{},lead=activeLeads(data,4)[0],rumor=activeRumors(data,4)[0],weak=ctx.weakestSystem||{},danger=Number(ctx.danger ?? data.story?.danger ?? 0),turn=Number(data.story?.director?.turn||0);
 const candidates=[];
 if(Number(weak.condition??100)<82)candidates.push({kind:'crew',npcId:'jessa',speaker:'Jessa',urgency:Number(weak.condition)<60?8:6,danger:Number(weak.condition)<60?10:4,label:`Jessa cuts into the channel: ${weak.name||'one Raven system'} is drifting out of tolerance.`,summary:`${weak.name||'The Raven'} is reading ${Math.round(Number(weak.condition||0))}% condition. Jessa called without waiting for a request.`,topic:'ship',systemId:weak.id||null});
 if(lead)candidates.push({kind:'intel',npcId:'dren',speaker:'Dren Voss',urgency:6,danger:3,label:'Dren opens a channel before Deadlock can call him.',summary:`Dren has been working the lead independently: ${String(lead.summary).replace(/[.]+$/,'')}.`,topic:'intel',leadId:lead.id,contractId:lead.contractId||contract.id||null});
 else if(rumor)candidates.push({kind:'intel',npcId:'dren',speaker:'Dren Voss',urgency:5,danger:2,label:'Dren calls with something he heard before Deadlock asks.',summary:`A fresh report crossed Dren's channel: ${String(rumor.summary).replace(/[.]+$/,'')}.`,topic:'intel',rumorId:rumor.id,contractId:contract.id||null});
 if(contract.id==='kade'||(contract.id&&turn%5===0))candidates.push({kind:'contract',npcId:'nera',speaker:'Nera Kade',urgency:5,danger:2,label:'Nera Kade requests the channel on her own timetable.',summary:`Kade wants a status answer on ${contract.title||'the active contract'} instead of waiting for Deadlock to report in.`,topic:'deal',contractId:contract.id||null});
 if(danger>=58)candidates.push({kind:'warning',npcId:'renn',speaker:'Renn',urgency:danger>=78?8:6,danger:Math.round(danger/12),label:'Renn breaks radio silence with a warning.',summary:'Renn noticed movement around the operation and decided it was important enough to interrupt.',topic:'danger',contractId:contract.id||null});
 return candidates.filter(x=>!st.initiative.recentNpcIds.slice(0,2).includes(x.npcId));
}
function ambientInitiative(data,ctx,st,r){
 const rumor=activeRumors(data,5).find(x=>(x.participantIds||[]).length);
 if(!rumor)return null;
 const npc=ambientNpcById(data,rumor.participantIds[0]);if(!npc)return null;
 return{kind:'ambient',npcId:null,ambientNpcId:npc.id,speaker:npc.name||'Local worker',urgency:4,danger:1,label:`${npc.name||'A local worker'} approaches Deadlock without being called over.`,summary:`${npc.name||'The local'} has something to say about a report already moving through the area: ${String(rumor.summary).replace(/[.]+$/,'')}.`,topic:'intel',rumorId:rumor.id,contractId:ctx.contract?.id||null,role:npc.role||'local'};
}
function memoryInitiative(data,ctx,st,r){
 const turn=Number(data.story?.director?.turn||0),past=st.branchMemory.find(x=>x&&Number(x.turn||0)<=turn-4&&x.text&&!String(x.text).startsWith('Continue'));
 if(!past)return null;
 const npcId=st.initiative.recentNpcIds[0]==='dren'?'jessa':'dren',speaker=npcId==='jessa'?'Jessa':'Dren Voss';
 return{kind:'memory',npcId,speaker,urgency:4,danger:0,label:`${speaker} circles back to something Deadlock did earlier.`,summary:`${speaker} has not forgotten: “${String(past.text).slice(0,135)}” The earlier choice has become relevant again.`,topic:'trust',memoryText:String(past.text),contractId:ctx.contract?.id||null};
}
function initiativeChoices(st,event,r){
 const common=[
  initiativeChoice(st,{label:'Hear them out before changing the plan.',intent:'dialogue',actionType:'initiative_listen',npcId:event.npcId||null,contractId:event.contractId||null,rumorId:event.rumorId||null,leadId:event.leadId||null,skill:'Insight',dc:11,purpose:'LISTEN'}),
  initiativeChoice(st,{label:'Ask for the one detail that changes the decision.',intent:'dialogue',actionType:'initiative_probe',npcId:event.npcId||null,contractId:event.contractId||null,rumorId:event.rumorId||null,leadId:event.leadId||null,skill:'Negotiation',dc:12,purpose:'PRESS FOR DETAIL'}),
  initiativeChoice(st,{label:'Verify it independently before acting.',intent:'investigate',actionType:'initiative_verify',contractId:event.contractId||null,rumorId:event.rumorId||null,leadId:event.leadId||null,skill:'Investigation',dc:12,purpose:'VERIFY'}),
  initiativeChoice(st,{label:'Acknowledge it, but keep the current plan moving.',intent:'action',actionType:'initiative_hold',contractId:event.contractId||null,purpose:'STAY ON PLAN'})
 ];
 if(event.kind==='crew'&&event.systemId){
  common[0]=initiativeChoice(st,{label:`Have Jessa walk Deadlock through the ${event.systemId} fault now.`,intent:'dialogue',actionType:'initiative_system',npcId:'jessa',systemId:event.systemId,skill:'Technical',dc:10,purpose:'DIAGNOSE'});
  common[2]=initiativeChoice(st,{label:'Authorize an immediate repair before the system worsens.',intent:'ship',actionType:'repair',systemId:event.systemId,skill:'Technical',dc:12,purpose:'REPAIR NOW'});
 }
 if(event.kind==='ambient'){
  common[0]=initiativeChoice(st,{label:`Let ${event.speaker} explain what they saw.`,intent:'investigate',actionType:'ambient_listen',rumorId:event.rumorId||null,skill:'Insight',dc:10,purpose:'HEAR THEM OUT'});
  common[1]=initiativeChoice(st,{label:'Ask who else knows and where the story started.',intent:'investigate',actionType:'ambient_source',rumorId:event.rumorId||null,skill:'Investigation',dc:12,purpose:'TRACE SOURCE'});
 }
 if(event.kind==='memory'){
  common[0]=initiativeChoice(st,{label:'Ask why that earlier choice matters now.',intent:'dialogue',actionType:'memory_revisit',npcId:event.npcId,contractId:event.contractId||null,skill:'Insight',dc:11,purpose:'REVISIT DECISION'});
  common[1]=initiativeChoice(st,{label:'Defend the old decision and ask what changed.',intent:'dialogue',actionType:'memory_defend',npcId:event.npcId,contractId:event.contractId||null,skill:'Negotiation',dc:12,purpose:'DEFEND THE CALL'});
 }
 return common.slice(0,4);
}
function initiative(data,ctx={},opts={}){
 const st=ensure(data),is=st.initiative,turn=Number(data.story?.director?.turn||0),pending=(data.story?.interruptions||[]).length;
 if(!opts.force){if(pending>0||turn<Number(is.cooldownUntil||0)||turn===Number(is.lastTurn||-99)||turn<2)return null}
 const r=rng(`${data.created||'deadlock'}|initiative|${turn}|${ctx.location||data.story?.location||''}|${is.history.length}`);
 const gate=hash(`${data.created||'deadlock'}|initiative-gate|${turn}|${is.history.length}`)%100;
 if(!opts.force&&gate>=42)return null;
 let pool=contactInitiative(data,ctx,st,r);
 const ambient=ambientInitiative(data,ctx,st,r);if(ambient)pool.push(ambient);
 const memory=memoryInitiative(data,ctx,st,r);if(memory)pool.push(memory);
 pool=pool.filter(x=>!is.recentKinds.slice(0,2).includes(x.kind)||pool.length<=2);
 if(!pool.length)return null;
 const event=pick(pool,r);event.id=uid(st,'initiative');event.turn=turn;event.createdAt=new Date().toISOString();event.choices=initiativeChoices(st,event,r);
 is.lastTurn=turn;is.cooldownUntil=turn+2+(hash(event.id+'|cooldown')%3);is.recentKinds.unshift(event.kind);is.recentKinds=is.recentKinds.slice(0,5);if(event.npcId){is.recentNpcIds.unshift(event.npcId);is.recentNpcIds=is.recentNpcIds.slice(0,5)}
 is.history.unshift({id:event.id,turn,kind:event.kind,npcId:event.npcId||null,ambientNpcId:event.ambientNpcId||null,label:event.label,summary:event.summary});is.history=is.history.slice(0,30);
 st.branchMemory.unshift({turn,type:'initiative',text:event.summary,id:event.id});st.branchMemory=st.branchMemory.slice(0,24);
 return event;
}
function narrativeBeat(data,ctx={}){
 const st=ensure(data),c=ctx.choice||{},roll=ctx.roll||null,contract=ctx.contract||{},stage=ctx.stage||{},location=ctx.location||data.story?.location||'the scene',target=ctx.target?.name||contract.title||'the objective',success=roll?!!roll.success:null;
 const r=rng(`${data.created||'deadlock'}|beat|${data.story?.director?.turn||0}|${signature(c)}|${success}`);
 let pool=[];
 if(c.rumorId||c.leadId)pool=success===false?[
  'The lead does not collapse, but it refuses to verify cleanly. Deadlock marks the contradiction instead of pretending it is certainty.',
  'The new thread produces more questions than answers. It stays alive, but its confidence drops until another source can support it.',
  'The trail bends away from the expected answer. That is useful in its own way: one bad assumption is now exposed.'
 ]:[
  `The new thread connects to something real. Deadlock does not have the whole answer yet, but the lead now has enough structure to act on.`,
  `A loose rumor becomes a usable direction. The important change is not certainty—it is that Deadlock now knows what to test next.`,
  `The report survives the first round of scrutiny. It is no longer background noise; it belongs on the operational board.`
 ];
 else if(c.intent==='deception')pool=success===false?[
  'The false detail goes into the network, but the reaction is muddy. Somebody may have noticed the bait without revealing which side they are on.',
  'The lie moves, just not cleanly enough to map the network. Deadlock gains pressure instead of clarity.',
  'The bait draws attention faster than information. The next move will need to account for whoever noticed.'
 ]:[
  'The planted detail moves exactly far enough to be useful. Someone reacts, and that reaction gives Deadlock a new edge on the trail.',
  'The network carries the false detail farther than it should. That tells Deadlock which channel is listening.',
  'The bait works without becoming the story. A small reaction exposes a larger connection behind it.'
 ];
 else if(c.intent==='investigate')pool=success===false?[
  `The search at ${location} turns up fragments, not a clean answer. Deadlock keeps the useful pieces and discards the temptation to call them proof.`,
  'The evidence refuses to line up neatly. One assumption is weaker than it looked, and the trail needs a different angle.',
  'The investigation costs momentum without producing certainty. The failure still narrows what Deadlock should stop trusting.'
 ]:[
  `The work at ${location} pays off. Separate details begin pointing in the same direction instead of competing with each other.`,
  `Deadlock finds the inconsistency that matters. The trail on ${target} gets narrower because one piece finally survives cross-checking.`,
  'A small detail holds up under scrutiny. It is not dramatic, but it changes which lead deserves the next move.'
 ];
 else if(c.intent==='action'||c.intent==='resolve')pool=success===false?[
  'Deadlock commits to the move, but the scene pushes back. The plan is still alive; the easy version of it is gone.',
  'The approach breaks at the point where control mattered most. Deadlock keeps the objective, loses some initiative, and has to adapt.',
  'The move forces a reaction before Deadlock gets the result. The situation is hotter now, but no longer static.'
 ]:[
  'Deadlock acts before the situation can settle. The move changes who has initiative and forces the opposition to respond.',
  'The plan stops being theory. Deadlock takes control of the next beat and the trail has to react around him.',
  'The approach lands cleanly enough to create momentum. What was a possibility a moment ago is now an operational advantage.'
 ];
 else pool=[
  `The situation at ${location} changes shape. ${stage.title||'The current thread'} remains active, but the next decision is no longer the same one.`,
  'The scene moves forward instead of resetting. Recent choices, local activity, and unfinished leads all stay in play.',
  `Deadlock reassesses ${target}. The objective is unchanged; the available ways to reach it are not.`
 ];
 let line=pick(pool,r)||`The situation changes around ${target}.`;
 const key='beat|'+norm(line);if(st.recentContexts.includes(key)&&pool.length>1){const alt=pool.find(x=>!st.recentContexts.includes('beat|'+norm(x)));if(alt)line=alt}
 st.recentContexts.unshift('beat|'+norm(line));st.recentContexts=[...new Set(st.recentContexts)].slice(0,20);
 return line;
}
function continueBeat(data,ctx={}){
 const st=ensure(data),contract=ctx.contract||{},stage=ctx.stage||{},rumor=activeRumors(data,1)[0],lead=activeLeads(data,1)[0],r=rng(`${data.created||'deadlock'}|continue|${data.story?.director?.turn||0}|${st.sequence}`);
 const pool=[
  lead?`Deadlock brings the newest lead back to the front: ${String(lead.summary).replace(/[.]+$/,'')}. The next move should either strengthen it or kill it.`:null,
  rumor?`A live rumor is still unresolved: ${String(rumor.summary).replace(/[.]+$/,'')}. It can be worked now or ignored in favor of the main objective.`:null,
  `${stage.title||'The operation'} is still live. Deadlock changes approach rather than replaying the last move.`,
  `The board refreshes around ${contract.title||'the current operation'}. Recent choices are removed from the immediate menu and different angles move forward.`
 ].filter(Boolean);
 return pick(pool,r);
}
function resolveRumor(data,rumorId,result={}){
 const st=ensure(data),rumor=(data.livingWorld?.rumors||[]).find(x=>x.id===rumorId);if(!rumor)return null;
 const success=result.success!==false,existing=data.story.proceduralLeads.find(x=>x.rumorId===rumorId);
 if(existing){existing.attempts=Number(existing.attempts||0)+1;if(success)existing.confidence=clamp(Number(existing.confidence||35)+18,0,100);return existing}
 const lead={id:uid(st,'lead'),rumorId,sourcePresetId:rumor.sourcePresetId||null,shipId:rumor.shipId||null,participantIds:[...(rumor.participantIds||[])],summary:rumor.summary||'Unverified living-world report',status:success?'active':'uncertain',confidence:success?55:25,createdTurn:Number(data.story?.director?.turn||0),attempts:1,contractId:result.contractId||null};
 data.story.proceduralLeads.push(lead);data.story.proceduralLeads=data.story.proceduralLeads.slice(-30);rumor.status=success?'promoted':'uncertain';rumor.leadId=lead.id;st.branchMemory.unshift({turn:lead.createdTurn,type:'rumor-lead',text:lead.summary,id:lead.id});st.branchMemory=st.branchMemory.slice(0,24);return lead;
}
function contextLine(data,ctx={}){
 const st=ensure(data),npcId=ctx.npcId||'npc',analysis=ctx.analysis||{},topic=analysis.topic||'open',rumors=activeRumors(data,4),leads=activeLeads(data,4),r=rng(`${data.created||'deadlock'}|context|${npcId}|${topic}|${data.story?.director?.turn||0}|${st.sequence}`);
 let line=null,key=null;
 if(['intel','danger','marr','kade','deal','open'].includes(topic)&&leads.length){const lead=pick(leads,r);key='lead:'+lead.id;line=contextVoice(npcId,`the new lead says ${String(lead.summary).replace(/[.]+$/,'')}`,lead.confidence)}
 else if(['intel','danger','open'].includes(topic)&&rumors.length){const rumor=pick(rumors,r);key='rumor:'+rumor.id;line=contextVoice(npcId,`the local report says ${String(rumor.summary).replace(/[.]+$/,'')}`,35)}
 if(!line||st.recentContexts.includes(npcId+'|'+key))return null;st.recentContexts.unshift(npcId+'|'+key);st.recentContexts=st.recentContexts.slice(0,16);return line;
}
function contextVoice(npcId,subject,confidence){
 if(npcId==='dren')return `One thing changed: ${subject}. I would use it, but I would not bet the whole hunt on it yet.`;
 if(npcId==='nera')return `There is one relevant update: ${subject}. Treat it as leverage only after you verify it.`;
 if(npcId==='jessa')return `I pulled the newest local update: ${subject}. It is enough to adjust the plan, not enough to stop checking the data.`;
 if(npcId==='renn')return `I heard something new: ${subject}. Maybe it is nothing. I do not love betting on maybe.`;
 return `A new piece has entered the picture: ${subject}. Confidence is roughly ${confidence||35} percent.`;
}
function factOrUpdate(data,npcId,fact,topic='open'){
 if(!fact)return null;const st=ensure(data),rows=st.recentReplies[npcId]||(st.recentReplies[npcId]=[]),key=norm(fact);
 if(!rows.includes(key)){rows.unshift(key);st.recentReplies[npcId]=rows.slice(0,10);return fact}
 const fresh=contextLine(data,{npcId,analysis:{topic}});if(fresh)return fresh;
 const variants={
  dren:["Nothing new on that specific point. If you want a different answer, we need a different piece of evidence.","That part has not changed since I told you. The next useful thing is whatever the trail gives us now."],
  nera:["The verified facts on that point have not changed. Repeating the question will not improve them.","No material change. Bring me new evidence and I will give you a new conclusion."],
  jessa:["Same answer on that point. Give me new telemetry and I can give you something new.","Nothing changed there. I would rather work the next variable than repeat the old readout."],
  renn:["Still the same answer there. I wish I had something newer.","No change on that piece. If something moves, I will tell you before you have to ask twice."]
 };
 const r=rng(key+'|'+data.story?.director?.turn+'|'+npcId);return pick(variants[npcId]||["Nothing verified has changed on that point yet. Let's work the newest piece instead."],r);
}
function recordReply(data,npcId,line){const st=ensure(data),rows=st.recentReplies[npcId]||(st.recentReplies[npcId]=[]),key=norm(line);rows.unshift(key);st.recentReplies[npcId]=[...new Set(rows)].slice(0,12)}
function summary(data){const st=ensure(data);return{version:st.version,recentChoices:st.recentChoices.length,recentLabels:st.recentLabels.length,recentPresented:st.recentPresented.length,leads:data.story.proceduralLeads.length,activeRumors:activeRumors(data,99).length,branchMemory:st.branchMemory.length,initiatives:st.initiative.history.length,initiativeCooldownUntil:st.initiative.cooldownUntil}}
root.DeadlockStoryDirector={schema:SCHEMA,version:VERSION,ensure,recordChoice,missionChoices,dialogueChoices,genericChoices,narrativeBeat,continueBeat,initiative,resolveRumor,activeRumors,activeLeads,contextLine,factOrUpdate,recordReply,summary,_test:{hash,rng,signature,norm,contextVoice,ambientNpcById,contactInitiative,ambientInitiative,memoryInitiative,initiativeChoices}};
})(typeof window!=='undefined'?window:globalThis);
