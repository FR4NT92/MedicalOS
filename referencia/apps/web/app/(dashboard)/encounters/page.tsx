'use client';

import React from 'react';
import Link from 'next/link';
import { Stethoscope, Clock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface EncounterItem {
  id: string;
  patientName: string;
  mrn: string;
  clinicianName: string;
  status: 'in-progress' | 'planned' | 'finished';
  startTime: string;
  reason: string;
  ghlAppointmentId: string;
}

const mockEncounters: EncounterItem[] = [
  {
    id: 'enc-8812-fhir',
    patientName: 'Gómez, Valeria Sofía',
    mrn: '#AB-9012',
    clinicianName: 'Dr. Alejandro Morales',
    status: 'in-progress',
    startTime: '12:20 ART',
    reason: 'Cefalea recurrente de 4 días',
    ghlAppointmentId: 'ghl_apt_99120',
  },
  {
    id: 'enc-8811-fhir',
    patientName: 'Rossi, Carlos Alberto',
    mrn: '#AB-9013',
    clinicianName: 'Dr. Alejandro Morales',
    status: 'finished',
    startTime: '11:30 ART',
    reason: 'Control hipertensión arterial',
    ghlAppointmentId: 'ghl_apt_99119',
  },
  {
    id: 'enc-8810-fhir',
    patientName: 'Fernández, Lucía Belén',
    mrn: '#AB-9014',
    clinicianName: 'Dra. Elena Ramos',
    status: 'finished',
    startTime: '10:45 ART',
    reason: 'Evaluación prequirúrgica',
    ghlAppointmentId: 'ghl_apt_99118',
  },
];

export default function EncountersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#64748B] uppercase">
            <Stethoscope className="w-4 h-4 text-[#0F172A]" />
            <span>ENCUENTROS CLÍNICOS HL7 FHIR (Encounter)</span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] mt-1">Sesiones de Atención</h1>
          <p className="text-xs text-[#64748B] font-mono">
            Historial de interacciones médico-paciente e integración con turnos de GoHighLevel.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden shadow-xs">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-[#142625] text-white border-b border-[#284240] text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Encounter ID</th>
              <th className="py-3 px-4">Paciente (MRN)</th>
              <th className="py-3 px-4">Médico Asignado</th>
              <th className="py-3 px-4">Hora Inicio</th>
              <th className="py-3 px-4">Motivo de Consulta</th>
              <th className="py-3 px-4">Estado FHIR</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {mockEncounters.map((enc) => (
              <tr key={enc.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#0F172A]">{enc.id}</td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-[#0F172A]">{enc.patientName}</div>
                  <div className="text-[10px] text-[#64748B]">{enc.mrn}</div>
                </td>
                <td className="py-3.5 px-4 text-[#475569]">{enc.clinicianName}</td>
                <td className="py-3.5 px-4 text-[#475569]">{enc.startTime}</td>
                <td className="py-3.5 px-4 text-[#475569]">{enc.reason}</td>
                <td className="py-3.5 px-4">
                  {enc.status === 'in-progress' ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>EN CURSO</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[10px] bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded font-bold">
                      <CheckCircle2 className="w-3 h-3 text-[#64748B]" />
                      <span>FINALIZADO</span>
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/dashboard?encounterId=${enc.id}`}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1A2E2D] hover:bg-[#253F3E] text-white text-[11px] font-bold uppercase rounded-xs"
                  >
                    <span>Ver Detalle</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
