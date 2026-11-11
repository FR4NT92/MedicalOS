"""
Unit Tests for Compliance & Electronic Signature Integrity
"""

import pytest
from app.services.compliance_service import compliance_service

TENANT_ID = "d3b07384-d113-4011-828e-5cb239f1c7d2"
ENCOUNTER_ID = "enc-8812-fhir"
CLINICIAN_ID = "c1111111-1111-1111-1111-111111111111"
TIMESTAMP = "2026-09-24T12:35:12Z"

ORIGINAL_SOAP = "[S] Cefalea frontal.\n[O] TA 120/80.\n[A] Cefalea tensional.\n[P] Paracetamol 1g."
ALTERED_SOAP = "[S] Cefalea frontal.\n[O] TA 180/110.\n[A] Crisis hipertensiva.\n[P] Paracetamol 1g."

def test_signature_deterministic():
    sig1 = compliance_service.compute_clinical_digest(
        TENANT_ID, ENCOUNTER_ID, CLINICIAN_ID, ORIGINAL_SOAP, TIMESTAMP
    )
    sig2 = compliance_service.compute_clinical_digest(
        TENANT_ID, ENCOUNTER_ID, CLINICIAN_ID, ORIGINAL_SOAP, TIMESTAMP
    )
    assert sig1 == sig2
    assert len(sig1) == 64 # SHA-256 hex digest length

def test_tamper_detection_in_soap():
    original_sig = compliance_service.compute_clinical_digest(
        TENANT_ID, ENCOUNTER_ID, CLINICIAN_ID, ORIGINAL_SOAP, TIMESTAMP
    )
    altered_sig = compliance_service.compute_clinical_digest(
        TENANT_ID, ENCOUNTER_ID, CLINICIAN_ID, ALTERED_SOAP, TIMESTAMP
    )
    # Even a small clinical change invalidates the cryptographic signature
    assert original_sig != altered_sig

def test_audit_entry_hash_generation():
    entry = compliance_service.generate_audit_entry_payload(
        tenant_id=TENANT_ID,
        user_id=CLINICIAN_ID,
        action="SIGN",
        resource_type="fhir_clinical_impression",
        resource_id="imp-001",
        diff={"status": "completed"}
    )
    assert "tamper_proof_hash" in entry
    assert len(entry["tamper_proof_hash"]) == 64
    assert entry["action"] == "SIGN"
