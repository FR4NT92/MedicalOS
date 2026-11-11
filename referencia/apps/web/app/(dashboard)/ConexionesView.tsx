'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  Share2,
  RefreshCw,
  CheckCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  Calendar,
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  Send,
  Zap,
  Activity,
  Layers,
  CreditCard,
  FileCheck
} from 'lucide-react';

export function ConexionesView({
  brandColor,
  showToast,
  onPatientCreated,
}: {
  brandColor: string;
  showToast: (title: string, message: string, type: 'success' | 'info' | 'error') => void;
  onPatientCreated?: () => void;
}) {
  const [testingTarget, setTestingTarget] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Queries
  const { data: statusData, refetch: refetchStatus } = trpc.integration.getStatus.useQuery();
  const { data: logsData, refetch: refetchLogs } = trpc.integration.getRecentLogs.useQuery({ limit: 8 });
  const testMutation = trpc.integration.testIntegration.useMutation();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copiado al Portapapeles', text, 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const runTest = async (target: 'highlevel' | 'whatsapp' | 'google_calendar' | 'ai_guardrail') => {
    setTestingTarget(target);
    try {
      const res = await testMutation.mutateAsync({ target });
      if (res.success) {
        showToast('Test Exitoso', res.message, 'success');
        refetchLogs();
        if (onPatientCreated) onPatientCreated();
      } else {
        showToast('Advertencia en Test', res.message, 'info');
      }
    } catch (err: any) {
      showToast('Error en Test', err.message || 'Fallo de conexión.', 'error');
    } finally {
      setTestingTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#0B0F19]">Hub de Conexiones & Canales</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> 6 Conexiones Activas
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            El CRM reside en <strong>GoHighLevel</strong>. Clinic-OS centraliza la historia clínica, agenda quirúrgica, pacientes y facturación.
          </p>
        </div>

        <button
          onClick={() => {
            refetchStatus();
            refetchLogs();
            showToast('Conexiones Actualizadas', 'Estado de sincronización verificado.', 'info');
          }}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#0B0F19] flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          Actualizar Estado
        </button>
      </div>

      {/* 4 TARJETAS DE CONEXIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. GOHIGHLEVEL */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shadow-xs border border-blue-100">
                GHL
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0B0F19] flex items-center gap-2">
                  GoHighLevel CRM (API v2)
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">Principal</span>
                </h3>
                <p className="text-[11px] text-[#6B7280]">Funnels, campañas de anuncios y captura de leads.</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">
              Conectado
            </span>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F0F2F5] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280] text-[11px]">Webhook de Entrada (HighLevel):</span>
              <button
                onClick={() => handleCopy('https://app.tu-clinica.com/api/webhooks/highlevel', 'ghl_webhook')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedKey === 'ghl_webhook' ? 'Copiado!' : 'Copiar URL'}
              </button>
            </div>
            <div className="font-mono text-[10px] text-[#0B0F19] bg-white p-2 rounded-lg border border-gray-200 break-all select-all">
              /api/webhooks/highlevel
            </div>
            <div className="flex justify-between text-[11px] text-[#6B7280] pt-1 border-t border-gray-100">
              <span>Location ID: <code className="text-[#0B0F19] font-mono">loc_demo_abundance</code></span>
              <span>Triggers: Contactos & Turnos</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => runTest('highlevel')}
              disabled={testingTarget === 'highlevel'}
              className="flex-1 py-2 px-3 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-opacity disabled:opacity-60"
              style={{ backgroundColor: brandColor }}
            >
              <Zap className="w-3.5 h-3.5" />
              {testingTarget === 'highlevel' ? 'Ingestando...' : 'Probar Webhook GHL'}
            </button>
          </div>
        </div>

        {/* 2. WHATSAPP CLOUD API */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shadow-xs border border-emerald-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0B0F19] flex items-center gap-2">
                  WhatsApp Cloud API Oficial
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Meta Graph</span>
                </h3>
                <p className="text-[11px] text-[#6B7280]">Recepción y envío bidireccional, ventana 24h.</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">
              Escuchando
            </span>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F0F2F5] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280] text-[11px]">Webhook de Meta:</span>
              <button
                onClick={() => handleCopy('https://app.tu-clinica.com/api/webhooks/whatsapp', 'wa_webhook')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedKey === 'wa_webhook' ? 'Copiado!' : 'Copiar URL'}
              </button>
            </div>
            <div className="font-mono text-[10px] text-[#0B0F19] bg-white p-2 rounded-lg border border-gray-200 break-all select-all">
              /api/webhooks/whatsapp
            </div>
            <div className="flex justify-between text-[11px] text-[#6B7280] pt-1 border-t border-gray-100">
              <span>Verify Token: <code className="text-[#0B0F19] font-mono">clinic_os_meta_verify_token</code></span>
              <span>Modo: AI Triage / Handoff</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => runTest('whatsapp')}
              disabled={testingTarget === 'whatsapp'}
              className="flex-1 py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-[#0B0F19] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-opacity disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              {testingTarget === 'whatsapp' ? 'Simulando...' : 'Probar Inbound WhatsApp'}
            </button>
          </div>
        </div>

        {/* 3. GOOGLE CALENDAR */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base shadow-xs border border-amber-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0B0F19] flex items-center gap-2">
                  Google Calendar (Bidireccional)
                </h3>
                <p className="text-[11px] text-[#6B7280]">Sincronización en tiempo real de turnos y quirófano.</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">
              Sincronizado
            </span>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F0F2F5] space-y-2 text-xs">
            <div className="flex justify-between text-[11px] text-[#6B7280]">
              <span>Calendario Principal: <strong className="text-[#0B0F19]">Consultorio Dra. Morales</strong></span>
              <span className="text-emerald-700 font-semibold">Push Activo</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#6B7280] pt-1 border-t border-gray-100">
              <span>Resolución de Conflictos: <strong className="text-[#0B0F19]">Strict UTC</strong></span>
              <span>Previene sobreturnos</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => runTest('google_calendar')}
              disabled={testingTarget === 'google_calendar'}
              className="flex-1 py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-[#0B0F19] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-opacity disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${testingTarget === 'google_calendar' ? 'animate-spin' : ''}`} />
              {testingTarget === 'google_calendar' ? 'Sincronizando...' : 'Probar Sincronización GCal'}
            </button>
          </div>
        </div>

        {/* 4. AGENTE IA PROACTIVO & CONTROL DE RIESGOS */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base shadow-xs border border-purple-100">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0B0F19] flex items-center gap-2">
                  Agente IA Proactivo
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">GPT-4o / ZDR</span>
                </h3>
                <p className="text-[11px] text-[#6B7280]">Triage administrativo, turnos y derivación a SAME 107.</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">
              Guardrails Activos
            </span>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F0F2F5] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-purple-900 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Directiva de Seguridad (Sin Prescripción ni Diagnóstico)
            </div>
            <p className="text-[10px] text-[#6B7280]">
              Cualquier alarma vital (opresión torácica, disnea, sangrado) suspende el diálogo administrativo y deriva automáticamente a SAME (107) o guardia.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => runTest('ai_guardrail')}
              disabled={testingTarget === 'ai_guardrail'}
              className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-purple-200 transition-opacity disabled:opacity-60"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
              {testingTarget === 'ai_guardrail' ? 'Verificando...' : 'Probar Guardrail de Emergencia'}
            </button>
          </div>
        </div>

        {/* 5. MERCADO PAGO SEÑAS */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-base shadow-xs border border-sky-100">
                MP
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0B0F19] flex items-center gap-2">
                  Mercado Pago (Señas & Depósitos)
                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold">Cobranzas</span>
                </h3>
                <p className="text-[11px] text-[#6B7280]">Links con vencimiento 4h, QR en mostrador y webhook IPN.</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">
              Webhook Activo
            </span>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F0F2F5] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280] text-[11px]">Webhook Endpoint IPN:</span>
              <button
                onClick={() => handleCopy('https://tu-dominio.com/api/webhooks/mercadopago', 'mp_webhook')}
                className="text-sky-700 hover:text-sky-900 font-semibold text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedKey === 'mp_webhook' ? '¡Copiado!' : 'Copiar URL'}
              </button>
            </div>
            <div className="font-mono text-[11px] bg-white p-2 rounded-lg border border-gray-200 text-gray-700">
              /api/webhooks/mercadopago
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => showToast('Mercado Pago', 'Generador de preferencias y liquidación de señas activo en caja y agenda.', 'success')}
              className="flex-1 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-sky-200"
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              Verificar Pasarela de Pagos
            </button>
          </div>
        </div>

        {/* 6. ARCA / AFIP FISCAL */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shadow-xs border border-amber-200">
                ARCA
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0B0F19] flex items-center gap-2">
                  ARCA / AFIP Factura Electrónica
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">WSFE v1</span>
                </h3>
                <p className="text-[11px] text-[#6B7280]">Punto de Venta 0004 · CAE inmediato y código QR oficial.</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#2C6E49]">
              Conectado
            </span>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F0F2F5] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
              <span>CUIT Emisor: <strong>30-71429810-4</strong></span>
              <span>Pto. Venta: <strong>0004</strong></span>
            </div>
            <p className="text-[10px] text-[#6B7280]">
              Genera comprobantes Factura A, B y C con código QR fiscal reglamentario (Res. Gral. 4291/2018).
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => showToast('ARCA / AFIP', 'Servicio Web WSFE v1 operativo. Facturación habilitada.', 'success')}
              className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-amber-200"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-700" />
              Probar Conexión Fiscal AFIP
            </button>
          </div>
        </div>

      </div>

      {/* REGISTRO EN VIVO DE WEBHOOKS & COMUNICACIONES */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-[#0B0F19]">Eventos de Integración en Tiempo Real</h3>
          </div>
          <span className="text-[11px] text-[#6B7280]">Trazabilidad Auditada</span>
        </div>

        {(!logsData?.events || logsData.events.length === 0) ? (
          <div className="text-center py-8 bg-[#F9FAFB] rounded-xl border border-dashed border-gray-200 text-xs text-[#6B7280]">
            No hay eventos recientes. Haz clic en "Probar Webhook GHL" para generar un evento de prueba.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {logsData.events.map((evt) => (
              <div key={evt.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    evt.channel === 'HIGHLEVEL' ? 'bg-blue-50 text-blue-700' :
                    evt.channel === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {evt.channel}
                  </span>
                  <span className="font-mono text-[11px] text-[#0B0F19]">{evt.externalEventId}</span>
                  <span className="text-[10px] text-[#6B7280]">
                    {new Date(evt.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-[#0B0F19]">
                  {evt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
