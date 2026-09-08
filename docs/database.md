# Database Design — Student Hub

## 1. Entity Relationship Overview

The PostgreSQL database for Student Hub contains **10 core tables** representing real domain entities:

```text
                    users
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
     subjects       tasks         habits
        │                           │
        ▼                           ▼
      notes                    habit_records

        users
          │
          ▼
        files
          │
          ▼
     file_shares

        users
          │
          ├──────────────► resources
          │
          └──────────────► ai_interactions
```

---

## 2. Table Specifications

### 1. `users`
* `id`: UUID / Integer (Primary Key)
* `name`: VARCHAR(100) (NOT NULL)
* `email`: VARCHAR(255) (UNIQUE, NOT NULL, Indexed)
* `password_hash`: VARCHAR(255) (NOT NULL)
* `is_active`: BOOLEAN (DEFAULT TRUE)
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())
* `updated_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### 2. `subjects`
* `id`: UUID / Integer (Primary Key)
* `user_id`: FK -> users.id (ON DELETE CASCADE)
* `name`: VARCHAR(100) (NOT NULL)
* `color`: VARCHAR(20) (DEFAULT '#3B82F6')
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### 3. `notes`
* `id`: UUID / Integer (Primary Key)
* `user_id`: FK -> users.id (ON DELETE CASCADE)
* `subject_id`: FK -> subjects.id (ON DELETE SET NULL, NULLABLE)
* `title`: VARCHAR(255) (NOT NULL)
* `content`: TEXT (NOT NULL)
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())
* `updated_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### 4. `tasks`
* `id`: UUID / Integer (Primary Key)
* `user_id`: FK -> users.id (ON DELETE CASCADE)
* `title`: VARCHAR(255) (NOT NULL)
* `description`: TEXT (NULLABLE)
* `priority`: VARCHAR(20) (DEFAULT 'medium' — 'low', 'medium', 'high', 'urgent')
* `status`: VARCHAR(20) (DEFAULT 'pending' — 'pending', 'in_progress', 'completed')
* `due_date`: TIMESTAMP WITH TIME ZONE (NULLABLE)
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())
* `updated_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### 5. `habits`
* `id`: UUID / Integer (Primary Key)
* `user_id`: FK -> users.id (ON DELETE CASCADE)
* `name`: VARCHAR(150) (NOT NULL)
* `description`: TEXT (NULLABLE)
* `target_frequency`: VARCHAR(50) (DEFAULT 'daily')
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### 6. `habit_records`
* `id`: UUID / Integer (Primary Key)
* `habit_id`: FK -> habits.id (ON DELETE CASCADE)
* `completed_date`: DATE (NOT NULL)
* `notes`: TEXT (NULLABLE)
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())
* *Constraint*: UNIQUE(habit_id, completed_date)

### 7. `files`
* `id`: UUID / Integer (Primary Key)
* `user_id`: FK -> users.id (ON DELETE CASCADE)
* `filename`: VARCHAR(255) (NOT NULL)
* `file_path`: VARCHAR(500) (NOT NULL)
* `file_size`: BIGINT (NOT NULL)
* `mime_type`: VARCHAR(100) (NOT NULL)
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### 8. `file_shares`
* `id`: UUID / Integer (Primary Key)
* `file_id`: FK -> files.id (ON DELETE CASCADE)
* `share_token`: VARCHAR(100) (UNIQUE, NOT NULL, Indexed)
* `expires_at`: TIMESTAMP WITH TIME ZONE (NULLABLE)
* `max_downloads`: INTEGER (NULLABLE)
* `download_count`: INTEGER (DEFAULT 0)
* `is_active`: BOOLEAN (DEFAULT TRUE)
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### 9. `resources`
* `id`: UUID / Integer (Primary Key)
* `user_id`: FK -> users.id (ON DELETE CASCADE)
* `subject_id`: FK -> subjects.id (ON DELETE SET NULL, NULLABLE)
* `title`: VARCHAR(255) (NOT NULL)
* `url`: VARCHAR(1000) (NOT NULL)
* `resource_type`: VARCHAR(50) (DEFAULT 'link' — 'video', 'article', 'github', 'pdf', 'book')
* `notes`: TEXT (NULLABLE)
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### 10. `ai_interactions`
* `id`: UUID / Integer (Primary Key)
* `user_id`: FK -> users.id (ON DELETE CASCADE)
* `note_id`: FK -> notes.id (ON DELETE SET NULL, NULLABLE)
* `operation`: VARCHAR(50) (NOT NULL — 'summarize', 'key_points', 'quiz_mcq', 'study_qa')
* `prompt_input`: TEXT (NOT NULL)
* `ai_response`: TEXT (NOT NULL)
* `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())
