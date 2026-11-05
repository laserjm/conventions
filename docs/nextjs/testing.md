# Testing Policy

Profile: `nextjs` · Core document (vendor-agnostic)

<!-- rules: testing -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-TEST-01 | error | Every use case has a unit test next to it, run with in-memory fakes for its ports. No database, no Next. A thin use case may instead be covered by the module's command test, `commands.integration.test.ts` next to `commands.ts`, which calls it by its export name (`startThread`) against a real database with requesters it builds itself. Use cases with rules worth example tables (NX-TEST-06) keep their unit test. | check:use-case-test |
| NX-TEST-02 | error | Every repository has an integration test (`*.integration.test.ts`) against a real database: its own, or the module's command test when `commands.ts` imports it. A repository only `queries.ts` reaches has its own. For owned data (`isolation: tenant` or `owner`) the test proves another owner's rows can be neither read nor changed (NX-AUTH-03). | check:repository-test |
| NX-TEST-03 | error | Integration tests run in the normal test command and use `describeIntegration()` from `@conventions/nextjs/testing`, which skips with a message when no local database stack is running. They never silently pass. A project that finds its stack its own way passes that check: `describeIntegration(name, fn, { when: localStack })`. | ast-grep:nx-test-03-integration-tests-skip-loudly |
| NX-TEST-04 | guidance | Database code in categories A–E (NX-DB-02) has a database-level test; the binding names the tool. | agent |
| NX-TEST-05 | guidance | Browser tests cover user goals, not components: one `tests/browser/<flow>.spec.ts` per critical flow. | agent |
| NX-TEST-06 | guidance | Domain functions are tested by example tables, not by mocking: `applyPayment` with a paid order returns `OrderAlreadyPaid`. | agent |
| NX-TEST-07 | error | Test files and `__fakes__/` are exempt from layer import rules but not from naming rules. | ast-grep:nx-str-06-testing-only-in-tests |
| NX-TEST-08 | guidance | Test data comes from factories (`tests/factories/<noun>.ts`, `anOrder({ status: 'paid' })`), not from inline literals repeated across tests. | agent |
<!-- /rules -->

## Command tests

A use case gets a unit test with in-memory fakes (NX-TEST-01) and its repository an integration
test (NX-TEST-02). For a thin write use case, one repository call with validation and an
authorization check, the two tests assert the same thing twice and neither runs the wiring in
`commands.ts`. Such a module may have one **command test** instead:
`modules/<m>/commands.integration.test.ts`, next to `commands.ts`.

- It calls the module's commands, and its queries where it reads back, against the real
  database inside `describeIntegration()` (NX-TEST-03). A command takes the `Requester` as its
  first argument (NX-LAYER-11), so the test builds its requesters itself: no session, no
  `headers()`, no auth mocking.
- It covers a use case it names by its export name (`application/start-thread.ts` →
  `startThread`, NX-NAME-03). A use case with rules worth example tables (NX-TEST-06) keeps its
  unit test; the two kinds mix in one module.
- It covers a repository `commands.ts` imports. A repository only `queries.ts` reaches keeps its
  own `<x>.repository.integration.test.ts`.
- For owned data (`isolation: tenant` or `owner`) it calls `assertIsolation()` (NX-AUTH-03), with
  `arrange`, `read` and `change` going through commands and queries for two owners.

```ts
// modules/projects/commands.integration.test.ts
import { OwnerId, type OwnerRequester } from '@conventions/nextjs/core';
import { assertIsolation, describeIntegration } from '@conventions/nextjs/testing';
import { createProject, renameProject } from './commands';
import { getProject } from './queries';

const as = (ownerId: OwnerId): OwnerRequester => ({ kind: 'user', userId: ownerId, roles: [], ownerId });

describeIntegration('projects commands', () => {
  it('creates a project its owner reads back', async () => {
    const alice = as(OwnerId('owner-alice'));
    await createProject(alice, { id: 'prj_alpha', name: 'Alpha' });
    expect((await getProject(alice, 'prj_alpha'))?.name).toBe('Alpha');
  });

  const id = 'prj_isolation';
  assertIsolation({
    name: 'createProject, renameProject',
    ownerA: OwnerId('owner-a'),
    ownerB: OwnerId('owner-b'),
    arrange: (owner) => createProject(as(owner), { id, name: 'Alpha' }),
    read: (owner) => getProject(as(owner), id),
    change: (owner) => renameProject(as(owner), { id, name: 'Taken' }),
  });
});
```

`conventions check` accepts either test for each rule and names both in its message. Action
tests are not a third way: an action reads the session through `headers()` and the auth
library, so testing it means mocking both.
