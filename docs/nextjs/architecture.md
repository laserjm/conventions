# Next.js Architecture Rules

Profile: `nextjs` · Core document (vendor-agnostic)

These rules apply to new Next.js projects and to refactoring existing ones. They name
**roles** (the ORM, the contract schema library, the action client, the database
platform), never products. A project maps each role to a product by choosing
[bindings](./bindings/); a binding may add rules but never relaxes a core rule.

Every rule has an ID (`NX-<AREA>-<NN>`), a severity and an enforcement. The
machine-readable catalogue is [`rules/nextjs.yaml`](../../rules/nextjs.yaml); the
checklist at the end is generated from it.

| Severity | Meaning |
| --- | --- |
| `error` | CI fails. No exceptions without an entry in the project's `ARCHITECTURE.md`. |
| `warn` | Reported, fix in the same PR unless there is a reason in the PR description. |
| `review` | Judgement call. Checked by the reviewer and by the conventions skill. |

| Enforcement | Meaning |
| --- | --- |
| `eslint:<rule>` | Enforced by `@conventions/eslint-plugin-nextjs` (config `nextjs`). |
| `tsc` | Enforced by the TypeScript compiler. |
| `check:<name>` | Enforced by a script shipped with the conventions (none in v0.1). |
| `review` | Not mechanically enforced. |

## Purpose & principles

These rules optimize for four things, in this order:

1. **Business logic lives in TypeScript**, not in database functions, not in React components.
2. **End-to-end type safety**: one source of truth for each shape, inferred everywhere else.
3. **Developer experience**: a feature's code sits together; you can find it in one folder.
4. **Just enough layering**: layers exist to control dependency direction and make logic
   testable. Where there are no rules, there is no domain layer.

When two rules conflict, the earlier principle wins.

## Roles

A project binds each role to exactly one product in its `ARCHITECTURE.md` header.

| Role | Responsibility | Core rules refer to it as |
| --- | --- | --- |
| ORM | typed table definitions, query builder, transactions | *the ORM*, `lib/db` |
| Database platform | Postgres hosting, migrations, auth, row policies | *the database platform* |
| Contract schema library | runtime validation of DTOs, env and external payloads | *contract schemas* |
| Action client | wraps server actions: input validation, auth middleware, typed results | *the action client* |
| Auth provider | produces the signed-in identity | *the identity* |

## Structure

Vertical modules (one per bounded context) with a light layering inside each. Routes stay
thin. `lib/` holds cross-cutting code. Paths are relative to the **app root**, which is
aliased `@/`; whether the app root is `src/` or the package root is a project choice
(`NX-STR-01`).

```
app/                            # routes only — composition, no business logic
  (app)/orders/
    page.tsx
    _components/                # route-local UI
  api/                          # webhooks and route handlers only
modules/
  orders/
    domain/                     # pure TS: types, invariants, domain errors, events
      order.ts
      order-id.ts
      money.ts
      errors.ts
      events.ts
    application/                # use cases + ports (optional, see Layer rules)
      pay-order.ts
      ports.ts
      __fakes__/
    infra/                      # repository implementations, external adapters, mappers
      order.repository.ts
      order.mapper.ts
    actions.ts                  # server actions ("use server")   ─┐
    queries.ts                  # cached, server-only reads        ├ ui layer
    commands.ts                 # wired write use cases, server-only (optional, NX-LAYER-11)
    components/                 # feature UI                       ─┘
    contracts.ts                # contract schemas + DTO types
    index.ts                    # public API, safe in the browser
    server.ts                   # public API, server-only (re-exports queries, commands)
  billing/
lib/
  result.ts                     # Result<T, E>          (shipped by the conventions)
  errors.ts                     # standard error catalogue (shipped)
  env.ts                        # validated env
  safe-action.ts                # action client with auth middleware (binding)
  db/
    client.ts                   # the ORM client
    schema.ts                   # table definitions (generated or hand-written, see binding)
    transaction.ts              # withTransaction (shipped)
    errors.ts                   # constraint violation → tagged error (shipped)
components/ui/                  # design-system primitives, never feature-aware
tests/
  browser/                      # browser tests (*.spec.ts)
  support/                      # test infrastructure
  factories/                    # test data builders
```

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-STR-01 | error | All paths are relative to the app root aliased `@/`. Whether the app root is `src/` is a project choice recorded in `ARCHITECTURE.md`. | review |
| NX-STR-02 | error | Each feature lives in `modules/<x>/`. Layer folders are `domain/`, `application/`, `infra/`; ui-layer files are `actions.ts`, `queries.ts`, `components/`; plus `commands.ts` (optional), `contracts.ts`, `index.ts`, `server.ts`. No other names; a test file sits next to the file it tests. | eslint:check-file |
| NX-STR-03 | error | `app/` contains routes only: pages, layouts, route handlers and route-local `_components/`. | eslint:boundaries |
| NX-STR-04 | warn | UI used by exactly one route lives in `app/.../_components/`; UI reused across routes or needing the module's types lives in `modules/<x>/components/`; design-system primitives live in `components/ui/` and are never feature-aware. Start in `_components/`; move when a second route needs it. | review |
| NX-STR-05 | error | `lib/` is cross-cutting and imports nothing from `modules/`. | eslint:boundaries |
| NX-STR-06 | error | Test infrastructure lives in `tests/{browser,support,factories}/`. Test files (`*.test.ts`, `*.spec.ts`, `__fakes__/`) are exempt from layer rules. | eslint:config |

