.PHONY: help install install-be install-fe seed dev-be dev-fe test test-be test-fe lint lint-be lint-fe setup-hooks clean

help:
	@echo "ACME Salary Manager - Commands:"
	@echo "  make install      - Install all dependencies & setup git hooks"
	@echo "  make install-be   - Setup backend virtualenv & install dependencies"
	@echo "  make install-fe   - Install frontend dependencies"
	@echo "  make seed         - Seed 10,000 employees into SQLite DB"
	@echo "  make dev-be       - Start FastAPI backend server"
	@echo "  make dev-fe       - Start Next.js frontend server"
	@echo "  make test         - Run backend and frontend test suites"
	@echo "  make test-be      - Run backend pytest suite with coverage"
	@echo "  make test-fe      - Run frontend test suite"
	@echo "  make lint         - Run backend and frontend linters"
	@echo "  make lint-be      - Run backend pylint"
	@echo "  make lint-fe      - Run frontend eslint"
	@echo "  make setup-hooks  - Configure git pre-commit hooks"
	@echo "  make clean        - Remove bytecode cache files via pyclean"

install-be:
	cd salary-manager-be && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

install-fe:
	cd salary-manager-fe && npm install

install: install-be install-fe setup-hooks

seed:
	cd salary-manager-be && .venv/bin/python scripts/seed.py

dev-be:
	cd salary-manager-be && .venv/bin/uvicorn app.main:app --reload --port 8000

dev-fe:
	cd salary-manager-fe && npm run dev

test-be:
	cd salary-manager-be && .venv/bin/pytest --cov=app --cov-report=term-missing --cov-fail-under=100

test-fe:
	cd salary-manager-fe && npm test

test: test-be test-fe

lint-be:
	cd salary-manager-be && PYTHONPATH=. .venv/bin/pylint app

lint-fe:
	cd salary-manager-fe && npm run lint

lint: lint-be lint-fe

setup-hooks:
	./scripts/setup-hooks.sh

clean:
	cd salary-manager-be && .venv/bin/pyclean .
