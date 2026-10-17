const CACHE="deadlock-v10-1-forced-encounters-cache-1";
const APP_SHELL=[
 './',
 './app.js',
 './asset-manifest.json',
 './assets/characters/dren/angry.svg',
 './assets/characters/dren/holo.svg',
 './assets/characters/dren/neutral.svg',
 './assets/characters/dren/suspicious.svg',
 './assets/characters/dren/talking.svg',
 './assets/characters/jessa/focused.svg',
 './assets/characters/jessa/holo.svg',
 './assets/characters/jessa/neutral.svg',
 './assets/characters/jessa/talking.svg',
 './assets/characters/nera/angry.svg',
 './assets/characters/nera/holo.svg',
 './assets/characters/nera/neutral.svg',
 './assets/characters/nera/suspicious.svg',
 './assets/characters/nera/talking.svg',
 './assets/characters/renn/holo.svg',
 './assets/characters/renn/neutral.svg',
 './assets/characters/renn/suspicious.svg',
 './assets/characters/renn/talking.svg',
 './assets/characters/rovan/focused.svg',
 './assets/characters/rovan/injured.svg',
 './assets/characters/rovan/neutral.svg',
 './assets/characters/rovan/talking.svg',
 './assets/characters/unknown/holo.svg',
 './assets/contact_dren.jpg',
 './assets/effects/hyperspace.svg',
 './assets/effects/starfield.svg',
 './assets/hud_bg.jpg',
 './assets/locations/blackglass/briefing.svg',
 './assets/locations/blackglass/contracts.svg',
 './assets/locations/blackglass/exterior.svg',
 './assets/locations/blackglass/hangar.svg',
 './assets/locations/blackglass/hq.svg',
 './assets/locations/blackglass/quarters.svg',
 './assets/npc_dren.svg',
 './assets/npc_jessa.svg',
 './assets/npc_nera.svg',
 './assets/npc_renn.svg',
 './assets/npc_unknown.svg',
 './assets/planets/cindar.svg',
 './assets/planets/drekthar.svg',
 './assets/planets/nerath.svg',
 './assets/planets/orivon.svg',
 './assets/planets/rethis.svg',
 './assets/planets/sable_belt.svg',
 './assets/planets/talos.svg',
 './assets/planets/thalos.svg',
 './assets/planets/umber.svg',
 './assets/planets/veyra_prime.svg',
 './assets/planets/xerra.svg',
 './assets/raven.jpg',
 './assets/raven_dedicated.jpg',
 './assets/rovan.jpg',
 './assets/ships/raven_flight.svg',
 './assets/ships/raven_landed.svg',
 './assets/ships/raven_orbit.svg',
 './assets/ships/raven_schematic.svg',
 './character-data.json',
 './galaxy-data.json',
 './icons/icon-192.png',
 './icons/icon-512.png',
 './icons/maskable-192.png',
 './icons/maskable-512.png',
 './index.html',
 './manifest.webmanifest',
 './styles.css'
];

self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch",event=>{
 const req=event.request;if(req.method!=="GET")return;const url=new URL(req.url);
 if(url.pathname.startsWith("/api/")){event.respondWith(fetch(req).catch(()=>new Response(JSON.stringify({ok:false,offline:true}),{status:503,headers:{"Content-Type":"application/json"}})));return;}
 if(req.mode==="navigate"){event.respondWith(fetch(req).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return resp;}).catch(()=>caches.match("./index.html")));return;}
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy));return resp;})));
});
