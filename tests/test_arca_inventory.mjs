import assert from 'node:assert';

const BASE = 'http://127.0.0.1:3000';

async function req(path, method = 'GET', body = null, cookie = null, csrf = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

async function runTests() {
  console.log('🧪 Iniciando tests de Facturación Oficial ARCA y Módulo de Inventario...');

  // 1. Iniciar sesión como médico
  const loginRes = await req('/api/login', 'POST', {
    email: 'admin@clinica.com',
    password: 'admin123'
  });
  assert.strictEqual(loginRes.status, 200, 'Login falló');
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
  const csrf = loginRes.json.csrf;
  assert.ok(cookie, 'No se recibió cookie de sesión');
  assert.ok(csrf, 'No se recibió token CSRF');
  console.log('✓ Sesión iniciada correctamente');

  // 2. Obtener estado clínico y verificar inventario inicial
  const stateRes = await req('/api/state', 'GET', null, cookie, csrf);
  assert.strictEqual(stateRes.status, 200, 'Error al obtener state');
  const state = stateRes.json;
  assert.ok(Array.isArray(state.inventory), 'inventory no está presente en state');
  assert.ok(state.inventory.length >= 10, `Se esperaban al menos 10 insumos médicos, recibidos: ${state.inventory.length}`);
  console.log(`✓ Inventario cargado en state con ${state.inventory.length} insumos médicos`);

  // 3. Verificar que las facturas previas tienen CAE oficial y número de comprobante
  assert.ok(Array.isArray(state.invoices), 'invoices no está presente en state');
  for (const inv of state.invoices) {
    assert.ok(inv.cae, `Factura ${inv.id} no posee CAE`);
    assert.ok(inv.invoiceNumber, `Factura ${inv.id} no posee invoiceNumber`);
    assert.ok(inv.qrUrl, `Factura ${inv.id} no posee qrUrl`);
  }
  console.log(`✓ ${state.invoices.length} facturas existentes regularizadas con CAE y código QR ARCA`);

  // 4. Emitir una nueva Factura Oficial ARCA
  const patient = state.patients[0];
  const newInvRes = await req('/api/invoices', 'POST', {
    patientId: patient.id,
    concept: 'Consulta de Cardiología y Electrocardiograma',
    amount: 45000,
    invoiceType: 'B'
  }, cookie, csrf);
  assert.strictEqual(newInvRes.status, 201, `Error creando factura: ${newInvRes.text}`);
  const newInv = newInvRes.json;
  assert.ok(newInv.cae, 'Nueva factura no generó CAE de ARCA');
  assert.ok(newInv.caeVto, 'Nueva factura no generó fecha de vencimiento CAE');
  assert.ok(newInv.qrUrl, 'Nueva factura no generó código QR de validación fiscal');
  assert.ok(newInv.invoiceNumber, 'Nueva factura no generó número correlativo');
  assert.strictEqual(newInv.invoiceType, 'B', 'Tipo de comprobante incorrecto');
  console.log(`✓ Nueva Factura B emitida: N° ${newInv.invoiceNumber} con CAE ${newInv.cae}`);

  // 5. Descargar / Ver Documento Oficial HTML de la Factura
  const docRes = await req(`/api/invoices/${newInv.id}/document`, 'GET', null, cookie, csrf);
  assert.strictEqual(docRes.status, 200, 'Error obteniendo documento de factura');
  assert.ok(docRes.headers.get('content-type')?.includes('text/html'), 'El documento no es HTML');
  assert.ok(docRes.text.includes('FACTURA B'), 'El HTML no contiene el encabezado FACTURA B');
  assert.ok(docRes.text.includes(newInv.cae), 'El HTML no contiene el CAE emitido');
  assert.ok(docRes.text.includes('AUTORIZADO POR ARCA'), 'El HTML no contiene el badge oficial de ARCA');
  assert.ok(docRes.text.includes('api.qrserver.com'), 'El HTML no contiene el QR normativo');
  console.log('✓ Documento oficial A4 de factura ARCA renderizado con éxito');

  // 6. Compartir comprobante por WhatsApp
  const waRes = await req(`/api/invoices/${newInv.id}/whatsapp`, 'POST', {}, cookie, csrf);
  assert.strictEqual(waRes.status, 200, 'Error generando enlace WhatsApp');
  assert.ok(waRes.json.waLink, 'No se generó waLink');
  assert.ok(waRes.json.waLink.includes('wa.me'), 'Enlace de WhatsApp no es válido');
  console.log('✓ Enlace de envío por WhatsApp generado exitosamente');

  // 7. Gestión de Inventario: Crear nuevo insumo
  const newSupplyRes = await req('/api/inventory', 'POST', {
    name: 'Catéter Endovenoso Teflón 20G (Caja x 50)',
    sku: 'CAT-20G',
    category: 'Descartables',
    quantity: 15,
    minQuantity: 5,
    unit: 'cajas',
    lotNumber: 'LT-77610',
    expiryDate: '2028-10-15',
    notes: 'Uso en internación y colocación de vías periféricas'
  }, cookie, csrf);
  assert.strictEqual(newSupplyRes.status, 201, 'Error creando insumo');
  const supply = newSupplyRes.json;
  assert.strictEqual(supply.name, 'Catéter Endovenoso Teflón 20G (Caja x 50)');
  assert.strictEqual(supply.quantity, 15);
  console.log(`✓ Nuevo insumo creado: ${supply.name} (Stock: ${supply.quantity})`);

  // 8. Ajustar Stock: Descontar por consumo en consulta médica
  const adjRes = await req(`/api/inventory/${supply.id}/stock`, 'PATCH', {
    delta: -3,
    reason: 'Consumo en procedimiento de canalización de vía'
  }, cookie, csrf);
  assert.strictEqual(adjRes.status, 200, 'Error ajustando stock');
  assert.strictEqual(adjRes.json.quantity, 12, 'El stock no se redujo a 12');
  console.log(`✓ Stock ajustado (-3 unidades). Nuevo balance: ${adjRes.json.quantity} ${supply.unit}`);

  // 9. Modificar detalles del insumo
  const patchRes = await req(`/api/inventory/${supply.id}`, 'PATCH', {
    minQuantity: 8,
    notes: 'Actualizado: umbral mínimo incrementado por alta demanda'
  }, cookie, csrf);
  assert.strictEqual(patchRes.status, 200, 'Error actualizando insumo');
  assert.strictEqual(patchRes.json.minQuantity, 8);
  console.log('✓ Insumo modificado correctamente');

  // 10. Eliminar insumo creado
  const delRes = await req(`/api/inventory/${supply.id}`, 'DELETE', null, cookie, csrf);
  assert.strictEqual(delRes.status, 200, 'Error eliminando insumo');
  console.log('✓ Insumo eliminado del inventario');

  console.log('\n🎉 TODOS LOS TESTS DE FACTURACIÓN ARCA E INVENTARIO PASARON CON ÉXITO AL 100%!');
}

runTests().catch(err => {
  console.error('❌ Test fallido:', err);
  process.exit(1);
});
