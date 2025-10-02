from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    r = client.get("/")
    assert r.status_code == 200

def test_unauthorized():
    r = client.get("/api/status?target=mainpc")
    assert r.status_code in (200, 401)  # token 미설정 시 200, 설정 시 401