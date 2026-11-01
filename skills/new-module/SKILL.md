---
name: new-module
description: >-
  Scaffold a module, use case or repository in a project on the nextjs conventions profile:
  the file shape, ports, fakes, tests and wiring that `conventions check` and `conventions lint`
  expect. Use when the user asks for a new module, feature, aggregate, use case, repository or
  server action in a project whose ARCHITECTURE.md declares `profile: nextjs`.
---

# New module, use case or repository

Generate the shape first, then fill in the domain. Every file below has a counterpart in
`examples/nextjs-orders/modules/orders` at the pinned tag; copy its form.

## 1. Decide rich or anemic (NX-RICH-01)

Anemic (CRUD with validation only): `contracts.ts`, `queries.ts`, `actions.ts`, `index.ts`,
`server.ts`, `infra/<noun>.repository.ts` and its integration test. No `domain/`,
`application/` or `commands.ts`.

Rich (state transitions, calculations, two use cases on one entity): everything above plus
`domain/<noun>.ts`, `domain/<noun>-id.ts`, `domain/errors.ts`, `domain/events.ts`,
`application/ports.ts`, `application/<verb>-<noun>.ts` + `.test.ts`,
`application/__fakes__/<noun>.repository.fake.ts`, `commands.ts`.

## 2. Files and their first lines

- `server.ts`, `queries.ts`, `commands.ts` start with `import 'server-only';`.
- `index.ts` exports contract schemas, domain types and values, use-case *types*, actions and
  browser-safe components. Never `infra/`, `queries.ts` or `commands.ts`.
- `contracts.ts`: `export const <useCase>InputSchema = z.object(…)`,
  `export type <UseCase>Input = z.infer<typeof <useCase>InputSchema>`; DTOs end in `Dto`.
- `application/ports.ts`: `<Noun>Repository` with tenant-owned methods taking `TenantId` first;
  `Clock`, `EventCollector`, `UnitOfWork` as needed.
- `application/<verb>-<noun>.ts`:
  ```ts
  export const <verbNoun> = defineUseCase<<VerbNoun>Input, <VerbNoun>Output, <Noun>Error | NotFound | Forbidden, <VerbNoun>Deps>(
    async (input, { requester, <nouns>, clock }) => { … return ok(…); },
  );
  ```
  One value export, named after the file. Authorization is decided here (NX-AUTH-02).
- `application/<verb>-<noun>.test.ts` next to it, with `InMemory<Noun>Repository` from
  `__fakes__` and factories from `tests/factories/<noun>.ts`.
- `infra/<noun>.repository.ts`: `export const <noun>Repository = defineRepository<<Noun>Repository>({ … })`
  using `db()` from `@/lib/db/client`; a constraint violation becomes
  `throw new ConstraintViolation(violatedConstraint(error), '<nouns>')`.
- `infra/<noun>.repository.integration.test.ts`: `describeIntegration('<noun>Repository', () => { assertTenantIsolation({ … }); })`.
- `infra/<noun>.mapper.ts`: `type <Noun>Row = InferSelectModel<typeof <nouns>>`, `toDomain`, `toRow`.
- `commands.ts`: `export async function <verbNoun>(requester: Requester, input: <VerbNoun>Input)` wiring
  the use case to the repository, unit of work, clock and event collector; catches
  `ConstraintViolation` and returns `err(conflict(…))`.
- `actions.ts`: `export const <verbNoun>Action = memberActionClient.inputSchema(<verbNoun>InputSchema).action(async ({ parsedInput, ctx: { requester } }) => { const result = await <verbNoun>(requester, parsedInput); if (result.ok) await revalidate<Noun>(…); return result; });`
  and `export async function revalidate<Noun>(id)` using `<NOUN>_TAGS` from `queries.ts`.
- `queries.ts`: `export const <NOUN>_TAGS = { all: '<nouns>', one: (id) => `<noun>:${id}` }` and cached
  reads that compute `can.*` flags server-side.

## 3. Finish

Run `npx conventions lint modules/<name>` and `npx conventions check`. If the module replaces
legacy code, add the Legacy row and `MIGRATING.md`. Record every interpretation in
`ARCHITECTURE.md` (NX-MIG-04).
