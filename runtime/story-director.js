/* Deadlock Phase 3 — Procedural Story Director.
 * Offline choice rotation, dialogue freshness, and rumor -> lead promotion.
 * Durable state is plain JSON for browser/native portability.
 */
(function(root){
'use strict';
const VERSION='1.0.0',SCHEMA='deadlock.story-director.v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
function hash(v){let h=2166136261;for(const c of String(v??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let s=hash(seed)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function pick(a,r){return a&&a.length?a[Math.min(a.length-1,Math.floor(r()*a.length))]:null}
function uid(st,p='storyopt'){st.sequence=Number(st.sequence||0)+1;return p+'-'+st.sequence.toString(36)+'-'+hash(p+'|'+st.sequence).toString(16).slice(0,5)}
function ensure(data){
 if(!data?.story)throw new Error('Story state required');
 let st=data.story.proceduralDirector;
 if(!st||st.schema!==SCHEMA)st=data.story.proceduralDirector={schema:SCHEMA,version:VERSION,sequence:0,recentChoices:[],recentLabels:[],recentReplies:{},recentContexts:[],branchMemory:[],createdAt:new Date().toISOString()};
 st.version=VERSION;st.recentChoices=Array.isArray(st.recentChoices)?st.recentChoices:[];st.recentLabels=Array.isArray(st.recentLabels)?st.recentLabels:[];st.recentReplies=st.recentReplies||{};st.recentContexts=Array.isArray(st.recentContexts)?st.recentContexts:[];st.branchMemory=Array.isArray(st.branchMemory)?st.branchMemory:[];st.sequence=Number(st.sequence||0);
 data.story.proceduralLeads=Array.isArray(data.story.proceduralLeads)?data.story.proceduralLeads:[];
 return st;
}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function signature(c){return [c.intent,c.actionType,c.topic,c.rumorId,c.npcId,c.skill,norm(c.label).split(' ').slice(0,6).join('-')].filter(Boolean).join('|')}
function add(st,c){const sig=signature(c);if(st.recentChoices.includes(sig))return false;const label=norm(c.label);if(st.recentLabels.includes(label))return false;st.recentChoices.unshift(sig);st.recentChoices=st.recentChoices.slice(0,18);st.recentLabels.unshift(label);st.recentLabels=st.recentLabels.slice(0,18);return true}
function recordChoice(data,choice=null,action=''){
 const st=ensure(data);
 if(choice){const sig=signature(choice);st.recentChoices.unshift(sig);st.recentChoices=[...new Set(st.recentChoices)].slice(0,18);const label=norm(choice.label);if(label){st.recentLabels.unshift(label);st.recentLabels=[...new Set(st.recentLabels)].slice(0,18)}}
 if(action){st.branchMemory.unshift({turn:Number(data.story?.director?.turn||0),type:'action',text:String(action).slice(0,180)});st.branchMemory=st.branchMemory.slice(0,24)}
 if(choice?.rumorId){const rumor=(data.livingWorld?.rumors||[]).find(x=>x.id===choice.rumorId);if(rumor){rumor.status=rumor.status==='heard'?'investigating':rumor.status;rumor.storyReferences=Number(rumor.storyReferences||0)+1}}
 return st;
}
function activeRumors(data,limit=5){
 const rows=(data.livingWorld?.rumors||[]).filter(r=>r&&r.status!=='dismissed'&&r.status!=='resolved');
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
function locationChoice(st,ctx,r){
 const loc=String(ctx.location||'').toLowerCase(),cid=ctx.contract?.id||null;
 if(loc.includes('blackglass'))return choice(st,{label:pick(['Cross-check Blackglass traffic logs for a pattern the field data missed.','Pull Blackglass sensor history and compare it against the current trail.','Have the HQ analysts correlate the newest lead with station traffic records.'],r),intent:'investigate',actionType:'location_intel',contractId:cid,skill:'Investigation',dc:12,purpose:'USE BLACKGLASS'});
 if(loc.includes('port')||loc.includes('veyra'))return choice(st,{label:pick(['Work the Lower Port traffic pattern instead of the obvious lead.','Ask around the port without naming the target and see what changes.','Trace recent arrivals through the freight lanes and maintenance routes.'],r),intent:'investigate',actionType:'location_intel',contractId:cid,skill:pick(['Investigation','Streetwise','Survival'],r),dc:12,purpose:'WORK THE LOCATION'});
 if(loc.includes('raven'))return choice(st,{label:pick(['Use the Raven as a quiet listening post and sweep for traffic tied to the trail.','Run a passive sensor sweep before committing to another move.'],r),intent:'ship',actionType:'diagnostic',contractId:cid,skill:'Technical',dc:11,purpose:'USE THE RAVEN'});
 return choice(st,{label:pick(['Study the local traffic and look for the detail everyone else is ignoring.','Change vantage points and watch who reacts to Deadlock being here.','Use the location itself as evidence: exits, traffic, witnesses, and blind spots.'],r),intent:'investigate',actionType:'location_intel',contractId:cid,skill:'Investigation',dc:12,purpose:'USE THE SCENE'});
}
function contactChoice(st,ctx,r){
 const npc=ctx.currentNpc||{},name=npc.name||'the most relevant contact',cid=ctx.contract?.id||null;
 const labels=[`Ask ${name} for the part of the story they are least certain about.`,`Put the newest lead in front of ${name} and watch what they challenge.`,`Call ${name} and ask what changed since the last conversation.`,`Ask ${name} who benefits if the current trail is wrong.`];
 return choice(st,{label:pick(labels,r),intent:'dialogue',actionType:'intel_contact',npcId:npc.id||ctx.currentNpcId||'dren',contractId:cid,skill:'Negotiation',dc:11+(hash(name+'|'+ctx.turn)%3),purpose:'WORK A CONTACT',topic:'intel'});
}
function fieldChoice(st,ctx,r){
 const stage=Number(ctx.stage?.index||1),name=ctx.target?.name||ctx.contract?.title||'the objective',cid=ctx.contract?.id||null;
 const byStage=stage>=5?[
  {label:`Cut off ${name}'s cleanest exit and force the decision on your terms.`,intent:'resolve',actionType:'contain',skill:'Survival',dc:13,purpose:'CONTROL THE ENDGAME'},
  {label:`Stay invisible until ${name} exposes a clean capture window.`,intent:'resolve',actionType:'shadow_capture',skill:'Stealth',dc:13,purpose:'SET THE CAPTURE'},
  {label:`Use a cover identity to get inside ${name}'s decision loop before the reveal.`,intent:'resolve',actionType:'cover_capture',skill:'Deception',dc:14,purpose:'GET CLOSE'}
 ]:stage>=3?[
  {label:`Shadow the strongest thread tied to ${name} and see where it actually terminates.`,intent:'action',actionType:'field_shadow',skill:'Stealth',dc:12,purpose:'PRESS THE TRAIL'},
  {label:'Set a quiet observation point and let the network move first.',intent:'investigate',actionType:'surveillance',skill:'Survival',dc:12,purpose:'WATCH THE NETWORK'},
  {label:'Feed one false detail into the trail and trace who repeats it.',intent:'deception',actionType:'bait_network',skill:'Deception',dc:13,purpose:'BAIT THE NETWORK'}
 ]:[
  {label:`Break ${name}'s trail into independent claims and verify the weakest one first.`,intent:'investigate',actionType:'crosscheck',skill:'Investigation',dc:11,purpose:'VERIFY A LEAD'},
  {label:'Follow the least obvious lead before other hunters notice it.',intent:'action',actionType:'field_shadow',skill:'Survival',dc:12,purpose:'PRESS A QUIET LEAD'},
  {label:'Plant a harmless false detail and watch where it travels.',intent:'deception',actionType:'bait_network',skill:'Deception',dc:13,purpose:'MAP THE NETWORK'}
 ];
 return choice(st,{...pick(byStage,r),contractId:cid});
}
function shipChoice(st,ctx,r){
 const sys=ctx.weakestSystem||{},cid=ctx.contract?.id||null,condition=Math.round(Number(sys.condition??100));
 const labels=condition<80?[ `Repair ${sys.name||'the Raven\'s weakest system'} before the trail turns into a pursuit.`,`Run a focused diagnostic on ${sys.name||'the Raven'} and decide whether the risk is acceptable.`]:['Run a fast Raven readiness check before committing to the next move.','Sweep weapons, shields, and escape systems before pushing the trail harder.'];
 return choice(st,{label:pick(labels,r),intent:'ship',actionType:condition<65?'repair':'diagnostic',systemId:sys.id||null,contractId:cid,skill:'Technical',dc:condition<65?12:10,purpose:'SHIP READINESS'});
}
function missionChoices(data,ctx={}){
 const st=ensure(data),turn=Number(data.story?.director?.turn||0),seed=`${data.created||'deadlock'}|mission|${ctx.contract?.id||'free'}|${ctx.stage?.index||0}|${turn}|${st.sequence}`,r=rng(seed),candidates=[],cid=ctx.contract?.id||null;
 if(ctx.contract?.status==='Completed')candidates.push(choice(st,{label:'Review unresolved leads and choose what becomes the next job.',intent:'bounty',actionType:'review_leads',purpose:'NEXT THREAD'}),shipChoice(st,ctx,r));
 else if(Number(ctx.contract?.progress||0)>=100)candidates.push(choice(st,{label:ctx.target?.name?`Deliver ${ctx.target.name} and complete the handoff.`:'Complete the contract handoff and collect the payout.',intent:'turnin',contractId:cid,purpose:'TURN IN'}),contactChoice(st,ctx,r),shipChoice(st,ctx,r));
 else{
  const rumor=pick(activeRumors(data,4),r),lead=pick(activeLeads(data,4),r);
  if(rumor)candidates.push(rumorChoice(st,rumor,cid,r));
  if(lead)candidates.push(leadChoice(st,lead,cid,r));
  candidates.push(fieldChoice(st,ctx,r),contactChoice(st,ctx,r),locationChoice(st,ctx,r),shipChoice(st,ctx,r));
  if(Number(ctx.stage?.index||1)>=4)candidates.push(fieldChoice(st,{...ctx,turn:turn+7},r));
 }
 const chosen=[],seen=new Set();
 for(const c of candidates.filter(Boolean)){
  const sig=signature(c);if(seen.has(sig))continue;seen.add(sig);
  const recent=st.recentChoices.includes(sig)||st.recentLabels.includes(norm(c.label));
  if(!recent||chosen.length<2)chosen.push(c);
  if(chosen.length>=5)break;
 }
 if(chosen.length<4){for(const c of candidates.filter(Boolean)){if(!chosen.includes(c))chosen.push(c);if(chosen.length>=4)break}}
 return chosen.slice(0,5);
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
 const out=[];for(const c of rows){const sig=signature(c);if(!st.recentChoices.includes(sig)&&!st.recentLabels.includes(norm(c.label)))out.push(c);if(out.length>=5)break}
 if(out.length<4)for(const c of rows){if(!out.includes(c))out.push(c);if(out.length>=4)break}
 return out.slice(0,5);
}
function genericChoices(data,ctx={}){
 const st=ensure(data),r=rng(`${data.created||'deadlock'}|generic|${data.story?.director?.turn||0}|${st.sequence}`),rows=[],rumor=pick(activeRumors(data,4),r),lead=pick(activeLeads(data,4),r);
 if(rumor)rows.push(rumorChoice(st,rumor,ctx.contract?.id||null,r));if(lead)rows.push(leadChoice(st,lead,ctx.contract?.id||null,r));
 rows.push(locationChoice(st,ctx,r),contactChoice(st,ctx,r),fieldChoice(st,ctx,r),shipChoice(st,ctx,r));
 const out=[];for(const c of rows.filter(Boolean)){if(!st.recentLabels.includes(norm(c.label)))out.push(c);if(out.length>=5)break}
 return (out.length>=4?out:rows.filter(Boolean)).slice(0,5);
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
function summary(data){const st=ensure(data);return{version:st.version,recentChoices:st.recentChoices.length,recentLabels:st.recentLabels.length,leads:data.story.proceduralLeads.length,activeRumors:activeRumors(data,99).length,branchMemory:st.branchMemory.length}}
root.DeadlockStoryDirector={schema:SCHEMA,version:VERSION,ensure,recordChoice,missionChoices,dialogueChoices,genericChoices,resolveRumor,activeRumors,activeLeads,contextLine,factOrUpdate,recordReply,summary,_test:{hash,rng,signature,norm,contextVoice}};
})(typeof window!=='undefined'?window:globalThis);
