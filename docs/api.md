# REST API Specification — Student Hub

Base URL: `/api/v1`

All protected endpoints require an `Authorization: Bearer <jwt_token>` header.

---

## 1. Authentication (`/auth`)
- `POST /auth/register` — Register a new student account
- `POST /auth/login` — Authenticate and retrieve access token
- `GET /auth/me` — Retrieve current authenticated user profile
- `POST /auth/logout` — Invalidate session / token

---

## 2. Subjects (`/subjects`)
- `GET /subjects` — List all subjects for current user
- `POST /subjects` — Create a new subject
- `GET /subjects/{id}` — Get single subject details
- `PUT /subjects/{id}` — Update subject
- `DELETE /subjects/{id}` — Delete subject

---

## 3. Notes (`/notes`)
- `GET /notes` — List notes (with optional `?subject_id=` and `?search=` filters)
- `POST /notes` — Create note
- `GET /notes/{id}` — Get note by ID
- `PUT /notes/{id}` — Update note
- `DELETE /notes/{id}` — Delete note

---

## 4. Tasks (`/tasks`)
- `GET /tasks` — List tasks (filter by `status`, `priority`)
- `POST /tasks` — Create task
- `GET /tasks/{id}` — Get task
- `PATCH /tasks/{id}` — Update task / status toggle
- `DELETE /tasks/{id}` — Delete task

---

## 5. Habits (`/habits`)
- `GET /habits` — List all user habits with current streaks
- `POST /habits` — Create new habit
- `POST /habits/{id}/checkin` — Mark habit as completed for a specific date
- `DELETE /habits/{id}/checkin/{record_id}` — Undo completion
- `DELETE /habits/{id}` — Delete habit

---

## 6. Files & QR Sharing (`/files`)
- `POST /files/upload` — Upload file & record metadata
- `GET /files` — List user uploaded files
- `POST /files/{id}/share` — Generate share token & QR code
- `GET /files/shared/{token}` — Public/controlled view of shared file
- `GET /files/shared/{token}/download` — Download shared file
- `GET /files/shared/{token}/qr` — Render / stream QR code image
- `DELETE /files/{id}` — Delete file and associated shares

---

## 7. AI Study Assistant (`/ai`)
- `POST /ai/summarize` — Generate concise summary of a note
- `POST /ai/key-points` — Extract key concepts and bullets
- `POST /ai/generate-quiz` — Generate MCQs and review questions from note content
- `GET /ai/history` — List past AI study interactions

---

## 8. Resources (`/resources`)
- `GET /resources` — List saved resources (filterable by subject)
- `POST /resources` — Create resource bookmark
- `PUT /resources/{id}` — Update resource
- `DELETE /resources/{id}` — Delete resource

---

## 9. Dashboard (`/dashboard`)
- `GET /dashboard/summary` — Aggregate payload with today's tasks, pending count, habit completion stats, recent notes, and study activity
