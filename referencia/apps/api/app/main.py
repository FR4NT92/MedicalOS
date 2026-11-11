"""
Abundance Clinic OS - FastAPI Core API
Provides high-performance WebSocket audio ingestion (Opus/WebM chunks)
and Medical Copilot Function Calling orchestration.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio
import json

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("abundance.api")

app = FastAPI(
    title="Abundance Clinic OS - Core Medical Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to tenant domains & Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Abundance Clinic OS Backend",
        "compliance": "HIPAA / HL7 FHIR v4 Ready",
        "audio_pipeline": "WebM/Opus WebSocket Active"
    }

from .api.v1.ghl import router as ghl_router
from .api.v1.compliance import router as compliance_router
from .api.v1.fhir_router import router as fhir_router

app.include_router(ghl_router, prefix="/api/v1")
app.include_router(compliance_router, prefix="/api/v1")
app.include_router(fhir_router, prefix="/api/v1")

from .services.audio_transcriber import transcription_service
from .services.copilot_orchestrator import copilot_orchestrator
from .core.security import verify_ws_tenant_token

@app.websocket("/api/v1/audio/stream")
async def audio_stream_endpoint(
    websocket: WebSocket,
    tenant_id: str = Query(..., description="Tenant UUID for RLS context"),
    encounter_id: str = Query(None, description="Optional active FHIR Encounter UUID"),
    token: str = Query(None, description="Auth bearer token")
):
    """
    WebSocket endpoint for real-time medical dictation streaming.
    Receives binary slices (audio/webm;codecs=opus) chunked via timeslice from MediaRecorder.
    Feeds chunks into streaming STT and triggers Copilot Function Calling.
    """
    # 1. Cryptographic Tenant Authentication & Token Verification
    try:
        tenant_context = verify_ws_tenant_token(token, tenant_id)
    except Exception as auth_err:
        logger.warning(f"WebSocket auth rejected for tenant {tenant_id}: {str(auth_err)}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    logger.info(f"Dictation WebSocket authenticated. Clinician: {tenant_context.user_id}, Tenant: {tenant_id}")
    
    # Send connection acknowledgment
    await websocket.send_text(json.dumps({
        "type": "CONNECTION_ESTABLISHED",
        "tenant_id": tenant_id,
        "encounter_id": encounter_id,
        "user_id": tenant_context.user_id,
        "status": "LISTENING"
    }))

    audio_chunks: list[bytes] = []

    try:
        while True:
            # Receive binary chunk (Opus/WebM timeslice) or control JSON
            message = await websocket.receive()
            
            if "bytes" in message:
                audio_chunk: bytes = message["bytes"]
                audio_chunks.append(audio_chunk)
                
            elif "text" in message:
                control_payload = json.loads(message["text"])
                msg_type = control_payload.get("type")
                
                if msg_type == "DICTATION_END":
                    total_bytes = sum(len(c) for c in audio_chunks)
                    logger.info(f"Dictation ended. Total bytes received: {total_bytes}")
                    
                    # 1. Transcribe complete WebM/Opus buffer
                    full_audio_bytes = b"".join(audio_chunks)
                    transcript = await transcription_service.transcribe_buffer(full_audio_bytes)
                    
                    # Send interim progress
                    await websocket.send_text(json.dumps({
                        "type": "INTERIM_TRANSCRIPTION",
                        "text": transcript
                    }))

                    # 2. Execute Medical Copilot Function Calling Orchestrator
                    patient_context = control_payload.get("patient_context", {
                        "patient_name": "Gómez, Valeria",
                        "ghl_contact_id": "ghl_c_889211"
                    })
                    
                    copilot_result = await copilot_orchestrator.execute_dictation_pipeline(
                        transcript=transcript,
                        tenant_id=tenant_id,
                        encounter_id=encounter_id,
                        patient_context=patient_context
                    )

                    # 3. Deliver structured draft for Human-in-the-Loop review
                    await websocket.send_text(json.dumps({
                        "type": "COPILOT_RESULT",
                        "status": "SUCCESS",
                        "transcript": copilot_result["transcript"],
                        "prompt_hash": copilot_result["prompt_hash"],
                        "draft_clinical_impression": copilot_result["draft_clinical_impression"],
                        "ghl_action_proposed": copilot_result["ghl_action_proposed"]
                    }))
                    
                    # Reset buffer for potential subsequent dictation
                    audio_chunks = []

                elif msg_type == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))

    except WebSocketDisconnect:
        logger.info(f"Dictation WebSocket disconnected cleanly for tenant {tenant_id}")
    except Exception as e:
        logger.error(f"WebSocket processing error: {str(e)}", exc_info=True)
        try:
            await websocket.send_text(json.dumps({"type": "ERROR", "message": str(e)}))
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
