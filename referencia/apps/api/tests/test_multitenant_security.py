"""
Unit Tests for Multitenant JWT Security & Tenant Isolation
"""

import pytest
from fastapi import HTTPException
from app.core.security import decode_multitenant_token, verify_ws_tenant_token
from jose import jwt

MOCK_SECRET = "abundance_default_jwt_secret_must_match_supabase"
TENANT_A = "d3b07384-d113-4011-828e-5cb239f1c7d2"
TENANT_B = "e8a15992-f224-4122-939f-6dc340e2d8e3"

def create_test_token(tenant_id: str, user_id: str = "usr-123", role: str = "CLINICIAN"):
    payload = {
        "sub": user_id,
        "email": "clinician@tenant.med",
        "app_metadata": {
            "tenant_id": tenant_id,
            "role": role,
            "npi_number": "MN-998877"
        }
    }
    return jwt.encode(payload, MOCK_SECRET, algorithm="HS256")

def test_valid_token_decoding():
    token = create_test_token(TENANT_A)
    context = decode_multitenant_token(token)
    assert context.tenant_id == TENANT_A
    assert context.user_id == "usr-123"
    assert context.role == "CLINICIAN"
    assert context.is_clinician() is True

def test_missing_tenant_token_rejected():
    payload = {"sub": "usr-rogue", "app_metadata": {}}
    bad_token = jwt.encode(payload, MOCK_SECRET, algorithm="HS256")
    with pytest.raises(HTTPException) as exc_info:
        decode_multitenant_token(bad_token)
    assert exc_info.value.status_code == 403

def test_cross_tenant_websocket_rejection():
    token_tenant_a = create_test_token(TENANT_A)
    # Attempting to listen to Tenant B audio stream with Tenant A token
    with pytest.raises(HTTPException) as exc_info:
        verify_ws_tenant_token(token_tenant_a, requested_tenant_id=TENANT_B)
    assert exc_info.value.status_code == 403
    assert "Cross-tenant breach attempt" in exc_info.value.detail
