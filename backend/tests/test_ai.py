import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_authenticated_user_token(name_prefix="AIUser"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"{name_prefix} {suffix}",
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()["access_token"]

def test_ai_study_assistant_workflow():
    token = create_authenticated_user_token("AITester")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a study note to use for AI testing
    note_payload = {
        "title": "Introduction to Database Normalization",
        "content": "Database normalization is the process of structuring a relational database to reduce data redundancy and improve data integrity. 1NF removes repeating groups. 2NF removes partial dependencies. 3NF removes transitive dependencies."
    }
    note_res = client.post("/api/v1/notes", json=note_payload, headers=headers)
    assert note_res.status_code == 201
    note_id = note_res.json()["id"]

    # 2. Test AI Summarization by note_id
    sum_res = client.post("/api/v1/ai/summarize", json={"note_id": note_id}, headers=headers)
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert "summary" in sum_data
    assert "key_takeaway" in sum_data
    assert sum_data["interaction_id"] is not None

    # 3. Test AI Key Points by raw text content
    kp_res = client.post("/api/v1/ai/key-points", json={"content": "Object Oriented Programming principles include Encapsulation, Abstraction, Inheritance, and Polymorphism."}, headers=headers)
    assert kp_res.status_code == 200
    kp_data = kp_res.json()
    assert len(kp_data["key_points"]) > 0

    # 4. Test MCQ Quiz Generation
    quiz_res = client.post("/api/v1/ai/generate-quiz", json={"note_id": note_id, "num_questions": 2}, headers=headers)
    assert quiz_res.status_code == 200
    quiz_data = quiz_res.json()
    assert len(quiz_data["questions"]) == 2
    assert len(quiz_data["questions"][0]["options"]) >= 2
    assert "correct_answer" in quiz_data["questions"][0]

    # 5. Test AI Topic Explanation
    exp_res = client.post("/api/v1/ai/explain", json={"topic": "Dijkstra's Algorithm", "context": "Graph Theory"}, headers=headers)
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert exp_data["topic"] == "Dijkstra's Algorithm"
    assert len(exp_data["explanation"]) > 10

    # 6. Verify AI Interaction History
    hist_res = client.get("/api/v1/ai/history", headers=headers)
    assert hist_res.status_code == 200
    interactions = hist_res.json()
    assert len(interactions) >= 4  # (summarize, key-points, quiz, explain)
    operations = [i["operation"] for i in interactions]
    assert "summarize" in operations
    assert "quiz_mcq" in operations

def test_tenant_isolation_on_ai_note_access():
    token_a = create_authenticated_user_token("UserA")
    token_b = create_authenticated_user_token("UserB")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a note
    note_a = client.post("/api/v1/notes", json={"title": "Private Research", "content": "Confidential student thesis work."}, headers=headers_a).json()

    # User B should NOT be able to invoke AI operations on User A's note
    res = client.post("/api/v1/ai/summarize", json={"note_id": note_a["id"]}, headers=headers_b)
    assert res.status_code == 404
