# Student Hub 🎓

> A one-stop student productivity and learning platform combining Notion-style notes, habit tracking, task management, Gemini-powered AI study assistance, and QR-based file sharing.

---

## 📌 Features (V1 Roadmap)

1. **Authentication & User Management**: Secure registration, login, profile, and session handling with JWT/cookie-based auth.
2. **Dashboard**: Unified hub showing today's tasks, pending deadlines, habit streaks, recent notes, and study stats.
3. **Academic Subjects**: Structured organization layer for notes, resources, and assignments.
4. **Smart Notes**: Rich note creation, subject categorization, and quick search.
5. **AI Study Assistant**: Gemini API-powered note summarization, key points extraction, and MCQ/quiz generation.
6. **Task & Assignment Manager**: Deadlines, priority levels, status tracking, and completion workflows.
7. **Habit Tracker**: Daily habit tracking with streak calculations and historical logs.
8. **QR File Sharing**: Secure file upload, expiring share tokens, and dynamic QR code generation.
9. **Resource Hub**: Centralized repository for study materials, links, videos, and references.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic, Alembic
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini API
- **QR Generation**: Python `qrcode` / `segno`
- **Architecture**: Modular Monolith / Clean Service-Repository Layer

---

## 📁 Project Structure

```text
studenthub/
│
├── frontend/             # Next.js App Router, Tailwind CSS, TypeScript
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── services/
│   └── types/
│
├── backend/              # FastAPI Application
│   ├── app/
│   │   ├── api/          # Route controllers
│   │   ├── core/         # Config, security, database session
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic data schemas (validation)
│   │   ├── services/     # Business logic layer
│   │   └── main.py       # FastAPI entrypoint
│   ├── tests/            # Pytest test suite
│   └── requirements.txt  # Python backend dependencies
│
├── docs/                 # System documentation & diagrams
│   ├── requirements.md   # Functional & Non-functional specs
│   ├── architecture.md   # System design & component flows
│   ├── database.md       # PostgreSQL schema & Data dictionary
│   └── api.md            # REST API endpoints documentation
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

Instructions for local setup will be documented as each phase is completed.
