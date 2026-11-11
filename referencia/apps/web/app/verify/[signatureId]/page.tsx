"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, Lock, FileText, Building2, Calendar, User, ArrowLeft } from "lucide-react";

export default function VerifySignaturePage({
  params,
}: {
  params: { signatureId: string };
}) {
  const signatureId = params?.signatureId || "SIG-DEMO";

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#0B0F19] p-4 sm:p-8 font-sans flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-[#DCE1E7] shadow-xl overflow-hidden">
        {/* TOP STATUS BANNER */}
        <div className="bg-[#E8F5EE] border-b border-[#589972]/20 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#589972] text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#1A422B]">Firma Digital Verificada</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D1E7DA] text-[#1A422B]">
                Válida Ley 25.506
              </span>
            </div>
            <p className="text-xs text-[#2C6E49] mt-0.5">
              Documento médico íntegro y auténtico emitido por profesional colegiado.
            </p>
          </div>
        </div>

        {/* DETAILS BODY */}
        <div className="p-6 space-y-6">
          {/* TOKEN & HASH */}
          <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-gray-200 space-y-2">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Identificador de Firma Digital</div>
            <div className="font-mono text-xs font-bold text-[#0B0F19] break-all bg-white p-2.5 rounded-xl border border-gray-200">
              {signatureId}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-[#589972]" />
              <span>Cifrado SHA-256 con Sello de Tiempo UTC Inmutable</span>
            </div>
          </div>

          {/* SIGNER DATA */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-gray-500 text-[11px] block">Profesional Firmante</span>
              <div className="font-bold text-[#0B0F19] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Dra. Mariana Morales
              </div>
              <span className="text-gray-600 block">Matrícula Nacional: <strong>MN 142.890</strong></span>
            </div>

            <div className="space-y-1">
              <span className="text-gray-500 text-[11px] block">Especialidad</span>
              <div className="font-bold text-[#0B0F19]">Traumatología y Cirugía Articular</div>
              <span className="text-gray-600 block">Sede Palermo · CABA</span>
            </div>

            <div className="space-y-1">
              <span className="text-gray-500 text-[11px] block">Institución Emisora</span>
              <div className="font-bold text-[#0B0F19] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Clínica Buenos Aires
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-gray-500 text-[11px] block">Estado de Integridad</span>
              <div className="font-bold text-[#1A422B] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#589972]" />
                No Alterado / Vigente
              </div>
            </div>
          </div>

          {/* LEGAL ACCORDANCE */}
          <div className="p-4 rounded-2xl bg-[#F0F2F5] text-[11px] text-gray-600 space-y-1 border border-gray-200">
            <p className="font-bold text-gray-900">Marco Regulatorio Nacional:</p>
            <p>• <strong>Ley Nacional 25.506:</strong> Equipara la eficacia jurídica del documento digital y su firma electrónica a la firma ológrafa.</p>
            <p>• <strong>Ley 26.529 & Ley 27.553:</strong> Garantiza autenticidad, trazabilidad y validez de recetas y registros médicos digitales ante farmacias y obras sociales.</p>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <a
              href="/"
              className="text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Sistema
            </a>
            <span className="text-[11px] text-gray-400 font-mono">Clinic-OS Security Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
