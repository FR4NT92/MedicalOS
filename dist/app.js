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
  NOT_CONNECTED: ['Sin conectar', 'gray']
};

const types = {
  CONSULTATION: 'Primera consulta',
  FOLLOW_UP: 'Control',
  PROCEDURE: 'Procedimiento',
  SURGERY: 'Cirugía'
};

const auditLabels = {
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
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
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

const S = {
  session: null,
  data: null,
  admin: null,
  view: 'home',
  date: dateKey(),
  calendar: 'day',
  doctor: '',
  patientSearch: '',
  patientStatus: '',
  selectedPatient: null,
  homeFilter: 'all',
  billingTab: 'payments',
  inventoryCategory: 'ALL',
  inventorySearch: '',
  mobile: false,
  chat: [],
  recordTab: 'notes',
  agendaCollapsed: false,
  supportMode: null,
  preview: PREVIEW
};

async function api(path, method = 'GET', body = null, headers = {}) {
  if (PREVIEW) return window.PREVIEW_API(path, method, body, headers);
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
  let data;
  try {
    data = await r.json();
  } catch {
    throw Error('Respuesta inválida del servidor.');
  }
  if (!r.ok) {
    const error = Error(data.error || 'No se pudo completar la operación.');
    error.status = r.status;
    error.code = data.code;
    throw error;
  }
  return data;
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

function brand() {
  return `<div class="brand"><div class="brandmark">+</div><div class="brand-text"><div class="brand-name">abundance<span style="color:#a8c08d">.</span></div><div class="brand-sub">Clinic OS</div></div></div>`;
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
                navItem('patients', 'users')
              : navItem('admin', 'building') + navItem('integrations', 'plug') + navItem('audit', 'activity') + navItem('settings', 'settings')
            )
          : navItem('home', 'home') +
            navItem('schedule', 'calendar', activeDay().length) +
            navItem('patients', 'users') +
            navItem('pipeline', 'pipeline', (d?.leads || []).filter(l => l.status === 'NEW').length) +
            navItem('records', 'file') +
            navItem('inventory', 'box', (d?.inventory || []).filter(i => i.quantity <= i.minQuantity).length) +
            navItem('billing', 'wallet') +
            navItem('analytics', 'chart')
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
  return heading('Directorio de Pacientes', 'Fichas integrales de pacientes, historial de atenciones y datos de cobertura.', btn('Exportar CSV', 'export-patients', 'download') + btn('Nuevo paciente', 'new-patient', 'plus', 'primary')) +
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
      <thead><tr><th>Paciente</th><th>Contacto</th><th>Documento</th><th>Cobertura</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${p.map((p, i) => `<tr class="clickable" data-action="patient-detail" data-id="${p.id}">
          <td><div class="initials-cell">${avatar(nameOf(p), i)}<div><strong>${esc(nameOf(p))}</strong></div></div></td>
          <td>${esc(p.phone)}<div class="tiny muted">${esc(p.email || 'Sin correo')}</div></td>
          <td>${esc(p.dni || '—')}</td>
          <td>${esc(p.coverage)}</td>
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
  const chosen = S.data.appointments.filter(a => dateKey(a.startAt) === S.date && (!S.doctor || a.doctorId === S.doctor)).sort((a, b) => a.startAt.localeCompare(b.startAt));
  let day = '';
  if (S.calendar === 'day') {
    const keys = new Set(Array.from({ length: 18 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`));
    for (const a of chosen) keys.add(fmtTime(a.startAt));
    day = [...keys].sort().map(t => {
      const active = chosen.filter(a => fmtTime(a.startAt) === t && a.status !== 'CANCELLED');
      const busy = chosen.filter(a => a.status !== 'CANCELLED' && a.startAt <= localAt(S.date, t) && a.endAt > localAt(S.date, t));
      const canBook = busy.length < (S.doctor ? 1 : S.data.doctors.length);
      return `<div class="slot">
        <span class="slot-time">${t}</span>
        <div class="slot-content">
          ${active.map(a => `<button class="slot-booking" data-action="appointment-detail" data-id="${a.id}">
            ${avatar(nameOf(patientBy(a.patientId)))}
            <span class="grow" style="text-align:left">
              <span class="patient-name">${esc(nameOf(patientBy(a.patientId)))}</span>
              <span class="patient-sub" style="display:block">${esc(types[a.type])} · ${esc(doctorBy(a.doctorId)?.name)}</span>
            </span>
            ${badge(a.status)}
          </button>`).join('')}
          ${canBook ? `<button class="free-slot" data-action="new-appointment" data-time="${t}">${icon('plus', 12)} ${active.length || busy.length ? 'Otro profesional disponible' : 'Espacio disponible'}</button>` : ''}
        </div>
      </div>`;
    }).join('');
  } else {
    const weekday = new Date(`${S.date}T12:00:00-03:00`).getUTCDay();
    const monday = plusDays(S.date, weekday === 0 ? -6 : 1 - weekday);
    day = `<div class="week-grid">${Array.from({ length: 5 }, (_, i) => {
      const d = plusDays(monday, i),
        rows = S.data.appointments.filter(a => dateKey(a.startAt) === d && a.status !== 'CANCELLED' && (!S.doctor || a.doctorId === S.doctor)).sort((a, b) => a.startAt.localeCompare(b.startAt));
      return `<div class="week-day">
        <div class="week-heading">${esc(fmtDate(d, true))}</div>
        ${rows.map(a => `<button class="week-event" data-action="appointment-detail" data-id="${a.id}">
          <b>${fmtTime(a.startAt)}</b> · ${esc(nameOf(patientBy(a.patientId)))}
          <div class="tiny muted">${esc(types[a.type])}</div>
        </button>`).join('')}
        <button class="free-slot" style="width:100%" data-action="new-appointment" data-date="${d}">${icon('plus', 12)} Agendar</button>
      </div>`;
    }).join('')}</div>`;
  }

  return heading('Agenda Médica', 'Gestión de turnos por profesional y consultorio. Horarios en Buenos Aires (UTC−03).', btn('Nuevo turno', 'new-appointment', 'plus', 'primary')) +
  `<div class="schedule-layout">
    <section class="panel">
      <div class="toolbar between">
        <div class="date-controls">
          <button class="icon-btn" data-action="prev-date" aria-label="Día anterior">${icon('left', 15)}</button>
          <input type="date" aria-label="Fecha de la agenda" value="${S.date}" data-change="date">
          <button class="icon-btn" data-action="next-date" aria-label="Día siguiente">${icon('chevron', 15)}</button>
          ${btn('Hoy', 'today', '', 'small')}
        </div>
        <div class="segmented">
          <button data-action="calendar-mode" data-value="day" class="${S.calendar === 'day' ? 'active' : ''}">Día</button>
          <button data-action="calendar-mode" data-value="week" class="${S.calendar === 'week' ? 'active' : ''}">Semana</button>
        </div>
      </div>
      <div class="toolbar">
        <select data-change="doctor" aria-label="Filtrar por profesional">
          <option value="">Todos los profesionales</option>
          ${S.data.doctors.map(d => `<option value="${d.id}" ${S.doctor === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
        </select>
        <span class="muted tiny">${chosen.filter(a => a.status !== 'CANCELLED').length} turnos programados</span>
      </div>
      ${day}
      <div class="panel-footer">
        <span>Validación automática de superposiciones y disponibilidad</span>
        <span>${chosen.filter(a => a.status === 'CANCELLED').length} cancelados</span>
      </div>
    </section>
    <aside class="stack schedule-aside">
      <section class="panel">
        <div class="panel-header"><h2>Equipo Profesional</h2></div>
        <div class="panel-body">
          ${S.data.doctors.map((d, i) => `<div class="attention-row">${avatar(d.name, i)}<div><h4>${esc(d.name)}</h4><p>${esc(d.specialty)}</p></div></div>`).join('')}
        </div>
      </section>
      <div class="info-box">${icon('shield', 18)}<div><strong>Disponibilidad coordinada</strong><br>La agenda valida en tiempo real cruces de turnos de profesionales y pacientes.</div></div>
    </aside>
  </div>`;
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

function recordCard(r) {
  return `<article class="record-card">
    <div class="between">
      <div>
        <h3>${r.type === 'AMENDMENT' ? 'Enmienda a evolución' : 'Evolución Clínica SOAP'}</h3>
        <p class="panel-sub">${fmtDate(r.createdAt, true)} · ${fmtTime(r.createdAt)} · ${esc(r.author)}</p>
      </div>
      <span class="badge green">${icon('lock', 11)} Inmutable</span>
    </div>
    <div class="soap-grid">
      ${[['subjective', 'S · Subjetivo'], ['objective', 'O · Objetivo'], ['assessment', 'A · Evaluación'], ['plan', 'P · Plan']].map(([k, label]) => `
        <div class="soap-item"><b>${label}</b><p>${esc(r.content[k] || 'Sin registro')}</p></div>
      `).join('')}
    </div>
    <div class="record-hash">
      SHA-256 · ${esc(r.hash)}<br>
      Integridad criptográfica verificada en cadena.
    </div>
    <div class="between" style="margin-top:14px">
      <button class="text-link" data-action="verify-record" data-id="${r.id}">${icon('shield', 13)} Verificar integridad</button>
      <button class="text-link" data-action="print-record" data-id="${r.id}">${icon('download', 13)} Documento Oficial (PDF)</button>
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
  const p = patientBy(S.selectedPatient),
    records = S.data.records.filter(r => r.patientId === S.selectedPatient),
    prescriptions = S.data.prescriptions.filter(r => r.patientId === S.selectedPatient),
    consents = (S.data.consents || []).filter(c => c.patientId === S.selectedPatient);

  return heading('Historias Clínicas Electrónicas', 'Evoluciones médicas SOAP, antecedentes clínicos y consentimientos informados con trazabilidad inmutable.', btn('Nueva evolución', 'new-record', 'plus', 'primary')) +
  `<div class="record-layout">
    <section class="panel record-patients">
      <div class="panel-header"><h2>Pacientes</h2><span class="tiny muted">${S.data.patients.length}</span></div>
      ${S.data.patients.map((p, i) => `<div class="patient-choice ${S.selectedPatient === p.id ? 'active' : ''}" data-action="select-record-patient" data-id="${p.id}" tabindex="0" role="button">
        ${avatar(nameOf(p), i)}
        <div><div class="patient-name">${esc(nameOf(p))}</div><div class="patient-sub">${esc(p.dni || 'Sin documento')}</div></div>
      </div>`).join('')}
    </section>
    <div>
      ${p ? `
        <section class="panel" style="margin-bottom:17px">
          <div class="panel-header">
            <div class="flex">
              ${avatar(nameOf(p))}
              <div><h2>${esc(nameOf(p))}</h2><p class="panel-sub">${esc(p.coverage)} · DNI ${esc(p.dni || '—')}</p></div>
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

          <div class="financial-tabs">
            <button class="btn small ${(!S.recordTab || S.recordTab === 'notes') ? 'primary' : ''}" data-action="record-tab" data-value="notes">Evoluciones Médicas (${records.length})</button>
            <button class="btn small ${S.recordTab === 'prescriptions' ? 'primary' : ''}" data-action="record-tab" data-value="prescriptions">Recetas (${prescriptions.length})</button>
            <button class="btn small ${S.recordTab === 'consents' ? 'primary' : ''}" data-action="record-tab" data-value="consents">Consentimientos Informados (${consents.length})</button>
          </div>
        </section>
        ${(!S.recordTab || S.recordTab === 'notes')
          ? (records.length ? records.map(recordCard).join('') : `<section class="panel">${empty('Sin evoluciones registradas', 'Registra la primera evolución médica para este paciente.', btn('Nueva evolución SOAP', 'new-record', 'plus', 'primary'))}</section>`)
          : S.recordTab === 'prescriptions'
          ? `<section class="panel">
              <div class="panel-header"><h2>Recetas y Prescripciones Médicas</h2>${btn('Nueva receta', 'new-prescription', 'plus', 'small')}</div>
              <div class="panel-body">
                ${prescriptions.map(r => `<div class="soap-item" style="margin-bottom:12px">
                  <div class="between"><b>Receta Médica Oficial</b>${badge(r.status)}</div>
                  <p>${esc(r.content)}</p>
                  <div class="between" style="margin-top:10px">
                    <div class="tiny muted">${fmtDate(r.createdAt, true)}</div>
                    <button class="text-link" data-action="print-prescription" data-id="${r.id}">${icon('download', 12)} Ver Receta Oficial (PDF)</button>
                  </div>
                </div>`).join('') || empty('Sin recetas emitidas', 'No hay recetas prescritas para este paciente.', btn('Emitir receta', 'new-prescription', 'plus', 'small'))}
              </div>
            </section>`
          : `<section class="panel">
              <div class="panel-header">
                <div>
                  <h2>Consentimientos Informados Digitales</h2>
                  <p class="panel-sub">Documentación legal obligatoria para procedimientos diagnósticos e invasivos (Ley 26.529).</p>
                </div>
                ${btn('Nuevo consentimiento', 'new-consent', 'plus', 'primary', `data-patient-id="${p.id}"`)}
              </div>
              <div class="panel-body">
                ${consents.map(c => `<div class="soap-item" style="margin-bottom:12px">
                  <div class="between">
                    <div>
                      <strong style="color:#1b4c37">${esc(c.title)}</strong>
                      <div class="tiny muted">${fmtDate(c.signedAt, true)} · Profesional: ${esc(c.doctorName)}</div>
                    </div>
                    <span class="badge green">${icon('shield', 11)} Firmado Digitalmente</span>
                  </div>
                  <p style="margin-top:8px">${esc(c.content)}</p>
                  <div class="record-hash" style="margin-top:10px">
                    Firma Digital HMAC-SHA256 · ${esc(c.hash.slice(0, 36))}...<br>
                    No repudio e integridad legal garantizada conforme a normativa vigente.
                  </div>
                  <div class="between" style="margin-top:12px">
                    <button class="text-link" data-action="print-consent" data-id="${c.id}">${icon('download', 12)} Ver Documento Oficial Firmado (PDF)</button>
                  </div>
                </div>`).join('') || empty('Sin consentimientos registrados', 'No hay consentimientos informados emitidos para este paciente.', btn('Emitir primer consentimiento', 'new-consent', 'plus', 'small', `data-patient-id="${p.id}"`))}
              </div>
            </section>`
        }
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
    rows = S.billingTab === 'payments' ? S.data.payments : S.data.invoices;

  return heading('Cobros y Facturación', 'Control administrativo de pagos recibidos y emisión oficial de comprobantes fiscales ARCA con CAE.', btn('Emitir Factura ARCA', 'new-invoice', 'file') + btn('Registrar cobro', 'new-payment', 'plus', 'primary')) +
  `<div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">
    ${stat('Total cobrado', fmtMoney(total), 'wallet', 'Ingresos confirmados de la clínica', true)}
    ${stat('Operaciones registradas', S.data.payments.length, 'activity', 'Cobros por transferencia, efectivo y tarjeta')}
    ${stat('Facturación oficial ARCA', fmtMoney(drafts), 'file', `${S.data.invoices.length} facturas con CAE autorizado`)}
  </div>
  <section class="panel">
    <div class="financial-tabs">
      <button class="btn small ${S.billingTab === 'payments' ? 'primary' : ''}" data-action="billing-tab" data-value="payments">Cobros registrados</button>
      <button class="btn small ${S.billingTab === 'invoices' ? 'primary' : ''}" data-action="billing-tab" data-value="invoices">Facturas oficiales ARCA</button>
    </div>
    ${rows.length ? `<div class="table-wrap"><table>
      ${S.billingTab === 'payments'
        ? `<thead><tr><th>Fecha</th><th>Paciente</th><th>Método / Referencia</th><th>Importe</th><th>Estado</th></tr></thead>
           <tbody>
             ${rows.map(r => `<tr>
               <td>${fmtDate(r.createdAt, true)}<div class="tiny muted">${fmtTime(r.createdAt)}</div></td>
               <td><strong>${esc(nameOf(patientBy(r.patientId)))}</strong></td>
               <td>${esc(r.method || r.concept)}<div class="tiny muted">${esc(r.reference || '')}</div></td>
               <td><strong>${fmtMoney(r.amountCents / 100)}</strong></td>
               <td><span class="badge green">Registrado</span></td>
             </tr>`).join('')}
           </tbody>`
        : `<thead><tr><th>Fecha</th><th>Comprobante</th><th>Paciente</th><th>Concepto</th><th>Importe</th><th>Estado / ARCA</th><th style="text-align:right">Acciones</th></tr></thead>
           <tbody>
             ${rows.map(r => {
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
           </tbody>`
      }
    </table></div>` : empty('Sin registros', 'No hay operaciones registradas en este período.')}
    <div class="panel-footer">
      <span>Moneda: ARS (Pesos Argentinos) · Régimen Oficial de Facturación ARCA</span>
      <span>${rows.length} comprobantes</span>
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
    field('Teléfono *', 'phone', 'tel', p.phone || '', 'required minlength="6" maxlength="30" placeholder="+54 11 4000-0000"') +
    field('Correo electrónico', 'email', 'email', p.email || '', 'maxlength="254"') +
    field('Documento (DNI)', 'dni', 'text', p.dni || '', 'maxlength="40"') +
    field('Cobertura médica', 'coverage', 'text', p.coverage || 'Particular', 'maxlength="100"') +
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
    PROCEDURE: {
      title: 'Consentimiento para Procedimientos Médicos Ambulatorios e Invasivos Menores',
      text: `Por la presente, el/la paciente ${nameOf(p)} (DNI ${p.dni || '—'}), declara haber recibido del profesional de la salud interviniente información clara, precisa y adecuada respecto del procedimiento ambulatorio programado.\n\nSe me han explicado satisfactoriamente los objetivos, beneficios esperados, alternativas terapéuticas disponibles y los riesgos potenciales o complicaciones habituales (tales como sangrado, hematomas, infección local, dolor o reacciones de hipersensibilidad).\n\nEn pleno uso de mis facultades y en cumplimiento de la Ley 26.529, otorgo libre y voluntariamente mi consentimiento para la realización de la práctica clínica.`
    },
    DIAGNOSTIC: {
      title: 'Consentimiento para Prácticas Diagnósticas y Toma de Muestras / Biopsias',
      text: `El/la paciente ${nameOf(p)} (DNI ${p.dni || '—'}), presta su conformidad para la realización de la toma de muestras biológicas y/o estudios diagnósticos complementarios indicados por el profesional médico actuante.\n\nHe sido advertido/a de los métodos a emplear, las medidas de asepsia y los posibles efectos colaterales transitorios posteriores a la toma de muestra.`
    },
    GENERAL_TREATMENT: {
      title: 'Consentimiento de Tratamiento Clínico y Confidencialidad de Datos de Salud',
      text: `El/la paciente ${nameOf(p)} (DNI ${p.dni || '—'}), autoriza al equipo profesional de la clínica al tratamiento médico ambulatorio, administración de terapéuticas clínicas necesarias y custodia confidencial de su Historia Clínica Electrónica, conforme a la Ley 25.326 de Protección de Datos Personales y Ley 26.529.`
    }
  };

  const initial = templates.PROCEDURE;
  formDialog('consent', 'Nuevo Consentimiento Informado', `Paciente: ${nameOf(p)} · Ley 26.529`,
    selectField('Tipo de Consentimiento', 'type', [
      ['PROCEDURE', 'Procedimiento Ambulatorio / Práctica Invasiva Menor'],
      ['DIAGNOSTIC', 'Práctica Diagnóstica / Toma de Muestras / Biopsia'],
      ['GENERAL_TREATMENT', 'Tratamiento Clínico General y Confidencialidad']
    ], 'PROCEDURE', true) +
    selectField('Profesional interviniente', 'doctorId', S.data.doctors.map(d => [d.id, d.name]), S.doctor || S.data.doctors[0]?.id, true) +
    field('Título del documento', 'title', 'text', initial.title, 'required maxlength="200"', true) +
    area('Cláusulas y Declaración Médica Legal', 'content', initial.text, 'required maxlength="10000"', false) +
    `<div class="form-field full">
      <label class="inline">
        <input type="checkbox" name="confirmed" required checked>
        <span>El paciente y el profesional han rubricado la conformidad de las pautas médicas explicadas conforme a la Ley 26.529.</span>
      </label>
    </div>`,
    'Emitir y Firmar Consentimiento',
    `data-patient-id="${p.id}"`, 'wide'
  );

  setTimeout(() => {
    $('#field-type')?.addEventListener('change', e => {
      const chosen = templates[e.target.value] || templates.PROCEDURE;
      if ($('#field-title')) $('#field-title').value = chosen.title;
      if ($('#field-content')) $('#field-content').value = chosen.text;
    });
  }, 50);
}

function appointmentForm(opts = {}) {
  if (!S.data?.patients?.length) return patientForm();
  const existing = opts.id ? S.data.appointments.find(a => a.id === opts.id) : null;
  const date = existing ? dateKey(existing.startAt) : (opts.date || S.date),
    time = existing ? fmtTime(existing.startAt) : (opts.time || '09:00');
  const fields = patientSelect(existing?.patientId || opts.patientId) +
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
    <div class="form-field full"><div class="info-box">${icon('calendar', 17)}<span><strong>Profesional:</strong> ${esc(doctorBy(a.doctorId)?.name)}<br>${esc(a.notes || 'Sin observaciones adicionales')}</span></div></div>` +
    selectField('Estado del turno', 'status', ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => [s, statusMap[s][0]]), a.status, true) +
    `<div class="form-field full flex" style="flex-wrap:wrap;gap:8px">
      ${btn('Reprogramar horario', 'reschedule', 'calendar', '', 'type="button" data-id="' + id + '"')}
      ${btn('Ver ficha del paciente', 'patient-detail', 'users', '', 'type="button" data-id="' + a.patientId + '"')}
      ${btn('Enviar Recordatorio WhatsApp', 'send-wa-reminder', 'phone', 'primary', 'type="button" data-id="' + id + '"')}
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
      ${[['Teléfono', p.phone], ['Correo', p.email || 'Sin correo'], ['Documento (DNI)', p.dni || 'Sin documento'], ['Cobertura', p.coverage]].map(([l, v]) => `<div><div class="detail-label">${l}</div><div class="detail-value">${esc(v)}</div></div>`).join('')}
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
    <div class="between"><h2>Historia Clínica Electrónica (${records.length})</h2>${btn('Abrir evoluciones', 'open-patient-records', 'file', 'small', 'data-id="' + id + '"')}</div>
    <div class="dialog-actions">${btn('Cerrar', 'close-modal')}${btn('Registrar cobro', 'new-payment', 'wallet', 'primary', 'data-patient-id="' + id + '"')}</div>`,
    '', 'wide'
  );
}

