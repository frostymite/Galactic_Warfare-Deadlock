/* Local exploration and priced, state-authoritative supplies. */
(() => {
 const descriptions={
  'Orbital Ring':'Dock traffic threads between orbital platforms. Public manifests and transport crews are useful starting points for a trail.',
  'Upper City':'Garden terraces and bright skybridges overlook the planet. Keep a low profile around private security and wealthy patrons.',
  'Lower Port':'Freight gantries, rain-soaked walkways and tired dockworkers. Cargo records and local contacts can reveal a courier’s route.',
  'Corporate District':'Glass towers and controlled access points surround the commercial core. Credentials and careful conversation matter here.',
  'Undercity':'Steam, cables and narrow market alleys hide old debts and new leads. Watch the exits before making contact.'
 };
 const art={
  'Orbital Ring':'assets/scenes/raven_cockpit_v14.svg',
  'Upper City':'assets/scenes/veyra_upper_v14.svg',
  'Lower Port':'assets/scenes/veyra_port_v14.svg',
  'Corporate District':'assets/scenes/veyra_upper_v14.svg',
  'Undercity':'assets/scenes/veyra_undercity_v14.svg'
 };
 function landed(){return ['docked','surface'].includes(galaxyState().phase)&&!forcedEncounterPage();}
 function siteArt(name,l){if(l.id==='veyra_prime')return art[name];const theme=SCENES.locationThemes?.[l.id];return SCENES.presets?.[theme]?.background||locationHeroAsset(l)||'assets/scenes/unknown.svg';}
 function previewSite(name){const l=currentGalaxyLocation();if(!l||!landed())return toast('Finish your journey and land before entering a site.');const siteNames=(l.sites||[]).map(x=>hqSite(x)?.name||x);if(!siteNames.includes(name))return toast('This site is not at your current location.');const danger=Number(l.danger||0);const risk=danger<35?'Low local threat.':danger<55?'Hostile contact is possible.':danger<75?'Elevated threat: an ambush is possible.':'High threat: be ready to fight or withdraw.';
  openModal(name,`<img class="district-preview" src="${esc(siteArt(name,l))}" alt="${esc(name)}"><p>${esc(descriptions[name]||l.description)}</p><p class="district-risk">${l.id==='veyra_prime'&&name==='Lower Port'?'Explore connected streets and persistent local situations. Armed approaches are clearly marked; entering does not start combat.':esc(risk)+' Entering starts a local Story scene. Your active contract remains tracked.'}</p><button class="btn good" id="enterDistrict">Enter ${esc(name)}</button>`);
  document.querySelector('#enterDistrict').onclick=()=>{if(currentGalaxyLocation()?.id!==l.id||!landed())return toast('Your location changed. Reopen the local site.');document.querySelector('#modal').close();if(l.id==='veyra_prime'&&name==='Lower Port'&&window.DeadlockPort)return window.DeadlockPort.enter();DATA.exploration=DATA.exploration||{visits:{}};const key=l.id+':'+name;DATA.exploration.visits[key]=(DATA.exploration.visits[key]||0)+1;DATA.exploration.current={locationId:l.id,name};enterLocalSite(name);};
 }
 function serviceKind(name){const s=String(name).toLowerCase();return /fuel/.test(s)?'fuel':/repair|parts|salvage/.test(s)?'repair':/medical/.test(s)?'medical':null;}
 function service(name){const kind=serviceKind(name);if(!kind)return false;const l=currentGalaxyLocation();if(!l||!landed()){toast('Dock or land before purchasing supplies.');return true;}
  const options=kind==='fuel'?[['fuel','fuelMax',4,'Refuel Raven','ship']]:kind==='repair'?[['hull','hullMax',12,'Repair hull','ship'],['shields','shieldsMax',2,'Recharge shields','ship']]:[['health','healthMax',6,'Medical treatment','character']];
  const quote=([key,max,rate,label,owner])=>{const obj=DATA[owner],units=Math.max(0,Number(obj[max])-Number(obj[key]));return {key,max,rate,label,owner,units,cost:Math.ceil(units*rate)}};
  openModal(`${l.name} · ${name}`,`<p>Credits available: <b>${money(DATA.character.credits)}</b>. Prices cover only the amount needed to reach full condition.</p><div class="service-offers">${options.map((o,i)=>{const q=quote(o);return `<div><h4>${q.label}</h4><p>${q.units?`${q.units} units × ${q.rate} cr = ${money(q.cost)}`:'Already at full condition.'}</p><button class="btn good" data-buy-service="${i}" ${!q.units||DATA.character.credits<q.cost?'disabled':''}>${!q.units?'No service needed':DATA.character.credits<q.cost?'Insufficient credits':`Purchase · ${money(q.cost)}`}</button></div>`}).join('')}</div><p class="small muted">Purchases change your actual credits and condition and are saved immediately.</p>`);
  let settled=false;document.querySelectorAll('[data-buy-service]').forEach(b=>b.onclick=()=>{if(settled)return;if(currentGalaxyLocation()?.id!==l.id||!landed())return toast('Service unavailable at your current position.');const q=quote(options[Number(b.dataset.buyService)]);if(q.units<=0||q.cost>DATA.character.credits)return;settled=true;DATA.character.credits-=q.cost;DATA[q.owner][q.key]=DATA[q.owner][q.max];if(q.owner==='character')syncRovanCombatant();DATA.journal.push({id:uid('service'),ts:new Date().toLocaleString(),title:q.label,text:`${l.name}: ${q.units} units for ${money(q.cost)}.`});save();document.querySelector('#modal').close();toast(`${q.label} complete · ${money(q.cost)}`);render();});return true;
 }
 function afterRender(page){
  if(page==='Galaxy'){const l=currentGalaxyLocation();document.querySelectorAll('[data-world-site]').forEach(b=>{const name=b.dataset.worldSite;if(l?.id==='veyra_prime'){b.classList.add('district-tile');b.insertAdjacentHTML('afterbegin',`<img src="${art[name]}" alt="" loading="lazy">`);b.querySelector('small').textContent=landed()?'Preview district':'Land to explore';}});}
  if(page==='Story'){const d=DATA.exploration?.current,l=currentGalaxyLocation();if(d&&d.locationId===l?.id&&DATA.story.location.includes(d.name)){const panel=document.createElement('div');panel.className='district-context';panel.innerHTML=`<span class="micro">LOCAL SCENE · ${esc(l.name)}</span><h3>${esc(d.name)}</h3><p>${esc(descriptions[d.name]||l.description)}</p><button class="btn" id="returnToLocalMap">Local map & services</button>`;document.querySelector('.living-scene-card')?.after(panel);panel.querySelector('button').onclick=()=>render('Galaxy');}}
 }
 window.DeadlockWorld={previewSite,service,afterRender};
})();
