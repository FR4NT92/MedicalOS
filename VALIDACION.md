# Validación de la entrega local

Fecha de ejecución: 30 de octubre de 2026. Solo datos ficticios.

## Entorno y alcance

Aplicación nueva en Node.js 22.16.0, SQLite 3.49.1 mediante `node:sqlite`, HTML, CSS y JavaScript. Sin dependencias npm en tiempo de ejecución. Sistema de pruebas Linux con Chromium y Playwright. No se probó en Windows, macOS, Safari ni Firefox.

No se instaló ni compiló el monorepo Next.js/tRPC/Prisma del ZIP de referencia. El registro npm no era accesible desde este entorno. La entrega ejecutable es una implementación local diferente; la copia del original incluida en `referencia/` no participa en las pruebas.

## Pruebas de API y base de datos: 40 aprobadas

Comando reproducible desde la raíz:

```bash
node --test tests/api.test.mjs
```

El test crea una base SQLite temporal y un servidor aislado en el puerto 3199. Comprueba autenticación, cookies, CSRF, origen y host, separación entre dos clínicas, permisos de Super Admin, alta de pacientes, validación de turnos y solapamientos, protección de notas en API y en SQLite, enmiendas, verificación sin exponer contenido clínico, registros de pago idempotentes, borradores sin CAE, bloqueo de integraciones, pausa del asistente, creación de espacios y persistencia al reiniciar. También comprueba rechazo del modo de producción y cierre de sesión.

Resultado completo en `reports/API-40-PRUEBAS.txt`. Los 40 casos pasan; esto no es una auditoría independiente de seguridad ni una certificación sanitaria.

## Interfaz: 25 comprobaciones aprobadas

La prueba incluida en `tests/ui_workflows.py` arranca otro servidor y base temporal, en el puerto 3201. Requiere Python, Playwright, Requests y un Chromium de prueba; estas dependencias no se requieren para ejecutar Clinic OS.

Se verificaron login, navegación móvil, ausencia de desbordamiento horizontal, altas y edición de pacientes, búsqueda, creación de turnos, error visible ante solapamiento, cambio de estado y reprogramación, evoluciones y enmiendas, registros manuales de pagos, borradores, contactos y etapas, bloqueo explícito de conectores, cambios de configuración, resumen administrativo, Super Admin, creación de una clínica y ausencia de excepciones JavaScript en esos recorridos.

La vista previa HTML se comprobó sin servidor: renderizado, formulario de paciente y ausencia de excepciones JavaScript. Su SHA-256 se contrastó con una implementación independiente en Python usando texto con caracteres Unicode.

### Limitación explícita del navegador

El navegador del entorno de construcción bloquea por política la navegación directa a localhost y a archivos locales. No se modificaron esas políticas. Para probar la interfaz se cargaron HTML, CSS y JavaScript con `page.set_content`; un puente Playwright/Python transmitió las solicitudes de la interfaz al servidor HTTP local real. Se anularon cambios de historial en ese entorno de renderizado. La vista previa se cargó como HTML autocontenido con el mismo método.

Por tanto, estas comprobaciones prueban los controles visibles, la lógica JavaScript y sus operaciones contra la API, pero **no constituyen una navegación de extremo a extremo en un dominio publicado**. No validan el comportamiento de cookies en un navegador normal, la política CSP del navegador, el historial del navegador ni todos los enlaces directos. Las cabeceras, cookies y recursos del servidor se revisaron por HTTP y las pruebas de API, por separado.

Resultados: `reports/UI-25-COMPROBACIONES.json` y `.txt`. Las capturas incluidas muestran el renderizado real de la aplicación con datos ficticios; no son imágenes conceptuales.

## Validación adicional de empaquetado

El ZIP final excluye bases SQLite, archivos WAL/SHM, cachés, resultados temporales y archivos de entorno privados. La app crea sus propios datos ficticios al primer arranque. El constructor de vista previa valida la sintaxis de los archivos JavaScript y genera un HTML sin recursos externos.

El script Windows y el lanzador macOS/Linux se incluyen como facilidades de arranque, pero no se afirma haberlos probado en esos sistemas operativos. El comando directo con Node.js sí fue ejecutado en Linux.

## No validado / no conectado

No hubo pruebas contra GoHighLevel, WhatsApp, Google Calendar, Mercado Pago, ARCA ni un proveedor de IA. No se emitieron facturas, recetas válidas ni firmas digitales certificadas. No se enviaron recordatorios ni se movió dinero. Tampoco se verificaron cumplimiento normativo, cifrado de datos en reposo, restauración de backups, carga concurrente de producción, accesibilidad completa o uso de pacientes reales.

Las cuentas por defecto y la seguridad de demostración deben reemplazarse y auditarse antes de cualquier uso real. El almacenamiento de la vista previa HTML no ofrece aislamiento seguro: sus permisos son solo visuales.
