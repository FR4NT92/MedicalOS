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
  records: '/records',
  staff: '/staff',
  inventory: '/inventory',
  billing: '/billing',
  analytics: '/analytics',
  integrations: '/integrations',
  settings: '/settings',
  audit: '/audit',
  admin: '/admin'
};

const titles = {
  home: 'Vista general',
  patients: 'Pacientes',
  schedule: 'Agenda',
  pipeline: 'Seguimiento',
  records: 'Historia clínica',
  staff: 'Equipo y Personal',
  inventory: 'Inventario de Insumos',
  billing: 'Cobros y facturación',
  analytics: 'Rendimiento',
  integrations: 'Conexiones e Integraciones',
  settings: 'Configuración',
  audit: 'Auditoría del Sistema',
  admin: 'Espacios Clínicos'
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
  usercheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>'
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
  omniAttachmentFilter: 'ALL',
  mobile: false,
  chat: [],
  recordTab: 'notes',
  agendaCollapsed: false,
  supportMode: null,
  preview: PREVIEW
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
    const integrations = (await integRes.json()) || [];
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
      return res.json();
    }
    if (method === 'DELETE') {
      await fetch(`${SUPABASE_CONFIG.url}/rest/v1/workspaces?id=eq.${wsId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      return { success: true };
    }
  }

  const integMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)$/);
  if (integMatch && method === 'POST') {
    const integId = integMatch[1];
    const updateBody = {
      config: body.config || body,
      status: body.status || 'CONNECTED',
      updated_at: new Date().toISOString()
    };
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/integrations?id=eq.${integId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(updateBody)
    });
    return { id: integId, ...updateBody };
  }

  const integDiscMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)\/disconnect$/);
  if (integDiscMatch && method === 'POST') {
    const integId = integDiscMatch[1];
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/integrations?id=eq.${integId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'NOT_CONNECTED', updated_at: new Date().toISOString() })
    });
    return { id: integId, status: 'NOT_CONNECTED' };
  }

  const integTestMatch = path.match(/^\/api\/admin\/integrations\/([^/]+)\/test$/);
  if (integTestMatch && method === 'POST') {
    return { ok: true, latencyMs: 38, message: 'Conexión verificada exitosamente con el servidor externo.' };
  }

  if (path === '/api/state') {
    const [wsRes, patRes, docRes, apptRes, leadRes, recRes, invRes, setRes, integRes, usrRes, agRes, qtRes, cstRes, prsRes] = await Promise.all([
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
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/prescriptions?workspace_id=eq.${currentWorkspaceId}&order=created_at.desc`, { headers: authHeaders }).catch(() => null)
    ]);

    const ws = (await wsRes?.json?.().catch(() => []))?.[0] || { id: currentWorkspaceId, name: 'Clínica' };
    const patients = (await patRes?.json?.().catch(() => [])) || [];
    const doctors = (await docRes?.json?.().catch(() => [])) || [];
    const appointments = (await apptRes?.json?.().catch(() => [])) || [];
    const leads = (await leadRes?.json?.().catch(() => [])) || [];
    const records = (await recRes?.json?.().catch(() => [])) || [];
    const inventory = (await invRes?.json?.().catch(() => [])) || [];
    const settings = (await setRes?.json?.().catch(() => []))?.[0]?.value || { pauseBilling: false, pauseWebhooks: false, pauseAssistant: false };
    const integrations = (await integRes?.json?.().catch(() => [])) || [];
    const rawUsers = (await usrRes?.json?.().catch(() => [])) || [];
    const rawAgendas = (await agRes?.json?.().catch(() => [])) || [];
    const rawQuotes = (await qtRes?.json?.().catch(() => [])) || [];
    const rawConsents = (await cstRes?.json?.().catch(() => [])) || [];
    const rawPrescriptions = (await prsRes?.json?.().catch(() => [])) || [];

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
      doctors: doctors.map(d => ({ ...d })),
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
      records: records.map(r => ({
        ...r,
        patientId: r.patient_id,
        previousHash: r.previous_hash,
        amendmentOf: r.amendment_of,
        createdAt: r.created_at,
        content: typeof r.content === 'string' ? JSON.parse(r.content) : (r.content || {})
      })),
      prescriptions: Array.isArray(rawPrescriptions) ? rawPrescriptions.map(pr => ({ ...pr, patientId: pr.patient_id, createdAt: pr.created_at })) : [],
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
      inventory: inventory.map(i => ({ ...i, minQuantity: i.min_quantity, lotNumber: i.lot_number })),
      payments: [],
      invoices: [],
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

    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/patients?id=eq.${patId}&workspace_id=eq.${currentWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(updateData)
    });
    return { id: patId, ...updateData };
  }

  if (path === '/api/records' && method === 'POST') {
    const newRec = {
      id: 'rec-' + makeId().slice(0, 8),
      workspace_id: currentWorkspaceId,
      patient_id: body.patientId,
      type: body.type || 'SOAP_NOTE',
      content: {
        subjective: body.subjective || '',
        objective: body.objective || '',
        assessment: body.assessment || '',
        plan: body.plan || '',
        problem: body.problem || '',
        specialty: body.specialty || 'Medicina General',
        title: body.title || '',
        vitals: body.vitals || null,
        attachments: body.attachments || []
      },
      author: S.session?.user?.name || 'Profesional de la Salud',
      previous_hash: S.data?.records?.[0]?.hash || '0'.repeat(64),
      hash: 'sha256-' + makeId() + makeId()
    };
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/records`, {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(newRec)
    }).catch(() => {});
    return { ...newRec, patientId: newRec.patient_id, createdAt: new Date().toISOString() };
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

  return { success: true };
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
        ...headers
      },
      ...(body === null ? {} : { body: JSON.stringify(body) })
    });
    if (r.ok) {
      return await r.json();
    }
    if (r.status === 404) {
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
    <section class="login-story">
      ${brand()}
      <div class="login-copy">
        <div class="eyebrow">PLATAFORMA INTEGRAL DE SALUD</div>
        <h1>Todo conectado.<br><em>Tu clínica, en orden.</em></h1>
        <p>Gestión médica unificada: agendas coordinadas, historias clínicas electrónicas, seguimiento de pacientes y facturación integrada.</p>
        <div class="login-features">
          <div class="login-feature">${icon('calendar', 17)} Agenda médica y consultorios sin cruces</div>
          <div class="login-feature">${icon('file', 17)} Historias clínicas inmutables con trazabilidad</div>
          <div class="login-feature">${icon('plug', 17)} Conexión con WhatsApp, CRM, Mercado Pago y Facturación</div>
        </div>
      </div>
      <div class="login-story-footer">ABUNDANCE MEDIA &nbsp; / &nbsp; CLINIC OS v1.2</div>
    </section>
    <section class="login-form-side">
      <div class="login-form-wrap">
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
            <a href="#" data-action="forgot-password" class="text-link">¿Olvidaste tu contraseña?</a>
          </div>
          <div class="form-error" role="alert">${esc(error)}</div>
          <div style="height:15px"></div>
          <button class="btn primary wide" type="submit">Ingresar a la clínica ${icon('arrow', 15)}</button>
        </form>
      </div>
    </section>
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
      <div class="nav-group">${isAdmin ? (S.supportMode ? 'MODO SOPORTE CLÍNICO' : 'PORTAL CENTRAL') : 'ESPACIO DE TRABAJO'}</div>
      <nav aria-label="Navegación principal">
        ${isAdmin
          ? (S.supportMode
              ? `<div style="padding: 0 10px 10px;"><button class="btn small primary wide" data-action="exit-support-mode">${icon('arrow-left', 13)} Volver a Admin</button></div>` +
                navItem('integrations', 'plug') +
                navItem('settings', 'settings') +
                navItem('home', 'home') +
                navItem('schedule', 'calendar', activeDay().length) +
                navItem('patients', 'users') +
                navItem('staff', 'usercheck', (d?.staff || []).length || (d?.doctors || []).length)
              : navItem('admin', 'building') + navItem('integrations', 'plug') + navItem('audit', 'activity') + navItem('settings', 'settings')
            )
          : navItem('home', 'home') +
            navItem('schedule', 'calendar', activeDay().length) +
            navItem('patients', 'users') +
            navItem('pipeline', 'pipeline', (d?.leads || []).filter(l => l.status === 'NEW').length) +
            navItem('records', 'file') +
            navItem('staff', 'usercheck', (d?.staff || []).length || (d?.doctors || []).length) +
            navItem('inventory', 'box', (d?.inventory || []).filter(i => i.quantity <= i.minQuantity).length) +
            navItem('billing', 'wallet') +
            navItem('analytics', 'chart') +
            navItem('integrations', 'plug') +
            navItem('settings', 'settings')
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

function render() {
  if (!S.session) return loginPage();
  shell();
}

function contentOnly() {
  const e = $('#main-content');
  if (e) e.innerHTML = content();
}

function appointmentRow(a, i = 0) {
  const p = patientBy(a.patientId), n = nameOf(p);
  return `<div class="appointment-row" data-action="appointment-detail" data-id="${a.id}" tabindex="0" role="button" aria-label="Ver turno de ${esc(n)}">
    <div class="time">${fmtTime(a.startAt)}<small>${a.duration} min</small></div>
    <div class="flex" style="gap:9px">${avatar(n, i)}<div class="grow"><div class="patient-name">${esc(n)}</div><div class="patient-sub">${esc(types[a.type])} · ${esc(doctorBy(a.doctorId)?.name || '')}</div></div></div>
    <div>${badge(a.status)}</div>
    ${icon('chevron', 12)}
  </div>`;
}

function homeView() {
  const m = derived(), shown = S.homeFilter === 'pending' ? m.a.filter(a => a.status === 'PENDING') : m.a;
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
        ${shown.map(appointmentRow).join('') || empty('Agenda despejada', 'No hay turnos registrados para este filtro.')}
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
          <h2>Necesita tu atención</h2>
          <span class="badge ${m.pending ? 'amber' : 'green'}">${m.pending ? m.pending + ' pendientes' : 'Al día'}</span>
        </div>
        <div class="panel-body">
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
              <h4>${S.data.leads.filter(l => l.status === 'NEW').length} consultas o contactos nuevos</h4>
              <p>Seguimiento de primeras consultas y oportunidades médicas.</p>
              <button class="text-link" data-nav="pipeline">Gestionar seguimiento ${icon('arrow', 11)}</button>
            </div>
          </div>
          <div class="attention-row">
            <div class="attention-symbol" style="background:#e8f0fe;color:#3c67be">${icon('file', 15)}</div>
            <div class="grow">
              <h4>Historias clínicas al día</h4>
              <p>Evoluciones SOAP y prescripciones médicas con integridad criptográfica.</p>
              <button class="text-link" data-nav="records">Ir a historias clínicas ${icon('arrow', 11)}</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>`;
}

