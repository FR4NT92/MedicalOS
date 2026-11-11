'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, ExternalLink, Activity, Phone, Calendar } from 'lucide-react';

interface PatientItem {
  id: string;
  mrn: string;
  dni: string;
  fullName: string;
  gender: string;
  birthDate: string;
  age: number;
  phone: string;
  ghlContactId: string;
  lastEncounter: string;
}

const mockPatients: PatientItem[] = [
  {
    id: 'p1000000-0000-0000-0000-000000000001',
    mrn: '#AB-9012',
    dni: '31.902.114',
    fullName: 'Gómez, Valeria Sofía',
    gender: 'Femenino',
    birthDate: '15/06/1984',
    age: 42,
    phone: '+54 9 11 4455-6677',
    ghlContactId: 'ghl_c_889211',
    lastEncounter: 'Hoy (En curso)',
  },
  {
    id: 'p2000000-0000-0000-0000-000000000002',
    mrn: '#AB-9013',
    dni: '28.450.119',
    fullName: 'Rossi, Carlos Alberto',
    gender: 'Masculino',
    birthDate: '10/02/1981',
    age: 45,
    phone: '+54 9 11 3322-1199',
    ghlContactId: 'ghl_c_774102',
    lastEncounter: '18/09/2026',
  },
  {
    id: 'p3000000-0000-0000-0000-000000000003',
    mrn: '#AB-9014',
    dni: '40.112.905',
    fullName: 'Fernández, Lucía Belén',
    gender: 'Femenino',
    birthDate: '22/11/1997',
    age: 28,
    phone: '+54 9 11 5566-7788',
    ghlContactId: 'ghl_c_661904',
    lastEncounter: '12/09/2026',
  },
];

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockPatients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dni.includes(searchTerm) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 uppercase">
            <Users className="w-4 h-4 text-sky-600" />
            <span>DIRECTORIO CLÍNICO HL7 FHIR</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">Pacientes Registrados</h1>
          <p className="text-xs text-slate-500 font-medium">
            Registros aislados por Row-Level Security bajo el tenant activo.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Paciente FHIR</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3 bg-white p-3 border border-slate-200/80 rounded-2xl shadow-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por Nombre, DNI, o Identificador MRN..."
          className="w-full text-xs text-slate-800 focus:outline-none placeholder-slate-400 font-medium"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 font-mono"
          >
            LIMPIAR
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Identificador / MRN</th>
                <th className="py-3 px-4 font-bold">Nombre Completo</th>
                <th className="py-3 px-4 font-bold">DNI / Documento</th>
                <th className="py-3 px-4 font-bold">Edad / Nacimiento</th>
                <th className="py-3 px-4 font-bold">Contacto (Teléfono)</th>
                <th className="py-3 px-4 font-bold">GoHighLevel CRM</th>
                <th className="py-3 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-600">
                    {patient.mrn}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {patient.fullName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {patient.dni}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {patient.age} años ({patient.birthDate})
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {patient.phone}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      {patient.ghlContactId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/dashboard?patientId=${patient.id}`}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl font-bold transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Atender</span>
                    </Link>
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
