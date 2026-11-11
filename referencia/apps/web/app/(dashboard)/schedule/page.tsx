'use client';

import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, User, Send, ChevronRight } from 'lucide-react';

interface AppointmentSlot {
  id: string;
  time: string;
  patientName: string;
  mrn: string;
  type: string;
  source: string;
  status: 'confirmed' | 'pending-approval';
}

const mockSchedule: AppointmentSlot[] = [
  {
    id: 'ghl_apt_01',
    time: '09:00 - 09:30',
    patientName: 'Fernández, Lucía Belén',
    mrn: '#AB-9014',
    type: 'Evaluación prequirúrgica',
    source: 'GHL Calendar Webhook',
    status: 'confirmed',
  },
  {
    id: 'ghl_apt_02',
    time: '11:00 - 11:30',
    patientName: 'Rossi, Carlos Alberto',
    mrn: '#AB-9013',
    type: 'Control hipertensión arterial',
    source: 'GHL Calendar Webhook',
    status: 'confirmed',
  },
  {
    id: 'ghl_apt_03',
    time: '14:30 - 15:00',
    patientName: 'Gómez, Valeria Sofía',
    mrn: '#AB-9012',
    type: 'Consulta de dolor / Cefalea',
    source: 'GHL v2 API (En Consulta Actual)',
    status: 'confirmed',
  },
  {
    id: 'ghl_apt_04',
    time: '10:00 - 10:30 (En 15 días)',
    patientName: 'Gómez, Valeria Sofía',
    mrn: '#AB-9012',
    type: 'Control cardiológico evolutivo',
    source: 'Medical Copilot Dictation',
    status: 'confirmed',
  },
];

export default function SchedulePage() {
  const [selectedDate] = useState('24 de Septiembre, 2026');

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 uppercase">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>SINCRONIZACIÓN DE AGENDA GOHIGHLEVEL (GHL API v2)</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">Agenda del Consultorio</h1>
          <p className="text-xs text-slate-500 font-medium">
            Integración bidireccional con calendarios de sede y vinculación automática por voz.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-800">GHL SYNC: CONECTADO</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Turnos Programados — {selectedDate}
          </h2>
          <span className="text-xs font-mono text-slate-500">Sede: Hospital Metropolitano (cmm-01)</span>
        </div>

        <div className="space-y-3">
          {mockSchedule.map((slot) => (
            <div
              key={slot.id}
              className="p-4 bg-slate-50/80 border border-slate-200/80 hover:border-sky-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="w-32 font-bold font-mono text-xs text-slate-900 bg-white border border-slate-200 p-2.5 text-center rounded-lg shrink-0 shadow-xs">
                  {slot.time}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{slot.patientName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    MRN: {slot.mrn} • Motivo: <strong className="text-slate-700">{slot.type}</strong>
                  </div>
                  <div className="text-[10px] font-mono text-sky-600 mt-1">
                    Origen: {slot.source}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CONFIRMADO EN GHL</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
