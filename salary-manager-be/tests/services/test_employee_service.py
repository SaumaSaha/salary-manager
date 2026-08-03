from datetime import datetime
import pytest
from fastapi import HTTPException

from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.services.employee_service import EmployeeService

def test_create_employee_service_success(db, sample_employee_payload):
    """Verify EmployeeService successfully creates an employee and computes usd_salary."""
    service = EmployeeService(db)
    create_schema = EmployeeCreate(**sample_employee_payload)
    
    employee = service.create_employee(create_schema)
    
    assert employee.id is not None
    assert employee.email == "jane.doe@acme.com"
    assert employee.usd_salary == 120000.0  # 120k USD * 1.0


def test_create_employee_duplicate_email(db, sample_employee_payload):
    """Verify creating an employee with duplicate email raises 409 Conflict."""
    service = EmployeeService(db)
    create_schema = EmployeeCreate(**sample_employee_payload)
    
    # First creation
    service.create_employee(create_schema)
    
    # Second creation with duplicate email
    with pytest.raises(HTTPException) as exc_info:
        service.create_employee(create_schema)
        
    assert exc_info.value.status_code == 409
    assert "already registered" in exc_info.value.detail


def test_update_employee_recalculates_usd(db, sample_employee_payload):
    """Verify updating salary/currency recalculates usd_salary."""
    service = EmployeeService(db)
    emp = service.create_employee(EmployeeCreate(**sample_employee_payload))
    
    # Update currency to EUR (rate 1.08) and base salary to 100,000
    update_data = EmployeeUpdate(base_salary=100000.0, currency="EUR")
    updated_emp = service.update_employee(emp.id, update_data)
    
    assert updated_emp.base_salary == 100000.0
    assert updated_emp.currency == "EUR"
    assert updated_emp.usd_salary == 108000.0  # 100,000 * 1.08


def test_get_employee_not_found(db):
    """Verify requesting non-existent employee raises 404 Not Found."""
    service = EmployeeService(db)
    
    with pytest.raises(HTTPException) as exc_info:
        service.get_employee("non-existent-uuid")
        
    assert exc_info.value.status_code == 404


def test_update_employee_duplicate_email(db, sample_employee_payload):
    """Verify updating an employee's email to another existing employee's email raises 409 Conflict."""
    service = EmployeeService(db)
    emp1 = service.create_employee(EmployeeCreate(**sample_employee_payload))

    payload2 = sample_employee_payload.copy()
    payload2["email"] = "other.user@acme.com"
    emp2 = service.create_employee(EmployeeCreate(**payload2))

    with pytest.raises(HTTPException) as exc_info:
        service.update_employee(emp2.id, EmployeeUpdate(email=emp1.email))

    assert exc_info.value.status_code == 409
    assert "already registered" in exc_info.value.detail

