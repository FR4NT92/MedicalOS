import { randomUUID, randomBytes, scryptSync } from 'node:crypto';

export function clinicDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Argentina/Buenos_Aires', year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export const at = (date, time) => new Date(`${date}T${time}:00-03:00`).toISOString();
export const defaults = { pauseAssistant:false, pauseWebhooks:true, pauseBilling:true, opening:'09:00', closing:'18:00', slotMinutes:30 };
export const integrationList = [
  {id:'highlevel',name:'GoHighLevel',category:'CRM y seguimiento',initials:'HL',description:'Contactos, oportunidades y eventos. Ninguna cuenta vinculada.',status:'NOT_CONNECTED'},
  {id:'whatsapp',name:'WhatsApp Business',category:'Mensajería',initials:'WA',description:'Recordatorios y confirmaciones. No se envían mensajes en esta versión.',status:'NOT_CONNECTED'},
  {id:'google',name:'Google Calendar',category:'Calendarios',initials:'GC',description:'Disponibilidad y sincronización de turnos. Sin autorización OAuth.',status:'NOT_CONNECTED'},
  {id:'mercadopago',name:'Mercado Pago',category:'Cobros online',initials:'MP',description:'Preferencias de pago y verificación de cobros. No se generan enlaces reales.',status:'NOT_CONNECTED'},
  {id:'arca',name:'ARCA',category:'Facturación electrónica',initials:'AR',description:'Comprobantes fiscales y CAE. Solo borradores internos, sin validez fiscal.',status:'NOT_CONNECTED'},
  {id:'ai',name:'Proveedor de IA',category:'Asistente operativo',initials:'IA',description:'Sin modelo conectado. El asistente local responde con reglas y datos de prueba.',status:'NOT_CONNECTED'}
];

export function seedDatabase(db) {
  if (db.prepare('SELECT COUNT(*) AS n FROM workspaces').get().n) return;
  const today = clinicDate();
  const now = new Date().toISOString();
  const put = (table, obj) => {
    const keys=Object.keys(obj);
    db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...keys.map(k=>obj[k]));
  };
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const [id,name] of [['clinic-demo','Clínica Demo Abundance'],['clinic-other','Segunda Clínica Demo']]) {
      put('workspaces',{id,name,timezone:'America/Argentina/Buenos_Aires',color:'#357a60',createdAt:now});
      put('settings',{workspaceId:id,value:JSON.stringify(defaults)});
    }
    for (const [id,workspaceId,role,email,name,password] of [
      ['user-admin','clinic-demo','CLINIC_ADMIN','admin@clinica.com','Admin Demo','admin123'],
      ['user-other','clinic-other','CLINIC_ADMIN','otra@clinica.test','Admin Otra Clínica','demo-otra-2026'],
      ['user-super',null,'SUPER_ADMIN','superadmin@clinica.test','Super Admin Demo','demo-admin-2026']
    ]) {
      const salt=randomBytes(16).toString('hex');
      put('users',{id,workspaceId,role,email,name,salt,passwordHash:scryptSync(password,salt,64).toString('hex')});
    }
    const doctors=[['doctor-1','Dra. Julia Demo','Medicina general'],['doctor-2','Dr. Tomás Demo','Evaluaciones']];
    for(const [id,name,specialty] of doctors) put('doctors',{id,workspaceId:'clinic-demo',name,specialty});
    put('doctors',{id:'doctor-other',workspaceId:'clinic-other',name:'Profesional Otra Clínica',specialty:'Medicina general'});
    const names=[['Ana','Demo'],['Bruno','Demo'],['Carla','Demo'],['Diego','Demo'],['Elena','Demo'],['Fabio','Demo'],['Gabriela','Demo'],['Hugo','Demo']];
    names.forEach(([firstName,lastName],i)=> put('patients',{
      id:`patient-${i+1}`,workspaceId:'clinic-demo',firstName,lastName,
      dni:`DEMO-${String(i+1).padStart(3,'0')}`,phone:`+5400000000${String(i+1).padStart(2,'0')}`,
      email:`paciente${i+1}@example.test`,coverage:i%3?'Particular':'Cobertura demo',
      status:'ACTIVE',notes:'Registro sintético de demostración. No corresponde a una persona real.',createdAt:now,updatedAt:now
    }));
    put('patients',{id:'patient-other',workspaceId:'clinic-other',firstName:'Paciente',lastName:'Otra Clínica',dni:'DEMO-OTRA',phone:'+540000009999',email:'otra@example.test',coverage:'Particular',status:'ACTIVE',notes:'Registro para probar aislamiento.',createdAt:now,updatedAt:now});
    const hours=['09:00','09:30','10:00','11:00','11:30','14:00','16:00'];
    const states=['COMPLETED','COMPLETED','CONFIRMED','PENDING','CONFIRMED','PENDING','CONFIRMED'];
    hours.forEach((h,i)=> {
      const startAt=at(today,h); const endAt=new Date(Date.parse(startAt)+30*60000).toISOString();
      put('appointments',{id:`appointment-${i+1}`,workspaceId:'clinic-demo',patientId:`patient-${i+1}`,doctorId:i===4?'doctor-2':'doctor-1',startAt,endAt,duration:30,type:i%3===0?'FOLLOW_UP':'CONSULTATION',status:states[i],notes:'Turno de demostración',createdAt:now});
    });
    const leadNames=['Lucía Demo','Mateo Demo','Nora Demo','Óscar Demo','Paula Demo','Rafael Demo'];
    const statuses=['NEW','NEW','CONTACTED','QUALIFIED','QUALIFIED','CONVERTED'];
    leadNames.forEach((name,i)=>put('leads',{id:`lead-${i+1}`,workspaceId:'clinic-demo',name,phone:`+54000000100${i}`,source:['Meta Ads','Google Ads','Web','Referido'][i%4],interest:['Primera consulta','Consulta general','Evaluación'][i%3],status:statuses[i],createdAt:now,updatedAt:now}));
    [35000,42000,28000].forEach((amount,i)=>put('payments',{id:`payment-${i+1}`,workspaceId:'clinic-demo',patientId:`patient-${i+1}`,appointmentId:null,amountCents:amount*100,method:'TRANSFERENCIA',reference:`DEMO-${i+1}`,idempotencyKey:`seed-${i}`,createdAt:now}));
    put('audit',{id:randomUUID(),workspaceId:'clinic-demo',actor:'Sistema',action:'DEMO_CREATED',entity:'workspace',entityId:'clinic-demo',createdAt:now,details:'Datos ficticios cargados. No se contactó ningún servicio externo.'});
    db.exec('COMMIT');
  }catch(e){ db.exec('ROLLBACK'); throw e; }
}
