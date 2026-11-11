-- ============================================================================
-- ABUNDANCE CLINIC OS - DATOS INICIALES (SEED) PARA SUPABASE
-- ============================================================================

-- 1. Espacios Clínicos (Workspaces / Tenants)
INSERT INTO workspaces (id, name, slug, timezone, color)
VALUES
    ('clinic-central', 'Clínica Médica Abundance', 'abundance-central', 'America/Argentina/Buenos_Aires', '#357a60'),
    ('clinic-nordelta', 'Abundance Medical Center', 'abundance-nordelta', 'America/Argentina/Buenos_Aires', '#2d6a50')
ON CONFLICT (id) DO NOTHING;

-- 2. Configuración predeterminada de la clínica
INSERT INTO settings (workspace_id, value)
VALUES
    ('clinic-central', '{"pauseAssistant":false,"pauseWebhooks":false,"pauseBilling":false,"opening":"09:00","closing":"18:00","slotMinutes":30}'::jsonb),
    ('clinic-nordelta', '{"pauseAssistant":false,"pauseWebhooks":false,"pauseBilling":false,"opening":"09:00","closing":"18:00","slotMinutes":30}'::jsonb)
ON CONFLICT (workspace_id) DO NOTHING;

-- 3. Integraciones Centrales
INSERT INTO integrations (id, name, category, initials, description, status, config)
VALUES
    ('highlevel', 'GoHighLevel', 'CRM y Pipelines', 'HL', 'Sincronización bidireccional de pacientes, oportunidades en embudos y agendamiento de turnos.', 'NOT_CONNECTED', '{"locationId":"","apiKey":"","webhookUrl":""}'::jsonb),
    ('whatsapp', 'WhatsApp Business API', 'Mensajería y Notificaciones', 'WA', 'Envío automático de confirmaciones de turnos, recordatorios 24h antes y reprogramaciones.', 'NOT_CONNECTED', '{"phoneNumberId":"","appId":"","token":"","templateName":"recordatorio_turno"}'::jsonb),
    ('mercadopago', 'Mercado Pago', 'Pasarela de Cobros', 'MP', 'Cobro de copagos y consultas mediante links de pago, checkout integrado y notificaciones IPN.', 'NOT_CONNECTED', '{"accessToken":"","publicKey":"","sandbox":false}'::jsonb),
    ('arca', 'ARCA (ex AFIP)', 'Facturación Electrónica', 'AR', 'Emisión de comprobantes fiscales oficiales (Facturas A, B, C) con obtención directa de CAE.', 'NOT_CONNECTED', '{"cuit":"","puntoVenta":"0001","certPath":"","privateKeyPath":"","ambiente":"homologacion"}'::jsonb),
    ('ai', 'Proveedor de Inteligencia Artificial', 'Asistente Clínico y Operativo', 'IA', 'Copiloto para resumen de historias clínicas, triage y automatización de respuestas a pacientes.', 'NOT_CONNECTED', '{"provider":"OpenAI","apiKey":"","model":"gpt-4o","temperature":0.3}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Profesionales Médicos
INSERT INTO doctors (id, workspace_id, name, specialty, license_number)
VALUES
    ('doctor-1', 'clinic-central', 'Dra. Julia Morales', 'Medicina General y Preventiva', 'MN 142.890'),
    ('doctor-2', 'clinic-central', 'Dr. Tomás Benítez', 'Cardiología Clínica', 'MN 138.450')
ON CONFLICT (id) DO NOTHING;

-- 5. Pacientes Iniciales con Antecedentes Médicos (Ley 26.529)
INSERT INTO patients (id, workspace_id, first_name, last_name, dni, phone, email, coverage, status, medical_history)
VALUES
    ('patient-1', 'clinic-central', 'Valeria', 'Ríos', '35.482.901', '+54 11 4821-3920', 'valeria.rios@email.com', 'OSDE 310', 'ACTIVE',
     '{"allergies":"Sin alergias medicamentosas conocidas reportadas","pathological":"Hipotiroidismo primario en tratamiento sustitutivo","surgical":"Sin antecedentes quirúrgicos mayores","medications":"Levotiroxina 75 mcg / día en ayunas","familyHistory":"Madre con hipotiroidismo","habits":"No tabaquista. Dieta equilibrada y actividad aeróbica 3x/sem."}'::jsonb),
    ('patient-2', 'clinic-central', 'Bruno', 'Rossi', '31.298.441', '+54 11 5918-2041', 'bruno.rossi@email.com', 'Swiss Medical', 'ACTIVE',
     '{"allergies":"Alergia severa a Penicilina (anafilaxia previa) y AINEs (Ibuprofeno)","pathological":"Hipertensión Arterial Grado 2 (desde 2021), Dislipidemia","surgical":"Colecistectomía laparoscópica (2019)","medications":"Enalapril 10 mg / 12 hs, Atorvastatina 20 mg / noche","familyHistory":"Padre con IAM a los 58 años, abuelo materno ACV","habits":"Ex tabaquista (hace 4 años). Consumo social de alcohol moderado."}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 6. Inventario Inicial de Insumos Médicos
INSERT INTO inventory (id, workspace_id, name, sku, category, quantity, min_quantity, unit, lot_number, expiry_date, notes, status)
VALUES
    ('inv-1', 'clinic-central', 'Gasas estériles 10x10cm (Caja x 100)', 'GAS-001', 'Suturas y Curaciones', 45, 15, 'cajas', 'LT-2024-89', '2027-12-31', 'Uso en consultorios y curaciones generales', 'ACTIVE'),
    ('inv-2', 'clinic-central', 'Jeringas descartables 5ml c/aguja 21G (Caja x 100)', 'JER-005', 'Descartables', 28, 10, 'cajas', 'LT-98210', '2028-06-30', 'Aplicación intramuscular y endovenosa', 'ACTIVE'),
    ('inv-3', 'clinic-central', 'Guantes de examen de látex talle M (Caja x 100)', 'GUA-LAT-M', 'Descartables', 8, 12, 'cajas', 'LT-44120', '2027-04-15', 'Stock bajo - Reposición requerida', 'ACTIVE'),
    ('inv-4', 'clinic-central', 'Guantes de nitrilo sin polvo talle L (Caja x 100)', 'GUA-NIT-L', 'Descartables', 22, 10, 'cajas', 'LT-33901', '2027-09-30', 'Para procedimientos y pacientes alérgicos al látex', 'ACTIVE'),
    ('inv-5', 'clinic-central', 'Solución Fisiológica 0.9% 500ml', 'SUER-FIS-500', 'Soluciones y Sueros', 35, 10, 'frascos', 'LT-77123', '2026-11-20', 'Infusiones, lavado ocular y curaciones', 'ACTIVE'),
    ('inv-6', 'clinic-central', 'Alcohol Etílico 70% 1 Litro', 'ALC-70-1L', 'Antisépticos', 14, 5, 'botellas', 'LT-88122', '2028-01-10', 'Desinfección de consultorios y piel', 'ACTIVE'),
    ('inv-7', 'clinic-central', 'Lidocaína 2% c/epinefrina ampolla 5ml (Caja x 10)', 'LID-EPI-2', 'Medicamentos', 4, 10, 'cajas', 'LT-11029', '2026-08-15', 'Stock crítico - Anestésico local', 'ACTIVE'),
    ('inv-8', 'clinic-central', 'Barbijos quirúrgicos tricapa termo-sellados (Caja x 50)', 'BAR-TRI-50', 'Descartables', 18, 8, 'cajas', 'LT-55419', '2028-03-31', 'Protección personal equipo de salud', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
