/* Deadlock v17.13 — Raven realistic anchor + live ShipForge refit renderer.
 * The canonical Raven uses a detailed transparent anchor image. Installed
 * ShipForge parts remain authoritative; any slot that differs from the anchor
 * loadout is rendered into its matching visual zone as a live refit overlay.
 */
(function(root){
'use strict';
const VERSION='1.1.0';
const ANCHOR='assets/ships/raven/generated/raven_anchor_v17_13.svg';
const BASE={
 core:'core_twinboom_09',
 cockpit:'cockpit_armored_05',
 wing:'wing_outrigger_09',
 engine:'engine_military_06',
 weapon:'weapon_rotary_09',
 cargo:'cargo_modular_08',
 utility:'utility_smuggler_06'
};
const ZONES={
 engine:{x:5,y:31,w:29,h:39},
 wing:{x:12,y:18,w:45,h:63},
 core:{x:24,y:24,w:48,h:49},
 cargo:{x:26,y:49,w:28,h:23},
 utility:{x:40,y:12,w:19,h:20},
 cockpit:{x:57,y:31,w:34,h:39},
 weapon:{x:8,y:23,w:83,h:49}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const BAND=[['critical',0,39],['damaged',40,64],['worn',65,84],['operational',85,100]];
function conditionBand(n){
 n=Math.max(0,Math.min(100,Number(n??100)));
 return BAND.find(x=>n>=x[1]&&n<=x[2])?.[0]||'operational';
}
function build(data){
 const W=root.DeadlockShipForge,F=root.ShipForge;
 if(!W||!F||!data)return null;
 const ship=W.shipRecord(data,'raven');if(!ship)return null;
 const bp=W.blueprint(data,ship);if(!bp)return null;
 const installed={};let sum=0,count=0,min=100;
 for(const [slot,iid] of Object.entries(ship.installations||{})){
  const inst=data.shipForge?.components?.[iid];if(!inst)continue;
  const condition=Math.max(0,Math.min(100,Number(inst.condition??100)));
  installed[slot]={instanceId:iid,partId:inst.partId,condition};
  sum+=condition;count++;min=Math.min(min,condition);
 }
 const avg=count?Math.round(sum/count):100;
 const changed=Object.entries(bp.parts||{}).filter(([slot,id])=>BASE[slot]&&BASE[slot]!==id).map(([slot,id])=>({slot,partId:id,basePartId:BASE[slot],condition:installed[slot]?.condition??100}));
 return{ship,bp,installed,changed,avgCondition:avg,minCondition:count?min:100,conditionBand:conditionBand(Math.min(avg,min))};
}
function overlayMarkup(F,b){
 return b.changed.map(change=>{
  const z=ZONES[change.slot];if(!z)return'';
  let svg='';try{svg=F.renderPartSVG(change.partId,{palette:b.bp.palette});}catch{return''}
  return '<span class="raven-refit-zone raven-refit-'+esc(change.slot)+' raven-refit-'+esc(conditionBand(change.condition))+'" style="--rz-x:'+z.x+'%;--rz-y:'+z.y+'%;--rz-w:'+z.w+'%;--rz-h:'+z.h+'%" data-raven-slot="'+esc(change.slot)+'" data-raven-part="'+esc(change.partId)+'" title="'+esc(change.slot+': '+change.partId)+'">'+svg+'</span>';
 }).join('');
}
function render(data,state='flight',alt='The Raven'){
 const F=root.ShipForge,b=build(data);if(!F||!b)return null;
 const label=alt||b.ship.name||'The Raven';
 const partSig=Object.entries(b.bp.parts||{}).map(([slot,id])=>slot+':'+id).join('|');
 const refits=overlayMarkup(F,b);
 return '<span class="raven-visual raven-dynamic raven-anchor-live raven-state-'+esc(state)+' raven-condition-'+esc(b.conditionBand)+'" data-raven-renderer="anchor-plus-shipforge-refit" data-raven-signature="'+esc(b.ship.signature||partSig)+'" data-raven-condition="'+b.avgCondition+'" data-raven-refits="'+b.changed.length+'" data-raven-palette="'+esc(b.bp.palette||'black_copper')+'" aria-label="'+esc(label)+'">'+
   '<img class="raven-anchor-art" src="'+ANCHOR+'" alt="'+esc(label)+'" draggable="false">'+
   '<span class="raven-refit-layer" aria-hidden="true">'+refits+'</span>'+
   '<span class="raven-dynamic-glow" aria-hidden="true"></span>'+
  '</span>';
}
function fallback(data,state='flight',alt='The Raven'){
 const F=root.ShipForge,b=build(data);if(!F||!b)return null;
 const sf=F.renderMarkup(b.bp,{label:alt||b.ship.name||'The Raven',className:'raven-shipforge'});
 return '<span class="raven-visual raven-dynamic raven-state-'+esc(state)+' raven-condition-'+esc(b.conditionBand)+'" data-raven-renderer="shipforge-fallback">'+
  '<span class="raven-dynamic-stage">'+sf+'</span><span class="raven-dynamic-glow" aria-hidden="true"></span></span>';
}
function partState(data){
 const b=build(data);if(!b)return null;
 return{version:VERSION,shipId:b.ship.id,signature:b.ship.signature||root.ShipForge.signature(b.bp),palette:b.bp.palette,parts:{...b.bp.parts},baseParts:{...BASE},changed:b.changed.map(x=>({...x})),installed:b.installed,avgCondition:b.avgCondition,minCondition:b.minCondition,conditionBand:b.conditionBand,anchor:ANCHOR};
}
root.DeadlockRavenVisual={version:VERSION,anchor:ANCHOR,baseLoadout:BASE,zones:ZONES,render,fallback,build,partState,conditionBand};
})(typeof window!=='undefined'?window:globalThis);
