/* Shared local-first storage: IndexedDB is authoritative; localStorage is migration-only. */
(()=>{'use strict';
const KEY='mygarage_app_v1',DB='my-garage-companion-storage',STORE='snapshots';
let connection;
function open(){if(!('indexedDB' in window))return Promise.reject(Error('IndexedDB is unavailable'));if(!connection)connection=new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Unable to open IndexedDB'));req.onblocked=()=>reject(Error('Storage is blocked by another tab'))}).catch(e=>{connection=null;throw e});return connection}
async function read(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}
async function write(value){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Unable to save'));tx.onabort=()=>reject(tx.error||Error('Save aborted'))})}
let pending=Promise.resolve();
function save(value){const snapshot=structuredClone(value);pending=pending.catch(()=>{}).then(()=>write(snapshot));return pending}
async function load(){let saved=null;try{saved=await read()}catch(e){console.warn('IndexedDB unavailable; attempting legacy data',e)}
if(saved&&Array.isArray(saved.vehicles))return saved;
let legacy=null;try{legacy=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
if(legacy&&Array.isArray(legacy.vehicles)){try{await save(legacy);localStorage.setItem('mygarage_idb_migrated_v1','yes')}catch(e){console.warn('Migration not saved to IndexedDB',e);throw Error('Could not migrate your existing garage safely. Please export a backup before continuing.')}return legacy}
return {vehicles:[],services:[],expenses:[],plans:[],repairs:[],parts:[],builds:[]}
}
window.MyGarageStorage={load,save};
})();
