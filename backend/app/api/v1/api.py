from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, subjects, notes, tasks, habits, files, ai, resources

api_router = APIRouter()

# Include sub-routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(notes.router, prefix="/notes", tags=["Notes"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(habits.router, prefix="/habits", tags=["Habits"])
api_router.include_router(files.router, prefix="/files", tags=["Files & QR Sharing"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Study Assistant"])
api_router.include_router(resources.router, prefix="/resources", tags=["Resource Hub"])
