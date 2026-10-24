import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.init_db import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_vault():
    init_db(force_reset_vault=True)
    yield
    init_db(force_reset_vault=True)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "OPERATIONAL"

def test_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "WrongPassword@999"
    })
    assert response.status_code == 401

def test_login_success():
    response = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Admin@1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert any(r["name"] == "ADMIN" for r in data["user"]["roles"])

def test_audit_chain_continuity():
    # Login first as auditor
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "auditor_verma",
        "password": "Audit@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/ledger/audit-chain", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_chain_healthy"] is True
    assert data["total_blocks"] >= 3

def test_verify_integrity():
    # Login as investigating officer
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "io_rajesh",
        "password": "Officer@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    docs_res = client.get("/api/documents", headers=headers)
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) > 0
    doc_id = docs[0]["id"]

    verify_res = client.post(f"/api/documents/{doc_id}/verify", headers=headers)
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["status"] == "VERIFIED"
    assert v_data["is_hash_matching"] is True
    assert v_data["tamper_detected"] is False

def test_tamper_detection_simulation():
    # Login as investigating officer
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "io_rajesh",
        "password": "Officer@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    docs = client.get("/api/documents", headers=headers).json()
    doc_id = docs[0]["id"]

    # 1. Simulate tampering
    tamper_res = client.post(f"/api/documents/{doc_id}/simulate-tamper", headers=headers)
    assert tamper_res.status_code == 200
    assert tamper_res.json()["status"] == "TAMPER_INJECTED"

    # 2. Verify now returns MISMATCH
    verify_res = client.post(f"/api/documents/{doc_id}/verify", headers=headers)
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["status"] == "MISMATCH"
    assert v_data["tamper_detected"] is True
    assert v_data["is_hash_matching"] is False
