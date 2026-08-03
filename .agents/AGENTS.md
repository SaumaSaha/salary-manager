# Salary Manager Workspace Agent Rules & Workflow

This project uses a 9-phase subagent workflow for all code modifications, feature implementations, and architecture changes.

## Agent Roles & Execution Order

Whenever a user requests a new feature, bug fix, or code modification, you MUST execute the work sequentially through the following 9 specialized agents:

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

9. **Commit Agent** (`commit-agent`):
   - Creates small, meaningful git commits after each agent phase using Conventional Commits format. Ensures the git history clearly documents the development process (tests first, then implementation, then refactoring, then fixes, then docs).

## Commit Rules

The **Commit Agent** (`commit-agent`) is a cross-cutting agent that runs **after each phase above**, not just at the end. After every agent completes its work, immediately create a small, focused git commit for that phase's changes before moving on to the next agent. This ensures the git log reads like a clear development narrative:

```
Test: Add unit tests for employee list endpoint
Feat: Implement GET /api/v1/employees with pagination
Refactor: Extract query builder and add type annotations
Fix: Resolve pylint trailing newline violation
Docs: Update README with new employee endpoint
```
