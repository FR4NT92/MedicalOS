from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import requests,json,subprocess,tempfile,time,hashlib,shutil,os
root=Path(__file__).resolve().parents[1];pub=root/'apps/web/public';out=root/'test-results'/'ui';out.mkdir(parents=True,exist_ok=True)
results=[]
def ok(label):results.append(label);print('PASS',label,flush=True)
with tempfile.TemporaryDirectory() as tmp:
 import os
 env={**os.environ,'PORT':'3201','CLINIC_DB':str(Path(tmp)/'ui.sqlite'),'NODE_ENV':'test'}
 server=subprocess.Popen(['node',str(root/'apps/web/server.mjs')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  base='http://127.0.0.1:3201'
  for i in range(80):
   try:
    if requests.get(base+'/api/health',timeout=1).ok:break
   except:pass
   time.sleep(.05)
  session=requests.Session()
  def bridge(payload):
   response=session.request(payload.get('method','GET'),base+payload['path'],headers=payload.get('headers',{}),data=payload.get('body'),timeout=10)
   return {'ok':response.ok,'status':response.status_code,'data':response.json()}
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,**({'executable_path':os.environ['CHROMIUM_PATH']} if os.environ.get('CHROMIUM_PATH') else {}))
   page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
   page.set_default_timeout(7000)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.expose_function('localRequest',bridge)
   page.set_content('<html lang="es"><head><meta charset="utf-8"></head><body><div id="app"></div><dialog id="modal"></dialog><div id="toasts" aria-live="polite"></div></body></html>')
   page.add_style_tag(content=(pub/'styles.css').read_text())
   page.evaluate("""() => {history.pushState=()=>{};history.replaceState=()=>{};window.fetch=async(path,options={})=>{const r=await window.localRequest({path,method:options.method||'GET',headers:options.headers||{},body:options.body});return {ok:r.ok,status:r.status,json:async()=>r.data};};}""")
   page.add_script_tag(content=(pub/'app.js').read_text())
   page.get_by_role('button',name='Entrar al espacio de trabajo').wait_for()
   page.screenshot(path=str(out/'login.png'),full_page=True)
   page.get_by_role('button',name='Entrar al espacio de trabajo').click();page.get_by_role('heading',name='Tu clínica, bajo control.').wait_for();ok('Interfaz: login contra el servidor local')
   page.screenshot(path=str(out/'home.png'),full_page=True)
   page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(400)
   assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
   assert page.locator('aside').evaluate('(e)=>e.getBoundingClientRect().right')<=0.1
   page.screenshot(path=str(out/'mobile.png'),full_page=True);ok('Diseño móvil sin desbordamiento, sidebar cerrado')
   page.get_by_role('button',name='Abrir menú').click();page.wait_for_timeout(300)
   expect(page.locator('aside')).to_have_class('sidebar open')
   page.locator('aside [data-nav="patients"]').click();page.get_by_role('heading',name='Tus pacientes, cerca.').wait_for();ok('Navegación móvil')
   page.set_viewport_size({'width':1440,'height':1000});page.wait_for_timeout(300)
   page.get_by_role('button',name='Nuevo paciente',exact=True).click()
   page.get_by_label('Nombre *',exact=True).fill('Prueba UI');page.get_by_label('Apellido',exact=True).fill('Demo');page.get_by_label('Teléfono *',exact=True).fill('+540000007777')
   page.get_by_role('button',name='Registrar paciente',exact=True).click()
   page.get_by_text('Prueba UI Demo',exact=True).wait_for();ok('Alta de paciente desde formulario')
   data=session.get(base+'/api/state').json();pid=next(x['id'] for x in data['patients'] if x['firstName']=='Prueba UI')
   page.get_by_label('Buscar pacientes',exact=True).fill('Prueba UI')
   assert page.locator('tbody tr').count()==1;ok('Búsqueda de pacientes')
   page.locator('tbody tr').first.click();page.get_by_role('heading',name='Ficha del paciente').wait_for()
   page.get_by_role('button',name='Editar',exact=True).click();page.get_by_label('Apellido',exact=True).fill('Actualizado')
   page.get_by_role('button',name='Guardar cambios',exact=True).click();page.get_by_text('Prueba UI Actualizado',exact=True).wait_for();ok('Edición de ficha')
   page.locator('aside [data-nav="schedule"]').click();page.get_by_role('button',name='Nuevo turno',exact=True).click()
   page.get_by_label('Paciente de prueba',exact=True).select_option(pid);page.get_by_label('Profesional',exact=True).select_option('doctor-1')
   page.get_by_label('Fecha',exact=True).fill('2031-11-01');page.get_by_label('Hora (Buenos Aires)',exact=True).fill('10:00')
   page.get_by_role('button',name='Agendar turno',exact=True).click()
   page.locator('.slot-booking').filter(has_text='Prueba UI Actualizado').wait_for();ok('Alta de turno desde agenda')
   a=next(x for x in session.get(base+'/api/state').json()['appointments'] if x['patientId']==pid)
   page.get_by_role('button',name='Nuevo turno',exact=True).click()
   page.get_by_label('Paciente de prueba',exact=True).select_option('patient-2');page.get_by_label('Profesional',exact=True).select_option('doctor-1')
   page.get_by_label('Fecha',exact=True).fill('2031-11-01');page.get_by_label('Hora (Buenos Aires)',exact=True).fill('10:00');page.get_by_role('button',name='Agendar turno',exact=True).click()
   expect(page.locator('dialog .form-error')).to_contain_text('superpone');ok('Error de conflicto visible en el formulario');page.get_by_role('button',name='Cerrar diálogo').click()
   page.locator(f'.slot-booking[data-id="{a["id"]}"]').click();page.get_by_label('Estado del turno',exact=True).select_option('CONFIRMED');page.get_by_role('button',name='Actualizar estado').click()
   expect(page.locator(f'.slot-booking[data-id="{a["id"]}"]')).to_contain_text('Confirmado');ok('Cambio de estado de turno')
   page.locator(f'.slot-booking[data-id="{a["id"]}"]').click();page.get_by_role('button',name='Reprogramar',exact=True).click()
   page.get_by_label('Hora (Buenos Aires)',exact=True).fill('10:30');page.get_by_role('button',name='Guardar reprogramación').click()
   page.locator(f'.slot-booking[data-id="{a["id"]}"]').wait_for();assert next(x for x in session.get(base+'/api/state').json()['appointments'] if x['id']==a['id'])['startAt'].startswith('2031-11-01T13:30');ok('Reprogramación persistida')
   page.locator('aside [data-nav="records"]').click();page.get_by_role('button',name='Nueva evolución',exact=True).click()
   page.get_by_label('Paciente de prueba',exact=True).select_option(pid);page.get_by_label('S · Subjetivo *',exact=True).fill('Texto ficticio de prueba UI.');page.get_by_label('P · Plan *',exact=True).fill('Validar el flujo de software, sin indicaciones médicas.');page.locator('dialog input[type=checkbox]').check();page.get_by_role('button',name='Guardar evolución',exact=True).click()
   page.locator('.record-card').wait_for();page.get_by_role('button',name='Verificar integridad',exact=True).click();page.get_by_text('Integridad comprobada',exact=True).wait_for();ok('Evolución SOAP y verificación de hash')
   page.get_by_role('button',name='Cerrar',exact=True).click();page.get_by_role('button',name='Agregar enmienda',exact=True).click();page.get_by_label('S · Subjetivo *',exact=True).fill('Enmienda UI de prueba.');page.get_by_label('P · Plan *',exact=True).fill('Conservar original.');page.locator('dialog input[type=checkbox]').check();page.get_by_role('button',name='Guardar enmienda',exact=True).click();expect(page.locator('.record-card')).to_have_count(2);ok('Enmienda sin sobrescribir el original')
   page.screenshot(path=str(out/'records.png'),full_page=True)
   page.locator('aside [data-nav="billing"]').click();page.get_by_role('button',name='Registrar pago demo',exact=True).click();page.get_by_label('Paciente de prueba',exact=True).select_option(pid);page.get_by_label('Importe en ARS *',exact=True).fill('12300');page.locator('dialog input[type=checkbox]').check();page.get_by_role('button',name='Guardar registro',exact=True).click();page.get_by_text('$ 12.300',exact=True).wait_for();ok('Registro manual de pago rotulado como demo')
   page.get_by_role('button',name='Nuevo borrador',exact=True).click();page.get_by_label('Paciente de prueba',exact=True).select_option(pid);page.get_by_label('Concepto *',exact=True).fill('Comprobante de prueba UI');page.get_by_label('Importe en ARS *',exact=True).fill('5000');page.get_by_role('button',name='Guardar borrador',exact=True).click();page.get_by_text('Comprobante de prueba UI',exact=True).wait_for();ok('Borrador interno sin emisión fiscal')
   page.locator('aside [data-nav="pipeline"]').click();page.get_by_role('button',name='Nuevo contacto',exact=True).click();page.get_by_label('Nombre *',exact=True).fill('Contacto UI');page.get_by_label('Teléfono *',exact=True).fill('+540000007778');page.get_by_role('button',name='Agregar contacto',exact=True).click();page.get_by_label('Etapa de Contacto UI',exact=True).select_option('QUALIFIED');page.locator('[data-drop="QUALIFIED"]').get_by_role('heading',name='Contacto UI',exact=True).wait_for();ok('Contacto y cambio de etapa Kanban')
   page.screenshot(path=str(out/'pipeline.png'),full_page=True)
   page.locator('aside [data-nav="integrations"]').click();page.get_by_role('heading',name='GoHighLevel',exact=True).wait_for();page.locator('[data-action="integration-detail"][data-id="highlevel"]').click();page.get_by_role('button',name='Comprobar bloqueo local').click();page.get_by_text('Bloqueo comprobado: no se ejecutó ninguna acción externa.').wait_for();ok('Conector sin falso estado de éxito');page.get_by_role('button',name='Cerrar',exact=True).click()
   page.screenshot(path=str(out/'integrations.png'),full_page=True)
   page.locator('aside [data-nav="settings"]').click();page.get_by_role('switch',name='Pausar asistente local').click();expect(page.get_by_role('switch',name='Pausar asistente local')).to_have_attribute('aria-checked','true');page.get_by_role('switch',name='Pausar asistente local').click();expect(page.get_by_role('switch',name='Pausar asistente local')).to_have_attribute('aria-checked','false');ok('Control operativo guardado en servidor')
   page.locator('aside [data-nav="home"]').click();page.get_by_role('button',name='Consultar mi operación').click();page.get_by_role('button',name='Agenda de hoy',exact=True).click();page.locator('.chat-bubble').filter(has_text='Hoy hay 7 turnos activos').wait_for();ok('Asistente resume datos reales de la demo');page.get_by_role('button',name='Cerrar diálogo').click()
   page.get_by_role('button',name='Cerrar sesión').click();page.get_by_role('button',name='Acceder como Super Admin').click();page.get_by_role('button',name='Entrar al espacio de trabajo').click();page.get_by_role('heading',name='Administración de espacios.').wait_for();ok('Acceso diferenciado de Super Admin')
   page.get_by_role('button',name='Nueva clínica demo').click();page.get_by_label('Nombre *',exact=True).fill('Clínica UI Demo');page.get_by_role('button',name='Crear clínica',exact=True).click();page.get_by_text('Clínica UI Demo',exact=True).wait_for();ok('Alta de workspace sin datos clínicos compartidos')
   page.screenshot(path=str(out/'admin.png'),full_page=True)
   assert not errors,errors;ok('Sin excepciones JavaScript en los flujos probados')
   # Render the standalone HTML without navigating around the environment's browser policy.
   preview=browser.new_page(viewport={'width':1440,'height':1000});preview.set_default_timeout(7000)
   preview_errors=[];preview.on('pageerror',lambda e:preview_errors.append(str(e)))
   preview.set_content((root/'dist/Abundance-Clinic-OS-Vista-Previa.html').read_text(),wait_until='load')
   preview.get_by_role('button',name='Entrar al espacio de trabajo').click();preview.get_by_role('heading',name='Tu clínica, bajo control.').wait_for();ok('HTML autocontenido renderiza sin servidor ni recursos externos')
   # Verify offline hashing equals the canonical Node-compatible SHA-256 representation.
   r=preview.evaluate("""async()=>await window.PREVIEW_API('/api/records','POST',{patientId:'patient-1',subjective:'Prueba de integridad áéí',objective:'',assessment:'',plan:'Demostración'})""")
   record_payload={k:r[k] for k in ['id','workspaceId','patientId','type']};record_payload['content']=json.dumps(r['content'],ensure_ascii=False,separators=(',',':'))
   for k in ['author','createdAt','previousHash','amendmentOf']:record_payload[k]=r[k]
   expected=hashlib.sha256(json.dumps(record_payload,ensure_ascii=False,separators=(',',':')).encode()).hexdigest();assert expected==r['hash'];ok('Hash de la vista previa coincide con SHA-256 independiente')
   preview.locator('aside [data-nav="patients"]').click();preview.get_by_role('button',name='Nuevo paciente',exact=True).click();preview.get_by_label('Nombre *',exact=True).fill('Vista Previa');preview.get_by_label('Teléfono *',exact=True).fill('+540000006666');preview.get_by_role('button',name='Registrar paciente',exact=True).click();preview.get_by_text('Vista Previa',exact=True).wait_for();ok('Formulario de paciente en modo offline')
   assert not preview_errors,preview_errors;ok('Sin excepciones JavaScript en la vista previa')
   browser.close()
 finally:
  server.terminate();server.wait(timeout=5)
(out/'ui-tests.json').write_text(json.dumps({'passed':len(results),'checks':results,'harness':'Chromium renderizado con set_content. Interfaz conectada al HTTP local mediante puente Playwright/Python porque la navegación directa está bloqueada por políticas del entorno. No se modificaron políticas. La vista previa se renderizó como HTML autocontenido. No prueba navegación de red ni CSP en navegador de producción.','screenshots':['home.png','login.png','mobile.png','records.png','pipeline.png','integrations.png','admin.png']},ensure_ascii=False,indent=2))
print('TOTAL PASSED',len(results),flush=True)
