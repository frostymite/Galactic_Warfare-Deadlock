import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await readFile(path.join(root,'ship-parts.json'),'utf8'));
const visuals=JSON.parse(await readFile(path.join(root,'ship-component-visuals.json'),'utf8'));
const catalogJs=`/* Generated from ship-parts.json. Do not hand edit. */\n(function(root){root.ShipForgeCatalog=${JSON.stringify(data)};})(typeof window!=="undefined"?window:globalThis);\n`;
const visualsJs=`/* Generated from ship-component-visuals.json. Do not hand edit. */\n(function(root){root.ShipForgeVisuals=${JSON.stringify(visuals)};})(typeof window!=="undefined"?window:globalThis);\n`;
await writeFile(path.join(root,'runtime','shipforge-catalog.js'),catalogJs,'utf8');
await writeFile(path.join(root,'runtime','shipforge-visuals.js'),visualsJs,'utf8');
const runtimeJs=await readFile(path.join(root,'runtime','shipforge.js'),'utf8');
const sandbox={console};vm.createContext(sandbox);vm.runInContext(catalogJs,sandbox);vm.runInContext(visualsJs,sandbox);vm.runInContext(runtimeJs,sandbox);
const F=sandbox.ShipForge;
for(const p of data.parts){
 const file=path.join(root,p.visual);await mkdir(path.dirname(file),{recursive:true});
 const svg=F.renderPartSVG(p.id,{palette:p.family==='apex'?'black_copper':'slate_cyan',depth:p.renderProfile?.depth});
 await writeFile(file,svg+'\n','utf8');
}
console.log(`ShipForge ${F.version} catalog + ${data.parts.length} 2.5D component vectors generated.`);
