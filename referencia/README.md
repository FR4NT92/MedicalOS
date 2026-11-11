# Abundance Clinic OS
**SaaS Multitenant B2B2C para el Sector Médico con Medical Copilot, HL7 FHIR v4 y GoHighLevel v2**

---

## 🏛 Resumen Arquitectónico y Compliance

**Abundance Clinic OS** es una plataforma operativa clínica de grado empresarial diseñada bajo estándares estrictos de protección de datos sensibles (**HIPAA § 164.312 / GDPR Art. 30**) y la estética funcional **Bauhaus Digital**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BAUHAUS DIGITAL UI                               │
│           Next.js 14 App Router • TypeScript • Tailwind CSS                 │
│         Sidebar (#1A2E2D) • Topbar Funcional • Audio VU Meter               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    WebSocket Opus/WebM│ (Timeslices 250ms)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI ORCHESTRATION                              │
│              Whisper STT • Medical Copilot (Function Calling)               │
│        SOAP Note Extractor • GHL v2 Appointment Mapper • HMAC-SHA256        │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
            HL7 FHIR v4│ SQL Migrations     OAuth Token│ GHL API v2
                       ▼                               ▼
┌──────────────────────────────────────┐     ┌────────────────────────────────┐
│         SUPABASE / POSTGRESQL        │     │         GOHIGHLEVEL v2         │
│  - RLS Estricto por tenant_id        │     │  - Contact Sync (CRM)          │
│  - HL7 FHIR (Patient, Encounter,     │     │  - Calendar Free/Busy Slots    │
│    Observation, ClinicalImpression)  │     │  - Automated Citas & Triggers  │
│  - Append-Only Audit Logs            │     │  - Inbound Webhook Receiver    │
└──────────────────────────────────────┘     └────────────────────────────────┘
```

---

## 🔒 Garantías de Seguridad y Compliance

1. **Aislamiento Multitenant Criptográfico:**
   - La función `custom_access_token_hook` en PostgreSQL inyecta `tenant_id`, `role` y `npi_number` directamente en `app_metadata` del JWT de Supabase.
   - El middleware de FastAPI (`security.py`) y Next.js Edge (`middleware.ts`) rechazan cualquier acceso foráneo o intento de cruce de inquilinos (*cross-tenant breach*).
2. **HL7 FHIR v4.0.1 Nativo:**
   - Recursos modelados relacionalmente: `Patient`, `Encounter`, `Observation` (LOINC / SNOMED CT) y `ClinicalImpression` (SOAP).
   - Generador e interoperabilidad de documentos FHIR Bundle (`/api/v1/fhir/patients/{id}/bundle`).
3. **Pista de Auditoría Inmutable (Append-Only):**
   - Tabla `audit_logs` con triggers a nivel motor de base de datos que lanzan excepciones inmediatas ante cualquier sentencia `UPDATE` o `DELETE`.
   - Hashes acumulativos SHA-256 por cada acción (`READ`, `CREATE`, `SIGN`, `AI_DISPATCH`, `GHL_SYNC`).
4. **Flujo Human-in-the-Loop:**
   - La IA genera exclusivamente borradores (`status = 'draft'`).
   - El médico debe revisar, editar y firmar digitalmente mediante PIN criptográfico generando un digest HMAC-SHA256 antes de que el turno en GoHighLevel sea confirmado.

---

## 📂 Estructura Completa del Monorepo

```
abundance-clinic-os/
├── apps/
│   ├── web/                              # Frontend Next.js (App Router), TS, Tailwind
│   │   ├── app/
│   │   │   ├── (auth)/login/page.tsx     # Pantalla de acceso Bauhaus con Tenant Scoping
│   │   │   ├── (dashboard)/
│   │   │   │   ├── audit/page.tsx        # Explorador de auditoría inmutable
│   │   │   │   ├── encounters/page.tsx   # Directorio de encuentros FHIR
│   │   │   │   ├── patients/page.tsx     # Directorio de pacientes FHIR
│   │   │   │   ├── schedule/page.tsx     # Agenda y sincronización GHL v2
│   │   │   │   ├── layout.tsx            # Layout con inyección de BauhausShell
│   │   │   │   └── page.tsx              # Consola clínica con SOAP interactivo
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── clinical/
│   │   │   │   ├── GHLAppointmentCard.tsx # Tarjeta de acción de agenda GHL
│   │   │   │   ├── SignatureModal.tsx     # Modal de firma electrónica profesional
│   │   │   │   └── SOAPEditor.tsx         # Editor SOAP con trazabilidad de cambios
│   │   │   └── layout/
│   │   │       ├── BauhausShell.tsx       # Orquestador del panel y Drawer
│   │   │       ├── Sidebar.tsx            # Sidebar sobrio (#1A2E2D)
│   │   │       └── Topbar.tsx             # Topbar con VU meter y disparador de dictado
│   │   ├── hooks/
│   │   │   ├── useMedicalDictation.ts    # Captura MediaRecorder (Opus) y WebSockets
│   │   │   └── useTenantAuth.ts          # Sesión y perfil profesional autenticado
│   │   ├── lib/
│   │   │   └── supabase/                 # Clientes SSR para Browser, Server y Middleware
│   │   ├── middleware.ts                 # Middleware Edge de Next.js
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tailwind.config.ts
│   └── api/                              # Backend FastAPI (Python 3.11)
│       ├── app/
│       │   ├── api/v1/
│       │   │   ├── compliance.py         # Endpoints de firma digital y auditoría
│       │   │   ├── fhir_router.py        # Generador de FHIR v4 Document Bundles
│       │   │   └── ghl.py                # Sincronización y webhooks de GoHighLevel v2
│       │   ├── core/
│       │   │   ├── config.py             # Configuración Pydantic Settings
│       │   │   └── security.py           # Validación JWT y aislación multitenant
│       │   ├── services/
│       │   │   ├── audio_transcriber.py  # Procesador de buffer WebM/Opus y Whisper
│       │   │   ├── compliance_service.py # Cómputo de firma HMAC-SHA256
│       │   │   ├── copilot_orchestrator.py # Function Calling para notas SOAP y GHL
│       │   │   ├── fhir_bundle_service.py# Ensamblado de documentos HL7 FHIR
│       │   │   └── ghl_client.py         # Cliente HTTP para API v2 de LeadConnector
│       │   └── main.py                   # Ingesta WebSocket y servidor ASGI
│       ├── tests/
│       │   ├── test_compliance_signature.py
│       │   ├── test_fhir_bundle.py
│       │   └── test_multitenant_security.py
│       ├── Dockerfile
│       └── requirements.txt
├── packages/
│   └── fhir-types/                       # Tipos TypeScript comunes HL7 FHIR v4
│       ├── index.ts
│       └── package.json
├── supabase/
│   ├── migrations/
│   │   ├── 20260924000000_init_abundance_schema.sql
│   │   └── 20260924010000_auth_jwt_multitenant_hook.sql
│   └── seed.sql                          # Datos de prueba para sedes y pacientes
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .env.example
```

---

## 🚀 Despliegue y Ejecución Rápida

### Opción A: Despliegue con Docker Compose (Recomendado)
Para iniciar PostgreSQL (con RLS y Seed Data), el backend FastAPI y el frontend Next.js en contenedores orquestados:
```bash
docker-compose up --build
```
- **Frontend Bauhaus:** `http://localhost:3000` (Acceso con Sede: `cmm-01`)
- **Backend API & Swagger:** `http://localhost:8000/docs`
- **WebSocket Audio Stream:** `ws://localhost:8000/api/v1/audio/stream`

### Opción B: Ejecución Local en Desarrollo

1. **Configuración de la Base de Datos:**
   Ejecutar las migraciones en Supabase SQL Editor:
   - `supabase/migrations/20260924000000_init_abundance_schema.sql`
   - `supabase/migrations/20260924010000_auth_jwt_multitenant_hook.sql`
   - `supabase/seed.sql`

2. **Backend FastAPI:**
   ```bash
   cd apps/api
   python -m venv venv
   source venv/bin/activate # En Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Frontend Next.js:**
   ```bash
   pnpm install
   pnpm --filter web dev
   ```

4. **Ejecutar Pruebas Automatizadas:**
   ```bash
   cd apps/api
   pytest tests/
   ```
