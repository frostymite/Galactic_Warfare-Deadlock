import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await readFile(path.join(root,'ship-parts.json'),'utf8'));
const visuals=JSON.parse(await readFile(path.join(root,'ship-component-visuals.json'),'utf8'));
await writeFile(path.join(root,'runtime','shipforge-catalog.js'),`/* Generated from ship-parts.json. Do not hand edit. */\n(function(root){root.ShipForgeCatalog=${JSON.stringify(data)};})(typeof window!=="undefined"?window:globalThis);\n`,'utf8');
await writeFile(path.join(root,'runtime','shipforge-visuals.js'),`/* Generated from ship-component-visuals.json. Do not hand edit. */\n(function(root){root.ShipForgeVisuals=${JSON.stringify(visuals)};})(typeof window!=="undefined"?window:globalThis);\n`,'utf8');
const defaults='style="--sf-hull:#28343a;--sf-trim:#63737a;--sf-accent:#42e7ff;--sf-dark:#0a1115"';
for(const p of data.parts){
 const frag=visuals.visuals[p.id];if(!frag)throw new Error(`Missing visual for ${p.id}`);
 const file=path.join(root,p.visual);await mkdir(path.dirname(file),{recursive:true});
 const label=String(p.name||p.id).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 await writeFile(file,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 80" role="img" aria-label="${label}" ${defaults}><g stroke-width="1.5" stroke-linejoin="round">${frag}</g></svg>\n`,'utf8');
}
console.log(`ShipForge catalog + ${data.parts.length} component vectors generated.`);
