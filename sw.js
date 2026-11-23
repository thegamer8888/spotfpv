// SpotFPV service worker: arranque rápido y mapas en caché
const V="spotfpv-v11",LIBS="spotfpv-libs-v1",TILES="spotfpv-tiles-v1",MAX_TILES=600;
const LIB_HOSTS=["unpkg.com","fonts.googleapis.com","fonts.gstatic.com"];
const TILE_HOSTS=["tile.openstreetmap.org","server.arcgisonline.com","tile.opentopomap.org"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(["./","./index.html"]).catch(()=>{})))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![V,LIBS,TILES].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function trim(){const c=await caches.open(TILES);const ks=await c.keys();if(ks.length>MAX_TILES)for(const k of ks.slice(0,ks.length-MAX_TILES))await c.delete(k)}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===location.origin){ // la app: red primero (para recibir actualizaciones), caché si no hay red
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match("./index.html"))));return}
  if(LIB_HOSTS.includes(u.hostname)){e.respondWith(caches.open(LIBS).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==="opaque")c.put(r,res.clone());return res}))));return}
  if(TILE_HOSTS.some(h=>u.hostname.endsWith(h))){e.respondWith(caches.open(TILES).then(c=>c.match(r).then(m=>{const net=fetch(r).then(res=>{if(res.ok||res.type==="opaque"){c.put(r,res.clone());trim()}return res}).catch(()=>m);return m||net})));return}
});
