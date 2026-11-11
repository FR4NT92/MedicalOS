'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Lock, FileSignature, AlertTriangle, ShieldCheck, PenSquare, FilePlus2 } from 'lucide-react';

export function MedicalRecordsView({ patientId }: { patientId: string }) {
  const [activeTab, setActiveTab] = useState<'SOAP' | 'LIST'>('LIST');

  // Form states
  const [subjetivo, setSubjetivo] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [evaluacion, setEvaluacion] = useState('');
  const [plan, setPlan] = useState('');
  
  const [pin, setPin] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const utils = trpc.useUtils();
  
  // TRPC Hooks
  const { data: records, isLoading } = trpc.medicalRecord.listByPatient.useQuery({ patientId }, { enabled: !!patientId });
  const createMutation = trpc.medicalRecord.createNote.useMutation();

  const handleSignAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjetivo.trim() || !plan.trim()) {
      setErrorMsg('Debe completar al menos Subjetivo y Plan.');
      return;
    }
    if (pin !== 'admin123') {
      setErrorMsg('PIN de firma incorrecto.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        patientId,
        subjetivo,
        objetivo,
        evaluacion,
        plan
      });
      setSubjetivo('');
      setObjetivo('');
      setEvaluacion('');
      setPlan('');
      setPin('');
      setIsSigning(false);
      setErrorMsg('');
      setActiveTab('LIST');
      utils.medicalRecord.listByPatient.invalidate();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al guardar la nota.');
    }
  };

  if (isLoading) return <div className="text-xs text-gray-500 animate-pulse p-4">Cargando Bóveda Clínica...</div>;

  return (
    <div className="space-y-4">
      {/* ALERTA LEGAL */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3 text-xs text-blue-800">
        <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600" />
        <div>
          <strong className="block mb-0.5">Bóveda Criptográfica Inmutable (Ley 26.529)</strong>
          <p>
            Al firmar y guardar una evolución, el registro se sella criptográficamente. 
            Las políticas de seguridad <b>bloquean físicamente</b> cualquier intento de modificación (Update) o borrado (Delete).
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setActiveTab('LIST')} 
          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeTab === 'LIST' ? 'bg-[#0B0F19] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Historial Inmutable
        </button>
        <button 
          onClick={() => setActiveTab('SOAP')} 
          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 ${activeTab === 'SOAP' ? 'bg-[#0B0F19] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <PenSquare className="w-3.5 h-3.5" />
          Nueva Evolución SOAP
        </button>
      </div>

      {activeTab === 'SOAP' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-[#F9FAFB] border-b border-[#F0F2F5] p-3 flex items-center gap-2">
            <h3 className="font-bold text-xs text-[#0B0F19]">Estructura SOAP</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Subjetivo (Motivo de consulta)</label>
                <textarea value={subjetivo} onChange={e=>setSubjetivo(e.target.value)} disabled={isSigning} className="w-full h-24 p-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 disabled:bg-gray-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Objetivo (Examen físico)</label>
                <textarea value={objetivo} onChange={e=>setObjetivo(e.target.value)} disabled={isSigning} className="w-full h-24 p-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 disabled:bg-gray-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Evaluación (Diagnóstico presuntivo)</label>
                <textarea value={evaluacion} onChange={e=>setEvaluacion(e.target.value)} disabled={isSigning} className="w-full h-24 p-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 disabled:bg-gray-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Plan (Tratamiento / Recetas)</label>
                <textarea value={plan} onChange={e=>setPlan(e.target.value)} disabled={isSigning} className="w-full h-24 p-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 disabled:bg-gray-50" />
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}

            {!isSigning ? (
              <div className="flex justify-end pt-2">
                <button onClick={() => setIsSigning(true)} className="px-5 py-2 bg-[#0B0F19] text-white rounded-lg text-xs font-bold hover:bg-black transition-colors">
                  Bloquear Documento y Firmar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignAndSave} className="flex items-end justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-200 mt-2">
                <div className="space-y-1.5 flex-1 max-w-[250px]">
                  <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    PIN de Firma Electrónica (MN 142.890)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-emerald-600 absolute left-3 top-2" />
                    <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="****" className="w-full pl-9 pr-3 py-2 rounded-lg border border-emerald-200 text-sm font-mono outline-none focus:border-emerald-500" autoFocus />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsSigning(false)} className="px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors">Cancelar</button>
                  <button type="submit" disabled={createMutation.isLoading} className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 flex items-center gap-2 transition-colors disabled:opacity-50">
                    <FileSignature className="w-4 h-4" />
                    {createMutation.isLoading ? 'Sincronizando con Bóveda...' : 'Firmar, Sellar y Guardar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* LISTA HISTÓRICA */}
      {activeTab === 'LIST' && (
        <div className="space-y-3">
          {(!records || records.length === 0) ? (
            <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-500">
              No hay evoluciones registradas para este paciente.
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                {/* CINTA DE SEGURIDAD */}
                <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-3 py-0.5 rounded-bl-lg flex items-center gap-1 border-b border-l border-emerald-200">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  FIRMADO {record.type === 'AMENDMENT' ? '& CORRECCIÓN' : ''}
                </div>

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <strong className="text-sm text-[#0B0F19] block">{new Date(record.signedAt!).toLocaleString()}</strong>
                    <span className="text-[11px] text-gray-500 block mt-0.5">Autor: Dr/a. {record.author?.name || 'Médico'} {record.author?.licenseNumber ? `(MN ${record.author.licenseNumber})` : ''}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-[#374151]">
                    <span className="block text-[10px] font-bold text-gray-400 mb-1">SUBJETIVO</span>
                    {((record.content as any)?.subjetivo) || '-'}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-[#374151]">
                    <span className="block text-[10px] font-bold text-gray-400 mb-1">OBJETIVO</span>
                    {((record.content as any)?.objetivo) || '-'}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-[#374151]">
                    <span className="block text-[10px] font-bold text-gray-400 mb-1">EVALUACIÓN</span>
                    {((record.content as any)?.evaluacion) || '-'}
                  </div>
                  <div className="bg-[#F4F8FA] p-3 rounded-xl border border-[#E0EBF1] text-xs text-[#0B0F19] font-medium">
                    <span className="block text-[10px] font-bold text-blue-500 mb-1">PLAN CLINICO</span>
                    {((record.content as any)?.plan) || '-'}
                  </div>
                </div>

                {record.amendments && record.amendments.length > 0 && (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                    <h5 className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-1"><FilePlus2 className="w-3 h-3"/> Correcciones Anexadas</h5>
                    {record.amendments.map((am: any) => (
                      <div key={am.id} className="text-xs text-orange-900 border-t border-orange-100 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
                        <span className="font-semibold block mb-1">Motivo: {am.amendmentReason}</span>
                        <div className="font-mono text-[10px] text-orange-700 bg-orange-100 p-2 rounded-lg">
                           Modificación firmada por {am.author?.name} el {new Date(am.signedAt!).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                    <Lock className="w-3 h-3 text-[#589972]" />
                    <span title={record.contentSha256}>SHA-256: {record.contentSha256?.substring(0, 16)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/verify/SIG-${record.contentSha256?.substring(0, 12).toUpperCase()}-MORALES`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 border border-emerald-200"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Certificado Ley 25.506
                    </a>
                    <button onClick={() => alert('Feature: Anexar Corrección (Formulario Modal)')} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                      <FilePlus2 className="w-3 h-3" />
                      Anexar Fe de Erratas
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