## Layer rules

Each layer may import only from the layers below it. The ui layer may skip `application/`
and call a repository directly when there is no logic to orchestrate. Modules talk to each
other only through `index.ts` and `server.ts`.

| Layer | Contains | May import | Never contains |
| --- | --- | --- | --- |
| `domain/` | types, branded value objects, invariant functions, tagged errors, events | own `domain/`, `lib/result`, `lib/errors` | I/O, Next, React, the ORM, contract-schema runtime calls |
| `application/` (optional) | use cases, `ports.ts` interfaces | `domain/`, `contracts.ts` (types), other modules' `index.ts` (types only, e.g. the event a handler receives), `lib/result`, `lib/errors` | the ORM client, `fetch`, `cookies()`, `revalidate*` |
| `infra/` | repository implementations, external adapters, mappers | `application/ports`, `domain/`, `contracts.ts`, `lib/db`, `lib/*` | business rules, validation of user input |
| ui: `actions.ts`, `queries.ts`, `components/` | server actions, cached queries, feature components | `application/`, `infra/` (when no use case), `contracts.ts`, `domain/` types, `lib/*` except `lib/db`, other modules' `index.ts`/`server.ts`, `components/ui` | business rules beyond calling a use case or a repository |
| `commands.ts` (optional) | write use cases wired to their dependencies; server-only | own `application/`, `infra/`, `contracts.ts`, `domain/`, `lib/*` except `lib/db`, other modules' `index.ts`/`server.ts` | business rules, session reads, revalidation, the action client |
| `index.ts` | browser-safe public API | own `domain/`, `application/` (types only), `contracts.ts`, `components/`, `actions.ts` | anything from `infra/`, `queries.ts` or `commands.ts` |
| `server.ts` | server-only public API | own `queries.ts`, `commands.ts`, `actions.ts`, plus everything `index.ts` may | `infra/` |
| `app/` | pages, layouts, route handlers | `modules/*/{index,server}`, `components/ui`, `lib/*` except `lib/db` | direct DB calls, contract parsing, business rules |
| `lib/` | cross-cutting | `lib/` | anything from `modules/` |

