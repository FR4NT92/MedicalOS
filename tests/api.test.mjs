import {describe,it,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {request as httpRequest} from 'node:http';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const dir=mkdtempSync(join(tmpdir(),'clinic-os-test-'));
const dbFile=join(dir,'test.sqlite');
const base='http://127.0.0.1:3199';
let child,admin,other,superadmin,createdPatient,createdAppt,record,logged='';
async function start(){
 child=spawn(process.execPath,[join(root,'apps/web/server.mjs')],{env:{...process.env,PORT:'3199',CLINIC_DB:dbFile,NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
 child.stderr.on('data',d=>logged+=d);child.stdout.on('data',d=>logged+=d);
 for(let i=0;i<80;i++){try{const r=await fetch(base+'/api/health');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,50));}throw Error('Server startup failed: '+logged);
}
async function stop(){if(child&&!child.killed){await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});}}
async function req(path,{method='GET',data,session,headers={}}={}){
 const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});
 return {status:r.status,body:await r.json(),headers:r.headers};
}
async function login(email,password){const r=await req('/api/login',{method:'POST',data:{email,password}});assert.equal(r.status,200);return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:r.body.csrf,user:r.body.user};}
const appointment=(more={})=>({patientId:'patient-1',doctorId:'doctor-1',startAt:'2031-10-30T09:00:00-03:00',duration:30,type:'CONSULTATION',...more});
describe('Clinic-OS: pruebas reales contra HTTP y SQLite (solo datos ficticios)',()=>{
 before(async()=>{await start();admin=await login('admin@clinica.com','admin123');other=await login('otra@clinica.test','demo-otra-2026');superadmin=await login('superadmin@clinica.test','demo-admin-2026');});
 after(async()=>{await stop();rmSync(dir,{recursive:true,force:true});});
 it('01 · health identifica demo y no declara integraciones activas',async()=>{const r=await req('/api/health');assert.equal(r.status,200);assert.equal(r.body.mode,'LOCAL_DEMO');assert.equal(r.body.externalIntegrations,false);});
 it('02 · API privada rechaza solicitudes sin sesión',async()=>{assert.equal((await req('/api/state')).status,401);});
 it('03 · credenciales incorrectas no acceden por fallback',async()=>{assert.equal((await req('/api/login',{method:'POST',data:{email:'admin@clinica.com',password:'incorrecta'}})).status,401);});
 it('04 · cookie de acceso HttpOnly y SameSite=Strict',async()=>{const r=await req('/api/login',{method:'POST',data:{email:'admin@clinica.com',password:'admin123'}});assert.match(r.headers.get('set-cookie'),/HttpOnly/);assert.match(r.headers.get('set-cookie'),/SameSite=Strict/);});
 it('05 · estado inicial lee pacientes y turnos desde SQLite',async()=>{const r=await req('/api/state',{session:admin});assert.equal(r.status,200);assert.equal(r.body.patients.length,8);assert.equal(r.body.appointments.length,7);assert.equal(r.body.doctors.length,2);});
 it('06 · estado público de la sesión no expone hash de contraseña',async()=>{const r=await req('/api/session',{session:admin});assert.equal(r.body.user.passwordHash,undefined);assert.equal(r.body.user.salt,undefined);});
 it('07 · una clínica no puede abrir administración central',async()=>assert.equal((await req('/api/admin',{session:admin})).status,403));
 it('08 · Super Admin no puede leer datos clínicos',async()=>assert.equal((await req('/api/state',{session:superadmin})).status,403));
 it('09 · segunda clínica recibe únicamente su paciente',async()=>{const r=await req('/api/state',{session:other});assert.equal(r.body.patients.length,1);assert.equal(r.body.patients[0].id,'patient-other');});
 it('10 · un header de workspace falsificado no cambia el tenant',async()=>{const r=await req('/api/state',{session:admin,headers:{'X-Workspace-Id':'clinic-other'}});assert.ok(r.body.patients.every(p=>p.workspaceId==='clinic-demo'));});
 it('11 · mutaciones exigen CSRF de la sesión',async()=>{const r=await req('/api/leads',{method:'POST',data:{},session:admin,headers:{'X-CSRF-Token':'wrong'}});assert.equal(r.status,403);assert.equal(r.body.code,'CSRF');});
 it('12 · se rechaza un origen externo',async()=>{assert.equal((await req('/api/login',{method:'POST',data:{},headers:{Origin:'https://malicious.example'}})).status,403);});
 it('13 · rechaza nombres de host ajenos a loopback',async()=>{const status=await new Promise((resolve,reject)=>{const request=httpRequest({hostname:'127.0.0.1',port:3199,path:'/api/health',headers:{Host:'foreign.example'}},r=>{r.resume();r.on('end',()=>resolve(r.statusCode));});request.on('error',reject);request.end();});assert.equal(status,403);});
 it('14 · crea paciente sin apellido y persiste',async()=>{const r=await req('/api/patients',{method:'POST',session:admin,data:{firstName:'Prueba',phone:'+540000008888',dni:'DEMO-QA'}});assert.equal(r.status,201);createdPatient=r.body;const s=await req('/api/state',{session:admin});assert.ok(s.body.patients.some(p=>p.id===createdPatient.id));});
 it('15 · evita duplicar teléfono dentro de una clínica',async()=>{assert.equal((await req('/api/patients',{method:'POST',session:admin,data:{firstName:'Duplicado',phone:'+540000008888'}})).status,409);});
 it('16 · editar un paciente de otra clínica devuelve 404',async()=>{assert.equal((await req('/api/patients/patient-other',{method:'PATCH',session:admin,data:{firstName:'Intrusión'}})).status,404);});
 it('17 · una fecha inválida no crea un turno',async()=>{assert.equal((await req('/api/appointments',{method:'POST',session:admin,data:appointment({startAt:'not-a-date'})})).status,400);});
 it('18 · crea turno con fecha y zona horaria explícitas',async()=>{const r=await req('/api/appointments',{method:'POST',session:admin,data:appointment()});assert.equal(r.status,201);assert.equal(r.body.startAt,'2031-10-30T12:00:00.000Z');createdAppt=r.body;});
 it('19 · detecta solapamiento que contiene por completo otro turno',async()=>{const r=await req('/api/appointments',{method:'POST',session:admin,data:appointment({patientId:'patient-2',startAt:'2031-10-30T08:45:00-03:00',duration:90})});assert.equal(r.status,409);});
 it('20 · otro profesional puede atender a otro paciente a la misma hora',async()=>{assert.equal((await req('/api/appointments',{method:'POST',session:admin,data:appointment({patientId:'patient-2',doctorId:'doctor-2'})})).status,201);});
 it('21 · un mismo paciente no puede superponer turnos',async()=>{assert.equal((await req('/api/appointments',{method:'POST',session:admin,data:appointment({doctorId:'doctor-2'})})).status,409);});
 it('22 · cancelar libera el horario del profesional',async()=>{assert.equal((await req('/api/appointments/'+createdAppt.id,{method:'PATCH',session:admin,data:{status:'CANCELLED'}})).status,200);assert.equal((await req('/api/appointments',{method:'POST',session:admin,data:appointment({patientId:'patient-3'})})).status,201);});
 it('23 · reactivar un turno cancelado también verifica conflictos',async()=>{assert.equal((await req('/api/appointments/'+createdAppt.id,{method:'PATCH',session:admin,data:{status:'CONFIRMED'}})).status,409);});
 it('24 · no acepta un profesional de otra clínica',async()=>{assert.equal((await req('/api/appointments',{method:'POST',session:admin,data:appointment({doctorId:'doctor-other'})})).status,404);});
 it('25 · guarda una evolución SOAP con hash técnico',async()=>{const r=await req('/api/records',{method:'POST',session:admin,data:{patientId:'patient-1',subjective:'Nota ficticia',objective:'Prueba',assessment:'Sin decisión clínica',plan:'Continuar prueba de software'}});assert.equal(r.status,201);assert.match(r.body.hash,/^[a-f0-9]{64}$/);assert.equal(r.body.legalSignature,false);record=r.body;});
 it('26 · la API no permite actualizar ni borrar evoluciones',async()=>{for(const method of ['PATCH','DELETE'])assert.equal((await req('/api/records/'+record.id,{method,session:admin,data:{content:'overwrite'}})).status,405);});
 it('27 · SQLite impide modificación de una evolución mediante trigger',()=>{const local=new DatabaseSync(dbFile);assert.throws(()=>local.prepare('UPDATE records SET content=? WHERE id=?').run('{}',record.id),/APPEND_ONLY/);local.close();});
 it('28 · enmienda conserva original y encadena hashes',async()=>{const r=await req('/api/records',{method:'POST',session:admin,data:{patientId:'patient-1',subjective:'Corrección ficticia',plan:'Enmienda de prueba',amendmentOf:record.id}});assert.equal(r.status,201);assert.equal(r.body.previousHash,record.hash);assert.equal(r.body.type,'AMENDMENT');});
 it('29 · verificador público no filtra datos médicos ni identidad',async()=>{const r=await req('/api/verify/'+record.id);assert.equal(r.status,200);assert.equal(r.body.integrity,true);assert.equal(r.body.legalSignature,false);assert.equal(r.body.patientId,undefined);assert.equal(r.body.content,undefined);assert.equal(r.body.author,undefined);});
 it('30 · pago manual es idempotente y no afirma acreditación',async()=>{const opts={method:'POST',session:admin,data:{patientId:'patient-1',amount:123.45,method:'EFECTIVO',reference:'test'},headers:{'Idempotency-Key':'qa-operation-001'}};const first=await req('/api/payments',opts),second=await req('/api/payments',opts);assert.equal(first.status,201);assert.equal(second.status,200);assert.equal(first.body.id,second.body.id);assert.equal(second.body.replayed,true);assert.equal(second.body.externalVerification,false);});
 it('31 · la misma clave de pago con otro importe produce conflicto',async()=>{const r=await req('/api/payments',{method:'POST',session:admin,data:{patientId:'patient-1',amount:124,method:'EFECTIVO',reference:'test'},headers:{'Idempotency-Key':'qa-operation-001'}});assert.equal(r.status,409);});
 it('32 · importes negativos o de más de dos decimales son rechazados',async()=>{for(const amount of [-1,0,12.345])assert.equal((await req('/api/payments',{method:'POST',session:admin,data:{patientId:'patient-1',amount},headers:{'Idempotency-Key':'invalid-amount-001'}})).status,400);});
 it('33 · comprobantes son borradores sin CAE',async()=>{const r=await req('/api/invoices',{method:'POST',session:admin,data:{patientId:'patient-1',amount:500,concept:'Prueba de documento'}});assert.equal(r.status,201);assert.equal(r.body.status,'DRAFT');assert.equal(r.body.cae,null);assert.equal(r.body.fiscalValidity,false);});
 it('34 · los conectores fallan cerrados sin acciones externas',async()=>{for(const path of ['/api/reminders','/api/integrations/highlevel/test','/api/integrations/mercadopago/pay','/api/integrations/arca/issue']){const r=await req(path,{method:'POST',session:admin,data:{}});assert.equal(r.status,409);assert.equal(r.body.code,'NOT_CONNECTED');}});
 it('35 · pausa del asistente se aplica en el servidor',async()=>{await req('/api/settings',{method:'PATCH',session:admin,data:{pauseAssistant:true}});assert.equal((await req('/api/copilot',{method:'POST',session:admin,data:{text:'Agenda de hoy'}})).status,409);await req('/api/settings',{method:'PATCH',session:admin,data:{pauseAssistant:false}});const r=await req('/api/copilot',{method:'POST',session:admin,data:{text:'Resumen de hoy'}});assert.equal(r.body.source,'LOCAL_RULES');assert.equal(r.body.externalModel,false);});
 it('36 · alta de clínica es exclusiva de Super Admin',async()=>{const r=await req('/api/admin/workspaces',{method:'POST',session:superadmin,data:{name:'Clínica QA'}});assert.equal(r.status,201);const a=await req('/api/admin',{session:superadmin});assert.ok(a.body.workspaces.some(w=>w.id===r.body.id&&w.patientCount===0));});
 it('37 · un borrador de receta no se presenta como receta válida',async()=>{const r=await req('/api/prescriptions',{method:'POST',session:admin,data:{patientId:'patient-1',content:'Texto ficticio de prueba, sin indicación médica.'}});assert.equal(r.status,201);assert.equal(r.body.status,'DRAFT');assert.equal(r.body.legalValidity,false);});
 it('38 · pacientes y pagos persisten al reiniciar el proceso',async()=>{await stop();await start();const s=await req('/api/state',{session:admin});assert.equal(s.status,200);assert.ok(s.body.patients.some(p=>p.id===createdPatient.id));assert.equal(s.body.payments.filter(p=>p.idempotencyKey==='qa-operation-001').length,1);});
 it('39 · el arranque en modo producción se rechaza',()=>{const r=spawnSync(process.execPath,[join(root,'apps/web/server.mjs')],{env:{...process.env,NODE_ENV:'production',PORT:'3299',CLINIC_DB:join(dir,'unused.sqlite')},encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/exclusivamente local\/demo/);});
 it('40 · cerrar sesión invalida el acceso anterior',async()=>{assert.equal((await req('/api/logout',{method:'POST',session:other,data:{}})).status,200);assert.equal((await req('/api/state',{session:other})).status,401);});
});
