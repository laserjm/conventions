# Naming Conventions per Layer

Profile: `nextjs` · Core document (vendor-agnostic) · Companion to [Architecture Rules](./architecture.md)

One name pattern per kind of thing, so a file name tells you its layer and its role before
you open it. Rule IDs are `NX-NAME-<NN>`; severity and enforcement as in the architecture
document.

## General rules

| What | Convention | Example |
| --- | --- | --- |
| Files and folders | `kebab-case` | `create-order.ts`, `order-line-item.tsx` |
| Types, interfaces, React components | `PascalCase` | `Order`, `OrderRepository`, `OrderCard` |
| Functions, variables, hooks | `camelCase` | `applyPayment`, `useOrderForm` |
| Module-level true constants | `SCREAMING_SNAKE_CASE` | `MAX_LINE_ITEMS`, `ORDER_TAGS` |
| Enum-like unions | `PascalCase` type, lowercase string values | `type OrderStatus = 'draft' \| 'paid'` |
| DB tables and columns | `snake_case` | `order_line_items`, `created_at` |
| Env vars | `SCREAMING_SNAKE_CASE`, public ones `NEXT_PUBLIC_` | `DATABASE_URL` |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NAME-01 | error | Files and folders are `kebab-case`. Route folders follow Next conventions: `(group)`, `[param]`, `_private`. | eslint:check-file |
| NX-NAME-02 | error | Types, interfaces and components are `PascalCase`; functions and variables `camelCase`; module-level constants may be `SCREAMING_SNAKE_CASE`. No `I` prefix on interfaces, no `Impl` suffix. | eslint:@typescript-eslint/naming-convention |
| NX-NAME-03 | error | In `application/<use-case>.ts` and in component files the file exports exactly one value whose name is the camelCase/PascalCase of the file name. Other files (`actions.ts`, `queries.ts`, `contracts.ts`, `ports.ts`, `errors.ts`, `events.ts`, entity files) export several things by design. | eslint:nextjs/use-case-export-name |
| NX-NAME-04 | warn | Singular for a thing, plural for a collection: `order.ts` holds `Order`; `orders` table; `OrderRepository`. | review |
| NX-NAME-05 | warn | No abbreviations except universal ones (`id`, `url`, `db`, `dto`, `ui`, `env`). | review |
| NX-NAME-06 | warn | Booleans read as predicates: `isPaid`, `hasItems`, `canShip`. | review |
| NX-NAME-07 | warn | Names say what, not how; prefer the ubiquitous language of the business over technical synonyms. | review |
| NX-NAME-08 | error | Generated code keeps the generator's names. Naming rules apply to hand-written code only. | review |

## Folders & modules

| Thing | Convention | Example |
| --- | --- | --- |
| Module folder | business noun, `kebab-case`; plural when it names a collection of aggregates | `orders/`, `price-lists/`, `billing/`, `catalog/` |
| Layer folders | fixed: `domain/`, `application/`, `infra/` | |
| Module-root files | fixed: `actions.ts`, `queries.ts`, `commands.ts` (optional), `components/`, `contracts.ts`, `index.ts`, `server.ts` | |
| Route segment folders | `kebab-case`, plural for collections, `[param]` dynamic | `app/orders/[orderId]/` |
| Route groups | `(kebab-case)` describing layout or audience | `(app)/`, `(marketing)/` |
| Private route folders | `_kebab-case` | `_components/` |
| Cross-cutting | `lib/<concern>/` | `lib/db/`, `lib/auth/` |
| Primitives | `components/ui/` | `components/ui/button.tsx` |
| Tests | `tests/{browser,support,factories}/` | `tests/browser/checkout.spec.ts` |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NAME-10 | error | A module name is a business noun, never a technical one: not `api`, `utils`, `common`, `shared`. | review |
| NX-NAME-11 | error | Dynamic route params are `camelCase` and end in `Id` when they are ids: `[orderId]`. | eslint:check-file (folder) |
| NX-NAME-12 | error | `index.ts` exports contract schemas, domain types and values, use-case types, actions and browser-safe components; never a use-case function, whose `Deps` only `commands.ts` can wire. `server.ts` re-exports `queries.ts` and `commands.ts`. Neither re-exports `infra/`. | eslint:nextjs/no-server-exports-from-index |

