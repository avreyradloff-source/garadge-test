/* My Garage Companion app shell: keep the newest successful online response for offline launches. User records are never cached here. */
const CACHE='my-garage-companion-shell-v13';
const SHELL=['./','./index.html','./workshop.html','./manifest.webmanifest','./app-icon.svg','./garage-storage.js','./cloud-config.js','./cloud-sync.js'];
const canonical=request=>{const u=new URL(request.url);u.search='';u.hash='';if(u.pathname===new URL('./',self.registration.scope).pathname)u.pathname=new URL('./index.html',self.registration.scope).pathname;return u.toString()};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{await Promise.allSettled(SHELL.map(async path=>{const url=new URL(path,self.registration.scope).toString();const response=await fetch(url,{cache:'no-store'});if(response.ok)await cache.put(canonical({url}),response)}))}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('my-garage-companion-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 const key=canonical(request);if(!SHELL.some(p=>canonical({url:new URL(p,self.registration.scope).toString()})===key))return;
 event.respondWith((async()=>{
  try{const response=await fetch(request,{cache:'no-store'});if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(key,copy)).catch(()=>{}));return response}throw Error('Network response unavailable')}
  catch{const cache=await caches.open(CACHE);return await cache.match(key)||Response.error()}
 })());
});
