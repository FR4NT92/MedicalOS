'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (pin: string) => Promise<void>;
  onConfirmSign?: (pin: string) => Promise<void>;
  patientName: string;
  encounterId?: string;
  summaryText?: string;
  clinicalSummary?: string;
  clinicianName: string;
  npiNumber: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onConfirmSign,
  patientName,
  encounterId = 'enc-8812-fhir',
  summaryText,
  clinicalSummary,
  clinicianName,
  npiNumber,
}) => {
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const contentToDisplay = summaryText || clinicalSummary || '';

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Ingrese su PIN de firma digital médica (mínimo 4 caracteres).');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      if (onConfirm) {
        await onConfirm(pin);
      } else if (onConfirmSign) {
        await onConfirmSign(pin);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la firma electrónica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Firma Electrónica Legal</h3>
              <span className="text-xs text-slate-500 font-medium">Conformidad con FDA 21 CFR Part 11 Subpart C</span>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del Registro */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Paciente:</span>
            <span className="font-bold text-slate-800">{patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Médico Actuante:</span>
            <span className="font-bold text-slate-800">{clinicianName} ({npiNumber})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Encuentro:</span>
            <span className="font-mono text-slate-700">{encounterId}</span>
          </div>
          <div className="flex justify-between items-start pt-1">
            <span className="text-slate-500 font-medium shrink-0">Significado:</span>
            <span className="text-slate-700 italic text-[11px] text-right ml-4">
              "Autor, revisión y aprobación legal de la evolución médica. Human-in-the-Loop verificado."
            </span>
          </div>
        </div>

        {/* PIN de Firma */}
        <form onSubmit={handleSign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ingrese su PIN Médico de Firma (4 a 6 dígitos):
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
              className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            {error && (
              <span className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            Al hacer clic en "Emitir Firma Criptográfica", usted certifica haber validado personalmente el borrador de IA. Esta acción genera un token inmutable en el registro de auditoría con valor pericial legal.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer flex items-center space-x-2 transition-all"
            >
              <span>{isSubmitting ? 'Procesando Firma...' : 'Emitir Firma Criptográfica'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
