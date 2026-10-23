import {cp, mkdir, rm, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const copyNames=['index.html','styles.css','app.js','character-data.json','galaxy-data.json','asset-manifest.json','scene-data.json','actor-rigs.json','asset-packs.json','ship-parts.json','component-library.html','component-library.css','component-library.js','manifest.webmanifest','sw.js','icons','assets','runtime'];
for(const name of copyNames){const src=path.join(root,name);try{await stat(src);await cp(src,path.join(out,name),{recursive:true})}catch{console.warn('Skipping missing',name)}}
console.log(`Deadlock web bundle ready: ${out}`);
