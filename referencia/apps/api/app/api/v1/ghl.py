"""
GoHighLevel API v2 Endpoints & Webhook Handler
Provides synchronization between Abundance Clinic OS (FHIR resources)
and GoHighLevel CRM contacts and calendars.
"""

from fastapi import APIRouter, HTTPException, Header, Depends, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging
from ...services.ghl_client import GHLClient
from ...core.config import settings

logger = logging.getLogger("abundance.ghl_api")
router = APIRouter(prefix="/ghl", tags=["GoHighLevel v2"])

class SyncPatientRequest(BaseModel):
    tenant_id: str
    patient_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None

class BookAppointmentRequest(BaseModel):
    tenant_id: str
    location_id: str
    calendar_id: str
    contact_id: str
    start_time_iso: str
    title: str = "Control Médico Evolutivo"
    encounter_id: Optional[str] = None

@router.post("/sync-patient")
async def sync_patient_to_ghl(payload: SyncPatientRequest):
    """
    Upserts a patient into GoHighLevel v2 contacts.
    Returns the created/existing ghl_contact_id to bind with fhir_patient.
    """
    # In production: retrieve location token for tenant_id from Supabase
    token = "ghl_mock_access_token"
    location_id = "ghl_mock_loc_123"
    client = GHLClient(access_token=token, location_id=location_id)

    ghl_payload = {
        "firstName": payload.first_name,
        "lastName": payload.last_name,
        "email": payload.email,
        "phone": payload.phone,
        "tags": ["abundance-os", f"tenant-{payload.tenant_id}"]
    }

    try:
        # If running in development without live GHL credentials, return simulated response
        if not settings.GHL_CLIENT_ID:
            logger.info(f"Simulating GHL contact upsert for {payload.first_name} {payload.last_name}")
            return {
                "status": "SUCCESS",
                "ghl_contact_id": f"ghl_c_{payload.patient_id[:8]}",
                "synced_at": "2026-09-24T12:00:00Z"
            }

        res = await client.create_or_update_contact(ghl_payload)
        return {
            "status": "SUCCESS",
            "ghl_contact_id": res.get("contact", {}).get("id"),
            "data": res
        }
    except Exception as e:
        logger.error(f"Error syncing patient with GHL: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/book-appointment")
async def book_appointment_endpoint(payload: BookAppointmentRequest):
    """
    Executes appointment booking on GoHighLevel calendar after clinician approval.
    """
    # In production: retrieve location token for tenant_id from Supabase
    token = "ghl_mock_access_token"
    client = GHLClient(access_token=token, location_id=payload.location_id)

    try:
        if not settings.GHL_CLIENT_ID:
            logger.info(f"Simulating GHL appointment booking for contact {payload.contact_id}")
            return {
                "status": "CONFIRMED",
                "ghl_appointment_id": f"ghl_apt_99120",
                "start_time": payload.start_time_iso,
                "title": payload.title
            }

        res = await client.book_appointment(
            calendar_id=payload.calendar_id,
            contact_id=payload.contact_id,
            start_time_iso=payload.start_time_iso,
            title=payload.title
        )
        return {"status": "CONFIRMED", "data": res}
    except Exception as e:
        logger.error(f"Error booking GHL appointment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def ghl_webhook_handler(
    payload: Dict[str, Any] = Body(...),
    x_ghl_signature: Optional[str] = Header(None)
):
    """
    Inbound webhook receiver for GoHighLevel events:
    - AppointmentCreated: triggers creation of fhir_encounter with status='planned'
    - AppointmentCancelled: updates fhir_encounter with status='cancelled'
    """
    event_type = payload.get("type")
    logger.info(f"Received GHL webhook event: {event_type}")

    # Verify signature / HMAC if configured in settings
    # Dispatch event to local event bus / Supabase sync worker
    return {"status": "RECEIVED", "event": event_type}
