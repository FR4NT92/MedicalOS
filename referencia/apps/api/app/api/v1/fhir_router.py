"""
HL7 FHIR Interoperability API Router
Endpoints for exporting and validating standardized FHIR Documents.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from ...services.fhir_bundle_service import fhir_bundle_service
from ...core.security import get_current_tenant, TenantContext
import logging

logger = logging.getLogger("abundance.fhir_api")
router = APIRouter(prefix="/fhir", tags=["HL7 FHIR Interoperability"])

@router.get("/patients/{patient_id}/bundle")
async def get_patient_fhir_bundle(
    patient_id: str,
    current_tenant: TenantContext = Depends(get_current_tenant)
) -> Dict[str, Any]:
    """
    Exports a patient's complete longitudinal record as an HL7 FHIR v4 Bundle.
    Enforces tenant scoping via JWT claim.
    """
    logger.info(f"Generating FHIR Bundle for patient {patient_id} in tenant {current_tenant.tenant_id}")

    # Simulated clinical record lookup (scoped to current_tenant.tenant_id)
    patient_data = {
        "id": patient_id,
        "mrn": "#AB-9012",
        "active": True,
        "name": [{"use": "official", "family": "Gómez", "given": ["Valeria", "Sofía"]}],
        "gender": "female",
        "birth_date": "1984-06-15",
        "telecom": [{"system": "phone", "value": "+54 9 11 4455-6677"}]
    }

    encounters = [
        {
            "id": "enc-8812-fhir",
            "status": "in-progress",
            "period_start": "2026-09-24T12:20:00Z"
        }
    ]

    observations = [
        {
            "id": "obs-bp-01",
            "status": "final",
            "code": {
                "coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood Pressure"}]
            },
            "value_quantity": {"value": 120, "unit": "mmHg"}
        },
        {
            "id": "obs-hr-01",
            "status": "final",
            "code": {
                "coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart Rate"}]
            },
            "value_quantity": {"value": 72, "unit": "lpm"}
        }
    ]

    impressions = [
        {
            "id": "imp-991-soap",
            "status": "completed",
            "date": "2026-09-24T12:35:00Z",
            "summary": "SOAP: Cefalea tensional. Paracetamol 1g c/8hs condicional. Control en 7 días.",
            "ai_generated": True,
            "signature_digest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "signed_by": current_tenant.user_id
        }
    ]

    bundle = fhir_bundle_service.create_patient_document_bundle(
        tenant_id=current_tenant.tenant_id,
        patient_data=patient_data,
        encounters=encounters,
        observations=observations,
        impressions=impressions
    )

    return bundle
