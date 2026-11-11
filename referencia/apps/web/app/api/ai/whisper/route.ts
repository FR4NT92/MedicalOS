// apps/web/app/api/ai/whisper/route.ts
// Audio Transcription Endpoint using OpenAI Whisper API with Zero Data Retention

import { NextRequest, NextResponse } from "next/server";
import { ZERO_DATA_RETENTION_HEADERS } from "@clinic-os/ai-agent";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "your-openai-api-key") {
      // Deterministic transcription response for local dev / offline
      return NextResponse.json({
        text: "Paciente en postoperatorio día 14, evolución favorable sin signos de infección. Se programa control de retiro de puntos el próximo jueves.",
        duration: 3.8,
        language: "es",
      });
    }

    const whisperFormData = new FormData();
    whisperFormData.append("file", file, "audio.webm");
    whisperFormData.append("model", "whisper-1");
    whisperFormData.append("language", "es");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...ZERO_DATA_RETENTION_HEADERS,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Whisper error: ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text, language: "es" });
  } catch (error: any) {
    console.error("Whisper endpoint error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
