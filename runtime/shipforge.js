/* Deadlock ShipForge v5 — raster-only modular renderer.
 * Active visuals come only from ship-parts.json -> part.render.asset.
 * Legacy SVG fragments and component vectors are intentionally unsupported.
 */
(function(root){
'use strict';
const C=root.ShipForgeCatalog;
if(!C)throw new Error('ShipForgeCatalog must load before ShipForge');
if(C.schema!=='deadlock.shipforge.parts.v3')throw new Error('ShipForge parts v3 catalog required');
const slots=['core','cockpit','wing','engine','weapon','cargo','utility'];
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function hashSeed(v){if(Number.isFinite(v))return(Number(v)>>>0)||1;let h=2166136261>>>0;for(const ch of String(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h||1;}
function rng(seed){let s=hashSeed(seed);return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function pick(a,r){return a[Math.min(a.length-1,Math.floor(r()*a.length))];}
function part(id){return C.parts.find(p=>p.id===id)||null;}
function palette(id){return C.palettes.find(p=>p.id===id)||C.palettes[0];}
function asset(p){const a=p?.render?.asset;if(!a)throw new Error('Missing ShipForge raster asset for '+(p?.id||'unknown'));return a;}
function mountFits(p,classId){const cls=C.classes[classId];if(!cls)return false;const pm=p.mounts||[p.mount];return pm.some(m=>cls.mounts.includes(m));}
function compatible(p,classId){return !!p&&(p.compatible.includes('universal')||p.compatible.includes(classId))&&mountFits(p,classId);}
function candidates(classId,slot){return C.parts.filter(p=>p.slot===slot&&compatible(p,classId));}
function required(cls,slot){return cls.required.includes(slot);}
function stats(ship){const out={mass:0,armor:0,speed:0,power:0,damage:0,capacity:0,sensors:0,utility:0,value:0};for(const id of Object.values(ship.parts||{})){const p=part(id);if(!p)continue;for(const k of Object.keys(out))if(k!=='value')out[k]+=Number(p[k]||0);out.value+=Number(p.credits||0);}return out;}
function signature(ship){return[ship.classId,ship.palette,...slots.map(s=>ship.parts?.[s]||'-'),ship.markings].join('|');}
function validate(ship){const errors=[],cls=C.classes[ship?.classId];if(!cls)return{valid:false,errors:['unknown class']};for(const slot of cls.required)if(!ship.parts?.[slot])errors.push('missing '+slot);for(const[slot,id]of Object.entries(ship.parts||{})){const p=part(id);if(!p)errors.push('unknown part '+id);else if(p.slot!==slot)errors.push(id+' in wrong slot '+slot);else if(!cls.slots.includes(slot))errors.push(slot+' unavailable on '+ship.classId);else if(!compatible(p,ship.classId))errors.push(id+' incompatible with '+ship.classId+' mount set');else if(!p.render?.asset)errors.push(id+' missing raster render asset');}return{valid:errors.length===0,errors};}
function generate(seed=1,classId='light_freighter',overrides={}){
 if(!C.classes[classId])throw new Error('Unknown ship class: '+classId);
 const cls=C.classes[classId],r=rng(seed),parts={};
 for(const slot of cls.slots){
  const list=candidates(classId,slot);if(!list.length)continue;
  const include=required(cls,slot)||slot==='wing'&&r()>.18||slot==='weapon'&&r()>.30||slot==='cargo'&&r()>.24||slot==='utility'&&r()>.22;
  if(include)parts[slot]=pick(list,r).id;
 }
 for(const [slot,id]of Object.entries(overrides.parts||{})){const p=part(id);if(p&&cls.slots.includes(slot)&&p.slot===slot&&compatible(p,classId))parts[slot]=id;}
 const pal=overrides.palette||pick(C.palettes,r).id;
 const ship={schema:'deadlock.shipforge.ship.v2',id:overrides.id||('sf-'+classId+'-'+hashSeed(seed).toString(16).padStart(8,'0')),classId,seed:hashSeed(seed),palette:pal,parts,markings:overrides.markings??Math.floor(r()*6),wear:overrides.wear??Math.floor(r()*5),registry:overrides.registry||null};
 ship.stats=stats(ship);ship.signature=signature(ship);return ship;
}
function componentViewBox(slot){return({core:'8 8 168 68',cockpit:'105 15 70 50',wing:'22 2 142 76',engine:'2 15 62 55',weapon:'78 8 99 64',cargo:'38 5 112 70',utility:'55 0 105 70'})[slot]||'0 0 180 88';}
function defs(uid){return '<defs><filter id="'+uid+'shadow" x="-30%" y="-40%" width="180%" height="200%"><feDropShadow dx="-2" dy="4" stdDeviation="2.7" flood-color="#000" flood-opacity=".78"/></filter><filter id="'+uid+'glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter></defs>';}
function renderPartSVG(id,opts={}){
 const p=part(id);if(!p)throw new Error('Unknown component '+id);
 const uid='sf'+hashSeed(id).toString(16),href=esc(asset(p)),view=componentViewBox(p.slot);
 return '<svg class="shipforge-svg shipforge-component sf-raster-component" viewBox="'+view+'" role="img" aria-label="'+esc(p.name||p.id)+'" preserveAspectRatio="xMidYMid meet" data-part-id="'+esc(p.id)+'" data-render-engine="raster-v5">'+defs(uid)+'<g filter="url(#'+uid+'shadow)"><image class="sf-raster-art" href="'+href+'" x="0" y="0" width="180" height="88" preserveAspectRatio="xMidYMid meet"/></g></svg>';
}
function renderSVG(ship,opts={}){
 const v=validate(ship);if(!v.valid)throw new Error('Invalid ShipForge ship: '+v.errors.join(', '));
 const label=opts.label||C.classes[ship.classId].label,pal=palette(ship.palette),uid='sfship'+hashSeed(signature(ship)).toString(16);
 const order=['wing','cargo','core','engine','cockpit','weapon','utility'];
 const opacity={wing:.98,cargo:.98,core:1,engine:1,cockpit:1,weapon:1,utility:1};
 const layers=order.map(slot=>{const id=ship.parts?.[slot],p=id&&part(id);if(!p)return'';return '<g class="sf-part-raster sf-slot-'+slot+'" data-part-id="'+esc(id)+'" data-sf-slot="'+slot+'" opacity="'+opacity[slot]+'"><image class="sf-raster-art" href="'+esc(asset(p))+'" x="0" y="0" width="180" height="88" preserveAspectRatio="xMidYMid meet"/></g>';}).join('');
 const marks=Number(ship.markings||0)%6;
 return '<svg class="shipforge-svg sf-raster-assembly" viewBox="0 0 180 88" role="img" aria-label="'+esc(label)+'" preserveAspectRatio="xMidYMid meet" data-render-engine="raster-v5">'+defs(uid)+'<g filter="url(#'+uid+'shadow)">'+layers+'</g><g class="sf-markings" opacity=".65"><path d="M62 '+(34+marks)+'h47" stroke="'+esc(pal.trim)+'" stroke-width="1.5"/><circle cx="118" cy="40" r="1.7" fill="'+esc(pal.accent)+'"/></g></svg>';
}
function renderMarkup(ship,opts={}){const cls=['shipforge-ship','shipforge-raster-v5','shipforge-'+ship.classId,opts.className||''].filter(Boolean).join(' ');return '<span class="'+esc(cls)+'" data-shipforge-id="'+esc(ship.id)+'" data-ship-class="'+esc(ship.classId)+'" data-ship-seed="'+ship.seed+'" data-render-engine="raster-v5">'+renderSVG(ship,opts)+'</span>';}
function population(seed,count=4,classIds=['fighter','shuttle','light_freighter','freighter','cargo','patrol']){const r=rng(seed),out=[];for(let i=0;i<count;i++){const c=classIds[Math.floor(r()*classIds.length)]||'light_freighter';out.push(generate((hashSeed(seed)+Math.imul(i+1,2654435761))>>>0,c));}return out;}
function clone(ship){return generate(ship.seed,ship.classId,{id:ship.id,palette:ship.palette,parts:{...ship.parts},markings:ship.markings,wear:ship.wear,registry:ship.registry});}
function componentSummary(){return Object.fromEntries(slots.map(s=>[s,C.parts.filter(p=>p.slot===s).length]));}
root.ShipForge={version:'5.0.0',presentation:'raster-only-three-quarter',catalog:C,generate,population,validate,signature,stats,renderSVG,renderPartSVG,renderMarkup,clone,part,candidates,compatible,mountFits,hashSeed,componentSummary};
})(typeof window!=='undefined'?window:globalThis);
