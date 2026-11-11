/**
 * Clinic-OS local demo. Node >=22.13, SQLite built-in; zero npm dependencies.
 * Not a production healthcare system. All external integrations are fail-closed.
 */
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID, randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedDatabase, clinicDate, defaults, integrationList } from './seed.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||3000);
const HOST=process.env.HOST||'127.0.0.1';
if (!['127.0.0.1','localhost','::1'].includes(HOST) && process.env.ALLOW_LOCAL_CONTAINER!=='1') {
  throw new Error('Esta versión demo solo escucha en localhost. No publicarla en Internet.');
}
if (process.env.NODE_ENV==='production') throw new Error('Esta entrega es exclusivamente local/demo. No habilita producción.');
const dataFile=process.env.CLINIC_DB||join(here,'data','clinic-demo.sqlite');
mkdirSync(dirname(dataFile),{recursive:true,mode:0o700});
const db=new DatabaseSync(dataFile);
db.exec(`
PRAGMA foreign_keys=ON;
PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY,name TEXT NOT NULL,timezone TEXT NOT NULL,color TEXT NOT NULL,createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,workspaceId TEXT REFERENCES workspaces(id),role TEXT NOT NULL,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,salt TEXT NOT NULL,passwordHash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(tokenHash TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expiresAt INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(workspaceId TEXT PRIMARY KEY REFERENCES workspaces(id),value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS doctors(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),name TEXT NOT NULL,specialty TEXT NOT NULL,UNIQUE(workspaceId,id));
CREATE TABLE IF NOT EXISTS patients(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),firstName TEXT NOT NULL,lastName TEXT NOT NULL,dni TEXT NOT NULL,phone TEXT NOT NULL,email TEXT NOT NULL,coverage TEXT NOT NULL,status TEXT NOT NULL,notes TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,UNIQUE(workspaceId,phone),UNIQUE(workspaceId,id));
CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,doctorId TEXT NOT NULL,startAt TEXT NOT NULL,endAt TEXT NOT NULL,duration INTEGER NOT NULL,type TEXT NOT NULL,status TEXT NOT NULL,notes TEXT NOT NULL,createdAt TEXT NOT NULL,FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id),FOREIGN KEY(workspaceId,doctorId) REFERENCES doctors(workspaceId,id));
CREATE INDEX IF NOT EXISTS appointment_slots ON appointments(workspaceId,doctorId,startAt,endAt);
CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL REFERENCES workspaces(id),name TEXT NOT NULL,phone TEXT NOT NULL,source TEXT NOT NULL,interest TEXT NOT NULL,status TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,type TEXT NOT NULL,content TEXT NOT NULL,author TEXT NOT NULL,createdAt TEXT NOT NULL,previousHash TEXT NOT NULL,hash TEXT NOT NULL,amendmentOf TEXT REFERENCES records(id),FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TRIGGER IF NOT EXISTS records_no_update BEFORE UPDATE ON records BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS records_no_delete BEFORE DELETE ON records BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
CREATE TABLE IF NOT EXISTS prescriptions(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,content TEXT NOT NULL,status TEXT NOT NULL,createdAt TEXT NOT NULL,FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,appointmentId TEXT REFERENCES appointments(id),amountCents INTEGER NOT NULL CHECK(amountCents>0),method TEXT NOT NULL,reference TEXT NOT NULL,idempotencyKey TEXT NOT NULL,createdAt TEXT NOT NULL,UNIQUE(workspaceId,idempotencyKey),FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TABLE IF NOT EXISTS invoices(id TEXT PRIMARY KEY,workspaceId TEXT NOT NULL,patientId TEXT NOT NULL,concept TEXT NOT NULL,amountCents INTEGER NOT NULL CHECK(amountCents>0),status TEXT NOT NULL DEFAULT 'DRAFT',createdAt TEXT NOT NULL,FOREIGN KEY(workspaceId,patientId) REFERENCES patients(workspaceId,id));
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,workspaceId TEXT REFERENCES workspaces(id),actor TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,entityId TEXT NOT NULL,createdAt TEXT NOT NULL,details TEXT NOT NULL);
`);
seedDatabase(db);
const now=()=>new Date().toISOString();
const uid=()=>randomUUID();
const hash=s=>createHash('sha256').update(s).digest('hex');
const q=(sql,...args)=>db.prepare(sql).get(...args);
const all=(sql,...args)=>db.prepare(sql).all(...args);
const run=(sql,...args)=>db.prepare(sql).run(...args);
function put(table,obj){const keys=Object.keys(obj); db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...keys.map(k=>obj[k]));return obj;}
class ApiError extends Error{constructor(status,message,code='INVALID_REQUEST'){super(message);this.status=status;this.code=code;}}
function fail(status,msg,code){throw new ApiError(status,msg,code);}
function text(v,key,min=0,max=200){ if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)fail(400,`${key}: usa entre ${min} y ${max} caracteres.`);return v.trim(); }
function optional(v,key,max=200){return v==null?'':text(v,key,0,max);}
function choose(v,values,key){if(!values.includes(v))fail(400,`${key} no válido.`);return v;}
function money(v){if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>10000000||Math.abs(v*100-Math.round(v*100))>0.00001)fail(400,'Importe inválido; usa un número positivo y hasta dos decimales.');return Math.round(v*100);}
function phone(v){const p=text(v,'Teléfono',6,30).replace(/[\s()-]/g,'');if(!/^\+?\d{6,18}$/.test(p))fail(400,'Teléfono inválido.');return p;}
function patient(w,id){const p=q('SELECT * FROM patients WHERE workspaceId=? AND id=?',w,id);if(!p)fail(404,'Paciente no encontrado.','NOT_FOUND');return p;}
function settings(w){return JSON.parse(q('SELECT value FROM settings WHERE workspaceId=?',w)?.value||JSON.stringify(defaults));}
function audit(u,action,entity,entityId,details=''){put('audit',{id:uid(),workspaceId:u.workspaceId,actor:u.name,action,entity,entityId,createdAt:now(),details});}
function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
function publicUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role,workspaceId:u.workspaceId};}
function authenticated(req){
  const cookie=req.headers.cookie||'';const raw=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('clinic_session='))?.slice(15);
  if(!raw)fail(401,'Inicia sesión para continuar.','UNAUTHORIZED');
  const s=q('SELECT * FROM sessions WHERE tokenHash=? AND expiresAt>?',hash(raw),Date.now());
  if(!s)fail(401,'La sesión venció. Vuelve a ingresar.','UNAUTHORIZED');
  const u=q('SELECT * FROM users WHERE id=?',s.userId);
  if(!u)fail(401,'Sesión inválida.','UNAUTHORIZED');
  return {...u,csrf:s.csrf,tokenHash:s.tokenHash};
}
function clinicUser(u){if(!u.workspaceId||u.role==='SUPER_ADMIN')fail(403,'El Super Admin no accede a historias ni datos clínicos.','FORBIDDEN');}
function adminUser(u){if(u.role!=='SUPER_ADMIN')fail(403,'Esta sección requiere Super Admin.','FORBIDDEN');}
function csrf(req,u){if(req.headers['x-csrf-token']!==u.csrf)fail(403,'Token de seguridad inválido. Recarga la página.','CSRF');}
async function body(req){let data='',size=0;for await(const chunk of req){size+=chunk.length;if(size>65536)fail(413,'Solicitud demasiado grande.');data+=chunk;}if(!data)return {};try {const b=JSON.parse(data);if(!b||typeof b!=='object'||Array.isArray(b))throw Error();return b;}catch{fail(400,'JSON inválido.');}}
function json(res,status,data,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...extra});res.end(JSON.stringify(data));}
function recordHash(r){return hash(JSON.stringify({id:r.id,workspaceId:r.workspaceId,patientId:r.patientId,type:r.type,content:r.content,author:r.author,createdAt:r.createdAt,previousHash:r.previousHash,amendmentOf:r.amendmentOf}));}
function integrity(record){
 const chain=all('SELECT rowid,* FROM records WHERE workspaceId=? AND patientId=? ORDER BY rowid',record.workspaceId,record.patientId);let previous='';
 for(const r of chain){if(r.previousHash!==previous||recordHash(r)!==r.hash)return false;if(r.id===record.id)return true;previous=r.hash;}return false;
}
function checkSlot(w,doctorId,patientId,startAt,endAt,except=''){
 const collision=q(`SELECT id FROM appointments WHERE workspaceId=? AND id<>? AND status<>'CANCELLED' AND (doctorId=? OR patientId=?) AND startAt<? AND endAt>? LIMIT 1`,w,except,doctorId,patientId,endAt,startAt);
 if(collision)fail(409,'Ese horario se superpone con otro turno del profesional o del paciente.','CONFLICT');
}
function appointmentInput(w,b){
 const p=patient(w,text(b.patientId,'Paciente',1,100));
 const doctorId=text(b.doctorId,'Profesional',1,100);if(!q('SELECT id FROM doctors WHERE workspaceId=? AND id=?',w,doctorId))fail(404,'Profesional no encontrado.');
 const raw=text(b.startAt,'Fecha',10,40);if(!/(Z|[+-]\d{2}:\d{2})$/.test(raw)||!Number.isFinite(Date.parse(raw)))fail(400,'La fecha debe incluir una zona horaria válida.');
 const d=Number(b.duration??30);if(!Number.isInteger(d)||d<15||d>180||d%15)fail(400,'Duración: 15 a 180 minutos, en intervalos de 15.');
 const startAt=new Date(raw).toISOString(),endAt=new Date(Date.parse(raw)+d*60000).toISOString();
 const type=choose(b.type||'CONSULTATION',['CONSULTATION','FOLLOW_UP','PROCEDURE','SURGERY'],'Tipo de turno');
 return {patientId:p.id,doctorId,startAt,endAt,duration:d,type,notes:optional(b.notes,'Notas',2000)};
}
const attempts=new Map();
async function handle(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
 const host=req.headers.host||'';
 if(!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))fail(403,'Host no permitido en la versión local.');
 const url=new URL(req.url,`http://${host}`),path=url.pathname,method=req.method;
 if(!['GET','HEAD','POST','PATCH','DELETE'].includes(method))fail(405,'Método no permitido.');
 if(['POST','PATCH','DELETE'].includes(method)) {
   if(req.headers.origin&&req.headers.origin!==`http://${host}`)fail(403,'Origen no permitido.','CSRF');
   if(req.headers['sec-fetch-site']==='cross-site')fail(403,'Solicitud externa bloqueada.','CSRF');
 }
 if(path==='/api/health'&&method==='GET')return json(res,200,{status:'ok',mode:'LOCAL_DEMO',version:'1.1.0',database:'sqlite',externalIntegrations:false});
 if(path==='/api/login'&&method==='POST'){
   const key=req.socket.remoteAddress||'local';const old=attempts.get(key);
   if(old&&old.until>Date.now()&&old.count>=12)fail(429,'Demasiados intentos. Espera 10 minutos.','RATE_LIMIT');
   const b=await body(req),email=text(b.email,'Email',3,254).toLowerCase(),password=text(b.password,'Contraseña',1,200);
   const u=q('SELECT * FROM users WHERE email=?',email);
   const candidate=scryptSync(password,u?.salt||'dummy-salt-for-local-demo',64);
   const ok=!!u&&timingSafeEqual(candidate,Buffer.from(u.passwordHash,'hex'));
   if(!ok){const a=old&&old.until>Date.now()?old:{count:0,until:Date.now()+600000};a.count++;attempts.set(key,a);fail(401,'Correo o contraseña incorrectos.','UNAUTHORIZED');}
   attempts.delete(key);run('DELETE FROM sessions WHERE expiresAt<?',Date.now());
   const token=randomBytes(32).toString('hex'),csrfToken=randomBytes(24).toString('hex');
   put('sessions',{tokenHash:hash(token),userId:u.id,csrf:csrfToken,expiresAt:Date.now()+8*60*60*1000});audit(u,'LOGIN','user',u.id);
   return json(res,200,{user:publicUser(u),csrf:csrfToken},{'Set-Cookie':`clinic_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`});
 }
 if(path.startsWith('/api/verify/')&&method==='GET'){
   const id=path.slice('/api/verify/'.length);const r=q('SELECT * FROM records WHERE id=?',id);
   if(!r)fail(404,'Registro no encontrado.','NOT_FOUND');
   return json(res,200,{id:r.id,integrity:integrity(r),hash:r.hash,createdAt:r.createdAt,legalSignature:false,mode:'LOCAL_DEMO',message:'Comprobación de integridad técnica; no es una firma digital certificada. No se exponen datos clínicos.'});
 }
 if(path.startsWith('/api/')){
   const u=authenticated(req),w=u.workspaceId;
   if(['POST','PATCH','DELETE'].includes(method))csrf(req,u);
   if(path==='/api/session'&&method==='GET')return json(res,200,{user:publicUser(u),csrf:u.csrf,workspace:w?q('SELECT * FROM workspaces WHERE id=?',w):null,mode:'LOCAL_DEMO'});
   if(path==='/api/logout'&&method==='POST'){run('DELETE FROM sessions WHERE tokenHash=?',u.tokenHash);return json(res,200,{success:true},{'Set-Cookie':'clinic_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
   if(path==='/api/admin'&&method==='GET'){
     adminUser(u);
     const workspaces=all(`SELECT w.*,(SELECT COUNT(*) FROM patients p WHERE p.workspaceId=w.id) patientCount,(SELECT COUNT(*) FROM appointments a WHERE a.workspaceId=w.id) appointmentCount FROM workspaces w`);
     return json(res,200,{workspaces,integrations:integrationList,mode:'LOCAL_DEMO',clinicalDataAccess:false});
   }
   if(path==='/api/admin/workspaces'&&method==='POST'){
     adminUser(u);const b=await body(req);const workspace={id:uid(),name:text(b.name,'Nombre',2,100),timezone:'America/Argentina/Buenos_Aires',color:'#357a60',createdAt:now()};
     transaction(()=>{put('workspaces',workspace);put('settings',{workspaceId:workspace.id,value:JSON.stringify(defaults)});audit(u,'WORKSPACE_CREATED','workspace',workspace.id);});return json(res,201,workspace);
   }
   clinicUser(u);
   if(path==='/api/state'&&method==='GET'){
     const rows=table=>all(`SELECT * FROM ${table} WHERE workspaceId=? ORDER BY rowid DESC`,w);
     return json(res,200,{workspace:q('SELECT * FROM workspaces WHERE id=?',w),patients:rows('patients'),doctors:rows('doctors'),appointments:rows('appointments'),leads:rows('leads'),records:rows('records').map(r=>({...r,content:JSON.parse(r.content)})),prescriptions:rows('prescriptions'),payments:rows('payments'),invoices:rows('invoices'),audit:all('SELECT * FROM audit WHERE workspaceId=? ORDER BY rowid DESC LIMIT 100',w),settings:settings(w),integrations:integrationList,date:clinicDate(),mode:'LOCAL_DEMO'});
   }
   if(path==='/api/patients'&&method==='POST'){
     const b=await body(req),email=optional(b.email,'Email',254);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Correo inválido.');
     const p={id:uid(),workspaceId:w,firstName:text(b.firstName,'Nombre',1,80),lastName:optional(b.lastName,'Apellido',80),dni:optional(b.dni,'Documento',40),phone:phone(b.phone),email,coverage:optional(b.coverage,'Cobertura',100)||'Particular',status:'ACTIVE',notes:optional(b.notes,'Notas',2000),createdAt:now(),updatedAt:now()};
     if(q('SELECT id FROM patients WHERE workspaceId=? AND phone=?',w,p.phone))fail(409,'Ya existe un paciente con ese teléfono en esta clínica.','DUPLICATE');
     transaction(()=>{put('patients',p);audit(u,'PATIENT_CREATED','patient',p.id);});return json(res,201,p);
   }
   const pat=path.match(/^\/api\/patients\/([^/]+)$/);
   if(pat&&method==='PATCH'){
     const p=patient(w,pat[1]),b=await body(req);const updated={...p};
     for(const k of ['firstName','lastName','dni','email','coverage','notes'])if(k in b)updated[k]=text(b[k],k,k==='firstName'?1:0,k==='notes'?2000:254);
     if('phone' in b)updated.phone=phone(b.phone);
     if('status' in b)updated.status=choose(b.status,['ACTIVE','INACTIVE','DISCHARGED'],'Estado');
     if(updated.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email))fail(400,'Correo inválido.');
     if(q('SELECT id FROM patients WHERE workspaceId=? AND phone=? AND id<>?',w,updated.phone,p.id))fail(409,'Ya existe un paciente con ese teléfono.','DUPLICATE');
     transaction(()=>{run('UPDATE patients SET firstName=?,lastName=?,dni=?,phone=?,email=?,coverage=?,status=?,notes=?,updatedAt=? WHERE workspaceId=? AND id=?',updated.firstName,updated.lastName,updated.dni,updated.phone,updated.email,updated.coverage,updated.status,updated.notes,now(),w,p.id);audit(u,'PATIENT_UPDATED','patient',p.id);});
     return json(res,200,patient(w,p.id));
   }
   if(path==='/api/appointments'&&method==='POST'){
     const b=await body(req),a={id:uid(),workspaceId:w,...appointmentInput(w,b),status:'PENDING',createdAt:now()};
     transaction(()=>{checkSlot(w,a.doctorId,a.patientId,a.startAt,a.endAt);put('appointments',a);audit(u,'APPOINTMENT_CREATED','appointment',a.id);});return json(res,201,a);
   }
   const appt=path.match(/^\/api\/appointments\/([^/]+)$/);
   if(appt&&method==='PATCH'){
     const a=q('SELECT * FROM appointments WHERE workspaceId=? AND id=?',w,appt[1]);if(!a)fail(404,'Turno no encontrado.');const b=await body(req);
     const updated={...a,...(('startAt' in b||'doctorId' in b||'duration' in b)?appointmentInput(w,{...a,...b,patientId:a.patientId}):{})};
     if('status' in b)updated.status=choose(b.status,['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'],'Estado');
     transaction(()=>{if(updated.status!=='CANCELLED')checkSlot(w,updated.doctorId,updated.patientId,updated.startAt,updated.endAt,a.id);
       run('UPDATE appointments SET doctorId=?,startAt=?,endAt=?,duration=?,type=?,status=?,notes=? WHERE workspaceId=? AND id=?',updated.doctorId,updated.startAt,updated.endAt,updated.duration,updated.type,updated.status,updated.notes,w,a.id);audit(u,'APPOINTMENT_UPDATED','appointment',a.id,updated.status);
     });return json(res,200,updated);
   }
   if(path==='/api/leads'&&method==='POST'){
     const b=await body(req),l={id:uid(),workspaceId:w,name:text(b.name,'Nombre',1,120),phone:phone(b.phone),source:text(b.source||'Web','Origen',1,80),interest:optional(b.interest,'Interés',200),status:'NEW',createdAt:now(),updatedAt:now()};transaction(()=>{put('leads',l);audit(u,'LEAD_CREATED','lead',l.id);});return json(res,201,l);
   }
   const lead=path.match(/^\/api\/leads\/([^/]+)$/);
   if(lead&&method==='PATCH'){
     if(!q('SELECT id FROM leads WHERE workspaceId=? AND id=?',w,lead[1]))fail(404,'Contacto no encontrado.');
     const b=await body(req),status=choose(b.status,['NEW','CONTACTED','QUALIFIED','CONVERTED','ARCHIVED'],'Estado');
     transaction(()=>{run('UPDATE leads SET status=?,updatedAt=? WHERE workspaceId=? AND id=?',status,now(),w,lead[1]);audit(u,'LEAD_UPDATED','lead',lead[1],status);});return json(res,200,{id:lead[1],status});
   }
   if(path==='/api/records'&&method==='POST'){
     const b=await body(req);patient(w,text(b.patientId,'Paciente',1,100));
     const content={subjective:text(b.subjective,'Subjetivo',1,8000),objective:optional(b.objective,'Objetivo',8000),assessment:optional(b.assessment,'Evaluación',8000),plan:text(b.plan,'Plan',1,8000)};
     const amendmentOf=b.amendmentOf?text(b.amendmentOf,'Registro original',1,100):null;
     if(amendmentOf&&!q('SELECT id FROM records WHERE id=? AND workspaceId=? AND patientId=?',amendmentOf,w,b.patientId))fail(404,'Registro original no encontrado.');
     const r=transaction(()=>{
       const previous=q('SELECT hash FROM records WHERE workspaceId=? AND patientId=? ORDER BY rowid DESC LIMIT 1',w,b.patientId);
       const r={id:uid(),workspaceId:w,patientId:b.patientId,type:amendmentOf?'AMENDMENT':'SOAP_NOTE',content:JSON.stringify(content),author:u.name,createdAt:now(),previousHash:previous?.hash||'',hash:'',amendmentOf};r.hash=recordHash(r);put('records',r);audit(u,'RECORD_APPENDED','record',r.id);return r;
     });return json(res,201,{...r,content,legalSignature:false});
   }
   if(path.startsWith('/api/records/')&&['PATCH','DELETE'].includes(method))fail(405,'Los registros no se editan ni eliminan. Crea una enmienda.','APPEND_ONLY');
   if(path==='/api/prescriptions'&&method==='POST'){
     const b=await body(req);patient(w,text(b.patientId,'Paciente',1,100));
     const r={id:uid(),workspaceId:w,patientId:b.patientId,content:text(b.content,'Borrador',1,8000),status:'DRAFT',createdAt:now()};transaction(()=>{put('prescriptions',r);audit(u,'PRESCRIPTION_DRAFT_CREATED','prescription',r.id);});return json(res,201,{...r,legalValidity:false});
   }
   if(path==='/api/payments'&&method==='POST'){
     const b=await body(req),key=text(req.headers['idempotency-key'],'Clave de operación',8,100);patient(w,text(b.patientId,'Paciente',1,100));
     if(b.appointmentId&&!q('SELECT id FROM appointments WHERE workspaceId=? AND patientId=? AND id=?',w,b.patientId,b.appointmentId))fail(404,'Turno del paciente no encontrado.');
     const p={id:uid(),workspaceId:w,patientId:b.patientId,appointmentId:b.appointmentId||null,amountCents:money(b.amount),method:choose(b.method||'TRANSFERENCIA',['TRANSFERENCIA','EFECTIVO','TARJETA','OTRO'],'Método'),reference:optional(b.reference,'Referencia',200),idempotencyKey:key,createdAt:now()};
     const prev=q('SELECT * FROM payments WHERE workspaceId=? AND idempotencyKey=?',w,key);
     if(prev){if(['patientId','appointmentId','amountCents','method','reference'].some(k=>prev[k]!==p[k]))fail(409,'La clave de operación ya se usó con otros datos.','IDEMPOTENCY_CONFLICT');return json(res,200,{...prev,replayed:true,manual:true,externalVerification:false});}
     transaction(()=>{put('payments',p);audit(u,'DEMO_PAYMENT_RECORDED','payment',p.id,'Registro manual interno, sin verificación bancaria.');});return json(res,201,{...p,manual:true,externalVerification:false});
   }
   if(path==='/api/invoices'&&method==='POST'){
     const b=await body(req);patient(w,text(b.patientId,'Paciente',1,100));const r={id:uid(),workspaceId:w,patientId:b.patientId,concept:text(b.concept,'Concepto',1,500),amountCents:money(b.amount),status:'DRAFT',createdAt:now()};transaction(()=>{put('invoices',r);audit(u,'INVOICE_DRAFT_CREATED','invoice',r.id);});return json(res,201,{...r,cae:null,fiscalValidity:false});
   }
   if(path==='/api/settings'&&method==='PATCH'){
     if(u.role!=='CLINIC_ADMIN')fail(403,'Se requiere administrador.');const b=await body(req),s=settings(w);
     for(const k of ['pauseAssistant','pauseWebhooks','pauseBilling'])if(k in b){if(typeof b[k]!=='boolean')fail(400,'Valor inválido.');s[k]=b[k];}
     transaction(()=>{run('UPDATE settings SET value=? WHERE workspaceId=?',JSON.stringify(s),w);audit(u,'SETTINGS_UPDATED','settings',w);});return json(res,200,s);
   }
   if(path==='/api/copilot'&&method==='POST'){
     if(settings(w).pauseAssistant)fail(409,'El asistente está pausado desde Configuración.','PAUSED');
     const b=await body(req),command=text(b.text,'Mensaje',1,1000).toLowerCase();
     const appts=all("SELECT a.*,p.firstName,p.lastName FROM appointments a JOIN patients p ON p.id=a.patientId WHERE a.workspaceId=? ORDER BY startAt",w).filter(a=>clinicDate(new Date(a.startAt))===clinicDate()&&a.status!=='CANCELLED');
     let answer='Puedo resumir la agenda, contar pendientes y revisar registros internos de cobros. Soy un asistente local basado en reglas, no un modelo de IA. No envío mensajes ni modifico datos automáticamente.';
     if(/diagn[oó]st|medicamento|dosis|tratamiento|s[ií]ntoma|receta/.test(command))answer='No genero diagnósticos, dosis ni decisiones clínicas. Este asistente solo ofrece resúmenes administrativos de datos de prueba.';
     else if(/cobro|pago|caja|ingreso/.test(command)){const n=q('SELECT COALESCE(SUM(amountCents),0) total,COUNT(*) count FROM payments WHERE workspaceId=?',w);answer=`Hay ${n.count} registros manuales por ${new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(n.total/100)}. Son datos de demostración: no confirman acreditaciones bancarias.`;}
     else if(/pendiente|confirm|recordatorio/.test(command)){const p=appts.filter(a=>a.status==='PENDING');answer=`Hoy hay ${p.length} turnos pendientes de confirmación${p.length?': '+p.map(a=>a.firstName+' '+a.lastName).join(', '):''}. WhatsApp no está conectado; no envié ningún recordatorio.`;}
     else if(/agenda|turno|resumen|hoy/.test(command))answer=`Hoy hay ${appts.length} turnos activos: ${appts.filter(a=>a.status==='CONFIRMED').length} confirmados, ${appts.filter(a=>a.status==='PENDING').length} pendientes y ${appts.filter(a=>a.status==='COMPLETED').length} atendidos. Puedes gestionarlos en Agenda. No realicé cambios.`;
     return json(res,200,{answer,source:'LOCAL_RULES',externalModel:false});
   }
   if(path.startsWith('/api/integrations/')||path==='/api/reminders')fail(409,'Integración no conectada. No se ejecutó ninguna acción externa.','NOT_CONNECTED');
   fail(404,'Ruta no encontrada.','NOT_FOUND');
 }
 if(!['GET','HEAD'].includes(method))fail(405,'Método no permitido.');
 const files={'/app.js':['app.js','text/javascript; charset=utf-8'],'/styles.css':['styles.css','text/css; charset=utf-8'],'/favicon.svg':['favicon.svg','image/svg+xml']};
 const entry=files[path]||(['/', '/login','/admin','/patients','/schedule','/pipeline','/records','/billing','/analytics','/integrations','/settings','/audit'].includes(path)||path.startsWith('/verify/')?['index.html','text/html; charset=utf-8']:null);
 if(!entry)fail(404,'Página no encontrada.');res.writeHead(200,{'Content-Type':entry[1]});res.end(method==='HEAD'?'':readFileSync(join(here,'public',entry[0])));
}
const server=http.createServer((req,res)=>{handle(req,res).catch(e=>{
 if(res.headersSent){res.end();return;}
 if(e instanceof ApiError)return json(res,e.status,{error:e.message,code:e.code});
 console.error('[server]',e.message);json(res,500,{error:'No se pudo completar la operación. Revisa el registro local del servidor.',code:'INTERNAL_ERROR'});
});});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(PORT,HOST,()=>console.log(`Clinic-OS LOCAL DEMO · http://${HOST}:${PORT}\nSolo datos ficticios. Integraciones externas desactivadas.\nBase de datos local: ${dataFile}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