`actions.ts`, `queries.ts` and `components/` sit at the module root to save a folder level,
but they are the **ui layer** in the clean-architecture sense: together with `page.tsx` they
play the role of the *controller* — they translate HTTP/React into use-case calls and back.

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-LAYER-01 | error | Imports follow the table above. `domain/` imports nothing outside its module except `lib/result` and `lib/errors`. | eslint:boundaries/element-types |
| NX-LAYER-02 | error | `domain/` and `application/` import no framework or vendor package (`react`, `next/*`, the ORM, the contract-schema library at runtime). Type-only imports from `contracts.ts` are allowed in `application/`. | eslint:boundaries/external |
| NX-LAYER-03 | error | Only `infra/` and `lib/db` import the ORM and `lib/db`. | eslint:boundaries |
| NX-LAYER-04 | error | Another module is reached only through its `index.ts` or `server.ts`. Never import another module's `domain/`, `application/`, `infra/`, `contracts.ts` or ui files. | eslint:boundaries/element-types |
| NX-LAYER-05 | error | `index.ts` is safe to import from a client component: it never re-exports `infra/`, `queries.ts` or `commands.ts`. Server-only reads and commands are exported from `server.ts`; `server.ts`, `queries.ts` and `commands.ts` are marked `server-only`. Every module has both files; `server.ts` may be empty. | eslint:nextjs/no-server-exports-from-index |
| NX-LAYER-06 | error | Skipping the application layer: an action or query may call a repository directly when it needs no orchestration — a plain read, a single write with validation only, no business decision. The moment it needs a transaction, a domain function, a second repository or an `if` about business state, extract a use case. Test: if you'd want to unit-test it without Next, it's a use case. | review |
| NX-LAYER-07 | error | A use case receives its dependencies as one object typed `<UseCase>Deps`. No global singletons inside `application/`. | review |
| NX-LAYER-08 | error | Errors cross layer boundaries as values (`Result`), never as thrown exceptions. `throw` is reserved for bugs and does not appear in `domain/` or `application/`. | eslint:no-restricted-syntax |
| NX-LAYER-09 | error | If two modules import each other, merge them or extract a third. | eslint:boundaries (no-cycle via import-x) |
| NX-LAYER-10 | error | Code that predates the modules is declared as the `legacy` element in the ESLint config. Legacy code keeps the imports it has but reaches a module only through `index.ts`/`server.ts`. No new feature lands in legacy; a folder leaves the list when its module is done. | eslint:boundaries |
| NX-LAYER-11 | error | `commands.ts` is optional: it appears with the module's first write use case, so anemic modules have none. It wires each use case to its repositories, unit of work, policy and clock and exports it under the use case's name, taking the `Requester` the caller signed in as its first argument: `payOrder(requester, input)`. It holds no business rule, reads no session and revalidates nothing. Once it exists, `actions.ts` calls it and imports no value from its own `application/` or `infra/`; `server.ts` re-exports it for workers, other modules and tests. | eslint:nextjs/actions-use-commands + eslint:boundaries + eslint:nextjs/require-server-only |

## Authorization & tenancy

Authentication (who is this?) happens once, in the action client's middleware and at the
top of `queries.ts`, producing a `Requester` (`{ userId, tenantId, roles }`). Authorization
(may they do this?) is a business decision and lives in the use case.

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-AUTH-01 | error | `Requester` is produced in `lib/safe-action.ts` (actions) and in `queries.ts` (reads). Nothing else reads the session: `commands.ts` receives the requester from its caller. | review |
| NX-AUTH-02 | error | Authorization decisions live in the use case, which receives `requester` in `Deps` and returns `err({ _tag: 'Forbidden' })`. An action that skips the application layer checks `requester` itself; that is the only business `if` allowed in an action. | review |
| NX-AUTH-03 | error | Tenant isolation is enforced in the repository: every method on tenant-owned data takes the tenant id as its first argument and names it in the query. The repository's integration test proves another tenant's rows can be neither read nor changed. | review (test required) |
| NX-AUTH-04 | warn | Database row policies, where the platform offers them, are a second net for tenant isolation. A permission rule is never written there. | review |
| NX-AUTH-05 | error | Shared data (registries, templates, lookups) is read without a requester; its repository methods take no tenant id. The port makes the distinction visible: tenant-owned methods start with the tenant id, shared methods don't. | review |
| NX-AUTH-06 | error | System callers (scheduled runs, workers, delivery jobs) use the same repositories as users and name their tenant explicitly. There is no bypass path. | review |
| NX-AUTH-07 | error | Components never decide permissions; they receive booleans like `can.editOrder` computed server-side in `queries.ts`. | review |

## Type safety chain

Every shape has exactly one source of truth; everything else is inferred.

