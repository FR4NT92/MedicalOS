"use client";

import React, { useState } from "react";
import { 
  Building2, Users, Database, Power, Trash2, 
  ToggleLeft, ToggleRight, ShieldCheck, LogOut, Plus, AlertTriangle,
  Share2, ArrowLeft, CheckCircle, ExternalLink
} from "lucide-react";
import { ConexionesView } from "../(dashboard)/ConexionesView";

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'conexiones' | 'seguridad'>('tenants');
  const [tenants, setTenants] = useState([
    { id: "1", name: "Clínica Buenos Aires", slug: "clinica-buenos-aires", users: 14, storage: "12.4 GB", status: "active" },
    { id: "2", name: "Centro Estético Lumiere", slug: "lumiere-aesthetics", users: 5, storage: "3.1 GB", status: "active" },
  ]);

  const [featureFlags, setFeatureFlags] = useState({
    aiCopilot: true,
    whatsappWebhooks: true,
    billingAFIP: false,
  });

  const [newTenantName, setNewTenantName] = useState("");
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'error') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    window.location.href = "/login";
  };

  const toggleTenantStatus = (id: string) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "active" ? "suspended" : "active" } : t));
    showToast("Estado Actualizado", "El estado del tenant fue modificado.", "info");
  };

  const deleteTenant = (id: string) => {
    if(confirm("¿Estás seguro de ELIMINAR todo el tenant y sus datos? Esta acción es irreversible.")) {
      setTenants(prev => prev.filter(t => t.id !== id));
      showToast("Tenant Eliminado", "La clínica y sus registros fueron removidos.", "error");
    }
  };

  const addTenant = () => {
    if (!newTenantName) return;
    setTenants(prev => [...prev, {
      id: Date.now().toString(),
      name: newTenantName,
      slug: newTenantName.toLowerCase().replace(/\s+/g, "-"),
      users: 1,
      storage: "0 GB",
      status: "active"
    }]);
    setNewTenantName("");
    setShowAddTenant(false);
    showToast("Clínica Registrada", "Nuevo tenant creado con esquema aislado.", "success");
  };

  const toggleFlag = (key: keyof typeof featureFlags) => {
    setFeatureFlags(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast("Kill Switch", `Interruptor ${key} ${updated[key] ? 'Activado' : 'Desactivado'}`, updated[key] ? 'success' : 'error');
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#0B0F19] p-4 sm:p-6 font-sans flex flex-col">
      {/* TOAST FLOTANTE */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs border border-gray-700 animate-in fade-in slide-in-from-top-2">
          <div className="w-2 h-2 rounded-full bg-[#589972] animate-pulse"></div>
          <div>
            <div className="font-bold">{toast.title}</div>
            <div className="text-gray-300 text-[11px]">{toast.message}</div>
          </div>
        </div>
      )}

      {/* HEADER SUPER ADMIN */}
      <header className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 mb-5 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#E8F5EE] text-[#589972] p-3 rounded-2xl border border-[#589972]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">Master Command Center</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#111827] text-white">Super Admin</span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Gestión de Clínicas, Webhooks Centrales & Seguridad Multitenant</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/"
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Clínica</span>
          </a>
          <button 
            onClick={handleLogout} 
            className="bg-gray-50 hover:bg-gray-100 p-2.5 sm:p-3 rounded-2xl transition-colors border border-gray-200"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* NAVEGACIÓN SUPER ADMIN */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'tenants'
              ? 'bg-[#111827] text-white border-[#111827] shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Tenants Clínicos ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab('conexiones')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'conexiones'
              ? 'bg-[#111827] text-white border-[#111827] shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Hub de Conexiones & Canales (GHL, WhatsApp, GCal, IA)
        </button>

        <button
          onClick={() => setActiveTab('seguridad')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'seguridad'
              ? 'bg-[#111827] text-white border-[#111827] shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Power className="w-4 h-4" />
          Kill Switches & Banderas
        </button>
      </div>

      {/* TAB 1: TENANTS */}
      {activeTab === 'tenants' && (
        <div className="grid grid-cols-12 gap-6 flex-1">
          <div className="col-span-12 flex flex-col gap-6">
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xs flex-1">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-[#111827]">
                    <Building2 className="text-[#589972] w-5 h-5" />
                    Clínicas Registradas (Multitenant Aislado)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Cada clínica posee tenant_id aislado en base de datos PostgreSQL con RLS.</p>
                </div>
                <button 
                  onClick={() => setShowAddTenant(!showAddTenant)}
                  className="bg-[#589972] hover:bg-[#458B63] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors w-max"
                >
                  <Plus className="w-4 h-4" /> Registrar Nueva Clínica
                </button>
              </div>

              {showAddTenant && (
                <div className="mb-6 p-5 bg-[#F9FAFB] rounded-2xl border border-gray-200 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Nombre de la Nueva Clínica</label>
                    <input 
                      type="text" 
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#589972] focus:ring-1 focus:ring-[#589972] outline-none transition-all"
                      placeholder="Ej. Clínica Santa María..."
                    />
                  </div>
                  <button onClick={addTenant} className="bg-[#111827] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap w-full sm:w-auto">
                    Crear Tenant
                  </button>
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F9FAFB] text-gray-500 text-xs border-b border-gray-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Workspace / Clínica</th>
                      <th className="px-5 py-4 font-semibold">Infraestructura</th>
                      <th className="px-5 py-4 font-semibold">Estado</th>
                      <th className="px-5 py-4 font-semibold text-right">Master Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tenants.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-500 mt-1 font-mono">{t.slug}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /> {t.users} médicos / staff</div>
                            <div className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-gray-400" /> {t.storage} historias clínicas</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {t.status === "active" ? (
                            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#E8F5EE] text-[#1A422B] border border-[#589972]/30 flex items-center gap-1.5 w-max">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#589972] animate-pulse"></div>
                              Operativo
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1.5 w-max">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                              Suspendido
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => toggleTenantStatus(t.id)}
                              className={"p-2 rounded-xl border transition-colors " + (t.status === "active" ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600" : "bg-[#E8F5EE] hover:bg-[#D2E7DA] border-[#589972]/30 text-[#589972]")}
                              title={t.status === "active" ? "Suspender Acceso" : "Restaurar Acceso"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteTenant(t.id)}
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors"
                              title="Eliminar Tenant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HUB DE CONEXIONES Y CANALES (EXCLUSIVO SUPER ADMIN) */}
      {activeTab === 'conexiones' && (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xs flex-1">
          <ConexionesView 
            brandColor="#589972" 
            showToast={showToast}
          />
        </div>
      )}

      {/* TAB 3: KILL SWITCHES Y BANDERAS */}
      {activeTab === 'seguridad' && (
        <div className="grid grid-cols-12 gap-6 flex-1">
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xs">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-[#111827]">
                <Power className="text-purple-600 w-5 h-5" />
                Kill Switches Globales de Seguridad
              </h3>
              <p className="text-xs text-gray-500 mb-6">Interrumpen de forma inmediata el flujo de datos si un servicio externo experimenta incidentes.</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-gray-200">
                  <div>
                    <div className="font-bold text-sm text-gray-900">IA Copilot (OpenAI GPT-4o / Triage)</div>
                    <div className="text-[11px] text-gray-500 mt-1">Suspende el triage automatizado por IA</div>
                  </div>
                  <button onClick={() => toggleFlag("aiCopilot")} className={"transition-colors " + (featureFlags.aiCopilot ? "text-[#589972]" : "text-gray-400")}>
                    {featureFlags.aiCopilot ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-gray-200">
                  <div>
                    <div className="font-bold text-sm text-gray-900">Webhooks Meta WhatsApp Cloud API</div>
                    <div className="text-[11px] text-gray-500 mt-1">Pausa la ingesta entrante de mensajes</div>
                  </div>
                  <button onClick={() => toggleFlag("whatsappWebhooks")} className={"transition-colors " + (featureFlags.whatsappWebhooks ? "text-[#589972]" : "text-gray-400")}>
                    {featureFlags.whatsappWebhooks ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-gray-200">
                  <div>
                    <div className="font-bold text-sm text-gray-900">Facturación Electrónica ARCA (AFIP)</div>
                    <div className="text-[11px] text-gray-500 mt-1">Habilita/deshabilita CAE de facturas</div>
                  </div>
                  <button onClick={() => toggleFlag("billingAFIP")} className={"transition-colors " + (featureFlags.billingAFIP ? "text-[#589972]" : "text-gray-400")}>
                    {featureFlags.billingAFIP ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 text-xs items-start">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">Al desactivar un módulo, el impacto es <b>inmediato</b> en todos los Tenants activos en producción. Usar únicamente ante contingencias técnicas o mantenimiento programado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
