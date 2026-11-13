/* Optional Supabase cloud backup. Public publishable key only; row-level security enforced in database. */
(()=>{'use strict';
const cfg=window.MY_GARAGE_CLOUD_CONFIG||{},url=String(cfg.url||'').replace(/\/$/,''),
 key=String(cfg.publishableKey||''),configured=/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(url)&&key.length>15;
const STORE='mygarage_cloud_session_v1';
let session=null,enabled=false,timer=null,busy=false;
try{session=JSON.parse(localStorage.getItem(STORE)||'null')}catch{}
const $=id=>document.getElementById(id);
function status(message){const el=$('cloudStatus');if(el)el.textContent=message}
function render(){const area=$('cloudAccountArea');if(!area)return;
 if(!configured){area.innerHTML='<p class="note">Cloud accounts are not activated yet. The owner must configure a Supabase project using CLOUD-SETUP.md. Your local garage and manual backups still work.</p>';return}
 if(session?.access_token){area.innerHTML='<p class="note">Signed in: '+escapeHtml(session.user?.email||'account')+'</p><div class="actions"><button class="btn primary" id="cloudUpload">Upload this device to cloud</button><button class="btn" id="cloudRestore">Restore cloud to this device</button><button class="btn" id="cloudSignOut">Sign out</button></div><p class="note">Choose a sync direction the first time on each device. Once enabled, edits in the main app upload automatically. Do not edit on two devices simultaneously.</p>';status(enabled?'Automatic upload enabled for this browser session.':'Choose Upload or Restore to begin syncing.')}
 else{area.innerHTML='<form id="cloudAuthForm"><div class="fields"><div class="field"><label for="cloudEmail">Email</label><input id="cloudEmail" type="email" required autocomplete="email"></div><div class="field"><label for="cloudPassword">Password (at least 8 characters)</label><input id="cloudPassword" type="password" required minlength="8" autocomplete="current-password"></div></div><div class="actions"><button class="btn primary" type="submit" name="cloudMode" value="login">Sign in</button><button class="btn" type="button" id="cloudSignUp">Create account</button></div></form><p class="note">Depending on your Supabase settings, you may need to confirm your email before signing in.</p>';status('Not signed in. Your garage is saved locally.')}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
async function request(path,opts={},authenticated=false){
 const headers={'apikey':key,...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})};
 if(authenticated){await refreshIfNeeded();if(!session?.access_token)throw Error('Please sign in again.');headers.Authorization='Bearer '+session.access_token}
 const response=await fetch(url+path,{...opts,headers});
 if(!response.ok){let detail='';try{let j=await response.json();detail=j.msg||j.message||j.error_description||j.error||''}catch{}throw Error(detail||'Cloud request failed ('+response.status+').')}
 if(response.status===204)return null;const txt=await response.text();return txt?JSON.parse(txt):null;
}
async function refreshIfNeeded(){if(!session)return;if(Date.now()<Number(session.expires_at||0)*1000-60000)return;
 if(!session.refresh_token){session=null;enabled=false;localStorage.removeItem(STORE);return}
 const s=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});
 setSession(s);
}
function setSession(s){if(!s?.access_token)throw Error('No valid session received');session={...s,expires_at:Math.floor(Date.now()/1000)+Number(s.expires_in||3600)};localStorage.setItem(STORE,JSON.stringify(session))}
async function authenticate(mode){if(!configured)return;const email=$('cloudEmail')?.value.trim(),password=$('cloudPassword')?.value;if(!email||!password||password.length<8){status('Enter an email and a password of at least 8 characters.');return}
 try{status('Contacting account service…');const s=await request('/auth/v1/'+(mode==='signup'?'signup':'token?grant_type=password'),{method:'POST',body:JSON.stringify({email,password})});if(!s?.access_token){status('Account created. Check your email for a confirmation link, then sign in.');return}setSession(s);enabled=false;render()}catch(e){status('Account error: '+e.message)}
}
async function upload(silent=false){if(busy||!session)return;busy=true;try{
 const db=window.MyGarageCloudBridge?.getData();if(!db)throw Error('Garage is not ready');
 const data=JSON.stringify(db);if(data.length>5*1024*1024)throw Error('Garage data exceeds 5 MB; export a JSON backup and reduce large photos before cloud upload.');
 await request('/rest/v1/garage_backups?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:session.user.id,garage_data:db,updated_at:new Date().toISOString()})},true);
 enabled=true;status('Cloud backup saved at '+new Date().toLocaleString()+'.');}
 catch(e){status('Cloud upload failed: '+e.message);if(!silent)alert('Cloud backup was not saved. '+e.message)}
 finally{busy=false}
}
async function restore(){if(busy||!session)return;busy=true;try{
 const rows=await request('/rest/v1/garage_backups?select=garage_data,updated_at&limit=1',{method:'GET'},true);
 if(!Array.isArray(rows)||!rows.length){status('No cloud backup exists yet. Upload this device first.');return}
 const backup=rows[0].garage_data;if(!backup||!Array.isArray(backup.vehicles)||!Array.isArray(backup.services)||!Array.isArray(backup.expenses)||!Array.isArray(backup.plans))throw Error('Cloud backup is missing required garage records.');
 if(!confirm('Replace ALL garage records on this device with the cloud backup from '+new Date(rows[0].updated_at).toLocaleString()+'? Export a local JSON backup first.'))return;
 window.MyGarageCloudBridge.setData(backup);enabled=true;status('Cloud backup restored. Automatic uploads are now enabled.');}
 catch(e){status('Cloud restore failed: '+e.message)}finally{busy=false}
}
window.MyGarageCloud={render,onLocalSave(){if(!enabled||!session)return;clearTimeout(timer);timer=setTimeout(()=>upload(true),2500)}};
document.addEventListener('submit',e=>{if(e.target?.id==='cloudAuthForm'){e.preventDefault();authenticate('login')}});
document.addEventListener('click',e=>{const id=e.target?.id;if(id==='cloudSignUp')authenticate('signup');if(id==='cloudUpload'){if(confirm('Upload this device to your account? This replaces the previous cloud snapshot.'))upload()}if(id==='cloudRestore')restore();if(id==='cloudSignOut'){clearTimeout(timer);session=null;enabled=false;localStorage.removeItem(STORE);render()}});
})();
