# Abundance · Clinic OS
## Entrega local funcional — 30 de octubre de 2026

**Esta es una aplicación local de demostración. No ingresar datos de pacientes reales ni publicarla en Internet.**

Incluye una interfaz completa, un servidor HTTP en Node.js, persistencia SQLite y una vista previa HTML independiente. No es una compilación del monorepo Next.js original ni un sistema clínico habilitado para producción.

## 1. Probar visualmente sin instalar

Abre `dist/Abundance-Clinic-OS-Vista-Previa.html` en tu navegador.

La vista previa guarda los cambios en el almacenamiento de ese navegador cuando está disponible. Su login y permisos son únicamente de demostración: no hay autenticación real, servidor ni aislamiento seguro entre usuarios. No comparte datos con la versión SQLite. Si el navegador bloquea almacenamiento local, los cambios duran solo durante la sesión de la página.

## 2. Ejecutar la versión con servidor y base de datos

Requisito declarado: Node.js 22.13 o posterior con `node:sqlite`. Versión efectivamente probada: **Node.js 22.16.0**. No se probaron otras versiones. No hacen falta claves, PostgreSQL, Supabase, Python ni paquetes npm para ejecutar la app.

Desde la carpeta descomprimida:

```bash
node apps/web/server.mjs
```

También se incluyen `INICIAR-WINDOWS.bat` y `INICIAR-MAC-LINUX.sh`.

Abre **http://localhost:3000** en el mismo equipo. Esa dirección solo funcionará después de iniciar el servidor en tu computadora. No es un sitio publicado por ChatGPT.

Para detenerlo, presiona `Ctrl+C` en la terminal. Los datos permanecen en `apps/web/data/clinic-demo.sqlite`.

### Alternativa con los comandos de tu captura

Si ya tienes pnpm instalado:

```bash
pnpm install
pnpm --filter web dev
```

El workspace `web` ejecuta el mismo servidor. El arranque directo con Node fue probado; los dos comandos de pnpm no se ejecutaron en el entorno de construcción, donde pnpm no estaba instalado y el registro npm no era accesible. El proyecto local no tiene dependencias npm que descargar.

## 3. Cuentas de demostración

| Cuenta | Usuario | Contraseña | Alcance |
|---|---|---|---|
| Clínica principal | `admin@clinica.com` | `admin123` | Pacientes, turnos y operación de Clínica Demo Abundance |
| Super Admin | `superadmin@clinica.test` | `demo-admin-2026` | Clínicas y métricas agregadas; no puede leer historias clínicas |
| Segunda clínica | `otra@clinica.test` | `demo-otra-2026` | Un espacio separado para pruebas de aislamiento, solo en versión servidor |

Estas credenciales se crean como cuentas locales de prueba. No constituyen un bypass de autenticación ante fallos de base de datos. La versión local rechaza el arranque con `NODE_ENV=production` y escucha en `127.0.0.1` por defecto. No usar estas claves en ningún despliegue público.

## 4. Funcionalidades implementadas y probadas

- **Panel general:** indicadores calculados desde los registros locales, agenda del día, pendientes, actividad y origen informado de contactos. No muestra ROAS, CAC ni facturación atribuida sin datos de publicidad y pagos verificados.
- **Pacientes:** alta, edición, búsqueda, ficha y exportación CSV. Admite pacientes sin apellido. El teléfono no puede repetirse dentro de la misma clínica.
- **Agenda:** vista diaria y semanal, filtros por profesional, alta de turnos, confirmación, cancelación, reprogramación e inasistencia. Valida cruces de profesional y paciente dentro de una transacción. Los horarios se muestran en Buenos Aires.
- **Seguimiento comercial:** contactos y tablero de etapas, movimiento por selector o arrastre. Los cambios se guardan y no disparan mensajes externos.
- **Historia clínica de prueba:** evoluciones SOAP y enmiendas. La API y triggers SQLite impiden editar o borrar registros. La cadena SHA-256 permite comprobar integridad técnica; no es una firma digital certificada.
- **Borradores de recetas:** texto de prueba, sin firma ni validez para dispensación. No se ofrecen indicaciones médicas automáticas.
- **Cobros:** registros manuales de prueba con idempotencia para evitar duplicar una misma operación. No verifican dinero recibido ni ejecutan movimientos de fondos.
- **Comprobantes:** borradores internos, sin CAE, QR fiscal ni validez de factura.
- **Integraciones:** estados y requisitos claramente marcados como no conectados. Las rutas de acciones externas devuelven bloqueo explícito.
- **Asistente local:** resúmenes administrativos por reglas, basados en los datos locales. No es un modelo de IA, no toma decisiones clínicas y no modifica registros por su cuenta.
- **Configuración:** controles locales por clínica y pausa efectiva del asistente. Despausar webhooks o facturación no conecta servicios.
- **Super Admin:** visualización agregada de clínicas y creación de espacios vacíos. No incluye gestión de usuarios para esos nuevos espacios.

