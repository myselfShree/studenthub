# Software Requirements Specification (SRS) — Student Hub

## 1. Introduction

### 1.1 Purpose
Student Hub is a comprehensive web platform designed to streamline student productivity, learning, and academic resource management in a single cohesive workspace.

### 1.2 Target Audience
Students in higher education (undergraduate/postgraduate) needing a centralized hub for notes, tasks, habits, study materials, and AI-assisted learning.

---

## 2. Functional Requirements (FR)

- **FR-1: User Management & Authentication**
  - Registration with unique email validation and secure password hashing.
  - JWT token authentication with authorization checks per route.
  - User profile retrieval and management.

- **FR-2: Academic Subjects**
  - CRUD operations for subjects.
  - Color tagging for visual distinction.

- **FR-3: Smart Notes**
  - Rich text note creation, editing, subject assignment, and retrieval.
  - Full-text search and subject filtering.

- **FR-4: Tasks & Assignment Management**
  - Creation of tasks with title, description, priority, status, and due dates.
  - Status updates (pending, in_progress, completed) and overdue detection.

- **FR-5: Habit Tracker**
  - Habit definitions with target frequencies.
  - Daily check-ins (habit_records).
  - Dynamic streak calculation and consistency metrics.

- **FR-6: QR File Sharing**
  - Upload file securely with metadata storage.
  - Generate temporary/permanent share records with unique tokens.
  - Generate scannable QR codes linking directly to public/controlled download routes.

- **FR-7: AI Study Assistant (Gemini)**
  - Note summarization into concise key takeaways.
  - Key concepts & definitions extraction.
  - Practice MCQ / question generation based on study material.
  - Persistent interaction history.

- **FR-8: Resource Hub**
  - Bookmarking educational links, videos, documents, and repos by subject.

- **FR-9: Consolidated Student Dashboard**
  - Real-time aggregation of today's schedule, pending tasks, active streaks, and recent notes.

---

## 3. Non-Functional Requirements (NFR)

- **NFR-1: Security**
  - Passwords hashed using standard cryptographic algorithms (bcrypt).
  - Server-side environment isolation for API credentials (Gemini, Database).
  - Strict tenant isolation (users can only access their own entities).

- **NFR-2: Performance**
  - API response times < 200ms for standard CRUD operations.
  - Asynchronous background execution for heavy AI/file generation tasks where needed.

- **NFR-3: Maintainability & Scalability**
  - Layered architecture with strict separation between API, Services, and ORM models.
  - Migration-driven database schema changes using Alembic.
