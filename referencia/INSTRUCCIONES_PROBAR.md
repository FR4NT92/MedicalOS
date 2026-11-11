# Clinic-OS · Operating System para Clínicas & Consultorios Médicos
**SaaS Multi-tenant IA-Native con Conexión a GoHighLevel, WhatsApp, Mercado Pago y ARCA (AFIP)**

---

## 🚀 Inicio Rápido (En 2 Pasos)

### 1. Instalar dependencias
En la raíz del proyecto, ejecuta:
```bash
pnpm install
```

### 2. Iniciar el Servidor de Desarrollo
```bash
pnpm --filter web dev
```
La aplicación estará disponible en: **`http://localhost:3000`**

---

## 🔑 Credenciales de Acceso

| Rol | URL | Usuario / Email | Contraseña |
|---|---|---|---|
| **Médico / Clínica** | `http://localhost:3000/login` | `admin@clinica.com` | `admin123` |
| **Super Admin** | `http://localhost:3000/admin` | `admin@clinica.com` | `admin123` |

---

## 🌟 Módulos y Funcionalidades Incluidas

1. **Dashboard Clínico Unificado (`/`)**:
   - **Agenda Inteligente:** Detección de huecos libres, porcentaje de ocupación en tiempo real y asignación rápida de turnos.
   - **WhatsApp Anti-No-Show:** Botón directo para enviar recordatorios interactivos y confirmación automática con respuesta "1".
   - **Cobro de Seña Mercado Pago:** Generación de enlaces con vencimiento a 4 horas y código QR para mostrador/WhatsApp.
   - **Historia Clínica Ley 26.529:** Evoluciones SOAP inmutables con hash SHA-256 e historial de fe de erratas / enmiendas.
   - **Recetas con Firma Digital (Ley 25.506):** Prescripciones selladas criptográficamente con enlace de verificación pública.
   - **Facturación Electrónica ARCA (AFIP):** Emisión en 1 clic de Facturas A y B con CAE oficial y QR reglamentario.
   - **Directorio de Pacientes:** Sincronizado automáticamente con GoHighLevel.

2. **Master Command Center - Super Admin (`/admin`)**:
   - Gestión y aislamiento de Clínicas (Tenants).
   - **Hub Central de Conexiones:** Monitoreo y prueba de GoHighLevel, Meta WhatsApp, Google Calendar, Guardrails IA, Mercado Pago y ARCA.
   - **Kill Switches Globales:** Interruptores para pausar IA, webhooks o facturación ante contingencias técnicas.

3. **Verificador Público de Firma Digital (`/verify/[signatureId]`)**:
   - Acceso público para farmacias y obras sociales para auditar la validez y autenticidad de recetas y evoluciones médicas.

---

## 🧪 Pruebas Automatizadas del Sistema
Para ejecutar la auditoría automatizada completa (15 pruebas de todas las capas):
```bash
node scripts/deep-system-audit.js
```
Resultado: **15/15 Pruebas Exitosas (100% PASS)**.
