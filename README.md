# Student Hub 🎓

A full-stack student productivity web application built with Next.js (frontend) and FastAPI (backend).

**College Project** — by [Shrikant Yadwad](https://www.linkedin.com/in/shrikant-nagesh-yadwad-5b3075252/) & [Piyush Adhav](https://www.linkedin.com/in/piyush-adhav-b5323a360/) · Indira University

---

## 🚀 Live URLs
- **Frontend:** https://studenthub-amber.vercel.app
- **Backend API:** https://studenthub-backend-u02v.onrender.com
- **API Docs:** https://studenthub-backend-u02v.onrender.com/docs

---

## 📁 Project Structure

```
fullp/
├── frontend/          ← Next.js 14 (React, TypeScript, Tailwind CSS)
│   ├── app/           ← All 15 pages
│   ├── components/    ← Reusable UI components
│   ├── context/       ← Auth + Theme context providers
│   ├── lib/api.ts     ← API client (all backend calls)
│   └── start.bat      ← One-click local start
│
├── backend/           ← FastAPI (Python)
│   ├── app/
│   │   ├── api/v1/endpoints/   ← All API route handlers
│   │   ├── models/             ← SQLAlchemy DB models
│   │   ├── schemas/            ← Pydantic validation schemas
│   │   ├── services/           ← Business logic
│   │   └── core/               ← Config, DB, Security
│   ├── tests/         ← 45 automated test cases
│   ├── alembic/       ← Database migrations
│   ├── .env           ← Local environment config
│   └── start.bat      ← One-click local start
│
└── start-all.bat      ← Start BOTH frontend + backend together
```

---

## 🖥️ Run Locally

### Prerequisites
Make sure you have installed:
- [Python 3.10+](https://python.org)
- [Node.js 18+](https://nodejs.org)
- [PostgreSQL](https://postgresql.org) running locally

### Step 1 — Set up PostgreSQL
1. Open **pgAdmin** or **psql**
2. Create a database called `studenthub_db`
```sql
CREATE DATABASE studenthub_db;
```

### Step 2 — Configure Backend
Edit [`backend/.env`](backend/.env) and set your PostgreSQL password:
```env
POSTGRES_PASSWORD=your_postgres_password
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/studenthub_db
```

### Step 3 — Start Everything (Easiest Way)
Double-click [`start-all.bat`](start-all.bat) in the root folder.

This opens two terminal windows:
- **Backend** → http://localhost:8000
- **Frontend** → http://localhost:3000

---

### Manual Start (Alternative)

**Backend:**
```bash
cd backend
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new account |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/forgot-password` | Send reset email |
| POST | `/api/v1/auth/reset-password` | Reset password with token |
| GET | `/api/v1/auth/me` | Get current user profile |
| PUT | `/api/v1/auth/me` | Update profile |
| GET | `/api/v1/dashboard/summary` | Dashboard stats |
| GET | `/api/v1/notes` | List notes |
| POST | `/api/v1/notes` | Create note |
| PUT | `/api/v1/notes/{id}` | Update note |
| DELETE | `/api/v1/notes/{id}` | Delete note |
| GET | `/api/v1/subjects` | List subjects |
| POST | `/api/v1/subjects` | Create subject |
| GET | `/api/v1/tasks` | List tasks |
| POST | `/api/v1/tasks` | Create task |
| PATCH | `/api/v1/tasks/{id}/status` | Update task status |
| GET | `/api/v1/habits` | List habits |
| POST | `/api/v1/habits` | Create habit |
| POST | `/api/v1/habits/{id}/checkin` | Check in habit |
| GET | `/api/v1/files` | List uploaded files |
| POST | `/api/v1/files/upload` | Upload a file |
| POST | `/api/v1/files/{id}/share` | Create QR share link |
| GET | `/api/v1/files/shared/{token}` | Get shared file info (public) |
| GET | `/api/v1/resources` | List resources |
| POST | `/api/v1/resources` | Add resource |
| DELETE | `/api/v1/resources/{id}` | Delete resource |
| POST | `/api/v1/ai/chat` | AI study assistant chat |
| POST | `/api/v1/ai/summarize` | Summarize note content |
| POST | `/api/v1/ai/key-points` | Extract key points |
| POST | `/api/v1/ai/generate-quiz` | Generate MCQ quiz |
| POST | `/api/v1/ai/explain` | Explain a topic |
| GET | `/api/v1/ai/history` | AI interaction history |
| GET | `/api/v1/health` | API health check |

Full interactive docs: http://localhost:8000/docs

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:root@localhost:5432/studenthub_db` |
| `SECRET_KEY` | JWT signing secret | any long random string |
| `GEMINI_API_KEY` | Google Gemini AI key | `AIza...` |
| `SMTP_USER` | Gmail address for emails | `shreeyadwad@gmail.com` |
| `SMTP_PASSWORD` | Gmail App Password (16 chars) | `abcdabcdabcdabcd` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

---

## 🧪 Run Tests
```bash
cd backend
.venv\Scripts\activate
python -m pytest tests -v
```
Expected: **45 tests passed** ✅

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.10+ |
| Database | PostgreSQL + SQLAlchemy ORM |
| Auth | JWT (python-jose) + bcrypt |
| AI | Google Gemini API |
| Email | smtplib (Gmail SMTP) |
| File Storage | Local filesystem + QR codes |
| Deployment | Vercel (frontend) + Render (backend) |
