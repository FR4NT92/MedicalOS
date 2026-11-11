'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface CopilotDraft {
  status: 'draft';
  summary: string;
  ai_generated: boolean;
  requires_clinician_signature: boolean;
}

export interface GHLActionProposed {
  action: string;
  contact_id?: string;
  slot_days_offset?: number;
  requires_approval: boolean;
}

export interface CopilotResult {
  status: 'SUCCESS' | 'ERROR';
  intent?: string;
  transcript: string;
  draft_clinical_impression?: CopilotDraft;
  ghl_action_proposed?: GHLActionProposed;
  error_message?: string;
}

export interface UseMedicalDictationOptions {
  wsUrl?: string;
  tenantId: string;
  encounterId?: string;
  authToken?: string;
  timesliceMs?: number; // Default 250ms chunks
  onResultReceived?: (result: CopilotResult) => void;
  onError?: (err: Error) => void;
}

export interface MedicalDictationState {
  isRecording: boolean;
  isConnected: boolean;
  isProcessing: boolean;
  audioLevel: number; // 0.0 to 1.0 for functional audio level visualization
  transcript: string;
  interimTranscript: string;
  copilotResult: CopilotResult | null;
  error: string | null;
  startDictation: () => Promise<void>;
  stopDictation: () => void;
  cancelDictation: () => void;
  resetState: () => void;
}

export function useMedicalDictation({
  wsUrl = process.env.NEXT_PUBLIC_WS_AUDIO_URL || 'ws://localhost:8000/api/v1/audio/stream',
  tenantId,
  encounterId,
  authToken,
  timesliceMs = 250,
  onResultReceived,
  onError,
}: UseMedicalDictationOptions): MedicalDictationState {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [copilotResult, setCopilotResult] = useState<CopilotResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hardware and network references
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Clean up all audio hardware streams and analyzers
  const cleanupHardware = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignored if already stopping
      }
      mediaRecorderRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Clean up WebSocket connection
  const closeWebSocket = useCallback(() => {
    if (socketRef.current) {
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        socketRef.current.close(1000, 'Session completed');
      }
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const resetState = useCallback(() => {
    cleanupHardware();
    closeWebSocket();
    setIsRecording(false);
    setIsProcessing(false);
    setError(null);
    setInterimTranscript('');
    setTranscript('');
    setCopilotResult(null);
  }, [cleanupHardware, closeWebSocket]);

  // Audio level analyzer loop (functional VU meter)
  const monitorAudioLevel = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalize to 0.0 - 1.0 range
      const normalized = Math.min(1, average / 128);
      setAudioLevel(normalized);
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
  }, []);

  // Start Dictation workflow
  const startDictation = useCallback(async () => {
    try {
      resetState();
      setError(null);

      // 1. Microphone capture with clinical-grade audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup Web Audio API Analyser for real-time visual feedback
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      monitorAudioLevel(analyser);

      // 3. Establish WebSocket connection with query parameters for tenant authentication
      const url = new URL(wsUrl);
      url.searchParams.set('tenant_id', tenantId);
      if (encounterId) url.searchParams.set('encounter_id', encounterId);
      if (authToken) url.searchParams.set('token', authToken);

      const ws = new WebSocket(url.toString());
      ws.binaryType = 'arraybuffer';
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INTERIM_TRANSCRIPTION') {
            setInterimTranscript(data.text);
          } else if (data.type === 'COPILOT_RESULT') {
            setIsProcessing(false);
            setTranscript(data.transcript);
            setInterimTranscript('');
            const res: CopilotResult = {
              status: data.status,
              intent: data.intent,
              transcript: data.transcript,
              draft_clinical_impression: data.draft_clinical_impression,
              ghl_action_proposed: data.ghl_action_proposed,
            };
            setCopilotResult(res);
            onResultReceived?.(res);
          } else if (data.type === 'ERROR') {
            const err = new Error(data.message || 'Error processing audio stream');
            setError(err.message);
            setIsProcessing(false);
            onError?.(err);
          }
        } catch {
          // If non-JSON text arrives
        }
      };

      ws.onerror = () => {
        const err = new Error('WebSocket connection failed to audio backend');
        setError(err.message);
        onError?.(err);
        cleanupHardware();
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      // 4. Initialize MediaRecorder with Opus codec
      const preferredMime = 'audio/webm;codecs=opus';
      const mimeType = MediaRecorder.isTypeSupported(preferredMime)
        ? preferredMime
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          const buffer = await event.data.arrayBuffer();
          ws.send(buffer);
        }
      };

      // Start recording with timeslice (generates periodic slices for low latency)
      recorder.start(timesliceMs);
      setIsRecording(true);
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj.message);
      cleanupHardware();
      onError?.(errorObj);
    }
  }, [
    wsUrl,
    tenantId,
    encounterId,
    authToken,
    timesliceMs,
    resetState,
    monitorAudioLevel,
    cleanupHardware,
    onResultReceived,
    onError,
  ]);

  // Normal completion: Clinician finished dictating
  const stopDictation = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      cleanupHardware();
      setIsRecording(false);
      setIsProcessing(true);

      // Notify backend that speech stream has finished
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'DICTATION_END' }));
      }
    }
  }, [isRecording, cleanupHardware]);

  // Clinician cancels current recording without generating records
  const cancelDictation = useCallback(() => {
    resetState();
  }, [resetState]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      cleanupHardware();
      closeWebSocket();
    };
  }, [cleanupHardware, closeWebSocket]);

  return {
    isRecording,
    isConnected,
    isProcessing,
    audioLevel,
    transcript,
    interimTranscript,
    copilotResult,
    error,
    startDictation,
    stopDictation,
    cancelDictation,
    resetState,
  };
}
