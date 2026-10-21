const fs=require('fs'),path=require('path');
let checks=0,fail=[];const ok=(name,v,detail)=>{checks++;if(!v)fail.push({name,detail})};
const root=path.join(__dirname,'..');
const spec=JSON.parse(fs.readFileSync(path.join(root,'raven-visual-zones.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'ship-parts.json'),'utf8'));
const world=fs.readFileSync(path.join(root,'runtime/shipforge-world.js'),'utf8');

ok('visual spec schema',spec.schema==='deadlock.raven.visual-zones.v1',spec.schema);
ok('Raven class is light freighter',spec.ship?.classId==='light_freighter',spec.ship);
ok('Raven registry preserved',spec.ship?.registry==='RVN-DL-01',spec.ship?.registry);
ok('resolver uses ShipForge source of truth',/DeadlockShipForge\.blueprint/.test(spec.resolver?.sourceOfTruth||''),spec.resolver);
ok('legacy static path identified',spec.runtimeTargets?.currentStaticFunction==='app.js::ravenVisual(state)',spec.runtimeTargets);

const compatible=catalog.parts.filter(p=>p.compatible.includes('light_freighter')||p.compatible.includes('universal'));
const mapped=spec.partMap||{};
ok('all compatible parts mapped',compatible.every(p=>mapped[p.id]),compatible.filter(p=>!mapped[p.id]).map(p=>p.id));
ok('no extra unknown mapped parts',Object.keys(mapped).every(id=>catalog.parts.some(p=>p.id===id)),Object.keys(mapped).filter(id=>!catalog.parts.some(p=>p.id===id)));
ok('mapped part count matches compatible catalog',Object.keys(mapped).length===compatible.length,{mapped:Object.keys(mapped).length,compatible:compatible.length});

for(const p of compatible){
 const m=mapped[p.id];
 ok('slot matches '+p.id,m?.slot===p.slot,{expected:p.slot,actual:m?.slot});
 ok('hero layer contract '+p.id,typeof m?.ravenHeroLayer==='string'&&m.ravenHeroLayer.includes('/hero_3q/'),m?.ravenHeroLayer);
 ok('hero path uses part id '+p.id,m?.ravenHeroLayer?.includes('/'+p.id+'.webp'),m?.ravenHeroLayer);
}

const slots=['core','cockpit','wing','engine','weapon','cargo','utility'];
for(const slot of slots){
 const count=compatible.filter(p=>p.slot===slot).length;
 ok('zone covers slot '+slot,!!Object.values(spec.zones||{}).find(z=>z.slot===slot),spec.zones);
 ok('mapped slot count '+slot,Object.values(mapped).filter(x=>x.slot===slot).length===count,{mapped:Object.values(mapped).filter(x=>x.slot===slot).length,catalog:count});
}

const utility=compatible.filter(p=>p.slot==='utility');
ok('all utility designs have subzones',utility.every(p=>mapped[p.id]?.subzone),utility.filter(p=>!mapped[p.id]?.subzone).map(p=>p.id));
const allowedUtility=new Set(Object.keys(spec.utilitySubzoneRules||{}));
ok('utility subzones valid',utility.every(p=>allowedUtility.has(mapped[p.id]?.subzone)),utility.map(p=>({id:p.id,subzone:mapped[p.id]?.subzone})).filter(x=>!allowedUtility.has(x.subzone)));

const expectedCurrent={
 core:'core_twinboom_09',cockpit:'cockpit_armored_05',wing:'wing_outrigger_09',engine:'engine_military_06',
 weapon:'weapon_rotary_09',cargo:'cargo_modular_08',utility:'utility_smuggler_06'
};
ok('machine spec current loadout matches known Raven baseline',JSON.stringify(spec.currentLoadout)===JSON.stringify(expectedCurrent),spec.currentLoadout);
for(const [slot,id] of Object.entries(expectedCurrent)){
 ok('current loadout mapped '+slot,!!mapped[id],{slot,id});
 ok('current loadout slot '+slot,mapped[id]?.slot===slot,mapped[id]);
}

const ravenConst=world.match(/const RAVEN_PARTS=\{([\s\S]*?)\};/);
ok('runtime Raven parts constant found',!!ravenConst);
if(ravenConst){
 const runtime={};
 for(const m of ravenConst[1].matchAll(/(core|cockpit|wing|engine|weapon|cargo|utility):'([^']+)'/g))runtime[m[1]]=m[2];
 ok('runtime Raven baseline matches visual spec',JSON.stringify(runtime)===JSON.stringify(expectedCurrent),{runtime,expectedCurrent});
}

ok('hero renderer gate requires full coverage',spec.coverage?.hero_3q?.requiredAllCompatibleParts===true,spec.coverage?.hero_3q);
ok('hero coverage count correct',Number(spec.coverage?.hero_3q?.partCount)===compatible.length,{declared:spec.coverage?.hero_3q?.partCount,actual:compatible.length});
ok('hero view fixed master canvas',JSON.stringify(spec.views?.hero_3q?.master)==='[1536,1024]',spec.views?.hero_3q);
ok('hero view is required first',spec.views?.hero_3q?.requiredForRenderer===true,spec.views?.hero_3q);
ok('identity rule is 70/30',spec.design?.identityRule==='70/30',spec.design?.identityRule);
ok('legacy fallback list includes current cutout',spec.legacyAssetsToReplace?.includes('assets/ships/raven_cutout_v15.svg'),spec.legacyAssetsToReplace);
ok('damage derived from component condition',/component instance condition/.test(spec.zones?.local_damage?.source||''),spec.zones?.local_damage);
ok('palette derived from ship state',/ship\.palette/.test(spec.zones?.paint_markings?.source||''),spec.zones?.paint_markings);

const result={checks,passed:checks-fail.length,failed:fail.length,failures:fail,compatibleParts:compatible.length,slotCounts:Object.fromEntries(slots.map(s=>[s,compatible.filter(p=>p.slot===s).length]))};
fs.writeFileSync(path.join(__dirname,'raven-visual-spec-results.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(fail.length)process.exit(1);
