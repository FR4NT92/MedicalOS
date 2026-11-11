"""
Standard Library Test Runner for Abundance Clinic OS
Executes without external dependencies using Python unittest.
Includes Regulatory & 21 CFR Part 11 Compliance Tests.
"""

import unittest
import sys
import os

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.compliance_service import compliance_service
from app.services.fhir_bundle_service import fhir_bundle_service
from app.services.regulatory_engine import regulatory_engine

class TestAbundanceCompliance(unittest.TestCase):
    def test_signature_deterministic(self):
        tenant_id = "d3b07384-d113-4011-828e-5cb239f1c7d2"
        encounter_id = "enc-8812-fhir"
        clinician_id = "c1111111-1111-1111-1111-111111111111"
        timestamp = "2026-09-24T12:35:12Z"
        soap = "[S] Cefalea.\n[O] TA 120/80.\n[A] Cefalea tensional.\n[P] Paracetamol."

        sig1 = compliance_service.compute_clinical_digest(tenant_id, encounter_id, clinician_id, soap, timestamp)
        sig2 = compliance_service.compute_clinical_digest(tenant_id, encounter_id, clinician_id, soap, timestamp)

        self.assertEqual(sig1, sig2)
        self.assertEqual(len(sig1), 64)

    def test_tamper_detection(self):
        tenant_id = "d3b07384-d113-4011-828e-5cb239f1c7d2"
        encounter_id = "enc-8812-fhir"
        clinician_id = "c1111111-1111-1111-1111-111111111111"
        timestamp = "2026-09-24T12:35:12Z"
        soap1 = "TA 120/80"
        soap2 = "TA 180/110"

        sig1 = compliance_service.compute_clinical_digest(tenant_id, encounter_id, clinician_id, soap1, timestamp)
        sig2 = compliance_service.compute_clinical_digest(tenant_id, encounter_id, clinician_id, soap2, timestamp)

        self.assertNotEqual(sig1, sig2)

    def test_audit_hash_structure(self):
        entry = compliance_service.generate_audit_entry_payload(
            tenant_id="tenant-123",
            user_id="user-456",
            action="SIGN",
            resource_type="fhir_clinical_impression",
            resource_id="imp-01",
            diff={"status": "completed"}
        )
        self.assertIn("tamper_proof_hash", entry)
        self.assertEqual(len(entry["tamper_proof_hash"]), 64)

class TestRegulatoryEngine21CFRPart11(unittest.TestCase):
    def test_manifest_generation_and_standards(self):
        manifest = regulatory_engine.generate_legal_signature_manifest(
            tenant_id="d3b07384-d113-4011-828e-5cb239f1c7d2",
            encounter_id="enc-001",
            clinician_id="clin-007",
            npi_number="MED-MN-9921",
            clinician_legal_name="Dra. Elena Ramos",
            clinical_summary="[S] Hipertensión controlada.\n[A] HTA grado 1.",
            findings=[{"code": "38341003", "display": "Hypertension"}]
        )

        self.assertIn("standards_compliance", manifest)
        self.assertIn("FDA 21 CFR Part 11 Subpart C", manifest["standards_compliance"])
        self.assertEqual(manifest["signer"]["matricula_npi"], "MED-MN-9921")
        self.assertEqual(manifest["signer"]["legal_name"], "Dra. Elena Ramos")
        self.assertEqual(manifest["signature"]["algorithm"], "HMAC-SHA256")
        self.assertEqual(len(manifest["signature"]["signature_digest"]), 64)
        self.assertEqual(len(manifest["document"]["canonical_content_hash_sha256"]), 64)

    def test_audit_chain_verification_unbroken(self):
        audit_trail = [
            {
                "id": "aud-1",
                "tenant_id": "tenant-1",
                "user_id": "user-1",
                "action": "CREATE",
                "resource_type": "fhir_patient",
                "resource_id": "p-1",
                "created_at": "2026-09-24T10:00:00Z",
                "change_diff": {"mrn": "MRN-101"},
                "tamper_proof_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" # 64-char valid
            }
        ]
        result = regulatory_engine.verify_audit_trail_chain(audit_trail)
        self.assertEqual(result["status"], "PASSED")
        self.assertEqual(result["chain_integrity"], "UNBROKEN")
        self.assertEqual(result["total_records_analyzed"], 1)

    def test_audit_chain_verification_tampered(self):
        corrupt_trail = [
            {
                "id": "aud-corrupt",
                "tenant_id": "tenant-1",
                "user_id": "attacker",
                "action": "UPDATE",
                "resource_type": "fhir_patient",
                "resource_id": "p-1",
                "created_at": "2026-09-24T10:05:00Z",
                "change_diff": {},
                "tamper_proof_hash": "invalid_truncated_hash" # Tampered!
            }
        ]
        result = regulatory_engine.verify_audit_trail_chain(corrupt_trail)
        self.assertEqual(result["status"], "COMPLIANCE_ALERT")
        self.assertEqual(result["chain_integrity"], "COMPROMISED")
        self.assertEqual(result["violations_detected"], 1)

class TestFHIRBundleService(unittest.TestCase):
    def test_bundle_creation(self):
        patient = {"id": "p-123", "mrn": "MRN-9012"}
        encounters = [{"id": "enc-01", "status": "finished"}]
        observations = [{"id": "obs-01", "status": "final"}]
        impressions = [{"id": "imp-01", "status": "completed", "summary": "SOAP"}]

        bundle = fhir_bundle_service.create_patient_document_bundle(
            tenant_id="tenant-123",
            patient_data=patient,
            encounters=encounters,
            observations=observations,
            impressions=impressions
        )

        self.assertEqual(bundle["resourceType"], "Bundle")
        self.assertEqual(bundle["type"], "document")
        self.assertEqual(bundle["total"], 4)

if __name__ == "__main__":
    unittest.main()
