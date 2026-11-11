'use client';

import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { GHLActionProposed } from '../../hooks/useMedicalDictation';

interface GHLAppointmentCardProps {
  proposedAction?: GHLActionProposed | null;
  action?: GHLActionProposed | null;
  patientName?: string;
  onConfirmBooking?: (action: GHLActionProposed) => Promise<void>;
  onConfirm?: (action: GHLActionProposed) => Promise<void>;
  onDismiss?: () => void;
}

export const GHLAppointmentCard: React.FC<GHLAppointmentCardProps> = ({
  proposedAction,
  action,
  patientName = 'Valeria Sofía Gómez',
  onConfirmBooking,
  onConfirm,
  onDismiss,
}) => {
  const currentAction = action || proposedAction;
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentAction) return null;

  const handleConfirm = async () => {
    setIsBooking(true);
    setError(null);
    try {
      if (onConfirm) {
        await onConfirm(currentAction);
      } else if (onConfirmBooking) {
        await onConfirmBooking(currentAction);
      }
      setIsBooked(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al agendar en GoHighLevel');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Agenda GoHighLevel v2
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Turno Clínico Propuesto</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full font-bold">
            GHL INTENT
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Appointment Data */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Contacto CRM:</span>
          <span className="font-bold text-slate-800">{patientName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Plazo sugerido:</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            En {currentAction.slot_days_offset || 15} días
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Tipo de Cita:</span>
          <span className="text-slate-700 font-semibold">Control Cardiológico (30 min)</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action CTA */}
      <div className="pt-1 flex items-center justify-end">
        {isBooked ? (
          <div className="flex items-center space-x-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Sincronizado con GoHighLevel</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isBooking}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isBooking ? 'Agendando...' : 'Confirmar en Calendario GHL'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