| Shape | Source of truth | Inferred by |
| --- | --- | --- |
| Table rows | the schema source (see NX-DB-01) | the ORM's row-type inference, in `infra/` |
| Request/response DTOs | contract schemas in `modules/<x>/contracts.ts` | schema inference in use cases, actions, forms |
| Domain types | `domain/*.ts` (plain types + branded primitives) | mappers in `infra/` convert rows to these |
| Use case outcome | `Result<T, E>` from `lib/result.ts` | actions switch on `error._tag` |
| Server action contract | the action client wrapping the contract schema | the action client's client hooks |
| Env vars | `lib/env.ts` | `env.X` |
| Routes | `typedRoutes: true` | `<Link href>` and `redirect()` |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-TYPE-01 | error | One source of truth per shape (table above). If you write the same type twice by hand, one of them is already wrong. | review |
| NX-TYPE-02 | error | No `as` cast across a layer boundary. If the types don't line up, add a mapper in `infra/` or fix the schema. `as` is allowed only in `*.mapper.ts`, `lib/db/`, brand constructors (`domain/*-id.ts`) and `as const`. | eslint:@typescript-eslint/consistent-type-assertions |
| NX-TYPE-03 | error | Validate at the edge once: action input, webhook payload, env, external API responses, database function results. Inside the module, trust the types. | review |
| NX-TYPE-04 | error | Forms use the same contract schema as the action. Client and server disagree on nothing. | review |
| NX-TYPE-05 | warn | Ids and money are branded primitives (`type OrderId = string & { __brand: 'OrderId' }`). | review |
| NX-TYPE-06 | error | Importing a module never requires infrastructure configuration. `lib/env.ts` validates at build everything modules read; connection secrets are validated on first use in `lib/db/client.ts`. | review |

## Errors

`lib/result.ts` defines `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`
with `ok()` and `err()`. Every error is a tagged object; the discriminant is `_tag`.
`lib/errors.ts` defines the standard catalogue every project shares; modules add domain
errors on top.

| Tag | Meaning | Comes from | Action result | Page / RSC |
| --- | --- | --- | --- | --- |
| `ValidationFailed` | input rejected | the action client | `validationErrors`, field-level | — |
| `SignedOut` | no identity | action-client middleware | `serverError` | redirect to sign-in |
| `Forbidden` | identity may not do this | use case / requester check | `serverError` | `forbidden()` |
| `NotFound` | aggregate missing | use case / query | `serverError` | `notFound()` → 404 |
| `Conflict` | constraint refused the write | repository (NX-DB-05) | `serverError` carrying `_tag` | inline |
| domain error | invariant blocked the action | `domain/` via `Result` | `serverError` carrying `_tag` | inline |
| `Unexpected` | something threw | anything | generic `serverError` with trace id | `error.tsx` → 500 |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-ERR-01 | error | Use cases return `Result`, never throw. Actions translate `Result` into the action client's result shape. | eslint:no-restricted-syntax (throw) + review |
| NX-ERR-02 | error | Errors are tagged unions; `_tag` equals the TypeScript type name. The action switches exhaustively. | eslint:nextjs/tag-matches-type-name + tsc |
| NX-ERR-03 | error | `SignedOut`, `Forbidden`, `NotFound`, `Conflict`, `Unexpected` come from `lib/errors.ts`, never redefined per module. | review |
| NX-ERR-04 | error | The raw `_tag` never appears in the UI; the client maps tags to copy with an exhaustive map. | review |

## Caching & revalidation

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-CACHE-01 | error | Caching primitives (`unstable_cache`, `"use cache"`, `cacheTag`) appear only in `queries.ts`; `revalidate*` appears only in `actions.ts`. | eslint:boundaries/external (`next/cache`) |
| NX-CACHE-02 | error | Tags are constants exported from `queries.ts` (`ORDER_TAGS = { all: 'orders', one: (id) => \`order:${id}\` }`). Tag strings are never typed inline. | eslint:nextjs/no-inline-cache-tags |
| NX-CACHE-03 | warn | One `all` tag per aggregate for lists, one `one(id)` tag for detail views. Nothing finer until a measured need. | review |
| NX-CACHE-04 | error | Revalidation happens in the action after the use case returns `ok`. Use cases and repositories never import `revalidate*`. | eslint:boundaries/external |
| NX-CACHE-05 | error | A write that affects another module's reads calls that module's exported `revalidate<Noun>(id)` from its `index.ts`, never its tag strings. | review |
| NX-CACHE-06 | warn | `revalidatePath` only for routes without a natural aggregate. | review |

