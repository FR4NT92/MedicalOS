'use client';

import React, { useState, useEffect } from 'react';
import { FileEdit, ShieldCheck, CheckCheck, Undo2, Lock, Tag } from 'lucide-react';

interface SOAPEditorProps {
  initialSummary?: string;
  initialSOAP?: string;
  encounterId?: string;
  patientName?: string;
  isAiDraft?: boolean;
  onSaveAndSign?: (finalSummary: string) => void;
  onSign?: (finalSummary: string) => void;
  isSigned?: boolean;
  signatureDigest?: string;
}

export const SOAPEditor: React.FC<SOAPEditorProps> = ({
  initialSummary,
  initialSOAP,
  encounterId = 'enc-8812',
  patientName = 'Valeria Gómez',
  isAiDraft = true,
  onSaveAndSign,
  onSign,
  isSigned = false,
  signatureDigest,
}) => {
  const startingText = initialSOAP || initialSummary || '';
  const [summary, setSummary] = useState(startingText);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    if (startingText) setSummary(startingText);
  }, [startingText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(e.target.value);
    setIsModified(true);
  };

  const handleReset = () => {
    setSummary(startingText);
    setIsModified(false);
  };

  const triggerSign = () => {
    if (onSign) onSign(summary);
    else if (onSaveAndSign) onSaveAndSign(summary);
  };

  return (
    <div className="space-y-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
            SOAP
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Evolución Clínica Estructurada (HL7 FHIR)
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              Medical Copilot Transcripción & Inferencia CIE-10
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          {isSigned ? (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 font-bold rounded-full flex items-center space-x-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>STATUS: COMPLETED (FIRMADO)</span>
            </span>
          ) : isAiDraft ? (
            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 font-bold rounded-full">
              STATUS: DRAFT • REVISIÓN REQUERIDA
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 font-bold rounded-full">
              MANUAL
            </span>
          )}
        </div>
      </div>

      {/* CIE-10 Diagnostic Suggestion Chips */}
      <div className="flex items-center space-x-2 text-xs">
        <Tag className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500 font-medium">Diagnósticos detectados:</span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          I10 - Hipertensión Esencial
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
          G44.2 - Cefalea Tensional
        </span>
      </div>

      {/* Editor Textarea */}
      <div className="relative font-mono">
        <textarea
          rows={11}
          value={summary}
          onChange={handleChange}
          disabled={isSigned}
          className={`w-full p-4 text-xs font-mono rounded-xl leading-relaxed transition-all resize-none ${
            isSigned
              ? 'bg-slate-50 border border-slate-200 text-slate-600 cursor-not-allowed'
              : 'bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-800'
          }`}
          placeholder="[S] SUBJETIVO:&#10;[O] OBJETIVO:&#10;[A] EVALUACIÓN:&#10;[P] PLAN:"
        />
        {isModified && !isSigned && (
          <span className="absolute bottom-3 right-3 text-[10px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded shadow">
            Editado manualmente por médico
          </span>
        )}
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3 text-xs text-slate-500">
          {isModified && !isSigned && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1 hover:text-slate-800 underline font-medium"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Revertir a sugerencia IA</span>
            </button>
          )}
          <span className="text-[11px] text-slate-400">
            Norma FDA CDS § 520(o)(1)(E) — Sujeto a supervisión humana obligatoria
          </span>
        </div>

        {!isSigned ? (
          <button
            type="button"
            onClick={triggerSign}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Firmar Digitalmente (21 CFR 11)</span>
          </button>
        ) : (
          <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-bold">Digest: {signatureDigest?.substring(0, 24)}...</span>
          </div>
        )}
      </div>
    </div>
  );
};
