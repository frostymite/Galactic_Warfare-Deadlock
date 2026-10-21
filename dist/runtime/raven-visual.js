/* Deadlock v17.13 — Raven dynamic ShipForge hero renderer.
 * Replaces the static Raven cutout for normal presentation with the actual
 * persistent installed ShipForge build. Buying/installing parts changes the
 * visible Raven immediately because the renderer reads the live blueprint.
 */
(function(root){
'use strict';
const VERSION='1.0.0';
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
 return{ship,bp,installed,avgCondition:avg,minCondition:count?min:100,conditionBand:conditionBand(Math.min(avg,min))};
}
function render(data,state='flight',alt='The Raven'){
 const F=root.ShipForge,b=build(data);if(!F||!b)return null;
 const label=alt||b.ship.name||'The Raven';
 const sf=F.renderMarkup(b.bp,{label,className:'raven-shipforge'});
 const partSig=Object.entries(b.bp.parts||{}).map(([slot,id])=>slot+':'+id).join('|');
 return '<span class="raven-visual raven-dynamic raven-state-'+esc(state)+' raven-condition-'+esc(b.conditionBand)+'" data-raven-renderer="shipforge-live" data-raven-signature="'+esc(b.ship.signature||partSig)+'" data-raven-condition="'+b.avgCondition+'" aria-label="'+esc(label)+'">'+
   '<span class="raven-dynamic-stage">'+sf+'</span>'+
   '<span class="raven-dynamic-glow" aria-hidden="true"></span>'+
  '</span>';
}
function partState(data){
 const b=build(data);if(!b)return null;
 return{version:VERSION,shipId:b.ship.id,signature:b.ship.signature||root.ShipForge.signature(b.bp),palette:b.bp.palette,parts:{...b.bp.parts},installed:b.installed,avgCondition:b.avgCondition,minCondition:b.minCondition,conditionBand:b.conditionBand};
}
root.DeadlockRavenVisual={version:VERSION,render,build,partState,conditionBand};
})(typeof window!=='undefined'?window:globalThis);
