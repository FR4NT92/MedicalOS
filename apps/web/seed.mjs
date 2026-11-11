import { randomUUID, randomBytes, scryptSync } from 'node:crypto';

export function clinicDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Argentina/Buenos_Aires', year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export const at = (date, time) => new Date(`${date}T${time}:00-03:00`).toISOString();
export const defaults = { pauseAssistant:false, pauseWebhooks:false, pauseBilling:false, opening:'09:00', closing:'18:00', slotMinutes:30 };

export const defaultIntegrations = [
  {
    id: 'highlevel',
    name: 'GoHighLevel',
    category: 'CRM y Pipelines',
    initials: 'HL',
    description: 'Sincronización bidireccional de pacientes, oportunidades en embudos y agendamiento de turnos.',
    status: 'NOT_CONNECTED',
    config: JSON.stringify({ locationId: '', apiKey: '', webhookUrl: '' })
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    category: 'Mensajería y Notificaciones',
    initials: 'WA',
    description: 'Envío automático de confirmaciones de turnos, recordatorios 24h antes y reprogramaciones.',
    status: 'NOT_CONNECTED',
    config: JSON.stringify({ phoneNumberId: '', appId: '', token: '', templateName: 'recordatorio_turno' })
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    category: 'Pasarela de Cobros',
    initials: 'MP',
    description: 'Cobro de copagos y consultas mediante links de pago, checkout integrado y notificaciones IPN.',
    status: 'NOT_CONNECTED',
    config: JSON.stringify({ accessToken: '', publicKey: '', sandbox: false })
  },
  {
    id: 'arca',
    name: 'ARCA (ex AFIP)',
    category: 'Facturación Electrónica',
    initials: 'AR',
    description: 'Emisión de comprobantes fiscales oficiales (Facturas A, B, C) con obtención directa de CAE.',
    status: 'NOT_CONNECTED',
    config: JSON.stringify({ cuit: '', puntoVenta: '0001', certPath: '', privateKeyPath: '', ambiente: 'homologacion' })
  },
  {
    id: 'ai',
    name: 'Proveedor de Inteligencia Artificial',
    category: 'Asistente Clínico y Operativo',
    initials: 'IA',
    description: 'Modelos LLM para asistencia operativa, resúmenes de historias clínicas y redacción de evoluciones.',
    status: 'NOT_CONNECTED',
    config: JSON.stringify({ provider: 'openai', model: 'gpt-4o', apiKey: '', temperature: 0.3 })
  },
  {
    id: 'google',
    name: 'Google Calendar',
    category: 'Calendarios de Profesionales',
    initials: 'GC',
    description: 'Sincronización en tiempo real de agendas médicas con Google Calendar institucional.',
    status: 'NOT_CONNECTED',
    config: JSON.stringify({ clientId: '', clientSecret: '', calendarId: '' })
  }
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
    // Workspaces
    for (const [id,name] of [['clinic-central','Clínica Médica Abundance'],['clinic-nordelta','Abundance Medical Center']]) {
      put('workspaces',{id,name,timezone:'America/Argentina/Buenos_Aires',color:'#357a60',status:'ACTIVE',createdAt:now});
      put('settings',{workspaceId:id,value:JSON.stringify(defaults)});
    }

    // Default integrations
    for (const item of defaultIntegrations) {
      put('integrations', {
        id: item.id,
        name: item.name,
        category: item.category,
        initials: item.initials,
        description: item.description,
        status: item.status,
        config: item.config,
        updatedAt: now
      });
    }

    // Users
    for (const [id,workspaceId,role,email,name,password] of [
      ['user-admin','clinic-central','CLINIC_ADMIN','admin@clinica.com','Dra. Julia Morales','admin123'],
      ['user-nordelta','clinic-nordelta','CLINIC_ADMIN','admin@nordelta.com','Dr. Andrés Valenzuela','admin123'],
      ['user-other','clinic-nordelta','CLINIC_ADMIN','otra@clinica.test','Dra. Mariana Costa','demo-otra-2026'],
      ['user-super',null,'SUPER_ADMIN','superadmin@clinica.com','Super Administrador','admin123'],
      ['user-super-test',null,'SUPER_ADMIN','superadmin@clinica.test','Super Administrador QA','demo-admin-2026']
    ]) {
      const salt=randomBytes(16).toString('hex');
      put('users',{id,workspaceId,role,email,name,salt,passwordHash:scryptSync(password,salt,64).toString('hex')});
    }

    // Doctors
    const doctors=[['doctor-1','Dra. Julia Morales','Medicina General y Preventiva'],['doctor-2','Dr. Tomás Benítez','Cardiología Clínica']];
    for(const [id,name,specialty] of doctors) put('doctors',{id,workspaceId:'clinic-central',name,specialty});
    put('doctors',{id:'doctor-nordelta',workspaceId:'clinic-nordelta',name:'Dra. Mariana Costa',specialty:'Dermatología'});

    // Patients
    const patientsData=[
      ['Ana','Fernández','34.891.204','+541148213901','ana.fernandez@gmail.com','OSDE 310','ACTIVE','Controles semestrales regulares.'],
      ['Bruno','Rossi','29.415.882','+541151239844','b.rossi@outlook.com','Particular','ACTIVE','Paciente hipertenso bajo control farmacológico.'],
      ['Carla','Méndez','38.102.943','+541164992110','carla.mendez@hotmail.com','Swiss Medical','ACTIVE','Apta para actividad física regular.'],
      ['Diego','Castro','31.542.119','+541139482711','diegocastro@yahoo.com','Particular','ACTIVE','Control cardiológico anual programado.'],
      ['Elena','Gómez','27.819.340','+541178223400','elena.gomez@gmail.com','Galeno Oro','ACTIVE','Evaluación prequirúrgica en curso.'],
      ['Fabio','Ruiz','36.210.455','+541145129988','fabio.ruiz@gmail.com','Particular','ACTIVE','Seguimiento de laboratorio completado.'],
      ['Gabriela','Ortiz','33.901.218','+541160293847','gortiz@gmail.com','OSDE 210','ACTIVE','Control de rutina.'],
      ['Hugo','Silva','26.491.002','+541158392019','hugo.silva@outlook.com','Medifé','ACTIVE','Derivación a cardiología.']
    ];

    patientsData.forEach(([firstName,lastName,dni,phone,email,coverage,status,notes],i)=> put('patients',{
      id:`patient-${i+1}`,workspaceId:'clinic-central',firstName,lastName,dni,phone,email,coverage,status,notes,createdAt:now,updatedAt:now
    }));

    put('patients',{
      id:'patient-nd-1',workspaceId:'clinic-nordelta',firstName:'Martina',lastName:'Varela',dni:'35.402.190',phone:'+541148889900',email:'mvarela@gmail.com',coverage:'Particular',status:'ACTIVE',notes:'Primera consulta.',createdAt:now,updatedAt:now
    });

    // Appointments
    const hours=['09:00','09:30','10:00','11:00','11:30','14:00','16:00'];
    const states=['COMPLETED','COMPLETED','CONFIRMED','PENDING','CONFIRMED','PENDING','CONFIRMED'];
    hours.forEach((h,i)=> {
      const startAt=at(today,h); const endAt=new Date(Date.parse(startAt)+30*60000).toISOString();
      put('appointments',{
        id:`appointment-${i+1}`,workspaceId:'clinic-central',patientId:`patient-${i+1}`,
        doctorId:i===4?'doctor-2':'doctor-1',startAt,endAt,duration:30,
        type:i%3===0?'FOLLOW_UP':'CONSULTATION',status:states[i],notes:'Consulta de rutina programada',createdAt:now
      });
    });

    // Leads / Contacts
    const leads=[
      ['Lucía Herrera','+541161223344','Meta Ads','Consulta preventiva','NEW'],
      ['Mateo Giménez','+541159887766','Google Ads','Chequeo cardiológico','NEW'],
      ['Nora Domínguez','+541144332211','Web Institucional','Medicina general','CONTACTED'],
      ['Óscar Pereyra','+541177665544','Referido profesional','Plan de control','QUALIFIED'],
      ['Paula Blanco','+541133221100','WhatsApp','Evaluación médica','QUALIFIED'],
      ['Rafael Solís','+541188990011','Web Institucional','Consulta periódica','CONVERTED']
    ];
    leads.forEach(([name,phone,source,interest,status],i)=>put('leads',{
      id:`lead-${i+1}`,workspaceId:'clinic-central',name,phone,source,interest,status,createdAt:now,updatedAt:now
    }));

    // Payments
    [35000,42000,28000].forEach((amount,i)=>put('payments',{
      id:`payment-${i+1}`,workspaceId:'clinic-central',patientId:`patient-${i+1}`,
      appointmentId:null,amountCents:amount*100,method:'TRANSFERENCIA',reference:`TRF-${38900+i}`,
      idempotencyKey:`seed-${i}`,createdAt:now
    }));

    // Insumos Clínicos de Inventario
    const defaultInventory = [
      ['inv-1', 'Guantes de nitrilo sin polvo talle M (Caja x 100)', 'GUA-NIT-M', 'Descartables', 35, 10, 'cajas', 'LT-48201', '2028-05-30', 'Para examen clínico y extracciones'],
      ['inv-2', 'Jeringas descartables 5ml con aguja 21G (Caja x 100)', 'JER-5ML-21G', 'Descartables', 18, 8, 'cajas', 'LT-99120', '2027-11-15', 'Inyectables y toma de muestras'],
      ['inv-3', 'Gasas estériles hidrófilas 10x10cm (Sobre x 10)', 'GAS-EST-10', 'Curaciones', 50, 15, 'sobres', 'LT-10294', '2029-01-20', 'Curaciones y antisepsia'],
      ['inv-4', 'Solución Fisiológica 0.9% 500ml', 'SUER-FIS-500', 'Soluciones y Sueros', 28, 10, 'frascos', 'LT-77123', '2027-08-10', 'Infusiones y lavado de heridas'],
      ['inv-5', 'Alcohol Etílico 70% 1 Litro', 'ALC-70-1L', 'Antisépticos', 14, 5, 'botellas', 'LT-88122', '2028-03-15', 'Desinfección de consultorios'],
      ['inv-6', 'Lidocaína 2% c/epinefrina ampolla 5ml (Caja x 10)', 'LID-EPI-2', 'Medicamentos', 12, 5, 'cajas', 'LT-11029', '2026-12-10', 'Anestésico local para procedimientos'],
      ['inv-7', 'Barbijos quirúrgicos tricapa termosellados (Caja x 50)', 'BAR-TRI-50', 'Descartables', 22, 10, 'cajas', 'LT-55419', '2028-06-30', 'Protección personal equipo de salud']
    ];

    defaultInventory.forEach(([id, name, sku, category, quantity, minQuantity, unit, lotNumber, expiryDate, notes]) => {
      put('inventory', {
        id, workspaceId: 'clinic-central', name, sku, category, quantity, minQuantity, unit, lotNumber, expiryDate, notes, status: 'ACTIVE', createdAt: now, updatedAt: now
      });
    });

    // Audit
    put('audit',{
      id:randomUUID(),workspaceId:'clinic-central',actor:'Sistema',action:'SYSTEM_INITIALIZED',
      entity:'workspace',entityId:'clinic-central',createdAt:now,details:'Inicialización del sistema de gestión médica.'
    });

    db.exec('COMMIT');
  } catch(e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