## 5. Lo que NO se entrega como operativo

No se conectaron GoHighLevel, WhatsApp, Google Calendar, Mercado Pago, ARCA ni un proveedor de IA. No se enviaron mensajes, realizaron cobros, emitieron facturas ni publicaron sitios.

No se certificó cumplimiento de leyes sanitarias, privacidad, firma digital, normativa fiscal, HIPAA ni GDPR. No se incluyen cifrado de datos clínicos en reposo, certificados profesionales, recuperación de desastres, backups automatizados, auditoría independiente ni despliegue público.

## 6. Pruebas reproducibles

```bash
node --test tests/api.test.mjs
```

**Resultado verificado: 40 pruebas aprobadas, 0 fallidas.** Incluyen autenticación, CSRF, separación de clínicas, acceso de Super Admin, conflictos de agenda, persistencia al reiniciar, invariancia de notas, verificación sin exposición de contenido, idempotencia de pagos y bloqueo de conectores.

Se comprobaron además **25 flujos y verificaciones de interfaz**. La limitación y el procedimiento del navegador están detallados en `docs/VALIDACION.md`. No se presentan como una prueba completa de despliegue o cumplimiento.

Para reconstruir la vista previa y validar la sintaxis:

```bash
node scripts/build.mjs
```

Pruebas visuales opcionales, separadas de la ejecución de la app:

```bash
python -m pip install playwright requests
python -m playwright install chromium
python tests/ui_workflows.py
```

También se puede indicar un navegador de prueba existente con `CHROMIUM_PATH`. El test visual arranca una base temporal; no modifica la base de la aplicación.

## 7. Estructura

```text
apps/web/server.mjs          API HTTP y controles de acceso
apps/web/seed.mjs            Datos y cuentas ficticias de demostración
apps/web/public/             Interfaz HTML, CSS y JavaScript
apps/web/data/               Base SQLite generada al primer arranque; no se distribuye
scripts/build.mjs           Constructor de la vista previa HTML autocontenida
tests/api.test.mjs          40 pruebas HTTP y SQLite
tests/ui_workflows.py       Verificaciones visuales con entorno de renderizado
reports/                    Resultados de pruebas realizadas
docs/                       Alcance, decisiones y validación
referencia/                 Código original en ZIP, sin archivos de entorno
```

## 8. Relación con tu ZIP original

El original usaba Next.js/tRPC/Prisma/PostgreSQL, con otro backend FastAPI y documentación de integraciones. Su instalación no pudo completarse en el entorno de construcción por falta de acceso al registro de paquetes. **No se afirma que el monorepo original compile ni que sus pruebas declaradas hayan sido reproducidas.**

Para entregar algo que se pudiera ejecutar y probar, se construyó esta implementación local sin dependencias npm. Se conserva una copia del código original en `referencia/original-sin-archivos-de-entorno.zip`, excluyendo `.env`, `.env.local`, cachés y artefactos compilados. Esa copia no se usa en el arranque y sus afirmaciones previas de producción no quedan validadas por esta entrega.

La revisión de código original encontró generación de referencias de pago y CAE simulados, además de credenciales por defecto aceptadas tras fallos de base de datos. Esta implementación no genera CAE ni links de pago falsos, separa Super Admin y clínica y mantiene las integraciones deshabilitadas.

## 9. Datos y límites operativos

La base se crea con registros de demostración al primer inicio. Las fechas de los turnos iniciales corresponden a ese día. Al usarla otro día puede aparecer una agenda vacía para la nueva fecha: los turnos antiguos siguen guardados y se consultan cambiando la fecha.

Detén el proceso antes de copiar la carpeta `apps/web/data/` para un respaldo manual de prueba. No copies una base SQLite en uso ignorando sus archivos WAL. La demo no contiene un servicio de backup.

Los logs de esta app no deben considerarse una auditoría legal completa. Quien controle el archivo de base de datos puede modificar la estructura y las protecciones: los triggers no convierten una computadora local en un repositorio certificado.

## 10. Camino a producción, fuera de esta entrega

Antes de trabajar con datos reales se necesita una fase independiente: arquitectura y despliegue revisados, credenciales únicas, permisos clínicos granulares, cifrado y gestión de claves, base de datos y migraciones de producción, backups verificados, integración por clínica, control de webhooks e idempotencia externa, pruebas de carga, validación clínica/fiscal y revisión jurídica pertinente.

No desplegar esta demo como reemplazo directo de HighLevel ni de un sistema clínico certificado.
