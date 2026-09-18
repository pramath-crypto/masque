/* MASQUE service worker — offline cache for GitHub Pages */
const CACHE='masque-v1';
const CORE=['./','./index.html'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const res=await fetch(req);
        const cp=res.clone();
        const c=await caches.open(CACHE);
        c.put(req,cp);
        return res;
      }catch(err){
        return (await caches.match(req))||(await caches.match('./'));
      }
    })());
    return;
  }
  e.respondWith((async()=>{
    const hit=await caches.match(req);
    try{
      const res=await fetch(req);
      if(res&&(res.ok||res.type==='opaque')){
        const cp=res.clone();
        const c=await caches.open(CACHE);
        await c.put(req,cp);
      }
      return res;
    }catch(err){
      return hit;
    }
  })());
});
