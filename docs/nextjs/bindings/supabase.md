# Binding: Supabase (roles: database platform, identity)

Maps the *database platform* and *identity* roles to Supabase (Postgres, Auth, migrations,
RLS, Data API).

## Rules

<!-- rules: supabase -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-SB-01 | guidance | Supabase migrations are the only schema source (`supabase migration new`, `supabase/migrations/`). The project is **migrations-first** (NX-DB-01, NX-DRZ-03). | agent |
| NX-SB-02 | guidance | The app connects with the ORM as the database owner through the transaction pooler. Row policies therefore do **not** apply to app queries; tenant isolation is enforced in the repository (NX-AUTH-03). Row policies guard only the Data API (NX-AUTH-04). | agent |
| NX-SB-03 | guidance | `Requester` is built from `supabase.auth.getUser()` in `lib/safe-action.ts` and `lib/auth/requester.ts`. `tenantId` is the user's id until shared workspaces exist, when it becomes the workspace id; `roles` is empty until roles exist. | agent |
| NX-SB-04 | error | `handle_new_user` on `auth.users` is a category D hook (NX-DB-02): it provisions the account row and its defaults however a user appears. It is the only trigger allowed to write business rows. | check:inventory |
| NX-SB-05 | error | Queue claims (`claim_*`, `finalize_*`) are category A; `SECURITY DEFINER` helpers used by policies or `CHECK` constraints (`is_iana_timezone`) are category C; read-model functions for the Data API are category B. All have inventory rows. | check:inventory |
| NX-SB-06 | error | Database tests (policies, constraints, category A–E functions) are written with pgTAP in `supabase/tests/` and run in CI against the local stack (NX-TEST-04). | ci:pgtap |
| NX-SB-07 | error | Integration tests use `describeIntegration()` from `@conventions/nextjs/testing`, whose default probe is `supabase status`. | ast-grep:nx-test-03-integration-tests-skip-loudly |
| NX-SB-08 | error | The Supabase JS client is used for Auth and Storage only; data access goes through the ORM. A module that needs the Data API (realtime, edge) records it in `ARCHITECTURE.md`. | eslint:boundaries/external |
<!-- /rules -->

## Inventory

Every project using this binding has `docs/architecture/db-inventory.md` (written by
`conventions init`) with a row per function, trigger and policy helper. A migration that adds
one adds the row in the same PR; `conventions check` compares the two (NX-DB-02).
