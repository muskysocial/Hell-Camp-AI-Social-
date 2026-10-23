const CACHE_NAME="hell-camp-shell-v21";
const APP_SHELL=["./","./index.html","./manifest.json","./icons/icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==="navigate"){event.respondWith(fetch(request,{cache:"no-store"}).then(response=>{return response}).catch(()=>caches.match("./index.html")));return}
 event.respondWith(fetch(request,{cache:"no-store"}).catch(()=>caches.match(request)));
});