/* Offline preview ONLY. No real authentication, multi-tenant security or external actions. */
(() => {
'use strict';
const KEY='abundance-clinic-os-preview-v1';
const uid=()=>globalThis.crypto?.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
const dateKey=(v=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));
const now=()=>new Date().toISOString();
const clone=v=>JSON.parse(JSON.stringify(v));
const fail=(message,status=400,code='INVALID_REQUEST')=>{const e=Error(message);e.status=status;e.code=code;throw e;};
const storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}},remove(k){try{localStorage.removeItem(k);}catch{}}};
let saved;try{saved=JSON.parse(storage.get(KEY)||'null');}catch{}
let state=saved?.state||clone(window.CLINIC_SEED),workspaces=saved?.workspaces||[],session=null;
try{session=JSON.parse(storage.get(KEY+'-session')||'null');}catch{}
if(!saved){
 const previous=state.date,current=dateKey();const delta=Date.parse(current+'T12:00:00-03:00')-Date.parse(previous+'T12:00:00-03:00');
 for(const a of state.appointments){a.startAt=new Date(Date.parse(a.startAt)+delta).toISOString();a.endAt=new Date(Date.parse(a.endAt)+delta).toISOString();}
 for(const table of ['patients','leads','payments','audit'])for(const r of state[table]){if(r.createdAt)r.createdAt=now();if(r.updatedAt)r.updatedAt=now();}
 state.audit=state.audit.filter(a=>a.action==='DEMO_CREATED');
 state.date=current;
}
function persist(){state.date=dateKey();storage.set(KEY,JSON.stringify({state,workspaces}));}
function audit(action,entity,entityId,details=''){state.audit.unshift({id:uid(),workspaceId:'clinic-demo',actor:session?.user.name||'Admin Demo',action,entity,entityId,details,createdAt:now()});state.audit=state.audit.slice(0,100);}
function needPatient(id){const p=state.patients.find(p=>p.id===id);if(!p)fail('Paciente no encontrado.',404);return p;}
function amount(n){if(typeof n!=='number'||!Number.isFinite(n)||n<=0||n>10000000||Math.abs(n*100-Math.round(n*100))>0.00001)fail('Importe inválido.');return Math.round(n*100);}
function text(v,key,min=0,max=200){if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)fail(`${key}: longitud no válida.`);return v.trim();}
function appointmentData(b){
 needPatient(b.patientId);if(!state.doctors.some(d=>d.id===b.doctorId))fail('Profesional no encontrado.',404);
 if(!Number.isFinite(Date.parse(b.startAt)))fail('Fecha inválida.');
 const duration=Number(b.duration||30);if(duration<15||duration>180||duration%15)fail('Duración inválida.');
 return {patientId:b.patientId,doctorId:b.doctorId,startAt:new Date(b.startAt).toISOString(),endAt:new Date(Date.parse(b.startAt)+duration*60000).toISOString(),duration,type:b.type||'CONSULTATION',notes:b.notes||''};
}
function checkSlot(a,except=''){if(state.appointments.some(p=>p.id!==except&&p.status!=='CANCELLED'&&(p.doctorId===a.doctorId||p.patientId===a.patientId)&&p.startAt<a.endAt&&p.endAt>a.startAt))fail('Ese horario se superpone con otro turno del profesional o del paciente.',409,'CONFLICT');}
// SHA-256 for offline integrity visualization. Not a legal signature or security boundary.
function sha256(input){
 const bytes=new TextEncoder().encode(input),len=bytes.length,bits=len*8,size=Math.ceil((len+9)/64)*64;
 const buffer=new Uint8Array(size);buffer.set(bytes);buffer[len]=128;
 const view=new DataView(buffer.buffer);view.setUint32(size-8,Math.floor(bits/4294967296));view.setUint32(size-4,bits>>>0);
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],W=new Uint32Array(64);
 const rotr=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let block=0;block<size;block+=64){
  for(let i=0;i<16;i++)W[i]=view.getUint32(block+i*4);
  for(let i=16;i<64;i++){const s0=rotr(W[i-15],7)^rotr(W[i-15],18)^(W[i-15]>>>3),s1=rotr(W[i-2],17)^rotr(W[i-2],19)^(W[i-2]>>>10);W[i]=(W[i-16]+s0+W[i-7]+s1)>>>0;}
  let [a,b,c,d,e,f,g,h]=H;
  for(let i=0;i<64;i++){const s1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g),t1=(h+s1+ch+K[i]+W[i])>>>0,s0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(s0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
  [a,b,c,d,e,f,g,h].forEach((v,i)=>H[i]=(H[i]+v)>>>0);
 }
 return H.map(v=>v.toString(16).padStart(8,'0')).join('');
}
function digest(r){return sha256(JSON.stringify({id:r.id,workspaceId:r.workspaceId,patientId:r.patientId,type:r.type,content:JSON.stringify(r.content),author:r.author,createdAt:r.createdAt,previousHash:r.previousHash,amendmentOf:r.amendmentOf}));}
async function handler(path,method='GET',b={},headers={}){
 b=b||{};
 if(path==='/api/login'){
  if(b.email==='admin@clinica.com'&&b.password==='admin123')session={user:{id:'user-admin',name:'Admin Demo',email:b.email,role:'CLINIC_ADMIN',workspaceId:'clinic-demo'},csrf:'offline-preview'};
  else if(b.email==='superadmin@clinica.test'&&b.password==='demo-admin-2026')session={user:{id:'user-super',name:'Super Admin Demo',email:b.email,role:'SUPER_ADMIN',workspaceId:null},csrf:'offline-preview'};
  else fail('Correo o contraseña incorrectos.',401);
  storage.set(KEY+'-session',JSON.stringify(session));return clone(session);
 }
 if(!session)fail('Inicia sesión para continuar.',401);
 if(path==='/api/session')return clone({...session,workspace:state.workspace,mode:'BROWSER_PREVIEW'});
 if(path==='/api/logout'){session=null;storage.remove(KEY+'-session');return {success:true};}
 if(path==='/api/admin'){
  if(session.user.role!=='SUPER_ADMIN')fail('Se requiere Super Admin.',403);
  return {workspaces:[{...state.workspace,patientCount:state.patients.length,appointmentCount:state.appointments.length},...workspaces],integrations:state.integrations,mode:'BROWSER_PREVIEW'};
 }
 if(path==='/api/admin/workspaces'){
  if(session.user.role!=='SUPER_ADMIN')fail('Se requiere Super Admin.',403);
  const w={id:uid(),name:text(b.name,'Nombre',2,100),timezone:'America/Argentina/Buenos_Aires',patientCount:0,appointmentCount:0,createdAt:now()};workspaces.push(w);persist();return w;
 }
 if(session.user.role==='SUPER_ADMIN')fail('El Super Admin no accede a datos clínicos.',403);
 if(path==='/api/state'){state.date=dateKey();return clone(state);}
 if(path.startsWith('/api/verify/')){
  const id=path.split('/').pop(),r=state.records.find(r=>r.id===id);if(!r)fail('Registro no encontrado.',404);
  let previous='',valid=true;for(const x of [...state.records].reverse().filter(x=>x.patientId===r.patientId)){if(x.previousHash!==previous||digest(x)!==x.hash)valid=false;if(x.id===id)break;previous=x.hash;}
  return {id,hash:r.hash,createdAt:r.createdAt,integrity:valid,legalSignature:false,message:'Comprobación de integridad de la vista previa. Los datos del navegador son editables y no constituyen una firma digital certificada.'};
 }
 if(path==='/api/patients'&&method==='POST'){
  const p={id:uid(),workspaceId:'clinic-demo',firstName:text(b.firstName,'Nombre',1,80),lastName:b.lastName||'',dni:b.dni||'',phone:text(b.phone,'Teléfono',6,30).replace(/[\s()-]/g,''),email:b.email||'',coverage:b.coverage||'Particular',notes:b.notes||'',status:'ACTIVE',createdAt:now(),updatedAt:now()};
  if(!/^\+?\d{6,18}$/.test(p.phone))fail('Teléfono inválido.');if(state.patients.some(x=>x.phone===p.phone))fail('Ya existe un paciente con ese teléfono.',409);
  state.patients.unshift(p);audit('PATIENT_CREATED','patient',p.id);persist();return clone(p);
 }
 if(path.startsWith('/api/patients/')&&method==='PATCH'){
  const p=needPatient(path.split('/').pop());if(b.phone&&state.patients.some(x=>x.id!==p.id&&x.phone===b.phone))fail('Ese teléfono ya está registrado.',409);Object.assign(p,b,{id:p.id,workspaceId:p.workspaceId,updatedAt:now()});audit('PATIENT_UPDATED','patient',p.id);persist();return clone(p);
 }
 if(path==='/api/appointments'&&method==='POST'){
  const a={id:uid(),workspaceId:'clinic-demo',...appointmentData(b),status:'PENDING',createdAt:now()};checkSlot(a);state.appointments.unshift(a);audit('APPOINTMENT_CREATED','appointment',a.id);persist();return clone(a);
 }
 if(path.startsWith('/api/appointments/')&&method==='PATCH'){
  const a=state.appointments.find(x=>x.id===path.split('/').pop());if(!a)fail('Turno no encontrado.',404);
  const updated={...a,...('startAt'in b?appointmentData({...a,...b,patientId:a.patientId}):{}),status:b.status||a.status};
  if(!['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'].includes(updated.status))fail('Estado inválido.');
  if(updated.status!=='CANCELLED')checkSlot(updated,a.id);Object.assign(a,updated);audit('APPOINTMENT_UPDATED','appointment',a.id,a.status);persist();return clone(a);
 }
 if(path==='/api/leads'&&method==='POST'){const l={id:uid(),workspaceId:'clinic-demo',name:text(b.name,'Nombre',1,120),phone:text(b.phone,'Teléfono',6,30),source:b.source||'Web',interest:b.interest||'',status:'NEW',createdAt:now(),updatedAt:now()};state.leads.unshift(l);audit('LEAD_CREATED','lead',l.id);persist();return clone(l);}
 if(path.startsWith('/api/leads/')&&method==='PATCH'){const l=state.leads.find(x=>x.id===path.split('/').pop());if(!l)fail('Contacto no encontrado.',404);if(!['NEW','CONTACTED','QUALIFIED','CONVERTED','ARCHIVED'].includes(b.status))fail('Estado inválido.');l.status=b.status;l.updatedAt=now();audit('LEAD_UPDATED','lead',l.id,b.status);persist();return clone(l);}
 if(path==='/api/records'&&method==='POST'){
  needPatient(b.patientId);if(b.amendmentOf&&!state.records.some(x=>x.id===b.amendmentOf&&x.patientId===b.patientId))fail('Original no encontrado.',404);
  const previous=state.records.find(r=>r.patientId===b.patientId);
  const r={id:uid(),workspaceId:'clinic-demo',patientId:b.patientId,type:b.amendmentOf?'AMENDMENT':'SOAP_NOTE',content:{subjective:text(b.subjective,'Subjetivo',1,8000),objective:b.objective||'',assessment:b.assessment||'',plan:text(b.plan,'Plan',1,8000)},author:session.user.name,createdAt:now(),previousHash:previous?.hash||'',amendmentOf:b.amendmentOf||null,hash:''};r.hash=digest(r);state.records.unshift(r);audit('RECORD_APPENDED','record',r.id);persist();return clone(r);
 }
 if(path==='/api/prescriptions'&&method==='POST'){needPatient(b.patientId);const r={id:uid(),workspaceId:'clinic-demo',patientId:b.patientId,content:text(b.content,'Contenido',1,8000),status:'DRAFT',createdAt:now()};state.prescriptions.unshift(r);audit('PRESCRIPTION_DRAFT_CREATED','prescription',r.id);persist();return clone(r);}
 if(path==='/api/payments'&&method==='POST'){
  needPatient(b.patientId);const k=headers['Idempotency-Key'],p={id:uid(),workspaceId:'clinic-demo',patientId:b.patientId,amountCents:amount(b.amount),method:b.method||'TRANSFERENCIA',reference:b.reference||'',idempotencyKey:k,createdAt:now()};
  if(!k)fail('Falta clave de operación.');const prev=state.payments.find(p=>p.idempotencyKey===k);if(prev){if(['patientId','amountCents','method','reference'].some(x=>prev[x]!==p[x]))fail('La operación ya existe con otros datos.',409);return clone({...prev,replayed:true});}
  state.payments.unshift(p);audit('DEMO_PAYMENT_RECORDED','payment',p.id,'Registro de prueba sin acreditación verificada.');persist();return clone(p);
 }
 if(path==='/api/invoices'&&method==='POST'){needPatient(b.patientId);const r={id:uid(),workspaceId:'clinic-demo',patientId:b.patientId,concept:text(b.concept,'Concepto',1,500),amountCents:amount(b.amount),status:'DRAFT',createdAt:now()};state.invoices.unshift(r);audit('INVOICE_DRAFT_CREATED','invoice',r.id);persist();return clone(r);}
 if(path==='/api/settings'&&method==='PATCH'){for(const k of ['pauseAssistant','pauseWebhooks','pauseBilling'])if(typeof b[k]==='boolean')state.settings[k]=b[k];audit('SETTINGS_UPDATED','settings','clinic-demo');persist();return clone(state.settings);}
 if(path==='/api/copilot'&&method==='POST'){
  if(state.settings.pauseAssistant)fail('El asistente está pausado desde Configuración.',409,'PAUSED');
  const command=text(b.text,'Mensaje',1,1000).toLowerCase(),a=state.appointments.filter(a=>dateKey(a.startAt)===dateKey()&&a.status!=='CANCELLED');
  let answer='Puedo resumir tu agenda, pendientes y registros manuales. Soy un asistente local por reglas, sin IA ni servicios externos conectados.';
  if(/diagn[oó]st|medicamento|dosis|tratamiento|s[ií]ntoma|receta/.test(command))answer='No genero diagnósticos, dosis ni decisiones clínicas. Solo puedo resumir datos administrativos de prueba.';
  else if(/cobro|pago|caja|ingreso/.test(command))answer=`Hay ${state.payments.length} registros manuales, por ${new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(state.payments.reduce((s,p)=>s+p.amountCents,0)/100)}. No verifican dinero recibido.`;
  else if(/pendiente|confirm|recordatorio/.test(command))answer=`Hoy hay ${a.filter(a=>a.status==='PENDING').length} turnos pendientes de confirmación. WhatsApp está desconectado; no se envió ningún mensaje.`;
  else if(/agenda|turno|resumen|hoy/.test(command))answer=`Hoy hay ${a.length} turnos activos: ${a.filter(a=>a.status==='CONFIRMED').length} confirmados, ${a.filter(a=>a.status==='PENDING').length} pendientes y ${a.filter(a=>a.status==='COMPLETED').length} atendidos. No realicé cambios.`;
  return {answer,source:'LOCAL_RULES',externalModel:false};
 }
 if(path.startsWith('/api/integrations/')||path==='/api/reminders')fail('Integración no conectada. No se ejecutó ninguna acción externa.',409,'NOT_CONNECTED');
 fail('Esta operación no está disponible en la vista previa.',404);
}
window.PREVIEW_API=async(...args)=>clone(await handler(...args));
persist();
})();
