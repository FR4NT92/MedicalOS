# Alcance: referencia solicitada y entrega efectiva

| Módulo solicitado | Entrega local | Pendiente para operación real |
|---|---|---|
| Dashboard y agenda | Indicadores desde SQLite, vistas diaria/semanal, profesionales, estados y prevención de solapamientos | Reglas operativas de cada clínica, calendarios externos y pruebas de carga |
| Pacientes y CRM | Altas, edición, búsqueda, CSV, contactos y tablero comercial | Sincronización con GoHighLevel y gestión de consentimientos |
| Historia clínica | Notas SOAP y enmiendas con protección API/SQLite y cadena SHA-256 | Validación clínica/jurídica, permisos profesionales, certificados y auditoría independiente |
| Recetas | Borradores identificados como no válidos | Emisión regulada y firma digital certificada |
| WhatsApp | Panel de estado y bloqueo explícito de acciones | Credenciales por clínica, plantillas y consentimiento, webhooks, envío y recepción |
| Mercado Pago | Registro manual de pagos de prueba | API real, webhooks verificados y conciliación de acreditación |
| ARCA | Borradores internos sin CAE | Certificados, integración fiscal, autorización y comprobantes válidos |
| IA | Asistente administrativo por reglas sobre la demo | Proveedor real, permisos, guardrails y evaluación; no decisiones clínicas autónomas |
| Super Admin y clínicas | Separación por sesión en SQLite, segunda clínica de prueba, creación de espacios vacíos | Administración de usuarios, onboarding y despliegue multicliente |
| Verificación | Comprobación técnica de integridad sin publicar el contenido | Marco jurídico y firma profesional; no equivale a una validación legal |

## Decisiones de implementación

La entrega no sustituye silenciosamente el stack del proyecto original: incluye una aplicación local nueva, más pequeña y verificable en este entorno, y conserva el código original por separado. No debe confundirse con una compilación corregida del monorepo original.

Los conectores aparecen desconectados y las acciones externas fallan de manera explícita. No se generan identificadores de pago o CAE ficticios que puedan confundirse con autorizaciones reales. Los importes y personas iniciales son sintéticos.

La vista previa HTML sirve para recorrer y evaluar la experiencia de uso. La versión servidor añade sesiones y persistencia SQLite; aun así, ambas son demostraciones locales y no están listas para datos reales ni exposición pública.
