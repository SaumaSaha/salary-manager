# ADR 0005: 10-Phase Subagent Software Development Workflow

## Status
Accepted

## Context
Developing and maintaining an enterprise salary management application requires high code quality, strict adherence to architectural layer boundaries, clean API contracts, 100% test coverage, and a readable git history. Traditional single-agent or ad-hoc development workflows risk producing unverified code, skipped tests, stale documentation, or monolithic messy git commits.

To solve this, ACME Org enforces a **10-Phase Subagent Development Workflow** for all code modifications, feature implementations, and architecture changes.

## Decision Drivers
1. **Separation of Concerns**: Each phase of development (tests, implementation, audit, refactoring, verification, docs, commits) is handled by a specialized role.
2. **Test-Driven Development (TDD)**: Tests must be written and committed *before* feature implementation code.
3. **Continuous Auditing**: Code quality, security, performance SLAs, and linter rules are audited at dedicated phases.
4. **Git Log Narrative**: Git commit history must read like a structured engineering narrative showing phase-by-phase progress.

## Considered Options
1. **10-Phase Sequential Subagent Workflow with Cross-Cutting Commit Agent** *(Selected)*
2. **Single Unstructured Agent Execution**
3. **Manual Code Editing without Agent Specialization**

---

## Decision: 10-Phase Sequential Subagent Workflow

We select the **10-Phase Sequential Subagent Workflow**, orchestrated by 10 specialized agent roles operating under `.agents/skills/`.

---

## Architecture Diagrams

### 1. 10-Phase Sequential Pipeline & Phase Execution

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER FEATURE REQUEST                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Test-Writer Agent      (test-writer-agent)                          │
│    • Writes Pytest backend tests & Jest/Vitest frontend tests (TDD)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ──▶ [Commit Agent: "Test: ..."]
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Code-Writer Agent      (code-writer-agent)                          │
│    • Implements FastAPI endpoints & Next.js TypeScript components      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ──▶ [Commit Agent: "Feat: ..."]
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Code-Validator Agent   (code-validator-agent)                       │
│    • Audits API contracts, security bounds, & static safety            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Code-Refactor Agent    (code-refactor-agent)                        │
│    • Optimizes imports, performance, & clean code architecture         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ──▶ [Commit Agent: "Refactor: ..."]
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. Test-Verifier Agent    (test-verifier-agent)                        │
│    • Executes 'make test-be' & 'make test-fe', verifies 100% pass rate │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 6. Coverage-Check Agent   (coverage-check-agent)                       │
│    • Verifies 100% test coverage with 0 missed statements              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 7. Lint-Verifier Agent    (lint-verifier-agent)                        │
│    • Executes 'make lint-be' & 'make lint-fe' (0 linter errors)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ──▶ [Commit Agent: "Fix: ..."]
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 8. Doc-Writer Agent       (doc-writer-agent)                           │
│    • Updates docs/adr/, OpenAPI schemas, & README.md documentation     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ──▶ [Commit Agent: "Docs: ..."]
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 9. Performance Benchmark Agent (performance-benchmark-agent)           │
│    • Audits < 100ms database response SLA & UI render responsiveness   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 10. Commit Agent          (commit-agent)                               │
│     • Ensures final milestone commits follow Conventional Format       │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Cross-Cutting Commit Agent Milestone Flow

```
Agent Phase Completes Work
           │
           ▼
┌─────────────────────────────────────┐
│ Commit Agent (.agents/skills/commit)│
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Identify Changed Files in Scope     │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Format Conventional Commit Message  │
│ (Test:, Feat:, Refactor:,Fix:,Docs:)│
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Execute git add & git commit        │
└──────────┬──────────────────────────┘
           │
           ▼
  Proceed to Next Agent Phase
```

---

## Agent Roles & Responsibility Matrix

| Phase | Agent Role Name | Skill Path | Primary Responsibilities | Output Artifacts |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Test-Writer Agent** | `.agents/skills/test-writer-agent` | Write backend (`pytest`) and frontend (`Vitest`) tests before code implementation (TDD). | `tests/`, `src/*.test.tsx` |
| **2** | **Code-Writer Agent** | `.agents/skills/code-writer-agent` | Implement FastAPI backend logic and Next.js frontend code matching test specs. | `app/`, `src/` |
| **3** | **Code-Validator Agent** | `.agents/skills/code-validator-agent` | Audit code for security issues, API contract alignment, edge-case safety, and schema validation. | Audit report |
| **4** | **Code-Refactor Agent** | `.agents/skills/code-refactor-agent` | Perform clean code refactoring, import sorting, and performance optimization without breaking tests. | Refactored modules |
| **5** | **Test-Verifier Agent** | `.agents/skills/test-verifier-agent` | Run `make test-be` and `make test-fe` to verify 100% test pass rate across all suites. | Test pass log |
| **6** | **Coverage-Check Agent** | `.agents/skills/coverage-check-agent` | Execute `--cov-fail-under=100` and confirm 0 missed statements across all Python/TS files. | Coverage report |
| **7** | **Lint-Verifier Agent** | `.agents/skills/lint-verifier-agent` | Execute `make lint-be` (pylint 10/10) and `make lint-fe` (eslint 0 errors). | Lint log |
| **8** | **Doc-Writer Agent** | `.agents/skills/doc-writer-agent` | Update `docs/adr/`, API specs (`docs/API_CONTRACTS.md`), `README.md`, and inline docstrings. | `docs/`, `README.md` |
| **9** | **Performance Benchmark Agent** | `.agents/skills/performance-benchmark-agent` | Audit query execution (< 100ms for 10,000 records), database indexing, and UI render performance. | SLA Benchmark log |
| **10** | **Commit Agent** | `.agents/skills/commit-agent` | Create milestone git commits using Conventional Commits format after each agent phase. | Git commit log |

---

## Commit Format Standards

The **Commit Agent** ensures all commits use standard conventional prefixes:
- `Test: Add unit tests for paginated employee list endpoint`
- `Feat: Implement GET /api/v1/employees with pagination and filtering`
- `Refactor: Extract query builder and add type annotations`
- `Fix: Resolve pylint C0305 trailing newline violation`
- `Docs: Update ADR 0005 with subagent workflow specification`

---

## Consequences

### Positive:
- **High Code Quality**: Guarantees code is thoroughly tested, validated, refactored, linted, documented, and benchmarked.
- **TDD Enforcement**: Prevents writing feature code without prior test specifications.
- **Traceable History**: Git log clearly documents the phase-by-phase development lifecycle.

### Negative / Mitigations:
- Strict sequential overhead for trivial changes.
  - *Mitigation*: Simple one-line text fixes or doc-only edits skip implementation subagents and execute through `Doc-Writer` + `Commit-Agent` directly.