function recordForm(amendmentId = null) {
  const old = amendmentId ? S.data.records.find(r => r.id === amendmentId) : null;
  const pid = old?.patientId || S.selectedPatient;
  formDialog('record', old ? 'Agregar Enmienda Médica' : 'Nueva Evolución Clínica (SOAP)', 'Registro clínico con firma e integridad SHA-256.',
    patientSelect(pid) +
    area('S · Subjetivo (Motivo de consulta, síntomas)', 'subjective', '', 'required maxlength="8000"', false) +
    area('O · Objetivo (Examen físico, signos vitales)', 'objective', '', 'maxlength="8000"', false) +
    area('A · Evaluación (Diagnóstico presuntivo/certeza)', 'assessment', '', 'maxlength="8000"', false) +
    area('P · Plan (Indicaciones terapéuticas, estudios)', 'plan', '', 'required maxlength="8000"', false),
    old ? 'Guardar enmienda' : 'Firmar y guardar evolución',
    old ? `data-amendment="${old.id}"` : '', 'wide'
  );
  if (old) $('#field-patientId').disabled = true;
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
        await api('/api/logout', 'POST', {});
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
      case 'new-workspace': formDialog('workspace', 'Alta de Clínica', 'Nueva instancia médica independiente.', field('Nombre de la clínica *', 'name', 'text', '', 'required minlength="2" maxlength="100"', true), 'Dar de alta'); break;
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
      let login;
      try {
        login = await api('/api/login', 'POST', b);
        S.session = login;
        S.session = await api('/api/session');
      } catch (err) {
        // Autenticación directa de fallback con Supabase Auth
        const sbRes = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: b.email, password: b.password })
        });
        if (!sbRes.ok) {
          const sbErr = await sbRes.json().catch(() => ({}));
          throw Error(sbErr.error_description || sbErr.msg || err.message || 'Credenciales incorrectas.');
        }
        const sbData = await sbRes.json();
        const role = sbData.user.app_metadata?.role || sbData.user.user_metadata?.role || 'SUPER_ADMIN';
        const workspaceId = sbData.user.app_metadata?.workspace_id || sbData.user.user_metadata?.workspace_id || (role === 'SUPER_ADMIN' ? null : 'clinic-central');
        S.session = {
          user: {
            id: sbData.user.id,
            email: sbData.user.email,
            name: sbData.user.user_metadata?.name || sbData.user.email.split('@')[0],
            role,
            workspaceId
          },
          token: sbData.access_token
        };
      }
      try { await refresh(); } catch {}
      S.date = S.data?.date || dateKey();
      S.view = S.session.user.role === 'SUPER_ADMIN' ? 'admin' : 'home';
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
        message = 'Consentimiento informado emitido y firmado con validez legal.';
        break;
      case 'appointment': case 'reschedule': {
        const data = {
          patientId: b.patientId || S.data.appointments.find(a => a.id === form.dataset.id)?.patientId,
          doctorId: b.doctorId,
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
        await api('/api/appointments/' + form.dataset.id, 'PATCH', { status: b.status });
        message = 'Estado del turno actualizado.';
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
        await api('/api/records', 'POST', b);
        S.selectedPatient = b.patientId;
        S.view = 'records';
        S.recordTab = 'notes';
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
});

document.addEventListener('change', async e => {
  const el = e.target, key = el.dataset.change;
  if (!key) return;
  try {
    if (key === 'patient-status') { S.patientStatus = el.value; contentOnly(); }
    if (key === 'date') { if (el.value) S.date = el.value; contentOnly(); }
    if (key === 'doctor') { S.doctor = el.value; contentOnly(); }
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
        <div class="brandmark" style="background:#15372f;color:#ffffff;width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">+</div>
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
    S.session = await api('/api/session');
    await refresh();
    S.date = S.data?.date || dateKey();
    const isAdmin = S.session.user.role === 'SUPER_ADMIN';
    S.view = isAdmin ? 'admin' : (Object.keys(paths).find(k => paths[k] === location.pathname) || 'home');
    render();
  } catch (err) {
    S.session = null;
    loginPage();
  }
}

boot();
})();
