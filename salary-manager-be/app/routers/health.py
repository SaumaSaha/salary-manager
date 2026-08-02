from typing import Dict
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

@router.get("/ping", summary="Ping Check")
def ping_check() -> Dict[str, str]:
    """Uptime monitoring endpoint returning basic service status."""
    return {
        "status": "pong",
        "service": "salary-manager-be"
    }
