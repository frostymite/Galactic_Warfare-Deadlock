/* Deadlock v17.13.1 — Raven realistic anchor + native integrated refit renderer.
 * The canonical Raven uses the detailed transparent anchor image. Installed
 * ShipForge parts remain authoritative; slots that differ from the anchor are
 * rendered as Raven-native hardware, never generic ShipForge component cards.
 */
(function(root){
'use strict';
const VERSION='1.3.0';
const ANCHOR='assets/raven_dedicated.jpg';
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
const FAMILY={
 apex:{trim:'#9e7a4f',accent:'#3eeaff'},
 sable:{trim:'#758088',accent:'#43d9ff'},
 veyra:{trim:'#8d7458',accent:'#41d7f1'},
 meridian:{trim:'#6e828d',accent:'#66edff'},
 outerrim:{trim:'#82674f',accent:'#36cbe8'},
 default:{trim:'#707b80',accent:'#45def7'}
};
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
function partMeta(F,id){try{return F.part?.(id)||null}catch{return null}}
function familyStyle(p){
 const f=FAMILY[p?.family]||FAMILY.default;
 return{trim:f.trim,accent:f.accent,tier:Math.max(1,Number(p?.tier||1)),design:String(p?.design||''),family:String(p?.family||'default')};
}
function defs(uid,style){
 return '<defs>'+
  '<linearGradient id="'+uid+'h" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5f696e"/><stop offset=".18" stop-color="#252d31"/><stop offset=".55" stop-color="#0c1215"/><stop offset=".82" stop-color="#1b2226"/><stop offset="1" stop-color="#070a0c"/></linearGradient>'+
  '<linearGradient id="'+uid+'m" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+style.trim+'"/><stop offset=".45" stop-color="#333b3f"/><stop offset="1" stop-color="#0a0e10"/></linearGradient>'+
  '<radialGradient id="'+uid+'g"><stop stop-color="#efffff"/><stop offset=".2" stop-color="'+style.accent+'"/><stop offset=".55" stop-color="#009fc5"/><stop offset="1" stop-color="#002d3a"/></radialGradient>'+
  '<filter id="'+uid+'s" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="-2" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".85"/></filter>'+
  '<filter id="'+uid+'e" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
 '</defs>';
}
function wear(uid,style){
 let seams='',rivets='',scratches='';
 const n=Math.min(5,2+style.tier);
 for(let i=0;i<n;i++){const y=23+i*11;seams+='<path d="M18 '+y+' C36 '+(y-5)+' 62 '+(y+5)+' 82 '+(y-1)+'" fill="none" stroke="#879399" stroke-width=".8" opacity=".28"/>'}
 for(let i=0;i<Math.min(12,4+style.tier*2);i++){const x=18+(i*13)%67,y=19+(i*17)%56;rivets+='<circle cx="'+x+'" cy="'+y+'" r="1" fill="#a9b1b4" opacity=".38"/>'}
 for(let i=0;i<Math.min(7,2+style.tier);i++){const x=28+(i*19)%52,y=31+(i*23)%38;scratches+='<path d="M'+x+' '+y+' l'+(8+(i%3)*3)+' -'+(3+(i%2)*2)+'" stroke="#a47750" stroke-width="1" opacity=".35"/>'}
 return '<g class="raven-refit-detail">'+seams+rivets+scratches+'</g>';
}
function engineSvg(uid,p,style){
 const d=style.design;
 let nozzles=2,ring=false,wide=false;
 if(d==='ring'){nozzles=1;ring=true}
 else if(d==='heavy'){nozzles=3;wide=true}
 else if(d==='military'){nozzles=4}
 else if(d==='slab'){nozzles=2;wide=true}
 else if(d==='trident'){nozzles=3}
 else if(d==='twin_ion'){nozzles=2}
 let ports='';
 const centers=nozzles===1?[50]:nozzles===2?[36,64]:nozzles===3?[29,50,71]:[23,41,59,77];
 for(const x of centers)ports+='<ellipse cx="'+x+'" cy="52" rx="'+(ring?15:10)+'" ry="'+(ring?19:14)+'" fill="#061116" stroke="'+style.trim+'" stroke-width="3"/><ellipse cx="'+x+'" cy="52" rx="'+(ring?10:6)+'" ry="'+(ring?13:9)+'" fill="url(#'+uid+'g)" filter="url(#'+uid+'e)"/>';
 return '<g filter="url(#'+uid+'s)"><path d="M10 24 L30 12 H72 L91 27 L86 75 L69 88 H28 L9 73 Z" fill="url(#'+uid+'h)" stroke="#68747a" stroke-width="2.4"/>'+
  (wide?'<path d="M8 35 H92 V70 H8 Z" fill="#11181c" stroke="'+style.trim+'" stroke-width="2"/>':'')+
  '<path d="M20 20 H80 M17 31 H84 M16 76 H82" stroke="#59656b" stroke-width="1.3" opacity=".7"/>'+ports+
  '<path d="M24 16 L17 5 M76 16 L84 5 M25 85 L18 96 M75 85 L83 96" stroke="'+style.trim+'" stroke-width="2.4" opacity=".8"/></g>'+wear(uid,style);
}
function cockpitSvg(uid,p,style){
 const split=style.design==='split',offset=style.design==='offset',armored=style.design==='armored';
 return '<g filter="url(#'+uid+'s)"><path d="'+(offset?'M8 39 L35 16 L87 29 L96 57 L73 83 L25 76 Z':'M8 34 L38 14 L85 25 L96 54 L78 84 L24 78 Z')+'" fill="url(#'+uid+'h)" stroke="#707c82" stroke-width="2.5"/>'+
  '<path d="'+(split?'M31 27 L51 23 L52 59 L26 55 Z M58 24 L78 30 L84 57 L58 59 Z':'M30 27 L75 28 L86 53 L65 61 L26 53 Z')+'" fill="#04151d" stroke="#66818b" stroke-width="2"/>'+
  (armored?'<path d="M18 24 L42 8 H78 L91 21 L81 31 L31 26 Z M20 58 L31 72 L71 75 L86 60 L78 86 L25 82 L9 62 Z" fill="#171e22" stroke="'+style.trim+'" stroke-width="2"/>':'')+
  '<path d="M33 31 L30 51 M49 27 L48 58 M65 29 L66 58" stroke="#63737b" stroke-width="1.4" opacity=".75"/>'+
  '<rect x="68" y="68" width="19" height="3" rx="1.5" fill="'+style.accent+'" filter="url(#'+uid+'e)"/></g>'+wear(uid,style);
}
function coreSvg(uid,p,style){
 const d=style.design;
 let shape='M8 32 L28 13 H72 L93 32 L88 73 L68 88 H29 L10 72 Z';
 if(d==='twinboom')shape='M9 30 L25 12 H42 L49 27 H61 L70 12 H84 L95 31 L88 75 L68 88 H30 L12 75 Z';
 if(d==='hauler')shape='M5 28 L22 10 H78 L96 29 L91 78 L74 91 H24 L7 77 Z';
 if(d==='skiff')shape='M12 37 L28 16 H76 L91 31 L83 70 L66 82 H31 L16 70 Z';
 return '<g filter="url(#'+uid+'s)"><path d="'+shape+'" fill="url(#'+uid+'h)" stroke="#6d787d" stroke-width="2.6"/>'+
  '<path d="M23 34 H78 M20 48 H81 M24 63 H75 M35 18 V82 M62 17 V82" stroke="#59656a" stroke-width="1.2" opacity=".65"/>'+
  '<path d="M18 40 L28 37 L31 47 L21 50 Z M69 54 L80 57 L76 67 L66 63 Z" fill="'+style.accent+'" opacity=".75" filter="url(#'+uid+'e)"/></g>'+wear(uid,style);
}
function wingSvg(uid,p,style){
 const d=style.design;
 let top='M9 35 L43 16 L87 20 L70 43 L29 50 Z',bot='M10 66 L33 52 L75 55 L91 72 L62 86 L25 81 Z';
 if(d==='stub'){top='M19 38 L48 23 L78 28 L65 46 L35 51 Z';bot='M21 65 L38 52 L69 55 L81 70 L58 82 L31 78 Z'}
 if(d==='cargo'){top='M7 31 L42 14 L92 20 L76 47 L29 51 Z';bot='M8 68 L30 50 L79 55 L94 74 L63 89 L24 82 Z'}
 if(d==='gull'){top='M7 42 L28 23 L48 11 L91 27 L71 48 L31 54 Z';bot='M12 59 L33 50 L69 53 L94 70 L73 87 L39 78 Z'}
 if(d==='outrigger'){top='M4 32 L37 14 L94 24 L74 48 L25 50 Z';bot='M6 68 L26 51 L78 54 L96 74 L67 91 L22 82 Z'}
 return '<g filter="url(#'+uid+'s)"><path d="'+top+'" fill="url(#'+uid+'h)" stroke="#68747a" stroke-width="2.3"/><path d="'+bot+'" fill="url(#'+uid+'h)" stroke="#68747a" stroke-width="2.3"/>'+
  '<path d="M26 31 L69 33 M25 72 L65 68 M41 17 L47 47 M42 55 L48 83" stroke="#525f65" stroke-width="1.2" opacity=".7"/>'+
  '<path d="M15 39 L31 34 M14 72 L32 68" stroke="'+style.accent+'" stroke-width="1.4" opacity=".65"/></g>'+wear(uid,style);
}
function weaponSvg(uid,p,style){
 const d=style.design;
 let body='<path d="M24 38 L39 26 H68 L80 39 L74 61 H35 L23 52 Z" fill="url(#'+uid+'h)" stroke="#747f84" stroke-width="2.2"/>';
 let barrels='';
 if(d==='rotary'){for(let i=0;i<4;i++)barrels+='<rect x="68" y="'+(34+i*8)+'" width="28" height="4" rx="2" fill="#737d82"/>';body+='<ellipse cx="47" cy="48" rx="16" ry="10" fill="#0b1114" stroke="'+style.trim+'" stroke-width="2"/>'}
 else if(d==='missile'){body+='<rect x="42" y="34" width="34" height="28" rx="5" fill="#11181c" stroke="'+style.trim+'" stroke-width="2"/>';for(let y of [40,49,58])for(let x of [49,61,71])barrels+='<circle cx="'+x+'" cy="'+y+'" r="3" fill="#070b0d" stroke="'+style.accent+'" stroke-width="1"/>'}
 else if(d==='ion'){barrels='<rect x="68" y="37" width="27" height="6" rx="3" fill="#707b80"/><rect x="68" y="53" width="27" height="6" rx="3" fill="#707b80"/><circle cx="94" cy="40" r="3" fill="'+style.accent+'" filter="url(#'+uid+'e)"/><circle cx="94" cy="56" r="3" fill="'+style.accent+'" filter="url(#'+uid+'e)"/>'}
 else if(d==='defense'){barrels='<rect x="65" y="39" width="23" height="4" rx="2" fill="#737d82"/><rect x="65" y="53" width="23" height="4" rx="2" fill="#737d82"/>'}
 else if(d==='dorsal'){barrels='<rect x="66" y="36" width="31" height="5" rx="2" fill="#788287"/><rect x="66" y="54" width="31" height="5" rx="2" fill="#788287"/>'}
 else {barrels='<rect x="66" y="40" width="31" height="5" rx="2" fill="#788287"/><rect x="66" y="52" width="31" height="5" rx="2" fill="#788287"/>'}
 return '<g filter="url(#'+uid+'s)">'+body+barrels+'<circle cx="46" cy="48" r="3" fill="'+style.accent+'" opacity=".65" filter="url(#'+uid+'e)"/></g>'+wear(uid,style);
}
function cargoSvg(uid,p,style){
 const d=style.design;
 let boxes='';
 if(d==='sidepods')boxes='<path d="M5 28 H32 V72 H5 Z M68 28 H95 V72 H68 Z" fill="url(#'+uid+'h)" stroke="'+style.trim+'" stroke-width="2"/>';
 else if(d==='belly')boxes='<path d="M22 34 H78 L88 50 L76 73 H24 L12 50 Z" fill="url(#'+uid+'h)" stroke="'+style.trim+'" stroke-width="2.2"/>';
 else if(d==='clamps')boxes='<path d="M18 30 H80 V69 H18 Z" fill="#0f1619" stroke="'+style.trim+'" stroke-width="2"/><path d="M8 25 V76 M92 25 V76 M8 35 H20 M8 64 H20 M80 35 H92 M80 64 H92" stroke="#778287" stroke-width="4"/>';
 else if(d==='saddle')boxes='<path d="M15 38 L29 24 H75 L87 39 L79 72 H21 Z" fill="url(#'+uid+'h)" stroke="'+style.trim+'" stroke-width="2"/><path d="M50 24 V75" stroke="#758087" stroke-width="3"/>';
 else boxes='<path d="M11 28 H89 V73 H11 Z" fill="url(#'+uid+'h)" stroke="'+style.trim+'" stroke-width="2.2"/><path d="M37 28 V73 M64 28 V73 M11 49 H89" stroke="#526066" stroke-width="1.5"/>';
 return '<g filter="url(#'+uid+'s)">'+boxes+'<rect x="42" y="62" width="17" height="3" rx="1.5" fill="'+style.accent+'" opacity=".7" filter="url(#'+uid+'e)"/></g>'+wear(uid,style);
}
function utilitySvg(uid,p,style){
 const d=style.design;
 let body='';
 if(['sensor','comms','radar','jammer'].includes(d)){
  body='<path d="M21 65 H78 L72 77 H29 Z" fill="url(#'+uid+'h)" stroke="'+style.trim+'" stroke-width="2"/><circle cx="50" cy="46" r="'+(d==='radar'?20:14)+'" fill="#0b1317" stroke="'+style.trim+'" stroke-width="2"/><path d="M50 45 L'+(d==='jammer'?80:67)+' 18 M50 31 V12 M37 47 H18 M63 47 H83" stroke="#849197" stroke-width="2.5"/><circle cx="50" cy="46" r="4" fill="'+style.accent+'" filter="url(#'+uid+'e)"/>';
 }else if(d==='armor'){
  body='<path d="M15 27 H84 L92 42 L81 77 H20 L8 55 Z" fill="url(#'+uid+'h)" stroke="'+style.trim+'" stroke-width="2.5"/><path d="M22 34 H47 V68 H18 M53 34 H78 L84 45 L75 68 H53 Z" fill="#10171a" stroke="#526067" stroke-width="1.5"/>';
 }else if(['tow','tractor'].includes(d)){
  body='<circle cx="43" cy="49" r="22" fill="#0b1215" stroke="'+style.trim+'" stroke-width="3"/><circle cx="43" cy="49" r="11" fill="none" stroke="'+style.accent+'" stroke-width="2" filter="url(#'+uid+'e)"/><path d="M65 49 H86 L95 38 M86 49 L96 61" stroke="#758187" stroke-width="4"/>';
 }else if(d==='smuggler'){
  body='<path d="M14 31 H87 V72 H14 Z" fill="#0b1114" stroke="'+style.trim+'" stroke-width="2.3"/><path d="M24 39 H76 V63 H24 Z" fill="url(#'+uid+'h)" stroke="#49565c" stroke-width="1.5" stroke-dasharray="4 3"/><circle cx="78" cy="51" r="3" fill="'+style.accent+'" opacity=".55"/>';
 }else if(d==='repair'){
  body='<path d="M18 31 H75 V72 H18 Z" fill="url(#'+uid+'h)" stroke="'+style.trim+'" stroke-width="2.2"/><path d="M71 39 L91 27 M71 52 L95 49 M71 64 L89 77" stroke="#7d898e" stroke-width="4"/><circle cx="42" cy="51" r="10" fill="#0b1114" stroke="'+style.accent+'" stroke-width="2"/>';
 }else{
  body='<path d="M15 31 H84 V72 H15 Z" fill="url(#'+uid+'h)" stroke="'+style.trim+'" stroke-width="2.2"/><circle cx="50" cy="51" r="13" fill="#0b1114" stroke="'+style.accent+'" stroke-width="2"/>';
 }
 return '<g filter="url(#'+uid+'s)">'+body+'</g>'+wear(uid,style);
}
function nativeSvg(F,change,b){
 const p=partMeta(F,change.partId);if(!p)return'';
 const style=familyStyle(p),uid='rv'+String(change.partId).replace(/[^a-z0-9]/gi,'')+change.slot;
 let body='';
 if(change.slot==='engine')body=engineSvg(uid,p,style);
 else if(change.slot==='cockpit')body=cockpitSvg(uid,p,style);
 else if(change.slot==='core')body=coreSvg(uid,p,style);
 else if(change.slot==='wing')body=wingSvg(uid,p,style);
 else if(change.slot==='weapon')body=weaponSvg(uid,p,style);
 else if(change.slot==='cargo')body=cargoSvg(uid,p,style);
 else if(change.slot==='utility')body=utilitySvg(uid,p,style);
 if(!body)return'';
 const damaged=conditionBand(change.condition);
 return '<svg class="raven-refit-native raven-native-'+esc(change.slot)+' raven-native-'+esc(damaged)+'" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="'+esc(p.name||change.partId)+' Raven refit">'+
  defs(uid,style)+body+
  '<g opacity=".45"><path d="M15 18 L28 14 M73 80 L87 75" stroke="#b78d62" stroke-width="1.2"/></g>'+
 '</svg>';
}
function overlayMarkup(F,b){
 return b.changed.map(change=>{
  const z=ZONES[change.slot];if(!z)return'';
  const svg=nativeSvg(F,change,b);if(!svg)return'';
  const p=partMeta(F,change.partId);
  return '<span class="raven-refit-zone raven-refit-'+esc(change.slot)+' raven-refit-'+esc(conditionBand(change.condition))+'" style="--rz-x:'+z.x+'%;--rz-y:'+z.y+'%;--rz-w:'+z.w+'%;--rz-h:'+z.h+'%" data-raven-slot="'+esc(change.slot)+'" data-raven-part="'+esc(change.partId)+'" data-raven-refit="native" data-raven-design="'+esc(p?.design||'')+'" title="'+esc((p?.name||change.partId)+' — integrated '+change.slot+' refit')+'">'+svg+'</span>';
 }).join('');
}
function render(data,state='flight',alt='The Raven'){
 const F=root.ShipForge,b=build(data);if(!F||!b)return null;
 const label=alt||b.ship.name||'The Raven';
 const partSig=Object.entries(b.bp.parts||{}).map(([slot,id])=>slot+':'+id).join('|');
 const refits=overlayMarkup(F,b);
 return '<span class="raven-visual raven-dynamic raven-anchor-live raven-state-'+esc(state)+' raven-condition-'+esc(b.conditionBand)+'" data-raven-renderer="generated-raster-plus-native-refit" data-raven-signature="'+esc(b.ship.signature||partSig)+'" data-raven-condition="'+b.avgCondition+'" data-raven-refits="'+b.changed.length+'" data-raven-palette="'+esc(b.bp.palette||'black_copper')+'" aria-label="'+esc(label)+'">'+
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
 return{version:VERSION,shipId:b.ship.id,signature:b.ship.signature||root.ShipForge.signature(b.bp),palette:b.bp.palette,parts:{...b.bp.parts},baseParts:{...BASE},changed:b.changed.map(x=>({...x})),installed:b.installed,avgCondition:b.avgCondition,minCondition:b.minCondition,conditionBand:b.conditionBand,anchor:ANCHOR,refitRenderer:'generated-raster-plus-native'};
}
root.DeadlockRavenVisual={version:VERSION,anchor:ANCHOR,baseLoadout:BASE,zones:ZONES,render,fallback,build,partState,conditionBand,nativeSvg};
})(typeof window!=='undefined'?window:globalThis);
