from datetime import datetime

from app.db.models import Employee
from app.db.adapter import AggFunc, AggSpec, SQLAlchemyDatabaseAdapter


def test_database_adapter_crud(db):
    """Test generic database adapter find_one, save, update, delete, and count operations."""
    adapter = SQLAlchemyDatabaseAdapter(db)

    # 1. Save
    emp_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test.user@acme.com",
        "job_title": "Engineer",
        "department": "Engineering",
        "country": "USA",
        "base_salary": 100000.0,
        "currency": "USD",
        "usd_salary": 100000.0,
        "gender": "Male",
        "hire_date": datetime(2023, 1, 1),
    }
    emp = adapter.save(Employee, emp_data)
    assert emp.id is not None
    assert emp.email == "test.user@acme.com"

    # 2. Count
    assert adapter.count(Employee, filters=[Employee.department == "Engineering"]) == 1

    # 3. Find One
    fetched = adapter.find_one(Employee, filters=[Employee.email == "test.user@acme.com"])
    assert fetched is not None
    assert fetched.id == emp.id

    # 4. Find All with string sort_col
    results = adapter.find_all(Employee, sort_col="last_name", sort_order="asc", limit=5)
    assert isinstance(results, list)

    # 5. Aggregate via AggSpec — MIN and MAX salary
    agg_results = adapter.aggregate(
        Employee,
        aggs=[AggSpec(AggFunc.MIN, "usd_salary"), AggSpec(AggFunc.MAX, "usd_salary")],
    )
    assert agg_results[0][0] == 100000.0
    assert agg_results[0][1] == 100000.0

    # 6. ilike_search returns a usable filter
    search_filter = adapter.ilike_search(Employee, fields=["first_name", "last_name"], pattern="%Test%")
    found = adapter.find_all(Employee, filters=[search_filter])
    assert len(found) == 1
    assert found[0].first_name == "Test"

    # 7. Update
    updated = adapter.update(
        Employee, filters=[Employee.id == emp.id], data_dict={"job_title": "Lead Engineer"}
    )
    assert updated.job_title == "Lead Engineer"

    # 8. Delete
    adapter.delete(Employee, filters=[Employee.id == emp.id])
    assert adapter.find_one(Employee, filters=[Employee.id == emp.id]) is None
