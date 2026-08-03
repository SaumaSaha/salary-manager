import sys
import os
import argparse
import random
import time
import uuid
from datetime import datetime, timedelta, timezone
from faker import Faker
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, init_db
from app.db.models import CurrencyRate, Employee

# Country configuration: (Country, Currency, Default Locale, (Min Local Salary, Max Local Salary), Exchange Rate to USD)
COUNTRY_CONFIGS = [
    ("USA", "USD", "en_US", (40000, 350000), 1.0),
    ("UK", "GBP", "en_GB", (25000, 200000), 1.27),
    ("India", "INR", "en_IN", (400000, 6000000), 0.012),
    ("Japan", "JPY", "ja_JP", (3000000, 20000000), 0.0067),
    ("Germany", "EUR", "de_DE", (30000, 200000), 1.08),
    ("France", "EUR", "fr_FR", (30000, 200000), 1.08),
    ("Canada", "CAD", "en_CA", (35000, 250000), 0.74),
    ("Australia", "USD", "en_AU", (40000, 250000), 1.0),
    ("Singapore", "USD", "zh_CN", (40000, 250000), 1.0),
    ("Brazil", "USD", "pt_BR", (30000, 180000), 1.0),
    ("Nigeria", "USD", "en_US", (25000, 150000), 1.0),
    ("UAE", "USD", "ar_AA", (35000, 300000), 1.0),
]

DEPARTMENTS = [
    "Engineering",
    "Product",
    "Sales",
    "Marketing",
    "Finance",
    "HR",
    "Operations",
    "Legal",
]

JOB_TITLES = {
    "Engineering": ["Software Engineer", "Senior Engineer", "Staff Engineer", "Engineering Manager", "QA Engineer", "DevOps Engineer"],
    "Product": ["Product Manager", "Senior Product Manager", "UI/UX Designer", "Product Analyst"],
    "Sales": ["Account Executive", "Sales Manager", "Business Development Rep", "Sales Director"],
    "Marketing": ["Marketing Specialist", "Growth Marketer", "SEO Manager", "Content Lead"],
    "Finance": ["Financial Analyst", "Accountant", "Finance Manager", "Controller"],
    "HR": ["HR Generalist", "Talent Acquisition Specialist", "HR Manager", "Compensation Analyst"],
    "Operations": ["Operations Associate", "Logistics Coordinator", "Operations Manager"],
    "Legal": ["Legal Counsel", "Compliance Specialist", "Paralegal"],
}

GENDERS = ["Male", "Female", "Non-Binary"]
GENDER_WEIGHTS = [0.48, 0.48, 0.04]


def populate_currency_rates(db: Session):
    """Seed exchange rates table."""
    rates = {
        "USD": 1.0,
        "EUR": 1.08,
        "GBP": 1.27,
        "INR": 0.012,
        "JPY": 0.0067,
        "CAD": 0.74,
    }
    effective_date = datetime(2026, 1, 1)

    for code, rate in rates.items():
        existing = db.query(CurrencyRate).filter(CurrencyRate.currency == code).first()
        if existing:
            existing.rate_to_usd = rate
            existing.effective_date = effective_date
        else:
            db.add(CurrencyRate(currency=code, rate_to_usd=rate, effective_date=effective_date))
    db.commit()


def generate_employee_batch(batch_size: int, start_index: int) -> list[dict]:
    """Generate a list of realistic employee dictionaries using Faker."""
    fake_en = Faker("en_US")
    records = []

    now = datetime.now(timezone.utc)
    start_hire = now - timedelta(days=365 * 10)

    for i in range(batch_size):
        country_info = random.choice(COUNTRY_CONFIGS)
        country, currency, locale, salary_range, rate = country_info

        department = random.choice(DEPARTMENTS)
        job_title = random.choice(JOB_TITLES[department])
        gender = random.choices(GENDERS, weights=GENDER_WEIGHTS)[0]

        first_name = fake_en.first_name_female() if gender == "Female" else fake_en.first_name_male()
        last_name = fake_en.last_name()
        email = f"{first_name.lower()}.{last_name.lower()}.{start_index + i}@acme.com"

        base_salary = float(round(random.uniform(salary_range[0], salary_range[1]), -2))
        usd_salary = float(round(base_salary * rate, 2))

        # Bell-curve performance rating (1 to 5)
        performance = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.15, 0.60, 0.15, 0.05])[0]
        bonus_percentage = float(round(random.uniform(0.0, 20.0), 1))

        random_days = random.randint(0, 3650)
        hire_date = start_hire + timedelta(days=random_days)

        records.append({
            "id": str(uuid.uuid4()),
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "job_title": job_title,
            "department": department,
            "country": country,
            "base_salary": base_salary,
            "currency": currency,
            "usd_salary": usd_salary,
            "bonus_percentage": bonus_percentage,
            "gender": gender,
            "performance": performance,
            "hire_date": hire_date,
            "created_at": now,
            "updated_at": now,
        })

    return records


def seed_database(db: Session, count: int = 10000, reset: bool = False):
    """Seed the database with exchange rates and employees in fast 1000-record batches."""
    init_db()

    if reset:
        print("Resetting database tables...")
        db.query(Employee).delete()
        db.commit()

    print("Seeding currency rates...")
    populate_currency_rates(db)

    print(f"Seeding {count:,} employee records...")
    start_time = time.time()

    batch_size = 1000
    total_seeded = 0

    while total_seeded < count:
        current_batch_size = min(batch_size, count - total_seeded)
        records = generate_employee_batch(current_batch_size, total_seeded)
        db.bulk_insert_mappings(Employee, records)
        db.commit()
        total_seeded += current_batch_size
        print(f"Seeded {total_seeded:,} / {count:,} employees...")

    elapsed = time.time() - start_time
    print(f"✅ Seeding completed! {count:,} employee records seeded in {elapsed:.2f} seconds.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed ACME Salary Manager database.")
    parser.add_argument("--count", type=int, default=10000, help="Number of employee records to seed (default: 10000)")
    parser.add_argument("--reset", action="store_true", help="Clear existing data before seeding")
    args = parser.parse_args()

    session = SessionLocal()
    try:
        seed_database(session, count=args.count, reset=args.reset)
    finally:
        session.close()
