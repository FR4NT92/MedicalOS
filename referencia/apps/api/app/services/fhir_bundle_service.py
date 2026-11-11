"""
HL7 FHIR v4 Bundle Generator & Interoperability Service
Produces standard FHIR JSON Documents and Collections for medical interoperability,
conforming to HL7 FHIR Release 4 specification (Patient, Encounter, Observation, ClinicalImpression).
Includes cryptographic signature metadata for legal and audit compliance.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger("abundance.fhir_bundle")

class FHIRBundleService:
    def create_patient_document_bundle(
        self,
        tenant_id: str,
        patient_data: Dict[str, Any],
        encounters: List[Dict[str, Any]],
        observations: List[Dict[str, Any]],
        impressions: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Assembles a FHIR document bundle containing the patient's longitudinal record.
        """
        bundle_id = str(uuid.uuid4())
        timestamp_iso = datetime.now(timezone.utc).isoformat()

        entries: List[Dict[str, Any]] = []

        # 1. Patient Resource Entry
        patient_resource = {
            "resourceType": "Patient",
            "id": patient_data.get("id"),
            "meta": {
                "versionId": "1",
                "lastUpdated": timestamp_iso,
                "tag": [{"system": "https://abundance.clinic/tenant", "code": tenant_id}]
            },
            "active": patient_data.get("active", True),
            "identifier": patient_data.get("identifier", [
                {"system": "urn:oid:abundance:mrn", "value": patient_data.get("mrn", "MRN-001")}
            ]),
            "name": patient_data.get("name", [{"use": "official", "family": "Gómez", "given": ["Valeria"]}]),
            "telecom": patient_data.get("telecom", [{"system": "phone", "value": "+5491144445555"}]),
            "gender": patient_data.get("gender", "female"),
            "birthDate": patient_data.get("birth_date", "1984-06-15")
        }
        entries.append({
            "fullUrl": f"urn:uuid:{patient_data.get('id')}",
            "resource": patient_resource
        })

        # 2. Encounter Entries
        for enc in encounters:
            enc_resource = {
                "resourceType": "Encounter",
                "id": enc.get("id"),
                "status": enc.get("status", "finished"),
                "class": {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    "code": "AMB",
                    "display": "ambulatory"
                },
                "subject": {"reference": f"urn:uuid:{patient_data.get('id')}"},
                "period": {
                    "start": enc.get("period_start", timestamp_iso),
                    "end": enc.get("period_end")
                }
            }
            entries.append({
                "fullUrl": f"urn:uuid:{enc.get('id')}",
                "resource": enc_resource
            })

        # 3. Observation Entries (Vitals, Lab Findings)
        for obs in observations:
            obs_resource = {
                "resourceType": "Observation",
                "id": obs.get("id"),
                "status": obs.get("status", "final"),
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "vital-signs",
                                "display": "Vital Signs"
                            }
                        ]
                    }
                ],
                "code": obs.get("code", {
                    "coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood Pressure"}]
                }),
                "subject": {"reference": f"urn:uuid:{patient_data.get('id')}"},
                "effectiveDateTime": obs.get("effective_date_time", timestamp_iso),
                "valueQuantity": obs.get("value_quantity")
            }
            entries.append({
                "fullUrl": f"urn:uuid:{obs.get('id')}",
                "resource": obs_resource
            })

        # 4. ClinicalImpression Entries (SOAP Evolution + Electronic Signatures)
        for imp in impressions:
            imp_resource = {
                "resourceType": "ClinicalImpression",
                "id": imp.get("id"),
                "status": imp.get("status", "completed"),
                "subject": {"reference": f"urn:uuid:{patient_data.get('id')}"},
                "date": imp.get("date", timestamp_iso),
                "summary": imp.get("summary", ""),
                "extension": [
                    {
                        "url": "https://abundance.clinic/fhir/StructureDefinition/ai-generated",
                        "valueBoolean": imp.get("ai_generated", True)
                    },
                    {
                        "url": "https://abundance.clinic/fhir/StructureDefinition/signature-digest",
                        "valueString": imp.get("signature_digest", "")
                    },
                    {
                        "url": "https://abundance.clinic/fhir/StructureDefinition/signed-by",
                        "valueString": imp.get("signed_by", "")
                    }
                ]
            }
            entries.append({
                "fullUrl": f"urn:uuid:{imp.get('id')}",
                "resource": imp_resource
            })

        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {
                "lastUpdated": timestamp_iso,
                "profile": ["http://hl7.org/fhir/StructureDefinition/document"]
            },
            "type": "document",
            "timestamp": timestamp_iso,
            "total": len(entries),
            "entry": entries
        }

fhir_bundle_service = FHIRBundleService()
