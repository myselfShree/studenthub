# System Architecture — Student Hub

## 1. High-Level Architecture Overview

Student Hub follows a clean multi-tier client-server architecture with strict separation of concerns.

```text
                    ┌─────────────────────────┐
                    │      STUDENT / USER     │
                    └────────────┬────────────┘
                                 │ HTTP / HTTPS
                                 ▼
                    ┌─────────────────────────┐
                    │    Next.js Frontend     │
                    │ (TypeScript + Tailwind) │
                    └────────────┬────────────┘
                                 │ REST API (JSON)
                                 ▼
                    ┌─────────────────────────┐
                    │     FastAPI Backend     │
                    └────────────┬────────────┘
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ SQLAlchemy (ORM) │   │ Gemini AI Engine │   │   File Storage   │
└─────────┬────────┘   └──────────────────┘   │     Service      │
          │                                   └──────────────────┘
          ▼
┌──────────────────┐
│ PostgreSQL DB    │
└──────────────────┘
```

---

## 2. Backend Layer Separation

The backend is structured into distinct layers to ensure maintainability, testability, and clean code:

```text
[HTTP Request] 
      │
      ▼
┌──────────────┐
│  API Routers │  (app/api/)      -> Handles HTTP requests, path params, status codes
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Pydantic     │  (app/schemas/)  -> Request validation & Response serialization
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Service      │  (app/services/) -> Business logic, calculations, third-party integrations (Gemini/QR/Files)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ SQLAlchemy   │  (app/models/)   -> ORM models, relationships, and queries
└──────┬───────┘
       │
       ▼
[PostgreSQL Database]
```

---

## 3. Key Design Principles

1. **Security First**: Passwords hashed with bcrypt/Argon2. JWT tokens for stateless authentication. Secrets kept server-side in `.env`.
2. **Database Integrity**: PostgreSQL handles entity relationships, foreign keys, cascade deletes, and constraints.
3. **Stateless Backend**: FastAPI server holds no session state in memory, allowing easy scaling.
4. **Storage Abstraction**: File upload/sharing services interact with a storage interface rather than tight coupling to local disk or cloud.