## Cross-module communication

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-XMOD-01 | error | Two mechanisms: a **direct call** through the other module's `index.ts`/`server.ts` when A needs B's answer now; a **domain event** when A only needs to inform B. Start with direct calls; introduce events at the second subscriber or when the call would cross a transaction boundary. | review |
| NX-XMOD-02 | error | Events are collected by the use case through an `EventCollector` port and dispatched after commit via `lib/events.ts` by whoever ran the use case: the module's `commands.ts` when it has one, otherwise the action. Handlers live in the receiving module: `modules/billing/application/on-order-paid.ts`, which imports the event type (types only) from the publisher's `index.ts`, is wired in `modules/billing/commands.ts` and is reached through `modules/billing/server.ts`. | review |
| NX-XMOD-03 | error | A database trigger is never an event bus. | review + db inventory |

## Database

Business logic lives in TypeScript. Database code (functions, triggers, policies) is
allowed only in the categories below, and every piece of it is recorded in the project's
database inventory (`docs/architecture/db-inventory.md`, [template](../templates/db-inventory.md)).

| Category | Allowed when | Wrapper |
| --- | --- | --- |
| A — atomic claim/lock | several statements must be one transaction and app round-trips would break the latency budget or create a race (inventory reservation, counters, queue claim) | one repository method, result validated with a contract schema |
| B — read model | a view or function serves a read that would otherwise need many queries | one repository method, result validated |
| C — constraint/policy helper | a pure function used by a `CHECK` constraint or row policy | none; no business decision inside |
| D — platform lifecycle hook | the platform forces a hook (user provisioning on sign-up) | inventory row with justification |
| E — pipeline | data pipelines outside the app's modules | inventory row; not callable from modules |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-DB-01 | error | One schema source of truth, declared in `ARCHITECTURE.md`: **code-first** (ORM definitions generate migrations) or **migrations-first** (migrations are hand-written, ORM definitions are generated by introspection). Generated files are never edited; CI fails on drift. | review + CI |
| NX-DB-02 | error | A database function or trigger is allowed only in categories A–E and has an inventory row: name, category, caller, wrapping repository method, test. A migration that adds one adds the row. | review |
| NX-DB-03 | error | No business rule inside database code: no pricing, no status decisions, no notifications. Category A/B code takes already-validated input and performs the write or read. | review |
| NX-DB-04 | error | Not a valid reason for database code: "easier in SQL", "the platform makes it convenient", "to avoid N+1" (use a join or CTE), "to enforce permissions". | review |
| NX-DB-05 | error | A constraint the database refuses becomes a tagged error in the repository (`Conflict` or a domain error), translated with `lib/db/errors.ts`. Nothing above `infra/` sees a driver error. | review |
| NX-DB-06 | error | Transactions: `lib/db/transaction.ts` exposes `withTransaction`; only `infra/` calls it. A use case that needs several writes in one transaction receives a `UnitOfWork` port that the module's `infra/` implements. | eslint:boundaries |
| NX-DB-07 | error | Every repository statement runs inside a transaction with a statement timeout. Interactive and system callers have different budgets; the numbers live in the binding. | review |
| NX-DB-08 | error | On tenant-owned tables the only triggers are `updated_at` and audit. No trigger changes another table's business data (category D excepted, with inventory row). | review |
| NX-DB-09 | warn | Views are fine for read models (category B); they are typed through the ORM. | review |

## When to go rich vs anemic

A module gets a `domain/` layer only when it has invariants. Otherwise it is a CRUD module.

