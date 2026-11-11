'use client';

import React, { useState } from 'react';
import { ShieldCheck, Download, Filter, Search, Lock, CheckCircle2 } from 'lucide-react';

interface AuditItem {
  id: number;
  action: string;
  resourceType: string;
  resourceId: string;
  user: string;
  ipAddress: string;
  timestamp: string;
  tamperProofHash: string;
}

const mockAuditLogs: AuditItem[] = [
  {
    id: 104,
    action: 'SIGN_MANIFEST_21CFR11',
    resourceType: 'fhir_clinical_impression',
    resourceId: 'imp-991-soap',
    user: 'Dr. David Morales (MN-145892)',
    ipAddress: '192.168.1.45',
    timestamp: '2026-09-24T14:48:12Z',
    tamperProofHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 103,
    action: 'AI_DISPATCH',
    resourceType: 'speech_to_intent',
    resourceId: 'voice-session-4412',
    user: 'Dr. David Morales (MN-145892)',
    ipAddress: '192.168.1.45',
    timestamp: '2026-09-24T14:35:12Z',
    tamperProofHash: 'd492e811ec8cf41f87b8bfa0451cfb565a587424fbafab06a7be74a3f6cd712b',
  },
  {
    id: 102,
    action: 'READ',
    resourceType: 'fhir_observation',
    resourceId: 'obs-bp-01',
    user: 'Dr. David Morales (MN-145892)',
    ipAddress: '192.168.1.45',
    timestamp: '2026-09-24T14:21:03Z',
    tamperProofHash: 'a8b1c4d92ef1092a348571029384756102938475610293847561029384756102',
  },
  {
    id: 101,
    action: 'READ',
    resourceType: 'fhir_patient',
    resourceId: 'p1000000-0000-0000-0000-000000000001',
    user: 'Dr. David Morales (MN-145892)',
    ipAddress: '192.168.1.45',
    timestamp: '2026-09-24T14:20:04Z',
    tamperProofHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
];

export default function AuditPage() {
  const [filterAction, setFilterAction] = useState('ALL');

  const filtered =
    filterAction === 'ALL'
      ? mockAuditLogs
      : mockAuditLogs.filter((log) => log.action === filterAction);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_report_tenant_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>PISTA DE AUDITORÍA INMUTABLE (HIPAA § 164.312(b) / 21 CFR PART 11)</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">Registros de Auditoría Inmutables</h1>
          <p className="text-xs text-slate-500 font-medium">
            Tabla append-only protegida por triggers PostgreSQL y hashes acumulativos SHA-256.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Informe JSON</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        {['ALL', 'SIGN_MANIFEST_21CFR11', 'AI_DISPATCH', 'READ'].map((action) => (
          <button
            key={action}
            onClick={() => setFilterAction(action)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              filterAction === action
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">ID / Timestamp</th>
                <th className="py-3 px-4 font-bold">Acción</th>
                <th className="py-3 px-4 font-bold">Recurso FHIR</th>
                <th className="py-3 px-4 font-bold">Usuario / Médico</th>
                <th className="py-3 px-4 font-bold">IP Origen</th>
                <th className="py-3 px-4 font-bold">Hash Antimanipulación (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    <span className="font-bold text-slate-900">#{log.id}</span>
                    <span className="block text-[10px] text-slate-400">{log.timestamp}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        log.action.includes('SIGN')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.action.includes('AI')
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    <span className="font-semibold block">{log.resourceType}</span>
                    <span className="text-[10px] text-slate-400">{log.resourceId}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {log.user}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {log.ipAddress}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={log.tamperProofHash}>
                    <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                      {log.tamperProofHash}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
