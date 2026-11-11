'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useMedicalDictation, CopilotResult } from '../../hooks/useMedicalDictation';
import { CheckCircle2, FileText, Send, X } from 'lucide-react';

interface BauhausShellProps {
  children: React.ReactNode;
}

export const BauhausShell: React.FC<BauhausShellProps> = ({ children }) => {
  const [activeEncounterId] = useState('enc-2026-0924-01');
  const [pendingDraft, setPendingDraft] = useState<CopilotResult | null>(null);

  const {
    isRecording,
    isProcessing,
    audioLevel,
    transcript,
    interimTranscript,
    startDictation,
    stopDictation,
    resetState,
  } = useMedicalDictation({
    tenantId: 'd3b07384-d113-4011-828e-5cb239f1c7d2',
    encounterId: activeEncounterId,
    onResultReceived: (result) => {
      setPendingDraft(result);
    },
    onError: (err) => {
      console.error('Dictation error:', err);
    },
  });

  const handleToggleDictation = () => {
    if (isRecording) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  const handleApproveDraft = () => {
    alert('Borrador firmado criptográficamente y sincronizado con GoHighLevel v2.');
    setPendingDraft(null);
    resetState();
  };

  const handleRejectDraft = () => {
    setPendingDraft(null);
    resetState();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-800">
      {/* 1. Left Nura Navigation Sidebar */}
      <Sidebar isDictating={isRecording} />

      {/* 2. Main Execution Surface */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Topbar with Context and Dictation Trigger */}
        <Topbar
          activeEncounterId={activeEncounterId}
          isRecording={isRecording}
          isProcessing={isProcessing}
          audioLevel={audioLevel}
          onToggleDictation={handleToggleDictation}
        />

        {/* Live Interim Transcript Banner */}
        {(isRecording || interimTranscript) && (
          <div className="bg-slate-900 text-white px-8 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3 overflow-hidden">
              <span className="text-[10px] font-mono bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded font-bold shrink-0">
                REC LIVE
              </span>
              <p className="text-xs font-mono text-slate-300 truncate">
                {interimTranscript || 'Escuchando dictado clínico en tiempo real...'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
              AUDIO/WEBM;CODECS=OPUS • 250MS
            </span>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          {children}
        </main>

        {/* 3. Human-in-the-Loop Clinical Validation Drawer */}
        {pendingDraft && (
          <aside className="border-t border-slate-200 bg-white p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                    BORRADOR HL7 FHIR CLINICAL IMPRESSION
                  </span>
                  <span className="text-xs text-slate-500">Requiere firma médica</span>
                </div>
                <p className="text-xs font-mono text-slate-700 whitespace-pre-line bg-slate-50 p-3 border border-slate-200 rounded-xl">
                  {pendingDraft.draft_clinical_impression?.summary}
                </p>
                {pendingDraft.ghl_action_proposed && (
                  <div className="text-[11px] font-mono text-sky-600 flex items-center space-x-1.5 pt-1">
                    <Send className="w-3 h-3" />
                    <span>
                      ACCIÓN GHL v2 PROGRAMADA: Agendar cita en {pendingDraft.ghl_action_proposed.slot_days_offset} días para contacto {pendingDraft.ghl_action_proposed.contact_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleRejectDraft}
                className="flex items-center space-x-1 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Descartar</span>
              </button>
              <button
                type="button"
                onClick={handleApproveDraft}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firmar y Ejecutar</span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
