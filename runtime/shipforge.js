/* Deadlock ShipForge v2: deterministic modular assembly driven by reusable component vectors. */
(function(root){
'use strict';
const C=root.ShipForgeCatalog,V=root.ShipForgeVisuals;
if(!C)throw new Error('ShipForgeCatalog must load before ShipForge');
if(!V)throw new Error('ShipForgeVisuals must load before ShipForge');
const slots=['core','cockpit','wing','engine','weapon','cargo','utility'];
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function hashSeed(v){if(Number.isFinite(v))return(Number(v)>>>0)||1;let h=2166136261>>>0;for(const ch of String(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h||1;}
function rng(seed){let s=hashSeed(seed);return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function pick(a,r){return a[Math.min(a.length-1,Math.floor(r()*a.length))];}
function part(id){return C.parts.find(p=>p.id===id)||null;}
function palette(id){return C.palettes.find(p=>p.id===id)||C.palettes[0];}
function mountFits(p,classId){const cls=C.classes[classId];if(!cls)return false;const pm=p.mounts||[p.mount];return pm.some(m=>cls.mounts.includes(m));}
function compatible(p,classId){return !!p&&(p.compatible.includes('universal')||p.compatible.includes(classId))&&mountFits(p,classId);}
function candidates(classId,slot){return C.parts.filter(p=>p.slot===slot&&compatible(p,classId));}
function required(cls,slot){return cls.required.includes(slot);}
function generate(seed=1,classId='light_freighter',overrides={}){
 if(!C.classes[classId])throw new Error('Unknown ship class: '+classId);
 const cls=C.classes[classId],r=rng(seed),parts={};
 for(const slot of cls.slots){const list=candidates(classId,slot);if(!list.length)continue;const include=required(cls,slot)||slot==='wing'&&r()>.18||slot==='weapon'&&r()>.30||slot==='cargo'&&r()>.24||slot==='utility'&&r()>.22;if(include)parts[slot]=pick(list,r).id;}
 for(const [slot,id]of Object.entries(overrides.parts||{})){const p=part(id);if(p&&cls.slots.includes(slot)&&p.slot===slot&&compatible(p,classId))parts[slot]=id;}
 const pal=overrides.palette||pick(C.palettes,r).id;
 const ship={schema:'deadlock.shipforge.ship.v2',id:overrides.id||`sf-${classId}-${hashSeed(seed).toString(16).padStart(8,'0')}`,classId,seed:hashSeed(seed),palette:pal,parts,markings:overrides.markings??Math.floor(r()*6),wear:overrides.wear??Math.floor(r()*5),registry:overrides.registry||null};
 ship.stats=stats(ship);ship.signature=signature(ship);return ship;
}
function stats(ship){const out={mass:0,armor:0,speed:0,power:0,damage:0,capacity:0,sensors:0,utility:0,value:0};for(const id of Object.values(ship.parts||{})){const p=part(id);if(!p)continue;for(const k of Object.keys(out))if(k!=='value')out[k]+=Number(p[k]||0);out.value+=Number(p.credits||0);}return out;}
function signature(ship){return[ship.classId,ship.palette,...slots.map(s=>ship.parts?.[s]||'-'),ship.markings].join('|');}
function validate(ship){const errors=[],cls=C.classes[ship?.classId];if(!cls)return{valid:false,errors:['unknown class']};for(const slot of cls.required)if(!ship.parts?.[slot])errors.push('missing '+slot);for(const[slot,id]of Object.entries(ship.parts||{})){const p=part(id);if(!p)errors.push('unknown part '+id);else if(p.slot!==slot)errors.push(`${id} in wrong slot ${slot}`);else if(!cls.slots.includes(slot))errors.push(`${slot} unavailable on ${ship.classId}`);else if(!compatible(p,ship.classId))errors.push(`${id} incompatible with ${ship.classId} mount set`);}return{valid:errors.length===0,errors};}
function visual(id){return V.visuals[id]||'';}
function vars(pal){return`--sf-hull:${pal.hull};--sf-trim:${pal.trim};--sf-accent:${pal.accent};--sf-dark:${pal.dark}`;}
function renderPartSVG(id,opts={}){const p=part(id);if(!p)throw new Error('Unknown component '+id);const pal=palette(opts.palette||'slate_cyan');return`<svg class="shipforge-svg shipforge-component" viewBox="0 0 180 80" role="img" aria-label="${esc(p.name||p.id)}" style="${vars(pal)}"><g stroke-width="1.5" stroke-linejoin="round">${visual(id)}</g></svg>`;}
function renderSVG(ship,opts={}){const v=validate(ship);if(!v.valid)throw new Error('Invalid ShipForge ship: '+v.errors.join(', '));const pal=palette(ship.palette),scale=Number(C.classes[ship.classId].scale||1),label=opts.label||C.classes[ship.classId].label,marks=Number(ship.markings||0)%6;const order=['wing','core','cargo','engine','cockpit','weapon','utility'];return`<svg class="shipforge-svg" viewBox="0 0 180 80" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid meet" style="${vars(pal)};--ship-class-scale:${scale}"><g stroke-width="1.5" stroke-linejoin="round">${order.map(s=>ship.parts?.[s]?visual(ship.parts[s]):'').join('')}<path d="M62 ${34+marks}h47" stroke="var(--sf-trim)" stroke-width="2" opacity=".42"/><circle cx="118" cy="40" r="2" fill="var(--sf-accent)"/></g></svg>`;}
function renderMarkup(ship,opts={}){const cls=['shipforge-ship',`shipforge-${ship.classId}`,opts.className||''].filter(Boolean).join(' ');return`<span class="${esc(cls)}" data-shipforge-id="${esc(ship.id)}" data-ship-class="${esc(ship.classId)}">${renderSVG(ship,opts)}</span>`;}
function population(seed,count=4,classIds=['fighter','shuttle','light_freighter','freighter','cargo','patrol']){const r=rng(seed),out=[];for(let i=0;i<count;i++){const c=classIds[Math.floor(r()*classIds.length)]||'light_freighter';out.push(generate((hashSeed(seed)+Math.imul(i+1,2654435761))>>>0,c));}return out;}
function clone(ship){return generate(ship.seed,ship.classId,{id:ship.id,palette:ship.palette,parts:{...ship.parts},markings:ship.markings,wear:ship.wear,registry:ship.registry});}
function componentSummary(){return Object.fromEntries(slots.map(s=>[s,C.parts.filter(p=>p.slot===s).length]));}
root.ShipForge={version:'2.0.0',catalog:C,visualCatalog:V,generate,population,validate,signature,stats,renderSVG,renderPartSVG,renderMarkup,clone,part,candidates,compatible,mountFits,hashSeed,componentSummary};
})(typeof window!=='undefined'?window:globalThis);
