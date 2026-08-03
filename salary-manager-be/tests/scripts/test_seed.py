import time
from sqlalchemy import func
from app.db.models import Employee, CurrencyRate
from scripts.seed import seed_database

def test_seed_database_execution(db):
    """Test seed_database populates currency rates and requested record count."""
    start_time = time.time()
    
    # Run seed script for 100 records
    seed_database(db=db, count=100, reset=True)
    
    elapsed = time.time() - start_time
    
    # Check execution speed constraint (< 5s for 10,000, should be < 1s for 100)
    assert elapsed < 5.0

    # Verify counts
    emp_count = db.query(func.count(Employee.id)).scalar()
    assert emp_count == 100

    rate_count = db.query(func.count(CurrencyRate.currency)).scalar()
    assert rate_count >= 6

    # Verify field properties on seeded record
    sample = db.query(Employee).first()
    assert sample.id is not None
    assert sample.first_name != ""
    assert sample.last_name != ""
    assert "@" in sample.email
    assert sample.base_salary > 0
    assert sample.usd_salary > 0
