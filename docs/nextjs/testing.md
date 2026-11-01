# Testing Policy

Profile: `nextjs` · Core document (vendor-agnostic)

<!-- rules: testing -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-TEST-01 | error | Every use case has a unit test next to it, run with in-memory fakes for its ports. No database, no Next. | check:use-case-test |
| NX-TEST-02 | error | Every repository has an integration test (`*.integration.test.ts`) against a real database. For tenant-owned data it proves another tenant's rows can be neither read nor changed (NX-AUTH-03). | check:repository-test |
| NX-TEST-03 | error | Integration tests run in the normal test command and use `describeIntegration()` from `@conventions/nextjs/testing`, which skips with a message when no local database stack is running. They never silently pass. | ast-grep:nx-test-03-integration-tests-skip-loudly |
| NX-TEST-04 | guidance | Database code in categories A–E (NX-DB-02) has a database-level test; the binding names the tool. | agent |
| NX-TEST-05 | guidance | Browser tests cover user goals, not components: one `tests/browser/<flow>.spec.ts` per critical flow. | agent |
| NX-TEST-06 | guidance | Domain functions are tested by example tables, not by mocking: `applyPayment` with a paid order returns `OrderAlreadyPaid`. | agent |
| NX-TEST-07 | error | Test files and `__fakes__/` are exempt from layer import rules but not from naming rules. | ast-grep:nx-str-06-testing-only-in-tests |
| NX-TEST-08 | guidance | Test data comes from factories (`tests/factories/<noun>.ts`, `anOrder({ status: 'paid' })`), not from inline literals repeated across tests. | agent |
<!-- /rules -->