## Domain layer (`domain/`)

| Kind | File | Identifier | Example |
| --- | --- | --- | --- |
| Entity / aggregate root | `<noun>.ts` | `PascalCase` type, no suffix | `order.ts` → `type Order` |
| Value object | `<noun>.ts` | `PascalCase` type, branded primitive or small object | `money.ts`, `order-id.ts` → `OrderId` |
| Invariant / behaviour | in the entity's file | `camelCase` verb phrase, entity first, returns `Result` | `applyPayment(order, payment)` |
| Factory | in the entity's file | `create<Noun>` or `<noun>From<Source>` | `createOrder(input)` |
| Domain error | `errors.ts` | tagged union, `PascalCase` fact that blocks the action | `OrderAlreadyPaid` |
| Domain event | `events.ts` | `PascalCase` noun + past-tense verb | `OrderPaid` |
| Status union | in the entity's file | `<Noun>Status`, lowercase values | `OrderStatus` |
| Policy | `<noun>-policy.ts` | predicate functions | `qualifiesForDiscount(order)` |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NAME-20 | error | No `Model`, `Entity`, `Domain`, `VO` suffix. The folder says it is domain. | review |
| NX-NAME-21 | warn | Behaviour functions are business verbs: `applyPayment`, `cancel`. Not `updateStatus`, not `setPaid`. | review |
| NX-NAME-22 | error | Errors are named for the fact that blocks the action (`OrderAlreadyPaid`), not the attempt. `_tag` equals the type name. | eslint:nextjs/tag-matches-type-name |
| NX-NAME-23 | error | Events are past tense; commands are never defined in `domain/`. | review |
| NX-NAME-24 | warn | No `value-objects/` subfolder until a module has more than five. | review |

## Application layer (`application/`)

| Kind | File | Identifier | Example |
| --- | --- | --- | --- |
| Use case (command) | `<verb>-<noun>.ts` | `camelCase`, `(input, deps) => Promise<Result<…>>` | `pay-order.ts` → `payOrder` |
| Use case (query) | `get-<noun>.ts`, `list-<nouns>.ts`, `find-<noun>-by-<x>.ts` | same | `list-open-orders.ts` |
| Event handler | `on-<event>.ts` | `on<Event>` | `on-order-paid.ts` → `onOrderPaid` |
| Input / Output / Deps types | in the use case file | `<UseCase>Input`, `<UseCase>Output`, `<UseCase>Deps` | `PayOrderDeps` |
| Port (repository) | `ports.ts` | `<Noun>Repository`, methods as verbs | `OrderRepository.findById` |
| Port (other I/O) | `ports.ts` | capability noun or `<Noun>Gateway` | `Clock`, `IdGenerator`, `PaymentGateway`, `EventCollector` |
| Unit of work | `ports.ts` | `UnitOfWork` with `run(fn)` | `uow.run(async tx => …)` |
| Fake | `__fakes__/<noun>.repository.fake.ts` | `InMemory<Noun>Repository` | `InMemoryOrderRepository` |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NAME-30 | warn | Command verbs: `create`, `update`, `delete`, `cancel`, `approve`, `submit`, `assign`, `archive`, or the business verb (`shipOrder`). | review |
| NX-NAME-31 | warn | Query verbs: `get` (one, errors when missing), `find` (one, may be null), `list`, `search`, `count`, `exists`. Repositories use the same vocabulary plus `save` (insert or update); no `create`/`update` split. | review |
| NX-NAME-32 | error | Dependencies are one object typed `<UseCase>Deps`, never positional. | review |
| NX-NAME-33 | error | `NotFound`, `Forbidden`, `SignedOut`, `Conflict`, `Unexpected` come from `lib/errors.ts`; the domain does not know about requesters or lookups. | review |
| NX-NAME-34 | error | Tenant-owned repository methods take the tenant id first: `findById(tenantId, id)`. Shared-data methods take no tenant id. | review |

## Infra layer (`infra/`) and database

Infra names carry the technology; the port they implement carries the business name.