| Signal | Rich (full layering) | Anemic (CRUD module) |
| --- | --- | --- |
| State transitions with rules (draft → paid → shipped) | yes | — |
| Calculations that must agree everywhere | yes | — |
| Two or more use cases touch the same entity | yes | — |
| Logic currently in a database function or trigger | yes, move it here | — |
| Plain CRUD with validation only; settings, profiles, lookups | — | yes |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-RICH-01 | error | Anemic module shape: `contracts.ts` + `queries.ts` + `actions.ts` + `index.ts` + `server.ts` + `infra/<noun>.repository.ts`. No `domain/`, no `application/`, no `commands.ts` until promotion. | review |
| NX-RICH-02 | error | Promotion: the moment an action contains an `if` about business state, or a second action needs the same calculation, extract a use case and a `domain/` file. | review |
| NX-RICH-03 | error | "Rich" means plain types and pure functions, not classes: `applyPayment(order, payment): Result<Order, OrderError>`. | review |
| NX-RICH-04 | error | Reads go `queries.ts → repository`. A read use case exists only when the read carries authorization or derivation logic (`can.*` flags). | review |

## Refactoring playbook for existing projects

Strangler-style, one module at a time. The old and new structure coexist until the last
module moves.

1. **Guardrails first.** Install the ESLint config with the existing code declared as
   `legacy` (NX-LAYER-10). Add `lib/result.ts`, `lib/errors.ts`, `lib/db/transaction.ts`,
   `lib/db/errors.ts`, `lib/safe-action.ts` from the conventions.
2. **Inventory the database code** (NX-DB-02). Most functions will fail NX-DB-03.
3. **Pick the module with the most pain.** Create `modules/<x>/` with `index.ts`,
   `server.ts`, `contracts.ts`.
4. **Move reads first** into `queries.ts` + a repository.
5. **Port one database write at a time** into a use case, wired in `commands.ts` so legacy
   code calls the same command through `server.ts` that the action does. Keep the SQL function in place
   and compare results until the TS version has been live for a release, then drop it in a
   migration and remove the inventory row.
6. **Extract invariants into `domain/`** as the use cases reveal them.
7. **Rewire the routes** to import only from `modules/<x>/{index,server}`. Delete the old
   helpers.
8. **Remove the folder from `legacy`.** The lint rule now protects it.
9. **Repeat.**

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-MIG-01 | error | No new database code may be added during the transition unless it passes NX-DB-02/03, even in untouched modules. | review |
| NX-MIG-02 | error | No new code imports a legacy helper that a module already replaced. | review |
| NX-MIG-03 | error | A half-migrated module carries a `MIGRATING.md` ([template](../templates/MIGRATING.md)) listing what still bypasses it. | review |
| NX-MIG-04 | error | Every deviation from these rules is an entry in the project's `ARCHITECTURE.md` ([template](../templates/ARCHITECTURE.md)): decision, where enforced, where recorded. Add the entry before you deviate. | review |

## Checklist

Generated from `rules/nextjs.yaml` (`error` severity, `review` enforcement only — the rest
CI checks for you). Copy into a PR template.

- [ ] NX-LAYER-06 Any action/query that skips `application/` has no business decision
- [ ] NX-LAYER-07 Use cases take one `Deps` object; no singletons in `application/`
- [ ] NX-AUTH-02 Authorization decided in the use case (or the requester check in an anemic action)
- [ ] NX-AUTH-03 Repository methods on tenant-owned data take the tenant id first; integration test proves isolation
- [ ] NX-AUTH-05 Shared vs tenant-owned reads are distinguishable in the port
- [ ] NX-TYPE-01 One source of truth per shape
- [ ] NX-TYPE-03 Validated at the edge once; trusted inside
- [ ] NX-ERR-03 Standard errors come from `lib/errors.ts`
- [ ] NX-CACHE-05 Cross-module revalidation goes through the exported helper
- [ ] NX-DB-02 Every new database function/trigger has an inventory row in category A–E
- [ ] NX-DB-03 No business rule inside database code
- [ ] NX-DB-05 Constraint violations are tagged errors in the repository
- [ ] NX-RICH-01/02 `domain/` exists only where invariants exist; promotion done when the signal appeared
- [ ] NX-MIG-04 Every deviation has an `ARCHITECTURE.md` entry