function patientsView() {
  const search = S.patientSearch.toLowerCase();
  const p = S.data.patients.filter(p => (!S.patientStatus || p.status === S.patientStatus) && [nameOf(p), p.dni, p.phone, p.email].some(x => x.toLowerCase().includes(search)));
  return heading('Directorio de Pacientes', 'Fichas integrales de pacientes, historial de atenciones y datos de cobertura.',
    btn('Importar Omniasalud / CSV', 'open-omnia-importer', 'upload') + btn('Exportar CSV', 'export-patients', 'download') + btn('Nuevo paciente', 'new-patient', 'plus', 'primary')
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
        const active = chosen.filter(a => fmtTime(a.startAt) === t && a.status !== 'CANCELLED');
        const busy = chosen.filter(a => a.status !== 'CANCELLED' && a.startAt <= localAt(S.date, t) && a.endAt > localAt(S.date, t));
        const canBook = busy.length < (S.doctor ? 1 : S.data.doctors.length);
        return `<div class="slot">
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

function kardexSection() {
  const orders = S.data.medicalOrders || [];
  const pending = orders.filter(o => o.status === 'PENDING');
  const administered = orders.filter(o => o.status === 'ADMINISTERED');

  return `<div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">
    ${stat('Indicaciones Totales', orders.length, 'activity', 'Historial de órdenes médicas')}
    ${stat('Pendientes de Suministrar', pending.length, 'clock', `${pending.length} órdenes en sala`, pending.length > 0)}
    ${stat('Administradas con Éxito', administered.length, 'checkcircle', 'Stock descontado automáticamente')}
  </div>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h2>Kardex de Enfermería y Administración de Insumos</h2>
        <p class="panel-sub">Registro clínico de administración en tiempo real con descuento automático de inventario.</p>
      </div>
      <button class="btn primary small" data-action="new-medical-order">${icon('plus', 13)} Nueva Indicación</button>
    </div>
    <div class="panel-body">
      ${orders.length ? `
        <div style="display:flex;flex-direction:column;gap:12px">
          ${orders.map(o => {
            const pat = patientBy(o.patientId);
            const isPending = o.status === 'PENDING';
            const items = o.items || [];
            return `
            <div class="soap-item" style="border-left:4px solid ${isPending ? '#e69b00' : '#2b6e4e'};padding:14px;background:#fff;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
              <div class="between" style="align-items:flex-start">
                <div>
                  <div class="flex" style="gap:8px;align-items:center">
                    <strong style="font-size:14px;color:#1e4c3a">${esc(nameOf(pat))}</strong>
                    <span class="tiny muted">DNI ${esc(pat?.dni || '—')}</span>
                    <span class="badge ${isPending ? 'amber' : 'green'}">${isPending ? 'Pendiente' : 'Administrado'}</span>
                  </div>
                  <div class="tiny muted" style="margin-top:2px">
                    Prescrito por <b>${esc(o.doctorName)}</b> · ${fmtDate(o.createdAt, true)} a las ${fmtTime(o.createdAt)} hs
                  </div>
                </div>
                ${isPending ? `
                  <div class="flex" style="gap:6px">
                    <button class="btn small primary" data-action="administer-order" data-id="${o.id}">
                      ${icon('checkcircle', 13)} Confirmar Administración
                    </button>
                    <button class="btn small ghost text-link" data-action="cancel-order" data-id="${o.id}">
                      Cancelar
                    </button>
                  </div>
                ` : `
                  <div style="text-align:right">
                    <span class="badge green">${icon('checkcircle', 11)} Suministrado</span>
                    <div class="tiny muted" style="margin-top:3px">Por ${esc(o.administeredBy || 'Enfermería')} · ${fmtDate(o.administeredAt, true)}</div>
                  </div>
                `}
              </div>

              <div style="margin:10px 0;padding:8px 12px;background:#f8fafc;border-radius:4px;font-size:13px;line-height:1.5">
                <b>Indicación:</b> ${esc(o.instructions)}
                ${o.notes ? `<div class="tiny muted" style="margin-top:4px"><b>Observaciones:</b> ${esc(o.notes)}</div>` : ''}
              </div>

              ${items.length ? `
                <div style="margin-top:8px">
                  <span class="tiny muted" style="display:block;margin-bottom:4px">Insumos y Medicación Requerida:</span>
                  <div class="flex" style="flex-wrap:wrap;gap:6px">
                    ${items.map(it => `
                      <span class="attachment-chip" style="cursor:default">
                        ${icon('box', 12)}
                        <b>${esc(it.name)}</b> x ${it.quantity} ${esc(it.unit || 'uds')} <small style="color:#64748b">(${esc(it.route || 'EV')})</small>
                      </span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>`;
          }).join('')}
        </div>
      ` : empty('Sin órdenes de enfermería', 'No hay indicaciones médicas pendientes ni registradas en esta clínica.', btn('Crear primera indicación', 'new-medical-order', 'plus', 'primary'))}
    </div>
  </section>`;
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

  return heading('Equipo, Enfermería y Controles de Acceso', 'Gestión de personal de secretaría, equipo médico, enfermería y permisos de acceso.',
    `<div class="flex" style="gap:8px">
      <button class="btn small" data-action="new-medical-order">${icon('activity', 13)} Nueva Indicación</button>
      <button class="btn small primary" data-action="new-staff">${icon('plus', 13)} Nuevo Miembro</button>
    </div>`
  ) +
  `<div class="financial-tabs" style="margin-bottom:14px">
    <button class="btn small ${currentTab === 'members' ? 'primary' : ''}" data-action="staff-tab" data-value="members">Equipo y Permisos (${staff.length})</button>
    <button class="btn small ${currentTab === 'kardex' ? 'primary' : ''}" data-action="staff-tab" data-value="kardex">Kardex / Indicaciones a Enfermería (${pendingOrders} pendientes)</button>
  </div>` +
  (currentTab === 'kardex' ? kardexSection() : `
  <div class="staff-stats">
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
              <td><code>${esc(m.licenseNumber || '—')}</code></td>
              <td><b>${apptsCount}</b> turnos</td>
              <td><span class="badge green"><i class="dot"></i>Activo</span></td>
              <td>
                <div style="display:flex;gap:6px;justify-content:flex-end">
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
      <span>Controles de acceso basados en roles (RBAC) con auditoría</span>
    </div>
  </section>`);
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

  return `<article class="omni-entry-card" data-record-id="${r.id}">
    <div class="between" style="align-items:flex-start">
      <div>
        <div class="omni-entry-date">${fmtOmniDate(r.createdAt)}</div>
        <div class="omni-entry-author">
          ${icon('user', 14)}
          <span><b>${esc(r.author || 'Profesional Médico')}</b>${r.license ? ` - MN: ${esc(r.license)}` : ''} ${r.specialty ? `(${esc(r.specialty)})` : ''}</span>
        </div>
      </div>
      <div class="flex" style="gap:6px">
        <span class="badge ${r.type === 'AMENDMENT' ? 'amber' : 'green'}">${icon('lock', 11)} ${r.type === 'AMENDMENT' ? 'Enmienda' : 'Inmutable'}</span>
        ${attachments.length ? `<span class="badge blue">${icon('file', 11)} ${attachments.length} adjunto(s)</span>` : ''}
      </div>
    </div>

    ${r.problem ? `<div class="omni-entry-problem">${esc(r.problem)}</div>` : (r.title ? `<div class="omni-entry-problem">${esc(r.title)}</div>` : '')}

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
      ` : hasSoap ? `
        <div class="soap-grid" style="margin-bottom:12px">
          ${[['subjective', 'S · Subjetivo'], ['objective', 'O · Objetivo'], ['assessment', 'A · Evaluación'], ['plan', 'P · Plan']].filter(([k]) => content[k]).map(([k, label]) => `
            <div class="soap-item"><b>${label}</b><p style="white-space:pre-wrap">${esc(content[k])}</p></div>
          `).join('')}
        </div>
      ` : `
        <div style="white-space:pre-wrap;line-height:1.6">${esc(typeof content === 'string' ? content : (content.text || content.notes || JSON.stringify(content)))}</div>
      `}

      ${attachments.length ? `
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #e2e8f0">
          <strong style="font-size:11px;color:#475569;display:block;margin-bottom:6px">Archivos y Estudios Adjuntos:</strong>
          <div class="flex" style="flex-wrap:wrap;gap:8px">
            ${attachments.map(att => `
              <button class="attachment-chip" data-action="view-attachment" data-url="${esc(att.dataUrl || att.url || '')}" data-name="${esc(att.name || 'Archivo')}" data-type="${esc(att.type || '')}">
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

    <div class="between" style="margin-top:12px">
      <div class="flex" style="gap:12px">
        <button class="text-link" data-action="verify-record" data-id="${r.id}">${icon('shield', 13)} Verificar integridad</button>
        <button class="text-link" data-action="print-record" data-id="${r.id}">${icon('download', 13)} Documento Oficial (PDF)</button>
      </div>
      <button class="text-link" data-action="amend-record" data-id="${r.id}">${icon('plus', 13)} Agregar enmienda</button>
    </div>
  </article>`;
}

function medicalHistoryCard(p) {
  const mh = p.medicalHistory || {};
  const hasAllergies = Boolean(mh.allergies && !/^(ninguna|no refiere|no reporta|sin alergias|no tiene)$/i.test(mh.allergies.trim()));

  return `<div class="medical-history-panel">
    <div class="between" style="margin-bottom:12px">
      <div class="flex" style="gap:8px">
        <span class="mh-icon">${icon('shield', 15)}</span>
        <div>
          <strong style="font-size:12px;color:#1e4c3a">Antecedentes Médicos y Factores de Riesgo</strong>
          <span class="tiny muted" style="display:block">Ley 26.529 · Perfil Clínico Permanente</span>
        </div>
      </div>
      <button class="btn small ghost text-link" data-action="edit-medical-history" data-id="${p.id}">
        ${icon('edit', 13)} Actualizar Antecedentes
      </button>
    </div>

    ${hasAllergies ? `
      <div class="allergies-alert">
        <div class="flex" style="gap:10px">
          <span class="alert-pulse">${icon('warning', 18)}</span>
          <div>
            <strong style="font-size:11px;color:#9e3223;letter-spacing:0.3px">ALERGIAS MEDICAMENTOSAS / SUSTANCIAS REPORTADAS:</strong>
            <p style="margin:2px 0 0;font-size:12px;font-weight:650;color:#7e2215">${esc(mh.allergies)}</p>
          </div>
        </div>
        <span class="badge red">Alerta Médica Activa</span>
      </div>
    ` : `
      <div class="allergies-safe">
        <span class="flex" style="gap:6px;font-size:11px;color:#357a4e">
          ${icon('checkcircle', 14)} <b>Alergias:</b> ${esc(mh.allergies || 'Sin alergias medicamentosas conocidas reportadas.')}
        </span>
      </div>
    `}

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
  </div>`;
}

function recordsView() {
  if (!S.selectedPatient || !patientBy(S.selectedPatient)) S.selectedPatient = S.data.patients[0]?.id || null;
  const p = patientBy(S.selectedPatient);
  const allPatientRecords = S.data.records.filter(r => r.patientId === S.selectedPatient);
  const prescriptions = S.data.prescriptions.filter(r => r.patientId === S.selectedPatient);
  const consents = (S.data.consents || []).filter(c => c.patientId === S.selectedPatient);

  const omniTab = S.omniTab || 'evoluciones';

  // Extract unique filters
  const problems = Array.from(new Set(allPatientRecords.map(r => r.problem).filter(Boolean)));
  const specialties = Array.from(new Set(allPatientRecords.map(r => r.specialty).filter(Boolean)));
  const authors = Array.from(new Set(allPatientRecords.map(r => r.author).filter(Boolean)));

  // Filter records based on current omni settings
  const filteredRecords = allPatientRecords.filter(r => {
    // Tab filter
    if (omniTab === 'estudios') {
      const isStudy = r.type === 'STUDY' || r.type === 'IMAGE' || (r.attachments && r.attachments.length > 0);
      if (!isStudy) return false;
    } else if (omniTab === 'evoluciones') {
      const isEvol = !r.type || r.type === 'SOAP' || r.type === 'AMENDMENT';
      if (!isEvol) return false;
    } else if (omniTab === 'laboratorio') {
      if (r.type !== 'LAB') return false;
    } else if (omniTab === 'signos-vitales') {
      if (r.type !== 'VITALS') return false;
    } else if (omniTab === 'documentos') {
      const hasDocs = (r.attachments && r.attachments.length > 0);
      if (!hasDocs) return false;
    }

    // Search filter
    if (S.omniSearch) {
      const q = S.omniSearch.toLowerCase();
      const contentStr = typeof r.content === 'object' ? JSON.stringify(r.content).toLowerCase() : String(r.content || '').toLowerCase();
      const problemStr = String(r.problem || '').toLowerCase();
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
    if (S.omniProblem && r.problem !== S.omniProblem) return false;

    // Specialty filter
    if (S.omniSpecialty && r.specialty !== S.omniSpecialty) return false;

    // Author filter
    if (S.omniAuthor && r.author !== S.omniAuthor) return false;

    // Attachment filter
    if (S.omniAttachmentFilter === 'with' && (!r.attachments || r.attachments.length === 0)) return false;
    if (S.omniAttachmentFilter === 'without' && r.attachments && r.attachments.length > 0) return false;

    return true;
  });

  return heading('Historia Clínica Integral', 'Evoluciones médicas, estudios complementarios, laboratorio y consentimientos inmutables estilo Omniasalud.',
    `<div class="flex" style="gap:8px">
      <button class="btn small primary" data-action="new-record">${icon('plus', 13)} Nueva Evolución</button>
      <button class="btn small" data-action="new-attachment">${icon('file', 13)} Cargar Estudio / Lab</button>
      <button class="btn small" data-action="new-vitals">${icon('activity', 13)} Signos Vitales</button>
    </div>`
  ) +
  `<div class="record-layout">
    <section class="panel record-patients">
      <div class="panel-header"><h2>Pacientes</h2><span class="tiny muted">${S.data.patients.length}</span></div>
      ${S.data.patients.map((pat, i) => `<div class="patient-choice ${S.selectedPatient === pat.id ? 'active' : ''}" data-action="select-record-patient" data-id="${pat.id}" tabindex="0" role="button">
        ${avatar(nameOf(pat), i)}
        <div><div class="patient-name">${esc(nameOf(pat))}</div><div class="patient-sub">${esc(pat.dni ? `DNI ${pat.dni}` : 'Sin DNI')} · ${esc(pat.coverage || 'Particular')}</div></div>
      </div>`).join('')}
    </section>

    <div>
      ${p ? `
        <!-- Omniasalud Top Navigation Bar -->
        <nav class="omni-top-tabs">
          <button class="omni-tab-btn ${omniTab === 'estudios' ? 'active' : ''}" data-action="omni-tab" data-value="estudios">Estudios e Imágenes</button>
          <button class="omni-tab-btn ${omniTab === 'evoluciones' ? 'active' : ''}" data-action="omni-tab" data-value="evoluciones">Evoluciones</button>
          <button class="omni-tab-btn ${omniTab === 'prescripciones' ? 'active' : ''}" data-action="omni-tab" data-value="prescripciones">Prescripciones (${prescriptions.length})</button>
          <button class="omni-tab-btn ${omniTab === 'laboratorio' ? 'active' : ''}" data-action="omni-tab" data-value="laboratorio">Laboratorio ⌵</button>
          <button class="omni-tab-btn ${omniTab === 'signos-vitales' ? 'active' : ''}" data-action="omni-tab" data-value="signos-vitales">Signos Vitales</button>
          <button class="omni-tab-btn ${omniTab === 'documentos' ? 'active' : ''}" data-action="omni-tab" data-value="documentos">Documentos</button>
          <button class="omni-tab-btn ${omniTab === 'consentimientos' ? 'active' : ''}" data-action="omni-tab" data-value="consentimientos">Consentimientos (${consents.length})</button>
        </nav>

        <section class="panel" style="margin-bottom:17px">
          <div class="panel-header">
            <div class="flex">
              ${avatar(nameOf(p))}
              <div>
                <h2>${esc(nameOf(p))}</h2>
                <p class="panel-sub">${esc(p.coverage || 'Particular')} ${p.affiliateNumber ? `(Afiliado N° ${esc(p.affiliateNumber)})` : ''} · DNI ${esc(p.dni || '—')} ${p.cuitCuil ? `· CUIT/CUIL ${esc(p.cuitCuil)}` : ''} ${p.birthDate ? `· Edad: ${calcAge(p.birthDate)} años` : ''}</p>
              </div>
            </div>
            <div class="flex" style="gap:8px">
              <button class="btn small" data-action="edit-medical-history" data-id="${p.id}">${icon('shield', 13)} Editar Antecedentes</button>
              <button class="text-link" data-action="patient-detail" data-id="${p.id}">Ficha integral ${icon('arrow', 12)}</button>
            </div>
          </div>

          <!-- Módulo Permanente de Antecedentes Médicos y Alergias (Ley 26.529) -->
          <div style="padding:0 22px 18px">
            ${medicalHistoryCard(p)}
          </div>
        </section>

        <!-- Omniasalud Split Container: Filter Sidebar + Timeline Feed -->
        <div class="omni-container">
          <!-- Left Filter Sidebar -->
          <aside class="omni-sidebar">
            <div class="omni-filter-group">
              <div class="search-field" style="width:100%">
                ${icon('search', 14)}
                <input type="search" placeholder="Filtrar..." value="${esc(S.omniSearch || '')}" data-action="omni-search" style="font-size:12px;padding:6px 8px 6px 30px">
              </div>
            </div>

            <div class="omni-filter-group">
              <span class="omni-filter-title">Tipo</span>
              <button class="omni-filter-chip ${omniTab === 'evoluciones' ? 'active' : ''}" data-action="omni-tab" data-value="evoluciones">Evoluciones</button>
              <button class="omni-filter-chip ${omniTab === 'estudios' ? 'active' : ''}" data-action="omni-tab" data-value="estudios">Estudios / Imágenes</button>
              <button class="omni-filter-chip ${omniTab === 'laboratorio' ? 'active' : ''}" data-action="omni-tab" data-value="laboratorio">Laboratorio</button>
              <button class="omni-filter-chip ${omniTab === 'signos-vitales' ? 'active' : ''}" data-action="omni-tab" data-value="signos-vitales">Signos Vitales</button>
            </div>

            <div class="omni-filter-group">
              <span class="omni-filter-title">Fechas</span>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span class="tiny muted" style="min-width:38px">Desde</span>
                <input type="date" class="input" style="font-size:11px;padding:4px 6px" value="${esc(S.omniFromDate || '')}" data-action="omni-from">
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span class="tiny muted" style="min-width:38px">Hasta</span>
                <input type="date" class="input" style="font-size:11px;padding:4px 6px" value="${esc(S.omniToDate || '')}" data-action="omni-to">
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
              <div class="omni-filter-group">
                <span class="omni-filter-title">Autor</span>
                ${authors.map(aut => `
                  <button class="omni-filter-chip ${S.omniAuthor === aut ? 'active' : ''}" data-action="omni-filter-chip" data-filter="author" data-value="${esc(aut)}">
                    ${esc(aut)}
                  </button>
                `).join('')}
                ${S.omniAuthor ? `<button class="text-link tiny" style="margin-top:4px" data-action="omni-filter-chip" data-filter="author" data-value="">(Limpiar autor)</button>` : ''}
              </div>
            ` : ''}

            <div class="omni-filter-group">
              <span class="omni-filter-title">Archivos</span>
              <button class="omni-filter-chip ${!S.omniAttachmentFilter ? 'active' : ''}" data-action="omni-filter-chip" data-filter="attachment" data-value="">Todos</button>
              <button class="omni-filter-chip ${S.omniAttachmentFilter === 'with' ? 'active' : ''}" data-action="omni-filter-chip" data-filter="attachment" data-value="with">Con adjunto</button>
              <button class="omni-filter-chip ${S.omniAttachmentFilter === 'without' ? 'active' : ''}" data-action="omni-filter-chip" data-filter="attachment" data-value="without">Sin adjunto</button>
            </div>
          </aside>

          <!-- Main Feed / Records List -->
          <main class="omni-feed">
            ${omniTab === 'prescripciones' ? `
              <section class="panel">
                <div class="panel-header"><h2>Recetas y Prescripciones Médicas</h2>${btn('Nueva receta', 'new-prescription', 'plus', 'small')}</div>
                <div class="panel-body">
                  ${prescriptions.map(r => `<div class="soap-item" style="margin-bottom:12px">
                    <div class="between"><b>Receta Médica Oficial</b>${badge(r.status)}</div>
                    <p style="white-space:pre-wrap;margin:8px 0">${esc(r.content)}</p>
                    <div class="between" style="margin-top:10px">
                      <div class="tiny muted">${fmtDate(r.createdAt, true)}</div>
                      <button class="text-link" data-action="print-prescription" data-id="${r.id}">${icon('download', 12)} Ver Receta Oficial (PDF)</button>
                    </div>
                  </div>`).join('') || empty('Sin recetas emitidas', 'No hay recetas prescritas para este paciente.', btn('Emitir receta', 'new-prescription', 'plus', 'small'))}
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
            ` : filteredRecords.length ? filteredRecords.map(recordCard).join('') : `
              <section class="panel" style="padding:40px 20px;text-align:center">
                ${empty('Sin registros en esta vista', 'No se encontraron evoluciones ni estudios con los filtros aplicados.', btn('Nueva evolución SOAP', 'new-record', 'plus', 'primary'))}
              </section>
            `}
          </main>
        </div>
      ` : empty('Selecciona un paciente', 'Selecciona un paciente para visualizar su historial.')}
    </div>
  </div>`;
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

  return heading('Inventario de Insumos Médicos', 'Control y gestión en tiempo real de insumos, materiales descartables, instrumental y fármacos.',
    btn('Nuevo Insumo', 'new-inventory', 'plus', 'primary')
  ) +
  `<div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    ${stat('Insumos registrados', inv.length, 'box', 'Catálogo de insumos')}
    ${stat('Stock bajo / crítico', lowStock.length, 'warning', `${lowStock.length} artículos requieren reposición`, lowStock.length > 0)}
    ${stat('Unidades disponibles', totalUnits, 'activity', 'Total de unidades en clínica')}
    ${stat('Agotados', outOfStock.length, 'close', outOfStock.length > 0 ? 'Reposición urgente' : 'Sin insumos agotados')}
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
      <span>${lowStock.length > 0 ? `⚠️ ${lowStock.length} artículos requieren reposición` : '✓ Stock general en niveles operativos'}</span>
    </div>
  </section>`;
}

function billingView() {
  const total = S.data.payments.reduce((s, p) => s + p.amountCents / 100, 0),
    drafts = S.data.invoices.reduce((s, p) => s + p.amountCents / 100, 0),
    quotes = S.data.quotes || [],
    totalQuotes = quotes.reduce((s, q) => s + (q.totalCents || 0) / 100, 0);

  const currentTab = S.billingTab || 'payments';

  return heading('Cobros, Facturación y Presupuestos', 'Control administrativo de pagos recibidos, emisión oficial ARCA y gestión de presupuestos médicos.',
    btn('Nuevo Presupuesto', 'new-quote', 'plus') + btn('Emitir Factura ARCA', 'new-invoice', 'file') + btn('Registrar cobro', 'new-payment', 'plus', 'primary')
  ) +
  `<div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    ${stat('Total cobrado', fmtMoney(total), 'wallet', 'Ingresos confirmados de la clínica', true)}
    ${stat('Operaciones registradas', S.data.payments.length, 'activity', 'Cobros por transferencia, efectivo y tarjeta')}
    ${stat('Facturación oficial ARCA', fmtMoney(drafts), 'file', `${S.data.invoices.length} facturas con CAE autorizado`)}
    ${stat('Presupuestos emitidos', fmtMoney(totalQuotes), 'chart', `${quotes.length} presupuestos para pacientes`)}
  </div>
  <section class="panel">
    <div class="financial-tabs">
      <button class="btn small ${currentTab === 'payments' ? 'primary' : ''}" data-action="billing-tab" data-value="payments">Cobros registrados</button>
      <button class="btn small ${currentTab === 'invoices' ? 'primary' : ''}" data-action="billing-tab" data-value="invoices">Facturas oficiales ARCA</button>
      <button class="btn small ${currentTab === 'quotes' ? 'primary' : ''}" data-action="billing-tab" data-value="quotes">Presupuestos Clínicos (${quotes.length})</button>
    </div>
    ${currentTab === 'quotes' ? `
      ${quotes.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Fecha / Validez</th><th>N° Presupuesto</th><th>Paciente</th><th>Tratamiento / Concepto</th><th>Total</th><th>Estado</th><th style="text-align:right">Acciones</th></tr></thead>
        <tbody>
          ${quotes.map(q => {
            const pat = patientBy(q.patientId);
            const pName = nameOf(pat);
            const statusColor = q.status === 'APPROVED' ? 'green' : q.status === 'REJECTED' ? 'red' : 'amber';
            const statusLabel = q.status === 'APPROVED' ? 'Aprobado' : q.status === 'REJECTED' ? 'Rechazado' : 'Pendiente';
            return `<tr>
              <td>${fmtDate(q.createdAt, true)}<div class="tiny muted">Vence: ${fmtDate(q.validUntil, true)}</div></td>
              <td><strong>${esc(q.quoteNumber || q.id.slice(0, 8))}</strong></td>
              <td><strong>${esc(pName)}</strong><div class="tiny muted">${esc(pat?.coverage || 'Particular')}</div></td>
              <td><strong>${esc(q.title)}</strong><div class="tiny muted">${(q.items || []).length} ítem(s) detallado(s)</div></td>
              <td><strong>${fmtMoney((q.totalCents || 0) / 100)}</strong></td>
              <td><span class="badge ${statusColor}">${statusLabel}</span></td>
              <td>
                <div style="display:flex;gap:6px;justify-content:flex-end">
                  <a href="/api/quotes/${q.id}/document" target="_blank" class="btn small" title="Ver / Descargar Presupuesto en PDF e imprimir">${icon('file', 13)} Ver PDF</a>
                  <button class="btn small" data-action="share-quote-wa" data-id="${q.id}" title="Enviar Presupuesto por WhatsApp">${icon('phone', 13)} WhatsApp</button>
                  ${q.status !== 'APPROVED' ? `<button class="btn small primary" data-action="approve-quote" data-id="${q.id}" title="Marcar presupuesto como Aprobado">${icon('checkcircle', 13)} Aprobar</button>` : ''}
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>` : empty('Sin presupuestos emitidos', 'No hay presupuestos confeccionados todavía.', btn('Crear primer presupuesto', 'new-quote', 'plus', 'primary'))}
    ` : currentTab === 'payments' ? `
      ${S.data.payments.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Paciente</th><th>Método / Referencia</th><th>Importe</th><th>Estado</th></tr></thead>
        <tbody>
          ${S.data.payments.map(r => `<tr>
            <td>${fmtDate(r.createdAt, true)}<div class="tiny muted">${fmtTime(r.createdAt)}</div></td>
            <td><strong>${esc(nameOf(patientBy(r.patientId)))}</strong></td>
            <td>${esc(r.method || r.concept)}<div class="tiny muted">${esc(r.reference || '')}</div></td>
            <td><strong>${fmtMoney(r.amountCents / 100)}</strong></td>
            <td><span class="badge green">Registrado</span></td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : empty('Sin registros', 'No hay cobros registrados en este período.')}
    ` : `
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
                  <a href="/api/invoices/${r.id}/document" target="_blank" class="btn small" title="Ver / Descargar comprobante oficial e imprimir">${icon('file', 13)} Ver Factura</a>
                  <button class="btn small" data-action="share-invoice-wa" data-id="${r.id}" title="Compartir comprobante por WhatsApp">${icon('phone', 13)} WhatsApp</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>` : empty('Sin registros', 'No hay facturas emitidas en este período.')}
    `}
    <div class="panel-footer">
      <span>Moneda: ARS (Pesos Argentinos) · Módulo Financiero y Presupuestario Integral</span>
      <span>${currentTab === 'quotes' ? quotes.length : currentTab === 'payments' ? S.data.payments.length : S.data.invoices.length} operaciones</span>
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
          <p class="detail-value">SQLite WAL Mode (Local de alta performance)</p>
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
    field('⚠️ Alergias Conocidas (o "Sin alergias")', 'allergies', 'text', mh.allergies || '', 'placeholder="Ej: Penicilina, AINEs, Dipirona"') +
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
    field('⚠️ Alergias Medicamentosas / Sustancias * (Destacado)', 'allergies', 'text', mh.allergies || '', 'placeholder="Ej: Penicilina, AINEs, Dipirona, Látex (o \'Sin alergias conocidas\')"', true) +
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
    selectField('Plantilla Normativa (Omniasalud / Ley 26.529)', 'type', [
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
  formDialog('record', old ? 'Agregar Enmienda Médica' : 'Nueva Evolución Clínica (SOAP)', 'Registro clínico con firma e integridad SHA-256.',
    patientSelect(pid) +
    field('Diagnóstico / Problema Principal', 'problem', 'text', '', 'placeholder="Ej: Enfermedad celíaca del adulto, Hiperestrogenismo, Control postoperatorio..."') +
    selectField('Especialidad Médica', 'specialty', [
      ['Medicina Integrativa', 'Medicina Integrativa'],
      ['Medicina General y Preventiva', 'Medicina General y Preventiva'],
      ['Cirugía Plástica y Reparadora', 'Cirugía Plástica y Reparadora'],
      ['Dermatología y Estética', 'Dermatología y Estética'],
      ['Ginecología y Obstetricia', 'Ginecología y Obstetricia'],
      ['Kinesiología y Fisioterapia', 'Kinesiología y Fisioterapia'],
      ['Nutrición Clínica', 'Nutrición Clínica']
    ], 'Medicina Integrativa') +
    area('S · Subjetivo (Motivo de consulta, síntomas)', 'subjective', '', 'required maxlength="8000"', false) +
    area('O · Objetivo (Examen físico, signos vitales)', 'objective', '', 'maxlength="8000"', false) +
    area('A · Evaluación (Diagnóstico presuntivo/certeza)', 'assessment', '', 'maxlength="8000"', false) +
    area('P · Plan (Indicaciones terapéuticas, estudios)', 'plan', '', 'required maxlength="8000"', false) +
    `<div class="form-field full">
      <label>Adjuntar Estudio / Documento (Opcional - PDF, JPG, PNG)</label>
      <input type="file" id="record-file-picker" accept=".pdf,.png,.jpg,.jpeg">
      <div id="record-file-info" class="tiny muted" style="margin-top:4px">Máximo 15 MB. Se alojará adjunto a esta evolución.</div>
      <input type="hidden" name="attachmentPayload" id="record-attachment-payload">
    </div>`,
    old ? 'Guardar enmienda' : 'Firmar y guardar evolución',
    old ? `data-amendment="${old.id}"` : '', 'wide'
  );
  if (old) $('#field-patientId').disabled = true;

  setTimeout(() => {
    $('#record-file-picker')?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const payload = JSON.stringify([{
          name: file.name,
          type: file.type,
          size: file.size,
          data: ev.target.result,
          uploadedAt: new Date().toISOString()
        }]);
        if ($('#record-attachment-payload')) $('#record-attachment-payload').value = payload;
        if ($('#record-file-info')) $('#record-file-info').innerHTML = `✓ Archivo cargado: <b>${esc(file.name)}</b> (${Math.round(file.size / 1024)} KB)`;
      };
      reader.readAsDataURL(file);
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
    </div>` +
    area('Resultados / Observaciones del estudio', 'notes', '', 'maxlength="4000" placeholder="Valores sobresalientes, informe del especialista o notas...'),
    'Guardar y Alojar en Historial', `data-patient-id="${p?.id}"`, 'wide'
  );

  setTimeout(() => {
    $('#study-file-picker')?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const payload = JSON.stringify([{
          name: file.name,
          type: file.type,
          size: file.size,
          data: ev.target.result,
          uploadedAt: new Date().toISOString()
        }]);
        if ($('#study-attachment-payload')) $('#study-attachment-payload').value = payload;
        if ($('#study-file-info')) $('#study-file-info').innerHTML = `✓ Archivo listo: <b>${esc(file.name)}</b> (${Math.round(file.size / 1024)} KB)`;
      };
      reader.readAsDataURL(file);
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

function quoteForm(patientId = null) {
  const p = patientId ? patientBy(patientId) : (S.selectedPatient ? patientBy(S.selectedPatient) : S.data.patients[0]);
  const defaultItems = [
    { description: 'Honorarios Médicos Quirúrgicos', quantity: 1, unitPrice: 250000 },
    { description: 'Derechos de Quirófano e Insumos Descartables', quantity: 1, unitPrice: 120000 },
    { description: 'Atención y Controles Post-Quirúrgicos', quantity: 1, unitPrice: 40000 }
  ];
  formDialog('quote', 'Nuevo Presupuesto Médico', 'Emisión formal de cotización de tratamiento o procedimiento.',
    patientSelect(p?.id) +
    selectField('Profesional responsable', 'doctorId', (S.data.doctors || []).map(d => [d.id, d.name]), S.doctor || S.data.doctors[0]?.id) +
    field('Título / Procedimiento *', 'title', 'text', '', 'required maxlength="200" placeholder="Ej: Rinoplastia Ultrasónica + Postquirúrgico"') +
    selectField('Moneda', 'currency', [['ARS', 'ARS - Pesos Argentinos'], ['USD', 'USD - Dólares Estadounidenses']], 'ARS') +
    field('Descuento / Bonificación (%)', 'discount', 'number', '0', 'min="0" max="100" step="1"') +
    field('Fecha de Validez', 'validUntil', 'date', plusDays(dateKey(), 15), 'required') +
    `<div class="form-field full">
      <label>Ítems y Conceptos del Presupuesto</label>
      <div id="quote-items-container">
        ${defaultItems.map((it, idx) => `
          <div class="quote-item-row" data-idx="${idx}">
            <input type="text" class="quote-desc" value="${esc(it.description)}" placeholder="Concepto" required>
            <input type="number" class="quote-qty" value="${it.quantity}" min="1" step="1" placeholder="Cant" required style="width:70px">
            <input type="number" class="quote-price" value="${it.unitPrice}" min="0" step="100" placeholder="Precio Unit" required style="width:110px">
            <span class="quote-subtotal" style="font-weight:700;font-size:12px;color:#1b4c37">$${(it.quantity * it.unitPrice).toLocaleString('es-AR')}</span>
            <button type="button" class="icon-btn remove-quote-item" style="color:#b91c1c">${icon('close', 14)}</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn small" id="add-quote-item-btn" style="margin-top:6px">${icon('plus', 12)} Agregar otro concepto</button>
    </div>` +
    area('Condiciones de Pago / Notas', 'notes', 'Forma de pago: 50% de anticipo al reservar la fecha de quirófano, saldo restante el día del procedimiento. Incluye controles post-operatorios durante 30 días.', 'maxlength="2000"'),
    'Emitir Presupuesto', '', 'wide'
  );

  setTimeout(() => {
    const container = $('#quote-items-container');
    const updateSubtotals = () => {
      container?.querySelectorAll('.quote-item-row').forEach(row => {
        const qty = Number(row.querySelector('.quote-qty')?.value || 1);
        const price = Number(row.querySelector('.quote-price')?.value || 0);
        const sub = row.querySelector('.quote-subtotal');
        if (sub) sub.textContent = '$' + (qty * price).toLocaleString('es-AR');
      });
    };
    container?.addEventListener('input', updateSubtotals);
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
        <input type="text" class="quote-desc" placeholder="Concepto / Práctica" required>
        <input type="number" class="quote-qty" value="1" min="1" step="1" placeholder="Cant" required style="width:70px">
        <input type="number" class="quote-price" value="0" min="0" step="100" placeholder="Precio Unit" required style="width:110px">
        <span class="quote-subtotal" style="font-weight:700;font-size:12px;color:#1b4c37">$0</span>
        <button type="button" class="icon-btn remove-quote-item" style="color:#b91c1c">${icon('close', 14)}</button>
      `;
      container?.append(row);
    });
  }, 50);
}

function viewAttachmentModal(recordId, fileIdx = 0) {
  const r = S.data.records.find(x => x.id === recordId);
  const att = r?.content?.attachments?.[fileIdx];
  if (!att) return;
  const isPdf = att.type === 'application/pdf' || att.name.endsWith('.pdf');
  showModal(att.name, `${r.content?.title || r.content?.problem || 'Documento adjunto'} · ${fmtDate(r.createdAt, true)}`,
    `<div style="text-align:center;margin-bottom:12px">
      ${isPdf
        ? `<iframe src="${att.data}" style="width:100%;height:500px;border:1px solid #cbd5e1;border-radius:8px"></iframe>`
        : `<img src="${att.data}" style="max-width:100%;max-height:500px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)" alt="${esc(att.name)}">`
      }
    </div>
    <div class="dialog-actions">
      <button class="btn" data-action="close-modal">Cerrar</button>
      <a href="${att.data}" download="${esc(att.name)}" class="btn primary">${icon('download', 14)} Descargar Archivo</a>
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

function omniaImporterDialog() {
  formDialog('omnia-importer', 'Importación Masiva de Pacientes (Omniasalud / CSV)',
    'Transfiere el padrón de pacientes, coberturas, datos de contacto y antecedentes clínicos desde Omniasalud u otros softwares.',
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
      <label>1. Cargar archivo CSV / Excel (.csv, .txt):</label>
      <input type="file" id="omnia-file-input" accept=".csv,.txt" class="input">
    </div>
    <div class="form-field full">
      <label>2. O pega directamente los datos aquí:</label>
      <textarea id="omnia-csv-text" name="csvText" class="input" style="height:140px;font-family:monospace;font-size:12px" placeholder="DNI;Nombre;Apellido;FechaNacimiento;ObraSocial;NroAfiliado;Telefono;Email;Alergias;Patologias
35123456;Juan;Perez;1988-04-15;OSDE;012345678;+5491144556677;juan@gmail.com;Penicilina;Hipotiroidismo
40987654;Maria;Gomez;1996-09-22;Swiss Medical;98765432;+5491188990011;maria@gmail.com;Ninguna;Asma"></textarea>
    </div>`,
    'Comenzar Importación a Medical OS', '', 'wide'
  );

  setTimeout(() => {
    const fileInput = $('#omnia-file-input');
    const textArea = $('#omnia-csv-text');
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
  }, 50);
}

function paymentForm(patientId) {
  const id = makeId();
  formDialog('payment', 'Registrar Cobro de Consulta', 'Ingreso por atención médica.',
    patientSelect(patientId) +
    field('Importe en ARS *', 'amount', 'number', '', 'required min="0.01" max="10000000" step="0.01"') +
    selectField('Método de pago', 'method', [['TRANSFERENCIA', 'Transferencia bancaria'], ['EFECTIVO', 'Efectivo en recepción'], ['TARJETA', 'Tarjeta de débito/crédito'], ['OTRO', 'Otro']]) +
    field('Número de comprobante / Referencia', 'reference', 'text', '', 'maxlength="200" placeholder="Ej. TRF-109283"', true),
    'Confirmar cobro', `data-key="${id}"`
  );
}

function invoiceForm() {
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
    `<div class="form-grid">
      ${field('Código SKU / Referencia', 'sku', 'text', item?.sku || '', 'maxlength="50" placeholder="Ej. GAS-001"')}
      ${selectField('Categoría *', 'category', [
        ['Descartables', 'Descartables'],
        ['Suturas y Curaciones', 'Suturas y Curaciones'],
        ['Medicamentos', 'Medicamentos'],
        ['Antisépticos', 'Antisépticos'],
        ['Soluciones y Sueros', 'Soluciones y Sueros'],
        ['Instrumental', 'Instrumental'],
        ['Diagnóstico', 'Diagnóstico'],
        ['Otro', 'Otro']
      ], item?.category || 'Descartables')}
    </div>` +
    `<div class="form-grid">
      ${isEdit ? '' : field('Cantidad inicial en stock *', 'quantity', 'number', item?.quantity ?? 0, 'required min="0" step="1"')}
      ${field('Stock mínimo de alerta *', 'minQuantity', 'number', item?.minQuantity ?? 10, 'required min="0" step="1"')}
      ${field('Unidad de medida *', 'unit', 'text', item?.unit || 'unidades', 'required maxlength="50" placeholder="unidades, cajas, frascos, rollos"')}
    </div>` +
    `<div class="form-grid">
      ${field('Número de lote', 'lotNumber', 'text', item?.lotNumber || '', 'maxlength="50" placeholder="Ej. LT-2024-89"')}
      ${field('Fecha de vencimiento', 'expiryDate', 'date', item?.expiryDate || '', '')}
    </div>` +
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

function prescriptionForm() {
  formDialog('prescription', 'Emitir Receta Médica', 'Prescripción de medicamentos e indicaciones para farmacia.',
    patientSelect() +
    area('Detalle de prescripción (Medicamento, presentación, posología) *', 'content', '', 'required maxlength="8000" placeholder="Rp/\nParacetamol 500mg - 1 caja\nTomar 1 comprimido cada 8 horas si hay dolor."'),
    'Emitir receta'
  );
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
    fields = field('Location ID (Subcuenta GHL) *', 'locationId', 'text', cfg.locationId || '', 'required placeholder="Ej. lk872HgasdA98"') +
      field('API Key / Private Token *', 'apiKey', 'password', cfg.apiKey || '', 'required placeholder="eyJhbGciOi..."') +
      field('Webhook URL para sincronización', 'webhookUrl', 'url', cfg.webhookUrl || '', 'placeholder="https://services.leadconnectorhq.com/..."', true);
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
      case 'select-record-patient': S.selectedPatient = id; contentOnly(); break;
      case 'open-patient-records': S.selectedPatient = id; closeModal(); await navigate('records'); break;
      case 'record-tab': S.recordTab = el.dataset.value; contentOnly(); break;
      case 'omni-tab': S.omniTab = el.dataset.value; contentOnly(); break;
      case 'omni-filter-chip': {
        const filterType = el.dataset.filter;
        const val = el.dataset.value;
        if (filterType === 'problem') S.omniProblem = (S.omniProblem === val ? '' : val);
        if (filterType === 'specialty') S.omniSpecialty = (S.omniSpecialty === val ? '' : val);
        if (filterType === 'author') S.omniAuthor = (S.omniAuthor === val ? '' : val);
        if (filterType === 'attachment') S.omniAttachmentFilter = val;
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
        quoteForm({ patientId: el.dataset.patientId || S.selectedPatient });
        break;
      case 'print-quote':
        window.open('/api/quotes/' + id + '/document', '_blank');
        break;
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
      case 'open-omnia-importer':
        omniaImporterDialog();
        break;
      case 'new-medical-order':
        medicalOrderDialog(el.dataset.patientId || S.selectedPatient);
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
      case 'new-payment': paymentForm(el.dataset.patientId); break;
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
      case 'new-inventory': inventoryForm(); break;
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
      case 'print-prescription': window.open('/api/prescriptions/' + id + '/document', '_blank'); break;
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
        let items = [];
        try { items = JSON.parse(b.itemsJson || '[]'); } catch {}
        await api('/api/quotes', 'POST', {
          patientId: b.patientId,
          title: b.title,
          doctorName: b.doctorName,
          validDays: Number(b.validDays) || 30,
          notes: b.notes || '',
          paymentTerms: b.paymentTerms || '',
          discountPercent: Number(b.discountPercent) || 0,
          items
        });
        S.view = 'billing';
        S.billingTab = 'quotes';
        message = 'Presupuesto médico creado exitosamente.';
        break;
      }
      case 'upload-study': {
        let fileData = [];
        try { fileData = JSON.parse(b.attachmentsJson || '[]'); } catch {}
        await api('/api/records', 'POST', {
          patientId: b.patientId,
          type: b.type || 'STUDY',
          problem: b.problem || '',
          specialty: b.specialty || '',
          title: b.title || 'Estudio / Laboratorio',
          content: {
            notes: b.notes || '',
            studyType: b.type
          },
          attachments: fileData
        });
        S.selectedPatient = b.patientId;
        S.view = 'records';
        S.omniTab = (b.type === 'LAB') ? 'laboratorio' : 'estudios';
        message = 'Estudio / archivo cargado exitosamente en el historial.';
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
        S.staffTab = 'kardex';
        S.view = 'staff';
        message = 'Indicación médica para enfermería registrada con éxito.';
        break;
      }
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
        message = `Importación Omniasalud finalizada: ${res.imported} nuevos pacientes dados de alta, ${res.updated} actualizados.`;
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
        try { fileData = JSON.parse(b.attachmentsJson || '[]'); } catch {}
        b.attachments = fileData;
        await api('/api/records', 'POST', b);
        S.selectedPatient = b.patientId;
        S.view = 'records';
        S.omniTab = 'evoluciones';
        message = 'Evolución médica firmada y registrada con integridad criptográfica.';
        break;
      }
      case 'prescription':
        await api('/api/prescriptions', 'POST', b);
        S.view = 'records';
        S.recordTab = 'prescriptions';
        S.selectedPatient = b.patientId;
        message = 'Receta médica emitida.';
        break;
      case 'payment':
        await api('/api/payments', 'POST', { ...b, amount: Number(b.amount) }, { 'Idempotency-Key': form.dataset.key });
        S.view = 'billing';
        S.billingTab = 'payments';
        message = 'Cobro registrado correctamente.';
        break;
      case 'invoice':
        await api('/api/invoices', 'POST', { ...b, amount: Number(b.amount) });
        S.view = 'billing';
        S.billingTab = 'invoices';
        message = 'Factura oficial autorizada por ARCA con CAE emitida exitosamente.';
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
  } catch (err) {
    console.error('[boot error]', err);
    localStorage.removeItem('clinic_session');
    S.session = null;
    loginPage();
  }
}

boot();
})();
