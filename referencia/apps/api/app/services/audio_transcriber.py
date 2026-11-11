"""
Real-Time Audio Ingestion and Transcription Service
Handles WebM/Opus audio buffers streamed from the browser via MediaRecorder timeslice.
Converts Opus chunks and communicates with Whisper / Gemini Audio API.
"""

import io
import os
import logging
from typing import Optional, AsyncGenerator
from ..core.config import settings

logger = logging.getLogger("abundance.transcriber")

class AudioTranscriptionService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self._client = None

    @property
    def client(self):
        if not self._client and self.api_key:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=self.api_key)
        return self._client

    async def transcribe_buffer(self, audio_bytes: bytes, language: str = "es") -> str:
        """
        Transcribes a complete buffer of audio/webm;codecs=opus.
        In production, writes buffer to an in-memory BytesIO stream named 'audio.webm'
        and executes speech-to-text using Whisper or Gemini API.
        """
        if not audio_bytes or len(audio_bytes) < 100:
            return ""

        if self.client:
            try:
                audio_file = io.BytesIO(audio_bytes)
                audio_file.name = "dictation.webm"

                response = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    prompt="Dictado médico clínico en español: anamnesis, examen físico, diagnóstico CIE-10, fármacos, posología."
                )
                return response.text.strip()
            except Exception as e:
                logger.error(f"Error calling transcription API: {str(e)}", exc_info=True)
                raise e
        else:
            # Fallback simulator for offline testing or when API key is not configured
            logger.warning("OPENAI_API_KEY not configured. Running transcription simulator.")
            return (
                "Paciente refiere cuadro de cefalea frontal de moderada intensidad acompañada de náuseas. "
                "Examen físico con signos vitales estables, tensión arterial 120/80 mmHg. "
                "Se indica paracetamol 1 gramo cada 8 horas condicional al dolor y agendar turno de control en 7 días."
            )

transcription_service = AudioTranscriptionService()
