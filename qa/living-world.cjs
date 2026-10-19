const fs=require('fs'),vm=require('vm');
let checks=0,fail=[];const ok=(name,v)=>{checks++;if(!v)fail.push(name)};
function hashSeed(v){let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const classes={fighter:{label:'Fighter'},shuttle:{label:'Shuttle'},light_freighter:{label:'Light Freighter'},freighter:{label:'Freighter'},cargo:{label:'Cargo Vessel'},patrol:{label:'Patrol Craft'}};
global.ShipForge={hashSeed,catalog:{classes},renderMarkup:(bp)=>`<svg data-class="${bp.classId}"></svg>`};
global.DeadlockShipForge={trafficPopulation:(data,key,count,classIds)=>{data.shipForge=data.shipForge||{traffic:{}};data.shipForge.traffic=data.shipForge.traffic||{};data.shipForge.traffic[key]=data.shipForge.traffic[key]||[];while(data.shipForge.traffic[key].length<count){const i=data.shipForge.traffic[key].length,id=`ship-${hashSeed(key+'|'+i).toString(16)}`;data.shipForge.traffic[key].push(id)}return data.shipForge.traffic[key].slice(0,count).map((id,i)=>({record:{id},blueprint:{id,classId:classIds[i%classIds.length]||'light_freighter'}}))}};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'../runtime/living-world.js'),'utf8'));
const L=global.DeadlockLivingWorld;
const campaign={created:'test-campaign',galaxyState:{currentLocationId:'veyra_prime'}};
ok('engine exposed',!!L);ok('schema set',L.schema==='deadlock.living-world.v1');
const urban={page:'Story',presetId:'urban',preset:{theme:'urban'},loc:{id:'veyra_prime'}};
const p1=L.ensurePopulation(campaign,urban,9),ids1=p1.npcs.map(x=>x.id);const p2=L.ensurePopulation(campaign,urban,9),ids2=p2.npcs.map(x=>x.id);
ok('persistent ids',JSON.stringify(ids1)===JSON.stringify(ids2));ok('nine persistent people',ids1.length===9);ok('unique ids',new Set(ids1).size===ids1.length);ok('names generated',p1.npcs.every(n=>typeof n.name==='string'&&n.name.length>=2));ok('roles generated',p1.npcs.every(n=>p1.profile.roles.includes(n.role)));ok('depth valid',p1.npcs.every(n=>['far','mid','near'].includes(n.depth)));ok('behaviors valid',p1.npcs.every(n=>p1.profile.behaviors.includes(n.behavior)));ok('species valid',p1.npcs.every(n=>['humanoid','hooded','lekku','horned','helmeted','droid'].includes(n.species)));
const markup=L.sceneMarkup(campaign,urban,9);ok('population markup',markup.includes('lw-population'));ok('articulated rigs',markup.includes('lw-arm')&&markup.includes('lw-leg'));ok('multiple depth layers',markup.includes('depth-far')&&markup.includes('depth-mid')&&markup.includes('depth-near'));
const portScenes=['landing','market','cantina','tunnels','hideout'];for(const scene of portScenes){const ctx=L.portContext(scene),p=L.ensurePopulation(campaign,ctx,6);ok(`port profile ${scene}`,p.profile===L.profiles[`port:${scene}`]);const html=L.portMarkup(campaign,{},scene);ok(`port markup ${scene}`,html.includes('lw-port-world'));}
const t=L.trafficMarkup(campaign,{page:'Story',presetId:'urban',preset:{theme:'urban'},loc:{id:'veyra_prime'}},6);ok('shipforge traffic rendered',(t.match(/lw-ship/g)||[]).length>=6);ok('traffic persisted',Object.keys(campaign.shipForge.traffic).some(k=>k.startsWith('lw|')));ok('flight modes generated',/lw-ship-(cruise|approach|depart|landing)/.test(t));
const combat=L.trafficMarkup(campaign,{page:'Combat',presetId:'combat',preset:{theme:'combat'},loc:{id:'veyra_prime'}},4);ok('no ambient traffic in combat',combat==='');
const hq=L.ensurePopulation(campaign,{page:'HQ',presetId:'blackglass_hangar',preset:{theme:'hq',room:'hangar'},loc:{id:'blackglass_station'}},10);ok('hangar populated',hq.npcs.length===10);ok('hangar roles specific',hq.npcs.every(n=>L.profiles.blackglass_hangar.roles.includes(n.role)));
const before=L.consumeDirty(campaign),after=L.consumeDirty(campaign);ok('dirty consumed',before===true&&after===false);
const summary=L.summary(campaign);ok('summary scenes',summary.scenes>=6);ok('summary npc count',summary.npcs>=9);ok('summary traffic scenes',summary.trafficScenes>=1);
// Deterministic persistence stress across many scene keys.
for(let i=0;i<120;i++){
 const ctx={page:'Story',presetId:i%2?'veyra_upper':'veyra_undercity',preset:{theme:'urban'},loc:{id:'veyra_prime'},room:'zone'+i};
 const a=L.ensurePopulation(campaign,ctx,7).npcs.map(n=>n.id).join('|');
 const b=L.ensurePopulation(campaign,ctx,7).npcs.map(n=>n.id).join('|');
 ok(`stress persist ${i}`,a===b);
}
const result={checks,passed:checks-fail.length,failed:fail.length,failures:fail,summary:L.summary(campaign)};
fs.writeFileSync(require('path').join(__dirname,'living-world-results.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));if(fail.length)process.exit(1);
