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
| `error` | CI fails. No exceptions without a Deviations row in the project's `ARCHITECTURE.md`. |
| `warn` | Reported, fix in the same PR unless there is a reason in the PR description. |
| `guidance` | A judgement call. Applied by the reviewer and by the conventions skill; never mechanical. |

| Enforcement | Meaning |
| --- | --- |
| `eslint:<rule>` | `@conventions/nextjs` flat config: boundaries, typescript-eslint, custom rules. |
| `ast-grep:<rule>` | A syntax rule shipped in the package, with its own test cases. |
| `ls-lint` | File and folder names. |
| `tsc` | A shape the core types refuse to compile. |
| `check:<name>` | `conventions check`, a structural check over the whole project. |
| `ci:<job>` | A job in the project's CI workflow. |
| `agent` | Not mechanical: the skill and the reviewer, with the checklist at the end. |

`conventions lint` runs the first three in one pass and prints the rule id with every finding;
`conventions explain <id>` prints the rule.

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
thin. `lib/` holds cross-cutting code. `Result`, the standard errors, `Requester` and the owner ids, `defineUseCase`
and the transaction and action-client factories come from `@conventions/nextjs`; a project owns
only the four starters below. Paths are relative to the **app root**, which is
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
    commands.integration.test.ts  # command test (optional): covers thin use cases and their repositories
    components/                 # feature UI                       ─┘
    contracts.ts                # contract schemas + DTO types
    index.ts                    # public API, safe in the browser
    server.ts                   # public API, server-only (re-exports queries, commands)
  billing/
lib/
  env.ts                        # validated env (starter)
  safe-action.ts                # action clients from @conventions/nextjs/next-safe-action (starter)
  auth/requester.ts             # the identity, from the binding (starter)
  db/
    client.ts                   # lazy db() + withTransaction from @conventions/nextjs/drizzle (starter)
    schema.ts                   # table definitions (generated or hand-written, see binding)
components/ui/                  # design-system primitives, never feature-aware
tests/
  browser/                      # browser tests (*.spec.ts)
  support/                      # test infrastructure
  factories/                    # test data builders
