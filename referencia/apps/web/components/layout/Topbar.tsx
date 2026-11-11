'use client';

import React from 'react';
import { Search, Bell, Mic, MicOff } from 'lucide-react';

interface TopbarProps {
  currentEncounterId?: string;
  activeEncounterId?: string;
  patientName?: string;
  isDictating?: boolean;
  isRecording?: boolean;
  isProcessing?: boolean;
  onToggleDictate?: () => void;
  onToggleDictation?: () => void;
  audioLevel?: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentEncounterId,
  activeEncounterId,
  patientName = 'Valeria Gómez',
  isDictating = false,
  isRecording = false,
  isProcessing = false,
  onToggleDictate,
  onToggleDictation,
  audioLevel = 0,
}) => {
  const recordingActive = isRecording || isDictating;
  const toggleHandler = onToggleDictation || onToggleDictate;

  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 z-10">
      
      {/* Saludo & Omnibar Search */}
      <div className="flex items-center space-x-6 flex-1 max-w-xl">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Panel Médico</h1>
          <p className="text-xs text-slate-500 font-medium">Jueves, 24 de Septiembre • 14:45</p>
        </div>

        {/* Omnibar con atajo Ctrl+K */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar paciente por nombre, DNI o N° Historia Clínica..."
            className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-xs">
            Ctrl K
          </span>
        </div>
      </div>

      {/* Acciones Rápidas & Botón Copilot Liquid Glass */}
      <div className="flex items-center space-x-4">
        
        {/* Notificaciones */}
        <button className="relative p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-500" />
        </button>

        {/* VU Telemetría monocroma para dictado */}
        {recordingActive && (
          <div className="flex items-center space-x-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-mono">
            <span className="text-[10px] font-bold text-sky-400 tracking-wider">VAD 16kHz</span>
            <div className="flex items-end space-x-0.5 h-3.5 w-8">
              <div className="w-1 bg-white transition-all" style={{ height: `${Math.max(4, audioLevel * 14)}px` }} />
              <div className="w-1 bg-white transition-all" style={{ height: `${Math.max(6, audioLevel * 18)}px` }} />
              <div className="w-1 bg-white transition-all" style={{ height: `${Math.max(3, audioLevel * 10)}px` }} />
              <div className="w-1 bg-sky-400 transition-all" style={{ height: `${Math.max(8, audioLevel * 20)}px` }} />
            </div>
          </div>
        )}

        {/* BOTÓN HERO LIQUID GLASS: MEDICAL COPILOT */}
        <button
          onClick={toggleHandler}
          className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-xl text-white text-xs font-bold tracking-wide cursor-pointer select-none transition-all ${
            recordingActive
              ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-lg shadow-rose-500/30 border border-white/40'
              : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg shadow-sky-500/25 border border-white/40 backdrop-blur-xl'
          }`}
          style={{
            boxShadow: recordingActive
              ? '0 10px 25px -4px rgba(239, 68, 68, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.7)'
              : '0 10px 25px -4px rgba(14, 165, 233, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.7)',
          }}
        >
          {recordingActive ? (
            <>
              <MicOff className="w-4 h-4 text-white" />
              <span>Detener Dictado</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-white" />
              <span>Dictar Orden</span>
              <span className="text-[10px] font-mono bg-white/20 text-white px-1.5 py-0.2 rounded border border-white/30">
                [Espacio]
              </span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
