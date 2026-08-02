# Salary Manager Workspace Agent Rules & Workflow

This project uses an 8-phase subagent workflow for all code modifications, feature implementations, and architecture changes.

## Agent Roles & Execution Order

Whenever a user requests a new feature, bug fix, or code modification, you MUST execute the work sequentially through the following 8 specialized agents:

1. **Test-Writer Agent** (`test-writer-agent`):
   - Writes backend (`pytest` under `salary-manager-be/tests/`) and frontend (`Jest` / `Testing Library` under `salary-manager-fe/src/__tests__/`) test suites BEFORE code implementation (TDD).

2. **Code-Writer Agent** (`code-writer-agent`):
   - Implements backend FastAPI Python code and frontend Next.js TypeScript code designed to satisfy the test suite and requirements.

3. **Code-Validator Agent** (`code-validator-agent`):
   - Audits newly written code for security vulnerabilities, API/UI contract alignment, boundary validation, and static safety.

4. **Code-Refactor Agent** (`code-refactor-agent`):
   - Refactoring, cleanup, import optimization, and performance improvements without breaking existing test assertions or public contracts.

5. **Test-Verifier Agent** (`test-verifier-agent`):
   - Executes backend (`make test-be`) and frontend (`make test-fe`) test suites and verifies 100% pass rate.

6. **Lint-Verifier Agent** (`lint-verifier-agent`):
   - Executes backend (`make lint-be`) and frontend (`make lint-fe`) linters and verifies 0 linter violations.

7. **Doc-Writer Agent** (`doc-writer-agent`):
   - Updates project documentation in `docs/` (`docs/adr/`, requirements, API contracts) and keeps `README.md` and docstrings aligned with changes.

8. **Performance Benchmark Agent** (`performance-benchmark-agent`):
   - Verifies database query efficiency (< 100ms response SLA for 10,000 employee dataset), query indexing, pagination bounds, and React UI render performance.
