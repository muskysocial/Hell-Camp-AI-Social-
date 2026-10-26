const CACHE_NAME="hell-camp-shell-v26";
const APP_SHELL=["./","./index.html","./manifest.json","./icons/icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==="navigate"){event.respondWith(fetch(request,{cache:"no-store"}).then(response=>response).catch(()=>caches.match("./index.html")));return}
 event.respondWith(fetch(request,{cache:"no-store"}).catch(()=>caches.match(request)));
});
self.addEventListener("push",event=>{
 let payload={title:"Hell Camp",body:"You have a new notification.",url:"./?hc_page=Notifications"};
 try{const incoming=event.data&&event.data.json();if(incoming&&typeof incoming==="object")payload=Object.assign(payload,incoming);}catch(e){try{payload.body=event.data.text();}catch(_){}}
 const raw=String(payload.url||payload.target_url||"./?hc_page=Notifications");
 let url="./?hc_page=Notifications";
 try{const parsed=new URL(raw,self.registration.scope);if(parsed.origin===self.location.origin){url=parsed.href;}}catch(e){}
 event.waitUntil(self.registration.showNotification(String(payload.title||"Hell Camp").slice(0,120),{
  body:String(payload.body||"You have a new notification.").slice(0,240),
  icon:"./icons/icon.svg",badge:"./icons/icon.svg",data:{url},renotify:false
 }));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 const raw=event.notification&&event.notification.data&&event.notification.data.url;
 let target=new URL("./?hc_page=Notifications",self.registration.scope);
 try{const parsed=new URL(String(raw||target.href),self.registration.scope);if(parsed.origin===self.location.origin)target=parsed;}catch(e){}
 event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(clients=>{
  for(const client of clients){if(new URL(client.url).origin===self.location.origin){return client.navigate(target.href).then(c=>c&&c.focus());}}
  return self.clients.openWindow(target.href);
 }));
});
