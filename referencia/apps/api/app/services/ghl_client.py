"""
GoHighLevel (GHL) API v2 Integration Client
Handles contact lookups, appointment scheduling, and conversation triggers
using GHL Location OAuth tokens.
"""

import httpx
from typing import Dict, Any, Optional
from ..core.config import settings
import logging

logger = logging.getLogger("abundance.ghl_client")

class GHLClient:
    def __init__(self, access_token: str, location_id: str):
        self.access_token = access_token
        self.location_id = location_id
        self.base_url = settings.GHL_API_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Version": settings.GHL_API_VERSION,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def get_contact(self, contact_id: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/contacts/{contact_id}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=self.headers)
            if resp.status_code == 200:
                return resp.json().get("contact")
            logger.error(f"Failed to fetch GHL contact {contact_id}: {resp.status_code} - {resp.text}")
            return None

    async def create_or_update_contact(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/contacts/upsert"
        payload["locationId"] = self.location_id
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    async def book_appointment(
        self,
        calendar_id: str,
        contact_id: str,
        start_time_iso: str,
        title: str = "Control Médico Evolutivo"
    ) -> Dict[str, Any]:
        """
        Creates an appointment in GHL calendar mapped to the clinician's agenda.
        """
        url = f"{self.base_url}/calendars/events/appointments"
        payload = {
            "calendarId": calendar_id,
            "locationId": self.location_id,
            "contactId": contact_id,
            "startTime": start_time_iso,
            "title": title,
            "appointmentStatus": "confirmed"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=self.headers)
            resp.raise_for_status()
            return resp.json()
