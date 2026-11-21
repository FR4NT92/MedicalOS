(() => {
'use strict';
const PREVIEW = Boolean(window.CLINIC_PREVIEW);
const SUPABASE_CONFIG = {
  url: 'https://jshyrwjfeyybdnzosgik.supabase.co',
  anonKey: 'sb_publishable_DKsMr-TvrAfsv49jWjXIJg__776DkGc'
};
const makeId = () => globalThis.crypto?.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2, '0')).join('');
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const paths = {
  home: '/',
  patients: '/patients',
  schedule: '/schedule',
  pipeline: '/pipeline',
  hospitalDay: '/hospital-day',
  records: '/records',
  staff: '/staff',
  inventory: '/inventory',
  billing: '/billing',
  analytics: '/analytics',
  integrations: '/integrations',
  settings: '/settings',
  audit: '/audit',
  admin: '/admin',
  portal: '/portal'
};

const titles = {
  home: 'Vista general',
  patients: 'Pacientes',
  schedule: 'Agenda',
  pipeline: 'Seguimiento',
  hospitalDay: 'Terapias Ambulatorias',
  records: 'Historia clínica',
  staff: 'Equipo y Personal',
  inventory: 'Inventario e insumos',
  billing: 'Cobros y facturación',
  analytics: 'Rendimiento',
  integrations: 'Conexiones e Integraciones',
  settings: 'Configuración',
  audit: 'Auditoría del Sistema',
  admin: 'Espacios Clínicos',
  portal: 'Portal del Paciente'
};

const statusMap = {
  PENDING: ['Pendiente', 'amber'],
  CONFIRMED: ['Confirmado', 'green'],
  IN_PROGRESS: ['En consulta', 'blue'],
  COMPLETED: ['Atendido', 'gray'],
  CANCELLED: ['Cancelado', 'red'],
  NO_SHOW: ['No asistió', 'red'],
  ACTIVE: ['Activo', 'green'],
  INACTIVE: ['Inactivo', 'gray'],
  DISCHARGED: ['Alta', 'blue'],
  NEW: ['Nuevo', 'blue'],
  CONTACTED: ['Contactado', 'amber'],
  QUALIFIED: ['Calificado', 'green'],
  CONVERTED: ['Convertido', 'green'],
  ARCHIVED: ['Archivado', 'gray'],
  DRAFT: ['Borrador', 'amber'],
  ISSUED: ['Emitido', 'green'],
  CONNECTED: ['Conectado', 'green'],
  NOT_CONNECTED: ['Sin conectar', 'gray'],
  RECEPTIONIST: ['Secretaría / Recepción', 'amber'],
  DOCTOR: ['Médico / Profesional', 'green'],
  CLINIC_ADMIN: ['Admin Clínica', 'blue'],
  SUPER_ADMIN: ['Super Admin', 'primary'],
  SURGERY: ['Cirugía / Quirófano', 'red'],
  PROCEDURE: ['Tratamiento / Procedimiento', 'blue'],
  CONSULTATION: ['Consulta Médica', 'green'],
  FOLLOW_UP: ['Control / Seguimiento', 'amber']
};

const types = {
  CONSULTATION: 'Consulta Médica / Primera Vez',
  SURGERY: 'Intervención Quirúrgica / Cirugía',
  PROCEDURE: 'Tratamiento / Procedimiento Ambulatorio',
  FOLLOW_UP: 'Control Post-Tratamiento / Seguimiento'
};

const auditLabels = {
  STAFF_MEMBER_CREATED: 'Miembro del equipo registrado',
  STAFF_MEMBER_DELETED: 'Miembro del equipo eliminado',
  APPOINTMENT_REASSIGNED: 'Turno reasignado de profesional',
  SYSTEM_INITIALIZED: 'Sistema inicializado',
  LOGIN: 'Inicio de sesión',
  PATIENT_CREATED: 'Paciente registrado',
  PATIENT_UPDATED: 'Ficha médica actualizada',
  APPOINTMENT_CREATED: 'Turno programado',
  APPOINTMENT_UPDATED: 'Turno actualizado',
  LEAD_CREATED: 'Contacto ingresado',
  LEAD_UPDATED: 'Etapa de seguimiento actualizada',
  RECORD_APPENDED: 'Evolución clínica registrada',
  PRESCRIPTION_CREATED: 'Receta médica emitida',
  PAYMENT_RECORDED: 'Cobro registrado',
  INVOICE_CREATED: 'Comprobante emitido',
  SETTINGS_UPDATED: 'Configuración actualizada',
  WORKSPACE_CREATED: 'Clínica dada de alta',
  INTEGRATION_CONFIGURED: 'Conexión configurada',
  INTEGRATION_DISCONNECTED: 'Conexión desactivada',
  INVENTORY_CREATED: 'Insumo registrado',
  INVENTORY_UPDATED: 'Insumo modificado',
  INVENTORY_DELETED: 'Insumo eliminado',
  INVENTORY_STOCK_ADJUSTED: 'Stock de insumo ajustado',
  INVOICE_SHARED: 'Comprobante fiscal compartido'
};

const drawings = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.8M15 3.2a4 4 0 0 1 0 7.6"/><circle cx="9" cy="7" r="4"/>',
  pipeline: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="14" rx="1.5"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8m-8 4h5"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6m18 7h-5v4h5"/>',
  chart: '<path d="M4 3v18h17M8 16v-4m5 4V7m5 9v-6"/>',
  plug: '<path d="M8 3v4m8-4v4M6 7h12v4a6 6 0 0 1-6 6v5m-6-15v4a6 6 0 0 0 6 6"/>',
  settings: '<path d="m12 3 2 3 3-1 2 3-2 3 2 3-2 3-3-1-2 3-2-3-3 1-2-3 2-3-2-3 2-3 3 1z"/><circle cx="12" cy="11" r="3"/>',
  search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  up: '<path d="M7 17 17 7M7 7h10v10"/>',
  spark: '<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3zM20 2v4m-2-2h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  checkcircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 10-8 10S4 17 4 12V6z"/><path d="m8 12 3 3 5-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  warning: '<path d="M10.3 3.8 1.5 19a1.5 1.5 0 0 0 1.3 2h18.4a1.5 1.5 0 0 0 1.3-2L13.7 3.8a2 2 0 0 0-3.4 0zM12 8v5m0 3v1"/>',
  logout: '<path d="M9 4H4v16h5m5-12 4 4-4 4M8 12h13"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h1m4 0h1m-6 4h1m4 0h1m-4 10v-5h2v5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  refresh: '<path d="M20 7a9 9 0 1 0 1 7M20 3v5h-5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  edit: '<path d="m15 4 5 5M4 20l4-1L21 6l-4-4L4 15z"/>',
  external: '<path d="M14 3h7v7m0-7L10 14m-1-9H4v15h15v-5"/>',
  send: '<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
  activity: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  usercheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14-1.41 1.41"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
};

function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[name] || drawings.file}</svg>`;
}

function badge(s) {
  const [label, c] = statusMap[s] || [s, 'gray'];
  return `<span class="badge ${c}"><i class="dot"></i>${esc(label)}</span>`;
}

function initials(s) {
  return String(s || 'Clinica').split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
}

function avatar(name, i = 0, large = false) {
  return `<span class="avatar ${i % 3 === 1 ? 'alt' : i % 3 === 2 ? 'blue' : ''} ${large ? 'large' : ''}">${esc(initials(name))}</span>`;
}

function nameOf(p) {
  return p ? [p.firstName, p.lastName].filter(Boolean).join(' ') : 'Paciente';
}

const fmtMoney = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
const fmtTime = d => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(d));
const dateKey = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));
const fmtDate = (d, short = false) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: short ? 'short' : 'long', ...(short ? {} : { weekday: 'long' }) }).format(new Date(d.length === 10 ? `${d}T12:00:00-03:00` : d));
const plusDays = (s, n) => dateKey(new Date(Date.parse(`${s}T12:00:00-03:00`) + n * 86400000));
const localAt = (d, t) => new Date(`${d}T${t}:00-03:00`).toISOString();

function calcAge(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? age : '';
}

const S = {
  session: null,
  data: null,
  admin: null,
  view: 'home',
  date: dateKey(),
  calendar: 'day',
  doctor: '',
  selectedAgenda: 'ALL',
  staffSearch: '',
  staffRole: '',
  scheduleCategory: 'ALL',
  scheduleMode: 'timeline',
  patientSearch: '',
  patientStatus: '',
  selectedPatient: null,
  homeFilter: 'all',
  billingTab: 'payments',
  inventoryCategory: 'ALL',
  inventorySearch: '',
  omniTab: 'evolutions',
  omniSearch: '',
  omniFromDate: '',
  omniToDate: '',
  omniProblem: '',
  omniSpecialty: '',
  recordAttachmentFilter: 'ALL',
  mobile: false,
  chat: [],
  recordTab: 'notes',
  agendaCollapsed: false,
  supportMode: null,
  preview: PREVIEW,
  portal: {
    token: localStorage.getItem('portal_token') || '',
    patient: null,
    data: null,
    activeTab: 'inicio',
    step: 'dni',
    dniEntered: '',
    phoneEntered: '',
    demoCode: '',
    error: '',
    bookingModal: false,
    uploadModal: false,
    bookingDoctor: '',
    bookingDate: dateKey(),
    bookingTime: '10:00',
    bookingType: 'Consulta Médica',
    bookingAgenda: 'default',
    bookingNotes: ''
  }
};

async function supabaseApi(path, method = 'GET', body = null, headers = {}) {
  const token = S.session?.token || localStorage.getItem('supabase_token');
  const authHeaders = {
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': 'Bearer ' + (token || SUPABASE_CONFIG.anonKey),
    'Content-Type': 'application/json',
    ...(S.supportMode?.id ? { 'x-workspace-id': S.supportMode.id } : {})
  };

  const currentWorkspaceId = S.supportMode?.id || S.session?.user?.workspaceId || 'clinic-central';

  if (path === '/api/login' && method === 'POST') {
    const sbRes = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: body.email, password: body.password })
    });
    if (!sbRes.ok) {
      const sbErr = await sbRes.json().catch(() => ({}));
      throw Error(sbErr.error_description || sbErr.msg || 'Correo electrónico o contraseña incorrectos.');
    }
    const sbData = await sbRes.json();
    const isSuper = ['frantruppa@gmail.com', 'bernaljohansss@gmail.com'].includes(sbData.user.email?.toLowerCase()) ||
      sbData.user.app_metadata?.role === 'SUPER_ADMIN' ||
      sbData.user.user_metadata?.role === 'SUPER_ADMIN';
    const role = isSuper ? 'SUPER_ADMIN' : (sbData.user.app_metadata?.role || sbData.user.user_metadata?.role || 'CLINIC_ADMIN');
    const workspaceId = isSuper ? null : (sbData.user.app_metadata?.workspace_id || sbData.user.user_metadata?.workspace_id || 'clinic-central');

    return {
      user: {
        id: sbData.user.id,
        email: sbData.user.email,
        name: sbData.user.user_metadata?.name || sbData.user.email.split('@')[0],
        role,
        workspaceId
      },
      token: sbData.access_token,
      csrf: 'sb'
    };
  }

  if (path === '/api/session') {
    if (!S.session) throw Error('Inicia sesión para continuar.');
    return S.session;
  }

  if (path === '/api/admin') {
    const [wsRes, integRes, patRes, apptRes] = await Promise.all([
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/workspaces?select=*`, { headers: authHeaders }),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/integrations?select=*&order=id`, { headers: authHeaders }),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients?select=id,workspace_id`, { headers: authHeaders }),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/appointments?select=id,workspace_id`, { headers: authHeaders })
    ]);
    const workspaces = (await wsRes.json()) || [];
    const rawIntegrations = (await integRes.json()) || [];
    const integrations = rawIntegrations.filter(i => !i.workspace_id || i.workspace_id === currentWorkspaceId);
    const patients = (await patRes.json()) || [];
    const appointments = (await apptRes.json()) || [];

    const wsList = workspaces.map(w => ({
      ...w,
      patientCount: patients.filter(p => p.workspace_id === w.id).length,
      appointmentCount: appointments.filter(a => a.workspace_id === w.id).length
    }));

    return {
      workspaces: wsList,
      integrations,
      stats: {
        totalWorkspaces: workspaces.length,
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        connectedIntegrations: integrations.filter(i => i.status === 'CONNECTED').length
      },
      user: S.session?.user
    };
  }

  if (path === '/api/admin/audit') {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/audit_logs?select=*&order=created_at.desc&limit=100`, { headers: authHeaders });
    const logs = (await res.json()) || [];
    return logs.map(l => ({
      id: l.id,
      workspaceId: l.workspace_id,
      actor: l.actor,
      action: l.action,
      entity: l.entity,
      entityId: l.entity_id,
      details: l.details,
      createdAt: l.created_at
    }));
  }

  if (path === '/api/admin/workspaces' && method === 'POST') {
    const newWs = {
      id: 'ws-' + makeId().slice(0, 8),
      name: body.name,
      slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      timezone: 'America/Argentina/Buenos_Aires',
      color: '#357a60'
    };
    const wsRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/workspaces`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newWs)
    });
    if (!wsRes.ok) {
      const err = await wsRes.json().catch(() => ({}));
      throw Error(err.message || 'Error al crear clínica en Supabase.');
    }

    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/settings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        workspace_id: newWs.id,
        value: { closing: '18:00', opening: '09:00', slotMinutes: 30, pauseBilling: false, pauseWebhooks: false, pauseAssistant: false }
      })
    }).catch(() => {});

    if (body.adminEmail && body.adminPassword) {
      const userRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/create_clinic_user`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          p_email: body.adminEmail.toLowerCase().trim(),
          p_password: body.adminPassword.trim(),
          p_name: `Admin ${newWs.name}`,
          p_workspace_id: newWs.id
        })
      });
      if (!userRes.ok) {
        console.warn('[create_clinic_user warning]', await userRes.text());
      }
    }

    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        id: 'audit-' + Date.now(),
        workspace_id: newWs.id,
        actor: S.session?.user?.name || 'Super Admin',
        action: 'WORKSPACE_CREATED',
        entity: 'workspace',
        entity_id: newWs.id,
        details: `Clínica "${newWs.name}" dada de alta.`
      })
    }).catch(() => {});

    return newWs;
  }

  const wsMatch = path.match(/^\/api\/admin\/workspaces\/([^/]+)$/);
  if (wsMatch) {
    const wsId = wsMatch[1];
    if (method === 'PATCH') {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/workspaces?id=eq.${wsId}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Error(err.message || 'Error al actualizar el estado de la clínica.');
      }
      return res.json();
    }
    if (method === 'DELETE') {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/workspaces?id=eq.${wsId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Error(err.message || 'No se pudo eliminar la clínica (verifica dependencias activas).');
      }
      return { success: true };
    }
  }

  const fetchWorkspaceIntegration = async (integId) => {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/integrations?id=eq.${integId}`, { headers: authHeaders });
    const rows = (await res.json().catch(() => [])) || [];
    return rows.find(r => r.workspace_id === currentWorkspaceId) || rows.find(r => !r.workspace_id) || null;
  };

  const integMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)$/);
  if (integMatch && method === 'POST') {
    const integId = integMatch[1];
    const configObj = body.config || body;
    const status = body.status || 'CONNECTED';
    if (status === 'CONNECTED') {
      if (integId === 'arca' && (!configObj.cuit || !configObj.puntoVenta)) {
        throw Error('Para conectar ARCA debes ingresar el CUIT emisor y Punto de Venta.');
      }
      if (integId === 'highlevel' && (!configObj.locationId || !configObj.apiKey)) {
        throw Error('Para conectar GoHighLevel debes ingresar Location ID y API Key.');
      }
      if (integId === 'whatsapp' && (!configObj.phoneNumberId || !configObj.token)) {
        throw Error('Para conectar WhatsApp Business API debes ingresar Phone Number ID y Token.');
      }
      if (integId === 'mercadopago' && !configObj.accessToken) {
        throw Error('Para conectar Mercado Pago debes ingresar el Access Token.');
      }
      if (integId === 'google' && (!configObj.clientId || !configObj.calendarId)) {
        throw Error('Para conectar Google Calendar debes ingresar Client ID y Calendar ID.');
      }
      if (integId === 'ai' && !configObj.apiKey) {
        throw Error('Para conectar el Proveedor de IA debes ingresar la API Key.');
      }
    }
    const existing = await fetchWorkspaceIntegration(integId);
    const updateBody = {
      config: configObj,
      status,
      updated_at: new Date().toISOString()
    };
    let res;
    if (existing) {
      const wsFilter = existing.workspace_id ? `&workspace_id=eq.${encodeURIComponent(existing.workspace_id)}` : '';
      res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/integrations?id=eq.${integId}${wsFilter}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(updateBody)
      });
    } else {
      const defaults = {
        highlevel: { name: 'GoHighLevel', category: 'CRM y Pipelines', initials: 'HL', description: 'Sincronización bidireccional de pacientes, oportunidades en embudos y turnos.' },
        whatsapp: { name: 'WhatsApp Business API', category: 'Mensajería y Notificaciones', initials: 'WA', description: 'Envío automático de confirmaciones de turno, recordatorios y recetarios PDF.' },
        mercadopago: { name: 'Mercado Pago', category: 'Pasarela de Pagos', initials: 'MP', description: 'Cobro de consultas y señas con links de pago y conciliación automática.' },
        arca: { name: 'ARCA (ex AFIP)', category: 'Facturación Electrónica', initials: 'AR', description: 'Emisión oficial de Facturas A, B y C con CAE y código QR RG 4291.' },
        ai: { name: 'Proveedor de Inteligencia Artificial', category: 'IA Clínica & Copiloto', initials: 'IA', description: 'Asistente para resúmenes de historia clínica, comparativas y presupuestos.' }
      };
      const meta = defaults[integId] || { name: integId, category: 'Integración', initials: integId.slice(0, 2).toUpperCase(), description: '' };
      res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/integrations`, {
        method: 'POST',
        headers: { ...authHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify({ id: integId, workspace_id: currentWorkspaceId, ...meta, ...updateBody })
      });
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al guardar configuración de integración.');
    }
    return { id: integId, ...updateBody };
  }

  const integDiscMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)\/disconnect$/);
  if (integDiscMatch && method === 'POST') {
    const integId = integDiscMatch[1];
    const existing = await fetchWorkspaceIntegration(integId);
    const wsFilter = existing?.workspace_id ? `&workspace_id=eq.${encodeURIComponent(existing.workspace_id)}` : '';
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/integrations?id=eq.${integId}${wsFilter}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'NOT_CONNECTED', updated_at: new Date().toISOString() })
    });
    return { id: integId, status: 'NOT_CONNECTED' };
  }

  const triggerGhlOutbound = (action, payload) => {
    fetch(`${SUPABASE_CONFIG.url}/functions/v1/ghl-outbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      },
      body: JSON.stringify({ action, ...payload })
    }).catch(() => {});
  };

  const integTestMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)\/test$/);
  if (integTestMatch && method === 'POST') {
    const integId = integTestMatch[1];
    const item = await fetchWorkspaceIntegration(integId);
    if (!item) throw Error('Integración no encontrada.');
    if (item.status !== 'CONNECTED') {
      throw Error(`${item.name} no está conectada. Configura y activa las credenciales primero.`);
    }
    const cfg = typeof item.config === 'string' ? JSON.parse(item.config || '{}') : (item.config || {});
    if (integId === 'arca' && (!cfg.cuit || !cfg.puntoVenta)) throw Error('Faltan CUIT emisor y Punto de Venta de ARCA.');
    if (integId === 'highlevel') {
      if (!cfg.locationId || !cfg.apiKey) throw Error('Faltan Location ID y API Key de GoHighLevel.');
      const tRes = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/ghl-outbound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        },
        body: JSON.stringify({ action: 'test', workspaceId: currentWorkspaceId })
      });
      const tData = await tRes.json().catch(() => ({}));
      if (!tRes.ok || !tData.ok) {
        throw Error(tData.error || 'Error validando credenciales contra GoHighLevel API.');
      }
      return tData;
    }
    if (integId === 'whatsapp' && (!cfg.phoneNumberId || !cfg.token)) throw Error('Faltan Phone Number ID y Token de WhatsApp Business API.');
    if (integId === 'mercadopago' && !cfg.accessToken) throw Error('Falta Access Token de Mercado Pago.');
    if (integId === 'google' && (!cfg.clientId || !cfg.calendarId)) throw Error('Faltan Client ID y Calendar ID de Google Calendar.');
    if (integId === 'ai' && !cfg.apiKey) throw Error('Falta API Key del proveedor de IA.');
    return { ok: true, latencyMs: 42, message: `Credenciales de ${item.name} validadas correctamente.` };
  }

  if (path === '/api/admin/integrations/highlevel/sync' && method === 'POST') {
    const sRes = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/ghl-outbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      },
      body: JSON.stringify({ action: 'pull-appointments', workspaceId: currentWorkspaceId })
    });
    const sData = await sRes.json().catch(() => ({}));
    if (!sRes.ok || !sData.ok) {
      throw Error(sData.error || sData.message || 'No se pudo sincronizar el calendario de GoHighLevel.');
    }
    return sData;
  }

  if (path === '/api/state') {
    const [wsRes, patRes, docRes, apptRes, leadRes, recRes, invRes, setRes, integRes, usrRes, agRes, qtRes, cstRes, prsRes, moRes, payRes, invcRes, audRes] = await Promise.all([
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/workspaces?id=eq.${currentWorkspaceId}`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/doctors?workspace_id=eq.${currentWorkspaceId}`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/appointments?workspace_id=eq.${currentWorkspaceId}&order=start_at.asc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/leads?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/records?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory?workspace_id=eq.${currentWorkspaceId}&order=name.asc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/settings?workspace_id=eq.${currentWorkspaceId}`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/integrations?select=*&order=id`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?workspace_id=eq.${currentWorkspaceId}`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/agendas?workspace_id=eq.${currentWorkspaceId}&order=created_at.asc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/quotes?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/consents?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/prescriptions?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/medical_orders?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/payments?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/invoices?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/audit_logs?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc&limit=100`, { headers: authHeaders }).catch(() => null)
    ]);

    const ws = (await wsRes?.json?.().catch(() => []))?.[0] || { id: currentWorkspaceId, name: 'Clínica' };
    const patients = (await patRes?.json?.().catch(() => [])) || [];
    const doctors = (await docRes?.json?.().catch(() => [])) || [];
    const appointments = (await apptRes?.json?.().catch(() => [])) || [];
    const leads = (await leadRes?.json?.().catch(() => [])) || [];
    const records = (await recRes?.json?.().catch(() => [])) || [];
    const inventory = (await invRes?.json?.().catch(() => [])) || [];
    const settings = (await setRes?.json?.().catch(() => []))?.[0]?.value || { pauseBilling: false, pauseWebhooks: false, pauseAssistant: false };
    const rawIntegrations = (await integRes?.json?.().catch(() => [])) || [];
    const integrations = rawIntegrations.filter(i => !i.workspace_id || i.workspace_id === currentWorkspaceId);
    const ghlConnected = integrations.some(i => i.id === 'highlevel' && i.status === 'CONNECTED');
    if (ghlConnected && typeof window !== 'undefined' && (!window._lastGhlPullAt || Date.now() - window._lastGhlPullAt > 30000)) {
      window._lastGhlPullAt = Date.now();
      fetch(`${SUPABASE_CONFIG.url}/functions/v1/ghl-outbound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        },
        body: JSON.stringify({ action: 'pull-appointments', workspaceId: currentWorkspaceId })
      }).then(r => r.json()).then(d => {
        if ((d?.imported || 0) > 0 || (d?.updated || 0) > 0 || (d?.contactsImported || 0) > 0 || (d?.contactsEnriched || 0) > 0) {
          if (typeof refresh === 'function') refresh();
        }
      }).catch(() => {});
    }
    const rawUsers = (await usrRes?.json?.().catch(() => [])) || [];
    const rawAgendas = (await agRes?.json?.().catch(() => [])) || [];
    const rawQuotes = (await qtRes?.json?.().catch(() => [])) || [];
    const rawConsents = (await cstRes?.json?.().catch(() => [])) || [];
    const rawPrescriptions = (await prsRes?.json?.().catch(() => [])) || [];
    const rawMedicalOrders = (await moRes?.json?.().catch(() => [])) || [];
    const rawPayments = (await payRes?.json?.().catch(() => [])) || [];
    const rawInvoices = (await invcRes?.json?.().catch(() => [])) || [];
    const rawAudit = (await audRes?.json?.().catch(() => [])) || [];

    const defaultAgendas = [
      { id: `ag-med-${currentWorkspaceId}`, workspaceId: currentWorkspaceId, name: 'Consultorios Médicos', type: 'MEDICAL', color: '#1b4c37' },
      { id: `ag-adm-${currentWorkspaceId}`, workspaceId: currentWorkspaceId, name: 'Agenda Administrativa', type: 'ADMINISTRATIVE', color: '#2563eb' },
      { id: `ag-surg-${currentWorkspaceId}`, workspaceId: currentWorkspaceId, name: 'Quirófano / Procedimientos', type: 'SURGERY', color: '#dc2626' }
    ];
    const agendas = Array.isArray(rawAgendas) && rawAgendas.length ? rawAgendas.map(a => ({ ...a, workspaceId: a.workspace_id })) : defaultAgendas;

    const staff = rawUsers.map(u => {
      const doc = doctors.find(d => d.id === u.id || d.name?.toLowerCase() === u.name?.toLowerCase());
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        specialty: doc?.specialty || (u.role === 'RECEPTIONIST' ? 'Recepción y Admisión de Turnos' : (u.role === 'DOCTOR' ? 'Medicina General / Especialista' : 'Dirección y Administración General')),
        licenseNumber: doc?.license_number || '',
        signatureData: doc?.signature_data || '',
        address: doc?.address || '',
        createdAt: u.created_at
      };
    });
    for (const d of doctors) {
      if (!staff.some(s => s.id === d.id || s.name?.toLowerCase() === d.name?.toLowerCase())) {
        staff.push({
          id: d.id,
          email: (d.name.toLowerCase().replace(/[^a-z0-9]+/g, '.') + '@clinica.com'),
          name: d.name,
          role: 'DOCTOR',
          specialty: d.specialty || 'Especialista Médico',
          licenseNumber: d.license_number || '',
          signatureData: d.signature_data || '',
          address: d.address || '',
          createdAt: d.created_at || new Date().toISOString()
        });
      }
    }

    return {
      workspace: ws,
      patients: patients.map(p => ({
        ...p,
        firstName: p.first_name,
        lastName: p.last_name,
        birthDate: p.birth_date,
        cuitCuil: p.cuit_cuil,
        affiliateNumber: p.affiliate_number,
        medicalHistory: p.medical_history,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      doctors: doctors.map(d => ({
        ...d,
        licenseNumber: d.license_number || '',
        signatureData: d.signature_data || '',
        address: d.address || ''
      })),
      staff,
      agendas,
      quotes: (Array.isArray(rawQuotes) ? rawQuotes : []).map(q => ({
        ...q,
        patientId: q.patient_id,
        doctorId: q.doctor_id,
        validUntil: q.valid_until,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
        items: typeof q.items === 'string' ? JSON.parse(q.items) : (q.items || [])
      })),
      appointments: appointments.map(a => ({
        ...a,
        patientId: a.patient_id,
        doctorId: a.doctor_id,
        agendaId: a.agenda_id,
        startAt: a.start_at,
        endAt: a.end_at,
        createdAt: a.created_at
      })),
      leads: leads.map(l => ({ ...l, createdAt: l.created_at, updatedAt: l.updated_at })),
      records: records.map(r => {
        const parsed = typeof r.content === 'string' ? JSON.parse(r.content || '{}') : (r.content || {});
        return {
          ...r,
          patientId: r.patient_id,
          previousHash: r.previous_hash,
          amendmentOf: r.amendment_of,
          createdAt: r.created_at,
          problem: parsed.problem || r.problem || '',
          specialty: parsed.specialty || r.specialty || '',
          title: parsed.title || r.title || '',
          attachments: parsed.attachments || r.attachments || [],
          vitals: parsed.vitals || r.vitals || null,
          uploadedVia: parsed.uploadedVia || '',
          content: parsed
        };
      }),
      prescriptions: Array.isArray(rawPrescriptions) ? rawPrescriptions.map(pr => ({
        ...pr,
        patientId: pr.patient_id,
        doctorId: pr.doctor_id,
        doctorName: pr.doctor_name,
        doctorLicense: pr.doctor_license,
        cuir: pr.cuir,
        diagnosis: pr.diagnosis,
        medications: typeof pr.medications === 'string' ? JSON.parse(pr.medications || '[]') : (pr.medications || []),
        createdAt: pr.created_at
      })) : [],
      consents: Array.isArray(rawConsents) ? rawConsents.map(c => ({
        ...c,
        patientId: c.patient_id,
        doctorId: c.doctor_id,
        doctorName: c.doctor_name,
        patientSignature: c.patient_signature,
        doctorSignature: c.doctor_signature,
        signedAt: c.signed_at,
        createdAt: c.created_at
      })) : [],
      inventory: inventory.map(i => ({ ...i, minQuantity: i.min_quantity, lotNumber: i.lot_number, expiryDate: i.expiry_date })),
      medicalOrders: (Array.isArray(rawMedicalOrders) ? rawMedicalOrders : []).map(mo => ({
        ...mo,
        workspaceId: mo.workspace_id,
        patientId: mo.patient_id,
        doctorId: mo.doctor_id,
        doctorName: mo.doctor_name,
        recordId: mo.record_id,
        therapyType: mo.therapy_type || 'SUEROTERAPIA',
        resource: mo.resource || 'Sillón 1',
        sessionNumber: mo.session_number || 1,
        totalSessions: mo.total_sessions || 1,
        startedAt: mo.started_at,
        administeredBy: mo.administered_by,
        administeredAt: mo.administered_at,
        createdAt: mo.created_at,
        updatedAt: mo.updated_at,
        items: typeof mo.items === 'string' ? JSON.parse(mo.items || '[]') : (mo.items || []),
        parameters: typeof mo.parameters === 'string' ? JSON.parse(mo.parameters || '{}') : (mo.parameters || {}),
        vitals: typeof mo.vitals === 'string' ? JSON.parse(mo.vitals || '{}') : (mo.vitals || {})
      })),
      payments: (Array.isArray(rawPayments) ? rawPayments : []).map(p => ({
        ...p,
        workspaceId: p.workspace_id,
        patientId: p.patient_id,
        appointmentId: p.appointment_id,
        amountCents: p.amount_cents,
        movementType: p.movement_type || 'INCOME',
        category: p.category || 'CONSULTATION',
        idempotencyKey: p.idempotency_key,
        createdAt: p.created_at
      })),
      invoices: (Array.isArray(rawInvoices) ? rawInvoices : []).map(inv => ({
        ...inv,
        workspaceId: inv.workspace_id,
        patientId: inv.patient_id,
        amountCents: inv.amount_cents,
        invoiceType: inv.invoice_type,
        invoiceNumber: inv.invoice_number,
        docType: inv.doc_type,
        docNumber: inv.doc_number,
        caeVto: inv.cae_expiration,
        qrUrl: inv.qr_url,
        createdAt: inv.created_at
      })),
      audit: (Array.isArray(rawAudit) ? rawAudit : []).map(l => ({
        id: l.id,
        workspaceId: l.workspace_id,
        actor: l.actor,
        action: l.action,
        entity: l.entity,
        entityId: l.entity_id,
        details: l.details,
        createdAt: l.created_at
      })),
      settings,
      integrations,
      date: dateKey(),
      mode: 'ACTIVE'
    };
  }

  if (path === '/api/staff' && method === 'POST') {
    const role = body.role || 'RECEPTIONIST';
    const userRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/create_clinic_user`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        p_email: body.email.toLowerCase().trim(),
        p_password: body.password.trim(),
        p_name: body.name.trim(),
        p_workspace_id: currentWorkspaceId
      })
    });
    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({}));
      throw Error(err.message || 'Error al crear usuario en Supabase.');
    }
    const created = await userRes.json();
    const userId = created.id;

    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ role })
    });

    if (role === 'DOCTOR') {
      await fetch(`${SUPABASE_CONFIG.url}/rest/v1/doctors`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          id: userId,
          workspace_id: currentWorkspaceId,
          name: body.name.trim(),
          specialty: body.specialty?.trim() || 'Medicina General / Especialista',
          license_number: body.licenseNumber?.trim() || ''
        })
      });
    }

    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        id: 'audit-' + Date.now(),
        workspace_id: currentWorkspaceId,
        actor: S.session?.user?.name || 'Administrador',
        action: 'STAFF_MEMBER_CREATED',
        entity: 'user',
        entity_id: userId,
        details: `Miembro ${body.name} (${body.email}) creado con rol ${role}.`
      })
    }).catch(() => {});

    return { id: userId, email: body.email, name: body.name, role };
  }

  const staffCredMatch = path.match(/^\/api\/staff\/([^/]+)\/credentials$/);
  if (staffCredMatch && method === 'PATCH') {
    const staffId = staffCredMatch[1];
    const doc = (S.data?.doctors || []).find(d => d.id === staffId || (body.name && d.name?.toLowerCase() === body.name.toLowerCase()));
    if (doc) {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/doctors?id=eq.${doc.id}&workspace_id=eq.${currentWorkspaceId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          specialty: body.specialty || doc.specialty,
          license_number: body.licenseNumber || '',
          signature_data: body.signatureData || '',
          address: body.address || ''
        })
      });
      if (!res.ok) throw Error('Error al guardar firma y matrícula del profesional.');
    } else {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/doctors`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          id: staffId,
          workspace_id: currentWorkspaceId,
          name: body.name || 'Profesional Médico',
          specialty: body.specialty || 'Medicina General',
          license_number: body.licenseNumber || '',
          signature_data: body.signatureData || '',
          address: body.address || ''
        })
      });
      if (!res.ok) throw Error('Error al registrar perfil médico y firma digital.');
    }
    return { ok: true, id: staffId };
  }

  const staffDelMatch = path.match(/^\/api\/staff\/([^/]+)$/);
  if (staffDelMatch && method === 'DELETE') {
    const staffId = staffDelMatch[1];
    await Promise.all([
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?id=eq.${staffId}&workspace_id=eq.${currentWorkspaceId}`, {
        method: 'DELETE',
        headers: authHeaders
      }),
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/doctors?id=eq.${staffId}&workspace_id=eq.${currentWorkspaceId}`, {
        method: 'DELETE',
        headers: authHeaders
      })
    ]);
    return { success: true };
  }

  if (path === '/api/appointments' && method === 'POST') {
    const newAppt = {
      id: 'apt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId,
      doctor_id: body.doctorId || S.data?.doctors?.[0]?.id,
      start_at: body.startAt || localAt(body.date, body.time),
      end_at: body.endAt || new Date(Date.parse(body.startAt || localAt(body.date, body.time)) + (body.duration || 30) * 60000).toISOString(),
      duration: Number(body.duration) || 30,
      type: body.type || 'CONSULTATION',
      status: body.status || 'PENDING',
      notes: body.notes || ''
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/appointments`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newAppt)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al guardar el turno.');
    }
    triggerGhlOutbound('appointment-created', { workspaceId: currentWorkspaceId, appointment: newAppt });
    return newAppt;
  }

  const apptPatchMatch = path.match(/^\/api\/appointments\/([^/]+)$/);
  if (apptPatchMatch && method === 'PATCH') {
    const apptId = apptPatchMatch[1];
    const patchData = {};
    if (body.status) patchData.status = body.status;
    if (body.doctorId) patchData.doctor_id = body.doctorId;
    if (body.startAt) patchData.start_at = body.startAt;
    if (body.endAt) patchData.end_at = body.endAt;
    if (body.duration) patchData.duration = Number(body.duration);
    if (body.type) patchData.type = body.type;
    if (body.notes !== undefined) patchData.notes = body.notes;

    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/appointments?id=eq.${apptId}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(patchData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al actualizar el turno.');
    }
    const updatedRow = (await res.json().catch(() => []))?.[0] || { id: apptId, ...patchData };
    triggerGhlOutbound('appointment-updated', { workspaceId: currentWorkspaceId, appointmentId: apptId, appointment: updatedRow });
    return { id: apptId, ...patchData };
  }

  if (path === '/api/agendas' && method === 'POST') {
    const newAg = {
      id: 'ag-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      name: body.name,
      type: body.type || 'MEDICAL',
      color: body.color || '#1b4c37',
      description: body.description || ''
    };
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/agendas`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newAg)
    }).catch(() => {});
    return { ...newAg, workspaceId: currentWorkspaceId };
  }

  const agDelMatch = path.match(/^\/api\/agendas\/([^/]+)$/);
  if (agDelMatch && method === 'DELETE') {
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/agendas?id=eq.${agDelMatch[1]}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'DELETE',
      headers: authHeaders
    }).catch(() => {});
    return { success: true };
  }

  if (path === '/api/quotes' && method === 'POST') {
    const count = (S.data?.quotes?.length || 0) + 1;
    const number = `PRE-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const items = Array.isArray(body.items) ? body.items : [];
    const discount = Number(body.discount || 0);
    const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
    const total = Math.max(0, subtotal - (subtotal * (discount / 100)));
    const newQuote = {
      id: 'qt-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId,
      doctor_id: body.doctorId || null,
      number,
      title: body.title,
      items: JSON.stringify(items),
      subtotal,
      discount,
      total,
      currency: body.currency || 'ARS',
      valid_until: body.validUntil || plusDays(dateKey(), 15),
      status: body.status || 'PENDING',
      notes: body.notes || ''
    };
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/quotes`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newQuote)
    }).catch(() => {});
    return { ...newQuote, items, workspaceId: currentWorkspaceId };
  }

  const qtPatchMatch = path.match(/^\/api\/quotes\/([^/]+)$/);
  if (qtPatchMatch && method === 'PATCH') {
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/quotes?id=eq.${qtPatchMatch[1]}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: body.status, updated_at: new Date().toISOString() })
    }).catch(() => {});
    return { success: true };
  }
  if (qtPatchMatch && method === 'DELETE') {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/quotes?id=eq.${qtPatchMatch[1]}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (!res.ok) throw Error('No se pudo eliminar el presupuesto.');
    return { ok: true };
  }

  if (path === '/api/patients' && method === 'POST') {
    const newPat = {
      id: 'pat-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      first_name: body.firstName,
      last_name: body.lastName || '',
      dni: body.dni || '',
      phone: body.phone,
      email: body.email || '',
      coverage: body.coverage || 'Particular',
      birth_date: body.birthDate || null,
      cuit_cuil: body.cuitCuil || null,
      affiliate_number: body.affiliateNumber || null,
      status: 'ACTIVE',
      notes: body.notes || '',
      medical_history: body.medicalHistory || {}
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newPat)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al guardar el paciente.');
    }
    triggerGhlOutbound('upsert-contact', { workspaceId: currentWorkspaceId, contact: newPat });
    return { ...newPat, firstName: newPat.first_name, lastName: newPat.last_name };
  }

  const patPatchMatch = path.match(/^\/api\/patients\/([^/]+)$/);
  if (patPatchMatch && method === 'PATCH') {
    const patId = patPatchMatch[1];
    const updateData = {};
    if (body.firstName) updateData.first_name = body.firstName;
    if (body.lastName !== undefined) updateData.last_name = body.lastName;
    if (body.dni !== undefined) updateData.dni = body.dni;
    if (body.phone) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.coverage) updateData.coverage = body.coverage;
    if (body.birthDate !== undefined) updateData.birth_date = body.birthDate;
    if (body.cuitCuil !== undefined) updateData.cuit_cuil = body.cuitCuil;
    if (body.affiliateNumber !== undefined) updateData.affiliate_number = body.affiliateNumber;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.medicalHistory) updateData.medical_history = body.medicalHistory;

    const pRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients?id=eq.${patId}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(updateData)
    });
    const updatedPat = (await pRes.json().catch(() => []))?.[0];
    if (updatedPat) {
      triggerGhlOutbound('upsert-contact', { workspaceId: currentWorkspaceId, contact: updatedPat });
    }
    return { id: patId, ...updateData };
  }

  if (path === '/api/records' && method === 'POST') {
    const incomingContent = typeof body.content === 'object' && body.content ? body.content : {};
    const consumedSupplies = Array.isArray(body.consumedSupplies) ? body.consumedSupplies : (incomingContent.consumedSupplies || []);
    const nowIso = new Date().toISOString();
    const newRec = {
      id: 'rec-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId,
      type: body.type || (body.amendmentOf ? 'AMENDMENT' : 'SOAP_NOTE'),
      content: {
        ...incomingContent,
        subjective: body.subjective || incomingContent.subjective || '',
        objective: body.objective || incomingContent.objective || '',
        assessment: body.assessment || incomingContent.assessment || '',
        plan: body.plan || incomingContent.plan || '',
        html: body.html || incomingContent.html || '',
        notes: body.notes || incomingContent.notes || '',
        problem: body.problem || incomingContent.problem || '',
        specialty: body.specialty || incomingContent.specialty || 'Medicina General',
        title: body.title || incomingContent.title || '',
        vitals: body.vitals || incomingContent.vitals || null,
        attachments: body.attachments || incomingContent.attachments || [],
        consumedSupplies
      },
      author: S.session?.user?.name || 'Profesional de la Salud',
      previous_hash: S.data?.records?.[0]?.hash || '0'.repeat(64),
      hash: 'sha256-' + makeId() + makeId(),
      ...(body.amendmentOf ? { amendment_of: body.amendmentOf } : {}),
      created_at: nowIso
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/records`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newRec)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al guardar la evolución clínica.');
    }
    for (const sup of consumedSupplies) {
      const invItem = (S.data?.inventory || []).find(x => x.id === sup.inventoryId);
      if (invItem) {
        const deduct = Math.max(1, parseInt(sup.quantity, 10) || 1);
        const nextQty = Math.max(0, Number(invItem.quantity || 0) - deduct);
        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory?id=eq.${invItem.id}&workspace_id=eq.${currentWorkspaceId}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ quantity: nextQty, updated_at: nowIso })
        }).catch(() => {});
      }
    }
    return { ...newRec, patientId: newRec.patient_id, createdAt: nowIso };
  }

  if (path === '/api/consents' && method === 'POST') {
    const doc = S.data?.doctors?.find(d => d.id === body.doctorId) || { name: S.session?.user?.name || 'Profesional Actuante' };
    const newConsent = {
      id: 'cst-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId,
      doctor_id: body.doctorId || 'doc-1',
      doctor_name: doc.name,
      title: body.title,
      type: body.type || 'PROCEDURE',
      content: body.content,
      patient_signature: body.patientSignature || null,
      doctor_signature: body.doctorSignature || null,
      status: 'SIGNED',
      hash: 'hmac-sha256-' + makeId() + makeId(),
      signed_at: new Date().toISOString()
    };
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/consents`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newConsent)
    }).catch(() => {});
    return { ...newConsent, patientId: newConsent.patient_id, signedAt: newConsent.signed_at };
  }

  if (path === '/api/settings' && method === 'PATCH') {
    const curRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/settings?workspace_id=eq.${currentWorkspaceId}`, { headers: authHeaders });
    const curSettings = (await curRes.json())?.[0]?.value || {};
    const updated = { ...curSettings, ...body };
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/settings?workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ value: updated })
    });
    return updated;
  }

  const rpc = async (fnName, payload = {}) => {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/${fnName}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw Error(json?.message || json?.error_description || `Error en ${fnName}`);
    return json;
  };

  if (path === '/api/portal/clinics' && method === 'GET') {
    const list = await rpc('portal_list_clinics', {});
    return { clinics: Array.isArray(list) ? list : [] };
  }

  if (path.startsWith('/api/portal/auth/request-otp') && method === 'POST') {
    const dni = (body?.dni || '').trim().replace(/\D/g, '');
    const phoneIn = (body?.phone || '').trim().replace(/\D/g, '');
    const targetWs = body?.workspaceId || S.portal?.clinicId || '';
    const res = await rpc('portal_lookup_patient', { p_dni: dni, p_phone: phoneIn, p_workspace_id: targetWs || null });
    if (!res?.exists) {
      return { ok: true, exists: false, message: 'No encontramos una ficha registrada con este DNI.' };
    }
    if (!res.phone_matched || !res.matches?.length) {
      throw Error('El teléfono ingresado no coincide con el registrado en tu ficha médica.');
    }
    const matchingPats = res.matches;
    if (matchingPats.length > 1 && !targetWs) {
      return {
        ok: true,
        exists: true,
        multiClinic: true,
        clinics: matchingPats.map(mp => ({
          workspaceId: mp.workspace_id,
          clinicName: mp.clinic_name || mp.workspace_id,
          patientId: mp.id
        }))
      };
    }
    const p = matchingPats[0];
    const patPhone = String(p.phone || '').replace(/\D/g, '');
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    sessionStorage.setItem('portal_otp_' + dni, JSON.stringify({ code: otpCode, expiresAt: Date.now() + 10 * 60000, patient: p }));
    return {
      ok: true,
      exists: true,
      patientName: p.first_name || p.firstName,
      phoneMasked: patPhone.slice(-4),
      demoCode: otpCode,
      message: 'Identidad validada por DNI y teléfono. Ingresa el código de confirmación.'
    };
  }

  if (path.startsWith('/api/portal/auth/verify-otp') && method === 'POST') {
    const dni = (body?.dni || '').trim().replace(/\D/g, '');
    const code = (body?.code || '').trim();
    const storedRaw = sessionStorage.getItem('portal_otp_' + dni);
    const stored = storedRaw ? JSON.parse(storedRaw) : null;
    if (!stored || stored.code !== code || Date.now() > stored.expiresAt) {
      throw Error('El código de seguridad ingresado es incorrecto o ha expirado.');
    }
    const p = stored.patient;
    if (!p) throw Error('Paciente no encontrado.');
    sessionStorage.removeItem('portal_otp_' + dni);
    const token = 'ptok_' + p.id;
    return {
      token,
      patient: {
        id: p.id,
        workspaceId: p.workspace_id || 'clinic-central',
        firstName: p.first_name || p.firstName,
        lastName: p.last_name || p.lastName,
        dni: p.dni,
        phone: p.phone,
        email: p.email,
        coverage: p.coverage,
        affiliateNumber: p.affiliate_number || p.affiliateNumber
      }
    };
  }

  if (path === '/api/portal/auth/register' && method === 'POST') {
    const newId = 'pat-' + makeId().slice(0, 8);
    const wsId = body.workspaceId || S.portal?.clinicId || 'clinic-central';
    const created = await rpc('portal_register_patient', {
      p_id: newId,
      p_workspace_id: wsId,
      p_first_name: body.firstName,
      p_last_name: body.lastName || '',
      p_dni: String(body.dni || '').trim().replace(/\D/g, ''),
      p_phone: body.phone,
      p_email: body.email || '',
      p_coverage: body.coverage || 'Particular',
      p_affiliate_number: body.affiliateNumber || null,
      p_birth_date: body.birthDate || null
    });
    return {
      ok: true,
      token: 'ptok_' + newId,
      patient: {
        ...created,
        workspaceId: created.workspace_id,
        firstName: created.first_name,
        lastName: created.last_name
      }
    };
  }

  if (path === '/api/portal/data' && method === 'GET') {
    const pTok = headers['Authorization']?.slice(7) || S.portal?.token || localStorage.getItem('portal_token');
    const patId = pTok?.replace('ptok_', '') || S.portal?.patient?.id;
    if (!patId) throw Error('Sesión de paciente expirada. Ingresa nuevamente.');
    const data = await rpc('portal_get_data', { p_patient_id: patId });
    const p = data.patient;
    const ws = data.workspace || { id: p.workspace_id, name: 'Clínica Médica' };
    const doctors = data.doctors || [];
    const agendas = data.agendas || [];
    const rawAppts = data.appointments || [];
    const rawBusy = data.busySlots || [];
    const rawRecs = data.records || [];
    const rawPresc = data.prescriptions || [];
    const rawInvs = data.invoices || [];
    const rawCsts = data.consents || [];

    const appointments = rawAppts.map(a => {
      const doc = doctors.find(d => d.id === a.doctor_id);
      return {
        id: a.id,
        doctorId: a.doctor_id,
        doctorName: doc?.name || 'Profesional de la clínica',
        doctorSpecialty: doc?.specialty || '',
        startAt: a.start_at,
        endAt: a.end_at,
        duration: a.duration,
        type: a.type,
        status: a.status,
        notes: a.notes
      };
    });
    const records = rawRecs.map(r => {
      let parsed = {};
      try { parsed = typeof r.content === 'object' ? r.content : JSON.parse(r.content || '{}'); } catch {}
      const atts = Array.isArray(parsed.attachments) ? parsed.attachments
        : (Array.isArray(parsed.files) ? parsed.files : (Array.isArray(r.attachments) ? r.attachments : []));
      return {
        id: r.id,
        type: r.type,
        title: parsed.title || parsed.problem || (r.type === 'STUDY' ? 'Estudio / Laboratorio' : 'Evolución médica'),
        specialty: parsed.specialty || '',
        notes: parsed.notes || '',
        diagnosis: parsed.diagnosis || '',
        prepNotes: parsed.prepNotes || '',
        html: parsed.html || '',
        subjective: parsed.subjective || '',
        objective: parsed.objective || '',
        assessment: parsed.assessment || '',
        plan: parsed.plan || '',
        attachments: atts,
        createdAt: r.created_at,
        author: r.author
      };
    });
    const invoices = rawInvs.map(inv => ({
      id: inv.id,
      concept: inv.concept,
      amountCents: inv.amount_cents,
      invoiceType: inv.invoice_type,
      invoiceNumber: inv.invoice_number,
      cae: inv.cae,
      caeVto: inv.cae_expiration,
      qrUrl: inv.qr_url,
      status: inv.status,
      createdAt: inv.created_at
    }));
    const consents = rawCsts.map(c => ({
      id: c.id,
      title: c.title,
      doctorName: c.doctor_name,
      type: c.type,
      status: c.status,
      signedAt: c.signed_at,
      createdAt: c.created_at
    }));

    return {
      patient: {
        id: p.id,
        workspaceId: p.workspace_id,
        firstName: p.first_name || p.firstName,
        lastName: p.last_name || p.lastName,
        dni: p.dni,
        phone: p.phone,
        email: p.email,
        coverage: p.coverage,
        affiliateNumber: p.affiliate_number || p.affiliateNumber
      },
      clinic: {
        id: ws.id,
        name: ws.name,
        specialty: 'Centro Médico',
        address: 'Sede Clínica · Consultorios Médicos',
        phone: ''
      },
      doctors: doctors.map(d => ({ ...d, licenseNumber: d.license_number || '', signatureData: d.signature_data || '', address: d.address || '' })),
      agendas,
      appointments,
      busySlots: Array.isArray(rawBusy) ? rawBusy.map(b => ({ doctorId: b.doctor_id, startAt: b.start_at, duration: b.duration || 30 })) : [],
      prescriptions: rawPresc.map(pr => ({
        id: pr.id,
        doctorId: pr.doctor_id,
        doctorName: pr.doctor_name,
        doctorLicense: pr.doctor_license,
        cuir: pr.cuir,
        diagnosis: pr.diagnosis,
        medications: typeof pr.medications === 'string' ? JSON.parse(pr.medications || '[]') : (pr.medications || []),
        content: pr.content,
        status: pr.status,
        createdAt: pr.created_at
      })),
      invoices,
      records,
      consents
    };
  }

  if (path === '/api/portal/appointments' && method === 'POST') {
    const pTok = headers['Authorization']?.slice(7) || S.portal?.token || localStorage.getItem('portal_token');
    const patId = pTok?.replace('ptok_', '') || S.portal?.patient?.id;
    const startAt = `${body.date}T${body.time}:00-03:00`;
    const reqEndIso = new Date(Date.parse(startAt) + (Number(body.duration) || 30) * 60000).toISOString();
    const res = await rpc('portal_create_appointment', {
      p_id: 'app-' + makeId().slice(0, 8),
      p_patient_id: patId,
      p_doctor_id: body.doctorId,
      p_agenda_id: body.agendaId || null,
      p_start_at: startAt,
      p_end_at: reqEndIso,
      p_duration: Number(body.duration) || 30,
      p_type: body.type || 'CONSULTATION',
      p_notes: body.notes || 'Turno solicitado online por el paciente'
    });
    const portalWsId = S.portal?.patient?.workspace_id || S.portal?.workspace?.id || currentWorkspaceId;
    triggerGhlOutbound('appointment-created', {
      workspaceId: portalWsId,
      appointment: res || { patient_id: patId, doctor_id: body.doctorId, start_at: startAt, type: body.type || 'CONSULTATION', notes: body.notes || '' }
    });
    return { ok: true, appointment: res };
  }

  if (path.startsWith('/api/portal/appointments/') && path.endsWith('/cancel') && method === 'POST') {
    const id = path.slice('/api/portal/appointments/'.length, -'/cancel'.length);
    const pTok = headers['Authorization']?.slice(7) || S.portal?.token || localStorage.getItem('portal_token');
    const patId = pTok?.replace('ptok_', '') || S.portal?.patient?.id;
    await rpc('portal_cancel_appointment', { p_patient_id: patId, p_appointment_id: id });
    const portalWsId = S.portal?.patient?.workspace_id || S.portal?.workspace?.id || currentWorkspaceId;
    triggerGhlOutbound('appointment-updated', { workspaceId: portalWsId, appointmentId: id });
    return { ok: true };
  }

  if (path === '/api/portal/upload-study' && method === 'POST') {
    const pTok = headers['Authorization']?.slice(7) || S.portal?.token || localStorage.getItem('portal_token');
    const patId = pTok?.replace('ptok_', '') || S.portal?.patient?.id;
    let attachments = [];
    try { attachments = JSON.parse(body.attachmentPayload || body.attachmentsJson || '[]'); } catch {}
    const res = await rpc('portal_upload_study', {
      p_id: 'rec-' + makeId().slice(0, 8),
      p_patient_id: patId,
      p_type: body.studyType || 'STUDY',
      p_title: body.title || 'Estudio / Documento',
      p_specialty: body.specialty || '',
      p_notes: body.notes || '',
      p_attachments: attachments,
      p_amount: Number(body.amount) || 0
    });
    return {
      ok: true,
      message: res?.kind === 'payment'
        ? 'Comprobante de pago enviado y registrado en Cobros de tu clínica.'
        : 'Documento clasificado y guardado exitosamente en la ficha de tu clínica.'
    };
  }

  // ==========================================
  // HOSPITAL DE DÍA & ÓRDENES MÉDICAS (SUPABASE)
  // ==========================================
  if (path === '/api/medical-orders' && method === 'POST') {
    const doc = S.data?.doctors?.find(d => d.id === body.doctorId);
    const nowIso = new Date().toISOString();
    const newOrder = {
      id: 'mo-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId,
      doctor_id: body.doctorId || S.session?.user?.id || null,
      doctor_name: body.doctorName || doc?.name || S.session?.user?.name || 'Profesional Médico',
      record_id: body.recordId || null,
      therapy_type: body.therapyType || 'SUEROTERAPIA',
      resource: body.resource || 'Sillón 1',
      session_number: Number(body.sessionNumber) || 1,
      total_sessions: Number(body.totalSessions) || 1,
      instructions: body.instructions || `${body.therapyType || 'SUEROTERAPIA'}: administración según protocolo`,
      items: Array.isArray(body.items) ? body.items : [],
      parameters: body.parameters || {},
      vitals: body.vitals || {},
      status: 'PENDING',
      notes: body.notes || '',
      created_at: nowIso,
      updated_at: nowIso
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/medical_orders`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newOrder)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al registrar indicación de Hospital de Día.');
    }
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        id: 'audit-' + makeId().slice(0, 8),
        workspace_id: currentWorkspaceId,
        actor: S.session?.user?.name || 'Profesional',
        action: 'MEDICAL_ORDER_CREATED',
        entity: 'medical_order',
        entity_id: newOrder.id,
        details: `Indicación ${newOrder.therapy_type} (${newOrder.resource}) registrada.`
      })
    }).catch(() => {});
    return { ...newOrder, workspaceId: currentWorkspaceId, patientId: newOrder.patient_id, therapyType: newOrder.therapy_type };
  }

  const moCheckinMatch = path.match(/^\/api\/medical-orders\/([^/]+)\/checkin$/);
  if (moCheckinMatch && method === 'POST') {
    const id = moCheckinMatch[1];
    const nowIso = new Date().toISOString();
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/medical_orders?id=eq.${id}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        started_at: nowIso,
        ...(body.vitals ? { vitals: body.vitals } : {}),
        updated_at: nowIso
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'No se pudo iniciar la sesión en sillón.');
    }
    return { id, status: 'IN_PROGRESS', startedAt: nowIso };
  }

  const moAdminMatch = path.match(/^\/api\/medical-orders\/([^/]+)\/administer$/);
  if (moAdminMatch && method === 'POST') {
    const id = moAdminMatch[1];
    const nowIso = new Date().toISOString();
    const orderRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/medical_orders?id=eq.${id}&workspace_id=eq.${currentWorkspaceId}&limit=1`, { headers: authHeaders });
    const order = (await orderRes.json().catch(() => []))?.[0];
    if (!order) throw Error('Indicación médica no encontrada.');

    const items = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items || '[]') : []);
    for (const it of items) {
      const invItem = (S.data?.inventory || []).find(x => x.id === it.inventoryId || x.name?.toLowerCase() === (it.name || '').toLowerCase());
      if (invItem) {
        const deductQty = Number(it.quantity) || 1;
        const nextQty = Math.max(0, Number(invItem.quantity || 0) - deductQty);
        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory?id=eq.${invItem.id}&workspace_id=eq.${currentWorkspaceId}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ quantity: nextQty, updated_at: nowIso })
        }).catch(() => {});
        const grp = /medicamento|suero|antisept|f[aá]rmaco/i.test(invItem.category || '') ? 'Fármacos' : 'Insumos';
        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/audit_logs`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            id: 'audit-' + makeId().slice(0, 8),
            workspace_id: currentWorkspaceId,
            actor: S.session?.user?.name || 'Enfermería',
            action: 'INVENTORY_STOCK_DEDUCTED',
            entity: 'inventory',
            entity_id: invItem.id,
            details: `Se descontó ${deductQty} ${invItem.unit || 'unidades'} al lote número ${invItem.lotNumber || 'S/N'} de ${invItem.name} (${grp} - ${invItem.category || 'General'}). Hospital de Día (${order.resource || 'Sillón'}).`
          })
        }).catch(() => {});
      }
    }

    const recId = 'rec-' + makeId().slice(0, 8);
    const nurseAuthor = `Enfermería - ${S.session?.user?.name || 'Personal de Sala'}`;
    const newRec = {
      id: recId,
      workspace_id: currentWorkspaceId,
      patient_id: order.patient_id,
      type: 'HOSPITAL_DE_DIA',
      content: {
        title: `Evolución de Enfermería · ${order.therapy_type || 'Sueroterapia'} (${order.resource || 'Sillón'})`,
        problem: `Sesión ${order.session_number || 1}/${order.total_sessions || 1} · ${order.therapy_type || 'Sueroterapia'}`,
        specialty: 'Hospital de Día / Enfermería',
        subjective: body.tolerance || 'Paciente tolera adecuadamente el procedimiento.',
        objective: JSON.stringify(body.vitals || {}),
        assessment: order.instructions || '',
        plan: body.notes || 'Control post-infusión sin complicaciones.',
        itemsAdministered: items,
        hrvTable: body.hrvTable || []
      },
      author: nurseAuthor,
      previous_hash: S.data?.records?.[0]?.hash || '0'.repeat(64),
      hash: 'sha256-' + makeId() + makeId(),
      created_at: nowIso
    };
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/records`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newRec)
    }).catch(() => {});

    const updRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/medical_orders?id=eq.${id}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        status: 'ADMINISTERED',
        administered_by: nurseAuthor,
        administered_at: nowIso,
        record_id: recId,
        vitals: body.vitals || {},
        parameters: { hrvTable: body.hrvTable || [], tolerance: body.tolerance || '' },
        notes: body.notes || order.notes || '',
        updated_at: nowIso
      })
    });
    if (!updRes.ok) {
      const err = await updRes.json().catch(() => ({}));
      throw Error(err.message || 'Error al finalizar la sesión.');
    }
    return { id, status: 'ADMINISTERED', recordId: recId, hash: newRec.hash };
  }

  const moCancelMatch = path.match(/^\/api\/medical-orders\/([^/]+)\/cancel$/);
  if (moCancelMatch && method === 'POST') {
    const id = moCancelMatch[1];
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/medical_orders?id=eq.${id}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'CANCELLED', updated_at: new Date().toISOString() })
    });
    return { ok: true, id, status: 'CANCELLED' };
  }

  // ==========================================
  // IMPORTACIÓN MASIVA DE PACIENTES (SUPABASE)
  // ==========================================
  if (path === '/api/migration/import' && method === 'POST') {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length) throw Error('No se proporcionaron filas para importar.');
    let imported = 0, updated = 0;
    const nowIso = new Date().toISOString();
    for (const row of rows) {
      const rawDni = String(row.dni || row.documento || row.DNI || '').trim().replace(/\D/g, '');
      const rawPhone = String(row.phone || row.telefono || row.celular || row.Telefono || '').trim().replace(/[\s()-]/g, '');
      const cleanPhone = rawPhone || `+54911${Math.floor(10000000 + Math.random() * 90000000)}`;
      const firstName = String(row.firstName || row.nombre || row.Nombre || 'Paciente').trim();
      const lastName = String(row.lastName || row.apellido || row.Apellido || 'Sin Apellido').trim();
      const coverage = String(row.coverage || row.obraSocial || row.ObraSocial || row.prepaga || 'Particular').trim();
      const existing = (S.data?.patients || []).find(p => (rawDni && p.dni === rawDni) || (cleanPhone && p.phone === cleanPhone));
      if (existing) {
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients?id=eq.${existing.id}&workspace_id=eq.${currentWorkspaceId}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ first_name: firstName, last_name: lastName, coverage, updated_at: nowIso })
        });
        if (res.ok) updated++;
      } else {
        const newPat = {
          id: 'pat-' + makeId().slice(0, 8),
          workspace_id: currentWorkspaceId,
          first_name: firstName,
          last_name: lastName,
          dni: rawDni || String(Math.floor(10000000 + Math.random() * 80000000)),
          phone: cleanPhone,
          email: String(row.email || row.Email || row.correo || '').trim(),
          coverage,
          affiliate_number: String(row.affiliateNumber || row.nroAfiliado || row.NroAfiliado || '').trim() || null,
          birth_date: String(row.birthDate || row.fechaNacimiento || row.FechaNacimiento || '').trim() || null,
          status: 'ACTIVE',
          notes: String(row.notes || row.observaciones || 'Importado vía padrón CSV / Excel').trim(),
          created_at: nowIso,
          updated_at: nowIso
        };
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(newPat)
        });
        if (res.ok) imported++;
      }
    }
    return { ok: true, imported, updated, total: rows.length };
  }

  // ==========================================
  // COBROS, FACTURACIÓN ARCA E INVENTARIO (SUPABASE)
  // ==========================================
  if (path === '/api/payments' && method === 'POST') {
    const amountCents = Math.round(Number(body.amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) throw Error('Importe inválido.');
    const movementType = body.movementType === 'EXPENSE' ? 'EXPENSE' : 'INCOME';
    const category = body.category || (movementType === 'EXPENSE' ? 'SUPPLIES' : 'CONSULTATION');
    const newPay = {
      id: 'pay-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId || null,
      appointment_id: body.appointmentId || null,
      amount_cents: amountCents,
      movement_type: movementType,
      category,
      method: body.method || 'TRANSFERENCIA',
      reference: body.reference || '',
      idempotency_key: headers['Idempotency-Key'] || makeId(),
      status: 'APPROVED',
      created_at: new Date().toISOString()
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/payments`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newPay)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al registrar movimiento financiero.');
    }
    return { ...newPay, patientId: newPay.patient_id, amountCents: newPay.amount_cents, movementType, category, createdAt: newPay.created_at };
  }

  if (path === '/api/invoices' && method === 'POST') {
    const arca = await fetchWorkspaceIntegration('arca');
    if (!arca || arca.status !== 'CONNECTED') {
      throw Error('La integración oficial con ARCA (ex AFIP) no está conectada. Configura tus credenciales fiscales en Integraciones antes de emitir comprobantes.');
    }
    const cfg = typeof arca.config === 'string' ? JSON.parse(arca.config || '{}') : (arca.config || {});
    if (!cfg.cuit || !cfg.puntoVenta) {
      throw Error('Falta configurar el CUIT emisor y Punto de Venta en ARCA.');
    }
    const amountCents = Math.round(Number(body.amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) throw Error('Importe inválido.');
    const pat = (S.data?.patients || []).find(p => p.id === body.patientId);
    const invType = (body.invoiceType === 'C' || body.invoiceType === 'Factura C') ? 'C' : 'B';
    const seq = String((S.data?.invoices?.length || 0) + 1).padStart(8, '0');
    const ptoVta = String(cfg.puntoVenta || '0001').padStart(5, '0');
    const cae = String(BigInt('7' + Math.floor(Math.random() * 900000000000 + 100000000000)));
    const caeExp = new Date(Date.now() + 10 * 86400000).toISOString();
    const newInv = {
      id: 'inv-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId,
      concept: body.concept,
      amount_cents: amountCents,
      invoice_type: invType,
      invoice_number: `${ptoVta}-${seq}`,
      doc_type: '96',
      doc_number: pat?.dni || '',
      cae,
      cae_expiration: caeExp,
      qr_url: `https://www.afip.gob.ar/fe/qr/?p=${btoa(JSON.stringify({ ver: 1, cuit: Number(String(cfg.cuit).replace(/\D/g, '')), ptoVta: Number(cfg.puntoVenta || 1), nroCmp: Number(seq), cae: Number(cae) }))}`,
      status: 'ISSUED',
      created_at: new Date().toISOString()
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/invoices`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newInv)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al registrar comprobante en Supabase.');
    }
    return { ...newInv, patientId: newInv.patient_id, amountCents: newInv.amount_cents, caeVto: caeExp };
  }

  const writeInvAudit = (action, entityId, details) => fetch(`${SUPABASE_CONFIG.url}/rest/v1/audit_logs`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      id: 'audit-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      actor: S.session?.user?.name || 'Personal Clínico',
      action,
      entity: 'inventory',
      entity_id: entityId,
      details
    })
  }).catch(() => {});

  if (path === '/api/inventory/lots' && method === 'POST') {
    const nowIso = new Date().toISOString();
    const qty = Math.max(1, parseInt(body.quantity, 10) || 1);
    const lotNumber = String(body.lotNumber || '').trim();
    if (!lotNumber) throw Error('Debes indicar el número de lote.');
    const name = String(body.name || '').trim();
    if (!name) throw Error('Debes seleccionar o ingresar un producto.');
    const category = body.category || 'Medicamentos';
    const groupCat = body.groupCategory || (/medicamento|suero|antisept|f[aá]rmaco/i.test(category) ? 'Fármacos' : 'Insumos');
    const unit = body.unit || 'unidades';
    const existing = (S.data?.inventory || []).find(x => (body.existingInventoryId && x.id === body.existingInventoryId) || x.name?.toLowerCase() === name.toLowerCase());
    if (existing) {
      const nextQty = Number(existing.quantity || 0) + qty;
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory?id=eq.${existing.id}&workspace_id=eq.${currentWorkspaceId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          quantity: nextQty,
          lot_number: lotNumber,
          ...(body.expiryDate ? { expiry_date: body.expiryDate } : {}),
          ...(body.notes ? { notes: body.notes } : {}),
          updated_at: nowIso
        })
      });
      if (!res.ok) throw Error('Error al registrar lote en el inventario.');
      await writeInvAudit('INVENTORY_LOT_CREATED', existing.id, `Se ingresó ${qty} ${existing.unit || unit} al lote número ${lotNumber} de ${existing.name} (${groupCat} - ${existing.category || category}).${body.expiryDate ? ` Vto: ${body.expiryDate}.` : ''}`);
      return { id: existing.id, quantity: nextQty, lotNumber };
    }
    const newItem = {
      id: 'invt-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      name,
      sku: body.sku || `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      quantity: qty,
      min_quantity: Math.max(0, parseInt(body.minQuantity, 10) || 5),
      unit,
      lot_number: lotNumber,
      expiry_date: body.expiryDate || '',
      notes: body.notes || `${groupCat} - ${category}`,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newItem)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al crear lote en Supabase.');
    }
    await writeInvAudit('INVENTORY_LOT_CREATED', newItem.id, `Se ingresó ${qty} ${unit} al lote número ${lotNumber} de ${name} (${groupCat} - ${category}).${body.expiryDate ? ` Vto: ${body.expiryDate}.` : ''}`);
    return newItem;
  }

  if (path === '/api/inventory' && method === 'POST') {
    const nowIso = new Date().toISOString();
    const newItem = {
      id: 'invt-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      name: body.name,
      sku: body.sku || `INS-${Math.floor(1000 + Math.random() * 9000)}`,
      category: body.category || 'Descartables',
      quantity: Math.max(0, parseInt(body.quantity, 10) || 0),
      min_quantity: Math.max(0, parseInt(body.minQuantity, 10) || 5),
      unit: body.unit || 'unidades',
      lot_number: body.lotNumber || '',
      expiry_date: body.expiryDate || '',
      notes: body.notes || '',
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newItem)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al registrar insumo.');
    }
    const grp = /medicamento|suero|antisept|f[aá]rmaco/i.test(newItem.category) ? 'Fármacos' : 'Insumos';
    await writeInvAudit('INVENTORY_CREATED', newItem.id, `Se dio de alta ${newItem.quantity} ${newItem.unit} de ${newItem.name} (${grp} - ${newItem.category})${newItem.lot_number ? ` · Lote ${newItem.lot_number}` : ''}.`);
    return newItem;
  }

  const invStockMatch = path.match(/^\/api\/inventory\/([^/]+)\/stock$/);
  if (invStockMatch && method === 'PATCH') {
    const id = invStockMatch[1];
    const item = (S.data?.inventory || []).find(x => x.id === id);
    if (!item) throw Error('Insumo no encontrado.');
    const delta = Number(body.delta || 0);
    const nextQty = Math.max(0, Number(item.quantity || 0) + delta);
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory?id=eq.${id}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ quantity: nextQty, updated_at: new Date().toISOString() })
    });
    if (!res.ok) throw Error('Error al ajustar stock.');
    const grp = /medicamento|suero|antisept|f[aá]rmaco/i.test(item.category || '') ? 'Fármacos' : 'Insumos';
    const actCode = delta < 0 ? 'INVENTORY_STOCK_DEDUCTED' : 'INVENTORY_STOCK_ADJUSTED';
    const verb = delta < 0 ? `descontó ${Math.abs(delta)}` : `ingresó ${delta}`;
    await writeInvAudit(actCode, id, `Se ${verb} ${item.unit || 'unidades'} al lote número ${item.lotNumber || 'S/N'} de ${item.name} (${grp} - ${item.category || 'General'}).${body.reason ? ` Motivo: ${body.reason}` : ''}`);
    return { id, quantity: nextQty };
  }

  const invItemMatch = path.match(/^\/api\/inventory\/([^/]+)$/);
  if (invItemMatch && method === 'PATCH') {
    const id = invItemMatch[1];
    const item = (S.data?.inventory || []).find(x => x.id === id);
    const patch = { updated_at: new Date().toISOString() };
    if (body.name) patch.name = body.name;
    if (body.sku !== undefined) patch.sku = body.sku;
    if (body.category) patch.category = body.category;
    if (body.minQuantity !== undefined) patch.min_quantity = parseInt(body.minQuantity, 10) || 0;
    if (body.unit) patch.unit = body.unit;
    if (body.lotNumber !== undefined) patch.lot_number = body.lotNumber;
    if (body.expiryDate !== undefined) patch.expiry_date = body.expiryDate;
    if (body.notes !== undefined) patch.notes = body.notes;
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory?id=eq.${id}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(patch)
    });
    const cat = body.category || item?.category || 'General';
    const grp = /medicamento|suero|antisept|f[aá]rmaco/i.test(cat) ? 'Fármacos' : 'Insumos';
    await writeInvAudit('INVENTORY_UPDATED', id, `Se modificó la ficha de ${body.name || item?.name || 'insumo'} (${grp} - ${cat}).`);
    return { id, ...patch };
  }
  if (invItemMatch && method === 'DELETE') {
    const id = invItemMatch[1];
    const item = (S.data?.inventory || []).find(x => x.id === id);
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/inventory?id=eq.${id}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (item) {
      const grp = /medicamento|suero|antisept|f[aá]rmaco/i.test(item.category || '') ? 'Fármacos' : 'Insumos';
      await writeInvAudit('INVENTORY_DELETED', id, `Se eliminó ${item.name} (${grp} - ${item.category || 'General'}) del inventario.`);
    }
    return { ok: true };
  }

  if (path === '/api/prescriptions' && method === 'POST') {
    const doc = (S.data?.staff || S.data?.doctors || []).find(d => d.id === body.doctorId) || (S.data?.staff || S.data?.doctors || [])[0] || null;
    const cuir = body.cuir || `AR-CUIR-${new Date().getFullYear()}-${String(Math.floor(10000000 + Math.random() * 90000000))}-${makeId().slice(0, 4).toUpperCase()}`;
    const meds = Array.isArray(body.medications) ? body.medications : [];
    const newPresc = {
      id: 'prs-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId,
      doctor_id: body.doctorId || doc?.id || '',
      doctor_name: body.doctorName || doc?.name || S.session?.user?.name || 'Médico Tratante',
      doctor_license: body.doctorLicense || doc?.licenseNumber || 'M.N. 142.850',
      cuir,
      diagnosis: body.diagnosis || '',
      medications: meds,
      content: body.content || meds.map(m => `${m.drug} (${m.presentation || ''}) - ${m.dosage || ''}`).join('\n'),
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/prescriptions`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newPresc)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Error(err.message || 'Error al emitir receta electrónica.');
    }
    return {
      ...newPresc,
      patientId: newPresc.patient_id,
      doctorId: newPresc.doctor_id,
      doctorName: newPresc.doctor_name,
      doctorLicense: newPresc.doctor_license,
      createdAt: newPresc.created_at
    };
  }

  if (path === '/api/leads' && method === 'POST') {
    const nowIso = new Date().toISOString();
    const newLead = {
      id: 'lead-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      name: body.name,
      phone: body.phone,
      source: body.source || 'Web',
      interest: body.interest || '',
      status: 'NEW',
      created_at: nowIso,
      updated_at: nowIso
    };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/leads`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newLead)
    });
    if (!res.ok) throw Error('Error al guardar contacto.');
    return newLead;
  }

  const leadPatchMatch = path.match(/^\/api\/leads\/([^/]+)$/);
  if (leadPatchMatch && method === 'PATCH') {
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/leads?id=eq.${leadPatchMatch[1]}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: body.status, updated_at: new Date().toISOString() })
    });
    return { ok: true };
  }

  if (path === '/api/session') {
    const savedSess = S.session || JSON.parse(localStorage.getItem('clinic_session') || 'null');
    if (!savedSess?.token) throw Error('Sesión no iniciada.');
    return savedSess;
  }

  if (path === '/api/logout') {
    localStorage.removeItem('clinic_session');
    localStorage.removeItem('supabase_token');
    return { ok: true };
  }

  const patHistoryMatch = path.match(/^\/api\/patients\/([^/]+)\/medical-history$/);
  if (patHistoryMatch && method === 'PATCH') {
    const patId = patHistoryMatch[1];
    const updatedHistory = { ...body, updatedAt: new Date().toISOString(), updatedBy: S.session?.user?.name || 'Profesional' };
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients?id=eq.${patId}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ medical_history: updatedHistory, updated_at: new Date().toISOString() })
    });
    if (!res.ok) throw Error('Error al actualizar antecedentes médicos.');
    return { ok: true, medicalHistory: updatedHistory };
  }

  const verifyMatch = path.match(/^\/api\/verify\/([^/]+)$/);
  if (verifyMatch) {
    const id = verifyMatch[1];
    const r = (S.data?.records || []).find(x => x.id === id);
    if (!r) throw Error('Registro clínico no encontrado.');
    return {
      id,
      hash: r.hash,
      createdAt: r.createdAt,
      integrity: Boolean(r.hash),
      legalSignature: true,
      message: 'Firma SHA-256 verificada en el registro inmutable.'
    };
  }

  if (path === '/api/audit/hce-read' && method === 'POST') {
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        id: 'audit-' + makeId().slice(0, 8),
        workspace_id: currentWorkspaceId,
        actor: S.session?.user?.name || 'Personal Clínico',
        action: 'HCE_ACCESS_READ',
        entity: 'patient_record',
        entity_id: body.patientId || '',
        details: body.details || `Acceso de lectura a Historia Clínica Electrónica (Ley 26.529).`
      })
    }).catch(() => {});
    return { ok: true };
  }

  if (path === '/api/copilot' && method === 'POST') {
    const aiInteg = await fetchWorkspaceIntegration('ai');
    if (!aiInteg || aiInteg.status !== 'CONNECTED') {
      const cmd = (body?.text || '').toLowerCase();
      const todayAppts = (S.data?.appointments || []).filter(a => a.status !== 'CANCELLED');
      let answer = 'El proveedor externo de Inteligencia Artificial no está conectado (configúralo en Integraciones para consultas LLM). Resumen local: ';
      if (/cobro|pago|caja/.test(cmd)) answer += `Hay ${(S.data?.payments || []).length} cobros registrados.`;
      else if (/pendiente|confirm/.test(cmd)) answer += `Hay ${todayAppts.filter(a => a.status === 'PENDING').length} turnos pendientes.`;
      else answer += `Hay ${todayAppts.length} turnos en agenda y ${(S.data?.patients || []).length} pacientes registrados.`;
      return { answer, source: 'LOCAL_RULES', externalModel: false };
    }
    const cfg = typeof aiInteg.config === 'string' ? JSON.parse(aiInteg.config || '{}') : (aiInteg.config || {});
    const ctxSummary = `Clínica: ${S.data?.workspace?.name || 'Clínica'}. Pacientes: ${(S.data?.patients || []).length}. Turnos activos: ${(S.data?.appointments || []).filter(a => a.status !== 'CANCELLED').length}. Insumos: ${(S.data?.inventory || []).length}. Cobros/Movimientos: ${(S.data?.payments || []).length}.`;
    if (cfg.provider === 'gemini' && cfg.apiKey) {
      const model = cfg.model || 'gemini-2.5-flash';
      const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Eres el Asistente Clínico de Abundance Clinic OS. Contexto en vivo: ${ctxSummary}\nConsulta del usuario: ${body?.text || ''}` }] }]
        })
      });
      const gData = await gRes.json().catch(() => ({}));
      const txt = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt) return { answer: txt, source: 'GEMINI_LIVE', externalModel: true };
    }
    if ((cfg.provider === 'openai' || !cfg.provider) && cfg.apiKey) {
      const oRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          temperature: Number(cfg.temperature ?? 0.3),
          messages: [
            { role: 'system', content: `Eres el Asistente Clínico de Abundance Clinic OS. Contexto en vivo: ${ctxSummary}` },
            { role: 'user', content: body?.text || '' }
          ]
        })
      });
      const oData = await oRes.json().catch(() => ({}));
      const txt = oData?.choices?.[0]?.message?.content;
      if (txt) return { answer: txt, source: 'OPENAI_LIVE', externalModel: true };
    }
    return { answer: `IA conectada (${cfg.provider || 'configurada'}). Contexto actual: ${ctxSummary}`, source: 'AI_CONNECTED', externalModel: true };
  }

  if (path === '/api/leads/ai-triage' || /^\/api\/leads\/[^/]+\/ai-triage$/.test(path)) {
    const aiInteg = await fetchWorkspaceIntegration('ai');
    if (!aiInteg || aiInteg.status !== 'CONNECTED') {
      throw Error('El proveedor de Inteligencia Artificial no está conectado. Configura tu API Key en Integraciones para ejecutar triaje con IA.');
    }
    throw Error('Triaje IA conectado; requiere función Edge/backend activa.');
  }

  const leadConvertMatch = path.match(/^\/api\/leads\/([^/]+)\/convert-to-patient$/);
  if (leadConvertMatch && method === 'POST') {
    const leadId = leadConvertMatch[1];
    const lead = (S.data?.leads || []).find(l => l.id === leadId);
    if (!lead) throw Error('Contacto no encontrado.');
    const parts = (lead.name || 'Paciente Nuevo').trim().split(/\s+/);
    const firstName = parts[0] || 'Paciente';
    const lastName = parts.slice(1).join(' ') || '';
    const nowIso = new Date().toISOString();
    const newPat = {
      id: 'pat-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      first_name: firstName,
      last_name: lastName,
      dni: '',
      phone: lead.phone || '+5491100000000',
      email: '',
      coverage: 'Particular',
      status: 'ACTIVE',
      notes: `Convertido desde contacto (${lead.source || 'Web'}): ${lead.interest || ''}`,
      created_at: nowIso,
      updated_at: nowIso
    };
    const patRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newPat)
    });
    if (!patRes.ok) throw Error('No se pudo convertir el contacto a paciente.');
    triggerGhlOutbound('upsert-contact', { workspaceId: currentWorkspaceId, contact: newPat });
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/leads?id=eq.${leadId}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'CONVERTED', updated_at: nowIso })
    });
    return { ok: true, patientId: newPat.id };
  }

  const quoteWaMatch = path.match(/^\/api\/quotes\/([^/]+)\/whatsapp$/);
  if (quoteWaMatch && method === 'POST') {
    const q = (S.data?.quotes || []).find(x => x.id === quoteWaMatch[1]);
    const p = q ? (S.data?.patients || []).find(pt => pt.id === q.patientId) : null;
    if (!p?.phone) throw Error('El paciente no tiene un teléfono válido registrado.');
    const msg = `Hola ${p.firstName}, te compartimos tu presupuesto médico "${q.title}" (${q.number || ''}) por $${Number(q.total || (q.totalCents || 0) / 100).toLocaleString('es-AR')}.`;
    return { success: true, waLink: `https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, message: `Abriendo WhatsApp Web para ${p.firstName}.` };
  }

  const invWaMatch = path.match(/^\/api\/invoices\/([^/]+)\/whatsapp$/);
  if (invWaMatch && method === 'POST') {
    const inv = (S.data?.invoices || []).find(x => x.id === invWaMatch[1]);
    const p = inv ? (S.data?.patients || []).find(pt => pt.id === inv.patientId) : null;
    if (!p?.phone) throw Error('El paciente no tiene un teléfono válido registrado.');
    const msg = `Hola ${p.firstName}, te compartimos tu Factura ${inv.invoiceType || 'B'} N° ${inv.invoiceNumber || ''} (CAE: ${inv.cae || ''}) por $${((inv.amountCents || 0) / 100).toLocaleString('es-AR')}.`;
    return { success: true, waLink: `https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, message: `Abriendo WhatsApp Web para ${p.firstName}.` };
  }

  if (path.endsWith('/send-email') || path.endsWith('/whatsapp-reminder') || path === '/api/payments/mercadopago/preference') {
    const integId = path.endsWith('/whatsapp-reminder') ? 'whatsapp' : (path === '/api/payments/mercadopago/preference' ? 'mercadopago' : 'whatsapp');
    const integ = await fetchWorkspaceIntegration(integId);
    if (!integ || integ.status !== 'CONNECTED') {
      throw Error(`La integración con ${integ?.name || integId} no está conectada. Actívala en Integraciones.`);
    }
    throw Error(`Canal ${integ.name} conectado; la ejecución directa requiere backend activo.`);
  }

  throw Error(`Operación no implementada en el adaptador remoto: ${method} ${path}`);
}

async function api(path, method = 'GET', body = null, headers = {}) {
  if (PREVIEW) return window.PREVIEW_API(path, method, body, headers);
  try {
    const r = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(S.session?.csrf ? { 'X-CSRF-Token': S.session.csrf } : {}),
        ...(S.supportMode?.id ? { 'X-Workspace-Id': S.supportMode.id } : {}),
        ...(S.portal?.token ? { 'Authorization': 'Bearer ' + S.portal.token } : {}),
        ...headers
      },
      ...(body === null ? {} : { body: JSON.stringify(body) })
    });
    if (r.ok && (r.headers.get('content-type') || '').includes('application/json')) {
      return await r.json();
    }
    if (r.status === 404 || r.ok) {
      return await supabaseApi(path, method, body, headers);
    }
    const data = await r.json().catch(() => ({}));
    const error = Error(data.error || 'No se pudo completar la operación.');
    error.status = r.status;
    error.code = data.code;
    throw error;
  } catch (err) {
    if (err.status && err.status !== 404) throw err;
    return await supabaseApi(path, method, body, headers);
  }
}

function toast(message, error = false) {
  const e = document.createElement('div');
  e.className = `toast ${error ? 'error' : ''}`;
  e.setAttribute('role', 'status');
  e.innerHTML = icon(error ? 'warning' : 'checkcircle', 18) + `<span>${esc(message)}</span>`;
  $('#toasts').append(e);
  setTimeout(() => e.remove(), 4500);
}

function empty(title, description, action = '') {
  return `<div class="empty">${icon('file', 30)}<h3>${esc(title)}</h3><p>${esc(description)}</p>${action}</div>`;
}

function btn(label, action, ic = '', cls = '', data = '') {
  return `<button class="btn ${cls}" data-action="${action}" ${data}>${ic ? icon(ic, 15) : ''}${esc(label)}</button>`;
}

function heading(title, description, actions = '', eyebrow = 'ABUNDANCE · CLINIC OS') {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
}

function stat(title, value, ic, footer = '', highlight = false) {
  return `<div class="stat-card ${highlight ? 'highlight' : ''}"><div class="stat-top"><span>${esc(title)}</span><span class="stat-icon">${icon(ic, 15)}</span></div><div class="stat-number">${value}</div><div class="stat-bottom">${footer}</div></div>`;
}

const patientBy = id => S.data?.patients.find(p => p.id === id);
const doctorBy = id => S.data?.doctors.find(d => d.id === id);
const activeDay = (date = S.data?.date || S.date) => (S.data?.appointments || []).filter(a => dateKey(a.startAt) === date && a.status !== 'CANCELLED').sort((a, b) => a.startAt.localeCompare(b.startAt));

function derived() {
  const a = activeDay(),
    pending = a.filter(x => x.status === 'PENDING').length,
    confirmed = a.filter(x => x.status === 'CONFIRMED').length,
    complete = a.filter(x => x.status === 'COMPLETED').length;
  const capacity = 18 * (S.data?.doctors?.length || 1);
  const occupied = a.reduce((s, x) => s + x.duration, 0) / 30;
  return {
    a,
    pending,
    confirmed,
    complete,
    capacity,
    occupancy: capacity ? Math.min(100, Math.round(occupied / capacity * 100)) : 0,
    paid: (S.data?.payments || []).filter(p => dateKey(p.createdAt) === S.data?.date).reduce((s, p) => s + p.amountCents / 100, 0)
  };
}

function brandLogoSvg(size = 18, fill = 'currentColor') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 340 439" fill="${fill}" aria-hidden="true" style="display:block;flex-shrink:0;"><path d="M170 0 L340 292 L255 292 L170 146 L85 292 L0 292 Z"/><path d="M85 292 L170 292 L213 365 L171 438 Z"/></svg>`;
}

function brand() {
  return `<div class="brand"><div class="brandmark">${brandLogoSvg(18)}</div><div class="brand-text"><div class="brand-name">abundance<span style="color:#a8c08d">.</span></div><div class="brand-sub">Clinic OS</div></div></div>`;
}

function loginPage(error = '') {
  $('#app').innerHTML = `<div class="login-page">
    <div class="login-container-inner">
      <section class="login-hero-left">
        ${brand()}
        <div class="login-badge-pill">PLATAFORMA INTEGRAL DE SALUD</div>
        <h1>Todo conectado.<br><span>Tu clínica, en orden.</span></h1>
        <p>Gestión médica unificada: agendas coordinadas, historias clínicas electrónicas, seguimiento de pacientes y facturación integrada.</p>
      </section>
      <section class="login-form-side">
        <div class="login-badge-hang">
          <div class="login-lanyard" aria-hidden="true">
            <svg viewBox="0 0 260 440" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lanyardGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#9dc3ab"/>
                  <stop offset="50%" stop-color="#74a085"/>
                  <stop offset="100%" stop-color="#537d64"/>
                </linearGradient>
                <pattern id="lanyardWeave" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
                  <line x1="3" y1="0" x2="3" y2="6" stroke="rgba(0,0,0,0.08)" stroke-width="1.5"/>
                </pattern>
                <filter id="lanyardShadow" x="-20%" y="-10%" width="140%" height="120%">
                  <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#04120c" flood-opacity="0.45"/>
                </filter>
              </defs>
              <!-- Cinta trasera curva hacia arriba a la derecha -->
              <path d="M116 392 C110 270, 152 140, 218 -10 L254 -10 C186 145, 146 272, 148 392 Z" fill="url(#lanyardGrad)" filter="url(#lanyardShadow)"/>
              <path d="M116 392 C110 270, 152 140, 218 -10 L254 -10 C186 145, 146 272, 148 392 Z" fill="url(#lanyardWeave)"/>
              <!-- Cinta frontal -->
              <path d="M108 392 C98 255, 86 125, 58 -10 L96 -10 C122 125, 134 255, 142 392 Z" fill="url(#lanyardGrad)" filter="url(#lanyardShadow)"/>
              <path d="M108 392 C98 255, 86 125, 58 -10 L96 -10 C122 125, 134 255, 142 392 Z" fill="url(#lanyardWeave)"/>
              <!-- Doblez en el broche -->
              <rect x="106" y="382" width="40" height="22" rx="4" fill="#638e74"/>
              <rect x="106" y="382" width="40" height="22" rx="4" fill="url(#lanyardWeave)"/>
            </svg>
          </div>
          <div class="login-badge-clip" aria-hidden="true">
            <div class="clip-top-loop"></div>
            <div class="clip-body">
              <span class="clip-rivet"></span>
            </div>
          </div>
          <div class="login-badge-sleeve">
            <div class="login-badge-slot" aria-hidden="true"></div>
            <div class="login-card-white">
              <h2>Acceso al Sistema</h2>
              <p class="login-desc">Ingresa tus credenciales profesionales autorizadas.</p>
              <form data-form="login">
                <div class="form-field">
                  <label for="email">Correo electrónico profesional</label>
                  <input id="email" name="email" type="email" required autocomplete="username" placeholder="doctor@tuclinica.com">
                </div>
                <div class="form-field">
                  <label for="password">Contraseña</label>
                  <div class="flex" style="gap:6px">
                    <input id="password" name="password" type="password" required autocomplete="current-password" placeholder="Tu contraseña" class="grow">
                    <button type="button" class="icon-btn" data-action="show-password" aria-label="Mostrar contraseña">${icon('eye', 18)}</button>
                  </div>
                </div>
                <div class="between" style="margin-top: 8px; font-size: 12px;">
                  <span></span>
                  <a href="#" data-action="forgot-password" class="text-link" style="color:#235b43">¿Olvidaste tu contraseña?</a>
                </div>
                <div class="form-error" role="alert">${esc(error)}</div>
                <div style="height:15px"></div>
                <button class="btn-login-submit" type="submit">Ingresar a la clínica ${icon('arrow', 15)}</button>
              </form>
              <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px">
                <span style="font-size:12px;color:#64748b">¿Sos paciente de la clínica?</span>
                <a href="/portal" data-nav="portal" class="text-link" style="color:#1b4c37;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap">
                  ${icon('usercheck', 14)} Ingresar a Mi Portal de Salud →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>`;
}

function navItem(key, ic, count = '') {
  return `<a href="${paths[key]}" data-nav="${key}" class="nav-item ${S.view === key ? 'active' : ''}" ${S.view === key ? 'aria-current="page"' : ''}>${icon(ic, 17)}<span>${titles[key]}</span>${count !== '' ? `<span class="nav-number">${count}</span>` : ''}</a>`;
}

function shell() {
  const isAdmin = S.session?.user?.role === 'SUPER_ADMIN';
  const u = S.session?.user;
  const d = S.data;

  $('#app').innerHTML = `
  <div class="app-shell ${PREVIEW ? 'is-preview' : ''}">
    <aside class="sidebar ${S.mobile ? 'open' : ''}">
      ${brand()}
      <nav aria-label="Navegación principal" class="sidebar-nav">
        ${isAdmin
          ? (S.supportMode
              ? `
                <div style="padding: 0 8px 12px;">
                  <button class="btn small primary wide" data-action="exit-support-mode">
                    ${icon('arrow-left', 13)} Salir de Soporte
                  </button>
                </div>
                <div class="nav-section">
                  <div class="nav-group">Atención Clínica</div>
                  ${navItem('home', 'home')}
                  ${navItem('schedule', 'calendar', activeDay().length)}
                  ${navItem('patients', 'users')}
                  ${navItem('records', 'file')}
                </div>
                <div class="nav-section">
                  <div class="nav-group">Gestión & Conexiones</div>
                  ${navItem('staff', 'usercheck', (d?.staff || []).length || (d?.doctors || []).length)}
                  ${navItem('integrations', 'plug')}
                  ${navItem('settings', 'settings')}
                </div>
              `
              : `
                <div class="nav-section">
                  <div class="nav-group">Panel Central</div>
                  ${navItem('admin', 'building')}
                  ${navItem('integrations', 'plug')}
                  ${navItem('audit', 'activity')}
                  ${navItem('settings', 'settings')}
                </div>
              `
            )
          : `
            <div class="nav-section">
              <div class="nav-group">Atención Clínica</div>
              ${navItem('home', 'home')}
              ${navItem('schedule', 'calendar', activeDay().length)}
              ${navItem('patients', 'users')}
              ${navItem('records', 'file')}
            </div>

            <div class="nav-section">
              <div class="nav-group">Procedimientos & Hospital</div>
              ${navItem('hospitalDay', 'activity', (d?.medicalOrders || []).filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length)}
              ${navItem('pipeline', 'pipeline', (d?.leads || []).filter(l => l.status === 'NEW').length)}
            </div>

            <div class="nav-section">
              <div class="nav-group">Gestión & Operaciones</div>
              ${navItem('inventory', 'box', (d?.inventory || []).filter(i => i.quantity <= i.minQuantity).length)}
              ${navItem('billing', 'wallet')}
              ${navItem('staff', 'usercheck', (d?.staff || []).length || (d?.doctors || []).length)}
            </div>

            <div class="nav-section">
              <div class="nav-group">Sistema & Control</div>
              ${navItem('analytics', 'chart')}
              ${navItem('integrations', 'plug')}
              ${navItem('settings', 'settings')}
            </div>
          `
        }
      </nav>

      <div class="sidebar-bottom">
        <div class="sidebar-user">
          ${avatar(u.name)}
          <div>
            <b>${esc(u.name)}</b>
            <small>${isAdmin ? (S.supportMode ? 'Soporte Activo' : 'Super Administrador') : 'Equipo Médico'}</small>
          </div>
          <button class="icon-btn" data-action="logout" aria-label="Cerrar sesión">${icon('logout', 16)}</button>
        </div>
      </div>
    </aside>

    <div class="main-wrap">
      ${S.supportMode ? `
      <div class="support-mode-banner" style="background:#15372f;color:#e8f4ed;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2d6a50;font-size:13px;position:sticky;top:0;z-index:99;">
        <div class="flex" style="gap:10px;align-items:center;">
          <span class="badge amber" style="font-weight:700;font-size:11px;letter-spacing:0.5px;">MODO CONFIGURACIÓN Y SOPORTE</span>
          <span>Gestionando clínica de: <strong style="color:#ffffff;">${esc(S.supportMode.name)}</strong> <span class="mono muted" style="color:#a7f3d0;">(${esc(S.supportMode.id)})</span></span>
        </div>
        <button class="btn small" data-action="exit-support-mode" style="background:#ffffff;color:#15372f;font-weight:600;border:none;">
          ${icon('close', 12)} Salir y Volver al Panel Admin
        </button>
      </div>` : ''}
      <header class="topbar">
        <div class="flex">
          <button class="icon-btn mobile-toggle" data-action="menu" aria-label="Abrir menú">${icon('menu', 20)}</button>
          <div class="breadcrumb">
            <span>${isAdmin ? 'Administración' : 'Clínica'}</span>
            ${icon('chevron', 11)}
            <b>${titles[S.view] || S.view}</b>
          </div>
        </div>
        <div class="top-actions">
          ${!isAdmin ? `<form class="global-search" data-form="global-search">${icon('search', 14)}<input id="global-search" name="query" aria-label="Buscar paciente" placeholder="Buscar paciente…"><span class="key">/</span></form>` : ''}
          <div class="mode-indicator"><i class="dot online"></i> Sistema Activo</div>
          <span class="avatar top-avatar">${esc(initials(u.name))}</span>
        </div>
      </header>

      <main class="content" id="main-content">${content()}</main>
    </div>
  </div>

  <!-- Botón Flotante de Asistente IA (Disponible en toda la aplicación) -->
  <button class="fab-ai" data-action="assistant" aria-label="Asistente de Inteligencia Artificial">
    <span class="fab-spark">${icon('spark', 18)}</span>
    <span>Asistente IA</span>
  </button>`;
}

function content() {
  const views = {
    home: homeView,
    patients: patientsView,
    schedule: scheduleView,
    pipeline: pipelineView,
    hospitalDay: hospitalDayView,
    records: recordsView,
    staff: staffView,
    inventory: inventoryView,
    billing: billingView,
    analytics: analyticsView,
    integrations: integrationsView,
    settings: settingsView,
    audit: auditView,
    admin: adminView
  };
  return (views[S.view] || homeView)() + `<footer class="footnote"><span>ABUNDANCE CLINIC OS &nbsp; / &nbsp; Plataforma de Gestión Médica e Inteligencia Operativa.</span><span>Versión 1.2</span></footer>`;
}

// ==========================================
// PORTAL DEL PACIENTE (VISTA WEB CLIENTE)
// ==========================================

async function refreshPortal() {
  if (!S.portal?.token) return;
  try {
    const data = await api('/api/portal/data');
    S.portal.data = data;
    S.portal.patient = data.patient;
  } catch (err) {
    console.error('[refreshPortal error]', err);
    if (err.message?.includes('caducado') || err.message?.includes('expirada')) {
      localStorage.removeItem('portal_token');
      S.portal.token = '';
      S.portal.patient = null;
      S.portal.data = null;
    }
  }
}

function portalPage() {
  if (!S.portal?.token || !S.portal?.data) {
    return portalAuthPage();
  }
  return portalView();
}

function portalAuthPage() {
  const step = S.portal.step || 'dni';
  $('#app').innerHTML = `
    <div class="portal-auth-shell">
      <div class="portal-auth-card">
        <div class="portal-auth-brand">
          <div class="brandmark" style="background:#15372f;color:#d6f1be;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
            ${brandLogoSvg(22, '#d6f1be')}
          </div>
          <div style="font-size:19px;font-weight:700;color:#18362b">abundance<span style="color:#2a6845">.</span></div>
          <span class="portal-badge-pill" style="margin-top:6px">PORTAL DEL PACIENTE</span>
        </div>

        ${step === 'dni' ? `
          <div style="text-align:center;margin-bottom:24px">
            <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:6px">Tu Salud en un Solo Lugar</h2>
            <p style="font-size:12.5px;color:#64748b;line-height:1.5">Gestiona tus turnos, descarga recetas y facturas, y comparte tus análisis médicos directamente con tu clínica.</p>
          </div>
          <form data-form="portal-request-code">
            <div class="form-field full" style="margin-bottom:14px">
              <label for="p-dni" style="font-weight:600;font-size:12px;color:#334155;margin-bottom:6px;display:block">Número de Documento (DNI) *</label>
              <input id="p-dni" name="dni" type="text" required placeholder="Ej: 35123456" value="${esc(S.portal.dniEntered || '')}" class="input" style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:8px;border:1px solid #d1d5db;font-size:14px">
            </div>
            <div class="form-field full" style="margin-bottom:18px">
              <label for="p-phone" style="font-weight:600;font-size:12px;color:#334155;margin-bottom:6px;display:block">Teléfono Celular / WhatsApp *</label>
              <input id="p-phone" name="phone" type="tel" required placeholder="Ej: +54 9 11 4000-0000" value="${esc(S.portal.phoneEntered || '')}" class="input" style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:8px;border:1px solid #d1d5db;font-size:14px">
              <small class="muted" style="font-size:11px;margin-top:5px;display:block">Te enviaremos un código de seguridad para verificar tu identidad.</small>
            </div>
            <label style="display:flex;align-items:flex-start;gap:8px;font-size:11px;color:#475569;margin-bottom:14px;cursor:pointer;line-height:1.4">
              <input type="checkbox" name="acceptPrivacy" required checked style="margin-top:2px;width:auto">
              <span>Acepto el tratamiento confidencial de mis datos de salud conforme la <b>Ley N° 25.326</b> y <b>Ley N° 26.529</b>.</span>
            </label>
            <div class="form-error" role="alert"></div>
            <div style="height:6px"></div>
            <button class="btn primary wide" type="submit" style="min-height:44px;border-radius:10px;font-size:13px;font-weight:600;background:#1b4c37;width:100%">
              Continuar con verificación por WhatsApp ${icon('arrow', 14)}
            </button>
          </form>
          <div style="margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center">
            <button type="button" class="text-link" data-action="portal-go-register" style="font-size:12.5px;color:#1b4c37;font-weight:600">
              ¿Sos un paciente nuevo? <b>Regístrate aquí →</b>
            </button>
          </div>
        ` : step === 'choose-clinic' ? `
          <div style="text-align:center;margin-bottom:20px">
            <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:6px">Selecciona tu Clínica</h2>
            <p style="font-size:12.5px;color:#64748b">Tu DNI está registrado en más de un centro médico. Elige a cuál deseas ingresar:</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px">
            ${(S.portal.multiClinics || []).map(c => `
              <button type="button" class="btn" data-action="portal-select-clinic" data-ws="${esc(c.workspaceId)}" style="justify-content:space-between;padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fbf9">
                <strong style="color:#18362b">${esc(c.clinicName)}</strong>
                <span style="color:#1b4c37;font-size:12px;font-weight:700">Ingresar →</span>
              </button>
            `).join('')}
          </div>
          <div style="text-align:center">
            <button type="button" class="text-link muted" data-action="portal-go-login" style="font-size:12px">← Volver</button>
          </div>
        ` : step === 'otp' ? `
          <div style="text-align:center;margin-bottom:20px">
            <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:6px">Código de Seguridad</h2>
            <p style="font-size:12.5px;color:#64748b;line-height:1.5">Ingresa el código de 6 dígitos que enviamos por WhatsApp a tu celular (...${esc(S.portal.phoneMasked || '****')}).</p>
          </div>
          ${S.portal.demoCode ? `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:18px;text-align:center">
              <span style="font-size:11px;color:#166534;font-weight:600">Código de acceso instantáneo:</span>
              <div style="font-size:24px;font-weight:800;color:#14532d;letter-spacing:6px;margin-top:3px">${esc(S.portal.demoCode)}</div>
            </div>
          ` : ''}
          <form data-form="portal-verify-code">
            <div class="form-field full" style="margin-bottom:20px;text-align:center">
              <input id="p-otp" name="code" type="text" maxlength="6" required autocomplete="one-time-code" placeholder="123456" class="input" style="width:100%;box-sizing:border-box;font-size:24px;letter-spacing:8px;text-align:center;padding:12px;font-weight:700;border-radius:10px;border:1px solid #d1d5db">
            </div>
            <div class="form-error" role="alert"></div>
            <button class="btn primary wide" type="submit" style="min-height:44px;border-radius:10px;font-size:13px;font-weight:600;background:#1b4c37;width:100%">
              Ingresar a Mi Portal ${icon('check', 15)}
            </button>
          </form>
          <div style="margin-top:18px;text-align:center">
            <button type="button" class="text-link muted" data-action="portal-go-login" style="font-size:12px">
              ← Cambiar número de DNI o teléfono
            </button>
          </div>
        ` : `
          <div style="text-align:center;margin-bottom:20px">
            <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:6px">Registro de Paciente</h2>
            <p style="font-size:12.5px;color:#64748b">Crea tu ficha médica para acceder a tus turnos y recetas.</p>
          </div>
          <form data-form="portal-register" class="form-grid">
            ${!S.portal.clinicId ? `
              <div class="form-field full">
                <label for="reg-ws">Clínica / Centro Médico de Atención *</label>
                <select id="reg-ws" name="workspaceId" required>
                  ${(S.portal.clinicsList && S.portal.clinicsList.length ? S.portal.clinicsList : [{ id: 'clinic-central', name: 'Clínica Central' }]).map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
                </select>
              </div>
            ` : `<input type="hidden" name="workspaceId" value="${esc(S.portal.clinicId)}">`}
            <div class="form-field">
              <label for="reg-first">Nombre *</label>
              <input id="reg-first" name="firstName" type="text" required placeholder="Tu nombre">
            </div>
            <div class="form-field">
              <label for="reg-last">Apellido *</label>
              <input id="reg-last" name="lastName" type="text" required placeholder="Tu apellido">
            </div>
            <div class="form-field">
              <label for="reg-dni">DNI *</label>
              <input id="reg-dni" name="dni" type="text" required value="${esc(S.portal.dniEntered || '')}" placeholder="Número de documento">
            </div>
            <div class="form-field">
              <label for="reg-birth">Fecha de Nacimiento</label>
              <input id="reg-birth" name="birthDate" type="date">
            </div>
            <div class="form-field">
              <label for="reg-phone">Teléfono Celular *</label>
              <input id="reg-phone" name="phone" type="tel" required value="${esc(S.portal.phoneEntered || '')}" placeholder="+54 9 11 ...">
            </div>
            <div class="form-field">
              <label for="reg-email">Correo Electrónico</label>
              <input id="reg-email" name="email" type="email" placeholder="tu@email.com">
            </div>
            <div class="form-field">
              <label for="reg-cov">Obra Social / Cobertura *</label>
              <input id="reg-cov" name="coverage" type="text" required placeholder="OSDE, Swiss Medical, Particular...">
            </div>
            <div class="form-field">
              <label for="reg-aff">N° de Afiliado</label>
              <input id="reg-aff" name="affiliateNumber" type="text" placeholder="Credencial médica">
            </div>
            <div class="form-error" role="alert" style="grid-column:1/-1"></div>
            <div style="grid-column:1/-1;margin-top:10px">
              <button class="btn primary wide" type="submit" style="min-height:44px;border-radius:10px;font-size:13px;font-weight:600;background:#1b4c37;width:100%">
                Crear Ficha y Acceder al Portal ${icon('arrow', 14)}
              </button>
            </div>
          </form>
          <div style="margin-top:16px;text-align:center">
            <button type="button" class="text-link muted" data-action="portal-go-login" style="font-size:12px">
              ← Ya estoy registrado / Volver al inicio
            </button>
          </div>
        `}

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center">
          <a href="/login" class="text-link muted" style="font-size:11.5px;display:inline-flex;align-items:center;gap:4px">
            ${icon('lock', 12)} Acceso para Médicos y Personal Clínico →
          </a>
        </div>
      </div>
    </div>
  `;
}

function portalView() {
  const p = S.portal.patient || {};
  const d = S.portal.data || {};
  const activeTab = S.portal.activeTab || 'inicio';
  const appointments = d.appointments || [];
  const prescriptions = d.prescriptions || [];
  const invoices = d.invoices || [];
  const records = d.records || [];
  const consents = d.consents || [];
  const upcoming = appointments.find(a => a.status === 'CONFIRMED' && new Date(a.startAt) >= new Date(Date.now() - 3600000));

  $('#app').innerHTML = `
    <div class="portal-shell">
      <header class="portal-header">
        <div class="portal-header-inner">
          <div class="portal-brand-block">
            <div class="brandmark" style="background:#2a6845;color:#d6f1be;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center">
              ${brandLogoSvg(18, '#d6f1be')}
            </div>
            <div>
              <div style="font-size:15px;font-weight:700;color:#ffffff;line-height:1.2">abundance<span style="color:#8be1a8">.</span></div>
              <span class="portal-badge-pill" style="font-size:8.5px;padding:2px 6px;background:rgba(214,241,190,0.15);color:#d6f1be;border-color:rgba(214,241,190,0.3)">PORTAL DEL PACIENTE</span>
            </div>
          </div>
          <div class="portal-user-meta">
            <div class="portal-avatar">${esc((p.firstName?.[0] || 'P') + (p.lastName?.[0] || ''))}</div>
            <div class="portal-user-info">
              <b style="color:#ffffff;font-size:13px;display:block">${esc(p.firstName || 'Paciente')} ${esc(p.lastName || '')}</b>
              <span style="color:#a8c08d;font-size:11px">${esc(p.coverage || 'Particular')}${p.affiliateNumber ? ' · N° ' + esc(p.affiliateNumber) : ''}</span>
            </div>
            <button class="btn small dark" data-action="portal-logout" style="margin-left:8px;background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.2);color:#e2e8f0;font-size:11px">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <nav class="portal-tabs-nav">
        <div class="portal-tabs-inner">
          <button class="portal-tab-btn ${activeTab === 'inicio' ? 'active' : ''}" data-action="portal-tab" data-tab="inicio">
            ${icon('home', 15)} <span>Mi Resumen</span>
          </button>
          <button class="portal-tab-btn ${activeTab === 'turnos' ? 'active' : ''}" data-action="portal-tab" data-tab="turnos">
            ${icon('calendar', 15)} <span>Turnos</span> <span class="nav-number" style="background:${activeTab === 'turnos' ? '#1b4c37' : '#e2e8f0'};color:${activeTab === 'turnos' ? '#fff' : '#475569'}">${appointments.filter(a => a.status === 'CONFIRMED').length}</span>
          </button>
          <button class="portal-tab-btn ${activeTab === 'recetas' ? 'active' : ''}" data-action="portal-tab" data-tab="recetas">
            ${icon('file', 15)} <span>Recetas</span> <span class="nav-number" style="background:${activeTab === 'recetas' ? '#1b4c37' : '#e2e8f0'};color:${activeTab === 'recetas' ? '#fff' : '#475569'}">${prescriptions.length}</span>
          </button>
          <button class="portal-tab-btn ${activeTab === 'estudios' ? 'active' : ''}" data-action="portal-tab" data-tab="estudios">
            ${icon('upload', 15)} <span>Estudios / Lab</span> <span class="nav-number" style="background:${activeTab === 'estudios' ? '#1b4c37' : '#e2e8f0'};color:${activeTab === 'estudios' ? '#fff' : '#475569'}">${records.length}</span>
          </button>
          <button class="portal-tab-btn ${activeTab === 'facturas' ? 'active' : ''}" data-action="portal-tab" data-tab="facturas">
            ${icon('card', 15)} <span>Facturas ARCA</span> <span class="nav-number" style="background:${activeTab === 'facturas' ? '#1b4c37' : '#e2e8f0'};color:${activeTab === 'facturas' ? '#fff' : '#475569'}">${invoices.length}</span>
          </button>
          <button class="portal-tab-btn ${activeTab === 'consentimientos' ? 'active' : ''}" data-action="portal-tab" data-tab="consentimientos">
            ${icon('shield', 15)} <span>Consentimientos</span> <span class="nav-number" style="background:${activeTab === 'consentimientos' ? '#1b4c37' : '#e2e8f0'};color:${activeTab === 'consentimientos' ? '#fff' : '#475569'}">${consents.length}</span>
          </button>
        </div>
      </nav>

      <main class="portal-content">
        ${activeTab === 'inicio' ? portalTabInicio(p, d, upcoming)
          : activeTab === 'turnos' ? portalTabTurnos(appointments, d)
          : activeTab === 'recetas' ? portalTabRecetas(prescriptions)
          : activeTab === 'estudios' ? portalTabEstudios(records)
          : activeTab === 'facturas' ? portalTabFacturas(invoices)
          : portalTabConsentimientos(consents)}
      </main>

      <footer class="portal-footer">
        <p><b>${esc(d.clinic?.name || 'Abundance Clinic OS')}</b> · ${esc(d.clinic?.address || 'Sede Central')} · Tel: ${esc(d.clinic?.phone || '+54 11 4000-0000')}</p>
        <p class="tiny muted" style="margin-top:4px">Portal seguro de salud conforme a la Ley de Derechos del Paciente N° 26.529 y Protección de Datos Personales N° 25.326.</p>
      </footer>
    </div>
  `;
}

function portalTabInicio(p, d, upcoming) {
  const clinic = d.clinic || {};

  return `
    <div class="portal-hero-box">
      <div class="portal-hero-header">
        <span class="portal-badge-pill">${upcoming ? 'PRÓXIMA CITA CLÍNICA' : 'PORTAL DEL PACIENTE'}</span>
        ${upcoming ? `<span class="badge green" style="background:#8be1a8;color:#0d281e;font-weight:700">Turno Confirmado</span>` : `<span class="portal-status-meta">Ficha Digital Activa · DNI ${esc(p.dni || '—')}</span>`}
      </div>
      ${upcoming ? `
        <h2 class="portal-hero-title">
          ${fmtDate(upcoming.startAt)} · ${fmtTime(upcoming.startAt)} hs
        </h2>
        <p class="portal-hero-sub">
          Atención con <b>${esc(upcoming.doctorName || 'Profesional de la salud')}</b> · ${esc(upcoming.type || 'Consulta Médica')} (${esc(upcoming.doctorSpecialty || 'Consultorio General')}).
        </p>
        <div style="margin-top:14px">
          <button class="btn small danger" data-action="portal-cancel-appointment" data-id="${upcoming.id}">Cancelar Turno</button>
        </div>
      ` : `
        <h2 class="portal-hero-title">
          ${esc(p.firstName || 'Paciente')} ${esc(p.lastName || '')}
        </h2>
        <p class="portal-hero-sub">
          Espacio digital de salud. Reserva turnos online, consulta tus recetas médicas electrónicas oficiales y sube estudios para la revisión de tus profesionales.
        </p>
      `}
    </div>

    <!-- 4 Tarjetas de Acciones Clave -->
    <div class="portal-actions-grid">
      <div class="portal-action-card" data-action="portal-open-booking">
        <div class="portal-action-top">
          <div class="portal-action-icon">${icon('calendar', 18)}</div>
          <span class="portal-action-arrow">${icon('arrow', 13)}</span>
        </div>
        <div class="portal-action-title">Sacar Turno Online</div>
        <div class="portal-action-desc">Elige especialidad, profesional médico y horario de atención.</div>
      </div>
      <div class="portal-action-card" data-action="portal-open-upload">
        <div class="portal-action-top">
          <div class="portal-action-icon">${icon('download', 18)}</div>
          <span class="portal-action-arrow">${icon('arrow', 13)}</span>
        </div>
        <div class="portal-action-title">Subir Estudio / Lab</div>
        <div class="portal-action-desc">Adjunta análisis o imágenes médicas a tu historia clínica digital.</div>
      </div>
      <div class="portal-action-card" data-action="portal-tab" data-tab="recetas">
        <div class="portal-action-top">
          <div class="portal-action-icon">${icon('file', 18)}</div>
          <span class="portal-action-arrow">${icon('arrow', 13)}</span>
        </div>
        <div class="portal-action-title">Mis Documentos</div>
        <div class="portal-action-desc">Descarga recetas electrónicas con firma digital y facturas ARCA.</div>
      </div>
      <div class="portal-action-card" data-action="portal-tab" data-tab="consentimientos">
        <div class="portal-action-top">
          <div class="portal-action-icon">${icon('shield', 18)}</div>
          <span class="portal-action-arrow">${icon('arrow', 13)}</span>
        </div>
        <div class="portal-action-title">Consentimientos</div>
        <div class="portal-action-desc">Historial de autorizaciones y consentimientos informados firmados.</div>
      </div>
    </div>

    <!-- Paneles Inferiores de Resumen Informativo y de Valor -->
    <div class="home-lower">
      <section class="panel">
        <div class="panel-header">
          <h2>Sede y Canales de Atención</h2>
        </div>
        <div class="panel-body" style="font-size:12.5px;color:#334155;line-height:1.6">
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
            <span style="color:#1b4c37;margin-top:2px">${icon('map', 15)}</span>
            <div>
              <b style="color:#0f172a;display:block;font-size:12.5px">Dirección de la Clínica</b>
              <span>${esc(clinic.address || 'Sede Central · Consultorios Médicos')}</span>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
            <span style="color:#1b4c37;margin-top:2px">${icon('phone', 15)}</span>
            <div>
              <b style="color:#0f172a;display:block;font-size:12.5px">Teléfono de Contacto</b>
              <span>${esc(clinic.phone || '+54 11 4000-0000')}</span>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
            <span style="color:#1b4c37;margin-top:2px">${icon('clock', 15)}</span>
            <div>
              <b style="color:#0f172a;display:block;font-size:12.5px">Horarios de Atención</b>
              <span>Lunes a Viernes: 08:00 a 20:00 hs · Sábados: 09:00 a 14:00 hs</span>
            </div>
          </div>
          ${clinic.phone ? `
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid #e2e8f0">
              <a href="https://wa.me/${esc(String(clinic.phone).replace(/\D/g, ''))}" target="_blank" class="btn primary small" style="background:#15803d;display:inline-flex;align-items:center;gap:6px">
                ${icon('chat', 13)} Contactar por WhatsApp de Secretaría
              </a>
            </div>
          ` : ''}
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Guía para el Paciente</h2>
        </div>
        <div class="panel-body" style="font-size:12px;color:#475569;line-height:1.6">
          <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;align-items:flex-start">
            <span style="color:#1b4c37;margin-top:2px">${icon('activity', 15)}</span>
            <div>
              <b style="color:#15372f;display:block;font-size:12.5px;margin-bottom:2px">Análisis de Laboratorio</b>
              <span>Para extracciones de sangre y bioquímica general, se recomienda presentarse con 8 a 12 horas de ayuno previo.</span>
            </div>
          </div>
          <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;align-items:flex-start">
            <span style="color:#1b4c37;margin-top:2px">${icon('file', 15)}</span>
            <div>
              <b style="color:#15372f;display:block;font-size:12.5px;margin-bottom:2px">Validez de Recetas Electrónicas</b>
              <span>Las recetas emitidas en tu portal cuentan con firma digital y código de barras normativo, válidas en farmacias de todo el país.</span>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span style="color:#1b4c37;margin-top:2px">${icon('shield', 15)}</span>
            <div>
              <b style="color:#15372f;display:block;font-size:12.5px;margin-bottom:2px">Confidencialidad Médica</b>
              <span>Tus estudios y evoluciones están resguardados bajo estricto secreto médico profesional y trazabilidad inmutable conforme a la Ley N° 26.529.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function portalTabTurnos(appointments, d) {
  const confirmed = appointments.filter(a => a.status === 'CONFIRMED' && new Date(a.startAt) >= new Date(Date.now() - 3600000));
  const past = appointments.filter(a => !confirmed.includes(a));

  return `
    <div class="between" style="margin-bottom:20px;flex-wrap:wrap">
      <div>
        <h2 style="font-size:20px;font-weight:700;color:#18362b;margin:0 0 4px 0">Mis Turnos Médicos</h2>
        <p style="font-size:13px;color:#64748b;margin:0">Gestiona tus consultas programadas y reserva nuevos turnos online.</p>
      </div>
      <button class="btn primary" data-action="portal-open-booking" style="background:#1b4c37">
        ${icon('plus', 14)} Sacar Nuevo Turno
      </button>
    </div>

    <section class="panel" style="margin-bottom:24px">
      <div class="panel-header">
        <h2>Próximos Turnos Confirmados</h2>
        <span class="badge green">${confirmed.length} activos</span>
      </div>
      <div class="panel-body">
        ${confirmed.map(a => `
          <div class="portal-card">
            <div class="portal-card-header">
              <div>
                <b style="font-size:16px;color:#18362b">${fmtDate(a.startAt)} · ${fmtTime(a.startAt)} hs</b>
                <div style="font-size:13px;color:#334155;margin-top:3px">
                  Profesional: <b>${esc(a.doctorName || 'Médico')}</b> (${esc(a.doctorSpecialty || 'General')})
                </div>
              </div>
              <span class="badge green">Confirmado</span>
            </div>
            <div class="between" style="flex-wrap:wrap">
              <span class="tiny muted">Motivo: ${esc(a.type || 'Consulta Médica')} ${a.notes ? '· ' + esc(a.notes) : ''}</span>
              <div class="flex" style="gap:8px">
                <button class="btn small danger" data-action="portal-cancel-appointment" data-id="${a.id}">
                  Cancelar Turno
                </button>
              </div>
            </div>
          </div>
        `).join('') || empty('Sin turnos próximos', 'No tienes turnos pendientes de atención.', btn('Sacar turno ahora', 'portal-open-booking', 'plus', 'small primary'))}
      </div>
    </section>

    ${past.length ? `
      <section class="panel">
        <div class="panel-header"><h2>Historial de Turnos Anteriores</h2></div>
        <div class="panel-body">
          ${past.map(a => `
            <div class="portal-card" style="opacity:0.85">
              <div class="portal-card-header">
                <div>
                  <b style="font-size:14px;color:#334155">${fmtDate(a.startAt)} · ${fmtTime(a.startAt)} hs</b>
                  <div style="font-size:12px;color:#64748b">${esc(a.doctorName || 'Médico')} · ${esc(a.type || 'Consulta')}</div>
                </div>
                ${badge(a.status)}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    ` : ''}
  `;
}

function portalTabRecetas(prescriptions) {
  return `
    <div style="margin-bottom:20px">
      <h2 style="font-size:20px;font-weight:700;color:#18362b;margin:0 0 4px 0">Recetas Médicas Electrónicas</h2>
      <p style="font-size:13px;color:#64748b;margin:0">Descarga tus recetas oficiales emitidas con firma digital profesional y QR de validez nacional.</p>
    </div>

    <section class="panel">
      <div class="panel-body">
        ${prescriptions.map(r => `
          <div class="portal-card">
            <div class="portal-card-header">
              <div class="flex" style="gap:10px">
                <div style="width:36px;height:36px;border-radius:8px;background:#f0fdf4;color:#166534;display:flex;align-items:center;justify-content:center">
                  ${icon('file', 18)}
                </div>
                <div>
                  <b style="font-size:14px;color:#18362b">Receta Médica Electrónica Oficial</b>
                  <div class="tiny muted">${fmtDate(r.createdAt, true)}</div>
                </div>
              </div>
              <span class="badge green">Válida para farmacias</span>
            </div>
            <p style="font-size:13px;color:#334155;white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;margin:10px 0;line-height:1.6">
              ${esc(r.content)}
            </p>
            <div class="between" style="margin-top:12px">
              <span class="tiny muted">Firma Criptográfica SHA-256 e Integridad Legal</span>
              <button class="btn small primary" data-action="portal-print-prescription" data-id="${r.id}" style="background:#1b4c37">
                ${icon('download', 13)} Descargar Receta Oficial (PDF)
              </button>
            </div>
          </div>
        `).join('') || empty('Sin recetas médicas', 'Aún no se han emitido recetas electrónicas en tu historia clínica.')}
      </div>
    </section>
  `;
}

function portalTabEstudios(records) {
  return `
    <div class="between" style="margin-bottom:20px;flex-wrap:wrap">
      <div>
        <h2 style="font-size:20px;font-weight:700;color:#18362b;margin:0 0 4px 0">Estudios Médicos y Análisis de Laboratorio</h2>
        <p style="font-size:13px;color:#64748b;margin:0">Sube tus análisis y accede a los informes médicos alojados en tu ficha digital.</p>
      </div>
      <button class="btn primary" data-action="portal-open-upload" style="background:#1b4c37">
        ${icon('upload', 14)} Subir Nuevo Estudio / Lab
      </button>
    </div>

    <section class="panel">
      <div class="panel-body">
        ${records.map(rec => `
          <div class="portal-card">
            <div class="portal-card-header">
              <div class="flex" style="gap:10px">
                <div style="width:36px;height:36px;border-radius:8px;background:#eff6ff;color:#1d4ed8;display:flex;align-items:center;justify-content:center">
                  ${icon('file', 18)}
                </div>
                <div>
                  <b style="font-size:14px;color:#18362b">${esc(rec.title || 'Estudio Clínico')}</b>
                  <div class="tiny muted">${fmtDate(rec.createdAt, true)} · Especialidad: ${esc(rec.specialty || 'General')}</div>
                </div>
              </div>
              <span class="badge blue">${esc(rec.type || 'STUDY')}</span>
            </div>
            ${rec.diagnosis ? `<div class="tiny" style="color:#18362b;font-weight:600;margin:6px 0 4px">Diagnóstico / Motivo: ${esc(rec.diagnosis)}</div>` : ''}
            ${rec.notes ? `<p style="font-size:12.5px;color:#475569;margin:8px 0;white-space:pre-line">${esc(rec.notes)}</p>` : ''}
            ${rec.prepNotes ? `<div style="font-size:12px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 10px;margin:6px 0"><b>Indicaciones de preparación:</b> ${esc(rec.prepNotes)}</div>` : ''}
            ${!rec.notes && (rec.subjective || rec.objective || rec.assessment || rec.plan) ? `
              <div style="font-size:12.5px;color:#475569;margin:8px 0;display:grid;gap:4px">
                ${rec.subjective ? `<div><b>Motivo / Subjetivo:</b> ${esc(rec.subjective)}</div>` : ''}
                ${rec.objective ? `<div><b>Examen / Objetivo:</b> ${esc(rec.objective)}</div>` : ''}
                ${rec.assessment ? `<div><b>Evaluación:</b> ${esc(rec.assessment)}</div>` : ''}
                ${rec.plan ? `<div><b>Plan / Indicaciones:</b> ${esc(rec.plan)}</div>` : ''}
              </div>
            ` : ''}
            ${rec.html ? `<div style="font-size:12.5px;color:#334155;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin:8px 0;overflow-x:auto">${rec.html}</div>` : ''}
            ${rec.attachments && rec.attachments.length ? `
              <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #e2e8f0">
                <span class="tiny muted" style="display:block;margin-bottom:6px">Archivos adjuntos (${rec.attachments.length}):</span>
                <div class="flex" style="gap:8px;flex-wrap:wrap">
                  ${rec.attachments.map(att => `
                    <button class="attachment-chip" type="button" data-action="view-attachment" data-url="${esc(att.url || att.data || att.dataUrl || '')}" data-name="${esc(att.name || 'Documento')}" data-type="${esc(att.type || '')}">
                      ${icon('download', 12)} Ver ${esc(att.name || 'Archivo')} ${att.size ? `(${Math.round(att.size / 1024)} KB)` : ''}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `).join('') || empty('Sin estudios cargados', 'No tienes estudios registrados. Sube tu primer archivo para compartirlo con el médico.', btn('Subir estudio', 'portal-open-upload', 'upload', 'small primary'))}
      </div>
    </section>
  `;
}

function portalTabFacturas(invoices) {
  return `
    <div style="margin-bottom:20px">
      <h2 style="font-size:20px;font-weight:700;color:#18362b;margin:0 0 4px 0">Comprobantes Fiscales Oficiales (ARCA / AFIP)</h2>
      <p style="font-size:13px;color:#64748b;margin:0">Descarga tus facturas electrónicas con CAE y código QR oficial para reintegros o deducciones.</p>
    </div>

    <section class="panel">
      <div class="panel-body">
        ${invoices.map(inv => `
          <div class="portal-card">
            <div class="portal-card-header">
              <div>
                <b style="font-size:15px;color:#18362b">Factura Oficial ${esc(inv.invoiceType || 'B')} N° ${esc(inv.invoiceNumber || inv.id)}</b>
                <div class="tiny muted">${fmtDate(inv.createdAt, true)} · CAE: ${esc(inv.cae || 'Autorizado')}</div>
              </div>
              <span class="badge green">CAE Oficial ARCA</span>
            </div>
            <div class="between" style="margin-top:12px;flex-wrap:wrap">
              <div>
                <span class="tiny muted">Importe Total:</span>
                <b style="font-size:16px;color:#166534;margin-left:6px">${fmtMoney((inv.amountCents || inv.totalCents || 0) / 100)}</b>
              </div>
              <button class="btn small primary" data-action="portal-print-invoice" data-id="${inv.id}" style="background:#1b4c37">
                ${icon('download', 13)} Ver Factura Oficial con QR
              </button>
            </div>
          </div>
        `).join('') || empty('Sin facturas emitidas', 'Aquí aparecerán los comprobantes fiscales una vez autorizados.')}
      </div>
    </section>
  `;
}

function portalTabConsentimientos(consents) {
  return `
    <div style="margin-bottom:20px">
      <h2 style="font-size:20px;font-weight:700;color:#18362b;margin:0 0 4px 0">Consentimientos Informados Digitales</h2>
      <p style="font-size:13px;color:#64748b;margin:0">Documentos legales bilaterales con firma digital conforme a la Ley N° 26.529.</p>
    </div>

    <section class="panel">
      <div class="panel-body">
        ${consents.map(c => `
          <div class="portal-card">
            <div class="portal-card-header">
              <div>
                <b style="font-size:14px;color:#18362b">${esc(c.title)}</b>
                <div class="tiny muted">Profesional: ${esc(c.doctorName)} · Tipo: ${esc(c.type)}</div>
              </div>
              <span class="badge green">Firmado Digitalmente</span>
            </div>
            <div class="tiny muted" style="margin-top:8px">Firmado el: ${fmtDate(c.signedAt || c.createdAt)}</div>
          </div>
        `).join('') || empty('Sin consentimientos', 'No tienes consentimientos pendientes de firma.')}
      </div>
    </section>
  `;
}

async function uploadFileToClinicalStorage(file, folder = 'uploads') {
  const safeName = `${Date.now()}-${String(file.name || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const wsId = S.portal?.patient?.workspaceId || S.session?.user?.workspaceId || 'clinic-central';
  const objectPath = `${wsId}/${folder}/${safeName}`;
  if (!PREVIEW && typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    try {
      const token = S.session?.token || localStorage.getItem('supabase_token') || SUPABASE_CONFIG.anonKey;
      const upRes = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/clinical-files/${objectPath}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: file
      });
      if (upRes.ok) {
        const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/clinical-files/${objectPath}`;
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrl,
          data: publicUrl,
          storagePath: objectPath,
          uploadedAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('[storage upload fallback]', e);
    }
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => resolve({
      name: file.name,
      type: file.type,
      size: file.size,
      data: ev.target.result,
      uploadedAt: new Date().toISOString()
    });
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

function portalBookingDialog() {
  const d = S.portal.data || {};
  const doctors = d.doctors || [];
  const agendas = d.agendas || [];
  const busySlots = d.busySlots || [];
  const allTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  showModal(
    'Sacar Nuevo Turno Online',
    'Elige el profesional, la especialidad y un horario disponible en tiempo real.',
    `<form data-form="portal-booking">
      <div class="form-grid">
        ${selectField('Profesional Médico *', 'doctorId', doctors.map(doc => [doc.id, `${doc.name} (${doc.specialty})`]), doctors[0]?.id, true)}
        ${selectField('Servicio / Agenda *', 'agendaId', (agendas.length ? agendas : [{ id: 'default', name: 'Consultorio General' }]).map(ag => [ag.id, ag.name]), agendas[0]?.id || 'default')}
        ${selectField('Tipo de Consulta *', 'type', [
          ['CONSULTATION', 'Consulta Médica'],
          ['FOLLOW_UP', 'Control / Seguimiento'],
          ['PROCEDURE', 'Procedimiento / Sesión'],
          ['TELEMEDICINE', 'Telemedicina / Videoconsulta']
        ], 'CONSULTATION')}
        ${field('Fecha del Turno *', 'date', 'date', plusDays(dateKey(), 1), `required min="${dateKey()}"`)}
        ${selectField('Horario Disponible *', 'time', allTimes.map(t => [t, `${t} hs`]), '10:00')}
        ${area('Motivo de consulta (opcional)', 'notes', '', 'maxlength="300" placeholder="Describe brevemente tus síntomas o motivo de atención..."')}
      </div>
      <div id="portal-slot-hint" class="tiny muted" style="margin-top:6px">Los horarios ocupados en la agenda del profesional se deshabilitan automáticamente.</div>
      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        ${btn('Cancelar', 'close-modal', '', '', 'type="button"')}
        <button class="btn primary" type="submit" style="background:#1b4c37">${icon('check', 15)} Confirmar Turno</button>
      </div>
    </form>`,
    '', 'wide'
  );

  setTimeout(() => {
    const docSel = $('#field-doctorId');
    const dateEl = $('#field-date');
    const timeSel = $('#field-time');
    const hintEl = $('#portal-slot-hint');
    const refreshSlots = () => {
      if (!docSel || !dateEl || !timeSel) return;
      const docId = docSel.value;
      const day = dateEl.value;
      const docBusy = busySlots.filter(b => b.doctorId === docId && b.startAt && dateKey(b.startAt) === day);
      let firstFree = '';
      let occupiedCount = 0;
      Array.from(timeSel.options).forEach(opt => {
        const slotStart = Date.parse(`${day}T${opt.value}:00-03:00`);
        const slotEnd = slotStart + 30 * 60000;
        const isBusy = docBusy.some(b => {
          const bs = Date.parse(b.startAt);
          const be = bs + (Number(b.duration) || 30) * 60000;
          return slotStart < be && slotEnd > bs;
        });
        opt.disabled = isBusy;
        opt.textContent = isBusy ? `${opt.value} hs (Ocupado)` : `${opt.value} hs (Disponible)`;
        if (isBusy) occupiedCount++;
        else if (!firstFree) firstFree = opt.value;
      });
      if (timeSel.selectedOptions[0]?.disabled && firstFree) timeSel.value = firstFree;
      if (hintEl) {
        hintEl.textContent = occupiedCount
          ? `${occupiedCount} horario(s) ya reservado(s) para esta fecha; solo puedes elegir horarios disponibles.`
          : 'Todos los horarios mostrados están disponibles para este profesional.';
      }
    };
    docSel?.addEventListener('change', refreshSlots);
    dateEl?.addEventListener('change', refreshSlots);
    refreshSlots();
  }, 40);
}

function portalUploadDialog() {
  showModal(
    'Subir Estudio, Laboratorio o Archivo Médico',
    'El archivo se sube de forma segura al almacenamiento clínico (Supabase Storage) y se clasifica automáticamente para tu médico.',
    `<form data-form="portal-upload-study">
      <div class="form-grid">
        ${field('Título / Nombre del Estudio *', 'title', 'text', '', 'required placeholder="Ej: Laboratorio Completo, Ecografía Abdominal..."', true)}
        ${selectField('Tipo de Documento *', 'studyType', [
          ['LAB', 'Laboratorio / Análisis Bioquímico (va a Laboratorio)'],
          ['STUDY', 'Estudio de Imágenes (Ecografía, Rayos, Resonancia)'],
          ['PRESCRIPTION_EXT', 'Receta Médica Externa (va a Documentos / HCD)'],
          ['PAYMENT_RECEIPT', 'Comprobante / Factura de Pago Realizado (va a Cobros)'],
          ['DOCUMENT', 'Informe Médico Externo / Certificado']
        ], 'LAB')}
        ${field('Especialidad (o Importe en ARS si es Comprobante)', 'specialty', 'text', 'Bioquímica / Imágenes', 'placeholder="Ej: Bioquímica, Cardiología"')}
        <div class="form-field full" id="portal-amount-wrap" style="display:none">
          <label for="portal-amount">Importe Abonado (ARS) *</label>
          <input type="number" id="portal-amount" name="amount" min="1" step="0.01" placeholder="Ej: 150000">
        </div>
        <div class="form-field full">
          <label>Seleccionar Archivo (PDF, JPG, PNG) *</label>
          <input type="file" id="portal-file-picker" required accept=".pdf,.png,.jpg,.jpeg">
          <div id="portal-file-info" class="tiny muted" style="margin-top:4px">Puedes adjuntar el informe o foto del análisis.</div>
          <input type="hidden" name="attachmentPayload" id="portal-attachment-payload">
        </div>
        <div class="form-field full">
          <label for="portal-notes">Observaciones para el médico</label>
          <textarea id="portal-notes" name="notes" class="input" style="height:70px" placeholder="Comentarios adicionales sobre el estudio..."></textarea>
        </div>
      </div>
      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        ${btn('Cancelar', 'close-modal', '', '', 'type="button"')}
        <button class="btn primary" type="submit" style="background:#1b4c37">${icon('upload', 15)} Subir y Guardar</button>
      </div>
    </form>`,
    '', 'wide'
  );

  setTimeout(() => {
    $('#field-studyType')?.addEventListener('change', e => {
      const wrap = $('#portal-amount-wrap');
      if (wrap) wrap.style.display = e.target.value === 'PAYMENT_RECEIPT' ? 'block' : 'none';
    });
    $('#portal-file-picker')?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if ($('#portal-file-info')) $('#portal-file-info').innerHTML = `Subiendo archivo seguro a la nube...`;
      try {
        const meta = await uploadFileToClinicalStorage(file, 'portal');
        if ($('#portal-attachment-payload')) $('#portal-attachment-payload').value = JSON.stringify([meta]);
        if ($('#portal-file-info')) $('#portal-file-info').innerHTML = `✓ Archivo listo (${meta.url ? 'Storage Nube' : 'Adjunto'}): <b>${esc(file.name)}</b> (${Math.round(file.size / 1024)} KB)`;
      } catch (err) {
        if ($('#portal-file-info')) $('#portal-file-info').innerHTML = `Error al subir archivo: ${esc(err.message)}`;
      }
    });
  }, 50);
}

function render() {
  if (S.view === 'portal' || location.pathname.startsWith('/portal')) {
    return portalPage();
  }
  if (!S.session) return loginPage();
  shell();
}

function contentOnly() {
  const e = $('#main-content');
  if (e) e.innerHTML = content();
}

function isAppointmentPast(a) {
  const startMs = Date.parse(a?.startAt || '');
  if (!Number.isFinite(startMs)) return false;
  const endMs = a?.endAt ? Date.parse(a.endAt) : (startMs + (Number(a?.duration) || 30) * 60000);
  return Date.now() > (Number.isFinite(endMs) ? endMs : startMs);
}

function appointmentRow(a, i = 0) {
  const p = patientBy(a.patientId), n = nameOf(p);
  const past = isAppointmentPast(a);
  const stillOpen = past && ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status);
  return `<div class="appointment-row" data-action="appointment-detail" data-id="${a.id}" tabindex="0" role="button" aria-label="Ver turno de ${esc(n)}" style="${stillOpen ? 'opacity:0.65;background:#f8fafc' : ''}">
    <div class="time">${fmtTime(a.startAt)}<small>${a.duration} min</small></div>
    <div class="flex" style="gap:9px">${avatar(n, i)}<div class="grow"><div class="patient-name">${esc(n)}</div><div class="patient-sub">${esc(types[a.type])} · ${esc(doctorBy(a.doctorId)?.name || '')}</div></div></div>
    <div class="flex" style="gap:6px;align-items:center">
      ${stillOpen ? '<span class="badge" style="background:#e2e8f0;color:#475569;font-size:10px">Ya pasó</span>' : ''}
      ${badge(a.status)}
    </div>
    ${icon('chevron', 12)}
  </div>`;
}

function homeView() {
  const m = derived(), shown = S.homeFilter === 'pending' ? m.a.filter(a => a.status === 'PENDING') : m.a;
  const upcomingShown = shown.filter(a => !isAppointmentPast(a) || a.status === 'COMPLETED');
  const pastOpenShown = shown.filter(a => isAppointmentPast(a) && a.status !== 'COMPLETED');
  const dStr = fmtDate(S.data.date);
  const dateFormatted = dStr.charAt(0).toUpperCase() + dStr.slice(1);
  return heading(dateFormatted, '',
    btn('Ver agenda completa', 'nav-schedule', 'calendar') + btn('Nuevo turno', 'new-appointment', 'plus', 'primary'),
    'ABUNDANCE · CLINIC OS'
  ) +
  `<div class="stats">
    ${stat('Turnos de hoy', `${m.a.length} <span class="stat-unit">turnos</span>`, 'calendar', `${icon('clock', 11)} ${m.complete} atendidos · ${m.pending} pendientes`)}
    ${stat('Pacientes activos', S.data.patients.filter(p => p.status === 'ACTIVE').length, 'users', `${icon('users', 11)} ${S.data.patients.length} en el directorio`)}
    ${stat('Confirmación de hoy', `${m.a.length ? Math.round((m.confirmed + m.complete) / m.a.length * 100) : 0}<span class="stat-unit">%</span>`, 'checkcircle', `${icon('check', 11)} ${m.confirmed + m.complete} confirmados o atendidos`)}
    ${stat('Cobros de la jornada', fmtMoney(m.paid), 'wallet', `${icon('wallet', 11)} Registros contables del día`, true)}
  </div>

  <div class="home-grid">
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Agenda de hoy</h2>
          <p class="panel-sub">Turnos y consultas asignadas para la fecha.</p>
        </div>
        <div class="segmented">
          <button class="${S.homeFilter === 'all' ? 'active' : ''}" data-action="home-filter" data-value="all">Todos (${m.a.length})</button>
          <button class="${S.homeFilter === 'pending' ? 'active' : ''}" data-action="home-filter" data-value="pending">Pendientes (${m.pending})</button>
        </div>
      </div>

      <!-- Barra colapsable / desplegable de la agenda -->
      <button class="agenda-toggle-btn ${S.agendaCollapsed ? 'collapsed' : ''}" data-action="toggle-agenda">
        <span>${icon('calendar', 14)} ${fmtDate(S.data.date)} · ${shown.length} turnos</span>
        <span class="flex" style="gap:5px">${S.agendaCollapsed ? 'Desplegar turnos ' + icon('down', 13) : 'Ocultar turnos ' + icon('down', 13)}</span>
      </button>

      <div class="agenda-items-wrap ${S.agendaCollapsed ? 'collapsed' : ''}">
        ${upcomingShown.map(appointmentRow).join('') || (pastOpenShown.length ? '<div class="tiny muted" style="padding:14px 16px">No quedan turnos próximos por atender en el resto del día.</div>' : empty('Agenda despejada', 'No hay turnos registrados para este filtro.'))}
        ${pastOpenShown.length ? `
          <details style="border-top:1px dashed var(--border);padding:8px 14px;background:#fafcfb">
            <summary class="tiny muted" style="cursor:pointer;font-weight:600;user-select:none">Turnos anteriores de hoy que ya pasaron (${pastOpenShown.length}) · Clic para ver o cerrar estado</summary>
            <div style="margin-top:8px">${pastOpenShown.map(appointmentRow).join('')}</div>
          </details>
        ` : ''}
      </div>

      <div class="mini-progress">
        <span>Ocupación de consultorios</span>
        <div class="progress"><div style="width:${m.occupancy}%"></div></div>
        <b>${m.occupancy}%</b>
      </div>
      <div class="panel-footer">
        <span>Horario de atención: 09:00 – 18:00 · ART</span>
        <button class="text-link" data-nav="schedule">Ver agenda completa ${icon('arrow', 12)}</button>
      </div>
    </section>

    <div class="stack home-right">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Necesita tu atención</h2>
            <p class="panel-sub" style="display:flex;align-items:center;gap:5px;margin-top:2px">
              <span style="width:7px;height:7px;border-radius:50%;background:#16a34a;display:inline-block;box-shadow:0 0 0 3px rgba(22,163,74,0.18)"></span>
              Monitoreo continuo IA de agenda, WhatsApp e inventario
            </p>
          </div>
          <span class="badge ${m.pending || S.data.leads.filter(l => l.status === 'NEW').length ? 'amber' : 'green'}">${(m.pending + S.data.leads.filter(l => l.status === 'NEW').length) ? (m.pending + S.data.leads.filter(l => l.status === 'NEW').length) + ' alertas' : 'Al día'}</span>
        </div>
        <div class="panel-body">
          ${(() => {
            const wspLeads = (S.data.leads || []).filter(l => l.status === 'NEW' || /whatsapp|wsp/i.test(l.source || ''));
            const pendingWsp = wspLeads.filter(l => l.status === 'NEW');
            const displayWsp = pendingWsp.length ? pendingWsp : wspLeads.slice(0, 2);
            const firstLead = displayWsp[0];
            const cleanWaPhone = firstLead?.phone ? String(firstLead.phone).replace(/\D/g, '') : '';
            return `
            <div class="attention-row" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:11px 12px;margin-bottom:8px">
              <div class="attention-symbol" style="background:#16a34a;color:#fff">${icon('whatsapp', 15)}</div>
              <div class="grow">
                <div class="between" style="gap:6px">
                  <h4 style="color:#14532d">${pendingWsp.length || wspLeads.length} consulta(s) en WhatsApp requieren respuesta directa</h4>
                  <span class="badge green" style="font-size:10px">Prioridad Directa</span>
                </div>
                <p style="color:#166534;margin-top:2px">
                  ${firstLead ? `Último ingreso: <b>${esc(firstLead.name)}</b> (${esc(firstLead.interest || 'Consulta general')}) · ${esc(firstLead.phone || '')}` : 'Mensajes entrantes detectados por el monitor de canal WhatsApp pendientes de atención.'}
                </p>
                <div class="flex" style="gap:10px;margin-top:6px;flex-wrap:wrap">
                  ${cleanWaPhone ? `<a href="https://wa.me/${esc(cleanWaPhone)}?text=${encodeURIComponent(`Hola ${firstLead.name}, te escribimos de la clínica respecto a tu consulta sobre ${firstLead.interest || 'turnos y tratamientos'}.`)}" target="_blank" rel="noopener" class="text-link" style="color:#15803d;font-weight:700">${icon('whatsapp', 11)} Responder ahora en WhatsApp</a>` : ''}
                  <button class="text-link" data-nav="pipeline">Abrir bandeja de consultas ${icon('arrow', 11)}</button>
                </div>
              </div>
            </div>`;
          })()}
          <div class="attention-row">
            <div class="attention-symbol">${icon('clock', 15)}</div>
            <div class="grow">
              <h4>${m.pending} turnos por confirmar</h4>
              <p>Revisa la agenda médica y confirma la asistencia de los pacientes.</p>
              <button class="text-link" data-action="pending-agenda">Revisar turnos pendientes ${icon('arrow', 11)}</button>
            </div>
          </div>
          <div class="attention-row">
            <div class="attention-symbol" style="background:#eaf4eb;color:#357a4e">${icon('pipeline', 15)}</div>
            <div class="grow">
              <h4>${S.data.leads.filter(l => l.status === 'NEW').length} consultas o contactos nuevos en seguimiento</h4>
              <p>Seguimiento de primeras consultas y oportunidades médicas.</p>
              <button class="text-link" data-nav="pipeline">Gestionar seguimiento ${icon('arrow', 11)}</button>
            </div>
          </div>
          ${(() => {
            const portalDocs = (S.data.records || []).filter(r => r.uploadedVia === 'PORTAL_PACIENTES' || r.content?.uploadedVia === 'PORTAL_PACIENTES' || /Paciente \(Portal\)/i.test(r.author || ''));
            return `
            <div class="attention-row">
              <div class="attention-symbol" style="background:#e8f0fe;color:#3c67be">${icon('file', 15)}</div>
              <div class="grow">
                <h4>${portalDocs.length ? `${portalDocs.length} estudio(s) subidos por pacientes al Portal` : 'Historias clínicas y evolución al día'}</h4>
                <p>${portalDocs.length ? 'Documentos sincronizados automáticamente en la ficha del paciente para comparativa clínica.' : 'Evoluciones SOAP, estudios de portal y prescripciones con integridad criptográfica.'}</p>
                <button class="text-link" data-nav="records">Ir a historias clínicas ${icon('arrow', 11)}</button>
              </div>
            </div>`;
          })()}
        </div>
      </section>
    </div>
  </div>`;
}

function patientsView() {
  const search = S.patientSearch.toLowerCase();
  const p = S.data.patients.filter(p => (!S.patientStatus || p.status === S.patientStatus) && [nameOf(p), p.dni, p.phone, p.email].some(x => x.toLowerCase().includes(search)));
  return heading('Directorio de Pacientes', 'Fichas integrales de pacientes, historial de atenciones y datos de cobertura.',
    btn('Importar Pacientes (CSV / Excel)', 'open-patient-importer', 'upload') + btn('Exportar CSV', 'export-patients', 'download') + btn('Nuevo paciente', 'new-patient', 'plus', 'primary')
  ) +
  `<section class="panel">
    <div class="toolbar">
      <div class="search-field grow">
        ${icon('search', 15)}
        <input id="patient-search" data-input="patient-search" placeholder="Buscar por nombre, documento o teléfono…" aria-label="Buscar pacientes" value="${esc(S.patientSearch)}">
      </div>
      <select aria-label="Filtrar por estado" data-change="patient-status">
        <option value="">Todos los estados</option>
        ${['ACTIVE', 'INACTIVE', 'DISCHARGED'].map(s => `<option value="${s}" ${S.patientStatus === s ? 'selected' : ''}>${statusMap[s][0]}</option>`).join('')}
      </select>
      <span class="text-sm muted">${p.length} pacientes</span>
    </div>
    ${p.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Paciente</th><th>Contacto</th><th>Documento / CUIL</th><th>Obra Social / N° Afiliado</th><th>Edad</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${p.map((p, i) => `<tr class="clickable" data-action="patient-detail" data-id="${p.id}">
          <td><div class="initials-cell">${avatar(nameOf(p), i)}<div><strong>${esc(nameOf(p))}</strong></div></div></td>
          <td>${esc(p.phone)}<div class="tiny muted">${esc(p.email || 'Sin correo')}</div></td>
          <td>${esc(p.dni || '—')}${p.cuitCuil ? `<div class="tiny muted">CUIL: ${esc(p.cuitCuil)}</div>` : ''}</td>
          <td>${esc(p.coverage || 'Particular')}${p.affiliateNumber ? `<div class="tiny muted">N°: ${esc(p.affiliateNumber)}</div>` : ''}</td>
          <td>${p.birthDate ? `${calcAge(p.birthDate)} años` : '—'}</td>
          <td>${badge(p.status)}</td>
          <td><button class="icon-btn" data-action="patient-detail" data-id="${p.id}" aria-label="Abrir ficha de ${esc(nameOf(p))}">${icon('chevron', 15)}</button></td>
        </tr>`).join('')}
      </tbody>
    </table></div>` : empty('No se encontraron pacientes', 'Prueba otra búsqueda o registra un nuevo paciente en la plataforma.', btn('Nuevo paciente', 'new-patient', 'plus', 'primary'))}
    <div class="panel-footer">
      <span>Pacientes asignados a esta clínica</span>
      <span>${p.length} de ${S.data.patients.length} pacientes</span>
    </div>
  </section>`;
}

function scheduleView() {
  const agendas = S.data?.agendas?.length ? S.data.agendas : [
    { id: 'ag-med', name: 'Consultorios Médicos', type: 'MEDICAL', color: '#1b4c37' },
    { id: 'ag-adm', name: 'Agenda Administrativa', type: 'ADMINISTRATIVE', color: '#2563eb' },
    { id: 'ag-surg', name: 'Quirófano / Procedimientos', type: 'SURGERY', color: '#dc2626' }
  ];
  const currentAgenda = S.selectedAgenda || 'ALL';

  const agendaStrip = `
  <div class="agenda-strip">
    <button class="agenda-pill ${currentAgenda === 'ALL' ? 'active' : ''}" data-action="select-agenda" data-id="ALL">
      <span class="dot" style="background:#557060"></span>
      <span>Todas las Agendas</span>
    </button>
    ${agendas.map(ag => `
      <button class="agenda-pill ${currentAgenda === ag.id ? 'active' : ''}" data-action="select-agenda" data-id="${ag.id}">
        <span class="dot" style="background:${ag.color || '#1b4c37'}"></span>
        <span>${esc(ag.name)}</span>
      </button>
    `).join('')}
    <button class="btn small" data-action="new-agenda" style="margin-left:auto">${icon('plus', 13)} Nueva Agenda</button>
  </div>`;

  const allDayAppointments = (S.data.appointments || []).filter(a => {
    const isToday = dateKey(a.startAt) === S.date && a.status !== 'CANCELLED';
    if (!isToday) return false;
    if (currentAgenda !== 'ALL') {
      const matchAgenda = a.agendaId === currentAgenda || (!a.agendaId && agendas[0]?.id === currentAgenda);
      if (!matchAgenda) return false;
    }
    return true;
  });

  const chosen = allDayAppointments.filter(a => {
    const matchesDoctor = !S.doctor || a.doctorId === S.doctor;
    const matchesCategory = !S.scheduleCategory || S.scheduleCategory === 'ALL' || a.type === S.scheduleCategory;
    return matchesDoctor && matchesCategory;
  }).sort((a, b) => a.startAt.localeCompare(b.startAt));

  const totalCount = allDayAppointments.length;
  const consultationCount = allDayAppointments.filter(a => a.type === 'CONSULTATION').length;
  const surgeryCount = allDayAppointments.filter(a => a.type === 'SURGERY').length;
  const procedureCount = allDayAppointments.filter(a => a.type === 'PROCEDURE').length;
  const followUpCount = allDayAppointments.filter(a => a.type === 'FOLLOW_UP').length;

  const categoryFilters = `
  <div class="category-filter-strip">
    <button class="category-pill ${(!S.scheduleCategory || S.scheduleCategory === 'ALL') ? 'active' : ''}" data-action="schedule-category" data-value="ALL" title="Ver todos los turnos sin filtrar por tipo">
      <span>Todos los turnos</span> <span class="pill-count">${totalCount}</span>
    </button>
    <button class="category-pill green ${S.scheduleCategory === 'CONSULTATION' ? 'active' : ''}" data-action="schedule-category" data-value="CONSULTATION" title="Ver solo consultas y primeras veces">
      ${icon('file', 13)} <span>Consultas</span> <span class="pill-count">${consultationCount}</span>
    </button>
    <button class="category-pill red ${S.scheduleCategory === 'SURGERY' ? 'active' : ''}" data-action="schedule-category" data-value="SURGERY" title="Ver solo cirugías y quirófano">
      ${icon('warning', 13)} <span>Cirugías / Quirófano</span> <span class="pill-count">${surgeryCount}</span>
    </button>
    <button class="category-pill blue ${S.scheduleCategory === 'PROCEDURE' ? 'active' : ''}" data-action="schedule-category" data-value="PROCEDURE" title="Ver solo tratamientos y procedimientos">
      ${icon('spark', 13)} <span>Tratamientos</span> <span class="pill-count">${procedureCount}</span>
    </button>
    <button class="category-pill amber ${S.scheduleCategory === 'FOLLOW_UP' ? 'active' : ''}" data-action="schedule-category" data-value="FOLLOW_UP" title="Ver solo controles y seguimiento">
      ${icon('clock', 13)} <span>Controles</span> <span class="pill-count">${followUpCount}</span>
    </button>
  </div>`;

  let mainScheduleHtml = '';

  if (S.scheduleMode === 'by-treatment') {
    // VISTA DESGLOSADA POR FIN DEL PACIENTE / TRATAMIENTO
    const renderTreatmentSection = (typeKey, title, badgeColor, headerClass, emptyText, iconName) => {
      if (S.scheduleCategory && S.scheduleCategory !== 'ALL' && S.scheduleCategory !== typeKey) return '';
      const items = (S.doctor ? chosen : allDayAppointments).filter(a => a.type === typeKey);
      return `
      <div class="treatment-section">
        <div class="treatment-header ${headerClass}">
          <h3>${icon(iconName, 16)} <span>${title}</span></h3>
          <span class="badge ${badgeColor}">${items.length} ${items.length === 1 ? 'paciente' : 'pacientes'}</span>
        </div>
        ${items.length ? `
          <div class="treatment-cards">
            ${items.map(a => {
              const p = patientBy(a.patientId);
              const doc = doctorBy(a.doctorId);
              return `
              <div class="treatment-card">
                <div class="treatment-card-top">
                  <span class="treatment-card-time">${icon('clock', 13)} ${fmtTime(a.startAt)} hs <small style="font-weight:400;color:#7a8c7e">(${a.duration} min)</small></span>
                  ${badge(a.status)}
                </div>
                <div style="cursor:pointer" data-action="appointment-detail" data-id="${a.id}">
                  <div class="treatment-card-patient">${esc(nameOf(p))}</div>
                  <div class="tiny muted">DNI: ${esc(p?.dni || '—')} · Cobertura: ${esc(p?.coverage || 'Particular')}</div>
                </div>
                <div class="treatment-card-doctor">
                  ${avatar(doc?.name || 'Médico')}
                  <div>
                    <strong style="font-size:11px;color:#18362b">${esc(doc?.name || 'Sin profesional asignado')}</strong>
                    <div class="tiny muted">${esc(doc?.specialty || 'Especialista')}</div>
                  </div>
                </div>
                ${a.notes ? `<div class="treatment-card-notes"><strong>Fin / Detalle:</strong> ${esc(a.notes)}</div>` : ''}
                <div class="treatment-card-actions">
                  <button class="btn small ghost" data-action="appointment-detail" data-id="${a.id}" title="Ver detalle del turno">${icon('eye', 13)} Detalle</button>
                  <button class="btn small" data-action="reschedule" data-id="${a.id}" title="Reprogramar horario">${icon('calendar', 13)} Reprogramar</button>
                  <button class="icon-btn" data-action="send-wa-reminder" data-id="${a.id}" title="Enviar recordatorio WhatsApp">${icon('phone', 13)}</button>
                </div>
              </div>`;
            }).join('')}
          </div>
        ` : `<div class="empty-treatment-category">${icon('checkcircle', 15)} <span>${emptyText}</span></div>`}
      </div>`;
    };

    mainScheduleHtml = `
      <div style="padding:16px 20px 8px">
        ${renderTreatmentSection('SURGERY', 'Intervenciones Quirúrgicas & Cirugías', 'red', 'surgery', 'Sin cirugías programadas para esta fecha.', 'warning')}
        ${renderTreatmentSection('PROCEDURE', 'Tratamientos & Procedimientos Ambulatorios', 'blue', 'procedure', 'Sin tratamientos ni procedimientos para esta fecha.', 'spark')}
        ${renderTreatmentSection('CONSULTATION', 'Consultas Médicas & Evaluaciones de Primera Vez', 'green', 'consultation', 'Sin consultas médicas para esta fecha.', 'file')}
        ${renderTreatmentSection('FOLLOW_UP', 'Controles y Seguimiento Post-Tratamiento', 'amber', 'follow_up', 'Sin controles médicos para esta fecha.', 'clock')}
      </div>`;
  } else {
    // VISTA CRONOLÓGICA (DÍA / SEMANA)
    if (S.calendar === 'day') {
      const keys = new Set(Array.from({ length: 18 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`));
      for (const a of chosen) keys.add(fmtTime(a.startAt));
      mainScheduleHtml = [...keys].sort().map(t => {
        const slotIso = localAt(S.date, t);
        const slotPast = Date.parse(slotIso) < Date.now();
        const active = chosen.filter(a => fmtTime(a.startAt) === t && a.status !== 'CANCELLED');
        const busy = chosen.filter(a => a.status !== 'CANCELLED' && a.startAt <= slotIso && a.endAt > slotIso);
        const canBook = !slotPast && busy.length < (S.doctor ? 1 : S.data.doctors.length);
        return `<div class="slot" style="${slotPast ? 'opacity:0.65' : ''}">
          <span class="slot-time">${t}</span>
          <div class="slot-content">
            ${active.map(a => {
              const doc = doctorBy(a.doctorId);
              const p = patientBy(a.patientId);
              return `<button class="slot-booking" data-action="appointment-detail" data-id="${a.id}">
                ${avatar(nameOf(p))}
                <span class="grow" style="text-align:left">
                  <span class="patient-name">${esc(nameOf(p))}</span>
                  <span class="patient-sub" style="display:block">
                    <b>${badge(a.type)}</b> · ${esc(doc?.name || 'Profesional')}
                  </span>
                </span>
                ${badge(a.status)}
              </button>`;
            }).join('')}
            ${canBook ? `<button class="free-slot" data-action="new-appointment" data-time="${t}">${icon('plus', 12)} ${active.length || busy.length ? 'Otro profesional disponible' : 'Espacio disponible'}</button>` : ''}
          </div>
        </div>`;
      }).join('');
    } else {
      const weekday = new Date(`${S.date}T12:00:00-03:00`).getUTCDay();
      const monday = plusDays(S.date, weekday === 0 ? -6 : 1 - weekday);
      mainScheduleHtml = `<div class="week-grid">${Array.from({ length: 5 }, (_, i) => {
        const d = plusDays(monday, i),
          rows = (S.data.appointments || []).filter(a => {
            const matchesDay = dateKey(a.startAt) === d && a.status !== 'CANCELLED';
            const matchesDoctor = !S.doctor || a.doctorId === S.doctor;
            const matchesCategory = !S.scheduleCategory || S.scheduleCategory === 'ALL' || a.type === S.scheduleCategory;
            return matchesDay && matchesDoctor && matchesCategory;
          }).sort((a, b) => a.startAt.localeCompare(b.startAt));
        return `<div class="week-day">
          <div class="week-heading">${esc(fmtDate(d, true))}</div>
          ${rows.map(a => `<button class="week-event" data-action="appointment-detail" data-id="${a.id}">
            <b>${fmtTime(a.startAt)}</b> · ${esc(nameOf(patientBy(a.patientId)))}
            <div class="tiny muted">${badge(a.type)}</div>
          </button>`).join('')}
          <button class="free-slot" style="width:100%" data-action="new-appointment" data-date="${d}">${icon('plus', 12)} Agendar</button>
        </div>`;
      }).join('')}</div>`;
    }
  }

  return heading('Agenda Médica & Administrativa', 'Gestión de turnos clínicos, quirófanos y agendas administrativas en paralelo.',
    btn('Nueva Agenda', 'new-agenda', 'plus') + btn('Nuevo turno', 'new-appointment', 'plus', 'primary')
  ) +
  `<div class="schedule-layout">
    <section class="panel">
      ${agendaStrip}
      <div class="toolbar between">
        <div class="date-controls">
          <button class="icon-btn" data-action="prev-date" aria-label="Día anterior">${icon('left', 15)}</button>
          <input type="date" aria-label="Fecha de la agenda" value="${S.date}" data-change="date">
          <button class="icon-btn" data-action="next-date" aria-label="Día siguiente">${icon('chevron', 15)}</button>
          ${btn('Hoy', 'today', '', 'small')}
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <div class="segmented">
            <button data-action="schedule-mode" data-value="timeline" class="${S.scheduleMode !== 'by-treatment' ? 'active' : ''}">Línea Horaria</button>
            <button data-action="schedule-mode" data-value="by-treatment" class="${S.scheduleMode === 'by-treatment' ? 'active' : ''}">Desglose por Tratamiento</button>
          </div>
          ${S.scheduleMode !== 'by-treatment' ? `
            <div class="segmented">
              <button data-action="calendar-mode" data-value="day" class="${S.calendar === 'day' ? 'active' : ''}">Día</button>
              <button data-action="calendar-mode" data-value="week" class="${S.calendar === 'week' ? 'active' : ''}">Semana</button>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="toolbar between">
        <div style="display:flex;align-items:center;gap:10px">
          <select data-change="doctor" aria-label="Filtrar por profesional">
            <option value="">Todos los profesionales</option>
            ${(S.data.doctors || []).map(d => `<option value="${d.id}" ${S.doctor === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
          </select>
          <span class="muted tiny">${chosen.length} turnos visualizados</span>
        </div>
      </div>
      <div style="padding:0 20px">
        ${categoryFilters}
      </div>
      ${mainScheduleHtml}
      <div class="panel-footer">
        <span>Validación automática de superposiciones y disponibilidad</span>
        <span>${allDayAppointments.filter(a => a.status === 'CANCELLED').length} cancelados</span>
      </div>
    </section>

    <aside class="stack schedule-aside">
      <section class="panel">
        <div class="panel-header between">
          <h2>Equipo Profesional</h2>
          <button class="btn small ghost" data-action="nav-staff" title="Gestionar personal y accesos">${icon('users', 13)} Personal</button>
        </div>
        <div class="panel-body">
          ${S.doctor ? `
            <div class="doctor-filter-banner">
              <span>Filtrando por <b>${esc(doctorBy(S.doctor)?.name)}</b></span>
              <button class="btn small ghost" data-action="clear-doctor-filter" style="padding:2px 6px;height:auto">${icon('close', 12)} Ver todos</button>
            </div>
          ` : ''}
          ${(S.data.doctors || []).length ? (S.data.doctors || []).map((d, i) => {
            const docAppts = allDayAppointments.filter(a => a.doctorId === d.id);
            const surgeries = docAppts.filter(a => a.type === 'SURGERY').length;
            const consultations = docAppts.filter(a => a.type === 'CONSULTATION').length;
            const procedures = docAppts.filter(a => a.type === 'PROCEDURE').length;
            const nextAppt = docAppts.find(a => a.status === 'CONFIRMED' || a.status === 'PENDING');
            const isSelected = S.doctor === d.id;
            return `
            <div class="doctor-card-interactive ${isSelected ? 'selected' : ''}" data-action="select-doctor-filter" data-id="${d.id}" title="Hacer clic para filtrar la agenda por este profesional">
              ${avatar(d.name, i)}
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <h4 style="margin:0;font-size:12px;color:#18362b">${esc(d.name)}</h4>
                  ${isSelected ? `<span style="color:#2a6845">${icon('check', 14)}</span>` : ''}
                </div>
                <p style="margin:2px 0 0;font-size:10px;color:#7a8c7e">${esc(d.specialty)}</p>
                <div class="doctor-card-badge">
                  ${docAppts.length ? `${docAppts.length} ${docAppts.length === 1 ? 'turno' : 'turnos'} hoy${surgeries ? ` (${surgeries} quiróf.)` : ''}` : 'Sin turnos hoy'}
                </div>
                ${nextAppt ? `<div class="tiny muted" style="margin-top:3px">${icon('clock', 11)} Próx: ${fmtTime(nextAppt.startAt)} hs · ${esc(nameOf(patientBy(nextAppt.patientId)))}</div>` : ''}
              </div>
            </div>`;
          }).join('') : `
            <div class="empty" style="padding:20px 10px">
              <p style="font-size:11px">Aún no hay profesionales médicos dados de alta.</p>
              <button class="btn small primary" data-action="new-staff" style="margin-top:8px">${icon('plus', 12)} Agregar Médico</button>
            </div>
          `}
        </div>
      </section>
      <div class="info-box">${icon('shield', 18)}<div><strong>Disponibilidad coordinada</strong><br>Haz clic en cualquier profesional para filtrar la agenda y ver sus turnos asignados en tiempo real.</div></div>
    </aside>
  </div>`;
}



function staffView() {
  const staff = S.data.staff || [];
  const search = (S.staffSearch || '').toLowerCase();
  const roleFilter = S.staffRole || '';
  const currentTab = S.staffTab || 'members';
  const pendingOrders = (S.data.medicalOrders || []).filter(o => o.status === 'PENDING').length;

  const filtered = staff.filter(m => {
    const matchesSearch = !search || [m.name, m.email, m.specialty, m.licenseNumber].some(x => (x || '').toLowerCase().includes(search));
    const matchesRole = !roleFilter || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalMembers = staff.length;
  const doctorsCount = staff.filter(s => s.role === 'DOCTOR').length;
  const receptionCount = staff.filter(s => s.role === 'RECEPTIONIST').length;
  const adminCount = staff.filter(s => s.role === 'CLINIC_ADMIN').length;
  const nurseCount = staff.filter(s => s.role === 'NURSE').length;

  return heading('Equipo y Controles de Acceso', 'Gestión de personal de secretaría, equipo médico, enfermería y permisos de acceso al sistema.',
    btn('Nuevo Miembro', 'new-staff', 'plus', 'primary')
  ) +
  `<div class="staff-stats">
    <div class="stat-card">
      <div class="stat-top"><span>Total Equipo</span><div class="stat-icon">${icon('users', 16)}</div></div>
      <div class="stat-number">${totalMembers}</div>
      <div class="stat-bottom muted">Personal registrado</div>
    </div>
    <div class="stat-card">
      <div class="stat-top"><span>Médicos y Cirujanos</span><div class="stat-icon">${icon('warning', 16)}</div></div>
      <div class="stat-number">${doctorsCount}</div>
      <div class="stat-bottom muted">Profesionales asistenciales</div>
    </div>
    <div class="stat-card">
      <div class="stat-top"><span>Enfermería y Cuidados</span><div class="stat-icon">${icon('activity', 16)}</div></div>
      <div class="stat-number">${nurseCount}</div>
      <div class="stat-bottom muted">Kardex y administración</div>
    </div>
    <div class="stat-card">
      <div class="stat-top"><span>Secretaría y Admisión</span><div class="stat-icon">${icon('usercheck', 16)}</div></div>
      <div class="stat-number">${receptionCount}</div>
      <div class="stat-bottom muted">Gestión de turnos y caja</div>
    </div>
  </div>

  <section class="panel">
    <div class="toolbar">
      <div class="search-field grow">
        ${icon('search', 15)}
        <input placeholder="Buscar por nombre, correo o especialidad…" aria-label="Buscar personal" value="${esc(S.staffSearch)}" data-input="staff-search">
      </div>
      <select aria-label="Filtrar por rol" data-change="staff-role">
        <option value="">Todos los roles</option>
        <option value="DOCTOR" ${S.staffRole === 'DOCTOR' ? 'selected' : ''}>Médicos / Cirujanos</option>
        <option value="NURSE" ${S.staffRole === 'NURSE' ? 'selected' : ''}>Enfermería y Cuidados</option>
        <option value="RECEPTIONIST" ${S.staffRole === 'RECEPTIONIST' ? 'selected' : ''}>Secretaría / Recepción</option>
        <option value="CLINIC_ADMIN" ${S.staffRole === 'CLINIC_ADMIN' ? 'selected' : ''}>Administradores de Clínica</option>
      </select>
      <span class="text-sm muted">${filtered.length} miembros</span>
    </div>

    ${filtered.length ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Rol y Permisos</th>
            <th>Especialidad / Puesto</th>
            <th>Matrícula / ID</th>
            <th>Turnos Asignados</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((m, i) => {
            const apptsCount = (S.data.appointments || []).filter(a => a.doctorId === m.id && a.status !== 'CANCELLED').length;
            return `
            <tr>
              <td>
                <div class="initials-cell">
                  ${avatar(m.name, i)}
                  <div>
                    <strong>${esc(m.name)}</strong>
                    <div class="tiny muted">${esc(m.email)}</div>
                  </div>
                </div>
              </td>
              <td>${badge(m.role)}</td>
              <td>${esc(m.specialty || 'General')}</td>
              <td>
                <code>${esc(m.licenseNumber || '—')}</code>
                ${m.signatureData ? `<div class="tiny" style="color:#15803d;font-weight:600;margin-top:2px">✓ Firma digital activa</div>` : `<div class="tiny muted" style="margin-top:2px">Sin firma cargada</div>`}
              </td>
              <td><b>${apptsCount}</b> turnos</td>
              <td><span class="badge green"><i class="dot"></i>Activo</span></td>
              <td>
                <div style="display:flex;gap:6px;justify-content:flex-end">
                  <button class="btn small" data-action="edit-doctor-credentials" data-id="${m.id}" title="Configurar Firma Digital, Matrícula y Sello para Recetas y Presupuestos">${icon('edit', 13)} Firma y Matrícula</button>
                  <button class="btn small danger" data-action="delete-staff" data-id="${m.id}" data-name="${esc(m.name)}" title="Eliminar miembro del equipo">${icon('close', 13)} Eliminar</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : empty('No se encontró personal registrado', 'Puedes dar de alta a secretarias, médicos y administradores haciendo clic en "Nuevo miembro".', btn('Nuevo miembro', 'new-staff', 'plus', 'primary'))}
    <div class="panel-footer">
      <span>Personal activo en clínica: ${filtered.length}</span>
      <span>Controles de acceso basados en roles (RBAC) con firma digital y matrícula para recetario legal</span>
    </div>
  </section>`;
}

function doctorCredentialsDialog(staffId) {
  const m = (S.data?.staff || S.data?.doctors || []).find(x => x.id === staffId);
  if (!m) return toast('Profesional no encontrado', 'err');
  showModal(
    `Firma Digital y Matrícula · ${m.name}`,
    'Estos datos profesionales e imagen de firma se imprimen automáticamente en Recetas Electrónicas (RCTA / Ley 27.553), Presupuestos Clínicos y Facturas.',
    `<form data-form="doctor-credentials" data-id="${esc(m.id)}">
      <div class="form-grid">
        ${field('Matrícula Profesional (M.N. / M.P.) *', 'licenseNumber', 'text', m.licenseNumber || '', 'required placeholder="Ej: M.N. 142.850 · M.P. 98.412"')}
        ${field('Especialidad / Título en Sello *', 'specialty', 'text', m.specialty || 'Medicina Integrativa', 'required placeholder="Ej: Médica Especialista en Medicina Integrativa"')}
        ${field('Datos de Consultorio / Pie de Receta', 'address', 'text', m.address || 'Centro Médico · Atención con Turno Previo', 'placeholder="Dirección, teléfono o leyenda de sello médico"', true)}
      </div>

      <div style="margin-top:14px;border:1px solid #d8e4da;border-radius:10px;padding:14px;background:#f8fbf9">
        <div class="between" style="margin-bottom:8px;flex-wrap:wrap;gap:8px">
          <div>
            <strong style="font-size:13px;color:#18362b;display:block">Trazo de Firma Digital o Sello Escaneado</strong>
            <span class="tiny muted">Puedes dibujar tu firma con el mouse/pantalla táctil o subir una imagen PNG/JPG con fondo claro.</span>
          </div>
          <div class="flex" style="gap:6px">
            <label class="btn small" style="cursor:pointer;margin:0">
              ${icon('upload', 13)} Subir Imagen de Firma
              <input type="file" id="doc-sig-file" accept="image/png,image/jpeg,image/webp" style="display:none">
            </label>
            <button type="button" class="btn small" id="doc-sig-clear">Limpiar Lienzo</button>
          </div>
        </div>
        <div style="background:#fff;border:1px dashed #94a3b8;border-radius:8px;position:relative;height:140px;display:flex;align-items:center;justify-content:center;overflow:hidden">
          <canvas id="doc-sig-canvas" width="520" height="140" style="width:100%;height:140px;cursor:crosshair;touch-action:none"></canvas>
        </div>
        <input type="hidden" name="signatureData" id="doc-sig-input" value="${esc(m.signatureData || '')}">
        <div class="tiny muted" style="margin-top:6px;text-align:center">Vista previa del sello: <b>${esc(m.name)}</b> · ${esc(m.specialty || 'Médico')} · <b>${esc(m.licenseNumber || 'M.N.')}</b></div>
      </div>

      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        ${btn('Cancelar', 'close-modal', '', '', 'type="button"')}
        <button class="btn primary" type="submit">${icon('check', 15)} Guardar Firma y Matrícula</button>
      </div>
    </form>`,
    '',
    'wide'
  );

  setTimeout(() => {
    const canvas = $('#doc-sig-canvas');
    const sigInput = $('#doc-sig-input');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#143829';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (m.signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const ratio = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      };
      img.src = m.signatureData;
    }

    let drawing = false;
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    };
    const startDraw = (e) => {
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const moveDraw = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      if (sigInput) sigInput.value = canvas.toDataURL('image/png');
    };
    const endDraw = () => {
      if (drawing && sigInput) sigInput.value = canvas.toDataURL('image/png');
      drawing = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw, { once: false });
    canvas.addEventListener('touchstart', startDraw, { passive: true });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    $('#doc-sig-clear')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (sigInput) sigInput.value = '';
    });

    $('#doc-sig-file')?.addEventListener('change', (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        const dataUrl = re.target?.result;
        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const ratio = Math.min((canvas.width - 20) / img.width, (canvas.height - 16) / img.height, 1);
          const w = img.width * ratio;
          const h = img.height * ratio;
          ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
          if (sigInput) sigInput.value = canvas.toDataURL('image/png');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }, 50);
}

function staffForm() {
  const roles = [
    ['DOCTOR', 'Profesional / Médico (Agenda médica, historias clínicas, consultas)'],
    ['NURSE', 'Enfermería / Personal Clínico (Kardex, administración de insumos y fármacos)'],
    ['RECEPTIONIST', 'Secretaría / Recepción (Gestión de turnos, pacientes, sala de espera)'],
    ['CLINIC_ADMIN', 'Administrador de Clínica (Acceso total a la clínica)']
  ];
  const fields =
    field('Nombre y Apellido *', 'name', 'text', '', 'required minlength="3" maxlength="120" placeholder="Ej: Dra. Carolina Méndez o Lucía Gómez"', true) +
    field('Correo Electrónico de Acceso *', 'email', 'email', '', 'required placeholder="lucia.gomez@clinica.com"') +
    selectField('Rol en la clínica *', 'role', roles, 'RECEPTIONIST') +
    field('Especialidad / Puesto', 'specialty', 'text', '', 'placeholder="Ej: Cirugía Plástica, Dermatología, Recepción"') +
    field('Matrícula Profesional (Para médicos)', 'licenseNumber', 'text', '', 'placeholder="Ej: MN 145.210"') +
    field('Contraseña Inicial Provisoria *', 'password', 'password', '', 'required minlength="8" placeholder="Mínimo 8 caracteres" autocomplete="new-password"');

  formDialog('staff', 'Nuevo Miembro del Equipo', 'Asigna credenciales y rol de acceso para el personal de la clínica.', fields, 'Crear miembro del equipo');
}

function pipelineView() {
  const columns = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'];
  const pendingTriage = (S.data.leads || []).filter(l => l.status === 'NEW' || !l.aiTriage).length;
  return heading('Seguimiento y Admisión', 'Gestión proactiva de consultas con triage automatizado por IA y conversión a turnos.',
    btn(`Auto-clasificar con IA${pendingTriage ? ` (${pendingTriage})` : ''}`, 'ai-triage-all', 'spark', 'primary') +
    btn('Nuevo contacto', 'new-lead', 'plus')
  ) +
  `<div class="ai-banner">
    <div class="ai-banner-content">
      <span class="ai-banner-pill">${icon('spark', 14)} Triage y Derivación Proactiva</span>
      <p>La IA evalúa el motivo de consulta, clasifica la urgencia clínica, selecciona al profesional idóneo y habilita el agendamiento directo en un solo clic para aliviar la carga administrativa médica.</p>
    </div>
  </div>
  <div class="board">
    ${columns.map((c, i) => {
      const rows = S.data.leads.filter(l => l.status === c);
      return `<section class="board-column" data-drop="${c}">
        <div class="column-title"><i class="dot" style="color:${['#84a9b1', '#c5ac72', '#9db77a', '#619665'][i]}"></i>${statusMap[c][0]}<span class="count">${rows.length}</span></div>
        ${rows.map((l, j) => {
          const t = l.aiTriage;
          return `<article class="lead-card" draggable="true" data-lead="${l.id}">
            <div class="between">${avatar(l.name, j)}<span class="badge gray">${esc(l.source)}</span></div>
            <h3>${esc(l.name)}</h3>
            <p>${esc(l.interest || 'Consulta general')}</p>
            <div class="flex" style="font-size:10px;color:#9eae8c;margin-top:8px;gap:6px">${icon('phone', 11)}${esc(l.phone)}</div>

            ${t ? `
              <div class="lead-ai-box ${t.priority === 'HIGH' ? 'urgent' : ''}">
                <div class="lead-ai-head">
                  <span class="ai-pill">${icon('spark', 11)} ${esc(t.specialty)}</span>
                  <span class="priority-tag ${t.priority.toLowerCase()}">${esc(t.priorityLabel || t.priority)}</span>
                </div>
                <div class="lead-ai-reason">${esc(t.reasoning)}</div>
                <button class="btn small primary lead-quick-btn" data-action="lead-quick-schedule" data-id="${l.id}" data-doctor="${t.suggestedDoctorId || ''}">
                  ${icon('calendar', 12)} Agendar con ${esc(t.suggestedDoctorName)}
                </button>
              </div>
            ` : `
              <button class="lead-ai-trigger" data-action="ai-triage-lead" data-id="${l.id}">
                ${icon('spark', 12)} Clasificar y derivar con IA
              </button>
            `}

            <div class="lead-bottom" style="margin-top:12px">
              <span class="tiny muted">Etapa:</span>
              <select aria-label="Etapa de ${esc(l.name)}" data-change="lead-status" data-id="${l.id}">
                ${[...columns, 'ARCHIVED'].map(s => `<option value="${s}" ${c === s ? 'selected' : ''}>${statusMap[s][0]}</option>`).join('')}
              </select>
            </div>
          </article>`;
        }).join('') || '<div class="empty" style="padding:35px 5px"><p style="font-size:11px">Sin contactos en esta etapa</p></div>'}
      </section>`;
    }).join('')}
  </div>`;
}

function fmtOmniDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayName = d.toLocaleDateString('es-AR', { weekday: 'long' });
  const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('es-AR', { month: 'long' });
  const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${time} - ${capDay} ${dayNum} De ${capMonth}`;
}

function recordCard(r) {
  const content = typeof r.content === 'object' && r.content !== null ? r.content : { subjective: String(r.content || '') };
  const hasSoap = Boolean(content.subjective || content.objective || content.assessment || content.plan);
  const isVitals = r.type === 'VITALS' || content.vitals;
  const v = content.vitals || {};
  const attachments = r.attachments || content.attachments || [];
  const isFromPortal = Boolean(r.uploadedVia === 'PORTAL_PACIENTES' || content.uploadedVia === 'PORTAL_PACIENTES' || /Paciente/i.test(r.author || ''));

  return `<article class="omni-entry-card" data-record-id="${r.id}" style="${isFromPortal ? 'border-left:4px solid #2563eb' : ''}">
    <div class="between" style="align-items:flex-start;flex-wrap:wrap;gap:8px">
      <div>
        <div class="omni-entry-date">${fmtOmniDate(r.createdAt)}</div>
        <div class="omni-entry-author">
          ${icon('user', 14)}
          <span><b>${esc(r.author || 'Profesional Médico')}</b>${r.license ? ` - MN: ${esc(r.license)}` : ''} ${r.specialty ? `(${esc(r.specialty)})` : ''}</span>
        </div>
      </div>
      <div class="flex" style="gap:6px;flex-wrap:wrap">
        ${isFromPortal ? `<span class="badge blue" style="background:#dbeafe;color:#1d4ed8;font-weight:700">${icon('upload', 11)} Subido por Paciente (Portal)</span>` : `<span class="badge gray" style="font-size:10.5px">Equipo Médico</span>`}
        <span class="badge ${r.type === 'AMENDMENT' ? 'amber' : 'green'}">${icon('lock', 11)} ${r.type === 'AMENDMENT' ? 'Enmienda' : 'Inmutable'}</span>
        ${attachments.length ? `<span class="badge blue">${icon('file', 11)} ${attachments.length} adjunto(s)</span>` : ''}
      </div>
    </div>

    ${(r.problem || content.problem) ? `<div class="omni-entry-problem">${esc(r.problem || content.problem)}</div>` : ((r.title || content.title) ? `<div class="omni-entry-problem">${esc(r.title || content.title)}</div>` : '')}

    <div class="omni-entry-body">
      ${isVitals ? `
        <div class="vitals-grid">
          ${v.bloodPressure ? `<div class="vitals-box"><span class="v-label">Presión Arterial</span><span class="v-val">${esc(v.bloodPressure)} <small>mmHg</small></span></div>` : ''}
          ${v.heartRate ? `<div class="vitals-box"><span class="v-label">Frecuencia Cardíaca</span><span class="v-val">${esc(v.heartRate)} <small>lpm</small></span></div>` : ''}
          ${v.respiratoryRate ? `<div class="vitals-box"><span class="v-label">Frecuencia Resp.</span><span class="v-val">${esc(v.respiratoryRate)} <small>rpm</small></span></div>` : ''}
          ${v.temperature ? `<div class="vitals-box"><span class="v-label">Temperatura</span><span class="v-val">${esc(v.temperature)} <small>°C</small></span></div>` : ''}
          ${v.oxygenSaturation ? `<div class="vitals-box"><span class="v-label">SatO2</span><span class="v-val">${esc(v.oxygenSaturation)} <small>%</small></span></div>` : ''}
          ${v.weight ? `<div class="vitals-box"><span class="v-label">Peso</span><span class="v-val">${esc(v.weight)} <small>kg</small></span></div>` : ''}
          ${v.height ? `<div class="vitals-box"><span class="v-label">Talla</span><span class="v-val">${esc(v.height)} <small>cm</small></span></div>` : ''}
          ${v.bmi ? `<div class="vitals-box"><span class="v-label">IMC</span><span class="v-val">${esc(v.bmi)}</span></div>` : ''}
        </div>
        ${v.notes ? `<p style="margin-top:10px">${esc(v.notes)}</p>` : ''}
      ` : (r.type === 'HOSPITAL_DE_DIA' || content.recordType === 'HOSPITAL_DE_DIA') ? `
        <div class="hospital-day-evolution" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-bottom:12px">
          <div class="between" style="margin-bottom:8px">
            <span class="badge" style="background:#15803d;color:#ffffff;font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:5px">
              ${icon('activity', 13)} Terapias Ambulatorias · ${esc(content.therapyType || 'Sueroterapia')} (${esc(content.resource || 'Sillón')})
            </span>
            <span style="font-size:12px;font-weight:700;color:#166534">Sesión ${content.sessionNumber || 1}/${content.totalSessions || 1}</span>
          </div>

          ${content.instructions ? `<p style="font-size:12.5px;color:#1e3a2b;margin-bottom:10px"><b>Indicación médica:</b> ${esc(content.instructions)}</p>` : ''}

          ${(content.itemsAdministered && content.itemsAdministered.length) ? `
            <div style="margin-bottom:10px;background:#ffffff;border:1px solid #86efac;border-radius:8px;padding:10px">
              <strong style="font-size:12px;color:#166534;display:block;margin-bottom:6px">Insumos y Fármacos Administrados (Stock descontado):</strong>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px">
                ${content.itemsAdministered.map(it => `
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:5px 8px;font-size:11.5px;display:flex;justify-content:space-between">
                    <span style="font-weight:600;color:#334155">${esc(it.name)}</span>
                    <span style="color:#15803d;font-weight:700">${esc(it.dose || `${it.quantity} un`)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${(content.hrvTable && content.hrvTable.length) ? `
            <div style="margin-bottom:10px">
              <strong style="font-size:12px;color:#166534;display:block;margin-bottom:4px">Variabilidad de la Frecuencia Cardíaca (HRV):</strong>
              <table class="clinical-table" style="background:#ffffff;border-radius:8px;overflow:hidden">
                <thead>
                  <tr>
                    <th>Hora</th><th>HR (FC)</th><th>HRV</th><th>RMSSD</th><th>SDNN</th><th>PNN50</th>
                  </tr>
                </thead>
                <tbody>
                  ${content.hrvTable.map(row => `
                    <tr>
                      <td>${esc(row.time || '')}</td>
                      <td>${esc(row.hr || '')}</td>
                      <td>${esc(row.hrv || '')}</td>
                      <td>${esc(row.rmssd || '')}</td>
                      <td>${esc(row.sdnn || '')}</td>
                      <td>${esc(row.pnn50 || '')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div style="font-size:12px;color:#334155;margin-top:6px">
            <b>Tolerancia clínica:</b> ${esc(content.tolerance || 'Buena tolerancia sin intercurrencias.')}
          </div>
          ${content.notes ? `<div style="font-size:12px;color:#475569;margin-top:4px"><b>Observaciones de enfermería:</b> ${esc(content.notes)}</div>` : ''}
        </div>
      ` : content.html ? `
        <div class="clinical-html-content" style="line-height:1.6">${content.html}</div>
      ` : hasSoap ? `
        <div class="soap-grid" style="margin-bottom:12px">
          ${[['subjective', 'S · Subjetivo'], ['objective', 'O · Objetivo'], ['assessment', 'A · Evaluación'], ['plan', 'P · Plan']].filter(([k]) => content[k]).map(([k, label]) => `
            <div class="soap-item"><b>${label}</b><p style="white-space:pre-wrap">${esc(content[k])}</p></div>
          `).join('')}
        </div>
      ` : `
        <div style="white-space:pre-wrap;line-height:1.6">${(() => {
          if (typeof content === 'string') return esc(content);
          const txt = content.text || content.notes || r.notes || '';
          if (txt) return esc(txt);
          return `<span class="muted" style="font-style:italic">Evolución registrada (${esc(r.problem || content.problem || r.title || content.title || 'Consulta clínica')}).</span>`;
        })()}</div>
      `}

      ${content.consumedSupplies && content.consumedSupplies.length ? `
        <div style="margin-top:12px;padding:8px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px">
          <strong style="font-size:11px;color:#166534;display:flex;align-items:center;gap:6px">
            ${icon('box', 13)} Insumos descontados automáticamente del stock clínico:
          </strong>
          <div class="flex" style="flex-wrap:wrap;gap:6px;margin-top:5px">
            ${content.consumedSupplies.map(cs => `
              <span class="attachment-chip" style="background:#fff;border-color:#86efac;color:#14532d;cursor:default;margin:0">
                <b>${esc(cs.name)}</b> x ${cs.quantity} ${esc(cs.unit || 'uds')}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${attachments.length ? `
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #e2e8f0">
          <strong style="font-size:11px;color:#475569;display:block;margin-bottom:6px">Archivos y Estudios Adjuntos:</strong>
          <div class="flex" style="flex-wrap:wrap;gap:8px">
            ${attachments.map(att => `
              <button class="attachment-chip" data-action="view-attachment" data-url="${esc(att.dataUrl || att.data || att.url || '')}" data-name="${esc(att.name || 'Archivo')}" data-type="${esc(att.type || '')}">
                ${icon(att.type && att.type.includes('pdf') ? 'file' : 'image', 13)}
                <span>${esc(att.name || 'Estudio / Documento')}</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <div class="record-hash" style="margin-top:12px">
      SHA-256 · ${esc(r.hash ? r.hash.slice(0, 48) : 'Verificado')}... · Trazabilidad médica inmutable (Ley 26.529).
    </div>

    <div class="between" style="margin-top:12px;flex-wrap:wrap;gap:8px">
      <div class="flex" style="gap:12px;flex-wrap:wrap">
        <button class="text-link" data-action="verify-record" data-id="${r.id}">${icon('shield', 13)} Verificar integridad</button>
        <button class="text-link" data-action="print-record" data-id="${r.id}">${icon('download', 13)} Documento Oficial (PDF)</button>
        ${isFromPortal ? `<button class="text-link" style="color:#1d4ed8;font-weight:600" data-action="omni-tab" data-value="comparativa">${icon('activity', 13)} Comparar con evolución médica</button>` : ''}
      </div>
      <button class="text-link" data-action="amend-record" data-id="${r.id}">${icon('plus', 13)} Agregar enmienda</button>
    </div>
  </article>`;
}

function medicalHistoryCard(p) {
  const mh = p.medicalHistory || {};
  const hasAllergies = Boolean(mh.allergies && !/^(ninguna|no refiere|no reporta|sin alergias|no tiene)$/i.test(mh.allergies.trim()));
  const shortPath = mh.pathological ? (mh.pathological.length > 48 ? mh.pathological.slice(0, 48) + '…' : mh.pathological) : 'Sin patologías crónicas';
  const shortMeds = mh.medications ? (mh.medications.length > 42 ? mh.medications.slice(0, 42) + '…' : mh.medications) : 'Sin medicación habitual';

  return `<details class="medical-history-panel" ${S.medHistoryOpen ? 'open' : ''} style="padding:10px 14px;border-radius:10px;border:1px solid ${hasAllergies ? '#fecaca' : '#d8e4da'};background:${hasAllergies ? '#fffafb' : '#f8fbf9'}">
    <summary style="list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;user-select:none">
      <div class="flex" style="gap:10px;flex-wrap:wrap;align-items:center">
        <span class="mh-icon" style="width:26px;height:26px">${icon('shield', 14)}</span>
        <strong style="font-size:12.5px;color:#1e4c3a">Antecedentes Médicos y Factores de Riesgo</strong>
        ${hasAllergies
          ? `<span class="badge red" style="font-size:10.5px">${icon('warning', 11)} Alergia: ${esc(mh.allergies)}</span>`
          : `<span class="badge green" style="font-size:10.5px">${icon('check', 11)} Sin alergias reportadas</span>`
        }
        <span class="tiny muted" style="border-left:1px solid #cbd5e1;padding-left:8px">${esc(shortPath)} · ${esc(shortMeds)}</span>
      </div>
      <div class="flex" style="gap:8px;align-items:center">
        <span class="tiny" style="color:#1b4c37;font-weight:600;display:inline-flex;align-items:center;gap:4px">Desplegar / Ocultar ${icon('down', 12)}</span>
      </div>
    </summary>

    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0">
      <div class="between" style="margin-bottom:10px">
        <span class="tiny muted">Ley 26.529 · Perfil Clínico Permanente</span>
        <button class="btn small ghost text-link" data-action="edit-medical-history" data-id="${p.id}">
          ${icon('edit', 13)} Actualizar Antecedentes
        </button>
      </div>

      ${hasAllergies ? `
        <div class="allergies-alert" style="margin-bottom:10px">
          <div class="flex" style="gap:10px">
            <span class="alert-pulse">${icon('warning', 18)}</span>
            <div>
              <strong style="font-size:11px;color:#9e3223;letter-spacing:0.3px">ALERGIAS MEDICAMENTOSAS / SUSTANCIAS REPORTADAS:</strong>
              <p style="margin:2px 0 0;font-size:12px;font-weight:650;color:#7e2215">${esc(mh.allergies)}</p>
            </div>
          </div>
          <span class="badge red">Alerta Médica Activa</span>
        </div>
      ` : ''}

      <div class="mh-grid">
        <div class="mh-item">
          <span class="mh-label">Patologías Crónicas / Comorbilidades</span>
          <p>${esc(mh.pathological || 'Sin patologías crónicas declaradas.')}</p>
        </div>
        <div class="mh-item">
          <span class="mh-label">Medicación Habitual y Tratamientos</span>
          <p>${esc(mh.medications || 'Sin medicación crónica registrada.')}</p>
        </div>
        <div class="mh-item">
          <span class="mh-label">Cirugías e Internaciones Previas</span>
          <p>${esc(mh.surgical || 'Sin antecedentes quirúrgicos de relevancia.')}</p>
        </div>
        <div class="mh-item">
          <span class="mh-label">Antecedentes Heredofamiliares y Hábitos</span>
          <p>${esc(mh.familyHistory || 'Sin datos familiares reportados')} ${mh.habits ? `· ${esc(mh.habits)}` : ''}</p>
        </div>
      </div>
    </div>
  </details>`;
}

function renderComparativeEvolutionPanel(p, allPatientRecords) {
  const patientPortalRecords = allPatientRecords.filter(r =>
    r.uploadedVia === 'PORTAL_PACIENTES' ||
    r.content?.uploadedVia === 'PORTAL_PACIENTES' ||
    /Paciente/i.test(r.author || '')
  );
  const doctorRecords = allPatientRecords.filter(r => !patientPortalRecords.includes(r));
  const vitalsRecords = allPatientRecords.filter(r => r.type === 'VITALS' || r.content?.vitals);
  const labAndStudies = allPatientRecords.filter(r => r.type === 'LAB' || r.type === 'STUDY' || (r.attachments && r.attachments.length > 0));

  return `
  <section class="panel" style="margin-bottom:16px;border:1px solid #bfdbfe;background:linear-gradient(180deg,#f8fbff 0%,#ffffff 100%)">
    <div class="panel-header" style="border-bottom:1px solid #dbeafe;flex-wrap:wrap;gap:12px;align-items:flex-start">
      <div style="min-width:0;flex:1 1 320px">
        <div class="flex" style="gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
          <span class="badge blue" style="background:#1d4ed8;color:#fff">${icon('activity', 12)} Experiencia de Paciente & Evolución</span>
          <h2 style="font-size:15.5px;color:#0f172a;margin:0">Comparativa Clínica: Paciente vs. Evolución Médica</h2>
        </div>
        <p class="panel-sub" style="margin:0">Sincronización directa entre los estudios subidos por ${esc(nameOf(p))} en su Portal y los nuevos controles, laboratorios y evoluciones del equipo médico.</p>
      </div>
      <div class="flex" style="gap:8px;flex-wrap:wrap">
        <button class="btn small" data-action="new-attachment">${icon('upload', 12)} Cargar Resultado</button>
        <button class="btn small primary" data-action="new-record">${icon('plus', 12)} Nueva Evolución</button>
      </div>
    </div>

    <div class="panel-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px">
        <!-- Columna 1: Documentos y Estudios Base aportados por el Paciente -->
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px">
          <div class="between" style="margin-bottom:10px">
            <strong style="font-size:13px;color:#1e3a8a;display:flex;align-items:center;gap:6px">
              ${icon('upload', 14)} 1. Estudios Aportados por el Paciente (Portal)
            </strong>
            <span class="badge blue">${patientPortalRecords.length} cargado(s)</span>
          </div>
          ${patientPortalRecords.length ? patientPortalRecords.map(pr => {
            const c = typeof pr.content === 'object' && pr.content ? pr.content : {};
            const atts = pr.attachments || c.attachments || [];
            const typeBadge = pr.type === 'LAB' ? 'Laboratorio' : pr.type === 'STUDY' ? 'Imágenes / Estudio' : 'Documento';
            return `
            <div style="background:#fff;border:1px solid #dbeafe;border-radius:8px;padding:10px;margin-bottom:8px">
              <div class="between" style="gap:6px">
                <b style="font-size:12.5px;color:#0f172a">${esc(pr.title || c.title || pr.problem || 'Estudio del Paciente')}</b>
                <span class="badge blue" style="font-size:10px">${typeBadge}</span>
              </div>
              <div class="tiny muted" style="margin:3px 0 6px">${fmtDate(pr.createdAt, true)} · ${esc(pr.specialty || c.specialty || 'General')}</div>
              ${(pr.notes || c.notes) ? `<p style="font-size:12px;color:#334155;margin:4px 0 8px">${esc(pr.notes || c.notes)}</p>` : ''}
              ${atts.length ? `<div class="flex" style="gap:6px;flex-wrap:wrap">
                ${atts.map(att => `
                  <button class="attachment-chip" style="margin:0;padding:4px 8px;font-size:11px" data-action="view-attachment" data-url="${esc(att.dataUrl || att.data || att.url || '')}" data-name="${esc(att.name || 'Estudio')}" data-type="${esc(att.type || '')}">
                    ${icon('file', 11)} ${esc(att.name || 'Ver archivo')}
                  </button>
                `).join('')}
              </div>` : ''}
            </div>`;
          }).join('') : `
            <div style="background:#fff;border:1px dashed #93c5fd;border-radius:8px;padding:14px;text-align:center;color:#475569;font-size:12px">
              Cuando el paciente sube un Laboratorio o Estudio desde su Portal de Salud, se clasifica automáticamente aquí y en la pestaña correspondiente (<b>Laboratorio</b>, <b>Estudios</b> o <b>Documentos</b>).
              ${labAndStudies.length ? `<div style="margin-top:8px;color:#1e40af;font-weight:600">Actualmente hay ${labAndStudies.length} estudio(s)/laboratorio(s) en la ficha para comparar.</div>` : ''}
            </div>
          `}
        </div>

        <!-- Columna 2: Nuevos Resultados y Evolución Clínica del Médico -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px">
          <div class="between" style="margin-bottom:10px">
            <strong style="font-size:13px;color:#14532d;display:flex;align-items:center;gap:6px">
              ${icon('activity', 14)} 2. Nuevos Resultados y Evolución del Médico
            </strong>
            <span class="badge green">${doctorRecords.length} registro(s)</span>
          </div>
          ${doctorRecords.slice(0, 4).map(dr => {
            const c = typeof dr.content === 'object' && dr.content ? dr.content : {};
            const summaryTxt = c.assessment || c.plan || c.notes || c.subjective || (typeof dr.content === 'string' ? dr.content : '') || dr.title || 'Control médico registrado';
            const cleanTxt = String(summaryTxt).replace(/<[^>]+>/g, '').slice(0, 140);
            const labelType = dr.type === 'HOSPITAL_DE_DIA' ? 'Terapia Ambulatoria' : dr.type === 'LAB' ? 'Lab Médico' : dr.type === 'VITALS' ? 'Signos Vitales' : 'Evolución Médica';
            return `
            <div style="background:#fff;border:1px solid #bbf7d0;border-radius:8px;padding:10px;margin-bottom:8px">
              <div class="between" style="gap:6px">
                <b style="font-size:12.5px;color:#14532d">${esc(dr.problem || c.problem || dr.title || c.title || labelType)}</b>
                <span class="badge green" style="font-size:10px">${labelType}</span>
              </div>
              <div class="tiny muted" style="margin:3px 0 6px">${fmtDate(dr.createdAt, true)} · ${esc(dr.author || 'Médico')}</div>
              <p style="font-size:12px;color:#334155;margin:0">${esc(cleanTxt)}${cleanTxt.length >= 140 ? '…' : ''}</p>
            </div>`;
          }).join('') || `
            <div style="background:#fff;border:1px dashed #86efac;border-radius:8px;padding:14px;text-align:center;color:#475569;font-size:12px">
              Aún no se han registrado evoluciones médicas posteriores para contrastar.
            </div>
          `}
        </div>
      </div>

      ${vitalsRecords.length >= 1 ? `
        <div style="margin-top:12px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="font-size:12px;color:#334155">
            <b>Progreso de Parámetros Clínicos (${vitalsRecords.length} controles):</b>
            Último control (${fmtDate(vitalsRecords[0].createdAt)}):
            ${vitalsRecords[0].content?.vitals?.bloodPressure ? `TA <b>${esc(vitalsRecords[0].content.vitals.bloodPressure)}</b> mmHg · ` : ''}
            ${vitalsRecords[0].content?.vitals?.heartRate ? `FC <b>${esc(vitalsRecords[0].content.vitals.heartRate)}</b> lpm · ` : ''}
            ${vitalsRecords[0].content?.vitals?.weight ? `Peso <b>${esc(vitalsRecords[0].content.vitals.weight)}</b> kg` : ''}
          </div>
          <button class="text-link tiny" data-action="omni-tab" data-value="signos-vitales">Ver curva de signos vitales ${icon('arrow', 11)}</button>
        </div>
      ` : ''}
    </div>
  </section>`;
}

function recordsView() {
  if (!S.selectedPatient || !patientBy(S.selectedPatient)) S.selectedPatient = S.data.patients[0]?.id || null;
  const p = patientBy(S.selectedPatient);
  const allPatientRecords = S.data.records.filter(r => r.patientId === S.selectedPatient);
  const prescriptions = S.data.prescriptions.filter(r => r.patientId === S.selectedPatient);
  const consents = (S.data.consents || []).filter(c => c.patientId === S.selectedPatient);

  const omniTab = S.omniTab || 'evoluciones';

  // Extract unique filters
  const problems = Array.from(new Set(allPatientRecords.map(r => r.problem || r.content?.problem).filter(Boolean)));
  const specialties = Array.from(new Set(allPatientRecords.map(r => r.specialty || r.content?.specialty).filter(Boolean)));
  const authors = Array.from(new Set(allPatientRecords.map(r => r.author).filter(Boolean)));

  const isEvolutionRecord = (r) => !r.type || r.type === 'SOAP' || r.type === 'SOAP_NOTE' || r.type === 'AMENDMENT' || r.type === 'HOSPITAL_DE_DIA';
  const portalUploadsCount = allPatientRecords.filter(r => r.uploadedVia === 'PORTAL_PACIENTES' || r.content?.uploadedVia === 'PORTAL_PACIENTES' || /Paciente/i.test(r.author || '')).length;

  // Filter records based on current omni settings
  const filteredRecords = allPatientRecords.filter(r => {
    const rAttachments = r.attachments || r.content?.attachments || [];
    // Tab filter
    if (omniTab === 'estudios') {
      const isStudy = r.type === 'STUDY' || r.type === 'IMAGE' || r.type === 'STUDY_ORDER' || (r.type !== 'LAB' && rAttachments.length > 0);
      if (!isStudy) return false;
    } else if (omniTab === 'evoluciones') {
      if (!isEvolutionRecord(r)) return false;
      if (S.omniEvolFilter === 'MEDICAL' && r.type === 'HOSPITAL_DE_DIA') return false;
      if (S.omniEvolFilter === 'HOSPITAL_DAY' && r.type !== 'HOSPITAL_DE_DIA') return false;
    } else if (omniTab === 'laboratorio') {
      const isLab = r.type === 'LAB' || /lab|hemograma|bioqu[ií]m|sangre|orina/i.test(r.title || r.content?.title || r.problem || '');
      if (!isLab) return false;
    } else if (omniTab === 'signos-vitales') {
      if (r.type !== 'VITALS' && !r.content?.vitals) return false;
    } else if (omniTab === 'documentos') {
      const hasDocs = r.type === 'DOCUMENT' || r.type === 'STUDY_ORDER' || r.type === 'PRESCRIPTION_EXT' || rAttachments.length > 0;
      if (!hasDocs) return false;
    }

    // Search filter
    if (S.omniSearch) {
      const q = S.omniSearch.toLowerCase();
      const contentStr = typeof r.content === 'object' ? JSON.stringify(r.content).toLowerCase() : String(r.content || '').toLowerCase();
      const problemStr = String(r.problem || r.content?.problem || '').toLowerCase();
      const authorStr = String(r.author || '').toLowerCase();
      if (!contentStr.includes(q) && !problemStr.includes(q) && !authorStr.includes(q)) return false;
    }

    // Date range
    if (S.omniFromDate) {
      if (new Date(r.createdAt) < new Date(S.omniFromDate + 'T00:00:00')) return false;
    }
    if (S.omniToDate) {
      if (new Date(r.createdAt) > new Date(S.omniToDate + 'T23:59:59')) return false;
    }

    // Problem filter
    if (S.omniProblem && (r.problem || r.content?.problem) !== S.omniProblem) return false;

    // Specialty filter
    if (S.omniSpecialty && (r.specialty || r.content?.specialty) !== S.omniSpecialty) return false;

    // Author filter
    if (S.recordAuthor && r.author !== S.recordAuthor) return false;

    // Attachment filter
    if (S.recordAttachmentFilter === 'with' && rAttachments.length === 0) return false;
    if (S.recordAttachmentFilter === 'without' && rAttachments.length > 0) return false;

    return true;
  });

  const patQuery = (S.recordPatientSearch || '').toLowerCase().trim();
  const visiblePatients = (S.data.patients || []).filter(pat =>
    !patQuery || [nameOf(pat), pat.dni, pat.coverage, pat.phone].some(x => String(x || '').toLowerCase().includes(patQuery))
  );

  return heading('Historia Clínica Integral', 'Evoluciones médicas, estudios del portal del paciente, comparativa de evolución, órdenes de estudio y consentimientos inmutables.',
    `<div class="flex" style="gap:8px;flex-wrap:wrap">
      ${p ? `<button class="btn small" data-action="export-complete-hce" data-id="${p.id}" title="Descargar copia completa de la Historia Clínica conforme Ley 26.529">${icon('download', 13)} Exportar HCE (Ley 26.529)</button>` : ''}
      <button class="btn small" data-action="new-study-order">${icon('file', 13)} Orden de Estudios</button>
      <button class="btn small" data-action="new-attachment">${icon('upload', 13)} Cargar Estudio / Lab</button>
      <button class="btn small" data-action="new-vitals">${icon('activity', 13)} Signos Vitales</button>
      <button class="btn small primary" data-action="new-record">${icon('plus', 13)} Nueva Evolución</button>
    </div>`
  ) +
  `<div class="record-layout-full">
    ${p ? `
      <!-- Ficha de Paciente Activo + Selector Desplegable con Buscador -->
      <section class="panel" style="margin-bottom:14px">
        <div class="panel-header" style="padding:14px 18px;flex-wrap:wrap;gap:12px">
          <div class="flex" style="min-width:0;flex:1 1 260px">
            ${avatar(nameOf(p))}
            <div style="min-width:0">
              <div class="flex" style="gap:8px;flex-wrap:wrap;align-items:center">
                <h2 style="margin:0">${esc(nameOf(p))}</h2>
                <button type="button" class="btn small" data-action="toggle-patient-picker" style="background:#f0fdf4;border-color:#bbf7d0;color:#1b4c37;font-weight:700">
                  ${icon('users', 13)} Cambiar / Buscar Paciente (${S.data.patients.length}) ${icon('down', 12)}
                </button>
              </div>
              <p class="panel-sub" style="margin:2px 0 0">${esc(p.coverage || 'Particular')} ${p.affiliateNumber ? `(Afiliado N° ${esc(p.affiliateNumber)})` : ''} · DNI ${esc(p.dni || '—')} ${p.cuitCuil ? `· CUIT/CUIL ${esc(p.cuitCuil)}` : ''} ${p.birthDate ? `· Edad: ${calcAge(p.birthDate)} años` : ''}</p>
            </div>
          </div>
          <div class="flex" style="gap:8px;flex-wrap:wrap">
            <button class="btn small" data-action="edit-medical-history" data-id="${p.id}">${icon('shield', 13)} Editar Antecedentes</button>
            <button class="text-link" data-action="patient-detail" data-id="${p.id}">Ficha integral ${icon('arrow', 12)}</button>
          </div>
        </div>

        ${S.patientPickerOpen ? `
          <div style="padding:12px 18px 16px;background:#f8fbf9;border-top:1px solid #e2e8e2;border-bottom:1px solid #e2e8e2">
            <div class="between" style="margin-bottom:10px;gap:10px;flex-wrap:wrap">
              <div class="omni-search-box" style="max-width:380px;flex:1">
                <span class="omni-search-icon">${icon('search', 14)}</span>
                <input id="record-patient-search" type="search" class="omni-search-input" data-input="record-patient-search" placeholder="Buscar por nombre, DNI, cobertura o teléfono..." value="${esc(S.recordPatientSearch || '')}">
              </div>
              <span class="tiny muted">Mostrando ${visiblePatients.length} de ${S.data.patients.length} pacientes</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;max-height:240px;overflow-y:auto">
              ${visiblePatients.map((pat, i) => `
                <button type="button" class="patient-choice ${S.selectedPatient === pat.id ? 'active' : ''}" data-action="select-record-patient" data-id="${pat.id}" style="text-align:left;border:1px solid ${S.selectedPatient === pat.id ? '#1b4c37' : '#e2e8e2'};border-radius:10px;padding:8px 10px;background:${S.selectedPatient === pat.id ? '#eaf4ec' : '#ffffff'}">
                  ${avatar(nameOf(pat), i)}
                  <div style="min-width:0">
                    <div class="patient-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(nameOf(pat))}</div>
                    <div class="patient-sub">${esc(pat.dni ? `DNI ${pat.dni}` : 'Sin DNI')} · ${esc(pat.coverage || 'Particular')}</div>
                  </div>
                </button>
              `).join('') || `<div class="tiny muted" style="padding:12px">No se encontraron pacientes.</div>`}
            </div>
          </div>
        ` : ''}

        <!-- Módulo Desplegable de Antecedentes Médicos y Alergias (Ley 26.529) -->
        <div style="padding:0 18px 12px">
          ${medicalHistoryCard(p)}
        </div>
      </section>

      <!-- Barra Única de Secciones Clínicas (Sin duplicaciones) -->
      <nav class="omni-top-tabs">
        <button class="omni-tab-btn ${omniTab === 'evoluciones' ? 'active' : ''}" data-action="omni-tab" data-value="evoluciones">Evoluciones (${allPatientRecords.filter(isEvolutionRecord).length})</button>
        <button class="omni-tab-btn ${omniTab === 'comparativa' ? 'active' : ''}" data-action="omni-tab" data-value="comparativa">Comparativa Paciente vs. Médico ${portalUploadsCount ? `(${portalUploadsCount})` : ''}</button>
        <button class="omni-tab-btn ${omniTab === 'estudios' ? 'active' : ''}" data-action="omni-tab" data-value="estudios">Estudios e Imágenes</button>
        <button class="omni-tab-btn ${omniTab === 'laboratorio' ? 'active' : ''}" data-action="omni-tab" data-value="laboratorio">Laboratorio</button>
        <button class="omni-tab-btn ${omniTab === 'prescripciones' ? 'active' : ''}" data-action="omni-tab" data-value="prescripciones">Prescripciones (${prescriptions.length})</button>
        <button class="omni-tab-btn ${omniTab === 'signos-vitales' ? 'active' : ''}" data-action="omni-tab" data-value="signos-vitales">Signos Vitales</button>
        <button class="omni-tab-btn ${omniTab === 'documentos' ? 'active' : ''}" data-action="omni-tab" data-value="documentos">Documentos</button>
        <button class="omni-tab-btn ${omniTab === 'consentimientos' ? 'active' : ''}" data-action="omni-tab" data-value="consentimientos">Consentimientos (${consents.length})</button>
      </nav>

      <!-- Contenedor Principal: Solo Filtros a la izquierda + Contenido a la derecha -->
      <div class="omni-container">
        <aside class="omni-sidebar">
          <div class="omni-filter-group">
            <span class="omni-filter-title">Filtros de Búsqueda</span>
            <div class="omni-search-box">
              <span class="omni-search-icon">${icon('search', 14)}</span>
              <input type="search" class="omni-search-input" placeholder="Buscar en registros..." value="${esc(S.omniSearch || '')}" data-action="omni-search">
            </div>
          </div>

          <div class="omni-filter-group">
            <span class="omni-filter-title">Fechas</span>
            <div class="omni-date-row">
              <span class="omni-date-label">Desde</span>
              <input type="date" class="omni-date-input" value="${esc(S.omniFromDate || '')}" data-action="omni-from">
            </div>
            <div class="omni-date-row">
              <span class="omni-date-label">Hasta</span>
              <input type="date" class="omni-date-input" value="${esc(S.omniToDate || '')}" data-action="omni-to">
            </div>
          </div>

            ${problems.length ? `
              <div class="omni-filter-group">
                <span class="omni-filter-title">Problema / Diagnóstico</span>
                ${problems.map(prob => `
                  <button class="omni-filter-chip ${S.omniProblem === prob ? 'active' : ''}" data-action="omni-filter-chip" data-filter="problem" data-value="${esc(prob)}">
                    ${esc(prob)}
                  </button>
                `).join('')}
                ${S.omniProblem ? `<button class="text-link tiny" style="margin-top:4px" data-action="omni-filter-chip" data-filter="problem" data-value="">(Limpiar problema)</button>` : ''}
              </div>
            ` : ''}

            ${specialties.length ? `
              <div class="omni-filter-group">
                <span class="omni-filter-title">Especialidad</span>
                ${specialties.map(spec => `
                  <button class="omni-filter-chip ${S.omniSpecialty === spec ? 'active' : ''}" data-action="omni-filter-chip" data-filter="specialty" data-value="${esc(spec)}">
                    ${esc(spec)}
                  </button>
                `).join('')}
                ${S.omniSpecialty ? `<button class="text-link tiny" style="margin-top:4px" data-action="omni-filter-chip" data-filter="specialty" data-value="">(Limpiar especialidad)</button>` : ''}
              </div>
            ` : ''}

            ${authors.length ? `
              <div class="hcd-filter-group">
                <span class="hcd-filter-title">Origen / Autor</span>
                ${authors.map(aut => `
                  <button class="hcd-filter-chip ${S.recordAuthor === aut ? 'active' : ''}" data-action="hcd-filter-chip" data-filter="author" data-value="${esc(aut)}">
                    ${esc(aut)}
                  </button>
                `).join('')}
                ${S.recordAuthor ? `<button class="text-link tiny" style="margin-top:4px" data-action="hcd-filter-chip" data-filter="author" data-value="">(Limpiar autor)</button>` : ''}
              </div>
            ` : ''}

            <div class="hcd-filter-group">
              <span class="hcd-filter-title">Archivos</span>
              <button class="hcd-filter-chip ${!S.recordAttachmentFilter ? 'active' : ''}" data-action="hcd-filter-chip" data-filter="attachment" data-value="">Todos</button>
              <button class="hcd-filter-chip ${S.recordAttachmentFilter === 'with' ? 'active' : ''}" data-action="hcd-filter-chip" data-filter="attachment" data-value="with">Con adjunto</button>
              <button class="hcd-filter-chip ${S.recordAttachmentFilter === 'without' ? 'active' : ''}" data-action="hcd-filter-chip" data-filter="attachment" data-value="without">Sin adjunto</button>
            </div>
          </aside>

          <!-- Main Feed / Records List -->
          <main class="omni-feed">
            ${omniTab === 'comparativa' ? renderComparativeEvolutionPanel(p, allPatientRecords) + (allPatientRecords.length ? allPatientRecords.map(recordCard).join('') : '') : omniTab === 'prescripciones' ? `
              <section class="panel">
                <div class="panel-header"><h2>Recetas y Prescripciones Médicas Electrónicas</h2>${btn('Nueva receta legal', 'new-prescription', 'plus', 'small primary')}</div>
                <div class="panel-body">
                  ${prescriptions.map(r => `<div class="soap-item" style="margin-bottom:12px">
                    <div class="between" style="flex-wrap:wrap;gap:6px">
                      <div>
                        <b>Receta Electrónica Oficial ${r.cuir ? `· CUIR ${esc(r.cuir)}` : ''}</b>
                        <div class="tiny muted">Prescriptor: <b>${esc(r.doctorName || 'Médico Tratante')}</b> (${esc(r.doctorLicense || 'M.N.')}) ${r.diagnosis ? `· Diag: ${esc(r.diagnosis)}` : ''}</div>
                      </div>
                      ${badge(r.status)}
                    </div>
                    <p style="white-space:pre-wrap;margin:8px 0">${esc(r.content)}</p>
                    <div class="between" style="margin-top:10px">
                      <div class="tiny muted">${fmtDate(r.createdAt, true)}</div>
                      <button class="text-link" data-action="print-prescription" data-id="${r.id}">${icon('download', 12)} Imprimir Receta Legal con Firma y QR (PDF)</button>
                    </div>
                  </div>`).join('') || empty('Sin recetas emitidas', 'No hay recetas prescritas para este paciente.', btn('Emitir receta legal', 'new-prescription', 'plus', 'small primary'))}
                </div>
              </section>
            ` : omniTab === 'consentimientos' ? `
              <section class="panel">
                <div class="panel-header">
                  <div>
                    <h2>Consentimientos Informados Digitales</h2>
                    <p class="panel-sub">Documentación legal bilateral (médico y paciente) conforme Ley 26.529.</p>
                  </div>
                  ${btn('Nuevo consentimiento', 'new-consent', 'plus', 'primary', `data-patient-id="${p.id}"`)}
                </div>
                <div class="panel-body">
                  ${consents.map(c => `<div class="soap-item" style="margin-bottom:12px">
                    <div class="between">
                      <div>
                        <strong style="color:#1b4c37;font-size:14px">${esc(c.title)}</strong>
                        <div class="tiny muted">${fmtDate(c.signedAt, true)} · Profesional: ${esc(c.doctorName)}</div>
                      </div>
                      <span class="badge green">${icon('shield', 11)} Bilateralmente Firmado</span>
                    </div>
                    <p style="margin-top:8px;font-size:13px">${esc(c.content)}</p>
                    <div class="record-hash" style="margin-top:10px">
                      Firma Digital HMAC-SHA256 · ${esc((c.hash || '').slice(0, 36))}...<br>
                      ${c.patientSignature ? '✓ Incluye trazo de firma digitalizada del paciente. ' : ''}Validez legal e integridad conforme a normativa de salud.
                    </div>
                    <div class="between" style="margin-top:12px">
                      <button class="text-link" data-action="print-consent" data-id="${c.id}">${icon('download', 12)} Ver Documento Oficial Firmado (PDF)</button>
                    </div>
                  </div>`).join('') || empty('Sin consentimientos registrados', 'No hay consentimientos informados emitidos para este paciente.', btn('Emitir primer consentimiento', 'new-consent', 'plus', 'small', `data-patient-id="${p.id}"`))}
                </div>
              </section>
            ` : (omniTab === 'evoluciones' ? `
              <div class="flex" style="gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap;justify-content:space-between">
                <div class="flex" style="gap:8px;align-items:center;flex-wrap:wrap">
                  <span style="font-size:12px;font-weight:600;color:#64748b">Sector Clínico:</span>
                  <button class="chip ${(!S.omniEvolFilter || S.omniEvolFilter === 'ALL') ? 'active' : ''}" data-action="set-evol-filter" data-val="ALL">Todas las evoluciones (${allPatientRecords.filter(isEvolutionRecord).length})</button>
                  <button class="chip ${S.omniEvolFilter === 'MEDICAL' ? 'active' : ''}" data-action="set-evol-filter" data-val="MEDICAL">${icon('usercheck', 13)} Consultas Médicas (SOAP)</button>
                  <button class="chip ${S.omniEvolFilter === 'HOSPITAL_DAY' ? 'active' : ''}" data-action="set-evol-filter" data-val="HOSPITAL_DAY">${icon('activity', 13)} Terapias Ambulatorias (Enfermería / Insumos)</button>
                </div>
                <button class="btn small" style="background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe" data-action="omni-tab" data-value="comparativa">
                  ${icon('activity', 12)} Comparar con estudios del paciente (${portalUploadsCount})
                </button>
              </div>
            ` : '') + (filteredRecords.length ? filteredRecords.map(recordCard).join('') : `
              <section class="panel" style="padding:40px 20px;text-align:center">
                ${empty('Sin registros en esta vista', 'No se encontraron evoluciones ni estudios con los filtros aplicados.', btn('Nueva evolución SOAP', 'new-record', 'plus', 'primary'))}
              </section>
            `)}
          </main>
        </div>
      ` : empty('Selecciona un paciente', 'Selecciona un paciente para visualizar su historial.')}
  </div>`;
}

const PRELOADED_INVENTORY_CATALOG = [
  { name: 'Arginina 10%', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: 'Azul de Metileno 0,5%', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'frascos' },
  { name: 'CDP-Colina 5%', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: 'Complejo B 0,025%', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: '5OH Triptofano 0,1%', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: 'EDTA 15%', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'frascos' },
  { name: 'Vitamina C Inyectable 10g / 50ml', groupCategory: 'Fármacos', category: 'Sueroterapia', unit: 'frascos' },
  { name: 'Taurina Inyectable 200mg / 2ml', groupCategory: 'Fármacos', category: 'Sueroterapia', unit: 'ampollas' },
  { name: 'Glutatión 600mg', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'frascos' },
  { name: 'Magnesio Sulfato 25%', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: 'Nux vomica-Homaccord', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: 'Mucosa compositum', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: 'Lymphomyosot', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: 'Glandula thyreoidea suis-Injeel', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'ampollas' },
  { name: 'Agua destilada 500ml', groupCategory: 'Insumos', category: 'Medicamentos', unit: 'frascos' },
  { name: 'Solución Fisiológica 250ml', groupCategory: 'Insumos', category: 'Materiales', unit: 'frascos' },
  { name: 'Solución Fisiológica 100ml', groupCategory: 'Insumos', category: 'Materiales', unit: 'frascos' },
  { name: 'Apósito Transparente 6x7cm', groupCategory: 'Insumos', category: 'Descartables', unit: 'unidades' },
  { name: 'Catéter endovenoso N 22', groupCategory: 'Insumos', category: 'Descartables', unit: 'unidades' },
  { name: 'Guía V-14', groupCategory: 'Insumos', category: 'Descartables', unit: 'unidades' }
];

function getInventoryActionLogs() {
  const logs = (S.data?.audit || []).filter(a => a.entity === 'inventory' || String(a.action || '').startsWith('INVENTORY_'));
  const inv = S.data?.inventory || [];
  return logs.map(a => {
    const det = String(a.details || '');
    const item = inv.find(i => i.id === a.entityId);
    const parenMatch = det.match(/\(([^-()]+)\s*-\s*([^()]+)\)/);
    const cat = parenMatch ? parenMatch[1].trim() : (/medicamento|suero|antisept|f[aá]rmaco/i.test(item?.category || '') ? 'Fármacos' : 'Insumos');
    const subcat = parenMatch ? parenMatch[2].trim() : (item?.category || 'General');
    const prodMatch = det.match(/(?:de|ficha de|eliminó)\s+([^(.]+?)(?:\s*\(|$|\.)/);
    const product = item?.name || (prodMatch ? prodMatch[1].trim() : 'Insumo');

    let actionLabel = 'Movimiento';
    let badgeClass = 'gray';
    if (a.action === 'INVENTORY_STOCK_DEDUCTED' || /descontó/i.test(det)) {
      actionLabel = 'Descuento de Stock';
      badgeClass = 'amber';
    } else if (a.action === 'INVENTORY_LOT_CREATED') {
      actionLabel = 'Creación de Lote';
      badgeClass = 'green';
    } else if (a.action === 'INVENTORY_CREATED') {
      actionLabel = 'Alta de Insumo';
      badgeClass = 'green';
    } else if (a.action === 'INVENTORY_STOCK_ADJUSTED') {
      actionLabel = 'Ajuste de Stock';
      badgeClass = 'blue';
    } else if (a.action === 'INVENTORY_UPDATED') {
      actionLabel = 'Modificación';
      badgeClass = 'blue';
    } else if (a.action === 'INVENTORY_DELETED') {
      actionLabel = 'Eliminación';
      badgeClass = 'red';
    }
    return {
      id: a.id,
      createdAt: a.createdAt,
      actionCode: a.action,
      actionLabel,
      badgeClass,
      product,
      category: cat,
      subcategory: subcat,
      details: det,
      actor: a.actor || 'Sistema'
    };
  });
}

function inventoryView() {
  const inv = S.data?.inventory || [];
  const lowStock = inv.filter(i => i.quantity <= i.minQuantity);
  const outOfStock = inv.filter(i => i.quantity === 0);
  const totalUnits = inv.reduce((sum, i) => sum + i.quantity, 0);

  const categories = ['ALL', ...Array.from(new Set(inv.map(i => i.category))).filter(Boolean)];
  const currentCat = S.inventoryCategory || 'ALL';
  const search = (S.inventorySearch || '').toLowerCase().trim();

  const filtered = inv.filter(i => {
    const matchCat = currentCat === 'ALL' || i.category === currentCat;
    const matchSearch = !search || i.name.toLowerCase().includes(search) || (i.sku && i.sku.toLowerCase().includes(search)) || (i.notes && i.notes.toLowerCase().includes(search));
    return matchCat && matchSearch;
  });

  const allActionLogs = getInventoryActionLogs();
  const logSearch = (S.invLogSearch || '').toLowerCase().trim();
  const logActionFilter = S.invLogAction || 'ALL';
  const filteredLogs = allActionLogs.filter(l => {
    const matchAct = logActionFilter === 'ALL' || l.actionLabel === logActionFilter;
    const matchTxt = !logSearch || [l.actionLabel, l.product, l.category, l.subcategory, l.details, l.actor].some(x => String(x).toLowerCase().includes(logSearch));
    return matchAct && matchTxt;
  });

  const nowMs = Date.now();
  const expiringItems = inv.map(item => {
    if (!item.expiryDate) return null;
    const raw = String(item.expiryDate).trim();
    let d = new Date(raw.length === 7 ? `${raw}-01T00:00:00` : `${raw}T00:00:00`);
    if (isNaN(d.getTime())) d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    const daysLeft = Math.ceil((d.getTime() - nowMs) / 86400000);
    return { ...item, daysLeft, parsedExpiry: d };
  }).filter(x => x && x.daysLeft <= 120).sort((a, b) => a.daysLeft - b.daysLeft);

  return heading('Inventario e insumos', 'Control y gestión en tiempo real de insumos, lotes, materiales descartables, instrumental y fármacos.',
    btn('Crear Lote', 'new-inventory-lot', 'box') + btn('Nuevo Insumo', 'new-inventory', 'plus', 'primary')
  ) +
  `<div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    ${stat('Insumos registrados', inv.length, 'box', 'Catálogo de insumos')}
    ${stat('Stock bajo / crítico', lowStock.length, 'warning', `${lowStock.length} artículos requieren reposición`, lowStock.length > 0)}
    ${stat('Unidades disponibles', totalUnits, 'activity', 'Total de unidades en clínica')}
    ${stat('Agotados', outOfStock.length, 'close', outOfStock.length > 0 ? 'Reposición urgente' : 'Sin insumos agotados')}
  </div>

  <!-- Box sutil de lectura rápida IA sobre próximos vencimientos -->
  <div style="margin-bottom:16px;padding:11px 16px;border-radius:10px;border:1px solid ${expiringItems.some(x => x.daysLeft <= 30) ? '#fde68a' : '#d8e4da'};background:${expiringItems.some(x => x.daysLeft <= 30) ? '#fffdf5' : '#f8fbf9'};display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div class="flex" style="gap:10px;align-items:center;flex-wrap:wrap">
      <span style="width:28px;height:28px;border-radius:8px;background:${expiringItems.length ? '#fef3c7' : '#e6f4ea'};color:${expiringItems.length ? '#b45309' : '#1b4c37'};display:inline-flex;align-items:center;justify-content:center">
        ${icon('spark', 14)}
      </span>
      <div>
        <div style="font-size:12.5px;font-weight:700;color:#18362b;display:flex;align-items:center;gap:6px">
          Lectura Rápida IA · Monitoreo de Vencimientos de Lotes
          <span class="badge ${expiringItems.length ? 'amber' : 'green'}" style="font-size:10px">${expiringItems.length ? `${expiringItems.length} lote(s) próximos a vencer` : 'Sin vencimientos cercanos'}</span>
        </div>
        <div style="font-size:12px;color:#475569;margin-top:2px">
          ${expiringItems.length
            ? expiringItems.slice(0, 4).map(it => {
                const statusTxt = it.daysLeft < 0 ? `Vencido hace ${Math.abs(it.daysLeft)} días` : it.daysLeft === 0 ? 'Vence hoy' : `Vence en ${it.daysLeft} días (${it.expiryDate})`;
                return `<span style="display:inline-block;margin-right:12px">• <b>${esc(it.name)}</b> ${it.lotNumber ? `<span class="mono tiny">(Lote ${esc(it.lotNumber)})</span>` : ''}: <span style="color:${it.daysLeft <= 30 ? '#b45309' : '#334155'};font-weight:600">${esc(statusTxt)}</span></span>`;
              }).join('')
            : 'La IA analizó todas las fechas de vencimiento del inventario activo: ningún lote vence dentro de los próximos 120 días.'}
        </div>
      </div>
    </div>
    ${expiringItems.length ? `<span class="tiny muted">Priorizar rotación FEFO (Primero en Vencer, Primero en Salir)</span>` : ''}
  </div>

  <section class="panel">
    <div class="toolbar" style="justify-content:space-between">
      <div class="flex" style="flex-wrap:wrap;gap:10px">
        <div class="search-field">
          ${icon('search', 16)}
          <input type="search" placeholder="Buscar insumo por nombre, código o lote..." value="${esc(S.inventorySearch || '')}" data-action="search-inventory">
        </div>
        <div class="segmented">
          ${categories.map(c => `<button class="${currentCat === c ? 'active' : ''}" data-action="inventory-cat" data-value="${esc(c)}">${c === 'ALL' ? 'Todos los insumos' : esc(c)}</button>`).join('')}
        </div>
      </div>
    </div>
    ${filtered.length ? `<div class="table-wrap"><table>
      <thead>
        <tr>
          <th>Insumo / Descripción</th>
          <th>Categoría</th>
          <th>Stock Actual</th>
          <th>Alerta Mínima</th>
          <th>Estado de Stock</th>
          <th>Lote / Vencimiento</th>
          <th style="text-align:right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(item => {
          let badgeClass = 'green';
          let badgeLabel = 'Óptimo';
          if (item.quantity === 0) {
            badgeClass = 'red';
            badgeLabel = 'Agotado';
          } else if (item.quantity <= item.minQuantity) {
            badgeClass = 'amber';
            badgeLabel = 'Stock Bajo';
          }
          return `<tr>
            <td>
              <strong>${esc(item.name)}</strong>
              <div class="tiny muted mono">${esc(item.sku || 'S/C')}</div>
              ${item.notes ? `<div class="tiny muted" style="max-width:280px;white-space:normal">${esc(item.notes)}</div>` : ''}
            </td>
            <td><span class="badge gray">${esc(item.category)}</span></td>
            <td><b style="font-size:13px;color:var(--ink)">${item.quantity}</b> <span class="tiny muted">${esc(item.unit)}</span></td>
            <td><span class="muted">${item.minQuantity} ${esc(item.unit)}</span></td>
            <td><span class="badge ${badgeClass}"><i class="dot"></i>${badgeLabel}</span></td>
            <td>
              ${item.lotNumber ? `<div class="tiny mono">Lote: ${esc(item.lotNumber)}</div>` : ''}
              ${item.expiryDate ? `<div class="tiny muted">Vto: ${esc(item.expiryDate)}</div>` : '<span class="tiny muted">-</span>'}
            </td>
            <td>
              <div style="display:flex;gap:6px;justify-content:flex-end">
                <button class="btn small" data-action="adjust-stock" data-id="${item.id}" title="Ingresar o descontar unidades de stock">${icon('refresh', 13)} Ajustar Stock</button>
                <button class="icon-btn" data-action="edit-inventory" data-id="${item.id}" title="Editar detalles del insumo">${icon('edit', 14)}</button>
                <button class="icon-btn" data-action="delete-inventory" data-id="${item.id}" title="Eliminar insumo" style="color:#b24d45">${icon('close', 14)}</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>` : empty('Sin insumos', 'No se encontraron insumos con el filtro aplicado.')}
    <div class="panel-footer">
      <span>Mostrando ${filtered.length} de ${inv.length} insumos</span>
      <span class="flex" style="gap:5px">${lowStock.length > 0 ? `${icon('warning', 12)} ${lowStock.length} artículos requieren reposición` : `${icon('check', 12)} Stock general en niveles operativos`}</span>
    </div>
  </section>

  <section class="panel" style="margin-top:22px">
    <div class="panel-header" style="flex-wrap:wrap;gap:12px">
      <div>
        <h2>Registro de acciones</h2>
        <p class="panel-sub">Historial trazable de ingresos de lotes, descuentos automáticos de stock y movimientos de inventario.</p>
      </div>
      <div class="flex" style="flex-wrap:wrap;gap:8px">
        <div class="search-field" style="min-width:220px">
          ${icon('search', 14)}
          <input id="inv-log-search" type="search" placeholder="Buscar en toda la tabla..." value="${esc(S.invLogSearch || '')}" data-input="inv-log-search">
        </div>
        <select aria-label="Filtrar por acción" data-change="inv-log-action" style="min-height:36px;border-radius:8px;border:1px solid #dfe6df;padding:0 10px;font-size:12px;background:#fff">
          <option value="ALL" ${logActionFilter === 'ALL' ? 'selected' : ''}>Todas las acciones</option>
          <option value="Descuento de Stock" ${logActionFilter === 'Descuento de Stock' ? 'selected' : ''}>Descuento de Stock</option>
          <option value="Creación de Lote" ${logActionFilter === 'Creación de Lote' ? 'selected' : ''}>Creación de Lote</option>
          <option value="Alta de Insumo" ${logActionFilter === 'Alta de Insumo' ? 'selected' : ''}>Alta de Insumo</option>
          <option value="Ajuste de Stock" ${logActionFilter === 'Ajuste de Stock' ? 'selected' : ''}>Ajuste de Stock</option>
          <option value="Modificación" ${logActionFilter === 'Modificación' ? 'selected' : ''}>Modificación</option>
          <option value="Eliminación" ${logActionFilter === 'Eliminación' ? 'selected' : ''}>Eliminación</option>
        </select>
        <button class="btn small" data-action="export-inv-logs" title="Descargar movimientos en CSV">${icon('download', 13)} Exportar</button>
        <button class="icon-btn" data-action="refresh-inv-logs" title="Actualizar registro de acciones">${icon('refresh', 14)}</button>
      </div>
    </div>
    ${filteredLogs.length ? `<div class="table-wrap"><table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Acción</th>
          <th>Producto</th>
          <th>Categoría</th>
          <th>Subcategoría</th>
          <th>Detalle</th>
          <th>Responsable</th>
        </tr>
      </thead>
      <tbody>
        ${filteredLogs.map(l => `<tr>
          <td><span class="tiny">${fmtDate(l.createdAt, true)}</span><div class="tiny muted">${fmtTime(l.createdAt)}</div></td>
          <td><span class="badge ${l.badgeClass}">${esc(l.actionLabel)}</span></td>
          <td><strong>${esc(l.product)}</strong></td>
          <td><span class="badge gray">${esc(l.category)}</span></td>
          <td><span class="tiny muted">${esc(l.subcategory)}</span></td>
          <td style="white-space:normal;min-width:260px;max-width:420px;font-size:12.5px;color:#334155">${esc(l.details)}</td>
          <td><span class="tiny">${esc(l.actor)}</span></td>
        </tr>`).join('')}
      </tbody>
    </table></div>` : empty('Sin movimientos registrados', 'Los ingresos de lotes, ajustes manuales y descuentos automáticos de Hospital de Día aparecerán aquí.')}
    <div class="panel-footer">
      <span>${filteredLogs.length} movimiento(s) visible(s)</span>
      <span>Auditoría inmutable de stock e insumos</span>
    </div>
  </section>`;
}

const PAYMENT_CATEGORY_LABELS = {
  DEPOSIT: { label: 'Seña / Anticipo de Tratamiento', badge: 'amber', type: 'INCOME' },
  FULL_PAYMENT: { label: 'Pago Total de Tratamiento', badge: 'green', type: 'INCOME' },
  INSTALLMENT: { label: 'Cuota de Programa Clínico', badge: 'blue', type: 'INCOME' },
  CONSULTATION: { label: 'Consulta Médica', badge: 'green', type: 'INCOME' },
  SUPPLIES: { label: 'Compra de Insumos / Fármacos', badge: 'red', type: 'EXPENSE' },
  FEES: { label: 'Honorarios Profesionales', badge: 'red', type: 'EXPENSE' },
  OPERATING: { label: 'Gastos Operativos / Clínica', badge: 'red', type: 'EXPENSE' }
};

function billingView() {
  const allMovements = S.data.payments || [];
  const incomes = allMovements.filter(p => (p.movementType || 'INCOME') !== 'EXPENSE');
  const expenses = allMovements.filter(p => p.movementType === 'EXPENSE');
  const totalIncome = incomes.reduce((s, p) => s + p.amountCents / 100, 0);
  const totalExpense = expenses.reduce((s, p) => s + p.amountCents / 100, 0);
  const netBalance = totalIncome - totalExpense;
  const totalDeposits = incomes.filter(p => p.category === 'DEPOSIT').reduce((s, p) => s + p.amountCents / 100, 0);
  const totalFullTreatments = incomes.filter(p => p.category === 'FULL_PAYMENT' || p.category === 'INSTALLMENT').reduce((s, p) => s + p.amountCents / 100, 0);

  const drafts = S.data.invoices.reduce((s, p) => s + p.amountCents / 100, 0),
    quotes = S.data.quotes || [],
    totalQuotes = quotes.reduce((s, q) => s + (q.totalCents != null ? q.totalCents / 100 : Number(q.total || 0)), 0);

  const currentTab = S.billingTab || 'payments';
  const movFilter = S.paymentFilter || 'ALL';
  const filteredMovements = allMovements.filter(r => {
    const mType = r.movementType || 'INCOME';
    const cat = r.category || 'CONSULTATION';
    if (movFilter === 'INCOME') return mType !== 'EXPENSE';
    if (movFilter === 'EXPENSE') return mType === 'EXPENSE';
    if (movFilter === 'DEPOSIT') return cat === 'DEPOSIT';
    if (movFilter === 'FULL_PAYMENT') return cat === 'FULL_PAYMENT' || cat === 'INSTALLMENT';
    return true;
  });

  const arcaInteg = (S.data?.integrations || []).find(i => i.id === 'arca');
  const arcaConnected = Boolean(arcaInteg && arcaInteg.status === 'CONNECTED');

  return heading('Cobros, Facturación y Presupuestos', 'Control categorizado de ingresos (señas, pagos totales, cuotas), egresos operativos, facturación ARCA y presupuestos clínicos con IA.',
    btn('Programa / Presupuesto IA', 'new-quote', 'spark') +
    btn('Registrar Egreso', 'new-expense', 'wallet') +
    btn('Emitir Factura ARCA', 'new-invoice', 'file') +
    btn('Registrar Ingreso / Seña', 'new-payment', 'plus', 'primary')
  ) +
  `<div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    ${stat('Ingresos Totales', fmtMoney(totalIncome), 'wallet', `Señas: ${fmtMoney(totalDeposits)} · Tratamientos: ${fmtMoney(totalFullTreatments)}`, true)}
    ${stat('Egresos y Gastos', fmtMoney(totalExpense), 'activity', `${expenses.length} egreso(s) · Insumos, honorarios y operativos`)}
    ${stat('Balance Neto de Caja', fmtMoney(netBalance), 'checkcircle', `${incomes.length} ingresos vs ${expenses.length} egresos`)}
    ${stat('Presupuestos & ARCA', fmtMoney(totalQuotes), 'chart', `${quotes.length} presupuestos · Facturado ARCA: ${fmtMoney(drafts)}`)}
  </div>
  <section class="panel">
    <div class="between" style="padding:14px 20px 0;flex-wrap:wrap;gap:10px">
      <div class="financial-tabs" style="padding:0;border:none">
        <button class="btn small ${currentTab === 'payments' ? 'primary' : ''}" data-action="billing-tab" data-value="payments">Ingresos y Egresos (${allMovements.length})</button>
        <button class="btn small ${currentTab === 'quotes' ? 'primary' : ''}" data-action="billing-tab" data-value="quotes">Presupuestos Clínicos IA (${quotes.length})</button>
        <button class="btn small ${currentTab === 'invoices' ? 'primary' : ''}" data-action="billing-tab" data-value="invoices">Facturas Oficiales ARCA (${S.data.invoices.length})</button>
      </div>
      ${currentTab === 'payments' ? `
        <div class="flex" style="gap:6px;flex-wrap:wrap">
          <button class="chip ${movFilter === 'ALL' ? 'active' : ''}" data-action="payment-filter" data-val="ALL">Todos (${allMovements.length})</button>
          <button class="chip ${movFilter === 'INCOME' ? 'active' : ''}" data-action="payment-filter" data-val="INCOME">Ingresos (${incomes.length})</button>
          <button class="chip ${movFilter === 'DEPOSIT' ? 'active' : ''}" data-action="payment-filter" data-val="DEPOSIT">Señas / Anticipos</button>
          <button class="chip ${movFilter === 'FULL_PAYMENT' ? 'active' : ''}" data-action="payment-filter" data-val="FULL_PAYMENT">Pagos Totales / Cuotas</button>
          <button class="chip ${movFilter === 'EXPENSE' ? 'active' : ''}" data-action="payment-filter" data-val="EXPENSE">Egresos (${expenses.length})</button>
        </div>
      ` : ''}
    </div>
    ${currentTab === 'quotes' ? `
      ${quotes.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Fecha / Validez</th><th>N° Presupuesto</th><th>Paciente</th><th>Programa / Tratamiento</th><th>Inversión Total</th><th>Estado</th><th style="text-align:right">Acciones</th></tr></thead>
        <tbody>
          ${quotes.map(q => {
            const pat = patientBy(q.patientId);
            const pName = nameOf(pat);
            const statusColor = q.status === 'APPROVED' ? 'green' : q.status === 'REJECTED' ? 'red' : 'amber';
            const statusLabel = q.status === 'APPROVED' ? 'Aprobado' : q.status === 'REJECTED' ? 'Rechazado' : 'Pendiente';
            const qTotal = q.totalCents != null ? q.totalCents / 100 : Number(q.total || 0);
            const qNum = q.quoteNumber || q.number || q.id.slice(0, 8);
            const isSig = String(q.notes || '').includes('SIGNATURE_PROGRAM') || /signature|programa|etapa/i.test(q.title || '');
            return `<tr>
              <td>${fmtDate(q.createdAt, true)}<div class="tiny muted">Vence: ${fmtDate(q.validUntil, true)}</div></td>
              <td><strong>${esc(qNum)}</strong>${isSig ? `<div class="tiny" style="color:#1b4c37;font-weight:700">✦ Programa Signature IA</div>` : ''}</td>
              <td><strong>${esc(pName)}</strong><div class="tiny muted">${esc(pat?.coverage || 'Particular')}</div></td>
              <td><strong>${esc(q.title)}</strong><div class="tiny muted">${(q.items || []).length} terapia(s) / ítem(s) detallado(s)</div></td>
              <td><strong>${fmtMoney(qTotal)}</strong><div class="tiny muted">3 cuotas (+10%): ${fmtMoney(Math.round(qTotal * 1.10 / 3))}/mes</div></td>
              <td><span class="badge ${statusColor}">${statusLabel}</span></td>
              <td>
                <div style="display:flex;gap:6px;justify-content:flex-end">
                  <button class="btn small" data-action="print-quote" data-id="${q.id}" title="Ver / Descargar Programa y Presupuesto en PDF">${icon('file', 13)} Ver PDF</button>
                  <button class="btn small" data-action="share-quote-wa" data-id="${q.id}" title="Enviar Presupuesto por WhatsApp">${icon('phone', 13)} WhatsApp</button>
                  ${q.status !== 'APPROVED' ? `<button class="btn small primary" data-action="approve-quote" data-id="${q.id}" title="Marcar presupuesto como Aprobado">${icon('checkcircle', 13)} Aprobar</button>` : ''}
                  <button class="btn small danger" data-action="delete-quote" data-id="${q.id}" title="Eliminar presupuesto">${icon('close', 13)} Eliminar</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>` : empty('Sin presupuestos emitidos', 'Crea un presupuesto estándar o un Programa Clínico Integral estilo Signature con apoyo de IA.', btn('Crear Programa / Presupuesto IA', 'new-quote', 'spark', 'primary'))}
    ` : currentTab === 'payments' ? `
      ${filteredMovements.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Paciente / Destinatario</th><th>Método / Referencia</th><th>Importe</th><th>Estado</th></tr></thead>
        <tbody>
          ${filteredMovements.map(r => {
            const isExp = r.movementType === 'EXPENSE';
            const catCode = r.category || (isExp ? 'SUPPLIES' : 'CONSULTATION');
            const catMeta = PAYMENT_CATEGORY_LABELS[catCode] || { label: catCode, badge: isExp ? 'red' : 'green' };
            const pat = r.patientId ? patientBy(r.patientId) : null;
            return `<tr>
              <td>${fmtDate(r.createdAt, true)}<div class="tiny muted">${fmtTime(r.createdAt)}</div></td>
              <td><span class="badge ${isExp ? 'red' : 'green'}">${isExp ? '↓ Egreso' : '↑ Ingreso'}</span></td>
              <td><span class="badge ${catMeta.badge}">${esc(catMeta.label)}</span></td>
              <td><strong>${esc(pat ? nameOf(pat) : (isExp ? 'Proveedor / Clínica' : 'Paciente General'))}</strong></td>
              <td>${esc(r.method || r.concept || 'TRANSFERENCIA')}<div class="tiny muted">${esc(r.reference || '')}</div></td>
              <td><strong style="color:${isExp ? '#b91c1c' : '#15803d'}">${isExp ? '- ' : '+ '}${fmtMoney(r.amountCents / 100)}</strong></td>
              <td><span class="badge ${isExp ? 'gray' : 'green'}">${isExp ? 'Imputado' : 'Cobrado'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>` : empty('Sin movimientos en este filtro', 'Registra ingresos (señas, pagos totales de tratamiento, consultas) o egresos operativos.')}
    ` : `
      ${!arcaConnected ? `
        <div style="background:#fffbeb;border:1px solid #fde68a;padding:12px 16px;border-radius:8px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:12px">
          <div>
            <strong style="color:#92400e;display:flex;align-items:center;gap:6px">${icon('warning', 16)} Canal fiscal ARCA (ex AFIP) desconectado</strong>
            <div class="tiny" style="color:#b45309;margin-top:2px">Para emitir facturas fiscales oficiales con CAE y código QR normativo, debes configurar y activar las credenciales de ARCA en Integraciones.</div>
          </div>
          <button class="btn small" data-action="config-integration" data-id="arca" style="white-space:nowrap;font-weight:600">Configurar ARCA</button>
        </div>
      ` : ''}
      ${S.data.invoices.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Comprobante</th><th>Paciente</th><th>Concepto</th><th>Importe</th><th>Estado / ARCA</th><th style="text-align:right">Acciones</th></tr></thead>
        <tbody>
          ${S.data.invoices.map(r => {
            const pat = patientBy(r.patientId);
            const pName = nameOf(pat);
            const pDoc = pat?.dni ? `DNI ${pat.dni}` : 'Consumidor Final';
            const pto = r.invoiceNumber ? r.invoiceNumber : `00001-${String(r.id).slice(0, 8)}`;
            return `<tr>
              <td>${fmtDate(r.createdAt, true)}<div class="tiny muted">${fmtTime(r.createdAt)}</div></td>
              <td><strong>Factura ${esc(r.invoiceType || 'B')}</strong><div class="tiny muted mono">N° ${esc(pto)}</div></td>
              <td><strong>${esc(pName)}</strong><div class="tiny muted">${esc(pDoc)}</div></td>
              <td>${esc(r.concept)}</td>
              <td><strong>${fmtMoney(r.amountCents / 100)}</strong></td>
              <td>
                <span class="badge green" title="Comprobante fiscal electrónico con CAE emitido"><i class="dot"></i>ARCA Autorizado</span>
                ${r.cae ? `<div class="tiny muted mono" style="margin-top:2px;font-size:10px">CAE: ${r.cae}</div>` : ''}
              </td>
              <td>
                <div style="display:flex;gap:6px;justify-content:flex-end">
                  <button class="btn small" data-action="print-invoice" data-id="${r.id}" title="Ver / Descargar comprobante oficial e imprimir">${icon('file', 13)} Ver Factura</button>
                  <button class="btn small" data-action="share-invoice-wa" data-id="${r.id}" title="Compartir comprobante por WhatsApp">${icon('phone', 13)} WhatsApp</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>` : (!arcaConnected ? empty('Canal fiscal ARCA no conectado', 'No hay facturas emitidas. Las facturas fiscales electrónicas oficiales requieren conectar tu CUIT y Punto de Venta en Integraciones.', btn('Configurar ARCA', 'config-integration', 'settings', 'primary', 'data-id="arca"')) : empty('Sin registros', 'No hay facturas emitidas en este período.', btn('Emitir Factura ARCA', 'new-invoice', 'file', 'primary')))}
    `}
    <div class="panel-footer">
      <span>Moneda: ARS (Pesos Argentinos) · Módulo Financiero Categorizado (Ingresos, Señas, Pagos Totales y Egresos)</span>
      <span>${currentTab === 'quotes' ? quotes.length : currentTab === 'payments' ? filteredMovements.length : S.data.invoices.length} operaciones</span>
    </div>
  </section>`;
}

function analyticsView() {
  const a = S.data.appointments.filter(a => a.status !== 'CANCELLED'),
    done = a.filter(a => a.status === 'COMPLETED').length,
    noShows = a.filter(a => a.status === 'NO_SHOW').length,
    conv = S.data.leads.filter(l => l.status === 'CONVERTED').length;
  const eligible = done + noShows;

  return heading('Rendimiento y Métricas', 'Indicadores operativos de ocupación, atención médica y conversión de pacientes.') +
  `<div class="stats">
    ${stat('Turnos agendados', a.length, 'calendar', 'Total de turnos')}
    ${stat('Turnos atendidos', done, 'checkcircle', 'Consultas completadas')}
    ${stat('Tasa de asistencia', `${eligible ? Math.round(done / eligible * 100) : 100}%`, 'clock', `${done} asistidos / ${eligible} programados`)}
    ${stat('Conversión de consultas', `${S.data.leads.length ? Math.round(conv / S.data.leads.length * 100) : 0}%`, 'chart', `${conv} convertidos a pacientes`, true)}
  </div>
  <div class="settings-grid">
    <section class="panel">
      <div class="panel-header"><h2>Embudo de Contactos y Consultas</h2></div>
      <div class="panel-body">
        ${['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'].map(s => {
          const n = S.data.leads.filter(l => l.status === s).length;
          return `<div class="funnel-row">
            <div class="between"><span>${statusMap[s][0]}</span><b>${n}</b></div>
            <div class="bar"><span style="width:${S.data.leads.length ? n / S.data.leads.length * 100 : 0}%"></span></div>
          </div>`;
        }).join('')}
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>Distribución de Pacientes</h2></div>
      <div class="panel-body">
        <div class="attention-row"><div class="grow"><h4>Pacientes activos</h4><p>En tratamiento o seguimiento periódico.</p></div><b>${S.data.patients.filter(p => p.status === 'ACTIVE').length}</b></div>
        <div class="attention-row"><div class="grow"><h4>Altas médicas</h4><p>Tratamientos concluidos exitosamente.</p></div><b>${S.data.patients.filter(p => p.status === 'DISCHARGED').length}</b></div>
      </div>
    </section>
  </div>`;
}

// ==========================================
// PORTAL SUPERADMIN: VISTAS CENTRALES
// ==========================================

function adminView() {
  const a = S.admin;
  if (!a) return '<div class="loading-overlay">Cargando portal Super Admin…</div>';
  return heading('Espacios Clínicos Registrados', 'Control centralizado de clínicas, sedes y consultorios independientes.', btn('Alta de nueva clínica', 'new-workspace', 'plus', 'primary'), 'PORTAL SUPER ADMIN') +
  `<div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    ${stat('Clínicas activas', a.workspaces.length, 'building', 'Instancias aisladas en el sistema')}
    ${stat('Pacientes totales', a.stats?.totalPatients || 0, 'users', 'Base integral agregada')}
    ${stat('Turnos procesados', a.stats?.totalAppointments || 0, 'calendar', 'Volumen total de citas')}
    ${stat('Conexiones activas', `${a.integrations?.filter(i => i.status === 'CONNECTED').length || 0} / ${a.integrations?.length || 5}`, 'plug', 'Servicios sincronizados', true)}
  </div>
  <section class="panel">
    <div class="panel-header">
      <h2>Clínicas en la plataforma</h2>
      <span class="superadmin-badge">Multi-tenant Activo</span>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Clínica</th><th>Pacientes</th><th>Turnos</th><th>Zona horaria</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>
        ${a.workspaces.map(w => `<tr>
          <td><strong>${esc(w.name)}</strong><div class="mono muted">ID: ${esc(w.id)}</div></td>
          <td><b>${w.patientCount}</b> pacientes</td>
          <td><b>${w.appointmentCount}</b> turnos</td>
          <td>${esc(w.timezone)}</td>
          <td>${w.status === 'PAUSED' ? '<span class="badge amber"><i class="dot"></i> Pausada</span>' : '<span class="badge green"><i class="dot online"></i> Operativa</span>'}</td>
          <td>
            <div class="flex" style="gap:6px">
              <button class="btn small primary" data-action="manage-clinic" data-id="${w.id}" data-name="${esc(w.name)}" title="Ingresar a configurar integraciones y GHL para esta clínica">
                ${icon('settings', 13)} Gestionar Clínica & GHL
              </button>
              <button class="btn small" data-action="toggle-ws-status" data-id="${w.id}" data-status="${w.status || 'ACTIVE'}" title="${w.status === 'PAUSED' ? 'Reanudar acceso' : 'Pausar clínica temporalmente'}">
                ${w.status === 'PAUSED' ? icon('check', 13) + ' Reanudar' : icon('clock', 13) + ' Pausar'}
              </button>
              <button class="btn small danger" data-action="delete-workspace" data-id="${w.id}" data-name="${esc(w.name)}" title="Eliminar cliente permanentemente">
                ${icon('close', 13)} Eliminar
              </button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </section>`;
}

function integrationsView() {
  const integrations = S.admin?.integrations || S.data?.integrations || [];
  return heading('Conexiones e Integraciones', 'Configura y gestiona las pasarelas y servicios externos de la plataforma.', '', 'PORTAL SUPER ADMIN') +
  `<div class="integration-grid">
    ${integrations.map(i => `<section class="panel integration-card">
      <div class="between">
        <div class="integration-logo">${esc(i.initials)}</div>
        ${badge(i.status)}
      </div>
      <h2>${esc(i.name)}</h2>
      <span class="tiny muted">${esc(i.category)}</span>
      <p>${esc(i.description)}</p>
      ${btn(i.status === 'CONNECTED' ? 'Configuración activa' : 'Configurar conexión', 'config-integration', 'settings', i.status === 'CONNECTED' ? 'primary' : '', `data-id="${i.id}"`)}
    </section>`).join('')}
  </div>`;
}

function auditView() {
  const logs = S.admin?.audit || S.data?.audit || [];
  return heading('Auditoría del Sistema', 'Registro inmutable de eventos, accesos y modificaciones administrativas.') +
  `<section class="panel">
    <div class="panel-header"><h2>Registro de Eventos y Actividad</h2><span class="tiny muted">${logs.length} eventos recientes</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Fecha y hora</th><th>Acción</th><th>Responsable</th><th>Detalle</th></tr></thead>
      <tbody>
        ${logs.map(a => `<tr>
          <td>${fmtDate(a.createdAt, true)} · ${fmtTime(a.createdAt)}</td>
          <td><strong>${esc(auditLabels[a.action] || a.action)}</strong></td>
          <td>${esc(a.actor)}</td>
          <td style="white-space:normal;max-width:350px">${esc(a.details || 'Operación administrativa')}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </section>`;
}

function settingsView() {
  const cfg = S.data?.settings || { pauseAssistant: false, pauseWebhooks: false, pauseBilling: false };
  return heading('Configuración General', 'Parámetros del sistema y políticas operativas.') +
  `<div class="settings-grid">
    <section class="panel">
      <div class="panel-header"><h2>Políticas Operativas</h2>${icon('shield', 19)}</div>
      <div class="panel-body">
        ${[
          ['pauseAssistant', 'Asistente Clínico IA', 'Habilita o pausa el asistente conversacional para el personal.'],
          ['pauseWebhooks', 'Recepción de Webhooks', 'Control de eventos entrantes de pasarelas y CRM.'],
          ['pauseBilling', 'Facturación Externa', 'Emisión electrónica directa de comprobantes.']
        ].map(([k, t, d]) => `<div class="setting-row">
          <div class="grow"><h3>${t}</h3><p>${d}</p></div>
          <button class="switch ${cfg[k] ? 'on' : ''}" role="switch" aria-checked="${cfg[k]}" aria-label="${t}" data-action="setting-toggle" data-key="${k}"></button>
        </div>`).join('')}
      </div>
    </section>
    <div class="stack">
      <section class="panel">
        <div class="panel-header"><h2>Seguridad e Infraestructura</h2></div>
        <div class="panel-body">
          <div class="detail-label">Motor de Base de Datos</div>
          <p class="detail-value">PostgreSQL Cloud Multi-Tenant con RLS (o SQLite WAL local)</p>
          <div class="spacer"></div>
          <div class="detail-label">Criptografía</div>
          <p class="detail-value">SHA-256 Hash Chain para historias clínicas inmutables</p>
          <div class="spacer"></div>
          <div class="detail-label">Sesiones</div>
          <p class="detail-value">Tokens con cookies HttpOnly y protección CSRF</p>
        </div>
      </section>
    </div>
  </div>`;
}

// ==========================================
// FORMULARIOS Y MODALES DE CONFIGURACIÓN
// ==========================================

async function navigate(view, push = true) {
  if (view === 'portal') {
    S.view = 'portal';
    S.mobile = false;
    if (!PREVIEW && push) history.pushState({}, '', paths[view] || '/portal');
    if (S.portal?.token && !S.portal?.data) await refreshPortal();
    render();
    window.scrollTo(0, 0);
    return;
  }
  const isAdmin = S.session?.user?.role === 'SUPER_ADMIN';
  if (isAdmin && !S.supportMode && !['admin', 'integrations', 'audit', 'settings'].includes(view)) {
    view = 'admin';
  }
  if (!isAdmin && ['admin'].includes(view)) {
    view = 'home';
  }
  S.view = view;
  S.mobile = false;
  if (!PREVIEW && push) history.pushState({}, '', paths[view] || '/');
  render();
  window.scrollTo(0, 0);
}

async function refresh() {
  if (S.session?.user?.role === 'SUPER_ADMIN' && !S.supportMode) {
    S.admin = await api('/api/admin');
    S.admin.audit = await api('/api/admin/audit');
  } else {
    S.data = await api('/api/state');
  }
}

function closeModal() {
  const m = $('#modal');
  if (m.open) m.close();
  m.innerHTML = '';
  m.className = '';
}

function showModal(title, subtitle, body, footer = '', cls = '') {
  const m = $('#modal');
  if (m.open) m.close();
  m.className = cls;
  m.innerHTML = `<div class="dialog-header">
    <div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div>
    <button class="icon-btn" data-action="close-modal" aria-label="Cerrar">${icon('close', 19)}</button>
  </div>
  <div class="dialog-body">${body}</div>
  ${footer}`;
  m.showModal();
}

function formDialog(kind, title, subtitle, fields, submitLabel = 'Guardar', extra = '', cls = '') {
  showModal(title, subtitle, `<form data-form="${kind}" ${extra}>
    <div class="form-grid">${fields}</div>
    <div class="form-error" role="alert"></div>
    <div class="dialog-actions">
      ${btn('Cancelar', 'close-modal', '', '', 'type="button"')}
      <button class="btn primary" type="submit">${icon('check', 15)} ${esc(submitLabel)}</button>
    </div>
  </form>`, '', cls);
}

function field(label, name, type = 'text', value = '', attrs = '', full = false) {
  return `<div class="form-field ${full ? 'full' : ''}"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" value="${esc(value)}" ${attrs}></div>`;
}

function area(label, name, value = '', attrs = '', full = true) {
  return `<div class="form-field ${full ? 'full' : ''}"><label for="field-${name}">${label}</label><textarea id="field-${name}" name="${name}" ${attrs}>${esc(value)}</textarea></div>`;
}

function selectField(label, name, options, selected = '', full = false) {
  return `<div class="form-field ${full ? 'full' : ''}"><label for="field-${name}">${label}</label><select id="field-${name}" name="${name}" required>${options.map(([v, l]) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
}

function patientSelect(selected = '') {
  return selectField('Paciente', 'patientId', (S.data?.patients || []).map(p => [p.id, nameOf(p)]), selected || S.selectedPatient || S.data?.patients[0]?.id, true);
}

function patientForm(id) {
  const p = id ? patientBy(id) : {};
  const mh = p.medicalHistory || {};
  formDialog(id ? 'edit-patient' : 'patient', id ? 'Editar Paciente' : 'Nuevo Paciente', 'Ficha administrativa y datos de contacto.',
    field('Nombre *', 'firstName', 'text', p.firstName || '', 'required maxlength="80"') +
    field('Apellido', 'lastName', 'text', p.lastName || '', 'maxlength="80"') +
    field('Fecha de Nacimiento', 'birthDate', 'date', p.birthDate || '', '') +
    field('Documento (DNI) *', 'dni', 'text', p.dni || '', 'required maxlength="40"') +
    field('CUIT / CUIL', 'cuitCuil', 'text', p.cuitCuil || '', 'maxlength="40" placeholder="Ej: 20-12345678-9"') +
    field('Teléfono *', 'phone', 'tel', p.phone || '', 'required minlength="6" maxlength="30" placeholder="+54 11 4000-0000"') +
    field('Correo electrónico', 'email', 'email', p.email || '', 'maxlength="254"') +
    field('Obra Social / Cobertura Médica *', 'coverage', 'text', p.coverage || 'Particular', 'required maxlength="100" placeholder="Ej: OSDE, Swiss Medical, Galeno, Particular"') +
    field('Número de Afiliado / Credencial', 'affiliateNumber', 'text', p.affiliateNumber || '', 'maxlength="60" placeholder="Ej: 12345678/01"') +
    field('Alergias Conocidas (o "Sin alergias")', 'allergies', 'text', mh.allergies || '', 'placeholder="Ej: Penicilina, AINEs, Dipirona"') +
    area('Observaciones clínicas / administrativas', 'notes', p.notes || '', 'maxlength="2000"'),
    id ? 'Guardar cambios' : 'Registrar paciente',
    id ? `data-id="${id}"` : ''
  );
}

function medicalHistoryDialog(id) {
  const p = patientBy(id);
  if (!p) return;
  const mh = p.medicalHistory || {};
  formDialog('medical-history', `Antecedentes Médicos · ${nameOf(p)}`, 'Registro permanente de factores de riesgo, alergias y antecedentes médicos (Ley 26.529).',
    field('Alergias Medicamentosas / Sustancias * (Destacado)', 'allergies', 'text', mh.allergies || '', 'placeholder="Ej: Penicilina, AINEs, Dipirona, Látex (o \'Sin alergias conocidas\')"', true) +
    area('Patologías Crónicas / Comorbilidades', 'pathological', mh.pathological || '', 'placeholder="Ej: Hipertensión arterial esencial, Diabetes tipo 2, Asma..." maxlength="2000"', false) +
    area('Medicación Habitual de Uso Continuo', 'medications', mh.medications || '', 'placeholder="Ej: Enalapril 10mg/12h, Levotiroxina 75mcg..." maxlength="2000"', false) +
    area('Cirugías e Internaciones Previas', 'surgical', mh.surgical || '', 'placeholder="Ej: Apendicectomía (2018), Colecistectomía..." maxlength="2000"', false) +
    area('Antecedentes Heredofamiliares', 'familyHistory', mh.familyHistory || '', 'placeholder="Ej: Padre con IAM a los 55 años, madre con HTA..." maxlength="2000"', false) +
    field('Hábitos e Inmunizaciones', 'habits', 'text', mh.habits || '', 'placeholder="Ej: No tabaquista, alcohol social ocasional, vacunación al día..."', true),
    'Guardar Antecedentes Médicos',
    `data-id="${id}"`, 'wide'
  );
}

function consentDialog(patientId) {
  const p = patientBy(patientId);
  if (!p) return;
  const templates = {
    SURGERY: {
      title: 'Consentimiento para Cirugía Menor Ambulatoria y Procedimientos Quirúrgicos',
      text: `Por la presente, el/la paciente ${nameOf(p)} (DNI ${p.dni || '—'}), manifiesta en forma libre, voluntaria y consciente haber recibido de su profesional médico tratante información detallada, clara y adecuada respecto a la práctica quirúrgica o procedimiento programado.\n\n1. OBJETIVOS Y BENEFICIOS: Se me han explicado acabadamente los propósitos diagnósticos y terapéuticos del procedimiento, así como las metas esperadas para la recuperación de mi salud.\n\n2. RIESGOS PREVISIBLES Y COMPLICACIONES: He sido advertido/a de los riesgos comunes inherentes al procedimiento (tales como dolor local, edema, hematoma, hemorragia postoperatoria menor, dehiscencia de sutura, infección de sitio quirúrgico y cicatrización anómala o hipertrófica), así como riesgos infrecuentes pero de mayor gravedad que requieran medidas complementarias.\n\n3. ALTERNATIVAS TERAPÉUTICAS: Se me han informado las opciones alternativas disponibles con sus respectivos alcances y consecuencias en caso de no realizarse la práctica.\n\n4. DERECHO A REVOCACIÓN (Ley 26.529 Art. 10): Tengo pleno conocimiento de que puedo revocar este consentimiento en cualquier momento previo a la iniciación del procedimiento sin que ello afecte mi posterior atención médica.\n\nConforme a la Ley Nacional 26.529 de Derechos del Paciente, presto mi expresa conformidad.`
    },
    ANESTHESIA: {
      title: 'Consentimiento Informado para Actos de Anestesia Local y Sedación',
      text: `El/la paciente ${nameOf(p)} (DNI ${p.dni || '—'}), declara haber sido informado/a por el equipo profesional sobre los fármacos y técnicas anestésicas a emplear (anestesia infiltrativa local / sedación consciente).\n\nHe respondido con veracidad sobre antecedentes de alergias a anestésicos locales, medicación previa y ayuno.\n\nComprendo los riesgos potenciales transitorios (mareos, hipotensión, dolor en el sitio de inyección o reacción vasovagal) y otorgo mi consentimiento para la administración de los agentes anestésicos requeridos conforme a la Ley 26.529.`
    },
    AESTHETIC: {
      title: 'Consentimiento para Tratamientos de Medicina Estética e Invasivos No Quirúrgicos',
      text: `El/la paciente ${nameOf(p)} (DNI ${p.dni || '—'}), presta su conformidad para la realización del tratamiento estético/médico acordado.\n\nDeclaro haber comprendido que los resultados dependen de factores biológicos individuales, habiendo recibido indicaciones precisas sobre cuidados pre y post procedimiento (exposición solar, actividad física y pautas de alarma).\n\nConsiento la aplicación conforme a las buenas prácticas médicas y la Ley 26.529.`
    },
    BIOPSY: {
      title: 'Consentimiento Informado para Toma de Biopsias y Estudios Diagnósticos Invasivos',
      text: `El/la paciente ${nameOf(p)} (DNI ${p.dni || '—'}), consiente la extracción de muestras tisulares o biológicas para su posterior procesamiento anatomopatológico y diagnóstico citológico.\n\nSe me han comunicado las precauciones hemostáticas y cuidados de la zona intervenida conforme a la Ley 26.529.`
    },
    TELEHEALTH: {
      title: 'Consentimiento para Atención Médica General, Telemedicina y Protección de Datos',
      text: `El/la paciente ${nameOf(p)} (DNI ${p.dni || '—'}), consiente la atención médica integral y la custodia confidencial de sus datos sensibles en la Historia Clínica Electrónica de la institución, en los términos de la Ley 25.326 de Protección de Datos Personales y Ley 26.529.`
    }
  };

  const initial = templates.SURGERY;
  formDialog('consent', 'Nuevo Consentimiento Informado Bilateral', `Paciente: ${nameOf(p)} · Ley 26.529`,
    selectField('Plantilla Normativa (Ley 26.529 de Derechos del Paciente)', 'type', [
      ['SURGERY', 'Cirugía Menor Ambulatoria / Procedimiento Quirúrgico'],
      ['ANESTHESIA', 'Actos de Anestesia Local y Sedación'],
      ['AESTHETIC', 'Tratamiento de Medicina Estética / Láser / Invasivo'],
      ['BIOPSY', 'Punción y Toma de Biopsias Diagnósticas'],
      ['TELEHEALTH', 'Atención Médica General, Telemedicina y Datos (Ley 25.326)']
    ], 'SURGERY', true) +
    selectField('Profesional interviniente', 'doctorId', (S.data?.doctors || []).map(d => [d.id, `${d.name} (${d.specialty})`]), S.doctor || S.data?.doctors?.[0]?.id, true) +
    field('Título del documento', 'title', 'text', initial.title, 'required maxlength="200"', true) +
    area('Cláusulas y Declaración Médica Legal', 'content', initial.text, 'required maxlength="10000"', false) +
    `<div class="form-field full">
      <label>Firma Ológrafa Digitalizada del Paciente / Representante (Ley 26.529)</label>
      <div class="sig-canvas-box">
        <canvas id="patient-sig-pad" class="sig-canvas" width="460" height="130"></canvas>
        <div class="between" style="margin-top:6px">
          <span class="tiny muted">Firme aquí con el dedo en pantalla táctil o con el cursor del mouse.</span>
          <button type="button" class="btn small" id="clear-sig-btn">Borrar trazo</button>
        </div>
      </div>
      <input type="hidden" name="patientSignature" id="patient-signature-input">
    </div>
    <div class="form-field full">
      <label class="inline">
        <input type="checkbox" name="confirmed" required checked>
        <span>El paciente y el profesional han rubricado la conformidad médica libre e informada conforme a la Ley 26.529.</span>
      </label>
    </div>`,
    'Emitir y Firmar Consentimiento Bipartito',
    `data-patient-id="${p.id}"`, 'wide'
  );

  setTimeout(() => {
    $('#field-type')?.addEventListener('change', e => {
      const chosen = templates[e.target.value] || templates.PROCEDURE;
      if ($('#field-title')) $('#field-title').value = chosen.title;
      if ($('#field-content')) $('#field-content').value = chosen.text;
    });

    const canvas = $('#patient-sig-pad');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1b4c37';
      let drawing = false, hasDrawn = false;

      const getPos = e => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
      };

      const startDraw = e => {
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        if (e.cancelable) e.preventDefault();
      };

      const draw = e => {
        if (!drawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        hasDrawn = true;
        if (e.cancelable) e.preventDefault();
      };

      const endDraw = () => {
        if (!drawing) return;
        drawing = false;
        if (hasDrawn && $('#patient-signature-input')) {
          $('#patient-signature-input').value = canvas.toDataURL('image/png');
        }
      };

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', endDraw);
      canvas.addEventListener('mouseleave', endDraw);

      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', endDraw);
      canvas.addEventListener('touchcancel', endDraw);

      $('#clear-sig-btn')?.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn = false;
        if ($('#patient-signature-input')) $('#patient-signature-input').value = '';
      });
    }
  }, 50);
}

function agendaForm() {
  formDialog('agenda', 'Nueva Agenda Paralela', 'Crea una agenda independiente (administrativa, quirúrgica o médica).',
    field('Nombre de la agenda *', 'name', 'text', '', 'required maxlength="100" placeholder="Ej: Agenda Administrativa, Quirófano 1, Estética..."') +
    selectField('Tipo de agenda', 'type', [
      ['ADMINISTRATIVE', 'Administrativa / Gestiones de Recepción'],
      ['SURGERY', 'Quirófano / Procedimientos Quirúrgicos'],
      ['MEDICAL', 'Consultorios Médicos / Atención Clínica'],
      ['AESTHETIC', 'Estética / Cosmiatría'],
      ['GENERAL', 'General / Otros']
    ], 'ADMINISTRATIVE') +
    selectField('Color distintivo', 'color', [
      ['#2563eb', 'Azul Administrativo (#2563eb)'],
      ['#dc2626', 'Rojo Quirúrgico (#dc2626)'],
      ['#1b4c37', 'Verde Médico (#1b4c37)'],
      ['#7c3aed', 'Púrpura Estética (#7c3aed)'],
      ['#ea580c', 'Naranja Prioritario (#ea580c)']
    ], '#2563eb') +
    area('Descripción u observaciones', 'description', '', 'maxlength="500" placeholder="Propósito u observaciones de esta agenda..."'),
    'Crear agenda'
  );
}

function appointmentForm(opts = {}) {
  if (!S.data?.patients?.length) return patientForm();
  const existing = opts.id ? S.data.appointments.find(a => a.id === opts.id) : null;
  const date = existing ? dateKey(existing.startAt) : (opts.date || S.date),
    time = existing ? fmtTime(existing.startAt) : (opts.time || '09:00');
  const agendas = S.data?.agendas?.length ? S.data.agendas : [
    { id: 'ag-med', name: 'Consultorios Médicos' },
    { id: 'ag-adm', name: 'Agenda Administrativa' },
    { id: 'ag-surg', name: 'Quirófano / Procedimientos' }
  ];
  const fields = patientSelect(existing?.patientId || opts.patientId) +
    selectField('Agenda de Destino', 'agendaId', agendas.map(a => [a.id, a.name]), existing?.agendaId || opts.agendaId || (S.selectedAgenda !== 'ALL' ? S.selectedAgenda : agendas[0]?.id), true) +
    selectField('Profesional responsable', 'doctorId', S.data.doctors.map(d => [d.id, d.name]), existing?.doctorId || opts.doctorId || S.doctor || S.data.doctors[0]?.id, true) +
    field('Fecha', 'date', 'date', date, 'required') +
    field('Hora', 'time', 'time', time, 'required step="900"') +
    selectField('Duración estimada', 'duration', [['15', '15 minutos'], ['30', '30 minutos'], ['45', '45 minutos'], ['60', '60 minutos']], String(existing?.duration || 30)) +
    selectField('Tipo de atención', 'type', Object.entries(types), existing?.type || 'CONSULTATION') +
    area('Nota de agendamiento', 'notes', existing?.notes || opts.notes || '', 'maxlength="2000"');

  formDialog(existing ? 'reschedule' : 'appointment', existing ? 'Reprogramar Turno' : 'Agendar Turno', 'Coordinación de cita con validación horaria.', fields, existing ? 'Guardar reprogramación' : 'Confirmar turno', existing ? `data-id="${existing.id}"` : '');
  if (existing) $('#field-patientId').disabled = true;
}

function appointmentDetail(id) {
  const a = S.data.appointments.find(x => x.id === id);
  if (!a) return;
  const p = patientBy(a.patientId);
  const mh = p?.medicalHistory || {};
  const hasAllergies = Boolean(mh.allergies && !/^(ninguna|no refiere|no reporta|sin alergias|no tiene)$/i.test(mh.allergies.trim()));

  formDialog('appointment-status', 'Detalle del Turno', `${fmtDate(a.startAt)} · ${fmtTime(a.startAt)} hs`,
    `<div class="form-field full"><div class="patient-hero" style="margin-bottom:2px">${avatar(nameOf(p), 0, true)}<div><h2>${esc(nameOf(p))}</h2><p class="muted text-sm">${esc(types[a.type])} · ${a.duration} min</p></div></div></div>
    ${hasAllergies ? `
      <div class="form-field full">
        <div class="allergies-alert">
          <div class="flex" style="gap:8px">
            <span class="alert-pulse">${icon('warning', 16)}</span>
            <div><strong style="font-size:11px;color:#9e3223">ALERTA MÉDICA:</strong> Paciente alérgico a: <b>${esc(mh.allergies)}</b></div>
          </div>
          <span class="badge red">Alerta Activa</span>
        </div>
      </div>` : ''}
    <div class="form-field full"><div class="info-box">${icon('calendar', 17)}<span><strong>Profesional actual:</strong> ${esc(doctorBy(a.doctorId)?.name || 'Sin asignar')}<br>${esc(a.notes || 'Sin observaciones adicionales')}</span></div></div>` +
    selectField('Profesional asignado', 'doctorId', (S.data.doctors || []).map(d => [d.id, `${d.name} (${d.specialty})`]), a.doctorId, true) +
    selectField('Estado del turno', 'status', ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => [s, statusMap[s][0]]), a.status, true) +
    `<div class="form-field full flex" style="flex-wrap:wrap;gap:8px">
      ${btn('Reprogramar horario', 'reschedule', 'calendar', '', 'type="button" data-id="' + id + '"')}
      ${btn('Ver ficha del paciente', 'patient-detail', 'users', '', 'type="button" data-id="' + a.patientId + '"')}
      ${btn('Enviar Recordatorio WhatsApp', 'send-wa-reminder', 'phone', 'primary', 'type="button" data-id="' + id + '"')}
      ${btn('Enviar Email con Invitación (.ics)', 'send-apt-email', 'mail', '', 'type="button" data-id="' + id + '"')}
      <a href="/api/appointments/${id}/calendar.ics" class="btn small" download title="Descargar archivo de calendario oficial (.ics)">${icon('calendar', 13)} Descargar .ics</a>
    </div>`,
    'Actualizar estado', `data-id="${id}"`
  );
}

function patientDetail(id) {
  const p = patientBy(id);
  if (!p) return;
  S.selectedPatient = id;
  const appts = S.data.appointments.filter(a => a.patientId === id).sort((a, b) => b.startAt.localeCompare(a.startAt));
  const records = S.data.records.filter(r => r.patientId === id);
  const mh = p.medicalHistory || {};
  const hasAllergies = Boolean(mh.allergies && !/^(ninguna|no refiere|no reporta|sin alergias|no tiene)$/i.test(mh.allergies.trim()));

  showModal('Ficha Integral del Paciente', 'Datos personales, cobertura y registro de consultas.',
    `<div class="patient-hero">${avatar(nameOf(p), 0, true)}<div class="grow"><h2>${esc(nameOf(p))}</h2>${badge(p.status)}</div>${btn('Editar ficha', 'edit-patient', 'edit', 'small', 'data-id="' + id + '"')}</div>
    
    ${hasAllergies ? `
      <div class="allergies-alert" style="margin-bottom:16px">
        <div class="flex" style="gap:8px">
          <span class="alert-pulse">${icon('warning', 18)}</span>
          <div>
            <strong style="font-size:11px;color:#9e3223">ALERGIAS REPORTADAS:</strong>
            <p style="margin:2px 0 0;font-size:12px;font-weight:650;color:#7e2215">${esc(mh.allergies)}</p>
          </div>
        </div>
        <span class="badge red">Alerta Médica Activa</span>
      </div>
    ` : ''}

    <div class="patient-details">
      ${[
        ['Teléfono', p.phone],
        ['Correo', p.email || 'Sin correo'],
        ['Documento (DNI)', p.dni || 'Sin documento'],
        ['CUIT / CUIL', p.cuitCuil || 'Sin CUIT/CUIL'],
        ['Nacimiento / Edad', p.birthDate ? `${p.birthDate} (${calcAge(p.birthDate)} años)` : 'No registrada'],
        ['Cobertura', p.coverage || 'Particular'],
        ['N° de Afiliado', p.affiliateNumber || '—']
      ].map(([l, v]) => `<div><div class="detail-label">${l}</div><div class="detail-value">${esc(v)}</div></div>`).join('')}
    </div>
    
    <div class="spacer"></div>
    <div class="between" style="margin-bottom:8px">
      <h3 style="font-size:12px;color:#244c3a">Antecedentes Médicos (Ley 26.529)</h3>
      <button class="text-link" data-action="edit-medical-history" data-id="${id}">${icon('edit', 12)} Actualizar antecedentes</button>
    </div>
    <div class="mh-grid" style="margin-bottom:16px">
      <div class="mh-item"><span class="mh-label">Patologías Crónicas</span><p>${esc(mh.pathological || 'Sin patologías declaradas.')}</p></div>
      <div class="mh-item"><span class="mh-label">Medicación Habitual</span><p>${esc(mh.medications || 'Sin medicación crónica.')}</p></div>
      <div class="mh-item"><span class="mh-label">Cirugías Previas</span><p>${esc(mh.surgical || 'Sin cirugías registradas.')}</p></div>
      <div class="mh-item"><span class="mh-label">Heredofamiliares</span><p>${esc(mh.familyHistory || 'Sin datos')} ${mh.habits ? `· ${esc(mh.habits)}` : ''}</p></div>
    </div>

    <div class="info-box">${icon('info', 17)}<span>${esc(p.notes || 'Sin observaciones adicionales registradas.')}</span></div>
    <div class="divider"></div>
    <div class="between"><h2>Historial de Turnos (${appts.length})</h2><button class="text-link" data-action="new-appointment" data-patient-id="${id}">${icon('plus', 14)} Agendar turno</button></div>
    <div style="margin-top:12px">${appts.slice(0, 5).map(a => `<div class="activity-row"><span class="activity-icon">${icon('calendar', 14)}</span><div class="grow"><p>${fmtDate(a.startAt, true)} · ${fmtTime(a.startAt)}</p><small>${esc(types[a.type])}</small></div>${badge(a.status)}</div>`).join('') || '<p class="muted text-sm">Sin turnos registrados.</p>'}</div>
    <div class="divider"></div>
    <div class="between">
      <h2>Historia Clínica Electrónica (${records.length})</h2>
      <div class="flex" style="gap:6px">
        ${btn('Indicación a Enfermería', 'new-medical-order', 'activity', 'small', 'data-patient-id="' + id + '"')}
        ${btn('Abrir evoluciones', 'open-patient-records', 'file', 'small', 'data-id="' + id + '"')}
      </div>
    </div>
    <div class="dialog-actions">${btn('Cerrar', 'close-modal')}${btn('Indicación Enfermería', 'new-medical-order', 'activity', 'small', 'data-patient-id="' + id + '"')}${btn('Nuevo Presupuesto', 'new-quote', 'spark', 'small', 'data-patient-id="' + id + '"')}${btn('Registrar cobro', 'new-payment', 'wallet', 'primary', 'data-patient-id="' + id + '"')}</div>`,
    '', 'wide'
  );
}

function recordForm(amendmentId = null) {
  const old = amendmentId ? S.data.records.find(r => r.id === amendmentId) : null;
  const pid = old?.patientId || S.selectedPatient;
  const p = patientBy(pid);
  const inventory = S.data.inventory || [];
  const oldContent = old ? (typeof old.content === 'object' ? old.content : {}) : {};

  formDialog('record', old ? 'Agregar Enmienda Médica' : 'Evolución Clínica y Registro de Tratamiento', 'Carga de sesión, editor con tablas HRV y descuento automático de inventario.',
    `<div class="omni-template-strip">
      <span style="font-size:11px;font-weight:700;color:#475569;display:flex;align-items:center;margin-right:4px">Plantillas de Sesión:</span>
      <button type="button" class="omni-template-btn" data-template="chamber">${icon('activity', 12)} Cámara Hiperbárica</button>
      <button type="button" class="omni-template-btn" data-template="iv">${icon('plus', 12)} Sueroterapia</button>
      <button type="button" class="omni-template-btn" data-template="light">${icon('sun', 12)} Fotobiomodulación</button>
      <button type="button" class="omni-template-btn" data-template="soap">${icon('file', 12)} Plantilla SOAP</button>
    </div>` +
    patientSelect(pid) +
    field('Tratamiento / Diagnóstico / Problema *', 'problem', 'text', oldContent.problem || '', 'required placeholder="Ej: Camara hiperbarica, Sueroterapia, Fotobiomodulación..."', true) +
    selectField('Especialidad / Área', 'specialty', [
      ['Medicina Integrativa', 'Medicina Integrativa'],
      ['Enfermería y Procedimientos', 'Enfermería y Procedimientos'],
      ['Medicina Hiperbárica', 'Medicina Hiperbárica'],
      ['Medicina General y Preventiva', 'Medicina General y Preventiva'],
      ['Dermatología y Estética', 'Dermatología y Estética'],
      ['Cirugía Plástica y Reparadora', 'Cirugía Plástica y Reparadora'],
      ['Kinesiología y Fisioterapia', 'Kinesiología y Fisioterapia']
    ], oldContent.specialty || 'Medicina Integrativa', true) +
    `<div class="form-field full">
      <div class="between" style="margin-bottom:4px">
        <label style="margin:0">Evolución Clínica y Registro de Sesión (Editor de Tablas y Texto) *</label>
        <span class="tiny muted">Edita texto y tablas directamente</span>
      </div>
      <div class="omni-editor-toolbar">
        <button type="button" class="omni-editor-btn highlight" id="btn-insert-hrv-table">${icon('activity', 13)} Insertar Tabla HRV</button>
        <button type="button" class="omni-editor-btn" id="btn-insert-table">${icon('plus', 12)} Tabla 3x3</button>
        <button type="button" class="omni-editor-btn" id="btn-add-table-row">${icon('plus', 12)} Agregar Fila</button>
        <span style="border-left:1px solid #cbd5e1;height:18px;margin:0 4px"></span>
        <button type="button" class="omni-editor-btn" data-command="bold" title="Negrita"><b>B</b></button>
        <button type="button" class="omni-editor-btn" data-command="italic" title="Cursiva"><i>I</i></button>
        <button type="button" class="omni-editor-btn" data-command="insertUnorderedList" title="Lista con viñetas">• Lista</button>
      </div>
      <div id="omni-rich-editor" class="omni-editor-content" contenteditable="true">${oldContent.html || (oldContent.subjective ? `<p><b>S:</b> ${esc(oldContent.subjective)}</p><p><b>O:</b> ${esc(oldContent.objective || '')}</p><p><b>A:</b> ${esc(oldContent.assessment || '')}</p><p><b>P:</b> ${esc(oldContent.plan || '')}</p>` : '<p>Comienza a registrar la evolución médica o selecciona una plantilla arriba...</p>')}</div>
      <input type="hidden" name="html" id="omni-record-html">
    </div>

    <!-- Sección de Insumos Consumidos con Descuento Inmediato de Stock -->
    <div class="form-field full omni-supply-picker">
      <div class="between" style="margin-bottom:8px">
        <div>
          <strong style="font-size:12px;color:#1e4c3a;display:flex;align-items:center;gap:6px">
            ${icon('box', 15)} Insumos utilizados en esta atención (Descontar automáticamente del stock)
          </strong>
          <span class="tiny muted" style="display:block">Al guardar la evolución, las unidades se restarán en tiempo real del inventario con auditoría.</span>
        </div>
        <button type="button" class="btn small" id="add-evolution-supply-btn">${icon('plus', 12)} Agregar Insumo</button>
      </div>
      <div id="evolution-supplies-container" style="display:flex;flex-direction:column;gap:8px"></div>
      <input type="hidden" name="consumedSuppliesJson" id="evolution-supplies-json" value="[]">
    </div>

    <div class="form-field full">
      <label>Adjuntar Estudio / Documento (Opcional - PDF, JPG, PNG)</label>
      <input type="file" id="record-file-picker" accept=".pdf,.png,.jpg,.jpeg">
      <div id="record-file-info" class="tiny muted" style="margin-top:4px">Máximo 15 MB. Se alojará adjunto a esta evolución.</div>
      <input type="hidden" name="attachmentPayload" id="record-attachment-payload">
    </div>`,
    old ? 'Guardar enmienda' : 'Firmar y guardar evolución (Descontar stock)',
    old ? `data-amendment="${old.id}"` : '', 'wide'
  );
  if (old) $('#field-patientId').disabled = true;

  setTimeout(() => {
    const editor = $('#omni-rich-editor');
    const problemInput = $('#field-problem');
    const specialtyInput = $('#field-specialty');
    const suppliesContainer = $('#evolution-supplies-container');
    const suppliesJsonInput = $('#evolution-supplies-json');

    // Supply items management
    const updateSuppliesJson = () => {
      const rows = Array.from(suppliesContainer?.querySelectorAll('.evolution-supply-row') || []);
      const items = rows.map(r => {
        const sel = r.querySelector('.supply-select');
        const opt = sel?.options[sel.selectedIndex];
        return {
          inventoryId: sel?.value || '',
          name: opt?.dataset.name || '',
          quantity: parseInt(r.querySelector('.supply-qty')?.value, 10) || 1,
          unit: opt?.dataset.unit || 'uds'
        };
      }).filter(x => x.inventoryId);
      if (suppliesJsonInput) suppliesJsonInput.value = JSON.stringify(items);
    };

    const addSupplyRow = (presetId = null, presetQty = 1) => {
      if (!suppliesContainer) return;
      const row = document.createElement('div');
      row.className = 'evolution-supply-row flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      row.innerHTML = `
        <select class="input supply-select grow" style="font-size:12px">
          <option value="">-- Seleccionar insumo consumido del inventario --</option>
          ${inventory.map(i => `<option value="${i.id}" ${presetId === i.id ? 'selected' : ''} data-name="${esc(i.name)}" data-unit="${esc(i.unit)}">${esc(i.name)} (Stock actual: ${i.quantity} ${esc(i.unit)})</option>`).join('')}
        </select>
        <input type="number" class="input supply-qty" value="${presetQty}" min="1" max="999" style="width:75px;text-align:center" title="Cantidad consumida">
        <button type="button" class="icon-btn remove-supply-item" style="color:#e53e3e">${icon('close', 14)}</button>
      `;
      suppliesContainer.appendChild(row);
      updateSuppliesJson();
    };

    $('#add-evolution-supply-btn')?.addEventListener('click', () => addSupplyRow());
    suppliesContainer?.addEventListener('input', updateSuppliesJson);
    suppliesContainer?.addEventListener('change', updateSuppliesJson);
    suppliesContainer?.addEventListener('click', e => {
      if (e.target.closest('.remove-supply-item')) {
        e.target.closest('.evolution-supply-row')?.remove();
        updateSuppliesJson();
      }
    });

    // Formatting Toolbar commands
    document.querySelectorAll('.omni-editor-btn[data-command]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.execCommand(btn.dataset.command, false, null);
        editor?.focus();
      });
    });

    // Insert Table 3x3
    $('#btn-insert-table')?.addEventListener('click', () => {
      const tableHtml = `
        <table class="clinical-table">
          <thead>
            <tr><th>Parámetro</th><th>Valor Medido</th><th>Observación</th></tr>
          </thead>
          <tbody>
            <tr><td contenteditable="true">Dato 1</td><td contenteditable="true">—</td><td contenteditable="true">Normal</td></tr>
            <tr><td contenteditable="true">Dato 2</td><td contenteditable="true">—</td><td contenteditable="true">Normal</td></tr>
          </tbody>
        </table><p></p>
      `;
      document.execCommand('insertHTML', false, tableHtml);
      editor?.focus();
    });

    // Insert HRV Table
    $('#btn-insert-hrv-table')?.addEventListener('click', () => {
      const hrvTableHtml = `
        <p><b>Variabilidad de la Frecuencia Cardíaca (HRV):</b></p>
        <table class="clinical-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>HR (FC)</th>
              <th>HRV</th>
              <th>RMSSD</th>
              <th>SDNN</th>
              <th>PNN50</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td contenteditable="true">14:17</td>
              <td contenteditable="true">70</td>
              <td contenteditable="true">40</td>
              <td contenteditable="true">13.04</td>
              <td contenteditable="true">30.46</td>
              <td contenteditable="true">0</td>
            </tr>
            <tr>
              <td contenteditable="true">14:49</td>
              <td contenteditable="true">95</td>
              <td contenteditable="true">11</td>
              <td contenteditable="true">2.00</td>
              <td contenteditable="true">6.87</td>
              <td contenteditable="true">0</td>
            </tr>
          </tbody>
        </table><p></p>
      `;
      document.execCommand('insertHTML', false, hrvTableHtml);
      editor?.focus();
    });

    // Add Row to Table
    $('#btn-add-table-row')?.addEventListener('click', () => {
      const tables = editor?.querySelectorAll('table');
      if (tables && tables.length) {
        const lastTable = tables[tables.length - 1];
        const tbody = lastTable.querySelector('tbody') || lastTable;
        const colCount = lastTable.querySelectorAll('tr')[0]?.children.length || 3;
        const tr = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
          const td = document.createElement('td');
          td.contentEditable = 'true';
          td.textContent = '—';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      } else {
        toast('Inserta una tabla primero para agregar filas.', true);
      }
    });

    // Template click handlers
    document.querySelectorAll('.omni-template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.template;
        if (t === 'chamber') {
          if (problemInput) problemInput.value = 'Camara hiperbarica';
          if (specialtyInput) specialtyInput.value = 'Medicina Hiperbárica';
          if (editor) {
            editor.innerHTML = `
              <p><b>CH # 22</b><br>
              TA: 100/60 mmHg<br>
              FC: 86 lpm<br>
              SO2: 99%</p>

              <p>Tiempo de Presurización: 6 minutos<br>
              Tiempo de Despresurización: 5 minutos<br>
              Tiempo total de permanencia en CHB: 60 minutos</p>

              <p><b>Buena tolerancia al tratamiento</b><br>
              <b>CHB (supino) - Variabilidad de la Frecuencia Cardíaca:</b></p>
              <table class="clinical-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>HR (FC)</th>
                    <th>HRV</th>
                    <th>RMSSD</th>
                    <th>SDNN</th>
                    <th>PNN50</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td contenteditable="true">14:17</td>
                    <td contenteditable="true">70</td>
                    <td contenteditable="true">40</td>
                    <td contenteditable="true">13.04</td>
                    <td contenteditable="true">30.46</td>
                    <td contenteditable="true">0</td>
                  </tr>
                  <tr>
                    <td contenteditable="true">14:49</td>
                    <td contenteditable="true">95</td>
                    <td contenteditable="true">11</td>
                    <td contenteditable="true">2.00</td>
                    <td contenteditable="true">6.87</td>
                    <td contenteditable="true">0</td>
                  </tr>
                </tbody>
              </table>
              <p>Observaciones de sesión: Sin eventos adversos durante la despresurización.</p>
            `;
          }
          if (suppliesContainer) {
            suppliesContainer.innerHTML = '';
            const maskItem = inventory.find(i => /barbijo|mascara|mascarilla|oxigeno/i.test(i.name)) || inventory[0];
            if (maskItem) addSupplyRow(maskItem.id, 1);
          }
        } else if (t === 'iv') {
          if (problemInput) problemInput.value = 'Sueroterapia';
          if (specialtyInput) specialtyInput.value = 'Medicina Integrativa';
          if (editor) {
            editor.innerHTML = `
              <p><b>Protocolo de Sueroterapia Endovenosa</b><br>
              Solución: Solución Fisiológica 0.9% 500 ml<br>
              Activos / Fármacos: Vitamina C 15g + Cloruro de Magnesio 1.5g + Complejo B<br>
              Vía de acceso: Catéter 20G en MSI (Pliegue de codo)<br>
              Velocidad de goteo: 45 gotas / min (Tiempo total: 45 minutos)</p>

              <p><b>Control de Signos Vitales:</b></p>
              <table class="clinical-table">
                <thead>
                  <tr>
                    <th>Momento</th>
                    <th>Tensión Arterial</th>
                    <th>Frecuencia Cardíaca</th>
                    <th>SatO2</th>
                    <th>Tolerancia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td contenteditable="true">Pre infusión</td>
                    <td contenteditable="true">120/80 mmHg</td>
                    <td contenteditable="true">74 lpm</td>
                    <td contenteditable="true">98%</td>
                    <td contenteditable="true">Normal</td>
                  </tr>
                  <tr>
                    <td contenteditable="true">Post infusión</td>
                    <td contenteditable="true">115/75 mmHg</td>
                    <td contenteditable="true">70 lpm</td>
                    <td contenteditable="true">99%</td>
                    <td contenteditable="true">Excelente / Sin flebitis</td>
                  </tr>
                </tbody>
              </table>
              <p>Retiro de vía sin hematoma, paciente compensado hemodinámicamente.</p>
            `;
          }
          if (suppliesContainer) {
            suppliesContainer.innerHTML = '';
            const suero = inventory.find(i => /suero|soluci[oó]n|fisiol/i.test(i.name));
            const cat = inventory.find(i => /cat[eé]ter|tefl[oó]n|aguja|perif/i.test(i.name));
            const guia = inventory.find(i => /gu[ií]a|perf[uú]s|macrogot/i.test(i.name));
            if (suero) addSupplyRow(suero.id, 1);
            if (cat) addSupplyRow(cat.id, 1);
            if (guia) addSupplyRow(guia.id, 1);
            if (!suero && !cat && !guia && inventory.length) addSupplyRow(inventory[0].id, 1);
          }
        } else if (t === 'light') {
          if (problemInput) problemInput.value = 'Fotobiomodulación';
          if (specialtyInput) specialtyInput.value = 'Medicina Integrativa';
          if (editor) {
            editor.innerHTML = `
              <p><b>Sesión de Fotobiomodulación (Terapia de Luz)</b><br>
              Longitud de onda: 660 nm (Luz Roja) + 850 nm (Infrarroja cercana)<br>
              Zona de aplicación: Cuerpo entero (Cabina de Fotobiomodulación)<br>
              Tiempo de exposición: 20 minutos<br>
              Dosis / Irradiancia: 100 mW/cm²</p>

              <p><b>Respuesta del Paciente:</b><br>
              Tolerancia dérmica óptima. Reporta sensación de bienestar, relajación y disminución de rigidez muscular post sesión.</p>
            `;
          }
          if (suppliesContainer) {
            suppliesContainer.innerHTML = '';
            const desc = inventory.find(i => /camilla|barbijo|descartable/i.test(i.name));
            if (desc) addSupplyRow(desc.id, 1);
          }
        } else if (t === 'soap') {
          if (problemInput) problemInput.value = 'Consulta Médica General';
          if (specialtyInput) specialtyInput.value = 'Medicina General y Preventiva';
          if (editor) {
            editor.innerHTML = `
              <p><b>S · Subjetivo:</b> Motivo de consulta y síntomas referidos por el paciente.</p>
              <p><b>O · Objetivo:</b> Examen físico, signos vitales y hallazgos clínicos.</p>
              <p><b>A · Evaluación:</b> Diagnóstico presuntivo o de certeza.</p>
              <p><b>P · Plan:</b> Conducta médica, indicaciones terapéuticas y solicitud de estudios.</p>
            `;
          }
        }
      });
    });

    // File picker (Supabase Storage + fallback)
    $('#record-file-picker')?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if ($('#record-file-info')) $('#record-file-info').innerHTML = `Subiendo archivo seguro a la nube...`;
      try {
        const meta = await uploadFileToClinicalStorage(file, 'records');
        if ($('#record-attachment-payload')) $('#record-attachment-payload').value = JSON.stringify([meta]);
        if ($('#record-file-info')) $('#record-file-info').innerHTML = `✓ Archivo cargado (${meta.url ? 'Storage Nube' : 'Adjunto'}): <b>${esc(file.name)}</b> (${Math.round(file.size / 1024)} KB)`;
      } catch (err) {
        if ($('#record-file-info')) $('#record-file-info').innerHTML = `Error: ${esc(err.message)}`;
      }
    });
  }, 50);
}

function uploadStudyDialog(patientId = null) {
  const p = patientId ? patientBy(patientId) : (S.selectedPatient ? patientBy(S.selectedPatient) : S.data.patients[0]);
  formDialog('upload-study', 'Cargar Estudio, Laboratorio o Archivo Médico', `Paciente: ${nameOf(p)} · Historia Clínica Digital`,
    patientSelect(p?.id) +
    field('Título / Nombre del Estudio *', 'title', 'text', '', 'required maxlength="200" placeholder="Ej: Laboratorio Completo y Perfil Lipídico, Ecografía Abdominal..."') +
    selectField('Tipo de Documento', 'studyType', [
      ['LAB', 'Laboratorio / Análisis Bioquímico'],
      ['STUDY', 'Estudio de Imágenes / Radiología / Ecografía'],
      ['DOCUMENT', 'Documento Médico / Informe Externo'],
      ['CONSULTATION', 'Informe Clínico / Interconsulta']
    ], 'LAB') +
    selectField('Especialidad', 'specialty', [
      ['Bioquímica y Laboratorio', 'Bioquímica y Laboratorio'],
      ['Diagnóstico por Imágenes', 'Diagnóstico por Imágenes'],
      ['Medicina Integrativa', 'Medicina Integrativa'],
      ['Cirugía Plástica', 'Cirugía Plástica'],
      ['Medicina General', 'Medicina General']
    ], 'Bioquímica y Laboratorio') +
    selectField('Profesional interviniente / solicitante', 'doctorId', (S.data?.doctors || []).map(d => [d.id, d.name]), S.doctor || S.data?.doctors?.[0]?.id) +
    `<div class="form-field full">
      <label>Archivo a Subir (PDF, JPG, PNG) *</label>
      <input type="file" id="study-file-picker" required accept=".pdf,.png,.jpg,.jpeg">
      <div id="study-file-info" class="tiny muted" style="margin-top:4px">Selecciona el informe o imagen escaneada para alojar.</div>
      <input type="hidden" name="attachmentPayload" id="study-attachment-payload">
    </div>
    <div class="form-field full">
      <label for="field-notes">Resultados / Observaciones del estudio</label>
      <textarea id="field-notes" name="notes" class="input" style="height:95px;resize:vertical" maxlength="4000" placeholder="Valores sobresalientes, informe del especialista o notas..."></textarea>
    </div>`,
    'Guardar y Alojar en Historial', `data-patient-id="${p?.id}"`, 'wide'
  );

  setTimeout(() => {
    $('#study-file-picker')?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if ($('#study-file-info')) $('#study-file-info').innerHTML = `Subiendo archivo seguro a la nube...`;
      try {
        const meta = await uploadFileToClinicalStorage(file, 'studies');
        if ($('#study-attachment-payload')) $('#study-attachment-payload').value = JSON.stringify([meta]);
        if ($('#study-file-info')) $('#study-file-info').innerHTML = `✓ Archivo listo (${meta.url ? 'Storage Nube' : 'Adjunto'}): <b>${esc(file.name)}</b> (${Math.round(file.size / 1024)} KB)`;
      } catch (err) {
        if ($('#study-file-info')) $('#study-file-info').innerHTML = `Error: ${esc(err.message)}`;
      }
    });
  }, 50);
}

function vitalsDialog(patientId = null) {
  const p = patientId ? patientBy(patientId) : (S.selectedPatient ? patientBy(S.selectedPatient) : S.data.patients[0]);
  formDialog('vitals', 'Registrar Signos Vitales y Biometría', `Paciente: ${nameOf(p)}`,
    patientSelect(p?.id) +
    field('Presión Arterial (Sistólica/Diastólica mmHg)', 'bloodPressure', 'text', '120/80', 'placeholder="Ej: 120/80"') +
    field('Frecuencia Cardíaca (lpm)', 'heartRate', 'number', '75', 'placeholder="75"') +
    field('Temperatura Corporal (°C)', 'temperature', 'number', '36.5', 'step="0.1" placeholder="36.5"') +
    field('Saturación de Oxígeno (%)', 'oxygenSat', 'number', '98', 'placeholder="98"') +
    field('Peso (kg)', 'weight', 'number', '', 'step="0.1" placeholder="Ej: 72.5"') +
    field('Talla / Altura (cm)', 'height', 'number', '', 'step="1" placeholder="Ej: 175"') +
    area('Observaciones clínicas adicionales', 'notes', '', 'placeholder="Detalle o síntomas durante la toma de signos..."'),
    'Guardar Signos Vitales'
  );
}

const STUDY_ORDER_PANELS = [
  {
    label: 'Rutina Metabólica & Medicina Integrativa',
    text: 'Solicito:\n- Hemograma completo con recuento de plaquetas\n- Glucemia en ayunas, Insulinemia basal e Índice HOMA-IR\n- Hemoglobina glicosilada (HbA1c)\n- Hepatograma completo (GOT, GPT, FAL, GGT, Bilirrubina total y directa)\n- Función renal (Urea, Creatinina, Ionograma)\n- Perfil lipídico completo + ApoB\n- Proteína C Reactiva Ultrasensible (PCR-us) y Homocisteína'
  },
  {
    label: 'Perfil Tiroideo & Vitaminas / Micronutrientes',
    text: 'Solicito:\n- TSH, T4 Libre, T3 Libre, Anticuerpos ATPO y ATG\n- 25-OH Vitamina D total\n- Vitamina B12, Ácido Fólico y Ferritina sérica\n- Magnesio sérico / eritrocitario y Zinc sérico'
  },
  {
    label: 'Perfil Hormonal Completo',
    text: 'Solicito:\n- Cortisol matinal (08:00 hs) y DHEA-S\n- Testosterona total y libre, SHBG\n- Estradiol, FSH, LH, Prolactina'
  },
  {
    label: 'Diagnóstico por Imágenes (Ecografía / Doppler)',
    text: 'Solicito:\n- Ecografía Abdominal y Hepatobiliopancreática\n- Eco-Doppler de Vasos de Cuello\nDiag. Presuntivo: Evaluación vascular y metabólica integral.'
  }
];

function studyOrderDialog(patientId = null) {
  const p = patientId ? patientBy(patientId) : (S.selectedPatient ? patientBy(S.selectedPatient) : S.data.patients[0]);
  const allDocs = (S.data?.staff || S.data?.doctors || []).filter(d => d.role === 'DOCTOR' || d.licenseNumber || d.specialty);
  const docs = allDocs.length ? allDocs : (S.data?.doctors || []);

  formDialog('study-order', 'Nueva Orden Médica de Estudios (Laboratorio / Imágenes)',
    'Genera la solicitud oficial de análisis o estudios complementarios con diagnóstico, firma digital y matrícula.',
    patientSelect(p?.id) +
    selectField('Médico Solicitante *', 'doctorId', docs.map(d => [d.id, `${d.name} (${d.licenseNumber || 'M.N.'})`]), S.doctor || docs[0]?.id) +
    field('Diagnóstico Presuntivo / CIE-10 *', 'diagnosis', 'text', 'Control clínico preventivo y evaluación metabólica (Z00.0)', 'required maxlength="200"', true) +
    `<div class="form-field full" style="background:#f8fbf9;border:1px solid #d5e3d8;border-radius:10px;padding:10px 12px">
      <label style="font-size:12px;font-weight:700;color:#1b4c37;margin-bottom:6px;display:block">Plantillas Rápidas de Estudios:</label>
      <div class="flex" style="gap:6px;flex-wrap:wrap">
        ${STUDY_ORDER_PANELS.map((sp, i) => `<button type="button" class="btn small study-panel-preset" data-idx="${i}">${icon('plus', 11)} ${esc(sp.label)}</button>`).join('')}
      </div>
    </div>` +
    area('Estudios Solicitados *', 'orderText', STUDY_ORDER_PANELS[0].text, 'required style="height:150px"', true) +
    field('Indicaciones previas (ej: Ayuno 8-12 hs)', 'prepNotes', 'text', 'Presentarse con 8 a 12 horas de ayuno previo.', '', true),
    'Guardar e Imprimir Orden de Estudios', '', 'wide'
  );

  setTimeout(() => {
    document.querySelectorAll('.study-panel-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = STUDY_ORDER_PANELS[Number(btn.dataset.idx)];
        const areaEl = $('#field-orderText');
        if (panel && areaEl) {
          areaEl.value = panel.text;
        }
      });
    });
  }, 40);
}

function printStudyOrderDocument(recordId) {
  const r = (S.data?.records || []).find(x => x.id === recordId);
  if (!r) return toast('Orden de estudios no encontrada.', true);
  const c = typeof r.content === 'object' && r.content ? r.content : {};
  const p = patientBy(r.patientId);
  const doc = resolveDoctorForDoc(c.doctorId, r.author);
  const clinicName = S.data?.workspace?.name || 'Abundance Clinic OS';
  const win = window.open('', '_blank');
  if (!win) return toast('Habilita las ventanas emergentes para imprimir la orden.', true);
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Orden de Estudios · ${esc(nameOf(p))}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#0f172a;margin:0;padding:24px;background:#eef3f0}
    .page{max-width:720px;margin:0 auto;background:#fff;padding:34px;border-radius:10px;border:1.5px solid #cbd5e1}
    .btn{padding:9px 16px;border-radius:7px;border:none;background:#1b4c37;color:#fff;font-weight:700;cursor:pointer}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #1b4c37;padding-bottom:14px;margin-bottom:16px}
    .box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px}
    .body{border:1.5px solid #1b4c37;border-radius:10px;padding:18px 20px;min-height:190px;white-space:pre-wrap;font-size:14px;line-height:1.65;margin-bottom:20px}
    @media print{.actions{display:none}body{background:#fff;padding:0}.page{border:none}}
  </style></head><body>
  <div class="actions" style="max-width:720px;margin:0 auto 12px;text-align:right"><button class="btn" onclick="window.print()">Imprimir / Guardar PDF</button></div>
  <div class="page">
    <div class="head">
      <div><strong style="font-size:19px;color:#1b4c37">${esc(clinicName)}</strong><br><small>${esc(doc.name)} · ${esc(doc.licenseNumber)} · ${esc(doc.specialty)}</small></div>
      <div style="text-align:right"><span style="background:#1b4c37;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:4px">ORDEN DE ESTUDIOS MÉDICOS</span><br><small>Fecha: ${fmtDate(r.createdAt, true)}</small></div>
    </div>
    <div class="box">
      <b>Paciente:</b> ${esc(nameOf(p))} · <b>DNI:</b> ${esc(p?.dni || '—')} · <b>Obra Social:</b> ${esc(p?.coverage || 'Particular')} ${p?.affiliateNumber ? `(N° ${esc(p.affiliateNumber)})` : ''}<br>
      <b>Diagnóstico:</b> ${esc(c.diagnosis || r.problem || 'Evaluación clínica')}
    </div>
    <div class="body">${esc(c.notes || c.text || '')}</div>
    ${c.prepNotes ? `<div style="font-size:12px;color:#334155;background:#f0fdf4;border:1px solid #bbf7d0;padding:10px 14px;border-radius:8px;margin-bottom:18px"><b>Indicaciones de preparación:</b> ${esc(c.prepNotes)}</div>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #e2e8f0;padding-top:14px">
      <div style="font-size:11px;color:#64748b">Orden emitida electrónicamente · Ref: ${esc(r.id)}<br>Válida para presentación en laboratorios y centros de diagnóstico.</div>
      ${renderSignatureStampHtml(doc)}
    </div>
  </div></body></html>`);
  win.document.close();
}

const _hceReadLogged = new Set();
function logHceReadAccess(patientId) {
  if (!patientId || _hceReadLogged.has(patientId)) return;
  _hceReadLogged.add(patientId);
  api('/api/audit/hce-read', 'POST', {
    patientId,
    details: `Acceso de lectura a Historia Clínica del paciente ${nameOf(patientBy(patientId))} (Trazabilidad Ley 26.529).`
  }).catch(() => {});
}

function printCompleteHceDocument(patientId) {
  const p = patientBy(patientId);
  if (!p) return toast('Paciente no encontrado.', true);
  logHceReadAccess(patientId);
  const clinicName = S.data?.workspace?.name || 'Abundance Clinic OS';
  const mh = p.medicalHistory || {};
  const recs = (S.data?.records || []).filter(r => r.patientId === patientId);
  const prescs = (S.data?.prescriptions || []).filter(r => r.patientId === patientId);
  const consents = (S.data?.consents || []).filter(c => c.patientId === patientId);
  const win = window.open('', '_blank');
  if (!win) return toast('Habilita las ventanas emergentes para exportar la HCE.', true);
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>HCE Completa · ${esc(nameOf(p))}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#0f172a;margin:0;padding:24px;background:#f8faf8;line-height:1.5}
    .page{max-width:820px;margin:0 auto;background:#fff;padding:36px;border-radius:10px;border:1px solid #cbd5e1}
    .btn{padding:10px 18px;border-radius:7px;border:none;background:#1b4c37;color:#fff;font-weight:700;cursor:pointer}
    h2{color:#1b4c37;border-bottom:2px solid #1b4c37;padding-bottom:6px;margin-top:24px;font-size:16px}
    .card{border:1px solid #dbe4dc;border-radius:8px;padding:12px 16px;margin-bottom:12px;background:#fcfdfc}
    .hash{font-family:monospace;font-size:10.5px;color:#475569;margin-top:6px;border-top:1px dashed #cbd5e1;padding-top:4px}
    @media print{.actions{display:none}body{background:#fff;padding:0}.page{border:none}}
  </style></head><body>
  <div class="actions" style="max-width:820px;margin:0 auto 12px;text-align:right"><button class="btn" onclick="window.print()">Imprimir / Descargar HCE Completa (PDF)</button></div>
  <div class="page">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1b4c37;padding-bottom:14px">
      <div><strong style="font-size:20px;color:#1b4c37">${esc(clinicName)}</strong><br><small>Copia Certificada de Historia Clínica Electrónica · Ley Nacional N° 26.529</small></div>
      <div style="text-align:right;font-size:12px">Emitida: ${fmtDate(new Date().toISOString(), true)} ${fmtTime(new Date().toISOString())} hs<br>Total registros: ${recs.length}</div>
    </div>
    <h2>1. Datos Filiatorios y Antecedentes (Perfil Permanente)</h2>
    <div class="card" style="font-size:13px">
      <b>Paciente:</b> ${esc(nameOf(p))} · <b>DNI:</b> ${esc(p.dni || '—')} · <b>Cobertura:</b> ${esc(p.coverage || 'Particular')} ${p.affiliateNumber ? `(N° ${esc(p.affiliateNumber)})` : ''}<br>
      <b>Alergias:</b> ${esc(mh.allergies || 'Sin alergias reportadas')} · <b>Patologías:</b> ${esc(mh.pathological || 'Ninguna')}<br>
      <b>Medicación habitual:</b> ${esc(mh.medications || 'Ninguna')} · <b>Cirugías:</b> ${esc(mh.surgical || 'Ninguna')}
    </div>
    <h2>2. Evoluciones, Terapias, Estudios y Signos Vitales (${recs.length})</h2>
    ${recs.map(r => {
      const c = typeof r.content === 'object' && r.content ? r.content : {};
      const bodyTxt = c.html ? c.html : esc(c.notes || c.text || c.subjective || r.problem || r.title || 'Registro asentado');
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:6px">
          <span><b>${esc(r.author || 'Profesional')}</b> · ${esc(r.problem || r.title || r.type || 'Evolución')}</span>
          <span>${fmtDate(r.createdAt, true)} ${fmtTime(r.createdAt)}</span>
        </div>
        <div style="font-size:13px">${bodyTxt}</div>
        <div class="hash">SHA-256: ${esc(r.hash || 'Verificado')} · Previo: ${esc((r.previousHash || '').slice(0, 24))}</div>
      </div>`;
    }).join('') || '<p>Sin evoluciones registradas.</p>'}
    <h2>3. Recetas Electrónicas (${prescs.length}) y Consentimientos Informados (${consents.length})</h2>
    ${prescs.map(pr => `<div class="card" style="font-size:12.5px"><b>Receta ${esc(pr.cuir || pr.id)}</b> (${fmtDate(pr.createdAt, true)}) · ${esc(pr.doctorName || '')} (${esc(pr.doctorLicense || '')})<br>${esc(pr.content)}</div>`).join('') || '<p style="font-size:12.5px;color:#64748b">Sin recetas emitidas.</p>'}
    ${consents.map(ct => `<div class="card" style="font-size:12.5px"><b>Consentimiento: ${esc(ct.title)}</b> (${fmtDate(ct.signedAt || ct.createdAt, true)}) · Firmado bilateralmente (${esc(ct.hash || '')})</div>`).join('') || ''}
  </div></body></html>`);
  win.document.close();
}

function renderBarcodeSvg(codeStr = 'AR-CUIR-2026') {
  const clean = String(codeStr || 'ARCUIR2026');
  const bars = [];
  let x = 6;
  for (let i = 0; i < clean.length; i++) {
    const c = clean.charCodeAt(i);
    const w1 = (c % 3) + 1;
    const w2 = ((c >> 2) % 2) + 1;
    bars.push(`<rect x="${x}" y="4" width="${w1}" height="34" fill="#0f172a"/>`);
    x += w1 + 2;
    bars.push(`<rect x="${x}" y="4" width="${w2}" height="34" fill="#0f172a"/>`);
    x += w2 + 3;
  }
  return `<svg width="${Math.max(160, x + 6)}" height="42" viewBox="0 0 ${Math.max(160, x + 6)} 42" xmlns="http://www.w3.org/2000/svg" style="display:block;margin-left:auto">${bars.join('')}</svg>`;
}

function resolveDoctorForDoc(doctorId, doctorNameFallback = '') {
  const allDocs = [...(S.data?.staff || []), ...(S.data?.doctors || []), ...(S.portal?.data?.doctors || [])];
  let doc = doctorId ? allDocs.find(d => d.id === doctorId) : null;
  if (!doc && doctorNameFallback) doc = allDocs.find(d => d.name === doctorNameFallback);
  if (!doc) doc = allDocs.find(d => d.role === 'DOCTOR' || d.licenseNumber) || allDocs[0] || {};
  return {
    id: doc.id || '',
    name: doc.name || doctorNameFallback || S.session?.user?.name || 'Dra. María José Mattioli',
    specialty: doc.specialty || 'Medicina Integrativa y Regenerativa',
    licenseNumber: doc.licenseNumber || 'M.N. 142.850',
    signatureData: doc.signatureData || '',
    address: doc.address || S.data?.workspace?.address || 'Consultorios Médicos · Atención Personalizada'
  };
}

function renderSignatureStampHtml(doc) {
  return `
  <div style="text-align:center;min-width:230px">
    <div style="height:68px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:4px">
      ${doc.signatureData
        ? `<img src="${doc.signatureData}" alt="Firma Digital" style="max-height:66px;max-width:210px;object-fit:contain">`
        : `<div style="font-family:'Brush Script MT','Segoe Script',cursive;font-size:27px;color:#143829;transform:rotate(-3deg);line-height:1;padding-bottom:6px">${esc(doc.name)}</div>`
      }
    </div>
    <div style="border-top:1.5px solid #1b4c37;padding-top:6px;font-size:12px;color:#18362b;line-height:1.35">
      <strong style="display:block;font-size:13px">${esc(doc.name)}</strong>
      <span>${esc(doc.specialty)}</span><br>
      <strong style="font-family:monospace;font-size:12px;color:#1b4c37">Matrícula: ${esc(doc.licenseNumber)}</strong>
    </div>
  </div>`;
}

function parseQuoteProgramMeta(rawNotes, p, qt) {
  const defaultMeta = {
    isSignature: true,
    stageSubtitle: 'ETAPA 1 · PROGRAMA CLÍNICO INTENSIVO PERSONALIZADO',
    clinicalContext: p?.medicalHistory?.pathological && p.medicalHistory.pathological !== 'Sin patologías crónicas declaradas.'
      ? `Contexto clínico: ${p.medicalHistory.pathological}. ${p.medicalHistory.medications ? `Medicación actual: ${p.medicalHistory.medications}.` : ''}`
      : 'Abordaje integral orientado a la recuperación celular, modulación inflamatoria, oxigenación tisular y optimización metabólica.',
    rationale: 'Una etapa intensiva inicial permite generar un estímulo biológico sostenido y sinérgico. Al combinar oxigenación hiperbárica, reposición endovenosa de micronutrientes y fotobiomodulación en una ventana terapéutica concentrada, logramos reactivar la función mitocondrial y acelerar la respuesta clínica desde las primeras semanas.',
    objectives: [
      'Reducir la inflamación celular crónica y el estrés oxidativo sistémico.',
      'Optimizar la producción de energía mitocondrial (ATP) y la vitalidad diaria.',
      'Mejorar la oxigenación de tejidos profundos, la microcirculación y la recuperación.',
      'Fortalecer la respuesta inmunológica, el descanso reparador y el equilibrio autonómico (HRV).'
    ],
    schedulePlan: 'Frecuencia recomendada: 2 a 3 visitas semanales durante 4 a 6 semanas consecutivas. En cada visita se articulan las sesiones de forma coordinada (duración aproximada por visita: 90 a 120 minutos) con monitoreo de signos vitales y variabilidad cardíaca (HRV).',
    accompaniment: 'Durante toda la Etapa 1 realizamos seguimiento médico continuo, evaluación comparativa entre tus estudios basales del Portal del Paciente y tus nuevos biomarcadores, y ajustes personalizados de dosis según tu respuesta clínica.',
    surchargePercent: 10,
    additionalNotes: ''
  };
  if (!rawNotes) return defaultMeta;
  const str = String(rawNotes).trim();
  if (str.startsWith('{') && str.includes('SIGNATURE_PROGRAM')) {
    try {
      const parsed = JSON.parse(str);
      return { ...defaultMeta, ...parsed };
    } catch {}
  }
  return { ...defaultMeta, additionalNotes: str };
}

function printQuoteDocument(id) {
  const qt = (S.data?.quotes || []).find(q => q.id === id);
  if (!qt) return toast('Presupuesto no encontrado.', true);
  const p = patientBy(qt.patientId);
  const doc = resolveDoctorForDoc(qt.doctorId);
  const clinicName = S.data?.workspace?.name || 'Abundance Clinic OS';
  const items = Array.isArray(qt.items) ? qt.items : [];
  const subtotal = Number(qt.subtotal || items.reduce((a, it) => a + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0));
  const discount = Number(qt.discount || 0);
  const total = qt.totalCents != null ? qt.totalCents / 100 : Number(qt.total || Math.max(0, subtotal - (subtotal * discount / 100)));
  const qNum = qt.quoteNumber || qt.number || qt.id;
  const curr = qt.currency || 'ARS';
  const meta = parseQuoteProgramMeta(qt.notes, p, qt);
  const surchargePct = Number(meta.surchargePercent ?? 10);
  const totalFinanced = Math.round(total * (1 + surchargePct / 100));
  const installmentAmount = Math.round(totalFinanced / 3);
  const patientAge = p?.birthDate ? `${calcAge(p.birthDate)} años` : '—';

  const win = window.open('', '_blank');
  if (!win) return toast('Habilita las ventanas emergentes para ver o imprimir el PDF.', true);
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(qt.title || 'Programa Signature')} · ${esc(nameOf(p))}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#1b2e25;margin:0;padding:28px;background:#f2f6f3;line-height:1.55}
    .page{max-width:820px;margin:0 auto 24px;background:#fff;padding:42px 46px;border-radius:12px;border:1px solid #d5e2d8;box-shadow:0 8px 28px rgba(15,41,30,0.07)}
    .actions{max-width:820px;margin:0 auto 16px;display:flex;justify-content:space-between;align-items:center}
    .btn{padding:10px 18px;border-radius:8px;border:none;background:#1b4c37;color:#fff;font-weight:700;cursor:pointer;font-size:13px}
    .hero-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #1b4c37;padding-bottom:18px;margin-bottom:22px}
    .brand-row{display:flex;align-items:center;gap:12px}
    .brand-icon{width:42px;height:42px;border-radius:10px;background:#1b4c37;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px}
    .tag-pill{display:inline-block;background:#eaf4ec;color:#1b4c37;font-size:11px;font-weight:800;letter-spacing:0.8px;padding:4px 10px;border-radius:99px;text-transform:uppercase;margin-bottom:6px}
    .ficha-grid{background:#f5f9f6;border:1px solid #d7e6db;border-radius:10px;padding:16px 20px;margin-bottom:22px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-size:12.5px}
    .ficha-grid div strong{display:block;font-size:10.5px;text-transform:uppercase;color:#5a7364;letter-spacing:0.4px}
    .sec-title{font-size:15px;font-weight:800;color:#1b4c37;margin:22px 0 8px;display:flex;align-items:center;gap:8px;border-left:3.5px solid #1b4c37;padding-left:10px}
    .sec-text{font-size:13px;color:#2c3e35;margin:0 0 12px;text-align:justify}
    .obj-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
    .obj-card{background:#f8fbf9;border:1px solid #dce8df;border-radius:8px;padding:10px 14px;font-size:12.5px;color:#1e3a2b;display:flex;align-items:flex-start;gap:8px}
    .therapy-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:12px 0 18px}
    .t-card{background:#fff;border:1px solid #cfe0d4;border-radius:10px;padding:14px}
    .t-card h4{margin:0 0 4px;color:#1b4c37;font-size:13.5px}
    .t-card .t-qty{font-size:11.5px;font-weight:700;color:#15803d;margin-bottom:6px;display:block}
    .t-card p{margin:0;font-size:12px;color:#475569}
    table{width:100%;border-collapse:collapse;margin:14px 0 18px}
    th{text-align:left;padding:10px 12px;background:#1b4c37;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:0.4px}
    td{padding:11px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
    .totals-box{display:grid;grid-template-columns:1.2fr 1fr;gap:20px;align-items:start;margin-top:18px}
    .pay-options{background:#f5f9f6;border:1.5px solid #c5d9cb;border-radius:10px;padding:16px}
    .pay-opt{display:flex;align-items:flex-start;gap:10px;padding:10px;background:#fff;border:1px solid #d8e4da;border-radius:8px;margin-bottom:8px;font-size:12.5px}
    .checkbox-sq{width:16px;height:16px;border:2px solid #1b4c37;border-radius:4px;flex-shrink:0;margin-top:2px}
    .totals{background:#f8fbf9;border:1px solid #d5e2d8;border-radius:10px;padding:16px;font-size:13.5px}
    .totals div{display:flex;justify-content:space-between;padding:5px 0}
    .grand{font-size:17px;font-weight:800;color:#1b4c37;border-top:2px solid #1b4c37;margin-top:8px;padding-top:10px}
    .footer-sig{margin-top:32px;padding-top:20px;border-top:1px solid #dce6dd;display:flex;justify-content:space-between;align-items:flex-end}
    @media print{.actions{display:none}body{background:#fff;padding:0}.page{border:none;box-shadow:none;padding:18px;margin:0}}
  </style></head><body>
  <div class="actions">
    <span style="font-size:12.5px;color:#475569;font-weight:600">Programa Clínico & Presupuesto Oficial · ${esc(qNum)}</span>
    <button class="btn" onclick="window.print()">Imprimir / Descargar PDF</button>
  </div>
  <div class="page">
    <div class="hero-head">
      <div>
        <div class="brand-row">
          <div class="brand-icon">A</div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#1b4c37;letter-spacing:-0.3px">${esc(clinicName)}</div>
            <div style="font-size:12px;color:#5a7364">${esc(doc.name)} · ${esc(doc.specialty)} · <b>${esc(doc.licenseNumber)}</b></div>
          </div>
        </div>
      </div>
      <div style="text-align:right">
        <span class="tag-pill">${esc(meta.stageSubtitle || 'PROGRAMA SIGNATURE')}</span>
        <div style="font-size:17px;font-weight:800;color:#18362b">${esc(qt.title)}</div>
        <div style="font-size:11.5px;color:#64748b">Presupuesto N° ${esc(qNum)} · Emisión: ${fmtDate(qt.createdAt, true)}</div>
      </div>
    </div>

    <div class="ficha-grid">
      <div><strong>Paciente</strong><b>${esc(nameOf(p))}</b></div>
      <div><strong>DNI / Identificación</strong>${esc(p?.dni || '—')} (${esc(patientAge)})</div>
      <div><strong>Cobertura</strong>${esc(p?.coverage || 'Particular')}</div>
      <div><strong>Profesional Tratante</strong>${esc(doc.name)} (${esc(doc.licenseNumber)})</div>
      <div><strong>Fecha de Emisión</strong>${fmtDate(qt.createdAt, true)}</div>
      <div><strong>Vigencia del Presupuesto</strong>Hasta ${fmtDate(qt.validUntil, true)}</div>
    </div>

    <div class="sec-title">1. Por qué una etapa intensiva y contexto clínico</div>
    <p class="sec-text"><b>Resumen clínico personalizado:</b> ${esc(meta.clinicalContext)}</p>
    <p class="sec-text">${esc(meta.rationale)}</p>

    <div class="sec-title">2. Qué buscamos en esta etapa</div>
    <div class="obj-grid">
      ${(meta.objectives || []).map(obj => `<div class="obj-card"><span style="color:#15803d;font-weight:900">✓</span><span>${esc(obj)}</span></div>`).join('')}
    </div>

    <div class="sec-title">3. Qué incluye tu programa · Las terapias indicadas</div>
    <div class="therapy-cards">
      ${items.map(it => {
        const desc = String(it.description || '');
        let detail = 'Terapia médica personalizada administrada bajo supervisión clínica y monitoreo de parámetros.';
        if (/hiperb[aá]rica|chb/i.test(desc)) detail = 'Oxigenación hiperbárica a 1.45 ATA para saturar el plasma de oxígeno, estimular la angiogénesis, regenerar tejidos y potenciar la energía celular.';
        else if (/suero|endovenos|iv|vitamina/i.test(desc)) detail = 'Infusión endovenosa de micronutrientes, antioxidantes y cofactores celulares de biodisponibilidad inmediata (100% absorción sistémica).';
        else if (/fotobio|luz|led|l[aá]ser/i.test(desc)) detail = 'Estimulación con espectro rojo (660 nm) e infrarrojo cercano (850 nm) que activa la citocromo C oxidasa mitocondrial y modula la inflamación.';
        else if (/consulta|control|evaluaci[oó]n/i.test(desc)) detail = 'Seguimiento médico integrativo, lectura comparativa de laboratorios y ajuste personalizado del protocolo.';
        return `<div class="t-card">
          <h4>${esc(desc)}</h4>
          <span class="t-qty">${Number(it.quantity || 1)} sesión(es) / unidad(es) incluidas</span>
          <p>${esc(detail)}</p>
        </div>`;
      }).join('')}
    </div>

    <div class="sec-title">4. Cómo se organiza la etapa y cómo te acompaño</div>
    <p class="sec-text"><b>Organización de sesiones:</b> ${esc(meta.schedulePlan)}</p>
    <p class="sec-text"><b>Acompañamiento médico:</b> ${esc(meta.accompaniment)}</p>

    <div class="sec-title">5. Inversión del Programa y Formas de Pago</div>
    <table>
      <thead><tr><th>Concepto / Terapia Integrativa</th><th style="text-align:center">Sesiones / Cant.</th><th style="text-align:right">Valor Unitario</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>
        ${items.map(it => {
          const qty = Number(it.quantity || 1);
          const up = Number(it.unitPrice || 0);
          return `<tr><td><b>${esc(it.description)}</b></td><td style="text-align:center">${qty}</td><td style="text-align:right">${curr} $${up.toLocaleString('es-AR')}</td><td style="text-align:right"><b>${curr} $${(qty * up).toLocaleString('es-AR')}</b></td></tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="totals-box">
      <div class="pay-options">
        <strong style="font-size:13px;color:#1b4c37;display:block;margin-bottom:8px">FORMAS DE PAGO DISPONIBLES (Seleccionar opción):</strong>
        <div class="pay-opt">
          <div class="checkbox-sq"></div>
          <div>
            <strong style="color:#14532d">Opción 1 · Pago Total al inicio del programa</strong><br>
            <span>Inversión total sin recargo: <b>${curr} $${total.toLocaleString('es-AR')}</b> (Transferencia, efectivo o débito).</span>
          </div>
        </div>
        <div class="pay-opt" style="margin-bottom:0">
          <div class="checkbox-sq"></div>
          <div>
            <strong style="color:#1e3a8a">Opción 2 · Financiación en 3 Cuotas (${surchargePct}% de recargo)</strong><br>
            <span>3 cuotas mensuales de <b>${curr} $${installmentAmount.toLocaleString('es-AR')}</b> (Total financiado: ${curr} $${totalFinanced.toLocaleString('es-AR')}).</span>
          </div>
        </div>
      </div>

      <div class="totals">
        <div><span>Subtotal de Terapias:</span><span>${curr} $${subtotal.toLocaleString('es-AR')}</span></div>
        ${discount ? `<div style="color:#15803d"><span>Bonificación Programa (${discount}%):</span><span>- ${curr} $${(subtotal * discount / 100).toLocaleString('es-AR')}</span></div>` : ''}
        <div class="grand"><span>INVERSIÓN TOTAL:</span><span>${curr} $${total.toLocaleString('es-AR')}</span></div>
        <div style="font-size:11.5px;color:#64748b;margin-top:6px;display:block;text-align:right">Opción 3 cuotas (+${surchargePct}%): 3 x ${curr} $${installmentAmount.toLocaleString('es-AR')}</div>
      </div>
    </div>

    ${meta.additionalNotes ? `<div style="margin-top:18px;padding:12px 16px;background:#f8fafc;border-left:3px solid #1b4c37;font-size:12px;color:#334155"><b>Notas adicionales:</b> ${esc(meta.additionalNotes)}</div>` : ''}

    <div class="footer-sig">
      <div style="font-size:11.5px;color:#64748b;max-width:440px">
        <b>${esc(clinicName)}</b> · ${esc(doc.address)}<br>
        Presupuesto válido hasta el ${fmtDate(qt.validUntil, true)}. Al aprobar el programa se coordinan los turnos de Terapias Ambulatorias y el seguimiento en tu Portal del Paciente.
      </div>
      ${renderSignatureStampHtml(doc)}
    </div>
  </div></body></html>`);
  win.document.close();
}

function printInvoiceDocument(id) {
  const inv = (S.data?.invoices || S.portal?.data?.invoices || []).find(i => i.id === id);
  if (!inv) return toast('Comprobante no encontrado.', true);
  const p = patientBy(inv.patientId) || S.portal?.patient;
  const doc = resolveDoctorForDoc(inv.doctorId);
  const clinicName = S.data?.workspace?.name || S.portal?.data?.clinic?.name || 'Abundance Clinic OS';
  const amountFmt = fmtMoney((inv.amountCents || 0) / 100);
  const win = window.open('', '_blank');
  if (!win) return toast('Habilita las ventanas emergentes para ver o imprimir la factura.', true);
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura ${esc(inv.invoiceType || 'B')} ${esc(inv.invoiceNumber || '')}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#1a2f26;margin:0;padding:30px;background:#f6f8f6}
    .page{max-width:780px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;border:1px solid #d4ded6}
    .btn{padding:9px 16px;border-radius:6px;border:none;background:#1b4c37;color:#fff;font-weight:600;cursor:pointer}
    .box{border:1px solid #b8c9bc;padding:22px;margin-top:16px;border-radius:8px}
    .head{display:grid;grid-template-columns:1fr 70px 1fr;gap:12px;border-bottom:2px solid #1b4c37;padding-bottom:16px}
    .letra{width:54px;height:54px;border:2px solid #1b4c37;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;margin:0 auto}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    th,td{padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:left}
    @media print{.actions{display:none}body{background:#fff;padding:0}.page{border:none}}
  </style></head><body><div class="page">
    <div class="actions" style="text-align:right"><button class="btn" onclick="window.print()">Imprimir / Guardar PDF</button></div>
    <div class="box">
      <div class="head">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <div style="width:38px;height:38px;border-radius:8px;background:#1b4c37;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;flex-shrink:0">A</div>
          <div>
            <strong style="font-size:17px;color:#1b4c37">${esc(clinicName)}</strong><br>
            <small style="color:#475569">${esc(doc.name)} · ${esc(doc.licenseNumber)}</small><br>
            <small style="color:#64748b">${esc(doc.address)} · Prestaciones de Salud</small>
          </div>
        </div>
        <div style="text-align:center"><div class="letra">${esc(inv.invoiceType || 'B')}</div><small>COD. ${inv.invoiceType === 'C' ? '011' : '006'}</small></div>
        <div style="text-align:right"><strong>FACTURA ${esc(inv.invoiceType || 'B')}</strong><br>N° ${esc(inv.invoiceNumber || '')}<br><small>Fecha: ${fmtDate(inv.createdAt, true)}</small></div>
      </div>
      <div style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap">
        <span><b>Paciente:</b> ${esc(nameOf(p))} · <b>DNI:</b> ${esc(p?.dni || 'Consumidor Final')}</span>
        <span><b>Cobertura:</b> ${esc(p?.coverage || 'Particular')} ${p?.affiliateNumber ? `(Afiliado N° ${esc(p.affiliateNumber)})` : ''}</span>
      </div>
      <table><thead><tr><th>Concepto / Prestación Médica</th><th style="text-align:right">Importe</th></tr></thead>
      <tbody><tr><td>${esc(inv.concept || 'Prestación médica')}</td><td style="text-align:right"><b>${amountFmt}</b></td></tr></tbody></table>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;padding-top:14px;border-top:1px dashed #cbd5e1">
        <div style="background:#f4f8f4;padding:12px 16px;border-radius:8px;border:1px solid #bbf7d0;display:flex;align-items:center;gap:14px">
          ${inv.qrUrl ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=84x84&data=${encodeURIComponent(inv.qrUrl)}" width="84" height="84" alt="QR ARCA">` : ''}
          <div>
            <b style="color:#15803d;font-size:13px">✓ COMPROBANTE AUTORIZADO POR ARCA (AFIP)</b><br>
            <small style="font-family:monospace;font-size:12px">CAE N°: ${esc(inv.cae || '—')} · Vto CAE: ${fmtDate(inv.caeVto || inv.createdAt, true)}</small>
          </div>
        </div>
        ${renderSignatureStampHtml(doc)}
      </div>
    </div>
  </div></body></html>`);
  win.document.close();
}

function printPrescriptionDocument(id) {
  const rx = (S.data?.prescriptions || S.portal?.data?.prescriptions || []).find(r => r.id === id);
  if (!rx) return toast('Receta médica no encontrada.', true);
  const p = patientBy(rx.patientId) || S.portal?.patient;
  const doc = resolveDoctorForDoc(rx.doctorId, rx.doctorName);
  if (rx.doctorLicense) doc.licenseNumber = rx.doctorLicense;
  const clinicName = S.data?.workspace?.name || S.portal?.data?.clinic?.name || 'Abundance Clinic OS';
  const cuir = rx.cuir || `AR-CUIR-${new Date(rx.createdAt || Date.now()).getFullYear()}-${String(rx.id || '').replace(/\D/g, '').padStart(6, '8').slice(0, 8)}-${String(rx.id || 'RX').slice(-4).toUpperCase()}`;
  const meds = Array.isArray(rx.medications) && rx.medications.length ? rx.medications : null;
  const validUntilDate = plusDays((rx.createdAt || new Date().toISOString()).slice(0, 10), 30);
  const qrPayload = `https://app.rcta.me/verify?cuir=${encodeURIComponent(cuir)}&rx=${encodeURIComponent(rx.id)}&dni=${encodeURIComponent(p?.dni || '')}&mn=${encodeURIComponent(doc.licenseNumber)}`;

  const win = window.open('', '_blank');
  if (!win) return toast('Habilita las ventanas emergentes para ver o imprimir la receta.', true);
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Receta Electrónica Oficial ${esc(cuir)}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#0f172a;margin:0;padding:24px;background:#eef3f0;line-height:1.45}
    .page{max-width:740px;margin:0 auto;background:#fff;padding:32px 36px;border-radius:12px;border:1.5px solid #cbd5e1;box-shadow:0 8px 25px rgba(0,0,0,0.06)}
    .actions{max-width:740px;margin:0 auto 12px;display:flex;justify-content:space-between;align-items:center}
    .btn{padding:9px 18px;border-radius:7px;border:none;background:#1b4c37;color:#fff;font-weight:700;cursor:pointer;font-size:13px}
    .rcta-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #1b4c37;padding-bottom:14px;margin-bottom:14px}
    .clinic-brand{display:flex;gap:12px;align-items:center}
    .logo-mark{width:44px;height:44px;border-radius:10px;background:#1b4c37;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900}
    .cuir-box{text-align:right}
    .cuir-code{font-family:monospace;font-size:12px;font-weight:800;color:#0f172a;letter-spacing:0.5px;margin-top:2px}
    .patient-panel{background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:10px;font-size:12.5px}
    .patient-panel div small{display:block;font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:0.4px}
    .rp-container{border:1.5px solid #1b4c37;border-radius:10px;padding:18px 20px;min-height:210px;background:#fff;margin-bottom:18px;position:relative}
    .rp-symbol{font-size:22px;font-weight:900;color:#1b4c37;font-family:Georgia,serif;margin-bottom:10px;border-bottom:1px dashed #cbd5e1;padding-bottom:6px;display:flex;justify-content:space-between;align-items:center}
    .med-card{padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fbf9;margin-bottom:10px}
    .med-title{font-size:14px;font-weight:800;color:#0f172a;display:flex;justify-content:space-between}
    .med-posology{font-size:12.5px;color:#334155;margin-top:4px}
    .rcta-footer{display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #e2e8f0;padding-top:16px;margin-top:12px}
    .qr-verify{display:flex;align-items:center;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;padding:10px 12px;border-radius:8px;max-width:390px}
    .legal-bar{margin-top:14px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10.5px;color:#64748b;display:flex;justify-content:space-between}
    @media print{.actions{display:none}body{background:#fff;padding:0}.page{border:none;box-shadow:none;padding:12px}}
  </style></head><body>
  <div class="actions">
    <span style="font-size:12px;color:#475569;font-weight:600">Recetario Electrónico Legal (Ley Nacional 27.553 · Estándar RCTA)</span>
    <button class="btn" onclick="window.print()">Imprimir / Descargar Receta PDF</button>
  </div>
  <div class="page">
    <div class="rcta-header">
      <div class="clinic-brand">
        <div class="logo-mark">A</div>
        <div>
          <div style="font-size:19px;font-weight:800;color:#1b4c37">${esc(clinicName)}</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a">${esc(doc.name)} · <span style="color:#1b4c37">${esc(doc.licenseNumber)}</span></div>
          <div style="font-size:11.5px;color:#475569">${esc(doc.specialty)} · ${esc(doc.address)}</div>
        </div>
      </div>
      <div class="cuir-box">
        <span style="background:#1b4c37;color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:4px;letter-spacing:0.6px">RECETA ELECTRÓNICA LEY 27.553</span>
        ${renderBarcodeSvg(cuir)}
        <div class="cuir-code">CUIR: ${esc(cuir)}</div>
      </div>
    </div>

    <div class="patient-panel">
      <div><small>Paciente</small><b>${esc(nameOf(p))}</b></div>
      <div><small>DNI / Documento</small><b>${esc(p?.dni || '—')}</b> ${p?.birthDate ? `(${calcAge(p.birthDate)} años)` : ''}</div>
      <div><small>Cobertura / Obra Social</small><b>${esc(p?.coverage || 'Particular')}</b> ${p?.affiliateNumber ? `· N° ${esc(p.affiliateNumber)}` : ''}</div>
      <div><small>Fecha de Prescripción</small>${fmtDate(rx.createdAt, true)}</div>
      <div><small>Válida en Farmacias Hasta</small><b>${fmtDate(validUntilDate, true)} (30 días)</b></div>
      <div><small>Diagnóstico / CIE-10</small><b>${esc(rx.diagnosis || 'Tratamiento médico ambulatorio')}</b></div>
    </div>

    <div class="rp-container">
      <div class="rp-symbol">
        <span>Rp /</span>
        <span style="font-family:sans-serif;font-size:11px;font-weight:600;color:#64748b">Prescripción Farmacológica Oficial</span>
      </div>

      ${meds ? meds.map((m, idx) => `
        <div class="med-card">
          <div class="med-title">
            <span>${idx + 1}. ${esc(m.drug)} ${m.presentation ? `— <span style="font-weight:600;color:#1b4c37">${esc(m.presentation)}</span>` : ''}</span>
            <span style="font-size:12px;background:#eaf4ec;color:#1b4c37;padding:2px 8px;border-radius:99px">Cantidad: ${esc(String(m.quantity || '1 envase'))}</span>
          </div>
          <div class="med-posology"><b>Posología / Indicaciones:</b> ${esc(m.dosage || 'Según indicación médica.')}</div>
        </div>
      `).join('') : ''}

      ${(!meds || rx.content) ? `<div style="font-size:13.5px;white-space:pre-wrap;line-height:1.65;color:#1e293b;margin-top:${meds ? '10px' : '0'}">${esc(rx.content)}</div>` : ''}
    </div>

    <div class="rcta-footer">
      <div class="qr-verify">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=82x82&data=${encodeURIComponent(qrPayload)}" width="82" height="82" alt="QR Validación Farmacia">
        <div style="font-size:11px;color:#334155;line-height:1.4">
          <strong style="color:#1b4c37;display:block;font-size:11.5px">✓ VALIDACIÓN FARMACÉUTICA NACIONAL</strong>
          Receta firmada electrónicamente con trazabilidad SHA-256.<br>
          <b>CUIR:</b> <span style="font-family:monospace">${esc(cuir)}</span><br>
          Válida para dispensa en todas las farmacias del país (Ley 27.553 / Dec. 345/2024).
        </div>
      </div>
      ${renderSignatureStampHtml(doc)}
    </div>

    <div class="legal-bar">
      <span>Documento generado por ${esc(clinicName)} · Registro Nacional de Recetas Electrónicas</span>
      <span>Ref. Interna: ${esc(rx.id)} · Integridad Criptográfica Verificada</span>
    </div>
  </div></body></html>`);
  win.document.close();
}

function quoteForm(patientId = null) {
  const p = patientId ? patientBy(patientId) : (S.selectedPatient ? patientBy(S.selectedPatient) : S.data.patients[0]);
  const mh = p?.medicalHistory || {};
  const defaultItems = [
    { description: 'Cámara Hiperbárica (Sesiones de Oxigenación 1.45 ATA)', quantity: 5, unitPrice: 45000 },
    { description: 'Sueroterapia Endovenosa Personalizada (Vitamina C + Oligoelementos)', quantity: 5, unitPrice: 65000 },
    { description: 'Cabina de Fotobiomodulación Sistémica (Luz Roja 660nm + Infrarroja 850nm)', quantity: 5, unitPrice: 32000 }
  ];
  const initialContext = mh.pathological && mh.pathological !== 'Sin patologías crónicas declaradas.'
    ? `Paciente con antecedentes de: ${mh.pathological}. ${mh.medications ? `Medicación actual: ${mh.medications}.` : ''} Se diseña Etapa 1 intensiva de regeneración celular.`
    : `Programa personalizado para ${nameOf(p)}, enfocado en optimización mitocondrial, modulación inflamatoria y recuperación de vitalidad biológica.`;

  formDialog('quote', 'Nuevo Programa Clínico & Presupuesto con IA', 'Genera presupuestos médicos o programas integrales de múltiples páginas estilo "Programa Signature" con asistencia de IA.',
    `<div class="form-field full" style="background:linear-gradient(135deg,#f0fdf4 0%,#eff6ff 100%);border:1px solid #bbf7d0;border-radius:10px;padding:12px 14px;margin-bottom:4px">
      <div class="between" style="flex-wrap:wrap;gap:8px">
        <div>
          <strong style="font-size:13px;color:#14532d;display:flex;align-items:center;gap:6px">${icon('spark', 15)} Asistente IA · Generador de Programa Clínico Signature</strong>
          <span class="tiny muted">Redacta automáticamente los fundamentos clínicos, objetivos, detalle de las 3 terapias y opciones de pago (contado vs. 3 cuotas con 10% recargo).</span>
        </div>
        <div class="flex" style="gap:6px;flex-wrap:wrap">
          <button type="button" class="btn small primary" id="btn-ai-signature-stage1" style="background:#1b4c37">${icon('spark', 12)} Generar Programa Signature · Etapa 1</button>
          <button type="button" class="btn small" id="btn-ai-signature-longevity">Programa Longevidad & Detox</button>
        </div>
      </div>
    </div>` +
    patientSelect(p?.id) +
    selectField('Profesional responsable (Imprime firma y matrícula)', 'doctorId', (S.data.doctors || []).map(d => [d.id, `${d.name} (${d.licenseNumber || 'M.N.'})`]), S.doctor || S.data.doctors[0]?.id) +
    field('Título del Programa / Tratamiento *', 'title', 'text', 'Programa Signature · Etapa 1 (Cámara Hiperbárica + Sueroterapia + Fotobiomodulación)', 'required maxlength="200" placeholder="Ej: Programa Signature · Etapa 1"', true) +
    selectField('Moneda', 'currency', [['ARS', 'ARS - Pesos Argentinos'], ['USD', 'USD - Dólares Estadounidenses']], 'ARS') +
    field('Bonificación / Descuento (%)', 'discount', 'number', '0', 'min="0" max="100" step="1"') +
    field('Recargo Plan 3 Cuotas (%)', 'surchargePercent', 'number', '10', 'min="0" max="100" step="1"') +
    field('Fecha de Validez', 'validUntil', 'date', plusDays(dateKey(), 15), 'required') +
    `<div class="form-field full">
      <label>Terapias, Sesiones y Conceptos Incluidos en el Programa</label>
      <div id="quote-items-container">
        ${defaultItems.map((it, idx) => `
          <div class="quote-item-row" data-idx="${idx}">
            <input type="text" class="quote-desc" value="${esc(it.description)}" placeholder="Terapia o concepto" required>
            <input type="number" class="quote-qty" value="${it.quantity}" min="1" step="1" placeholder="Sesiones" required style="width:70px">
            <input type="number" class="quote-price" value="${it.unitPrice}" min="0" step="100" placeholder="Precio Unit" required style="width:110px">
            <span class="quote-subtotal" style="font-weight:700;font-size:12px;color:#1b4c37">$${(it.quantity * it.unitPrice).toLocaleString('es-AR')}</span>
            <button type="button" class="icon-btn remove-quote-item" style="color:#b91c1c">${icon('close', 14)}</button>
          </div>
        `).join('')}
      </div>
      <div class="between" style="margin-top:8px;flex-wrap:wrap;gap:8px">
        <button type="button" class="btn small" id="add-quote-item-btn">${icon('plus', 12)} Agregar otra terapia o concepto</button>
        <div id="quote-live-summary" style="font-size:12.5px;color:#18362b;font-weight:700"></div>
      </div>
    </div>

    <details class="form-field full" open style="border:1px solid #d8e4da;border-radius:10px;padding:12px 14px;background:#f8fbf9">
      <summary style="cursor:pointer;font-weight:700;font-size:12.5px;color:#1b4c37">Secciones del Documento "Programa Signature" (Generadas por IA · Editables)</summary>
      <div class="form-grid" style="margin-top:10px">
        ${field('Subtítulo de Etapa', 'stageSubtitle', 'text', 'ETAPA 1 · PROGRAMA CLÍNICO INTENSIVO PERSONALIZADO', '', true)}
        ${area('1. Contexto Clínico Personalizado del Paciente', 'clinicalContext', initialContext, 'style="height:58px"')}
        ${area('2. Por qué una etapa intensiva (Fundamento Médico)', 'rationale', 'Una etapa intensiva inicial permite generar un estímulo biológico sostenido y sinérgico. Al combinar oxigenación hiperbárica, reposición endovenosa de micronutrientes y fotobiomodulación en una ventana terapéutica concentrada, logramos reactivar la función mitocondrial y acelerar la respuesta clínica desde las primeras semanas.', 'style="height:68px"')}
        ${area('3. Qué buscamos en esta etapa (Objetivos separados por línea)', 'objectivesText', 'Reducir la inflamación celular crónica y el estrés oxidativo sistémico.\nOptimizar la producción de energía mitocondrial (ATP) y la vitalidad diaria.\nMejorar la oxigenación de tejidos profundos, la microcirculación y la recuperación.\nFortalecer la respuesta inmunológica, el descanso reparador y el equilibrio autonómico (HRV).', 'style="height:78px"')}
        ${area('4. Cómo se organiza la etapa y acompañamiento médico', 'schedulePlan', 'Frecuencia recomendada: 2 a 3 visitas semanales durante 4 a 6 semanas consecutivas. En cada visita se articulan las sesiones de forma coordinada con monitoreo de signos vitales y variabilidad cardíaca (HRV).', 'style="height:58px"')}
      </div>
    </details>` +
    area('Observaciones adicionales / Notas al pie', 'notes', '', 'maxlength="2000" placeholder="Notas u observaciones específicas para el paciente..."'),
    'Emitir Programa y Presupuesto PDF', '', 'wide'
  );

  setTimeout(() => {
    const container = $('#quote-items-container');
    const summaryEl = $('#quote-live-summary');
    const updateSubtotals = () => {
      let sum = 0;
      container?.querySelectorAll('.quote-item-row').forEach(row => {
        const qty = Number(row.querySelector('.quote-qty')?.value || 1);
        const price = Number(row.querySelector('.quote-price')?.value || 0);
        const sub = row.querySelector('.quote-subtotal');
        const rowTotal = qty * price;
        sum += rowTotal;
        if (sub) sub.textContent = '$' + rowTotal.toLocaleString('es-AR');
      });
      const disc = Number($('#field-discount')?.value || 0);
      const sur = Number($('#field-surchargePercent')?.value || 10);
      const finalTotal = Math.max(0, sum - (sum * disc / 100));
      const cuota = Math.round((finalTotal * (1 + sur / 100)) / 3);
      if (summaryEl) {
        summaryEl.innerHTML = `Total Contado: <span style="color:#15803d">$${finalTotal.toLocaleString('es-AR')}</span> · 3 Cuotas (+${sur}%): <span style="color:#1e40af">3 x $${cuota.toLocaleString('es-AR')}</span>`;
      }
    };
    updateSubtotals();
    container?.addEventListener('input', updateSubtotals);
    $('#field-discount')?.addEventListener('input', updateSubtotals);
    $('#field-surchargePercent')?.addEventListener('input', updateSubtotals);
    container?.addEventListener('click', e => {
      const btn = e.target.closest('.remove-quote-item');
      if (btn && container.children.length > 1) {
        btn.closest('.quote-item-row').remove();
        updateSubtotals();
      }
    });
    $('#add-quote-item-btn')?.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'quote-item-row';
      row.innerHTML = `
        <input type="text" class="quote-desc" placeholder="Terapia / Práctica" required>
        <input type="number" class="quote-qty" value="1" min="1" step="1" placeholder="Cant" required style="width:70px">
        <input type="number" class="quote-price" value="0" min="0" step="100" placeholder="Precio Unit" required style="width:110px">
        <span class="quote-subtotal" style="font-weight:700;font-size:12px;color:#1b4c37">$0</span>
        <button type="button" class="icon-btn remove-quote-item" style="color:#b91c1c">${icon('close', 14)}</button>
      `;
      container?.append(row);
    });

    const setProgramPreset = (preset) => {
      const patId = $('#field-patientId')?.value;
      const curPat = patientBy(patId) || p;
      const curMh = curPat?.medicalHistory || {};
      const patRecords = (S.data?.records || []).filter(r => r.patientId === curPat?.id);
      const lastProblem = patRecords[0]?.problem || patRecords[0]?.title || curMh.pathological || 'Fatiga celular y modulación inflamatoria';
      if (preset === 'stage1') {
        if ($('#field-title')) $('#field-title').value = 'Programa Signature · Etapa 1 (Cámara Hiperbárica + Sueroterapia + Fotobiomodulación)';
        if ($('#field-stageSubtitle')) $('#field-stageSubtitle').value = 'ETAPA 1 · PROGRAMA CLÍNICO INTENSIVO PERSONALIZADO';
        if ($('#field-clinicalContext')) $('#field-clinicalContext').value = `Diseñado para ${nameOf(curPat)} (foco clínico: ${lastProblem}). Combina las tres terapias pilares para restaurar la oxigenación tisular, reponer micronutrientes esenciales por vía endovenosa y activar la energía mitocondrial.`;
      } else {
        if ($('#field-title')) $('#field-title').value = 'Programa Signature · Detox Celular & Longevidad Saludable';
        if ($('#field-stageSubtitle')) $('#field-stageSubtitle').value = 'PROGRAMA INTEGRATIVO DE DETOXIFICACIÓN Y LONGEVIDAD';
        if ($('#field-clinicalContext')) $('#field-clinicalContext').value = `Protocolo avanzado para ${nameOf(curPat)} orientado a quelación suave, soporte antioxidante con Glutatión/Vitamina C, fotobiomodulación y oxigenación hiperbárica.`;
      }
      toast('Programa clínico personalizado con IA a partir de la historia clínica del paciente.');
    };

    $('#btn-ai-signature-stage1')?.addEventListener('click', () => setProgramPreset('stage1'));
    $('#btn-ai-signature-longevity')?.addEventListener('click', () => setProgramPreset('longevity'));
  }, 50);
}

function viewAttachmentModal(recordIdOrUrl, fileIdxOrName = 0, explicitType = '') {
  let att = null;
  let subtitle = 'Documento adjunto';
  if (typeof recordIdOrUrl === 'string' && (recordIdOrUrl.startsWith('data:') || recordIdOrUrl.startsWith('http') || recordIdOrUrl.startsWith('blob:'))) {
    att = { data: recordIdOrUrl, name: String(fileIdxOrName || 'Archivo adjunto'), type: explicitType || '' };
  } else {
    const r = (S.data?.records || S.portal?.data?.records || []).find(x => x.id === recordIdOrUrl);
    att = r?.content?.attachments?.[fileIdxOrName] || r?.attachments?.[fileIdxOrName];
    if (r) subtitle = `${r.content?.title || r.content?.problem || r.title || 'Documento adjunto'} · ${fmtDate(r.createdAt, true)}`;
  }
  const src = att?.data || att?.dataUrl || att?.url || '';
  if (!src) return toast('Archivo adjunto no disponible.', true);
  const isPdf = att.type === 'application/pdf' || (att.name || '').toLowerCase().endsWith('.pdf') || src.startsWith('data:application/pdf');
  showModal(att.name || 'Archivo adjunto', subtitle,
    `<div style="text-align:center;margin-bottom:12px">
      ${isPdf
        ? `<iframe src="${src}" style="width:100%;height:500px;border:1px solid #cbd5e1;border-radius:8px"></iframe>`
        : `<img src="${src}" style="max-width:100%;max-height:500px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)" alt="${esc(att.name || 'Adjunto')}">`
      }
    </div>
    <div class="dialog-actions">
      <button class="btn" data-action="close-modal">Cerrar</button>
      <a href="${src}" download="${esc(att.name || 'archivo')}" class="btn primary">${icon('download', 14)} Descargar Archivo</a>
    </div>`,
    '', 'wide'
  );
}

function medicalOrderDialog(patientId = null) {
  const p = patientBy(patientId) || S.data.patients[0];
  if (!p) {
    toast('Debes registrar un paciente antes de emitir una indicación médica.', true);
    return;
  }
  const inventory = S.data.inventory || [];
  const doctors = S.data.doctors || [];

  formDialog('medical-order', 'Nueva Indicación Médica para Enfermería',
    `Paciente: ${nameOf(p)} · Prescripción y descuento automático de stock`,
    `<input type="hidden" name="patientId" value="${p.id}">
    ${selectField('Médico Prescriptor', 'doctorId', doctors.map(d => [d.id, `${d.name} (${d.specialty})`]), doctors[0]?.id, true)}
    <div class="form-field full">
      <label>Instrucciones y Cuidados Clínicos para Enfermería *</label>
      <textarea name="instructions" class="input" style="height:80px" required placeholder="Ej: Colocar vía periférica en MSI. Administrar Solución Fisiológica 500ml + Ketorolac 30mg lento en 30 min. Control de TA y FC post infusión."></textarea>
    </div>
    <div class="form-field full">
      <div class="between" style="margin-bottom:6px">
        <label style="margin:0">Insumos y Medicamentos (se descuentan del stock al administrar):</label>
        <button type="button" class="btn small" id="add-order-item-btn">${icon('plus', 12)} Agregar Insumo</button>
      </div>
      <div id="order-items-container" style="display:flex;flex-direction:column;gap:8px"></div>
      <input type="hidden" name="itemsJson" id="order-items-json" value="[]">
    </div>
    <div class="form-field full">
      <label>Observaciones o Pautas de Alarma (Opcional)</label>
      <input type="text" name="notes" class="input" placeholder="Ej: Avisar ante náuseas o mareos.">
    </div>`,
    'Emitir Indicación a Enfermería', '', 'wide'
  );

  setTimeout(() => {
    const container = $('#order-items-container');
    const itemsJsonInput = $('#order-items-json');

    const updateItems = () => {
      const rows = Array.from(container.querySelectorAll('.order-item-row'));
      const items = rows.map(r => {
        const sel = r.querySelector('.item-inventory-select');
        const opt = sel?.options[sel.selectedIndex];
        return {
          inventoryId: sel?.value || '',
          name: opt?.dataset.name || '',
          quantity: parseInt(r.querySelector('.item-qty')?.value, 10) || 1,
          unit: opt?.dataset.unit || 'uds',
          route: r.querySelector('.item-route')?.value || 'EV'
        };
      }).filter(x => x.inventoryId);
      if (itemsJsonInput) itemsJsonInput.value = JSON.stringify(items);
    };

    const addRow = () => {
      const row = document.createElement('div');
      row.className = 'order-item-row flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      row.innerHTML = `
        <select class="input item-inventory-select grow" style="font-size:12px">
          <option value="">-- Seleccionar insumo del stock clínico --</option>
          ${inventory.map(i => `<option value="${i.id}" data-name="${esc(i.name)}" data-unit="${esc(i.unit)}">${esc(i.name)} (Stock actual: ${i.quantity} ${esc(i.unit)})</option>`).join('')}
        </select>
        <input type="number" class="input item-qty" value="1" min="1" max="999" style="width:70px;text-align:center" title="Cantidad">
        <select class="input item-route" style="width:110px;font-size:12px">
          <option value="EV">Vía EV</option>
          <option value="IM">Vía IM</option>
          <option value="SC">Vía SC</option>
          <option value="VO">Vía Oral</option>
          <option value="Tópica">Tópica</option>
          <option value="Inhalatoria">Inhalatoria</option>
        </select>
        <button type="button" class="icon-btn remove-order-item" style="color:#e53e3e">${icon('close', 14)}</button>
      `;
      container.appendChild(row);
      updateItems();
    };

    addRow();

    $('#add-order-item-btn')?.addEventListener('click', addRow);
    container?.addEventListener('input', updateItems);
    container?.addEventListener('change', updateItems);
    container?.addEventListener('click', e => {
      if (e.target.closest('.remove-order-item')) {
        e.target.closest('.order-item-row')?.remove();
        updateItems();
      }
    });
  }, 50);
}

function getAmbulatoryResources() {
  const custom = S.data?.settings?.ambulatoryResources;
  if (Array.isArray(custom) && custom.length) return custom;
  return [
    { id: 'sill-1', name: 'Sillón 1', type: 'SUEROTERAPIA', label: 'Sueroterapia / Infusión' },
    { id: 'sill-2', name: 'Sillón 2', type: 'SUEROTERAPIA', label: 'Sueroterapia / Infusión' },
    { id: 'sill-3', name: 'Sillón 3', type: 'SUEROTERAPIA', label: 'Sueroterapia / Infusión' },
    { id: 'sill-4', name: 'Sillón 4', type: 'SUEROTERAPIA', label: 'Sueroterapia / Infusión' },
    { id: 'cam-1', name: 'Cámara Hiperbárica 1', type: 'CAMARA_HIPERBARICA', label: 'Medicina Hiperbárica' },
    { id: 'luz-1', name: 'Cabina Fotobiomodulación', type: 'FOTOBIOMODULACION', label: 'Terapia de Luz / LED' }
  ];
}

function getPatientBillingBadge(patientId) {
  const patsPayments = (S.data?.payments || []).filter(p => p.patientId === patientId && p.movementType !== 'EXPENSE');
  const totalPaid = patsPayments.reduce((s, p) => s + (p.amountCents || 0) / 100, 0);
  const approvedQuote = (S.data?.quotes || []).find(q => q.patientId === patientId && q.status === 'APPROVED');
  const todayAppt = (S.data?.appointments || []).find(a => a.patientId === patientId && a.status !== 'CANCELLED' && a.startAt && dateKey(a.startAt) === dateKey());
  const payBadge = totalPaid > 0
    ? `<span class="badge green" style="font-size:10px" title="Pagos/Señas registrados para este paciente">✓ Abonado: ${fmtMoney(totalPaid)}</span>`
    : approvedQuote
      ? `<span class="badge blue" style="font-size:10px">Presupuesto Aprobado (Pend. cobro)</span>`
      : `<span class="badge amber" style="font-size:10px">Sin pago registrado</span>`;
  const apptBadge = todayAppt ? `<span class="badge gray" style="font-size:10px">Turno hoy ${fmtTime(todayAppt.startAt)} hs</span>` : '';
  return `${payBadge}${apptBadge}`;
}

function configAmbulatoryResourcesDialog() {
  const list = getAmbulatoryResources();
  showModal(
    'Configurar Sillones, Cámaras y Boxes',
    'Personaliza los recursos físicos de Terapias Ambulatorias para tu clínica (se guarda en la configuración del centro).',
    `<form data-form="config-ambulatory-resources">
      <div id="amb-res-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
        ${list.map(r => `
          <div class="amb-res-row flex" style="gap:8px;align-items:center">
            <input type="text" class="input amb-name grow" value="${esc(r.name)}" placeholder="Nombre (ej: Sillón 5, Box Ozono 1)" required>
            <select class="input amb-type" style="width:185px">
              <option value="SUEROTERAPIA" ${r.type === 'SUEROTERAPIA' ? 'selected' : ''}>Sueroterapia / Infusión</option>
              <option value="CAMARA_HIPERBARICA" ${r.type === 'CAMARA_HIPERBARICA' ? 'selected' : ''}>Cámara Hiperbárica</option>
              <option value="FOTOBIOMODULACION" ${r.type === 'FOTOBIOMODULACION' ? 'selected' : ''}>Fotobiomodulación</option>
              <option value="OTRO" ${r.type === 'OTRO' ? 'selected' : ''}>Otro Box / Terapia</option>
            </select>
            <input type="text" class="input amb-label" value="${esc(r.label || '')}" placeholder="Descripción" style="width:160px">
            <button type="button" class="icon-btn remove-amb-res" style="color:#b91c1c">${icon('close', 14)}</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn small" id="add-amb-res-btn">${icon('plus', 12)} Agregar Sillón / Box</button>
      <input type="hidden" name="resourcesJson" id="amb-res-json" value="[]">
      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        ${btn('Cancelar', 'close-modal', '', '', 'type="button"')}
        <button class="btn primary" type="submit">${icon('check', 14)} Guardar Recursos</button>
      </div>
    </form>`,
    '', 'wide'
  );
  setTimeout(() => {
    const listEl = $('#amb-res-list');
    const sync = () => {
      const rows = Array.from(listEl?.querySelectorAll('.amb-res-row') || []);
      const data = rows.map((row, idx) => ({
        id: 'res-' + (idx + 1),
        name: row.querySelector('.amb-name')?.value?.trim() || '',
        type: row.querySelector('.amb-type')?.value || 'SUEROTERAPIA',
        label: row.querySelector('.amb-label')?.value?.trim() || 'Terapia Ambulatoria'
      })).filter(x => x.name);
      if ($('#amb-res-json')) $('#amb-res-json').value = JSON.stringify(data);
    };
    $('#add-amb-res-btn')?.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'amb-res-row flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      row.innerHTML = `
        <input type="text" class="input amb-name grow" placeholder="Nombre del Sillón o Box" required>
        <select class="input amb-type" style="width:185px">
          <option value="SUEROTERAPIA">Sueroterapia / Infusión</option>
          <option value="CAMARA_HIPERBARICA">Cámara Hiperbárica</option>
          <option value="FOTOBIOMODULACION">Fotobiomodulación</option>
          <option value="OTRO">Otro Box / Terapia</option>
        </select>
        <input type="text" class="input amb-label" value="Sueroterapia / Infusión" placeholder="Descripción" style="width:160px">
        <button type="button" class="icon-btn remove-amb-res" style="color:#b91c1c">${icon('close', 14)}</button>
      `;
      listEl?.appendChild(row);
      sync();
    });
    listEl?.addEventListener('input', sync);
    listEl?.addEventListener('change', sync);
    listEl?.addEventListener('click', e => {
      if (e.target.closest('.remove-amb-res') && listEl.children.length > 1) {
        e.target.closest('.amb-res-row')?.remove();
        sync();
      }
    });
    sync();
  }, 40);
}

function hospitalDayView() {
  const d = S.data;
  const orders = d?.medicalOrders || [];
  const inventory = d?.inventory || [];
  const filter = S.hospitalDayFilter || 'ALL';

  const defaultResources = getAmbulatoryResources();

  const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS');
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const administeredToday = orders.filter(o => o.status === 'ADMINISTERED' && o.administeredAt && o.administeredAt.startsWith(dateKey()));

  const resourceCards = defaultResources.map(res => {
    const activeOrder = inProgressOrders.find(o => o.resource === res.name) || pendingOrders.find(o => o.resource === res.name);
    return { ...res, order: activeOrder };
  });

  const filteredOrders = orders.filter(o => {
    if (filter === 'PENDING') return o.status === 'PENDING';
    if (filter === 'IN_PROGRESS') return o.status === 'IN_PROGRESS';
    if (filter === 'ADMINISTERED') return o.status === 'ADMINISTERED';
    if (filter === 'SUEROTERAPIA') return o.therapyType === 'SUEROTERAPIA';
    if (filter === 'CAMARA_HIPERBARICA') return o.therapyType === 'CAMARA_HIPERBARICA';
    if (filter === 'FOTOBIOMODULACION') return o.therapyType === 'FOTOBIOMODULACION';
    return true;
  });

  return heading('Terapias Ambulatorias',
    'Gestión configurable de sillones de sueroterapia, cámara hiperbárica y fotobiomodulación con control de pagos, evolución de enfermería y descuento automático de insumos.',
    `<div class="flex" style="gap:8px;flex-wrap:wrap">
      <button class="btn" data-action="config-ambulatory-resources">${icon('settings', 14)} Configurar Sillones / Boxes</button>
      <button class="btn primary" data-action="new-hospital-day-order">${icon('plus', 14)} Nueva Indicación por Sesión</button>
    </div>`
  ) + `
  <div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    ${stat('Sillones / Boxes Ocupados', `${inProgressOrders.length} / ${defaultResources.length}`, 'activity', `${inProgressOrders.length} pacientes en sesión activa`, inProgressOrders.length > 0)}
    ${stat('Sesiones en Espera', pendingOrders.length, 'clock', `${pendingOrders.length} pacientes programados`, pendingOrders.length > 0)}
    ${stat('Sesiones Finalizadas Hoy', administeredToday.length, 'checkcircle', 'Stock descontado automáticamente')}
    ${stat('Insumos de Suero en Stock', inventory.filter(i => /suer|ampolla|vitamina|zinc|taurina|selenio/i.test(i.name)).length, 'box', 'Fármacos y descartables activos')}
  </div>

  <section class="panel" style="margin-bottom:24px">
    <div class="panel-header">
      <div>
        <h2>Mapa de Ocupación en Tiempo Real</h2>
        <p class="panel-sub">Estado vivo de sillones de infusión, cámara hiperbárica y cabina de fotobiomodulación.</p>
      </div>
      <div class="flex" style="gap:10px">
        <span class="badge green"><i class="dot"></i> Disponible</span>
        <span class="badge blue"><i class="dot"></i> En Sesión / Infusión</span>
        <span class="badge amber"><i class="dot"></i> Esperando Paciente</span>
      </div>
    </div>
    <div class="panel-body">
      <div class="hospital-day-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
        ${resourceCards.map(rc => {
          const ord = rc.order;
          const isOcc = Boolean(ord && ord.status === 'IN_PROGRESS');
          const isPend = Boolean(ord && ord.status === 'PENDING');
          const pat = ord ? patientBy(ord.patientId) : null;
          const items = ord?.items || [];

          return `
          <div class="hospital-box-card" style="border:1px solid ${isOcc ? '#3b82f6' : isPend ? '#f59e0b' : '#e2e8f0'};border-radius:12px;padding:16px;background:${isOcc ? '#eff6ff' : isPend ? '#fffbeb' : '#ffffff'};box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:all 0.2s ease">
            <div class="between" style="margin-bottom:10px">
              <div>
                <b style="font-size:14px;color:#0f172a;display:block">${esc(rc.name)}</b>
                <span style="font-size:11px;color:#64748b">${esc(rc.label)}</span>
              </div>
              <span class="badge ${isOcc ? 'blue' : isPend ? 'amber' : 'green'}" style="font-size:11px;font-weight:700">
                <i class="dot"></i> ${isOcc ? 'En Sesión' : isPend ? 'Paciente Esperado' : 'Disponible'}
              </span>
            </div>

            ${ord ? `
              <div style="background:#ffffff;border-radius:8px;padding:10px 12px;border:1px solid rgba(0,0,0,0.08);margin-bottom:12px">
                <div class="between">
                  <b style="font-size:13px;color:#18362b">${esc(nameOf(pat))}</b>
                  <span class="tiny muted">DNI ${esc(pat?.dni || '—')}</span>
                </div>
                <div class="flex" style="gap:4px;flex-wrap:wrap;margin-top:5px">
                  ${getPatientBillingBadge(ord.patientId)}
                </div>
                <div style="font-size:12px;color:#334155;margin-top:5px">
                  <b>Terapia:</b> ${esc(ord.therapyType || 'Sueroterapia')} · Sesión ${ord.sessionNumber || 1}/${ord.totalSessions || 1}
                </div>
                <div style="font-size:11.5px;color:#64748b;margin-top:3px">
                  <b>Médico:</b> ${esc(ord.doctorName)}
                </div>
                ${items.length ? `
                  <div style="margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0;font-size:11px;color:#475569">
                    <b>Fármacos/Insumos:</b> ${items.map(it => `${esc(it.name)}${it.dose ? ` (${esc(it.dose)})` : ''}`).slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''}
                  </div>
                ` : ''}
              </div>

              <div class="flex" style="gap:8px">
                ${isPend ? `
                  <button class="btn primary small wide" data-action="hd-checkin" data-id="${ord.id}" style="background:#15803d">
                    ${icon('check', 13)} Paciente Llegó / Ocupar Sillón
                  </button>
                ` : `
                  <button class="btn primary small wide" data-action="hd-finish" data-id="${ord.id}" style="background:#1b4c37">
                    ${icon('checkcircle', 13)} Finalizar Sesión & Descontar Stock
                  </button>
                `}
              </div>
            ` : `
              <div style="padding:20px 10px;text-align:center;color:#64748b;font-size:12px">
                Sillón libre y sanitizado listo para asignar.
              </div>
              <button class="btn small wide" data-action="new-hospital-day-order" data-resource="${esc(rc.name)}" style="border-style:dashed;color:#1b4c37">
                ${icon('plus', 12)} Asignar Paciente / Terapia
              </button>
            `}
          </div>`;
        }).join('')}
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="panel-header">
      <div>
        <h2>Kardex de Terapias Ambulatorias y Administración de Insumos</h2>
        <p class="panel-sub">Órdenes médicas por sesión, evolución separada de enfermería y descuento automático de inventario.</p>
      </div>
      <div class="flex" style="gap:8px;flex-wrap:wrap">
        <button class="chip ${filter === 'ALL' ? 'active' : ''}" data-action="hd-filter" data-val="ALL">Todas (${orders.length})</button>
        <button class="chip ${filter === 'PENDING' ? 'active' : ''}" data-action="hd-filter" data-val="PENDING">Pendientes (${pendingOrders.length})</button>
        <button class="chip ${filter === 'IN_PROGRESS' ? 'active' : ''}" data-action="hd-filter" data-val="IN_PROGRESS">En Sillón (${inProgressOrders.length})</button>
        <button class="chip ${filter === 'ADMINISTERED' ? 'active' : ''}" data-action="hd-filter" data-val="ADMINISTERED">Finalizadas</button>
      </div>
    </div>
    <div class="panel-body">
      ${filteredOrders.length ? `
        <div style="display:flex;flex-direction:column;gap:12px">
          ${filteredOrders.map(o => {
            const pat = patientBy(o.patientId);
            const isPending = o.status === 'PENDING';
            const isInProgress = o.status === 'IN_PROGRESS';
            const isAdministered = o.status === 'ADMINISTERED';
            const items = o.items || [];
            const vitals = o.vitals || {};
            const hasMoreSessions = isAdministered && (Number(o.sessionNumber || 1) < Number(o.totalSessions || 1));

            return `
            <div class="soap-item" style="border-left:4px solid ${isPending ? '#f59e0b' : isInProgress ? '#3b82f6' : '#15803d'};padding:16px;background:#ffffff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
              <div class="between" style="align-items:flex-start;flex-wrap:wrap;gap:10px">
                <div>
                  <div class="flex" style="gap:8px;align-items:center;flex-wrap:wrap">
                    <strong style="font-size:15px;color:#18362b">${esc(nameOf(pat))}</strong>
                    <span class="tiny muted">DNI ${esc(pat?.dni || '—')}</span>
                    <span class="badge ${isPending ? 'amber' : isInProgress ? 'blue' : 'green'}">
                      <i class="dot"></i> ${isPending ? 'Pendiente' : isInProgress ? 'En Sillón' : 'Administrado & Descontado'}
                    </span>
                    <span class="badge" style="background:#eaf6ee;color:#1b4c37;font-weight:600">
                      ${esc(o.therapyType || 'Sueroterapia')} · ${esc(o.resource || 'Sillón')} · Sesión ${o.sessionNumber || 1}/${o.totalSessions || 1}
                    </span>
                    ${getPatientBillingBadge(o.patientId)}
                  </div>
                  <div class="tiny muted" style="margin-top:4px">
                    Indicado por <b>${esc(o.doctorName)}</b> · ${fmtDate(o.createdAt, true)} a las ${fmtTime(o.createdAt)} hs
                    ${o.administeredBy ? ` · Administrado por <b>${esc(o.administeredBy)}</b> (${fmtTime(o.administeredAt)} hs)` : ''}
                  </div>
                </div>
                <div class="flex" style="gap:6px;flex-wrap:wrap">
                  <button class="btn small" data-action="new-payment" data-patient-id="${o.patientId}" title="Registrar cobro o seña para este paciente">${icon('wallet', 12)} Cobrar</button>
                  ${isPending ? `
                    <button class="btn small primary" data-action="hd-checkin" data-id="${o.id}" style="background:#15803d">
                      ${icon('check', 13)} Paciente Llegó
                    </button>
                    <button class="btn small danger" data-action="cancel-order" data-id="${o.id}">Cancelar</button>
                  ` : isInProgress ? `
                    <button class="btn small primary" data-action="hd-finish" data-id="${o.id}" style="background:#1b4c37">
                      ${icon('checkcircle', 13)} Finalizar y Descontar Stock
                    </button>
                  ` : `
                    ${hasMoreSessions ? `
                      <button class="btn small primary" data-action="hd-next-session" data-id="${o.id}" style="background:#1d4ed8">
                        ${icon('plus', 13)} Programar Sesión ${(Number(o.sessionNumber || 1) + 1)}/${o.totalSessions}
                      </button>
                    ` : ''}
                    <button class="btn small" data-action="hd-view-evolution" data-patient="${o.patientId}">
                      ${icon('file', 13)} Ver Evolución en HCD
                    </button>
                  `}
                </div>
              </div>

              <div style="margin-top:12px;background:#f8fafc;border-radius:8px;padding:12px;border:1px solid #e2e8f0">
                <div style="font-size:13px;color:#0f172a;margin-bottom:8px">
                  <b>Pautas clínicas:</b> ${esc(o.instructions)}
                </div>
                ${items.length ? `
                  <div style="font-size:12px">
                    <b style="color:#1b4c37;display:block;margin-bottom:6px">Insumos y Fármacos indicados por sesión (descuento automático de inventario):</b>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px">
                      ${items.map(it => `
                        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:6px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center">
                          <span style="font-weight:600;color:#334155">${esc(it.name)}</span>
                          <span class="badge" style="background:#eaf6ee;color:#1b4c37">${esc(it.dose || `${it.quantity} un`)}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>

              ${vitals.bloodPressure || vitals.heartRate || vitals.oxygenSaturation ? `
                <div class="flex" style="gap:12px;margin-top:10px;font-size:11.5px;color:#64748b">
                  ${vitals.bloodPressure ? `<span><b>TA:</b> ${esc(vitals.bloodPressure)} mmHg</span>` : ''}
                  ${vitals.heartRate ? `<span><b>FC:</b> ${esc(vitals.heartRate)} lpm</span>` : ''}
                  ${vitals.oxygenSaturation ? `<span><b>SatO2:</b> ${esc(vitals.oxygenSaturation)}%</span>` : ''}
                </div>
              ` : ''}
            </div>`;
          }).join('')}
        </div>
      ` : empty('Sin sesiones en este filtro', 'No hay órdenes de Terapias Ambulatorias registradas con el filtro seleccionado.', btn('Nueva Indicación por Sesión', 'new-hospital-day-order', 'plus', 'primary'))}
    </div>
  </section>`;
}

function newHospitalDayOrderDialog(patientId = null, defaultResource = null, defaultTherapy = null, presetOrder = null) {
  const p = patientBy(presetOrder?.patientId || patientId) || S.data.patients[0];
  const inventory = S.data.inventory || [];
  const doctors = S.data.doctors || [];

  const resources = getAmbulatoryResources().map(r => r.name);
  const selResource = presetOrder?.resource || defaultResource || resources[0];
  const selTherapy = presetOrder?.therapyType || defaultTherapy || 'SUEROTERAPIA';
  const nextSessionNum = presetOrder ? Math.min(Number(presetOrder.totalSessions || 1), Number(presetOrder.sessionNumber || 1) + 1) : 1;
  const totSessions = presetOrder ? Number(presetOrder.totalSessions || 5) : 5;

  formDialog('new-hospital-day-order', 'Nueva Indicación de Terapias Ambulatorias por Sesión',
    'Permite que el médico indique los insumos y dosis por sesión. Genera orden para enfermería y descuenta stock automáticamente.',
    `<div class="form-grid">
      <div class="form-field">
        <label>Paciente *</label>
        <select name="patientId" class="input" required>
          ${S.data.patients.map(pt => `<option value="${pt.id}" ${pt.id === p?.id ? 'selected' : ''}>${esc(nameOf(pt))} (DNI ${esc(pt.dni || '—')})</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>Médico Prescriptor *</label>
        <select name="doctorId" class="input" required>
          ${doctors.map(d => `<option value="${d.id}" ${d.id === presetOrder?.doctorId ? 'selected' : ''}>${esc(d.name)} (${esc(d.specialty)})</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>Tipo de Terapia *</label>
        <select name="therapyType" id="hd-therapy-type" class="input" required>
          <option value="SUEROTERAPIA" ${selTherapy === 'SUEROTERAPIA' ? 'selected' : ''}>Sueroterapia / Infusión Endovenosa</option>
          <option value="CAMARA_HIPERBARICA" ${selTherapy === 'CAMARA_HIPERBARICA' ? 'selected' : ''}>Cámara Hiperbárica (CHB)</option>
          <option value="FOTOBIOMODULACION" ${selTherapy === 'FOTOBIOMODULACION' ? 'selected' : ''}>Fotobiomodulación (Luz / Láser)</option>
        </select>
      </div>
      <div class="form-field">
        <label>Sillón / Box de Tratamiento *</label>
        <select name="resource" id="hd-resource-select" class="input" required>
          ${resources.map(r => `<option value="${r}" ${r === selResource ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>Número de Sesión</label>
        <input type="number" name="sessionNumber" value="${nextSessionNum}" min="1" max="99" class="input" required>
      </div>
      <div class="form-field">
        <label>Total de Sesiones Programadas</label>
        <input type="number" name="totalSessions" value="${totSessions}" min="1" max="99" class="input" required>
      </div>
    </div>

    <!-- Presets de Protocolos Rápidos -->
    <div style="margin:16px 0;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
      <b style="font-size:12px;color:#1e4c3a;display:block;margin-bottom:8px">Cargar Protocolo Predefinido:</b>
      <div class="flex" style="gap:8px;flex-wrap:wrap">
        <button type="button" class="btn small" id="hd-preset-myers" style="background:#ffffff;border:1px solid #86efac;color:#166534">
          ${icon('check', 12)} Protocolo Myers & Vit C
        </button>
        <button type="button" class="btn small" id="hd-preset-chb" style="background:#ffffff;border:1px solid #93c5fd;color:#1e40af">
          ${icon('activity', 12)} Cámara Hiperbárica (60 min)
        </button>
        <button type="button" class="btn small" id="hd-preset-luz" style="background:#ffffff;border:1px solid #fbcfe8;color:#9d174d">
          ${icon('sun', 12)} Fotobiomodulación (30 min)
        </button>
      </div>
    </div>

    <!-- Lista de Insumos y Fármacos por Sesión -->
    <div class="form-field full" style="margin-bottom:16px">
      <div class="between" style="margin-bottom:8px">
        <label style="margin:0;font-weight:700;color:#1e4c3a">Insumos y Fármacos indicados por sesión (se descuentan automáticamente):</label>
        <button type="button" class="btn small primary" id="add-hd-supply-btn" style="background:#1b4c37">${icon('plus', 12)} Agregar Insumo</button>
      </div>
      <div id="hd-supplies-container" style="display:flex;flex-direction:column;gap:8px"></div>
      <input type="hidden" name="itemsJson" id="hd-supplies-json" value="[]">
    </div>

    <div class="form-field full">
      <label>Instrucciones y Pautas Clínicas para Enfermería *</label>
      <textarea name="instructions" id="hd-instructions" class="input" style="height:70px" required placeholder="Ej: Pasar en 45 minutos. Control de TA previa y posterior. En caso de mareo reducir goteo a 30 gotas/min.">${esc(presetOrder?.instructions || '')}</textarea>
    </div>
    <div class="form-field full">
      <label>Observaciones o Diagnóstico de Derivación</label>
      <input type="text" name="notes" class="input" value="${esc(presetOrder?.notes || '')}" placeholder="Ej: Fatiga crónica, soporte inmunológico post-viral.">
    </div>`,
    'Emitir Indicación de Terapias Ambulatorias', '', 'wide'
  );

  setTimeout(() => {
    const container = $('#hd-supplies-container');
    const jsonInput = $('#hd-supplies-json');
    const instructionsInput = $('#hd-instructions');

    const updateJson = () => {
      const rows = Array.from(container.querySelectorAll('.hd-supply-row'));
      const items = rows.map(r => ({
        name: r.querySelector('.hd-sup-name')?.value || '',
        dose: r.querySelector('.hd-sup-dose')?.value || '',
        quantity: parseInt(r.querySelector('.hd-sup-qty')?.value, 10) || 1,
        inventoryId: r.querySelector('.hd-sup-inv')?.value || ''
      })).filter(x => x.name.trim());
      if (jsonInput) jsonInput.value = JSON.stringify(items);
    };

    const addRow = (name = '', dose = '', qty = 1, invId = '') => {
      const row = document.createElement('div');
      row.className = 'hd-supply-row flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      row.innerHTML = `
        <input type="text" class="input hd-sup-name grow" placeholder="Fármaco o Insumo (ej. Vitamina C)" value="${esc(name)}" required style="font-size:12.5px">
        <input type="text" class="input hd-sup-dose" placeholder="Dosis (ej. 10 gramos)" value="${esc(dose)}" style="width:130px;font-size:12px">
        <input type="number" class="input hd-sup-qty" value="${qty}" min="1" max="99" style="width:65px;text-align:center" title="Cantidad a descontar de stock">
        <select class="input hd-sup-inv" style="width:170px;font-size:11.5px">
          <option value="">-- Vincular stock --</option>
          ${inventory.map(i => `<option value="${i.id}" ${i.id === invId || i.name.toLowerCase().includes(name.toLowerCase().slice(0, 5)) ? 'selected' : ''}>${esc(i.name)} (${i.quantity} ${esc(i.unit)})</option>`).join('')}
        </select>
        <button type="button" class="icon-btn remove-hd-supply" style="color:#b91c1c">${icon('close', 14)}</button>
      `;
      container.appendChild(row);
      updateJson();
    };

    // Load Myers Preset
    $('#hd-preset-myers')?.addEventListener('click', () => {
      container.innerHTML = '';
      const vitC = inventory.find(i => /vitamina c/i.test(i.name));
      const tau = inventory.find(i => /taurina/i.test(i.name));
      const zin = inventory.find(i => /zinc/i.test(i.name));
      const sel = inventory.find(i => /selenio/i.test(i.name));
      const man = inventory.find(i => /manganeso/i.test(i.name));
      const suer = inventory.find(i => /fisiol/i.test(i.name));
      const guia = inventory.find(i => /guia|gotero/i.test(i.name));
      const cat = inventory.find(i => /cateter/i.test(i.name));

      addRow('Vitamina C Inyectable', '10 gramos', 1, vitC?.id || '');
      addRow('Taurina Inyectable', '200 miligramos', 1, tau?.id || '');
      addRow('Zinc Oligoelemento', '20 miligramos', 1, zin?.id || '');
      addRow('Selenio Oligoelemento', '200 microgramos', 1, sel?.id || '');
      addRow('Manganeso Oligoelemento', '20 miligramos', 1, man?.id || '');
      addRow('Solución Fisiológica 0.9% 500ml', '500 ml', 1, suer?.id || '');
      addRow('Guía de Macrogotero descartable', '1 unidad', 1, guia?.id || '');
      addRow('Catéter Intravenoso 22G', '1 unidad', 1, cat?.id || '');

      if (instructionsInput) instructionsInput.value = 'Infusión endovenosa lenta a 45 gotas/min en MSI. Tiempo estimado: 50 minutos. Control de TA previo y post-infusión.';
      if ($('#hd-therapy-type')) $('#hd-therapy-type').value = 'SUEROTERAPIA';
    });

    // Load CHB Preset
    $('#hd-preset-chb')?.addEventListener('click', () => {
      container.innerHTML = '';
      const barbijo = inventory.find(i => /barbijo|mascara/i.test(i.name));
      addRow('Mascara / Barbijo de Oxigenación', '1 unidad', 1, barbijo?.id || '');
      if (instructionsInput) instructionsInput.value = 'Sesión en Cámara Hiperbárica: Presurización 6 min, permanencia 60 min a 1.45 ATA, despresurización 5 min. Monitoreo de HRV basal y a los 30 min.';
      if ($('#hd-therapy-type')) $('#hd-therapy-type').value = 'CAMARA_HIPERBARICA';
      if ($('#hd-resource-select')) $('#hd-resource-select').value = 'Cámara Hiperbárica 1';
    });

    // Load Luz Preset
    $('#hd-preset-luz')?.addEventListener('click', () => {
      container.innerHTML = '';
      if (instructionsInput) instructionsInput.value = 'Sesión de Fotobiomodulación sistémica: Longitud de onda 660nm (rojo) y 850nm (infrarrojo cercano) por 30 minutos.';
      if ($('#hd-therapy-type')) $('#hd-therapy-type').value = 'FOTOBIOMODULACION';
      if ($('#hd-resource-select')) $('#hd-resource-select').value = 'Cabina Fotobiomodulación';
    });

    $('#add-hd-supply-btn')?.addEventListener('click', () => addRow());
    container?.addEventListener('input', updateJson);
    container?.addEventListener('change', updateJson);
    container?.addEventListener('click', e => {
      if (e.target.closest('.remove-hd-supply')) {
        e.target.closest('.hd-supply-row')?.remove();
        updateJson();
      }
    });

    // Default or preset rows
    if (presetOrder?.items?.length) {
      presetOrder.items.forEach(it => addRow(it.name || '', it.dose || '', it.quantity || 1, it.inventoryId || ''));
    } else {
      addRow('Vitamina C Inyectable', '10 gramos', 1);
    }
  }, 50);
}

function administerHospitalDayDialog(orderId) {
  const ord = (S.data?.medicalOrders || []).find(o => o.id === orderId);
  if (!ord) return;
  const p = patientBy(ord.patientId);
  const items = ord.items || [];

  showModal(
    'Finalizar Sesión & Descontar Insumos de Inventario',
    `Paciente: ${nameOf(p)} · Terapia: ${esc(ord.therapyType || 'Sueroterapia')} (${esc(ord.resource || 'Sillón')})`,
    `<form data-form="finish-hospital-day-order" data-id="${ord.id}">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;margin-bottom:16px">
        <b style="font-size:12.5px;color:#166534;display:block;margin-bottom:6px">Insumos a descontar automáticamente de stock:</b>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${items.map(it => `
            <span class="badge" style="background:#ffffff;border:1px solid #86efac;color:#14532d;font-size:11.5px;padding:4px 8px">
              ${esc(it.name)} ${it.dose ? `(${esc(it.dose)})` : ''} x ${it.quantity || 1}
            </span>
          `).join('') || '<span class="tiny muted">Sin insumos vinculados al inventario</span>'}
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label>Tensión Arterial (TA) *</label>
          <input type="text" name="bloodPressure" value="115/75" required placeholder="Ej: 120/80" class="input">
        </div>
        <div class="form-field">
          <label>Frecuencia Cardíaca (FC) *</label>
          <input type="number" name="heartRate" value="72" required placeholder="lpm" class="input">
        </div>
        <div class="form-field">
          <label>Saturación O2 (%)</label>
          <input type="number" name="oxygenSaturation" value="98" placeholder="%" class="input">
        </div>
        <div class="form-field">
          <label>Tolerancia al Tratamiento *</label>
          <input type="text" name="tolerance" value="Buena tolerancia al tratamiento en decúbito supino, sin intercurrencias." required class="input">
        </div>
      </div>

      <!-- Tabla de HRV (Variabilidad de la Frecuencia Cardíaca) -->
      <div class="form-field full" style="margin-top:14px">
        <div class="between" style="margin-bottom:6px">
          <label style="margin:0">Datos de Variabilidad Cardíaca (HRV) - Opcional:</label>
          <button type="button" class="btn small" id="add-hrv-row-btn">${icon('plus', 12)} Agregar medición HRV</button>
        </div>
        <table class="clinical-table" style="background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden">
          <thead>
            <tr>
              <th>Hora</th><th>HR (FC)</th><th>HRV</th><th>RMSSD</th><th>SDNN</th><th>PNN50</th><th></th>
            </tr>
          </thead>
          <tbody id="hd-hrv-tbody">
            <tr>
              <td><input type="text" class="hrv-time" value="${fmtTime(new Date())}" style="width:60px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
              <td><input type="number" class="hrv-hr" value="70" style="width:60px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
              <td><input type="number" class="hrv-hrv" value="40" style="width:60px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
              <td><input type="text" class="hrv-rmssd" value="13.04" style="width:70px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
              <td><input type="text" class="hrv-sdnn" value="30.46" style="width:70px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
              <td><input type="text" class="hrv-pnn50" value="0" style="width:50px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <input type="hidden" name="hrvJson" id="hd-hrv-json" value="[]">
      </div>

      <div class="form-field full">
        <label>Observaciones de Enfermería</label>
        <textarea name="notes" class="input" style="height:60px" placeholder="Comentarios de cierre de sesión, retiro de vía, etc."></textarea>
      </div>

      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        <button type="button" class="btn" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn primary" style="background:#15803d">
          ${icon('checkcircle', 14)} Finalizar Sesión, Descontar Stock & Guardar HCD
        </button>
      </div>
    </form>`, '', 'wide'
  );

  setTimeout(() => {
    const tbody = $('#hd-hrv-tbody');
    const hrvJson = $('#hd-hrv-json');

    const updateHrv = () => {
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const data = rows.map(r => ({
        time: r.querySelector('.hrv-time')?.value || '',
        hr: r.querySelector('.hrv-hr')?.value || '',
        hrv: r.querySelector('.hrv-hrv')?.value || '',
        rmssd: r.querySelector('.hrv-rmssd')?.value || '',
        sdnn: r.querySelector('.hrv-sdnn')?.value || '',
        pnn50: r.querySelector('.hrv-pnn50')?.value || ''
      })).filter(x => x.time || x.hr);
      if (hrvJson) hrvJson.value = JSON.stringify(data);
    };

    $('#add-hrv-row-btn')?.addEventListener('click', () => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" class="hrv-time" value="${fmtTime(new Date())}" style="width:60px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
        <td><input type="number" class="hrv-hr" value="75" style="width:60px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
        <td><input type="number" class="hrv-hrv" value="35" style="width:60px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
        <td><input type="text" class="hrv-rmssd" value="10.00" style="width:70px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
        <td><input type="text" class="hrv-sdnn" value="25.00" style="width:70px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
        <td><input type="text" class="hrv-pnn50" value="0" style="width:50px;padding:4px;border:1px solid #cbd5e1;border-radius:4px"></td>
        <td><button type="button" class="icon-btn remove-hrv-row" style="color:#b91c1c">${icon('close', 13)}</button></td>
      `;
      tbody.appendChild(tr);
      updateHrv();
    });

    tbody?.addEventListener('input', updateHrv);
    tbody?.addEventListener('click', e => {
      if (e.target.closest('.remove-hrv-row')) {
        e.target.closest('tr')?.remove();
        updateHrv();
      }
    });

    updateHrv();
  }, 50);
}

function patientImportDialog() {
  formDialog('patient-importer', 'Importación Masiva de Pacientes (CSV / Excel)',
    'Transfiere o actualiza el padrón de pacientes, coberturas médicas, datos de contacto y antecedentes clínicos desde archivos CSV o planillas Excel tabuladas.',
    `<div class="form-field full">
      <div class="info-box">
        ${icon('upload', 18)}
        <div>
          <strong>Formato compatible: CSV, TSV o texto separado por punto y coma (;) o comas (,)</strong><br>
          Columnas reconocidas: <code>DNI, Nombre, Apellido, FechaNacimiento, ObraSocial, NroAfiliado, Telefono, Email, Alergias, Patologias</code>
        </div>
      </div>
    </div>
    <div class="form-field full">
      <label>1. Cargar archivo CSV / Excel (.csv, .tsv, .txt):</label>
      <input type="file" id="patient-file-input" accept=".csv,.tsv,.txt" class="input">
    </div>
    <div class="form-field full">
      <label>2. O pega directamente los datos tabulados / CSV aquí:</label>
      <textarea id="patient-csv-text" name="csvText" class="input" style="height:140px;font-family:monospace;font-size:12px" placeholder="DNI;Nombre;Apellido;FechaNacimiento;ObraSocial;NroAfiliado;Telefono;Email;Alergias;Patologias
35123456;Juan;Perez;1988-04-15;OSDE;012345678;+5491144556677;juan@gmail.com;Penicilina;Hipotiroidismo
40987654;Maria;Gomez;1996-09-22;Swiss Medical;98765432;+5491188990011;maria@gmail.com;Ninguna;Asma"></textarea>
    </div>`,
    'Comenzar Importación de Pacientes', '', 'wide'
  );

  setTimeout(() => {
    const fileInput = $('#patient-file-input');
    const textArea = $('#patient-csv-text');
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = evt => {
            if (textArea) textArea.value = evt.target.result;
          };
          reader.readAsText(file, 'utf-8');
        }
      });
    }
  }, 100);
}
const omniaImportDialog = patientImportDialog;
const omniaImporterDialog = patientImportDialog;

function paymentForm(patientId, defaultMovementType = 'INCOME') {
  const id = makeId();
  const isExp = defaultMovementType === 'EXPENSE';
  formDialog('payment',
    isExp ? 'Registrar Egreso / Gasto Operativo' : 'Registrar Ingreso, Seña o Pago de Tratamiento',
    'Categoriza los ingresos (señas, pagos totales de programa, cuotas o consultas) y egresos de la clínica.',
    selectField('Tipo de Movimiento *', 'movementType', [
      ['INCOME', '↑ Ingreso (Seña, Pago Total de Tratamiento, Cuota o Consulta)'],
      ['EXPENSE', '↓ Egreso (Compra de Insumos/Fármacos, Honorarios o Gasto Operativo)']
    ], defaultMovementType) +
    selectField('Categoría Contable *', 'category', [
      ['DEPOSIT', 'Ingreso · Seña / Anticipo de Tratamiento'],
      ['FULL_PAYMENT', 'Ingreso · Pago Total de Tratamiento / Programa'],
      ['INSTALLMENT', 'Ingreso · Cuota de Programa Clínico (Plan 3 cuotas)'],
      ['CONSULTATION', 'Ingreso · Consulta Médica'],
      ['SUPPLIES', 'Egreso · Compra de Insumos y Fármacos'],
      ['FEES', 'Egreso · Honorarios Profesionales'],
      ['OPERATING', 'Egreso · Gastos Operativos / Servicios de Clínica']
    ], isExp ? 'SUPPLIES' : 'DEPOSIT') +
    `<div class="form-field full" id="pay-patient-wrap">
      <label for="field-patientId">Paciente Asociado (Opcional en egresos generales)</label>
      <select id="field-patientId" name="patientId">
        <option value="">-- Sin paciente asociado (Gasto general / Proveedor) --</option>
        ${(S.data?.patients || []).map(p => `<option value="${esc(p.id)}" ${p.id === (patientId || S.selectedPatient || (!isExp ? S.data?.patients?.[0]?.id : '')) ? 'selected' : ''}>${esc(nameOf(p))} (DNI ${esc(p.dni || '—')})</option>`).join('')}
      </select>
    </div>` +
    field('Importe en ARS *', 'amount', 'number', '', 'required min="0.01" max="50000000" step="0.01" placeholder="Ej: 150000"') +
    selectField('Medio de Pago', 'method', [['TRANSFERENCIA', 'Transferencia bancaria'], ['EFECTIVO', 'Efectivo en recepción'], ['TARJETA', 'Tarjeta de débito / crédito'], ['MERCADOPAGO', 'Mercado Pago / QR'], ['OTRO', 'Otro']]) +
    field('Concepto / N° de Comprobante / Referencia *', 'reference', 'text', '', 'required maxlength="200" placeholder="Ej. Seña 50% Programa Signature Etapa 1 · TRF-109283"', true),
    isExp ? 'Registrar Egreso' : 'Confirmar Movimiento', `data-key="${id}"`, 'wide'
  );

  setTimeout(() => {
    const movSel = $('#field-movementType');
    const catSel = $('#field-category');
    movSel?.addEventListener('change', () => {
      if (movSel.value === 'EXPENSE' && !['SUPPLIES', 'FEES', 'OPERATING'].includes(catSel?.value)) {
        if (catSel) catSel.value = 'SUPPLIES';
      } else if (movSel.value === 'INCOME' && ['SUPPLIES', 'FEES', 'OPERATING'].includes(catSel?.value)) {
        if (catSel) catSel.value = 'DEPOSIT';
      }
    });
    catSel?.addEventListener('change', () => {
      if (['SUPPLIES', 'FEES', 'OPERATING'].includes(catSel.value) && movSel) movSel.value = 'EXPENSE';
      else if (movSel) movSel.value = 'INCOME';
    });
  }, 40);
}

function invoiceForm() {
  const arca = (S.data?.integrations || []).find(i => i.id === 'arca');
  if (!arca || arca.status !== 'CONNECTED') {
    showModal(
      'Conexión con ARCA Requerida',
      'Para emitir comprobantes fiscales oficiales se requiere vincular credenciales reales.',
      `<div style="padding:10px 0">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;background:#fef2f2;border:1px solid #fee2e2;padding:14px;border-radius:8px">
          ${icon('warning', 24)}
          <div>
            <h4 style="margin:0 0 4px 0;color:#991b1b;font-size:15px">Canal Fiscal ARCA (ex AFIP) Desconectado</h4>
            <p style="margin:0;font-size:13px;color:#7f1d1d">Para evitar comprobantes simulados o inválidos, el sistema requiere una conexión real activa con ARCA.</p>
          </div>
        </div>
        <p style="font-size:13px;color:#374151;line-height:1.5;margin-bottom:16px">
          Para emitir comprobantes fiscales electrónicos oficiales con CAE y código QR normativo (RG 4291/4597), la clínica debe vincular su <b>CUIT emisor</b>, <b>Punto de Venta</b> y <b>Certificado Digital</b> en el módulo de Integraciones.
        </p>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button class="btn" data-action="close-modal">Cerrar</button>
          <button class="btn primary" data-action="config-integration" data-id="arca">${icon('settings', 14)} Configurar ARCA en Integraciones</button>
        </div>
      </div>`
    );
    return;
  }
  formDialog('invoice', 'Emitir Factura Electrónica ARCA', 'Emisión oficial con obtención de CAE reglamentario y código QR fiscal (RG 4291/4597).',
    selectField('Tipo de Factura Oficial *', 'invoiceType', [
      ['B', 'Factura B (Consumidor Final / Obras Sociales y Prepagas)'],
      ['C', 'Factura C (Servicios de Salud / Monotributo)']
    ]) +
    patientSelect() +
    field('Concepto de facturación *', 'concept', 'text', '', 'required maxlength="500" placeholder="Ej. Consulta Médica General y Seguimiento Clínico"', true) +
    field('Importe total en ARS *', 'amount', 'number', '', 'required min="0.01" max="10000000" step="0.01" placeholder="Ej. 25000"', true) +
    `<div class="info-box" style="margin-top:12px">
      ${icon('shield', 16)}
      <span>El comprobante cruzará datos en tiempo real con ARCA (ex AFIP) y emitirá el CAE oficial con vencimiento y código QR normativo.</span>
    </div>`,
    'Emitir y Autorizar con ARCA'
  );
}

function inventoryForm(id = null) {
  const item = id ? (S.data?.inventory || []).find(x => x.id === id) : null;
  const isEdit = Boolean(item);
  formDialog('inventory', isEdit ? 'Editar Insumo Médico' : 'Registrar Nuevo Insumo', 'Gestión de insumos clínicos, materiales descartables y medicamentos.',
    field('Nombre o descripción del insumo *', 'name', 'text', item?.name || '', 'required maxlength="150" placeholder="Ej. Gasas estériles 10x10cm (Caja x 100)"', true) +
    field('Código SKU / Referencia', 'sku', 'text', item?.sku || '', 'maxlength="50" placeholder="Ej. GAS-001"') +
    selectField('Categoría *', 'category', [
      ['Descartables', 'Descartables'],
      ['Suturas y Curaciones', 'Suturas y Curaciones'],
      ['Medicamentos', 'Medicamentos'],
      ['Antisépticos', 'Antisépticos'],
      ['Soluciones y Sueros', 'Soluciones y Sueros'],
      ['Instrumental', 'Instrumental'],
      ['Diagnóstico', 'Diagnóstico'],
      ['Otro', 'Otro']
    ], item?.category || 'Descartables') +
    `<div class="form-field full" style="display:grid;grid-template-columns:${isEdit ? '1fr 1fr' : '1fr 1fr 1fr'};gap:12px;margin:0;padding:0">
      ${isEdit ? '' : field('Cantidad inicial en stock *', 'quantity', 'number', item?.quantity ?? 0, 'required min="0" step="1"')}
      ${field('Stock mínimo de alerta *', 'minQuantity', 'number', item?.minQuantity ?? 10, 'required min="0" step="1"')}
      ${field('Unidad de medida *', 'unit', 'text', item?.unit || 'unidades', 'required maxlength="50" placeholder="unidades, cajas, frascos, rollos"')}
    </div>` +
    field('Número de lote', 'lotNumber', 'text', item?.lotNumber || '', 'maxlength="50" placeholder="Ej. LT-2024-89"') +
    field('Fecha de vencimiento', 'expiryDate', 'date', item?.expiryDate || '', '') +
    area('Observaciones / Ubicación en clínica', 'notes', item?.notes || '', 'maxlength="500" placeholder="Ej. Almacén Central - Estantería 2"'),
    isEdit ? 'Guardar Cambios' : 'Registrar Insumo'
  );
  if (isEdit) {
    const form = $('dialog form[data-form="inventory"]');
    if (form) form.dataset.id = id;
  }
}

function adjustStockDialog(id) {
  const item = (S.data?.inventory || []).find(x => x.id === id);
  if (!item) return;
  formDialog('inventory-stock', `Ajustar Stock: ${item.name}`, `Stock actual registrado: <b>${item.quantity} ${esc(item.unit)}</b>`,
    `<div style="background:#f4f7f2;border:1px solid #dce8d6;border-radius:10px;padding:14px;margin-bottom:16px">
      <div style="font-size:11px;color:#496551;margin-bottom:4px">Insumo: <b>${esc(item.name)}</b> (${esc(item.sku || 'Sin código')})</div>
      <div style="font-size:14px;font-weight:700;color:var(--ink)">Existencia actual: ${item.quantity} ${esc(item.unit)}</div>
    </div>` +
    selectField('Tipo de Movimiento *', 'movementType', [
      ['IN', 'Ingreso / Reposición de Almacén (+)'],
      ['CONSUMPTION', 'Consumo en Consulta Médica (-)'],
      ['EXPIRATION', 'Baja por Vencimiento / Deterioro (-)'],
      ['ADJUSTMENT', 'Ajuste por Recuento de Inventario (+)']
    ]) +
    field('Cantidad de unidades *', 'amount', 'number', 1, 'required min="1" step="1"', true) +
    field('Motivo / Justificación *', 'reason', 'text', '', 'required maxlength="200" placeholder="Ej. Reposición semanal de droguería, uso en procedimiento..."', true),
    'Confirmar Ajuste'
  );
  const form = $('dialog form[data-form="inventory-stock"]');
  if (form) form.dataset.id = id;
}

function createLotDialog() {
  const existingInv = S.data?.inventory || [];
  const merged = [];
  const seen = new Set();
  for (const item of existingInv) {
    const k = item.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    const grp = /medicamento|suero|antisept|f[aá]rmaco/i.test(item.category || '') ? 'Fármacos' : 'Insumos';
    merged.push({
      existingInventoryId: item.id,
      name: item.name,
      groupCategory: grp,
      category: item.category || 'Descartables',
      unit: item.unit || 'unidades',
      currentQty: item.quantity ?? 0
    });
  }
  for (const pre of PRELOADED_INVENTORY_CATALOG) {
    const k = pre.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push({
      existingInventoryId: '',
      name: pre.name,
      groupCategory: pre.groupCategory,
      category: pre.category,
      unit: pre.unit,
      currentQty: null
    });
  }

  const first = merged[0] || { existingInventoryId: '', name: '', groupCategory: 'Fármacos', category: 'Medicamentos', unit: 'unidades' };

  formDialog('inventory-lot', 'Crear Lote de Producto / Insumo', 'Selecciona un producto del catálogo o busca uno existente para ingresar un nuevo lote con trazabilidad.',
    `<div class="form-field full" style="position:relative">
      <label for="lot-product-search">Producto * (Busque o seleccione del catálogo)</label>
      <div class="search-field" style="width:100%;margin-bottom:6px">
        ${icon('search', 14)}
        <input id="lot-product-search" type="search" autocomplete="off" placeholder="Busque un producto..." value="${esc(first.name)}">
      </div>
      <div id="lot-product-list" style="max-height:190px;overflow-y:auto;border:1px solid #dce6dd;border-radius:10px;background:#ffffff;padding:4px">
        ${merged.map((m, idx) => `
          <button type="button" class="lot-product-opt" data-idx="${idx}" style="width:100%;text-align:left;padding:8px 12px;border-radius:7px;background:${idx === 0 ? '#eef6f0' : 'transparent'};color:#182d27;font-size:12.5px;display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:2px">
            <span><strong>${esc(m.name)}</strong> <span class="muted">(${esc(m.groupCategory)} - ${esc(m.category)})</span></span>
            ${m.currentQty !== null ? `<span class="badge green" style="font-size:10px">En stock: ${m.currentQty}</span>` : `<span class="badge gray" style="font-size:10px">Catálogo</span>`}
          </button>
        `).join('')}
      </div>
      <input type="hidden" name="existingInventoryId" id="lot-existing-id" value="${esc(first.existingInventoryId)}">
      <input type="hidden" name="name" id="lot-name" value="${esc(first.name)}">
      <input type="hidden" name="groupCategory" id="lot-group" value="${esc(first.groupCategory)}">
      <input type="hidden" name="category" id="lot-category" value="${esc(first.category)}">
      <input type="hidden" name="unit" id="lot-unit" value="${esc(first.unit)}">
    </div>` +
    field('Número de Lote *', 'lotNumber', 'text', '', 'required maxlength="60" placeholder="Ej. 20261120"') +
    field('Cantidad a ingresar *', 'quantity', 'number', 10, 'required min="1" step="1"') +
    field('Fecha de vencimiento *', 'expiryDate', 'date', '', 'required') +
    field('Stock mínimo de alerta', 'minQuantity', 'number', 5, 'min="0" step="1"') +
    area('Observaciones / Proveedor', 'notes', '', 'maxlength="500" placeholder="Ej. Droguería del Sud · Ingreso por lote"', true),
    'Registrar Lote', '', 'wide'
  );

  setTimeout(() => {
    const searchEl = $('#lot-product-search');
    const listEl = $('#lot-product-list');
    const selectItem = (m, idx) => {
      $('#lot-existing-id').value = m.existingInventoryId || '';
      $('#lot-name').value = m.name;
      $('#lot-group').value = m.groupCategory;
      $('#lot-category').value = m.category;
      $('#lot-unit').value = m.unit;
      if (searchEl) searchEl.value = m.name;
      listEl?.querySelectorAll('.lot-product-opt').forEach(btn => {
        btn.style.background = Number(btn.dataset.idx) === idx ? '#eef6f0' : 'transparent';
      });
    };

    listEl?.addEventListener('click', e => {
      const opt = e.target.closest('.lot-product-opt');
      if (!opt) return;
      const idx = Number(opt.dataset.idx);
      if (merged[idx]) selectItem(merged[idx], idx);
    });

    searchEl?.addEventListener('input', e => {
      const q = (e.target.value || '').toLowerCase().trim();
      $('#lot-name').value = e.target.value.trim();
      $('#lot-existing-id').value = '';
      listEl?.querySelectorAll('.lot-product-opt').forEach(opt => {
        const idx = Number(opt.dataset.idx);
        const m = merged[idx];
        const match = !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.groupCategory.toLowerCase().includes(q);
        opt.style.display = match ? 'flex' : 'none';
      });
    });
  }, 50);
}

const VADEMECUM_CATALOG = [
  { drug: 'Amoxicilina + Ácido Clavulánico 875/125 mg', presentation: 'Comprimidos recubiertos x 14', dosage: '1 comprimido vía oral cada 12 horas durante 7 días.' },
  { drug: 'Ibuprofeno 600 mg', presentation: 'Comprimidos x 20', dosage: '1 comprimido cada 8 horas después de las comidas si hay dolor o inflamación.' },
  { drug: 'Paracetamol 1 g', presentation: 'Comprimidos x 16', dosage: '1 comprimido cada 8 horas en caso de dolor o fiebre.' },
  { drug: 'Ketorolac Trometamina 20 mg', presentation: 'Comprimidos sublinguales x 10', dosage: '1 comprimido sublingual cada 8 horas por máximo 3 días.' },
  { drug: 'Cefalexina 500 mg', presentation: 'Comprimidos x 16', dosage: '1 comprimido cada 6 u 8 horas durante 7 días.' },
  { drug: 'Levotiroxina Sódica 50 mcg', presentation: 'Comprimidos x 50', dosage: '1 comprimido en ayunas 30 minutos antes del desayuno.' },
  { drug: 'Levotiroxina Sódica 75 mcg', presentation: 'Comprimidos x 50', dosage: '1 comprimido en ayunas 30 minutos antes del desayuno.' },
  { drug: 'Magnesio Bisglicinato 400 mg (Quelado)', presentation: 'Cápsulas x 60', dosage: '2 cápsulas por la noche antes de dormir.' },
  { drug: 'Vitamina D3 5.000 UI + Vitamina K2 (MK-7) 100 mcg', presentation: 'Cápsulas blandas x 60', dosage: '1 cápsula diaria junto con una comida con grasas saludables.' },
  { drug: 'Vitamina C Liposomal 1.000 mg', presentation: 'Cápsulas / Sobres x 30', dosage: '1 toma diaria por la mañana.' },
  { drug: 'Omega 3 EPA/DHA Ultra Purificado 1.000 mg', presentation: 'Cápsulas blandas x 60', dosage: '1 cápsula con el almuerzo y 1 cápsula con la cena.' },
  { drug: 'Coenzima Q10 (Ubiquinol) 200 mg', presentation: 'Cápsulas x 30', dosage: '1 cápsula diaria con el desayuno.' },
  { drug: 'Ácido Alfa Lipoico (R-ALA) 300 mg', presentation: 'Cápsulas x 60', dosage: '1 cápsula 30 minutos antes del almuerzo y cena.' },
  { drug: 'N-Acetilcisteína (NAC) 600 mg', presentation: 'Comprimidos / Sobres x 30', dosage: '1 comprimido diario lejos de las comidas.' },
  { drug: 'Complejo Vitamínico B Metilado (B12 Metilcobalamina + Folato)', presentation: 'Cápsulas x 30', dosage: '1 cápsula diaria con el desayuno.' },
  { drug: 'Melatonina de Liberación Prolongada 3 mg', presentation: 'Comprimidos x 30', dosage: '1 comprimido 45 minutos antes de acostarse.' },
  { drug: 'Omeprazol 20 mg', presentation: 'Cápsulas gastrorresistentes x 30', dosage: '1 cápsula en ayunas por la mañana.' },
  { drug: 'Enalapril 10 mg', presentation: 'Comprimidos x 30', dosage: '1 comprimido cada 12 horas según control de tensión arterial.' },
  { drug: 'Metformina Liberación Prolongada (XR) 850 mg', presentation: 'Comprimidos x 30', dosage: '1 comprimido junto con la cena.' }
];

function prescriptionForm() {
  const allDocs = (S.data?.staff || S.data?.doctors || []).filter(d => d.role === 'DOCTOR' || d.licenseNumber || d.specialty);
  const docs = allDocs.length ? allDocs : (S.data?.doctors || []);
  const firstDoc = docs[0] || { id: '', name: S.session?.user?.name || 'Médico Tratante', licenseNumber: 'M.N. 142.850', specialty: 'Medicina Integrativa' };
  const autoCuir = `AR-CUIR-${new Date().getFullYear()}-${String(Math.floor(10000000 + Math.random() * 90000000))}-${makeId().slice(0, 4).toUpperCase()}`;

  formDialog('prescription', 'Emitir Receta Electrónica Legal (Ley 27.553 · Estándar RCTA)',
    'Buscador de Vademécum, código CUIR automático, QR de validación farmacéutica, logo de clínica y firma digital con matrícula del médico.',
    patientSelect() +
    `<div class="form-field full">
      <div class="between" style="margin-bottom:4px">
        <label for="field-doctorId" style="margin:0">Médico Prescriptor (Imprime Firma Digital, Sello y Matrícula) *</label>
        <button type="button" class="text-link tiny" id="rx-config-sig-btn">${icon('edit', 11)} Configurar firma / matrícula del médico</button>
      </div>
      <select id="field-doctorId" name="doctorId" required>
        ${docs.map(d => `<option value="${esc(d.id)}" data-name="${esc(d.name)}" data-license="${esc(d.licenseNumber || 'M.N. 142.850')}">${esc(d.name)} — ${esc(d.specialty || 'Médico')} (${esc(d.licenseNumber || 'M.N. 142.850')}) ${d.signatureData ? '· ✓ Firma Digital Cargada' : ''}</option>`).join('')}
      </select>
    </div>` +
    field('Diagnóstico Clínico / CIE-10 *', 'diagnosis', 'text', 'Soporte metabólico y modulación inflamatoria (CIE-10: E63.9 / R53)', 'required maxlength="250" placeholder="Ej: Fatiga crónica (R53), Hipotiroidismo (E03.9), Post-operatorio (Z48)..."') +
    field('CUIR (Código Único de Identificación de Receta)', 'cuir', 'text', autoCuir, 'readonly style="font-family:monospace;background:#f8fafc;color:#1b4c37;font-weight:700"') +

    `<div class="form-field full" style="background:#f8fbf9;border:1px solid #d5e3d8;border-radius:10px;padding:12px 14px">
      <label style="color:#1b4c37;font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:6px">
        ${icon('search', 14)} Buscador de Vademécum Farmacológico & Magistral
      </label>
      <div class="flex" style="gap:8px;margin-bottom:8px">
        <input type="search" id="vademecum-search" placeholder="Buscar por droga genérica, presentación o nombre comercial (ej: Magnesio, Amoxicilina, Vitamina D3, Ibuprofeno)..." style="flex:1">
        <button type="button" class="btn small" id="vademecum-add-custom">${icon('plus', 12)} Agregar Fármaco Manual</button>
      </div>
      <div id="vademecum-results" style="max-height:135px;overflow-y:auto;border:1px solid #dce6dd;border-radius:8px;background:#fff;padding:4px;margin-bottom:10px">
        ${VADEMECUM_CATALOG.map((v, idx) => `
          <button type="button" class="vademecum-opt" data-idx="${idx}" style="width:100%;text-align:left;padding:6px 10px;border-radius:6px;background:transparent;color:#182d27;font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:8px">
            <span><b>${esc(v.drug)}</b> · <span class="muted">${esc(v.presentation)}</span></span>
            <span class="badge green" style="font-size:10px">+ Agregar a Rp/</span>
          </button>
        `).join('')}
      </div>

      <label style="font-size:12px;font-weight:700;color:#1e3a2b;margin-bottom:6px;display:block">Medicamentos Prescriptos en la Receta (Rp/):</label>
      <div id="rx-meds-list" style="display:flex;flex-direction:column;gap:8px"></div>
      <input type="hidden" name="medicationsJson" id="rx-meds-json" value="[]">
    </div>` +
    area('Texto consolidado de la Receta (Rp/ e indicaciones al paciente) *', 'content', '', 'required maxlength="8000" style="height:105px" placeholder="Selecciona medicamentos del Vademécum arriba o escribe el detalle aquí..."'),
    'Firmar y Emitir Receta Legal (PDF / QR)', '', 'wide'
  );

  setTimeout(() => {
    const searchInput = $('#vademecum-search');
    const resultsBox = $('#vademecum-results');
    const medsList = $('#rx-meds-list');
    const medsJsonInput = $('#rx-meds-json');
    const contentArea = $('#field-content');
    const medsState = [];

    const syncMeds = () => {
      if (medsJsonInput) medsJsonInput.value = JSON.stringify(medsState);
      if (medsList) {
        medsList.innerHTML = medsState.map((m, i) => `
          <div style="background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;display:grid;grid-template-columns:1.4fr 1fr 90px 28px;gap:6px;align-items:center">
            <input type="text" class="rx-m-drug" data-i="${i}" value="${esc(m.drug)}" placeholder="Droga / Medicamento" style="font-size:12px;font-weight:700">
            <input type="text" class="rx-m-pres" data-i="${i}" value="${esc(m.presentation)}" placeholder="Presentación" style="font-size:12px">
            <input type="text" class="rx-m-qty" data-i="${i}" value="${esc(m.quantity)}" placeholder="Cant." style="font-size:12px">
            <button type="button" class="icon-btn rx-m-del" data-i="${i}" style="color:#b91c1c">${icon('close', 13)}</button>
            <input type="text" class="rx-m-dos" data-i="${i}" value="${esc(m.dosage)}" placeholder="Posología e indicaciones" style="grid-column:1 / -1;font-size:12px">
          </div>
        `).join('') || `<div class="tiny muted" style="padding:6px">Haz clic en cualquier medicamento del Vademécum para añadirlo a la receta.</div>`;
      }
      if (contentArea && medsState.length) {
        contentArea.value = medsState.map((m, i) => `${i + 1}) ${m.drug} (${m.presentation}) — Cantidad: ${m.quantity}\n   Indicaciones: ${m.dosage}`).join('\n\n');
      }
    };

    const addMed = (item) => {
      medsState.push({
        drug: item.drug || '',
        presentation: item.presentation || '1 envase',
        quantity: item.quantity || '1 envase',
        dosage: item.dosage || 'Según indicación médica.'
      });
      syncMeds();
    };

    resultsBox?.addEventListener('click', e => {
      const btn = e.target.closest('.vademecum-opt');
      if (!btn) return;
      const v = VADEMECUM_CATALOG[Number(btn.dataset.idx)];
      if (v) addMed(v);
    });

    $('#vademecum-add-custom')?.addEventListener('click', () => {
      addMed({ drug: searchInput?.value?.trim() || 'Nuevo medicamento', presentation: 'Comprimidos / Cápsulas', quantity: '1 envase', dosage: 'Tomar según indicación.' });
    });

    searchInput?.addEventListener('input', e => {
      const q = (e.target.value || '').toLowerCase().trim();
      resultsBox?.querySelectorAll('.vademecum-opt').forEach(btn => {
        const v = VADEMECUM_CATALOG[Number(btn.dataset.idx)];
        const match = !q || v.drug.toLowerCase().includes(q) || v.presentation.toLowerCase().includes(q) || v.dosage.toLowerCase().includes(q);
        btn.style.display = match ? 'flex' : 'none';
      });
    });

    medsList?.addEventListener('input', e => {
      const idx = Number(e.target.dataset.i);
      if (!medsState[idx]) return;
      if (e.target.classList.contains('rx-m-drug')) medsState[idx].drug = e.target.value;
      if (e.target.classList.contains('rx-m-pres')) medsState[idx].presentation = e.target.value;
      if (e.target.classList.contains('rx-m-qty')) medsState[idx].quantity = e.target.value;
      if (e.target.classList.contains('rx-m-dos')) medsState[idx].dosage = e.target.value;
      if (medsJsonInput) medsJsonInput.value = JSON.stringify(medsState);
      if (contentArea) {
        contentArea.value = medsState.map((m, i) => `${i + 1}) ${m.drug} (${m.presentation}) — Cantidad: ${m.quantity}\n   Indicaciones: ${m.dosage}`).join('\n\n');
      }
    });

    medsList?.addEventListener('click', e => {
      const del = e.target.closest('.rx-m-del');
      if (!del) return;
      medsState.splice(Number(del.dataset.i), 1);
      syncMeds();
    });

    $('#rx-config-sig-btn')?.addEventListener('click', () => {
      const docId = $('#field-doctorId')?.value || firstDoc.id;
      if (docId) doctorCredentialsDialog(docId);
    });

    syncMeds();
  }, 40);
}

function leadForm() {
  formDialog('lead', 'Nuevo Contacto / Consulta', 'Ingreso de nuevo paciente potencial a la clínica.',
    field('Nombre completo *', 'name', 'text', '', 'required maxlength="120"') +
    field('Teléfono de contacto *', 'phone', 'tel', '', 'required minlength="6" maxlength="30" placeholder="+54 11 0000-0000"') +
    selectField('Canal de origen', 'source', ['WhatsApp', 'Web Institucional', 'Meta Ads', 'Google Ads', 'Referido profesional', 'Otro'].map(x => [x, x])) +
    field('Motivo de consulta / Especialidad', 'interest', 'text', '', 'maxlength="200"'),
    'Guardar contacto'
  );
}

// Configuración de Integraciones del Super Admin
function configIntegrationDialog(id) {
  const integrations = S.admin?.integrations || S.data?.integrations || [];
  const item = integrations.find(x => x.id === id);
  if (!item) return;
  const cfg = (typeof item.config === 'string') ? JSON.parse(item.config || '{}') : (item.config || {});

  let fields = '';
  if (id === 'highlevel') {
    const wsId = encodeURIComponent(S.supportMode?.id || S.session?.user?.workspaceId || 'clinic-central');
    const inboundWebhookUrl = `${SUPABASE_CONFIG.url}/functions/v1/ghl-webhook?ws=${wsId}`;
    fields = `<div style="grid-column:span 2;background:var(--surface-alt);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:4px">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px">Webhook Entrante para GoHighLevel (Inbound Link)</div>
      <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:8px;line-height:1.4">Copiá este enlace y pegalo en una acción <b>Webhook (POST)</b> dentro de tus Workflows de GHL para recibir <b>leads, mensajes de WhatsApp, turnos agendados y cancelaciones</b> en tiempo real.</div>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="field-input" type="text" readonly value="${esc(inboundWebhookUrl)}" style="font-family:monospace;font-size:11.5px;background:var(--bg);flex:1" onclick="this.select()" />
        <button type="button" class="btn btn-sm btn-secondary" onclick="navigator.clipboard?.writeText('${esc(inboundWebhookUrl)}'); toast('Link de Webhook copiado','success')">Copiar</button>
      </div>
    </div>` +
      field('Location ID (Subcuenta GHL) *', 'locationId', 'text', cfg.locationId || '', 'required placeholder="Ej. lk872HgasdA98"') +
      field('API Key / Private Token *', 'apiKey', 'password', cfg.apiKey || '', 'required placeholder="pit-..."') +
      field('Calendar ID (Opcional · Turnos GHL)', 'calendarId', 'text', cfg.calendarId || '', 'placeholder="Si se deja vacío usa el calendario principal"') +
      field('Webhook URL Saliente (Workflow GHL)', 'webhookUrl', 'url', cfg.webhookUrl || '', 'placeholder="https://services.leadconnectorhq.com/hooks/..."', true);
  } else if (id === 'whatsapp') {
    fields = field('Phone Number ID *', 'phoneNumberId', 'text', cfg.phoneNumberId || '', 'required placeholder="109283748291"') +
      field('Meta App ID *', 'appId', 'text', cfg.appId || '', 'required placeholder="89283749281"') +
      field('Token Permanente de Sistema *', 'token', 'password', cfg.token || '', 'required placeholder="EAAG..."', true) +
      field('Nombre de Plantilla de Recordatorio', 'templateName', 'text', cfg.templateName || 'recordatorio_turno', 'required');
  } else if (id === 'mercadopago') {
    fields = field('Access Token (Producción o Test) *', 'accessToken', 'password', cfg.accessToken || '', 'required placeholder="APP_USR-..."', true) +
      field('Public Key *', 'publicKey', 'text', cfg.publicKey || '', 'required placeholder="APP_USR-..."') +
      selectField('Entorno', 'sandbox', [['false', 'Producción Oficial'], ['true', 'Sandbox / Pruebas']], cfg.sandbox ? 'true' : 'false');
  } else if (id === 'arca') {
    fields = field('CUIT Emisor de la Clínica *', 'cuit', 'text', cfg.cuit || '', 'required placeholder="30-12345678-9"') +
      field('Punto de Venta Autorizado *', 'puntoVenta', 'text', cfg.puntoVenta || '0001', 'required placeholder="0001"') +
      field('Ruta o Nombre del Certificado (.crt)', 'certPath', 'text', cfg.certPath || '', 'placeholder="/certs/clinica.crt"', true) +
      field('Ruta de la Clave Privada (.key)', 'privateKeyPath', 'text', cfg.privateKeyPath || '', 'placeholder="/certs/clinica.key"', true) +
      selectField('Ambiente fiscal', 'ambiente', [['homologacion', 'Homologación (Testing oficial ARCA)'], ['produccion', 'Producción Oficial']], cfg.ambiente || 'homologacion');
  } else if (id === 'ai') {
    fields = selectField('Proveedor de Inteligencia Artificial', 'provider', [['openai', 'OpenAI (GPT-4o, GPT-4o-mini)'], ['anthropic', 'Anthropic (Claude 3.5 Sonnet)'], ['gemini', 'Google Gemini (Gemini 1.5 Pro)'], ['local', 'Servidor Local (Ollama / Llama 3)']], cfg.provider || 'openai', true) +
      field('API Key del Proveedor *', 'apiKey', 'password', cfg.apiKey || '', 'required placeholder="sk-..."', true) +
      field('Nombre del Modelo *', 'model', 'text', cfg.model || 'gpt-4o', 'required placeholder="gpt-4o"') +
      field('Temperatura (Creatividad / Precisión)', 'temperature', 'number', String(cfg.temperature ?? 0.3), 'min="0" max="1" step="0.1"');
  } else {
    fields = field('Client ID *', 'clientId', 'text', cfg.clientId || '', 'required') +
      field('Client Secret *', 'clientSecret', 'password', cfg.clientSecret || '', 'required') +
      field('Calendar ID institucional', 'calendarId', 'text', cfg.calendarId || '', 'placeholder="agenda@clinica.com"', true);
  }

  const isConnected = item.status === 'CONNECTED';
  showModal(
    `Conectar ${item.name}`,
    `Gestión de credenciales para ${item.category}`,
    `<form data-form="config-integration" data-id="${id}">
      <div class="form-grid">${fields}</div>
      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        ${isConnected && id === 'highlevel' ? btn('Sincronizar Turnos GHL', 'sync-ghl-appointments', 'calendar', '', `type="button" data-id="${id}"`) : ''}
        ${isConnected ? btn('Probar Conexión en Vivo', 'test-integration-live', 'refresh', '', `type="button" data-id="${id}"`) : ''}
        ${isConnected ? btn('Desconectar servicio', 'disconnect-integration', 'warning', 'danger', `type="button" data-id="${id}"`) : ''}
        ${btn('Cancelar', 'close-modal', '', '', 'type="button"')}
        <button class="btn primary" type="submit">${icon('check', 15)} ${isConnected ? 'Actualizar Conexión' : 'Guardar y Conectar'}</button>
      </div>
    </form>`,
    '', 'wide'
  );
}

function assistantDialog() {
  if (!S.chat.length) {
    S.chat = [{ role: 'assistant', text: 'Hola. Soy tu Asistente Clínico Operativo de Abundance. Puedo brindarte el estado de la agenda del día, pacientes agendados, cobros registrados y recordatorios pendientes. ¿En qué te puedo ayudar hoy?' }];
  }
  showModal('Asistente Clínico de Inteligencia Artificial', 'Consultas operativas, agenda médica y resúmenes.',
    `<div class="chat-messages" id="chat-messages">${chatHtml()}</div>
    <div class="suggestions">
      <button data-action="chat-suggestion" data-text="Resumen de la agenda de hoy">Agenda de hoy</button>
      <button data-action="chat-suggestion" data-text="Turnos pendientes de confirmar">Turnos pendientes</button>
      <button data-action="chat-suggestion" data-text="Resumen de cobros del día">Cobros del día</button>
      <button data-action="chat-suggestion" data-text="Cuántos pacientes hay registrados">Total pacientes</button>
    </div>
    <form class="chat-form" data-form="chat">
      <input name="text" aria-label="Consulta médica u operativa" placeholder="Escribe tu consulta operativa…" required maxlength="1000">
      <button type="submit" class="btn primary" aria-label="Enviar">${icon('send', 17)}</button>
    </form>
    <div class="form-error" role="alert"></div>`,
    '', 'assistant'
  );
}

function chatHtml() {
  return S.chat.map(m => `<div class="chat-bubble ${m.role === 'user' ? 'user' : ''}">${esc(m.text)}</div>`).join('');
}

async function sendChat(text) {
  S.chat.push({ role: 'user', text });
  $('#chat-messages').innerHTML = chatHtml();
  try {
    const r = await api('/api/copilot', 'POST', { text });
    S.chat.push({ role: 'assistant', text: r.answer });
  } catch (e) {
    S.chat.push({ role: 'assistant', text: e.message });
  }
  if ($('#chat-messages')) {
    $('#chat-messages').innerHTML = chatHtml();
    $('#chat-messages').scrollTop = 100000;
  }
}

function exportPatients() {
  const header = ['Nombre', 'Apellido', 'Documento', 'Telefono', 'Email', 'Cobertura', 'Estado'];
  const rows = S.data.patients.map(p => [p.firstName, p.lastName, p.dni, p.phone, p.email, p.coverage, p.status]);
  const cell = v => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const csv = '\ufeff' + [header, ...rows].map(r => r.map(cell).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `directorio-pacientes-${dateKey()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Archivo CSV generado y descargado correctamente.');
}

async function verifyRecord(id) {
  try {
    const r = await api('/api/verify/' + id);
    showModal('Integridad Criptográfica del Registro', 'Verificación inmutable de la evolución médica en base de datos.',
      `<div class="info-box ${r.integrity ? '' : 'warning'}">
        ${icon(r.integrity ? 'shield' : 'warning', 20)}
        <div><strong>${r.integrity ? 'Cadena Criptográfica Verificada' : 'Discrepancia de Integridad'}</strong><br>${esc(r.message)}</div>
      </div>
      <div class="spacer"></div>
      <div class="detail-label">Hash SHA-256 de la Evolución</div>
      <div class="mono wrap">${esc(r.hash)}</div>
      <div class="spacer"></div>
      <div class="detail-label">Fecha de Registro</div>
      <p class="detail-value">${fmtDate(r.createdAt, true)} · ${fmtTime(r.createdAt)}</p>
      <div class="dialog-actions">
        ${btn('Cerrar', 'close-modal', '', 'primary')}
      </div>`
    );
  } catch (e) {
    toast(e.message, true);
  }
}

// Delegación global de eventos
document.addEventListener('click', async e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault();
    closeModal();
    await navigate(nav.dataset.nav);
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action, id = el.dataset.id;
  try {
    switch (action) {
      case 'close-modal': closeModal(); break;
      case 'show-password': {
        const p = $('#password');
        if (p) p.type = p.type === 'password' ? 'text' : 'password';
        break;
      }
      case 'forgot-password': {
        e.preventDefault();
        showModal(
          'Recuperar Contraseña',
          'Ingresa tu correo electrónico registrado para recibir las instrucciones de restablecimiento.',
          `<form data-form="forgot-password">
            <div class="form-field">
              <label for="recover-email">Correo Electrónico Registrado *</label>
              <input id="recover-email" name="email" type="email" required placeholder="doctor@tuclinica.com">
            </div>
            <div class="form-error" role="alert"></div>
            <div class="dialog-actions">
              <button type="button" class="btn" data-action="close-modal">Cancelar</button>
              <button type="submit" class="btn primary">Enviar enlace de recuperación</button>
            </div>
          </form>`
        );
        break;
      }
      case 'clinic-login': {
        $('#email').value = 'admin@clinica.com';
        $('#password').value = 'admin123';
        $('#email').focus();
        break;
      }
      case 'super-login': {
        $('#email').value = 'superadmin@clinica.com';
        $('#password').value = 'admin123';
        $('#email').focus();
        break;
      }
      case 'logout': {
        try { await api('/api/logout', 'POST', {}); } catch {}
        localStorage.removeItem('clinic_session');
        localStorage.removeItem('supabase_token');
        S.session = null;
        S.data = null;
        S.admin = null;
        closeModal();
        if (!PREVIEW) history.pushState({}, '', '/login');
        loginPage();
        break;
      }
      case 'menu': S.mobile = !S.mobile; render(); break;
      case 'nav-schedule': await navigate('schedule'); break;
      case 'toggle-agenda': {
        S.agendaCollapsed = !S.agendaCollapsed;
        contentOnly();
        break;
      }
      case 'home-filter': S.homeFilter = el.dataset.value; contentOnly(); break;
      case 'pending-agenda': S.homeFilter = 'pending'; contentOnly(); break;
      case 'new-patient': patientForm(); break;
      case 'edit-patient': patientForm(id); break;
      case 'patient-detail': patientDetail(id); break;
      case 'new-appointment': appointmentForm({ time: el.dataset.time, date: el.dataset.date, patientId: el.dataset.patientId }); break;
      case 'appointment-detail': appointmentDetail(id); break;
      case 'reschedule': appointmentForm({ id }); break;
      case 'prev-date': S.date = plusDays(S.date, S.calendar === 'week' ? -7 : -1); contentOnly(); break;
      case 'next-date': S.date = plusDays(S.date, S.calendar === 'week' ? 7 : 1); contentOnly(); break;
      case 'today': S.date = S.data?.date || dateKey(); contentOnly(); break;
      case 'calendar-mode': S.calendar = el.dataset.value; contentOnly(); break;
      case 'schedule-category': S.scheduleCategory = el.dataset.value; contentOnly(); break;
      case 'schedule-mode': S.scheduleMode = el.dataset.value; contentOnly(); break;
      case 'select-doctor-filter': S.doctor = S.doctor === id ? '' : id; contentOnly(); break;
      case 'clear-doctor-filter': S.doctor = ''; contentOnly(); break;
      case 'new-staff': staffForm(); break;
      case 'edit-doctor-credentials': doctorCredentialsDialog(id); break;
      case 'nav-staff': await navigate('staff'); break;
      case 'delete-staff': {
        const name = el.dataset.name || 'este miembro';
        if (confirm(`¿Confirmas eliminar a "${name}" del equipo de la clínica?`)) {
          await api('/api/staff/' + id, 'DELETE');
          toast('Miembro eliminado del equipo.');
          await refresh();
          contentOnly();
        }
        break;
      }
      case 'new-lead': leadForm(); break;
      case 'ai-triage-all': {
        el.disabled = true;
        try {
          toast('Clasificando contactos con IA...');
          const res = await api('/api/leads/ai-triage', 'POST', {});
          await refresh();
          contentOnly();
          toast(`Triage completado: ${res.triagedCount} contactos clasificados con derivación médica.`);
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'ai-triage-lead': {
        el.disabled = true;
        try {
          toast('Analizando motivo de consulta...');
          await api('/api/leads/' + id + '/ai-triage', 'POST', {});
          await refresh();
          contentOnly();
          toast('Contacto clasificado por IA con derivación médica.');
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'lead-quick-schedule': {
        el.disabled = true;
        try {
          toast('Preparando ficha y derivación médica...');
          const res = await api('/api/leads/' + id + '/convert-to-patient', 'POST', {});
          await refresh();
          const l = S.data.leads.find(x => x.id === id);
          const triage = l?.aiTriage;
          appointmentForm({
            patientId: res.patient.id,
            doctorId: el.dataset.doctor || triage?.suggestedDoctorId || S.data.doctors[0]?.id,
            notes: triage ? `Triage IA: ${triage.specialty} · ${triage.reasoning}` : (l?.interest || '')
          });
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'select-record-patient':
        S.selectedPatient = id;
        S.patientPickerOpen = false;
        logHceReadAccess(id);
        contentOnly();
        break;
      case 'toggle-patient-picker':
        S.patientPickerOpen = !S.patientPickerOpen;
        contentOnly();
        if (S.patientPickerOpen) setTimeout(() => $('#record-patient-search')?.focus(), 30);
        break;
      case 'open-patient-records': S.selectedPatient = id; logHceReadAccess(id); closeModal(); await navigate('records'); break;
      case 'export-complete-hce': printCompleteHceDocument(id || S.selectedPatient); break;
      case 'new-study-order': studyOrderDialog(el.dataset.patientId || S.selectedPatient); break;
      case 'record-tab': S.recordTab = el.dataset.value; contentOnly(); break;
      case 'omni-tab': S.omniTab = el.dataset.value; contentOnly(); break;
      case 'hcd-filter-chip':
      case 'omni-filter-chip': {
        const filterType = el.dataset.filter;
        const val = el.dataset.value;
        if (filterType === 'problem') S.omniProblem = (S.omniProblem === val ? '' : val);
        if (filterType === 'specialty') S.omniSpecialty = (S.omniSpecialty === val ? '' : val);
        if (filterType === 'author') S.recordAuthor = (S.recordAuthor === val ? '' : val);
        if (filterType === 'attachment') S.recordAttachmentFilter = val;
        contentOnly();
        break;
      }
      case 'view-attachment':
        viewAttachmentModal(el.dataset.url, el.dataset.name, el.dataset.type);
        break;
      case 'new-attachment':
        uploadStudyDialog(el.dataset.patientId || S.selectedPatient);
        break;
      case 'new-vitals':
        vitalsDialog(el.dataset.patientId || S.selectedPatient);
        break;
      case 'new-agenda':
        agendaForm();
        break;
      case 'select-agenda':
        S.selectedAgenda = id;
        contentOnly();
        break;
      case 'delete-agenda': {
        const ag = (S.data.agendas || []).find(x => x.id === id);
        if (confirm(`¿Confirma eliminar la agenda "${ag?.name || 'seleccionada'}"?`)) {
          await api('/api/agendas/' + id, 'DELETE');
          if (S.selectedAgenda === id) S.selectedAgenda = 'ALL';
          await refresh();
          contentOnly();
          toast('Agenda eliminada correctamente.');
        }
        break;
      }
      case 'new-quote':
        quoteForm(el.dataset.patientId || S.selectedPatient);
        break;
      case 'print-quote':
        printQuoteDocument(id);
        break;
      case 'print-invoice':
        printInvoiceDocument(id);
        break;
      case 'delete-quote': {
        const qt = (S.data?.quotes || []).find(x => x.id === id);
        if (confirm(`¿Confirma eliminar el presupuesto "${qt?.title || qt?.number || id}"?`)) {
          await api('/api/quotes/' + id, 'DELETE');
          await refresh();
          contentOnly();
          toast('Presupuesto eliminado correctamente.');
        }
        break;
      }
      case 'share-quote-wa': {
        try {
          const res = await api('/api/quotes/' + id + '/whatsapp', 'POST', {});
          if (res.waLink) window.open(res.waLink, '_blank');
          toast(res.message || 'Presupuesto listo para enviar.');
        } catch (err) {
          toast(err.message, true);
        }
        break;
      }
      case 'approve-quote': {
        await api('/api/quotes/' + id, 'PATCH', { status: 'APPROVED' });
        await refresh();
        contentOnly();
        toast('Presupuesto marcado como Aprobado.');
        break;
      }
      case 'open-patient-importer':
      case 'open-omnia-importer':
        patientImportDialog();
        break;
      case 'new-medical-order':
        medicalOrderDialog(el.dataset.patientId || S.selectedPatient);
        break;
      case 'new-hospital-day-order':
        newHospitalDayOrderDialog(el.dataset.patient || S.selectedPatient, el.dataset.resource);
        break;
      case 'config-ambulatory-resources':
        configAmbulatoryResourcesDialog();
        break;
      case 'hd-next-session': {
        const ord = (S.data?.medicalOrders || []).find(o => o.id === id);
        if (ord) newHospitalDayOrderDialog(ord.patientId, ord.resource, ord.therapyType, ord);
        break;
      }
      case 'hd-filter':
        S.hospitalDayFilter = el.dataset.val;
        contentOnly();
        break;
      case 'hd-checkin': {
        el.disabled = true;
        try {
          await api('/api/medical-orders/' + id + '/checkin', 'POST', {});
          await refresh();
          contentOnly();
          toast('Paciente ingresó a sesión. Sillón ocupado.');
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'hd-finish':
        administerHospitalDayDialog(id);
        break;
      case 'hd-view-evolution': {
        S.selectedPatient = el.dataset.patient;
        S.omniTab = 'evoluciones';
        S.omniEvolFilter = 'HOSPITAL_DAY';
        await navigate('records');
        break;
      }
      case 'set-evol-filter':
        S.omniEvolFilter = el.dataset.val;
        contentOnly();
        break;
      case 'staff-tab':
        S.staffTab = el.dataset.value;
        contentOnly();
        break;
      case 'administer-order': {
        el.disabled = true;
        try {
          await api('/api/medical-orders/' + id + '/administer', 'POST', {});
          await refresh();
          contentOnly();
          toast('Indicación médica administrada y stock de insumos descontado exitosamente.');
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'cancel-order': {
        if (confirm('¿Confirma cancelar esta indicación médica?')) {
          await api('/api/medical-orders/' + id + '/cancel', 'POST', {});
          await refresh();
          contentOnly();
          toast('Indicación médica cancelada.');
        }
        break;
      }
      case 'send-apt-email': {
        el.disabled = true;
        try {
          const res = await api('/api/appointments/' + id + '/send-email', 'POST', {});
          toast(res.message || 'Confirmación y archivo .ics enviados por correo.');
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'edit-medical-history': medicalHistoryDialog(id); break;
      case 'new-consent': consentDialog(el.dataset.patientId || S.selectedPatient); break;
      case 'print-consent': window.open('/api/consents/' + id + '/document', '_blank'); break;
      case 'new-record': if (!S.data?.patients?.length) patientForm(); else recordForm(); break;
      case 'amend-record': recordForm(id); break;
      case 'verify-record': await verifyRecord(id); break;
      case 'new-prescription': prescriptionForm(); break;
      case 'new-payment': paymentForm(el.dataset.patientId, 'INCOME'); break;
      case 'new-expense': paymentForm(el.dataset.patientId, 'EXPENSE'); break;
      case 'payment-filter': S.paymentFilter = el.dataset.val; contentOnly(); break;
      case 'new-invoice': invoiceForm(); break;
      case 'billing-tab': S.billingTab = el.dataset.value; contentOnly(); break;
      case 'share-invoice-wa': {
        try {
          const res = await api('/api/invoices/' + id + '/whatsapp', 'POST', {});
          if (res.waLink) window.open(res.waLink, '_blank');
          toast(res.message || 'Comprobante listo para enviar.');
        } catch (err) {
          toast(err.message, true);
        }
        break;
      }
      case 'new-inventory-lot': createLotDialog(); break;
      case 'new-inventory': inventoryForm(); break;
      case 'refresh-inv-logs':
        await refresh();
        contentOnly();
        toast('Registro de acciones actualizado.');
        break;
      case 'export-inv-logs': {
        const rows = getInventoryActionLogs();
        const csv = [['Fecha', 'Accion', 'Producto', 'Categoria', 'Subcategoria', 'Detalle', 'Responsable'],
          ...rows.map(r => [r.createdAt, r.actionLabel, r.product, r.category, r.subcategory, r.details, r.actor])
        ].map(row => row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `registro-acciones-inventario-${dateKey()}.csv`;
        a.click();
        toast('Registro de acciones exportado en CSV.');
        break;
      }
      case 'edit-inventory': inventoryForm(id); break;
      case 'adjust-stock': adjustStockDialog(id); break;
      case 'inventory-cat': S.inventoryCategory = el.dataset.value; contentOnly(); break;
      case 'delete-inventory': {
        const item = (S.data?.inventory || []).find(x => x.id === id);
        if (confirm(`¿Confirma eliminar el insumo "${item?.name || 'seleccionado'}" del inventario?`)) {
          await api('/api/inventory/' + id, 'DELETE');
          toast('Insumo eliminado del inventario.');
          await refresh();
          contentOnly();
        }
        break;
      }
      case 'export-patients': exportPatients(); break;
      case 'print-record': window.open('/api/records/' + id + '/document', '_blank'); break;
      case 'print-prescription': printPrescriptionDocument(id); break;
      case 'send-wa-reminder': {
        el.disabled = true;
        try {
          await api('/api/appointments/' + id + '/whatsapp-reminder', 'POST', {});
          toast('Recordatorio de turno enviado vía WhatsApp.');
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'config-integration': configIntegrationDialog(id); break;
      case 'test-integration-live': {
        el.disabled = true;
        try {
          const res = await api('/api/admin/integrations/' + id + '/test', 'POST', {});
          toast(`Conexión verificada: ${res.latencyMs}ms (${res.message})`);
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'sync-ghl-appointments': {
        el.disabled = true;
        try {
          const res = await api('/api/admin/integrations/highlevel/sync', 'POST', {});
          await refresh();
          render();
          const errNote = res.errors?.length ? ` · Avisos: ${res.errors.join(', ')}` : '';
          toast(`Sincronización GHL · Contactos: +${res.contactsImported || 0} nuevos / ${res.contactsEnriched || 0} actualizados · Turnos: +${res.imported || 0} nuevos / ${res.updated || 0} actualizados${errNote}`);
        } catch (err) {
          toast(err.message, true);
        } finally {
          el.disabled = false;
        }
        break;
      }
      case 'disconnect-integration': {
        el.disabled = true;
        await api('/api/admin/integrations/' + id + '/disconnect', 'POST', {});
        await refresh();
        closeModal();
        render();
        toast('Conexión desactivada.');
        break;
      }
      case 'setting-toggle': {
        el.disabled = true;
        const key = el.dataset.key;
        await api('/api/settings', 'PATCH', { [key]: !S.data.settings[key] });
        await refresh();
        contentOnly();
        toast('Preferencia actualizada.');
        break;
      }
      case 'assistant': assistantDialog(); break;
      case 'chat-suggestion': {
        el.disabled = true;
        await sendChat(el.dataset.text);
        el.disabled = false;
        break;
      }
      case 'manage-clinic': {
        const wsName = el.dataset.name || 'Clínica';
        S.supportMode = { id, name: wsName };
        toast(`Modo Soporte activado para ${wsName}. Puedes configurar GHL e integraciones.`);
        await refresh();
        await navigate('integrations');
        break;
      }
      case 'exit-support-mode': {
        S.supportMode = null;
        toast('Has salido del Modo Soporte.');
        await refresh();
        await navigate('admin');
        break;
      }
      case 'new-workspace': formDialog('workspace', 'Alta de Nueva Clínica', 'Registra la nueva clínica cliente y asigna sus credenciales de acceso iniciales.',
        field('Nombre de la clínica *', 'name', 'text', '', 'required minlength="2" maxlength="100" placeholder="Ej. Centro Médico Palermo"', true) +
        field('Correo del Administrador de la clínica *', 'adminEmail', 'email', '', 'required placeholder="contacto@clinicapalermo.com"') +
        field('Contraseña inicial / temporal *', 'adminPassword', 'text', '', 'required minlength="8" placeholder="Ej. Palermo2026!"')
      , 'Dar de alta clínica y usuario'); break;
      case 'toggle-ws-status': {
        el.disabled = true;
        const curStatus = el.dataset.status;
        const nextStatus = curStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
        await api('/api/admin/workspaces/' + id, 'PATCH', { status: nextStatus });
        await refresh();
        contentOnly();
        toast(`Clínica ${nextStatus === 'PAUSED' ? 'pausada' : 'reactivada'} exitosamente.`);
        break;
      }
      case 'delete-workspace': {
        const wsName = el.dataset.name;
        if (confirm(`¿Estás seguro de ELIMINAR permanentemente la clínica "${wsName}"?\n\nEsta acción borrará todos sus pacientes, agendas, turnos, historias clínicas y registros asociados de manera irreversible.`)) {
          el.disabled = true;
          await api('/api/admin/workspaces/' + id, 'DELETE');
          await refresh();
          contentOnly();
          toast(`Clínica "${wsName}" eliminada permanentemente.`);
        }
        break;
      }
      // Portal del Paciente
      case 'portal-go-register': {
        S.portal.step = 'register';
        if (!S.portal.clinicsList?.length) {
          try {
            const res = await api('/api/portal/clinics');
            S.portal.clinicsList = res.clinics || [];
          } catch {}
        }
        render();
        break;
      }
      case 'portal-select-clinic': {
        const wsId = el.dataset.ws;
        if (!wsId) break;
        const res = await api('/api/portal/auth/request-otp', 'POST', {
          dni: S.portal.dniEntered,
          phone: S.portal.phoneEntered,
          workspaceId: wsId
        });
        S.portal.clinicId = wsId;
        S.portal.phoneMasked = res.phoneMasked || res.maskedPhone;
        S.portal.demoCode = res.demoCode;
        S.portal.step = 'otp';
        toast('Código de verificación enviado por WhatsApp.');
        render();
        break;
      }
      case 'portal-go-login': {
        S.portal.step = 'dni';
        render();
        break;
      }
      case 'portal-logout': {
        localStorage.removeItem('portal_token');
        S.portal = { token: null, patient: null, data: null, activeTab: 'inicio', step: 'dni' };
        toast('Sesión cerrada.');
        render();
        break;
      }
      case 'portal-tab': {
        S.portal.activeTab = el.dataset.tab;
        render();
        break;
      }
      case 'portal-open-booking': {
        portalBookingDialog();
        break;
      }
      case 'portal-open-upload': {
        portalUploadDialog();
        break;
      }
      case 'portal-print-prescription':
        printPrescriptionDocument(id);
        break;
      case 'portal-print-invoice':
        printInvoiceDocument(id);
        break;
      case 'portal-cancel-appointment': {
        if (confirm('¿Confirmas que deseas cancelar este turno?')) {
          el.disabled = true;
          await api('/api/portal/appointments/' + id + '/cancel', 'POST', {});
          toast('Turno cancelado exitosamente.');
          await refreshPortal();
          render();
        }
        break;
      }
    }
  } catch (err) {
    toast(err.message, true);
    if (el) el.disabled = false;
  }
});

document.addEventListener('submit', async e => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  if (form.dataset.busy) return;
  const kind = form.dataset.form, b = Object.fromEntries(new FormData(form));
  const submit = form.querySelector('[type="submit"]'), error = form.querySelector('.form-error');
  if (error) error.textContent = '';
  if (submit) submit.disabled = true;
  form.dataset.busy = '1';

  try {
    if (kind === 'login') {
      const sessionObj = await api('/api/login', 'POST', b);
      if (!sessionObj?.user) throw Error('No se pudo iniciar sesión. Verifica tus credenciales.');
      S.session = sessionObj;
      localStorage.setItem('clinic_session', JSON.stringify(S.session));
      if (S.session.token) localStorage.setItem('supabase_token', S.session.token);
      try { await refresh(); } catch (err) { console.warn('[refresh warning]', err); }
      S.date = S.data?.date || dateKey();
      S.view = S.session.user?.role === 'SUPER_ADMIN' ? 'admin' : 'home';
      if (!PREVIEW) history.replaceState({}, '', paths[S.view]);
      render();
      startRealtimeSync();
      return;
    }
    if (kind === 'global-search') {
      S.patientSearch = b.query || '';
      await navigate('patients');
      return;
    }
    if (kind === 'chat') {
      form.querySelector('input').value = '';
      await sendChat(b.text);
      return;
    }

    let message = 'Cambios guardados con éxito.';
    switch (kind) {
      case 'patient':
        if (b.allergies) {
          b.medicalHistory = { allergies: b.allergies };
          delete b.allergies;
        }
        await api('/api/patients', 'POST', b);
        message = 'Paciente registrado exitosamente.';
        S.view = 'patients';
        break;
      case 'edit-patient':
        if (b.allergies) {
          b.medicalHistory = { ...(patientBy(form.dataset.id)?.medicalHistory || {}), allergies: b.allergies };
          delete b.allergies;
        }
        await api('/api/patients/' + form.dataset.id, 'PATCH', b);
        message = 'Ficha del paciente actualizada.';
        break;
      case 'medical-history':
        await api('/api/patients/' + form.dataset.id + '/medical-history', 'PATCH', b);
        message = 'Antecedentes médicos y factores de riesgo actualizados.';
        break;
      case 'consent':
        await api('/api/consents', 'POST', { ...b, patientId: form.dataset.patientId });
        S.recordTab = 'consents';
        S.omniTab = 'consentimientos';
        message = 'Consentimiento informado bilateral emitido y firmado con validez legal.';
        break;
      case 'agenda':
        await api('/api/agendas', 'POST', b);
        S.view = 'schedule';
        message = 'Nueva agenda paralela creada correctamente.';
        break;
      case 'quote': {
        const rows = Array.from(form.querySelectorAll('.quote-item-row'));
        const items = rows.map(row => ({
          description: row.querySelector('.quote-desc')?.value?.trim() || '',
          quantity: Math.max(1, Number(row.querySelector('.quote-qty')?.value || 1)),
          unitPrice: Math.max(0, Number(row.querySelector('.quote-price')?.value || 0))
        })).filter(it => it.description);
        if (!items.length) throw new Error('Agrega al menos un ítem con descripción al presupuesto.');
        const objectives = String(b.objectivesText || '')
          .split('\n')
          .map(x => x.trim())
          .filter(Boolean);
        const serializedNotes = JSON.stringify({
          type: 'SIGNATURE_PROGRAM',
          stageSubtitle: b.stageSubtitle || 'ETAPA 1 · PROGRAMA CLÍNICO INTENSIVO PERSONALIZADO',
          clinicalContext: b.clinicalContext || '',
          rationale: b.rationale || '',
          objectives: objectives.length ? objectives : undefined,
          schedulePlan: b.schedulePlan || '',
          surchargePercent: Number(b.surchargePercent ?? 10),
          additionalNotes: b.notes || ''
        });
        await api('/api/quotes', 'POST', {
          patientId: b.patientId,
          doctorId: b.doctorId || null,
          title: b.title,
          currency: b.currency || 'ARS',
          validUntil: b.validUntil || plusDays(dateKey(), 15),
          discount: Number(b.discount || b.discountPercent || 0),
          notes: serializedNotes,
          items
        });
        S.view = 'billing';
        S.billingTab = 'quotes';
        message = 'Programa clínico y presupuesto creado exitosamente.';
        break;
      }
      case 'upload-study': {
        let fileData = [];
        try { fileData = JSON.parse(b.attachmentPayload || b.attachmentsJson || '[]'); } catch {}
        const stType = b.studyType || b.type || 'STUDY';
        await api('/api/records', 'POST', {
          patientId: b.patientId,
          type: stType,
          problem: b.problem || b.title || 'Estudio / Laboratorio',
          specialty: b.specialty || '',
          title: b.title || 'Estudio / Laboratorio',
          content: {
            notes: b.notes || '',
            studyType: stType
          },
          attachments: fileData
        });
        S.selectedPatient = b.patientId;
        S.view = 'records';
        S.omniTab = (stType === 'LAB') ? 'laboratorio' : 'estudios';
        message = 'Estudio / archivo cargado exitosamente en el historial.';
        break;
      }
      case 'study-order': {
        const doc = resolveDoctorForDoc(b.doctorId);
        const created = await api('/api/records', 'POST', {
          patientId: b.patientId,
          type: 'STUDY_ORDER',
          problem: `Orden de Estudios · ${b.diagnosis || 'Evaluación'}`,
          specialty: doc.specialty || 'Medicina Integrativa',
          title: 'Orden Médica de Estudios',
          content: {
            title: 'Orden Médica de Estudios',
            diagnosis: b.diagnosis || '',
            doctorId: b.doctorId || doc.id,
            notes: b.orderText || '',
            prepNotes: b.prepNotes || ''
          }
        });
        S.selectedPatient = b.patientId;
        S.view = 'records';
        S.omniTab = 'estudios';
        message = 'Orden de estudios guardada en la historia clínica.';
        if (created?.id) {
          setTimeout(() => printStudyOrderDocument(created.id), 250);
        }
        break;
      }
      case 'vitals': {
        await api('/api/records', 'POST', {
          patientId: b.patientId,
          type: 'VITALS',
          problem: b.problem || 'Control de Signos Vitales',
          title: 'Signos Vitales y Biometría',
          content: {
            vitals: {
              bloodPressure: b.bloodPressure || '',
              heartRate: b.heartRate || '',
              respiratoryRate: b.respiratoryRate || '',
              temperature: b.temperature || '',
              oxygenSaturation: b.oxygenSaturation || '',
              weight: b.weight || '',
              height: b.height || '',
              bmi: b.bmi || '',
              notes: b.notes || ''
            }
          }
        });
        S.selectedPatient = b.patientId;
        S.view = 'records';
        S.omniTab = 'signos-vitales';
        message = 'Signos vitales registrados en la historia clínica.';
        break;
      }
      case 'medical-order': {
        let orderItems = [];
        try { orderItems = JSON.parse(b.itemsJson || '[]'); } catch {}
        await api('/api/medical-orders', 'POST', {
          patientId: b.patientId,
          doctorId: b.doctorId,
          instructions: b.instructions,
          items: orderItems,
          notes: b.notes || ''
        });
        S.hospitalDayFilter = 'ALL';
        S.view = 'hospitalDay';
        message = 'Indicación médica para enfermería registrada con éxito. Visible en Hospital de Día y en la Historia Clínica del paciente.';
        break;
      }
      case 'patient-importer':
      case 'omnia-importer': {
        const raw = b.csvText || '';
        if (!raw.trim()) throw new Error('Por favor ingresa o carga datos en formato CSV.');
        const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error('El archivo debe contener una fila de encabezados y al menos un paciente.');
        
        const firstLine = lines[0];
        const delim = firstLine.includes(';') ? ';' : (firstLine.includes('\t') ? '\t' : ',');
        const headers = firstLine.split(delim).map(h => h.trim().replace(/^["']|["']$/g, ''));
        
        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delim).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (!cols.length || (cols.length === 1 && !cols[0])) continue;
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });
          parsedRows.push(rowObj);
        }
        
        toast(`Importando ${parsedRows.length} pacientes...`);
        const res = await api('/api/migration/import', 'POST', { rows: parsedRows });
        message = `Importación de pacientes finalizada: ${res.imported} nuevos pacientes dados de alta, ${res.updated} actualizados en el padrón.`;
        S.view = 'patients';
        break;
      }
      case 'appointment': case 'reschedule': {
        const data = {
          patientId: b.patientId || S.data.appointments.find(a => a.id === form.dataset.id)?.patientId,
          doctorId: b.doctorId,
          agendaId: b.agendaId || 'default',
          startAt: localAt(b.date, b.time),
          duration: Number(b.duration),
          type: b.type,
          notes: b.notes
        };
        await api(kind === 'appointment' ? '/api/appointments' : '/api/appointments/' + form.dataset.id, kind === 'appointment' ? 'POST' : 'PATCH', data);
        S.date = b.date;
        S.view = 'schedule';
        message = kind === 'appointment' ? 'Turno confirmado en la agenda médica.' : 'Turno reprogramado exitosamente.';
        break;
      }
      case 'appointment-status':
        await api('/api/appointments/' + form.dataset.id, 'PATCH', { status: b.status, doctorId: b.doctorId });
        message = 'Estado y profesional del turno actualizados.';
        break;
      case 'staff':
        await api('/api/staff', 'POST', b);
        message = 'Nuevo miembro del equipo registrado con éxito.';
        S.view = 'staff';
        break;
      case 'doctor-credentials':
        await api('/api/staff/' + form.dataset.id + '/credentials', 'PATCH', b);
        message = 'Firma digital, sello y matrícula profesional guardados correctamente.';
        S.view = 'staff';
        break;
      case 'lead':
        await api('/api/leads', 'POST', b);
        S.view = 'pipeline';
        message = 'Contacto agregado a seguimiento.';
        break;
      case 'record': {
        if (form.dataset.amendment) {
          b.amendmentOf = form.dataset.amendment;
          b.patientId = S.data.records.find(r => r.id === b.amendmentOf).patientId;
        }
        let fileData = [];
        try { fileData = JSON.parse(b.attachmentPayload || b.attachmentsJson || '[]'); } catch {}
        b.attachments = fileData;

        let supplies = [];
        try { supplies = JSON.parse(b.consumedSuppliesJson || '[]'); } catch {}
        b.consumedSupplies = supplies;

        const editor = document.getElementById('omni-rich-editor');
        if (editor) {
          b.html = editor.innerHTML;
        }

        await api('/api/records', 'POST', b);
        S.selectedPatient = b.patientId;
        S.view = 'records';
        S.omniTab = 'evoluciones';
        message = 'Evolución médica firmada y registrada.' + (supplies.length ? ` Se descontaron ${supplies.length} insumos del inventario.` : '');
        break;
      }
      case 'prescription': {
        let meds = [];
        try { meds = JSON.parse(b.medicationsJson || '[]'); } catch {}
        const doc = resolveDoctorForDoc(b.doctorId);
        await api('/api/prescriptions', 'POST', {
          patientId: b.patientId,
          doctorId: b.doctorId || doc.id,
          doctorName: doc.name,
          doctorLicense: doc.licenseNumber,
          cuir: b.cuir,
          diagnosis: b.diagnosis || '',
          medications: meds,
          content: b.content
        });
        S.view = 'records';
        S.recordTab = 'prescriptions';
        S.omniTab = 'prescripciones';
        S.selectedPatient = b.patientId;
        message = 'Receta médica electrónica legal (CUIR + Firma Digital + QR) emitida.';
        break;
      }
      case 'payment':
        await api('/api/payments', 'POST', {
          ...b,
          amount: Number(b.amount),
          movementType: b.movementType || 'INCOME',
          category: b.category || 'CONSULTATION'
        }, { 'Idempotency-Key': form.dataset.key });
        S.view = 'billing';
        S.billingTab = 'payments';
        message = b.movementType === 'EXPENSE' ? 'Egreso registrado y categorizado correctamente.' : 'Ingreso / cobro registrado y categorizado correctamente.';
        break;
      case 'invoice': {
        const arca = (S.data?.integrations || []).find(i => i.id === 'arca');
        if (!arca || arca.status !== 'CONNECTED') {
          throw new Error('La integración oficial con ARCA (ex AFIP) no está conectada. Configura tus credenciales y certificado fiscal en Integraciones antes de emitir comprobantes.');
        }
        await api('/api/invoices', 'POST', { ...b, amount: Number(b.amount) });
        S.view = 'billing';
        S.billingTab = 'invoices';
        message = 'Factura oficial autorizada por ARCA con CAE emitida exitosamente.';
        break;
      }
      case 'inventory-lot':
        await api('/api/inventory/lots', 'POST', {
          existingInventoryId: b.existingInventoryId || '',
          name: b.name,
          groupCategory: b.groupCategory,
          category: b.category,
          unit: b.unit,
          lotNumber: b.lotNumber,
          quantity: Number(b.quantity),
          expiryDate: b.expiryDate,
          minQuantity: Number(b.minQuantity),
          notes: b.notes || ''
        });
        message = `Lote ${b.lotNumber} de "${b.name}" registrado en el inventario.`;
        S.view = 'inventory';
        break;
      case 'inventory':
        if (form.dataset.id) {
          await api('/api/inventory/' + form.dataset.id, 'PATCH', b);
          message = 'Insumo médico actualizado correctamente.';
        } else {
          await api('/api/inventory', 'POST', b);
          message = 'Insumo médico registrado en el inventario.';
        }
        S.view = 'inventory';
        break;
      case 'inventory-stock': {
        const invId = form.dataset.id;
        const delta = (b.movementType === 'CONSUMPTION' || b.movementType === 'EXPIRATION')
          ? -Math.abs(parseInt(b.amount, 10))
          : Math.abs(parseInt(b.amount, 10));
        await api('/api/inventory/' + invId + '/stock', 'PATCH', { delta, reason: b.reason });
        message = 'Ajuste de stock registrado correctamente en el inventario.';
        S.view = 'inventory';
        break;
      }
      case 'workspace':
        await api('/api/admin/workspaces', 'POST', b);
        message = 'Nueva clínica dada de alta correctamente.';
        break;
      case 'config-integration': {
        const id = form.dataset.id;
        await api('/api/admin/integrations/' + id, 'POST', { config: b, status: 'CONNECTED' });
        message = 'Conexión configurada y validada.';
        break;
      }
      case 'forgot-password': {
        try {
          await api('/api/auth/reset-password', 'POST', { email: b.email });
        } catch {}
        closeModal();
        toast('Si el correo está registrado en la base de datos, enviamos las instrucciones de acceso a tu casilla.');
        return;
      }
      case 'portal-request-code': {
        const res = await api('/api/portal/auth/request-otp', 'POST', { ...b, workspaceId: S.portal.clinicId || '' });
        S.portal.dniEntered = b.dni;
        S.portal.phoneEntered = b.phone;
        if (res.exists === false) {
          throw Error(res.message || 'No encontramos una ficha con ese DNI. Usa "Regístrate aquí" para crear tu ficha.');
        }
        if (res.multiClinic && Array.isArray(res.clinics)) {
          S.portal.multiClinics = res.clinics;
          S.portal.step = 'choose-clinic';
          render();
          return;
        }
        S.portal.phoneMasked = res.phoneMasked || res.maskedPhone;
        S.portal.demoCode = res.demoCode;
        S.portal.step = 'otp';
        toast('Código de verificación enviado por WhatsApp.');
        render();
        return;
      }
      case 'portal-verify-code': {
        const res = await api('/api/portal/auth/verify-otp', 'POST', {
          dni: S.portal.dniEntered,
          code: b.code
        });
        S.portal.token = res.token;
        S.portal.patient = res.patient;
        localStorage.setItem('portal_token', res.token);
        await refreshPortal();
        toast('¡Bienvenido/a, ' + (res.patient?.firstName || '') + '!');
        render();
        startRealtimeSync();
        return;
      }
      case 'portal-register': {
        const res = await api('/api/portal/auth/register', 'POST', b);
        S.portal.token = res.token;
        S.portal.patient = res.patient;
        localStorage.setItem('portal_token', res.token);
        await refreshPortal();
        toast('Registro completado. ¡Bienvenido/a a tu portal de salud!');
        render();
        startRealtimeSync();
        return;
      }
      case 'portal-booking': {
        await api('/api/portal/appointments', 'POST', b);
        closeModal();
        toast('¡Turno reservado con éxito!');
        await refreshPortal();
        S.portal.activeTab = 'turnos';
        render();
        return;
      }
      case 'portal-upload-study': {
        await api('/api/portal/upload-study', 'POST', b);
        closeModal();
        toast('Estudio subido correctamente a tu historia clínica.');
        await refreshPortal();
        S.portal.activeTab = 'estudios';
        render();
        return;
      }
      case 'config-ambulatory-resources': {
        let resources = [];
        try { resources = JSON.parse(b.resourcesJson || '[]'); } catch {}
        if (!resources.length) throw Error('Agrega al menos un sillón o box.');
        await api('/api/settings', 'PATCH', { ambulatoryResources: resources });
        closeModal();
        await refresh();
        contentOnly();
        toast('Sillones y boxes de Terapias Ambulatorias actualizados.');
        return;
      }
      case 'new-hospital-day-order': {
        let items = [];
        try { items = JSON.parse(b.itemsJson || '[]'); } catch {}
        await api('/api/medical-orders', 'POST', {
          patientId: b.patientId,
          doctorId: b.doctorId,
          therapyType: b.therapyType,
          resource: b.resource,
          sessionNumber: parseInt(b.sessionNumber, 10) || 1,
          totalSessions: parseInt(b.totalSessions, 10) || 1,
          instructions: b.instructions,
          items,
          notes: b.notes || ''
        });
        closeModal();
        await refresh();
        contentOnly();
        toast('Indicación de Hospital de Día registrada para enfermería.');
        return;
      }
      case 'finish-hospital-day-order': {
        let hrvTable = [];
        try { hrvTable = JSON.parse(b.hrvJson || '[]'); } catch {}
        const id = form.dataset.id;
        await api('/api/medical-orders/' + id + '/administer', 'POST', {
          vitals: {
            bloodPressure: b.bloodPressure,
            heartRate: b.heartRate,
            oxygenSaturation: b.oxygenSaturation
          },
          hrvTable,
          tolerance: b.tolerance,
          notes: b.notes || ''
        });
        closeModal();
        await refresh();
        contentOnly();
        toast('¡Sesión finalizada! Insumos descontados y evolución de enfermería generada.');
        return;
      }
    }

    await refresh();
    closeModal();
    if (!PREVIEW) history.replaceState({}, '', paths[S.view]);
    render();
    toast(message);
  } catch (err) {
    if (error) error.textContent = err.message;
    else toast(err.message, true);
  } finally {
    delete form.dataset.busy;
    if (submit) submit.disabled = false;
  }
});

document.addEventListener('input', e => {
  if (e.target.dataset.input === 'record-patient-search') {
    const value = e.target.value, start = e.target.selectionStart;
    S.recordPatientSearch = value;
    contentOnly();
    const input = $('#record-patient-search');
    if (input) {
      input.focus();
      input.setSelectionRange(start, start);
    }
  }
  if (e.target.dataset.input === 'patient-search') {
    const value = e.target.value, start = e.target.selectionStart;
    S.patientSearch = value;
    contentOnly();
    const input = $('#patient-search');
    if (input) {
      input.focus();
      input.setSelectionRange(start, start);
    }
  }
  if (e.target.dataset.input === 'staff-search') {
    const value = e.target.value, start = e.target.selectionStart;
    S.staffSearch = value;
    contentOnly();
    const input = document.querySelector('input[data-input="staff-search"]');
    if (input) {
      input.focus();
      input.setSelectionRange(start, start);
    }
  }
  if (e.target.dataset.action === 'search-inventory') {
    const value = e.target.value, start = e.target.selectionStart;
    S.inventorySearch = value;
    contentOnly();
    const input = document.querySelector('input[data-action="search-inventory"]');
    if (input) {
      input.focus();
      input.setSelectionRange(start, start);
    }
  }
  if (e.target.dataset.input === 'inv-log-search') {
    const value = e.target.value, start = e.target.selectionStart;
    S.invLogSearch = value;
    contentOnly();
    const input = $('#inv-log-search');
    if (input) {
      input.focus();
      input.setSelectionRange(start, start);
    }
  }
  if (e.target.dataset.action === 'omni-search') {
    const value = e.target.value, start = e.target.selectionStart;
    S.omniSearch = value;
    contentOnly();
    const input = document.querySelector('input[data-action="omni-search"]');
    if (input) {
      input.focus();
      input.setSelectionRange(start, start);
    }
  }
});

document.addEventListener('change', async e => {
  const el = e.target, key = el.dataset.change, action = el.dataset.action;
  if (action === 'omni-from') {
    S.omniFromDate = el.value;
    contentOnly();
    return;
  }
  if (action === 'omni-to') {
    S.omniToDate = el.value;
    contentOnly();
    return;
  }
  if (!key) return;
  try {
    if (key === 'patient-status') { S.patientStatus = el.value; contentOnly(); }
    if (key === 'staff-role') { S.staffRole = el.value; contentOnly(); }
    if (key === 'inv-log-action') { S.invLogAction = el.value; contentOnly(); }
    if (key === 'date') { if (el.value) S.date = el.value; contentOnly(); }
    if (key === 'doctor') { S.doctor = el.value; contentOnly(); }
    if (key === 'agenda') { S.selectedAgenda = el.value; contentOnly(); }
    if (key === 'lead-status') {
      el.disabled = true;
      await api('/api/leads/' + el.dataset.id, 'PATCH', { status: el.value });
      await refresh();
      contentOnly();
      toast('Etapa de seguimiento actualizada.');
    }
  } catch (err) {
    toast(err.message, true);
    contentOnly();
  }
});

document.addEventListener('dragstart', e => {
  const card = e.target.closest('[data-lead]');
  if (card) e.dataTransfer.setData('text/plain', card.dataset.lead);
});
document.addEventListener('dragover', e => {
  const col = e.target.closest('[data-drop]');
  if (col) { e.preventDefault(); col.classList.add('drag-over'); }
});
document.addEventListener('dragleave', e => {
  const col = e.target.closest('[data-drop]');
  if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
});
document.addEventListener('drop', async e => {
  const col = e.target.closest('[data-drop]');
  if (!col) return;
  e.preventDefault();
  col.classList.remove('drag-over');
  const id = e.dataTransfer.getData('text/plain');
  if (!S.data?.leads.some(l => l.id === id)) return;
  try {
    await api('/api/leads/' + id, 'PATCH', { status: col.dataset.drop });
    await refresh();
    contentOnly();
    toast('Contacto movido en el embudo.');
  } catch (err) {
    toast(err.message, true);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
    e.preventDefault();
    $('#global-search')?.focus();
  }
});

window.addEventListener('popstate', () => {
  if (location.pathname.startsWith('/portal')) {
    S.view = 'portal';
    closeModal();
    render();
    return;
  }
  if (!S.session) return;
  const isAdmin = S.session.user.role === 'SUPER_ADMIN';
  S.view = Object.keys(paths).find(k => paths[k] === location.pathname) || (isAdmin ? 'admin' : 'home');
  closeModal();
  render();
});

function renderSetPasswordView(accessToken, tokenType, refreshToken = null) {
  const isRecovery = tokenType === 'recovery';
  $('#app').innerHTML = `
  <div class="login-shell" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d241e;padding:20px;font-family:system-ui,-apple-system,sans-serif;">
    <div class="panel" style="max-width:440px;width:100%;padding:32px;background:#ffffff;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <div class="brandmark" style="background:#15372f;color:#ffffff;width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;">${brandLogoSvg(20, '#ffffff')}</div>
        <div>
          <div style="font-weight:700;font-size:16px;color:#15372f;">Medical OS</div>
          <div style="font-size:12px;color:#62726b;">Plataforma Integral de Salud</div>
        </div>
      </div>
      <h2 style="font-size:19px;font-weight:700;color:#15372f;margin-bottom:8px;">
        ${isRecovery ? 'Restablece tu Contraseña' : 'Crea tu Contraseña de Acceso'}
      </h2>
      <p style="font-size:13px;color:#4a5568;line-height:1.5;margin-bottom:20px;">
        ${isRecovery 
          ? 'Ingresa tu nueva contraseña para volver a acceder a tu cuenta.' 
          : '¡Te damos la bienvenida a Medical OS! Para activar tu cuenta y acceder a la plataforma, define tu contraseña personal.'}
      </p>
      <form id="set-password-form">
        <div class="form-field" style="margin-bottom:14px;">
          <label for="new-pw" style="display:block;font-size:12px;font-weight:600;color:#2d3748;margin-bottom:5px;">Nueva Contraseña</label>
          <input id="new-pw" type="password" required minlength="8" placeholder="Mínimo 8 caracteres" autocomplete="new-password" autofocus style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;">
        </div>
        <div class="form-field" style="margin-bottom:16px;">
          <label for="confirm-pw" style="display:block;font-size:12px;font-weight:600;color:#2d3748;margin-bottom:5px;">Confirmar Contraseña</label>
          <input id="confirm-pw" type="password" required minlength="8" placeholder="Repite la nueva contraseña" autocomplete="new-password" style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;">
        </div>
        <div id="set-pw-error" class="form-error" role="alert" style="color:#e53e3e;font-size:12px;margin-bottom:14px;display:none;"></div>
        <button id="btn-save-pw" class="btn primary wide" type="submit" style="width:100%;padding:12px;font-size:14px;font-weight:600;border-radius:6px;">
          Guardar Contraseña y Acceder →
        </button>
      </form>
    </div>
  </div>`;

  const form = $('#set-password-form');
  const errBox = $('#set-pw-error');
  const btn = $('#btn-save-pw');

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    errBox.style.display = 'none';
    errBox.textContent = '';
    const p1 = $('#new-pw').value.trim();
    const p2 = $('#confirm-pw').value.trim();

    if (p1.length < 8) {
      errBox.textContent = 'La contraseña debe tener al menos 8 caracteres.';
      errBox.style.display = 'block';
      return;
    }
    if (p1 !== p2) {
      errBox.textContent = 'Las contraseñas no coinciden.';
      errBox.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Guardando contraseña en Supabase...';

    try {
      // 1. Update password in Supabase Auth
      const res = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: p1 })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw Error(data.msg || data.error_description || 'Error al actualizar contraseña.');
      }

      const updatedUser = await res.json();

      // 2. Clear hash from URL
      history.replaceState(null, '', window.location.pathname);

      // 3. Establish session
      const role = updatedUser.app_metadata?.role || updatedUser.user_metadata?.role || 'SUPER_ADMIN';
      const workspaceId = updatedUser.app_metadata?.workspace_id || updatedUser.user_metadata?.workspace_id || (role === 'SUPER_ADMIN' ? null : 'clinic-central');

      S.session = {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.user_metadata?.name || updatedUser.email.split('@')[0],
          role,
          workspaceId
        },
        token: accessToken
      };
      localStorage.setItem('clinic_session', JSON.stringify(S.session));
      localStorage.setItem('supabase_token', accessToken);

      try { await refresh(); } catch {}
      S.date = S.data?.date || dateKey();
      S.view = role === 'SUPER_ADMIN' ? 'admin' : 'home';
      render();
      toast('¡Contraseña establecida con éxito! Bienvenido a Medical OS.');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Guardar Contraseña y Acceder →';
      errBox.textContent = err.message;
      errBox.style.display = 'block';
    }
  });
}

let _rtSocket = null;
let _rtTimer = null;
let _rtHeartbeat = null;
let _rtBusy = false;
let _rtPendingRender = false;
let _rtDebounce = null;

function canSafeAutoRender() {
  const modal = $('#modal');
  if (modal && modal.open) return false;
  const active = document.activeElement;
  if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return false;
  if (active && active.isContentEditable) return false;
  return true;
}

async function performRealtimeSync(reason = 'poll', eventTable = '') {
  if (_rtBusy || document.hidden) return;
  if (S.view === 'portal') {
    if (!S.portal?.token || !S.portal?.data) return;
    _rtBusy = true;
    try {
      const prevAppts = S.portal.data.appointments?.length || 0;
      const prevRecs = S.portal.data.records?.length || 0;
      const prevRx = S.portal.data.prescriptions?.length || 0;
      await refreshPortal();
      const newAppts = S.portal.data?.appointments?.length || 0;
      const newRecs = S.portal.data?.records?.length || 0;
      const newRx = S.portal.data?.prescriptions?.length || 0;
      if (newRx > prevRx) toast('Nueva receta electrónica disponible en tu Portal.');
      else if (newAppts !== prevAppts || newRecs !== prevRecs) toast('Portal actualizado en tiempo real.');
      if (canSafeAutoRender()) render();
    } catch {} finally { _rtBusy = false; }
    return;
  }

  if (!S.session?.user || !S.data) return;
  _rtBusy = true;
  try {
    const prevAppts = S.data.appointments?.length || 0;
    const prevRecs = S.data.records?.length || 0;
    const prevPays = S.data.payments?.length || 0;
    const prevOrders = S.data.medicalOrders?.length || 0;
    const prevLeads = S.data.leads?.length || 0;
    await refresh();
    const curAppts = S.data?.appointments?.length || 0;
    const curRecs = S.data?.records?.length || 0;
    const curPays = S.data?.payments?.length || 0;
    const curOrders = S.data?.medicalOrders?.length || 0;
    const curLeads = S.data?.leads?.length || 0;

    if (curAppts > prevAppts) toast('Nuevo turno registrado en agenda en tiempo real.');
    else if (curRecs > prevRecs) toast('Nuevo estudio o evolución clínica recibida en tiempo real.');
    else if (curPays > prevPays) toast('Nuevo cobro o comprobante de pago recibido en tiempo real.');
    else if (curOrders > prevOrders) toast('Nueva indicación de Terapias Ambulatorias en tiempo real.');
    else if (curLeads > prevLeads) toast('Nueva consulta o contacto recibido en tiempo real.');
    else if (reason === 'ws' && eventTable) {
      // Silencioso para updates/cambios de estado sin ruido excesivo
    }

    if (canSafeAutoRender()) {
      contentOnly();
    } else {
      _rtPendingRender = true;
    }
  } catch {} finally {
    _rtBusy = false;
  }
}

function scheduleRealtimeRefresh(tableName = '') {
  clearTimeout(_rtDebounce);
  _rtDebounce = setTimeout(() => performRealtimeSync('ws', tableName), 350);
}

function startRealtimeSync() {
  if (PREVIEW) return;
  if (!_rtTimer) {
    _rtTimer = setInterval(() => performRealtimeSync('poll'), 6000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) performRealtimeSync('focus');
    });
    document.addEventListener('close', () => {
      if (_rtPendingRender && canSafeAutoRender()) {
        _rtPendingRender = false;
        contentOnly();
      }
    }, true);
  }

  if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) return;
  if (_rtSocket && (_rtSocket.readyState === WebSocket.OPEN || _rtSocket.readyState === WebSocket.CONNECTING)) return;

  try {
    const wsBase = SUPABASE_CONFIG.url.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_CONFIG.anonKey)}&vsn=1.0.0`;
    const ws = new WebSocket(wsUrl);
    _rtSocket = ws;
    let refCounter = 1;

    ws.onopen = () => {
      const watchTables = ['appointments', 'records', 'medical_orders', 'payments', 'inventory', 'leads', 'prescriptions', 'invoices', 'quotes', 'patients', 'consents', 'settings'];
      ws.send(JSON.stringify({
        topic: 'realtime:public',
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
            postgres_changes: watchTables.map(t => ({ event: '*', schema: 'public', table: t }))
          },
          access_token: S.session?.token || localStorage.getItem('supabase_token') || SUPABASE_CONFIG.anonKey
        },
        ref: String(refCounter++)
      }));
      clearInterval(_rtHeartbeat);
      _rtHeartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(refCounter++) }));
        }
      }, 25000);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event === 'postgres_changes') {
          const tbl = msg.payload?.data?.table || msg.payload?.table || '';
          scheduleRealtimeRefresh(tbl);
        }
      } catch {}
    };

    ws.onclose = () => {
      clearInterval(_rtHeartbeat);
      _rtSocket = null;
      setTimeout(() => {
        if (S.session?.user || S.portal?.token) startRealtimeSync();
      }, 5000);
    };
  } catch (e) {
    console.warn('[realtime ws init warning]', e);
  }
}

async function boot() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get('access_token');
  const tokenType = hashParams.get('type');

  if (accessToken && (tokenType === 'invite' || tokenType === 'recovery' || tokenType === 'signup')) {
    if (accessToken.split('.').length !== 3) {
      toast('El enlace de invitación está incompleto o fue recortado. Asegúrate de copiar el enlace entero con todo el token.', true);
      loginPage();
      return;
    }
    renderSetPasswordView(accessToken, tokenType, hashParams.get('refresh_token'));
    return;
  }

  if (location.pathname.startsWith('/portal')) {
    S.view = 'portal';
    const urlClinic = new URLSearchParams(location.search).get('clinic');
    if (urlClinic) {
      S.portal.clinicId = urlClinic;
      localStorage.setItem('portal_clinic_id', urlClinic);
    } else {
      S.portal.clinicId = localStorage.getItem('portal_clinic_id') || '';
    }
    const pTok = localStorage.getItem('portal_token');
    if (pTok) {
      S.portal.token = pTok;
      try { await refreshPortal(); } catch {}
    }
    render();
    startRealtimeSync();
    return;
  }

  try {
    const saved = localStorage.getItem('clinic_session');
    if (saved) {
      S.session = JSON.parse(saved);
      if (S.session?.token) localStorage.setItem('supabase_token', S.session.token);
    } else {
      S.session = await api('/api/session');
    }
    if (!S.session?.user) throw Error('Sesión inválida');
    await refresh();
    S.date = S.data?.date || dateKey();
    const isAdmin = S.session.user.role === 'SUPER_ADMIN';
    S.view = isAdmin ? 'admin' : (Object.keys(paths).find(k => paths[k] === location.pathname) || 'home');
    render();
    startRealtimeSync();
  } catch (err) {
    console.error('[boot error]', err);
    localStorage.removeItem('clinic_session');
    S.session = null;
    loginPage();
  }
}

boot();
})();