| Kind | File | Identifier | Example |
| --- | --- | --- | --- |
| Repository implementation | `<noun>.repository.ts` | `<noun>Repository` object implementing the port; factory `make<Noun>Repository(config)` only when it needs config | `orderRepository` |
| External adapter | `<system>.<capability>.ts` | `<system><Capability>` | `stripe.payment-gateway.ts` → `stripePaymentGateway` |
| Mapper | `<noun>.mapper.ts` | `toDomain(row)`, `toRow(entity)` | `order.mapper.ts` |
| Unit of work impl | `unit-of-work.ts` | `unitOfWork` | |
| Table definitions | `lib/db/schema.ts` | per binding (generated or hand-written) | |
| Row types | in `infra/` | `<Noun>Row`, `New<Noun>Row` | `type OrderRow` |

**Database naming (Postgres):**

- Tables `snake_case` plural; join tables both nouns alphabetical: `products_tags`.
- Columns `snake_case` singular; primary key `id`; foreign keys `<singular_table>_id`.
- Timestamps `created_at`, `updated_at`, `deleted_at`; event timestamps `<verb>ed_at`.
- Booleans `is_<adjective>` / `has_<noun>`. Money `<thing>_cents` bigint or `<thing>_amount numeric(12,2)`; never a float.
- Indexes `<table>_<columns>_idx`; unique `<table>_<columns>_key`; FK `<table>_<column>_fkey`.
- Enum types `<noun>_status`, `<noun>_kind`; values lowercase, same strings as the TS union.
- Functions (categories A–E) `<verb>_<noun>_<qualifier>`: `reserve_inventory_atomic`, `claim_check`.

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NAME-40 | error | A repository file is named after the aggregate, not the table. | review |
| NX-NAME-41 | error | Mappers are the only place that knows both `OrderRow` and `Order`. | review |
| NX-NAME-42 | warn | Adapter files start with the external system so they sort together. | review |
| NX-NAME-43 | warn | Postgres naming as above; a SQL linter in the binding may enforce it. | review |

## UI layer (`actions.ts`, `queries.ts`, `components/`, `app/`)

| Kind | File | Identifier | Example |
| --- | --- | --- | --- |
| Server action | `actions.ts` | `<useCase>Action` | `payOrderAction` |
| Cached query | `queries.ts` | `<verb><Noun>` | `getOrder(id)` |
| Command (wired use case) | `commands.ts`, exported via `server.ts` | the use case's name, `(requester, input)` | `payOrder(requester, input)` |
| Cache tags | `queries.ts` | `<NOUN>_TAGS = { all: '<nouns>', one: (id) => \`<noun>:${id}\` }` | `ORDER_TAGS` |
| Revalidation helper | `actions.ts`, exported via `index.ts` | `revalidate<Noun>(id)` | `revalidateOrder` |
| Component | `components/<noun>-<role>.tsx` | `<Noun><Role>`, props `<Component>Props` | `OrderCard`, `OrderCardProps` |
| Client component | same; file starts with `'use client'`; no `Client` suffix | | |
| Hook | `components/use-<thing>.ts` (`hooks/` once > 3) | `use<Thing>` | `useOrderForm` |
| Route-local component | `app/.../_components/<noun>-<role>.tsx` | same | |
| Page component | `page.tsx` | `<Noun>Page` / `<Nouns>Page` | `OrdersPage` |

Component role vocabulary (second word): `List`, `Table`, `Card`, `Row`, `Form`, `Dialog`,
`Sheet`, `Panel`, `Badge`, `Summary`, `Picker`, `Select`, `Filters`, `Toolbar`, `Empty`.

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NAME-50 | error | Every export of `actions.ts` ends in `Action` (except `revalidate<Noun>`); nothing outside `actions.ts` ends in `Action`. Type exports are ignored; `index.ts` and `server.ts` re-export the module's own actions under their names. | eslint:nextjs/action-suffix |
| NX-NAME-51 | warn | Component role from the vocabulary above before inventing one. | review |
| NX-NAME-52 | error | No `Component`, `View`, `Widget` suffix. No `Container`/`Presenter` split. | review |
| NX-NAME-53 | warn | Handler props `on<Event>`; handlers inside a component `handle<Event>`. Boolean props adjectives without `is` (`disabled`, `open`); state keeps `is` (`isOpen`). | review |

## Contracts & types (`contracts.ts`, `lib/`)

