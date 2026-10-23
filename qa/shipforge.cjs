const fs=require('fs'),vm=require('vm'),path=require('path');
const sandbox={console};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('runtime/shipforge-catalog.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('runtime/shipforge.js','utf8'),sandbox);
const F=sandbox.ShipForge,results=[];
const check=(label,pass,detail)=>{results.push({label,pass:!!pass,detail});if(!pass)throw Error(label+': '+JSON.stringify(detail))};
try{
 check('v3 component schema loads',F.catalog.schema==='deadlock.shipforge.parts.v3',F.catalog.schema);
 check('ShipForge v5 raster-only renderer loads',F.version==='5.0.0'&&F.presentation==='raster-only-three-quarter',{version:F.version,presentation:F.presentation});
 const classes=Object.keys(F.catalog.classes);
 check('six ship classes available',classes.length===6,classes);
 check('64 active components available',F.catalog.parts.length===64,F.componentSummary());
 check('legacy visual fields are completely absent',F.catalog.parts.every(p=>!('visual'in p)&&!('art'in p)&&!('renderProfile'in p)),F.catalog.parts.filter(p=>'visual'in p||'art'in p||'renderProfile'in p).map(p=>p.id));
 check('every component uses raster-only render contract',F.catalog.parts.every(p=>p.render?.engine==='raster'&&p.render?.asset?.endsWith('.webp')&&p.render?.version==='17.14.0'),F.catalog.parts.filter(p=>!p.render?.asset).map(p=>p.id));
 check('every raster asset exists',F.catalog.parts.every(p=>fs.existsSync(path.join('.',p.render.asset))),F.catalog.parts.filter(p=>!fs.existsSync(path.join('.',p.render.asset))).map(p=>p.id));
 check('every component keeps commerce metadata',F.catalog.parts.every(p=>p.name&&p.manufacturer&&p.credits>0&&p.rarity&&p.mounts?.length),F.catalog.parts.filter(p=>!p.credits).map(p=>p.id));
 const slotCounts=F.componentSummary();check('all seven slots have useful variety',Object.values(slotCounts).every(n=>n>=8),slotCounts);
 for(const p of F.catalog.parts){
  const svg=F.renderPartSVG(p.id,{palette:p.family==='apex'?'black_copper':'slate_cyan'});
  check('raster render '+p.id,svg.startsWith('<svg')&&svg.includes(p.render.asset)&&svg.includes('data-render-engine="raster-v5"'),p.render.asset);
  check('no legacy vector path '+p.id,!svg.includes('assets/ships/components/')&&!svg.includes('sf-generated-art')&&!svg.includes('ShipForgeVisuals'),svg.slice(0,400));
 }
 let generated=0,invalid=0;const signatures=new Set();
 for(const classId of classes){
  for(let seed=1;seed<=75;seed++){
   const a=F.generate(seed,classId),b=F.generate(seed,classId);generated++;
   check('deterministic '+classId+' '+seed,JSON.stringify(a)===JSON.stringify(b));
   const v=F.validate(a);if(!v.valid)invalid++;
   check('compatible '+classId+' '+seed,v.valid,v.errors);
   for(const id of Object.values(a.parts)){
    const p=F.part(id);check('mount fit '+id+' '+classId,F.mountFits(p,classId),{id,classId,mounts:p.mounts,classMounts:F.catalog.classes[classId].mounts});
   }
   check('required slots '+classId+' '+seed,F.catalog.classes[classId].required.every(x=>a.parts[x]),a.parts);
   const svg=F.renderSVG(a);
   check('ship raster assembly '+classId+' '+seed,svg.startsWith('<svg')&&svg.includes('sf-raster-assembly')&&svg.includes('data-render-engine="raster-v5"'));
   check('ship assembly has no legacy vectors '+classId+' '+seed,!svg.includes('assets/ships/components/')&&!svg.includes('ShipForgeVisuals'));
   signatures.add(a.signature);
  }
 }
 check('all generated ships valid',invalid===0,{generated,invalid});
 check('procedural generation produces variety',signatures.size>150,signatures.size);
 const result={results,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,generated,uniqueSignatures:signatures.size,slotCounts};
 fs.writeFileSync('qa/shipforge-results.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({passed:result.passed,failed:result.failed,generated,uniqueSignatures:signatures.size,slotCounts}));
}catch(e){
 results.push({label:'suite execution',pass:false,detail:e.stack});
 fs.writeFileSync('qa/shipforge-results.json',JSON.stringify({results,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length},null,2));
 console.error(e);process.exitCode=1;
}