```

<!-- rules: structure -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-STR-01 | guidance | All paths are relative to the app root aliased `@/`. Whether the app root is `src/` is a project choice recorded in `ARCHITECTURE.md`. | agent |
| NX-STR-02 | error | Each feature lives in `modules/<x>/`. Layer folders are `domain/`, `application/`, `infra/`; ui-layer files are `actions.ts`, `queries.ts`, `components/`; plus `commands.ts` (optional), `contracts.ts`, `index.ts`, `server.ts`. No other names; a test file sits next to the file it tests. | ls-lint |
| NX-STR-03 | error | `app/` contains routes only: pages, layouts, route handlers and route-local `_components/`. | eslint:boundaries/element-types |
| NX-STR-04 | warn | UI used by exactly one route lives in `app/.../_components/`; UI reused across routes or needing the module's types lives in `modules/<x>/components/`; design-system primitives live in `components/ui/` and are never feature-aware. Start in `_components/`; move when a second route needs it. | check:route-local-components |
| NX-STR-05 | error | `lib/` is cross-cutting and imports nothing from `modules/`. | eslint:boundaries/element-types |
| NX-STR-06 | error | Test infrastructure lives in `tests/{browser,support,factories}/`. Test files (`*.test.ts`, `*.spec.ts`, `__fakes__/`) are exempt from layer rules; nothing else imports `@conventions/nextjs/testing`. | ast-grep:nx-str-06-testing-only-in-tests |
| NX-STR-07 | error | Every module has `index.ts` and `server.ts`; `server.ts` may be empty. `conventions check` reports a module that lacks one. | check:module-complete |
<!-- /rules -->

## Layer rules

Each layer may import only from the layers below it. The ui layer may skip `application/`
and call a repository directly when there is no logic to orchestrate. Modules talk to each
other only through `index.ts` and `server.ts`.

| Layer | Contains | May import | Never contains |
| --- | --- | --- | --- |
| `domain/` | types, branded value objects, invariant functions, tagged errors, events, wording a use case stores or the UI and a sent message share (NX-LAYER-12) | own `domain/`, `@conventions/nextjs/core` | I/O, Next, React, the ORM, contract-schema runtime calls |
| `application/` (optional) | use cases, `ports.ts` interfaces | `domain/`, `contracts.ts` (types), other modules' `index.ts` (types only, e.g. the event a handler receives), `@conventions/nextjs/core` | the ORM client, `fetch`, `cookies()`, `revalidate*` |
| `infra/` | repository implementations, external adapters (rendering for an external channel included, NX-LAYER-12), mappers | `application/ports`, `domain/`, `contracts.ts`, `lib/db`, `lib/*`, other modules' `index.ts` (to map to and from their public types) | business rules, validation of user input |
| `contracts.ts` | the module's input/output schemas and DTOs | own `domain/`, `lib/*` except `lib/db`, other modules' `index.ts` (to reuse the owner's schema or type, NX-TYPE-01) | logic beyond schema composition |
| `actions.ts`, `queries.ts` | server actions, cached queries | `commands.ts`, `application/`, `infra/` (when no use case), `contracts.ts`, `domain/` types, `lib/*` except `lib/db`, other modules' `index.ts`/`server.ts` | business rules beyond calling a use case or a repository |
| `components/` | feature components, and wording only the UI shows | own `components/`, `actions.ts`, `contracts.ts`, `domain/`, `lib/*` except `lib/db`, `components/ui`, other modules' `index.ts` | `infra/`, `queries.ts`, `commands.ts`, use cases: components run in the browser |
| `commands.ts` (optional) | write use cases wired to their dependencies; server-only | own `application/`, `infra/`, `contracts.ts`, `domain/`, `lib/*` except `lib/db`, other modules' `index.ts`/`server.ts` | business rules, session reads, revalidation, the action client |
| `index.ts` | browser-safe public API | own `domain/`, `application/` (types only), `contracts.ts`, `components/`, `actions.ts` | anything from `infra/`, `queries.ts` or `commands.ts` |
| `server.ts` | server-only public API | own `queries.ts`, `commands.ts`, `actions.ts`, plus everything `index.ts` may | `infra/` |
| `app/` | pages, layouts, route handlers | `modules/*/{index,server}`, `components/ui`, `lib/*` except `lib/db` | direct DB calls, contract parsing, business rules |
| `lib/` | cross-cutting | `lib/` | anything from `modules/` |

`actions.ts`, `queries.ts` and `components/` sit at the module root to save a folder level,
but they are the **ui layer** in the clean-architecture sense: together with `page.tsx` they
play the role of the *controller* — they translate HTTP/React into use-case calls and back.
A file or folder in a module that is not one of the names above is reported (NX-STR-02): a
module has no `helpers.ts`, `utils/` or `hooks/`; hooks live in `components/`.

### Wording a use case stores or sends

`components/` is the ui layer, so wording that leaves the UI lives elsewhere (NX-LAYER-12).
Ask who reads the text, and when it is fixed:

| The text | Example | Lives in | Reached by |
| --- | --- | --- | --- |
| stored by a use case, frozen with the row | a digest's subject, a notification's title | `domain/`, a pure function over the module's own shapes | the use case; `commands.ts` passes in any other module's wording it builds on |
| shown by the UI and by a sent message alike | the summary sentence a digest page and its email both show | `domain/` | `components/` (own `domain/`), `infra/` (own `domain/`) |
| rendered for an external channel | an email's text and HTML, a push payload | `infra/`, an adapter beside the channel's client | a port the use case calls, wired in `commands.ts` |
| shown only by the UI | a button label, an empty state | `components/` | the ui layer only |

`domain/` imports nothing outside its module, so another module's wording reaches it as an
argument, the way another module's rule does: `commands.ts` imports it from that module's
`index.ts` and hands it to the use case, which passes it on. An infra adapter may import
another module's `index.ts` itself. Neither imports `components/`.

The rule applies on both sides. A sentence another module's stored or sent text builds on is
that module's `domain/` too: it reaches the caller through `index.ts` either way, but it must not
sit in `components/`, where a change made for the UI would silently reword stored data and email.

Where the UI shows a `domain/` sentence that takes another module's wording, the binding
(`summaryOf(content) => digestSummary(content, changeSentences(content.changes))`) lives in
`components/`: `index.ts` may not import another module, and `domain/` may not either.

<!-- rules: layers -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-LAYER-01 | error | Imports follow the table above. `domain/` imports nothing outside its module except `@conventions/nextjs/core`. | eslint:boundaries/element-types |
| NX-LAYER-02 | error | `domain/` and `application/` import no framework or vendor package (`react`, `next/*`, the ORM, the contract-schema library at runtime). Type-only imports from `contracts.ts` are allowed in `application/`. | eslint:boundaries/external |
| NX-LAYER-03 | error | Only `infra/` and `lib/db` import the ORM and `lib/db`. | eslint:boundaries/external |
| NX-LAYER-04 | error | Another module is reached only through its `index.ts` or `server.ts`. Never import another module's `domain/`, `application/`, `infra/`, `contracts.ts` or ui files. | eslint:boundaries/element-types |
| NX-LAYER-05 | error | `index.ts` is safe to import from a client component: it never re-exports `infra/`, `queries.ts` or `commands.ts`, and `components/` never import them either. Server-only reads and commands are exported from `server.ts`; `server.ts`, `queries.ts` and `commands.ts` are marked `server-only`. | eslint:boundaries/element-types |
| NX-LAYER-06 | warn | Skipping the application layer: an action or query may call a repository directly when it needs no orchestration — a plain read, a single write with validation only, no business decision. The moment it needs a transaction, a domain function, a second repository or an `if` about business state, extract a use case. Test: if you'd want to unit-test it without Next, it's a use case. | ast-grep:nx-layer-06-business-if-in-action |
| NX-LAYER-07 | error | A use case is declared with `defineUseCase<Input, Output, Error, Deps>(async (input, deps) => …)` from `@conventions/nextjs/core`; the helper fixes the signature. Dependencies arrive as one object typed `<UseCase>Deps`; no global singletons inside `application/`. | ast-grep:nx-layer-07-use-define-use-case |
| NX-LAYER-08 | error | Errors cross layer boundaries as values (`Result`), never as thrown exceptions. A refusal returns `err(...)`; an impossible state (a bug) calls `bug(message)` from `@conventions/nextjs/core`. `throw` does not appear in `domain/` or `application/`. | ast-grep:nx-layer-08-no-throw-in-pure-layers |
| NX-LAYER-09 | error | If two modules import each other, merge them or extract a third. | eslint:import-x/no-cycle |
| NX-LAYER-10 | error | Code that predates the modules is declared as the `legacy` element in the ESLint config. Legacy code keeps the imports it has but reaches a module only through `index.ts`/`server.ts`. No new feature lands in legacy; a folder leaves the list when its module is done. Legacy globs are anchored at the app root, so `components/**` is never a module's `components/`. Lint applies only the layer rules to legacy code; naming, cast and env rules start when the folder leaves the list. Tooling outside the app (`scripts/`, `*.config.*`) may import legacy code and module APIs. | eslint:boundaries/element-types |
| NX-LAYER-11 | error | `commands.ts` is optional: it appears with the module's first write use case, so anemic modules have none. It wires each use case to its repositories, unit of work, policy and clock and exports it under the use case's name, taking the `Requester` the caller signed in as its first argument: `payOrder(requester, input)`. It holds no business rule, reads no session and revalidates nothing. Once it exists, `actions.ts` calls it and imports no value from its own `application/` or `infra/`; `server.ts` re-exports it for workers, other modules and tests. | eslint:nextjs/actions-use-commands |
| NX-LAYER-12 | guidance | Wording lives with its audience. Text a use case stores, or that the UI and a sent message both show, is `domain/`: a pure function over the module's own shapes, with another module's wording passed in as arguments that `commands.ts` wires from its `index.ts`; that wording, in turn, lives in its own module's `domain/`. Rendering for an external channel (an email's text and HTML, a push payload) is an `infra/` adapter the use case reaches through a port. `components/` is the ui layer: only text the UI alone shows lives there, and `domain/`, `application/`, `infra/` and `commands.ts` never import it. | agent |
<!-- /rules -->

## Authorization & data ownership

Authentication (who is this?) happens once, in the action client's middleware and at the
top of `queries.ts`, producing a `Requester`. Authorization (may they do this?) is a business
decision and lives in the use case.

Who owns a row is the project's choice, made once in the header's `isolation:` key:

| `isolation:` | A row belongs to | `Requester` | Owned repository methods take first |
| --- | --- | --- | --- |
| `tenant` | a tenant: a workspace or organisation | `TenantRequester`: `{ kind, userId, tenantId, roles }` | `tenantId: TenantId` |
| `owner` | the signed-in user; no shared workspaces | `OwnerRequester`: `{ kind, userId, ownerId, roles }` | `ownerId: OwnerId` |
| `none` | nobody: shared data only (an internal tool) | `Requester`: `{ kind, userId, roles }` | — |

The rules about owned data (NX-AUTH-03, -04, -05, -08, NX-NAME-34) apply under `tenant` and
`owner` and read the same under both: "the owner" is the tenant or the user. Under `none` they
do not apply, and `conventions lint`, `check` and `explain` say so. An `owner` app that gets
shared workspaces changes to `tenant`; that is a migration, recorded in ARCHITECTURE.md.

System work has no session: it names the owner it works for, `systemRequester(name, { ownerId })`
or `systemRequester(name, { tenantId })` (NX-AUTH-06). A worker that serves every owner learns
whose job it holds from the claim itself, so the claim, and a read like it, is the one method
that names no owner, and returns the owner it found (NX-AUTH-08).

<!-- rules: auth -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-AUTH-01 | error | `Requester` is produced in `lib/safe-action.ts` (actions) and in `queries.ts` (reads). Nothing else reads the session: `commands.ts` receives the requester from its caller. | ast-grep:nx-auth-01-session-read-outside-edge |
| NX-AUTH-02 | guidance | Authorization decisions live in the use case, which receives `requester` in `Deps` and returns `err({ _tag: 'Forbidden' })`. An action that skips the application layer checks `requester` itself; that is the only business `if` allowed in an action. | agent |
| NX-AUTH-03 | error | Isolation between owners is enforced in the repository: every method on owned data takes the owner's id as its first argument (`tenantId` under `isolation: tenant`, `ownerId` under `isolation: owner`) and names it in the query. The repository's integration test calls `assertIsolation()` from `@conventions/nextjs/testing`, proving another owner's rows can be neither read nor changed. When the module's command test covers the repository (NX-TEST-02), the command test calls it, with `arrange`, `read` and `change` going through commands and queries for two owners. | check:isolation-test (isolation: tenant, owner) |
| NX-AUTH-04 | guidance | Database row policies, where the platform offers them, are a second net for isolation between owners. A permission rule is never written there. | agent (isolation: tenant, owner) |
| NX-AUTH-05 | error | Shared data (registries, templates, lookups) is read without a requester; its repository methods take no owner id. Methods on owned data take the owner's id first, typed with its brand (`TenantId` under `isolation: tenant`, `OwnerId` under `isolation: owner`), never `string`: the port makes the distinction visible and the compiler refuses a plain string. | check:owner-id-type (isolation: tenant, owner) |
| NX-AUTH-06 | error | System callers (scheduled runs, workers, delivery jobs) use the same repositories as users and identify as `systemRequester(name)`. Under `isolation: tenant` or `owner` they name the owner they work for: `systemRequester(name, { tenantId })` or `systemRequester(name, { ownerId })`. There is no bypass path. | tsc:systemRequester |
| NX-AUTH-07 | warn | Components never decide permissions; they receive booleans like `can.editOrder` computed server-side in `queries.ts`. | ast-grep:nx-auth-07-roles-in-components |
| NX-AUTH-08 | guidance | A system read that has to find its owner before it can name one (a queue claim that takes the next job of any owner, a sweep of expired jobs, the owner of a row found by its ID) is the one repository method that names no owner. It returns the owner's id with every row, is reached only from system callers (never an action or a page), and every read or write that follows names the owner it returned (NX-AUTH-06). A category A write fenced by a token the claim handed out (attempt number, lease) counts as following the claim. The integration test proves the follow-up methods change nothing when given another owner's id. | agent (isolation: tenant, owner) |
<!-- /rules -->

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

<!-- rules: types -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-TYPE-01 | guidance | One source of truth per shape (table above). If you write the same type twice by hand, one of them is already wrong. | agent |
| NX-TYPE-02 | error | No `as` cast across a layer boundary. If the types don't line up, add a mapper in `infra/` or fix the schema. `as` is allowed only in `*.mapper.ts`, `lib/db/`, brand constructors (`domain/*-id.ts`) and `as const`. The mapper exemption is for shapes the types cannot express (a brand, a library's loose types), not for narrowing a value the code could check; a constrained `text` column is parsed (NX-ZOD-06). | eslint:nx-ts/consistent-type-assertions |
| NX-TYPE-03 | guidance | Validate at the edge once: action input, webhook payload, env, external API responses, database function results. Inside the module, trust the types. | agent |
| NX-TYPE-04 | guidance | Forms use the same contract schema as the action. Client and server disagree on nothing. | agent |
| NX-TYPE-05 | guidance | Ids and money are branded primitives (`type OrderId = string & { __brand: 'OrderId' }`). | agent |
| NX-TYPE-06 | error | Importing a module never requires infrastructure configuration. `lib/env.ts` validates at build everything modules read; connection secrets are validated on first use in `lib/db/client.ts`. | ast-grep:nx-type-06-lazy-db-client |
<!-- /rules -->

## Errors

`@conventions/nextjs/core` defines `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`
with `ok()` and `err()`, and the standard error catalogue every project shares; modules add
domain errors on top. Every error is a tagged object; the discriminant is `_tag`.

| Tag | Meaning | Comes from | Action result | Page / RSC |
| --- | --- | --- | --- | --- |
| `ValidationFailed` | input rejected | the action client | `validationErrors`, field-level | — |
| `SignedOut` | no identity | action-client middleware | `serverError` | redirect to sign-in |
| `Forbidden` | identity may not do this | use case / requester check | `serverError` | `forbidden()` |
| `NotFound` | aggregate missing | use case / query | `serverError` | `notFound()` → 404 |
| `Conflict` | constraint refused the write | repository (NX-DB-05) | `serverError` carrying `_tag` | inline |
| `RevisionConflict` | the edit started from a revision that is no longer current | use case comparing the expected revision | `serverError` carrying `_tag` | reload, keep the input |
| domain error | invariant blocked the action | `domain/` via `Result` | `serverError` carrying `_tag` | inline |
| `Unexpected` | something threw | anything | generic `serverError` with trace id | `error.tsx` → 500 |

<!-- rules: errors -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-ERR-01 | error | Use cases return `Result`, never throw: `defineUseCase` types the return as `Promise<Result<Output, Error>>`. A use case stops on an impossible state with `bug(message)` from `@conventions/nextjs/core`, which the action client reports as `Unexpected`; it never adds a tag no caller can handle. Actions translate `Result` into the action client's result shape. | tsc:defineUseCase |
| NX-ERR-02 | error | Errors are tagged unions; `_tag` equals the TypeScript type name. The action switches exhaustively. | eslint:nextjs/tag-matches-type-name |
| NX-ERR-03 | error | `ValidationFailed`, `SignedOut`, `Forbidden`, `NotFound`, `Conflict` (a constraint refused the write), `RevisionConflict` (an edit started from a revision that is no longer current) and `Unexpected` come from `@conventions/nextjs/core`, never redefined per module. | ast-grep:nx-err-03-standard-errors-from-core |
| NX-ERR-04 | warn | The raw `_tag` never appears in the UI; the client maps tags to copy with an exhaustive map. | ast-grep:nx-err-04-tag-in-jsx |
<!-- /rules -->

## Caching & revalidation

<!-- rules: cache -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-CACHE-01 | error | Caching primitives (`unstable_cache`, `"use cache"`, `cacheTag`) appear only in `queries.ts`; `revalidate*` appears only in `actions.ts`. | eslint:boundaries/external |
| NX-CACHE-02 | error | Tags are constants exported from `queries.ts` (`ORDER_TAGS = { all: 'orders', one: (id) => \`order:${id}\` }`). Tag strings are never typed inline. | ast-grep:nx-cache-02-no-inline-cache-tags |
| NX-CACHE-03 | guidance | One `all` tag per aggregate for lists, one `one(id)` tag for detail views. Nothing finer until a measured need. | agent |
| NX-CACHE-04 | error | Revalidation happens in the action after the use case returns `ok`. Use cases and repositories never import `revalidate*`. | eslint:boundaries/external |
| NX-CACHE-05 | error | A write that affects another module's reads calls that module's exported `revalidate<Noun>(id)` from its `index.ts`, never its tag strings. | ast-grep:nx-cache-05-no-foreign-tags |
| NX-CACHE-06 | guidance | `revalidatePath` only for routes without a natural aggregate. | agent |
<!-- /rules -->

## Cross-module communication

<!-- rules: cross-module -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-XMOD-01 | guidance | Two mechanisms: a **direct call** through the other module's `index.ts`/`server.ts` when A needs B's answer now; a **domain event** when A only needs to inform B. Start with direct calls; introduce events at the second subscriber or when the call would cross a transaction boundary. A command that only means something inside the caller's transaction (a lock taken on the caller's behalf, a write that commits or rolls back with it) runs `withTransaction` with `{ join: 'required' }`. | agent |
| NX-XMOD-02 | guidance | Events are collected by the use case through an `EventCollector` port and dispatched after commit via `lib/events.ts` by whoever ran the use case: the module's `commands.ts` when it has one, otherwise the action. Handlers live in the receiving module: `modules/billing/application/on-order-paid.ts`, which imports the event type (types only) from the publisher's `index.ts`, is wired in `modules/billing/commands.ts` and is reached through `modules/billing/server.ts`. | agent |
| NX-XMOD-03 | error | A database trigger is never an event bus. | check:inventory |
<!-- /rules -->

## Database

Business logic lives in TypeScript. Database code (functions, triggers, policies) is
allowed only in the categories below, and every piece of it is recorded in the project's
database inventory (`docs/architecture/db-inventory.md`, written by `conventions init`).

| Category | Allowed when | Wrapper |
| --- | --- | --- |
| A — atomic claim/lock | several statements must be one transaction and app round-trips would break the latency budget or create a race (inventory reservation, counters, queue claim) | one repository method, result validated with a contract schema |
| B — read model | a view or function serves a read that would otherwise need many queries | one repository method, result validated |
| C — constraint/policy helper | a pure function used by a `CHECK` constraint or row policy | none, or one repository method when a command asks it ahead of a write (NX-DRZ-08); no business decision inside |
| D — platform lifecycle hook | the platform forces a hook (user provisioning on sign-up) | inventory row with justification |
| E — pipeline | data pipelines outside the app's modules | inventory row; not callable from modules |
| X — legacy, to be ported | brownfield only: the function still holds business rules and its callers are legacy code (NX-LAYER-10, NX-MIG-01) | none yet; its row names the step that ports it, and it leaves with its last legacy caller |

<!-- rules: database -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-DB-01 | error | One schema source of truth, declared in `ARCHITECTURE.md`: **code-first** (ORM definitions generate migrations) or **migrations-first** (migrations are hand-written, ORM definitions are generated by introspection). Generated files are never edited; CI fails on drift. | ci:schema-drift |
| NX-DB-02 | error | A database function or trigger is allowed only in categories A–E, or X (legacy, to be ported) while its callers are legacy code (NX-LAYER-10, NX-MIG-01), and has an inventory row: name, category, caller, wrapping repository method, test. An X row names the step that ports it; an A or B row leaves its wrapper empty while its caller is legacy. A migration that adds one adds the row. | check:inventory |
| NX-DB-03 | guidance | No business rule inside database code: no pricing, no status decisions, no notifications. Category A/B code takes already-validated input and performs the write or read. | agent |
| NX-DB-04 | guidance | Not a valid reason for database code: "easier in SQL", "the platform makes it convenient", "to avoid N+1" (use a join or CTE; a recursive one is a raw statement in its repository, NX-DRZ-08), "to enforce permissions". | agent |
| NX-DB-05 | guidance | A constraint the database refuses becomes a tagged error in the repository (`Conflict` or a domain error), translated with `lib/db/errors.ts`. Nothing above `infra/` sees a driver error. | agent |
| NX-DB-06 | error | Transactions: `lib/db/client.ts` builds `withTransaction` with `createTransactionRunner` from `@conventions/nextjs/drizzle`; only `infra/` calls it. A use case that needs several writes in one transaction receives a `UnitOfWork` port that the module's `infra/` implements; it runs `fn` with `{ rollbackOnErr: true }`, so an `err` the use case returns after writing leaves nothing behind. | ast-grep:nx-db-06-transactions-only-in-infra |
| NX-DB-07 | guidance | Every repository statement runs inside a transaction with a statement timeout. Interactive and system callers have different budgets; the numbers live in the binding. | agent |
| NX-DB-08 | guidance | On tables that hold business data the only triggers are `updated_at` and audit. No trigger changes another table's business data (category D excepted, with inventory row). | agent |
| NX-DB-09 | guidance | Views are fine for read models (category B); they are typed through the ORM. | agent |
<!-- /rules -->

## When to go rich vs anemic

A module gets a `domain/` layer only when it has invariants. Otherwise it is a CRUD module.

| Signal | Rich (full layering) | Anemic (CRUD module) |
| --- | --- | --- |
| State transitions with rules (draft → paid → shipped) | yes | — |
| Calculations that must agree everywhere | yes | — |
| Two or more use cases touch the same entity | yes | — |
| Logic currently in a database function or trigger | yes, move it here | — |
| Plain CRUD with validation only; settings, profiles, lookups | — | yes |

<!-- rules: rich -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-RICH-01 | error | Anemic module shape: `contracts.ts` + `queries.ts` + `actions.ts` + `index.ts` + `server.ts` + `infra/<noun>.repository.ts`, no `domain/` and no `application/` until promotion. It may have a `commands.ts` for writes other modules' use cases call (NX-XMOD-01), each one repository call. A module whose `domain/` other modules judge with, and which has no `actions.ts` or `commands.ts`, is a read-only domain module and needs no `application/`. | check:rich-shape |
| NX-RICH-02 | guidance | Promotion: the moment an action contains an `if` about business state, or a second action needs the same calculation, extract a use case and a `domain/` file. | agent |
| NX-RICH-03 | error | "Rich" means plain types and pure functions, not classes: `applyPayment(order, payment): Result<Order, OrderError>`. | ast-grep:nx-rich-03-no-domain-classes |
| NX-RICH-04 | guidance | Reads go `queries.ts → repository`. A read use case exists only when the read carries authorization or derivation logic (`can.*` flags). | agent |
<!-- /rules -->

## Refactoring playbook for existing projects

Strangler-style, one module at a time. The old and new structure coexist until the last
module moves.

The repository README ("Use in a project" → Brownfield) gives the commands for step 1. A new
project skips this section: it starts with the config as shipped and an empty `legacy:` list.

1. **Guardrails first.** `conventions init`, then list the existing code under `legacy:` in
   the `ARCHITECTURE.md` header (NX-LAYER-10) and in its Legacy table. Lint until green.
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
8. **Remove the folder from `legacy`** in the header. The lint rule now protects it.
9. **Repeat.**

<!-- rules: migration -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-MIG-01 | guidance | No new database code may be added during the transition unless it passes NX-DB-02/03, even in untouched modules. | agent |
| NX-MIG-02 | guidance | No new code imports a legacy helper that a module already replaced. | agent |
| NX-MIG-03 | error | A half-migrated module carries a `MIGRATING.md` ([template](../templates/MIGRATING.md)) listing what still bypasses it. | check:migrating-file |
| NX-MIG-04 | error | Every deviation from these rules is a row in the project's `ARCHITECTURE.md` Deviations table: rule id, the files or globs it covers in backticks, why, until when. Lint and `conventions check` report findings of that rule on those paths as warnings, so the same mistake anywhere else still fails; a rule disabled in source without a row fails. Add the row before you deviate. | check:deviations |
<!-- /rules -->

## Checklist

Generated from the catalogue: the `guidance` rules the reviewer and the conventions skill
apply by hand. Everything else `conventions lint`, `conventions check`, `tsc` and CI check
for you. Copy into a PR template.

<!-- checklist -->
- [ ] NX-AUTH-02 Authorization decisions live in the use case, which receives `requester` in `Deps` and returns `err({ _tag
- [ ] NX-AUTH-08 A system read that has to find its owner before it can name one (a queue claim that takes the next job of any owner, a sweep of expired jobs, the owner of a row found by its ID) is the one repository method that names no owner
- [ ] NX-CACHE-03 One `all` tag per aggregate for lists, one `one(id)` tag for detail views
- [ ] NX-XMOD-01 Two mechanisms
- [ ] NX-XMOD-02 Events are collected by the use case through an `EventCollector` port and dispatched after commit via `lib/events.ts` by whoever ran the use case
- [ ] NX-DB-03 No business rule inside database code
- [ ] NX-DB-04 Not a valid reason for database code
- [ ] NX-DB-05 A constraint the database refuses becomes a tagged error in the repository (`Conflict` or a domain error), translated with `lib/db/errors.ts`
- [ ] NX-DB-07 Every repository statement runs inside a transaction with a statement timeout
- [ ] NX-DB-08 On tables that hold business data the only triggers are `updated_at` and audit
- [ ] NX-DRZ-04 **Code-first** projects
- [ ] NX-DRZ-05 `createTransactionRunner` sets `statement_timeout` per caller class
- [ ] NX-LAYER-12 Wording lives with its audience
- [ ] NX-MIG-01 No new database code may be added during the transition unless it passes NX-DB-02/03, even in untouched modules
- [ ] NX-MIG-02 No new code imports a legacy helper that a module already replaced
- [ ] NX-NAME-23 Events are past tense; commands are never defined in `domain/`
- [ ] NX-NAME-07 Names say what, not how; prefer the ubiquitous language of the business over technical synonyms
- [ ] NX-NAME-08 Generated code keeps the generator's names
- [ ] NX-NAME-40 A repository file is named after the aggregate, not the table
- [ ] NX-NAME-41 Mappers are the only place that knows both `OrderRow` and `Order`
- [ ] NX-NSA-04 The client reads results with `useAction` / `useOptimisticAction` and maps `serverError._tag` to copy with an exhaustive record (NX-ERR-04)
- [ ] NX-RICH-02 Promotion
- [ ] NX-RICH-04 Reads go `queries.ts → repository`
- [ ] NX-STR-01 All paths are relative to the app root aliased `@/`
- [ ] NX-SB-01 Supabase migrations are the only schema source (`supabase migration new`, `supabase/migrations/`)
- [ ] NX-SB-02 The app connects with the ORM as the database owner through the transaction pooler
- [ ] NX-SB-03 `Requester` is built from the session in `lib/auth/requester.ts`, which `lib/safe-action.ts` calls
- [ ] NX-TEST-04 Database code in categories A–E (NX-DB-02) has a database-level test; the binding names the tool
- [ ] NX-TEST-06 Domain functions are tested by example tables, not by mocking
- [ ] NX-TYPE-01 One source of truth per shape (table above)
- [ ] NX-TYPE-03 Validate at the edge once
- [ ] NX-TYPE-04 Forms use the same contract schema as the action
- [ ] NX-ZOD-03 Branded ids
- [ ] NX-ZOD-04 Forms use the action's input schema through `@hookform/resolvers/zod` (NX-TYPE-04)
- [ ] NX-ZOD-06 A `text` column a check constraint holds to a set of values (status, kind, currency) is narrowed in `infra/` by parsing with the domain's `as const` list through `z.enum(LIST)`, never by a cast, not even in a `*.mapper.ts`
<!-- /checklist -->
