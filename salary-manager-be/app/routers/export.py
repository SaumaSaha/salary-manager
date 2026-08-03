from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/csv")
def export_csv(
    search: Optional[str] = Query(None, description="Global search query filter"),
    department: Optional[list[str]] = Query(None, description="Department filter(s)"),
    country: Optional[list[str]] = Query(None, description="Country filter(s)"),
    min_usd_salary: Optional[float] = Query(None, ge=0, description="Minimum USD salary"),
    max_usd_salary: Optional[float] = Query(None, ge=0, description="Maximum USD salary"),
    db: Session = Depends(get_db),
):
    """Stream filtered employee dataset as a CSV file attachment."""
    service = EmployeeService(db)
    csv_stream = service.stream_csv_export(
        search=search,
        departments=department,
        countries=country,
        min_usd_salary=min_usd_salary,
        max_usd_salary=max_usd_salary,
    )

    filename = "employees_export.csv"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Access-Control-Expose-Headers": "Content-Disposition",
    }

    return StreamingResponse(
        csv_stream,
        media_type="text/csv",
        headers=headers,
    )
