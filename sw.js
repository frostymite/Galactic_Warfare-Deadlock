const CACHE="deadlock-v9-3-2-tabletop-dialogue-cache-1";
const APP_SHELL=[
 "./","./index.html","./styles.css","./app.js","./character-data.json","./manifest.webmanifest",
 "./assets/rovan.jpg","./assets/raven.jpg","./assets/raven_dedicated.jpg","./assets/contact_dren.jpg","./assets/hud_bg.jpg",
 "./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-192.png","./icons/maskable-512.png",
 "./assets/npc_dren.svg","./assets/npc_nera.svg","./assets/npc_renn.svg","./assets/npc_jessa.svg","./assets/npc_unknown.svg"
];

self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;

 const url=new URL(req.url);

 // Optional AI bridge should never block the offline app.
 if(url.pathname.startsWith("/api/")){
   event.respondWith(fetch(req).catch(()=>new Response(JSON.stringify({ok:false,offline:true}),{
     status:503,headers:{"Content-Type":"application/json"}
   })));
   return;
 }

 // Navigations always fall back to the cached app.
 if(req.mode==="navigate"){
   event.respondWith(fetch(req).then(resp=>{
     const copy=resp.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return resp;
   }).catch(()=>caches.match("./index.html")));
   return;
 }

 // App assets are cache-first.
 event.respondWith(caches.match(req).then(cached=>{
   if(cached)return cached;
   return fetch(req).then(resp=>{
     const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy));return resp;
   }).catch(()=>caches.match("./index.html"));
 }));
});