| Kind | Identifier | Example |
| --- | --- | --- |
| Use case input schema | `<useCase>InputSchema` | `payOrderInputSchema` |
| Inferred input type | `<UseCase>Input` | `type PayOrderInput` |
| DTO schema / type | `<noun>DtoSchema` / `<Noun>Dto` | `orderSummaryDtoSchema`, `OrderSummaryDto` |
| Shared field schema | `<field>Schema` | `emailSchema` |
| Branded id | `<Noun>Id` type + `<Noun>Id(value)` constructor in `domain/`; `<noun>IdSchema` in `contracts.ts` | `OrderId`, `orderIdSchema` |
| Result | `Result<T, E>`, `ok(value)`, `err(error)` | |
| Error union | `<Noun>Error` | `type OrderError = OrderAlreadyPaid \| InsufficientStock` |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NAME-60 | error | A contract schema is `camelCase` + `Schema`; its inferred type is the same name in `PascalCase` without the suffix. | eslint:nextjs/schema-suffix |
| NX-NAME-61 | error | `Dto` is the only suffix for shapes that cross the wire. `Payload`, `Request`, `Response`, `Data`, `Info` are not used. `Input` is for use case arguments. Domain types have no suffix. | review |
| NX-NAME-62 | error | A tagged union's discriminant is always `_tag` and its value equals the type name. | eslint:nextjs/tag-matches-type-name |

## Tests

| Kind | File | Identifier |
| --- | --- | --- |
| Unit test | next to the file, `<name>.test.ts` | `describe('<function>')`, `it('<behaviour>')` |
| Integration test (real DB) | `<name>.integration.test.ts` | same |
| Browser test | `tests/browser/<flow>.spec.ts` | `test('<user goal>')` |
| Fake port | `application/__fakes__/<noun>.repository.fake.ts` | `InMemory<Noun>Repository` |
| Factory | `tests/factories/<noun>.ts` | `a<Noun>(overrides)` |
| Support | `tests/support/<concern>.ts` | |

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NAME-70 | error | Test file suffixes as above; test files are exempt from layer rules. | eslint:check-file |
| NX-NAME-71 | warn | Test names describe behaviour: `it('rejects payment on an already paid order')`. | review |
| NX-NAME-72 | warn | `InMemory` for hand-written doubles with behaviour, `Stub` for canned answers, `Mock` only when assertions are made on calls. | review |

## Quick reference

| Layer | Kind | File | Identifier |
| --- | --- | --- | --- |
| domain | aggregate | `domain/order.ts` | `Order`, `applyPayment` |
| domain | value object | `domain/order-id.ts` | `OrderId` |
| domain | error | `domain/errors.ts` | `OrderAlreadyPaid` |
| domain | event | `domain/events.ts` | `OrderPaid` |
| application | use case | `application/pay-order.ts` | `payOrder`, `PayOrderInput`, `PayOrderDeps` |
| application | port | `application/ports.ts` | `OrderRepository`, `PaymentGateway` |
| application | fake | `application/__fakes__/order.repository.fake.ts` | `InMemoryOrderRepository` |
| infra | repository | `infra/order.repository.ts` | `orderRepository` |
| infra | mapper | `infra/order.mapper.ts` | `toDomain`, `toRow` |
| infra | adapter | `infra/stripe.payment-gateway.ts` | `stripePaymentGateway` |
| ui | action | `actions.ts` | `payOrderAction`, `revalidateOrder` |
| ui | query | `queries.ts` | `getOrder`, `ORDER_TAGS` |
| ui | command | `commands.ts` | `payOrder` |
| ui | component | `components/order-card.tsx` | `OrderCard`, `OrderCardProps` |
| ui | page | `app/(app)/orders/[orderId]/page.tsx` | `OrderPage` |
| contracts | input schema | `contracts.ts` | `payOrderInputSchema` → `PayOrderInput` |
| contracts | dto | `contracts.ts` | `orderSummaryDtoSchema` → `OrderSummaryDto` |
| api | public | `index.ts`, `server.ts` | |
| test | unit | `application/pay-order.test.ts` | `it('rejects an already paid order')` |
| test | factory | `tests/factories/order.ts` | `anOrder()` |
