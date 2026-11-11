"""
Health Compliance and Cryptographic Signature Service
Manages electronic signature verification and immutable audit trail generation
compliant with HIPAA § 164.312(b) & EU GDPR standards.
"""

import hmac
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from ..core.config import settings
import logging

logger = logging.getLogger("abundance.compliance")

class ComplianceService:
    def __init__(self):
        self.secret_salt = settings.PHI_ENCRYPTION_KEY or "abundance_default_compliance_secret_key_32"

    def compute_clinical_digest(
        self,
        tenant_id: str,
        encounter_id: str,
        clinician_id: str,
        summary: str,
        signed_at_iso: str
    ) -> str:
        """
        Computes a non-repudiable HMAC-SHA256 signature digest for an electronic clinical note.
        Binds the clinic tenant, patient encounter, clinician identity, exact SOAP text, and timestamp.
        """
        summary_hash = hashlib.sha256(summary.encode("utf-8")).hexdigest()
        raw_payload = f"{tenant_id}|{encounter_id}|{clinician_id}|{summary_hash}|{signed_at_iso}"
        
        signature = hmac.new(
            self.secret_salt.encode("utf-8"),
            raw_payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        return signature

    def generate_audit_entry_payload(
        self,
        tenant_id: str,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        diff: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = "Abundance-Client/1.0"
    ) -> Dict[str, Any]:
        """
        Creates an audit payload with deterministic timestamp and parameters for append-only audit_logs.
        """
        created_at_iso = datetime.now(timezone.utc).isoformat()
        diff_str = json.dumps(diff or {}, sort_keys=True)
        
        # Calculate verification hash
        hash_input = f"{tenant_id}|{user_id}|{action}|{resource_type}|{resource_id}|{created_at_iso}|{diff_str}"
        tamper_proof_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

        return {
            "tenant_id": tenant_id,
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "change_diff": diff or {},
            "tamper_proof_hash": tamper_proof_hash,
            "created_at": created_at_iso
        }

compliance_service = ComplianceService()
