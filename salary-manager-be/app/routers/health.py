from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", summary="Health Check")
def health_check():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION
    }
