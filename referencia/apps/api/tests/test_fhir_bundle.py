"""
Unit Tests for HL7 FHIR v4 Bundle Assembly
"""

import pytest
from app.services.fhir_bundle_service import fhir_bundle_service

def test_fhir_bundle_structure():
    patient = {
        "id": "p-123",
        "mrn": "MRN-9012",
        "name": [{"family": "Gómez", "given": ["Valeria"]}]
    }
    encounters = [{"id": "enc-01", "status": "finished"}]
    observations = [{"id": "obs-01", "status": "final", "value_quantity": {"value": 120, "unit": "mmHg"}}]
    impressions = [{"id": "imp-01", "status": "completed", "summary": "SOAP Note", "signature_digest": "abc"}]

    bundle = fhir_bundle_service.create_patient_document_bundle(
        tenant_id="tenant-123",
        patient_data=patient,
        encounters=encounters,
        observations=observations,
        impressions=impressions
    )

    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "document"
    assert bundle["total"] == 4
    
    # Verify presence of resources in entries
    resource_types = [entry["resource"]["resourceType"] for entry in bundle["entry"]]
    assert "Patient" in resource_types
    assert "Encounter" in resource_types
    assert "Observation" in resource_types
    assert "ClinicalImpression" in resource_types
