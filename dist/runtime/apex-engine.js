/* Campaign canon + persistent syndicate state. No real-time advancement. */
(function(root){'use strict';
const name='The 3.2 Apex Protocol';
const people=[
{id:'rovan',name:'Rovan Kes / Deadlock',role:'Founder and leader',status:'Leadership',note:'Your character. Decisions and loyalties remain yours.'},
{id:'jessa',name:'Jessa',role:'Technology and Research',status:'Permanent founding council member',note:'Laboratory work fully funded by Apex. Council membership does not make her a permanent fighter pilot.'},
{id:'sera',name:'Sera',role:'Infiltration / intelligence',status:'Free contact',note:'Implant removed. Independent partner; no automatic permanent membership.'},
{id:'dren',name:'Dren Voss',role:'Convoy cover / interception contact',status:'Trusted paid contact',note:'Proposed 25,000 credits on success for the Rusk operation. Unaccepted and unpaid.'},
{id:'krail',name:'Krail Vox',role:'Boarding / live capture contact',status:'Trusted paid contact',note:'Proposed 25,000 credits on success for the Rusk operation. Unaccepted and unpaid.'},
{id:'nera',name:'Nera Kade',role:'Contract contact',status:'External contact',note:'A business relationship, not established syndicate membership.'}
];
const facilities=[
{id:'lab',name:"Jessa’s Laboratory",status:'Operational',note:'Technology and research, funded by Apex. Jessa holds the permanent council seat.'},
{id:'vault',name:'Isolated Data Vault',status:'Operational',note:'Research and sensitive records kept isolated. Blackwake’s blueprint is archived; the real Varo wafer remains aboard the personal ship.'},
{id:'armory',name:'Armory & Weapons Workshop',status:'Operational',note:'Established weapon storage, workshop and test chamber. No new weapons or ammunition are granted by viewing this record.'},
{id:'hangar',name:'Main Hangar',status:'Operational',note:'Two repair positions and two flight-ready Kestrel F-4 interceptors, 128 and 129. Permanent pilots unappointed.'},
{id:'defenses',name:'Station Defenses',status:'Rebuilt',note:'Defended access routes, turrets, sensors and lockdowns protect the asteroid installation.'},
{id:'expansion',name:'Expansion Cavern',status:'Reserved for later',note:'Potential cargo berth. Fighters were the priority; no cargo fleet or completed expansion is established.'}
];
const memory=[`${name} is Rovan Kes / Deadlock’s syndicate and bounty-hunter clan. Rovan is its founder and leader.`,
'Blackglass Station is owned by Apex: an asteroid-buried repair installation bought with two Kestrel F-4 fighters for 650,000 credits. Only its armored docking throat breaks the rock.',
'Jessa is the permanent founding council member for Technology and Research; her lab work is fully funded. Sera is a free intelligence contact. Dren and Krail are trusted paid contacts, not appointed members. Nera is a contract contact.',
'Kestrel F-4 interceptors 128 and 129 are flight-ready. Permanent pilots remain unappointed. No fighter deployment or partner-fee acceptance is implied.',
'Apex reserve and personal credits are separate. Recovered snapshot: Apex 1,420,000; Rovan 358,400. Current saved balances take precedence after play.',
'The name 3.2 commemorates the successful 3.2-million-credit heist. A formal council charter and exact original star-system coordinates have not been established.'];
function ensure(d){if(!d.apex){d.apex={version:1,name,origin:'Named for the successful 3.2-million-credit heist.',leader:'rovan',home:'blackglass_station',reserve:1420000,public:false,ledger:[],sequence:0,publicJobs:[],standing:0,briefRecent:[],briefIndex:0,baseline:{personal:358400,reserve:1420000},migrationPersonal:d.character.credits};}
const a=d.apex;d.character.affiliation=name;d.character.commandRole='Founder and leader';
if(!a.canonApplied){for(const person of people.filter(p=>p.id!=='rovan')){let c=d.contacts.find(c=>c.id===person.id);if(c){c.role=person.role;c.apexStatus=person.status;if(!(c.notes||'').includes(person.note))c.notes=(c.notes||'')+' '+person.note;}else d.contacts.push({id:person.id,name:person.name,role:person.role,trust:50,apexStatus:person.status,notes:person.note});}
const j=d.story.npcs?.find(n=>n.id==='jessa');if(j){j.role='Technology and Research council member';j.relationship='Permanent founding council member';}
d.story.campaignMemory=d.story.campaignMemory.filter(m=>m!=='Jessa is a gunner / ally.');for(const m of memory)if(!d.story.campaignMemory.includes(m))d.story.campaignMemory.push(m);a.canonApplied=true;}return a;}
function log(a,text,delta=0){a.ledger.push({id:++a.sequence,text,delta,balance:a.reserve});a.ledger=a.ledger.slice(-100);}
function transfer(d,direction,amount){const a=ensure(d);if(!['deposit','withdraw'].includes(direction)||!Number.isSafeInteger(amount)||amount<=0)return {ok:false,message:'Enter a positive whole-credit amount.'};const from=direction==='deposit'?d.character.credits:a.reserve,to=direction==='deposit'?a.reserve:d.character.credits;if(!Number.isSafeInteger(from)||from<amount)return {ok:false,message:'Insufficient funds in the source account.'};if(!Number.isSafeInteger(to+amount))return {ok:false,message:'That amount exceeds the account limit.'};const delta=direction==='deposit'?amount:-amount;a.reserve+=delta;d.character.credits-=delta;log(a,direction==='deposit'?'Rovan transferred personal funds to Apex.':'Apex transferred funds to Rovan.',delta);return {ok:true,message:`Transferred ${amount.toLocaleString()} credits. Both balances are saved.`};}
function sign(d,job){const a=ensure(d);job.apexSigned=!!a.public;return job.apexSigned;}
function closeJob(d,record){const a=ensure(d);if(!record?.apexSigned||a.publicJobs.includes(record.id))return false;a.publicJobs.push(record.id);const bad=['side','bury','sell','withdrawn'].includes(record.resolution);a.standing=Math.max(-100,Math.min(100,a.standing+(bad?-1:1)));if(record.reward){a.reserve+=record.reward;log(a,`${record.title}: ${record.resolution}. Apex contract payment.`,record.reward);}else log(a,`${record.title}: ${record.resolution}. No payment.`);return true;}
function brief(d){const a=ensure(d),j=d.lowerPort?.active;const pool=[
`Blackglass is yours, Rovan. The lab is funded and the data vault remains isolated.`,
'The fighters are flight-ready. Neither has a permanent pilot, so I have issued no launch orders.',
'Your personal account and the Apex reserve remain separate. Check the ledger before authorizing a transfer.',
j?`Your field case is ${j.title}. ${j.ready?'The work is finished; close it at the Landing Bay.':'Bring back evidence before choosing the final approach.'}`:'No Lower Port case is active. Local opportunities stay available until you choose one.',
a.public?'You are signing new Lower Port contracts as Apex. Their payouts go to the reserve.':'You are taking new Lower Port contracts personally. I will not announce your affiliation to strangers.',
a.publicJobs.length?`${a.publicJobs.length} Apex field cases are closed. Their outcomes are recorded, including withdrawals.`:'No Apex field cases are closed yet. The founding record is intact.',
'Dren and Krail have proposed terms for Rusk. Those terms remain unaccepted; I have not paid them.',
'Sera is a free contact. Being an ally does not put her under our command.',
'Three point two million credits. That heist gave the Protocol its name. Blackglass is what we built afterward.'];const candidates=pool.filter(x=>!a.briefRecent.includes(x));const line=candidates[(a.briefIndex++)%candidates.length];a.briefRecent.push(line);a.briefRecent=a.briefRecent.slice(-3);return line;}
root.ApexEngine={name,people,facilities,memory,ensure,transfer,sign,closeJob,brief};
})(typeof window==='undefined'?globalThis:window);
