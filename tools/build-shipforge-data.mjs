import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await readFile(path.join(root,'ship-parts.json'),'utf8'));

if(data.schema!=='deadlock.shipforge.parts.v3')throw new Error('ShipForge v3 catalog required.');
if(!Array.isArray(data.parts)||!data.parts.length)throw new Error('ShipForge catalog has no parts.');

for(const p of data.parts){
 if(!p.id||!p.slot||!p.render?.asset)throw new Error('Part missing v3 render contract: '+JSON.stringify({id:p.id,slot:p.slot,render:p.render}));
 if('visual' in p||'art' in p||'renderProfile' in p)throw new Error('Legacy ShipForge visual fields remain on '+p.id);
 await access(path.join(root,p.render.asset));
}

const catalogJs=`/* Generated from ShipForge parts v3. Do not hand edit. */\n(function(root){root.ShipForgeCatalog=${JSON.stringify(data)};})(typeof window!=="undefined"?window:globalThis);\n`;
await writeFile(path.join(root,'runtime','shipforge-catalog.js'),catalogJs,'utf8');

const runtimeJs=await readFile(path.join(root,'runtime','shipforge.js'),'utf8');
const sandbox={console};vm.createContext(sandbox);
vm.runInContext(catalogJs,sandbox);
vm.runInContext(runtimeJs,sandbox);
const F=sandbox.ShipForge;
if(!F||!/^5\.[3-9]\d*\./.test(F.version))throw new Error('ShipForge v5.3+ hardpoint runtime did not initialize.');
for(const p of data.parts){
 const svg=F.renderPartSVG(p.id,{palette:p.family==='apex'?'black_copper':'slate_cyan'});
 if(!svg.includes(p.render.asset)||svg.includes('assets/ships/components/'))throw new Error('Part render contract failed for '+p.id);
}
console.log(`ShipForge ${F.version} catalog ready: ${data.parts.length} raster-only components; legacy vector generation disabled.`);
