# Conventions

How a Next.js app on Drizzle, Postgres and zod is organized, and when a route grows into a
module. Rules that lint enforces are only pointed at here; the project's `eslint.config.mjs`
(template: `templates/eslint.config.mjs`) is the source of truth for the import graph.

## Why

These rules optimize for four things, in this order. When two rules conflict, the earlier
principle wins.

1. **Business logic lives in TypeScript**, not in database functions, not in React components.
2. **End-to-end type safety**: one source of truth for each shape, inferred everywhere else.
3. **Developer experience**: a feature's code sits together; you can find it in one folder.
4. **Just enough layering**: layers exist to control dependency direction and make logic
   testable. Where there are no rules, there is no domain layer.

## Layout

```text
app/
├─ (<group>)/
│  ├─ page.tsx            # calls queries or the module, never the db
│  ├─ _lib/               # self-contained route only; deleted on promotion
│  │  ├─ queries.ts       # reads: requireUser() → db → DTO
│  │  └─ actions.ts       # 'use server' writes: requireUser() → parse → db → revalidate/redirect
│  ├─ actions.ts          # module-backed route only: 'use server' adapter, parse → module → map errors → revalidate/redirect
│  └─ _components/        # render; a server component may await a query, never the db
├─ api/<x>/route.ts       # route handler: adapter, parse → module → respond/stream
modules/<x>/              # one concept each (e.g. chats); created on a promotion trigger
├─ index.ts               # public API; binds the current user (withUser); app/ imports only this
├─ contracts.ts           # boundary types: zod inputs in, DTO types out
├─ queries.ts             # reads (requester, …) → DTO | null
├─ commands.ts            # writes (requester, input); throw domain errors
├─ repo.ts                # db queries shared by reads and writes (the ownership check)
├─ mappers.ts             # row ⇄ DTO
└─ errors.ts              # domain error classes
components/               # shared UI; components/ui/* is shadcn, untouched
lib/
├─ auth.ts                # getUser / requireUser (cache()), withUser
└─ db/                    # client, schema, migrations
```

A route is in one of two states, and the folder shows which: `_lib/` means the route talks to the
db itself; a bare `actions.ts` next to `page.tsx` means a module does.

## Rules

1. **The current user is resolved in exactly one place.** Self-contained route: first line of every
   `_lib` function. Module: `index.ts` wraps every export in `withUser`; internals take `requester`.
   Adapters never pass a user. _Lint for modules, review for `_lib`._
2. **Every read filters by the caller, every write is scoped by the caller**
   (`eq(table.userId, requester.id)`). The ownership check is the policy. _Review, plus Testing §5._
3. **Only `_lib/*`, `modules/*` and `lib/` import the db.** _Lint._
4. **Server-side code starts with `import 'server-only'`;** in `actions.ts`, `'use server'` comes
   first. Exempt: `schema.ts` (drizzle-kit loads it outside Next) and tests. _Lint._
5. **Dependencies point one way.** `lib/` imports neither `app/` nor `modules/`; `modules/` imports
   neither `app/` nor `next/*`; `app/` imports a module only through its `index.ts`, as a namespace
   (`import * as chats from "@/modules/chats"`). _Lint._
6. **UI never decides permissions.** Queries put flags on the DTO (`canDelete`); components render
   them. _Review._

## The two states of a route

**Self-contained (the default).** `_lib/queries.ts` and `_lib/actions.ts` talk to the db directly.
Every function calls `requireUser()` first and parses its ids before they reach the db
(`z.uuid().safeParse`). A query returns `null` for a missing, foreign or malformed id; an action
calls `notFound()`. DTO types live in the `queries.ts` that returns them; once an action takes more
than an id, zod inputs and DTOs move to `_lib/contracts.ts`. Nothing here is testable without Next;
that is accepted until soft trigger 6 meets a second one.

**Module-backed.** `modules/<x>/` holds the use cases, free of request context and `next/*`.
`index.ts` binds the current user and is the only file `app/` imports. The module parses its own
ids (`contracts.ts`); queries return `null`, commands throw a domain error. The route keeps a thin
`actions.ts` next to `page.tsx` as the `'use server'` boundary: parse → module → map domain errors
to `notFound()` or `{ error }` → `revalidatePath` / `redirect`. Pages and server components call
the module directly; `_lib/` is deleted.

**Data in components.** A server component in `_components/` may await a query it owns (e.g. the
sidebar's chat list), wrapped in `<Suspense>` next to it. Client components get data as props or a
promise (`use`) and import DTO types with `import type`, so `server-only` never reaches the browser
bundle.

## Errors

- **Missing, not-owned or malformed id:** one answer, `notFound()`, so ownership isn't leaked.
  The owner of the data parses the id before it reaches the db.
- **Invalid input:** an action returns `{ error }` (for `useActionState`); a route handler returns
  `400` with `{ error }`. Don't throw.
- **Domain errors** (`ChatNotFound`) are classes in `modules/<x>/errors.ts`. Commands throw them,
  adapters map them. A self-contained route has no adapter layer, so it calls `notFound()` or
  returns `{ error }` directly; wanting named errors there is soft trigger 8.
- **`throw new Error`** only for bugs and broken invariants. The nearest `error.tsx` catches them.

## Promotion: when `_lib` becomes `modules/<x>/`

Promote when **one** hard trigger is hit, or **two** soft ones. One concept at a time. Not
triggers: "it might be reused later", many small actions in one file, a cleaner folder tree.

**Hard triggers (any one):**

1. **A second adapter needs the same logic.** Route handler, webhook, cron, CLI. Server actions
   can't be imported there, and a copy means two ownership checks to keep in sync.
2. **Two route groups need the same query or write.** Cross-importing another route's `_lib` is
   the smell.
3. **A write touches more than one aggregate.** Creating a chat also charges credits.
4. **Authorization is no longer "the owner".** Roles, sharing, admin override. The rule needs a
   name and a unit test: `modules/<x>/policy.ts`, pure functions, no db.

**Soft triggers (two together):**

5. **`actions.ts` or `queries.ts` passes about 200 lines, or one function about 40.** Length from
   logic counts; length from the number of use cases doesn't.
6. **You want to unit test the logic without Next.** `requireUser`, `revalidatePath` and the
   business rule share a function, so the test needs the framework.
7. **The same drizzle query is written twice** in the route, usually in a read and in a write's
   ownership check. The module's `repo.ts` is the fix.
8. **You want named errors.** The adapter has to tell "not found" from "invalid input" from "bug",
   and `new Error("…")` strings are being compared.

## Deliberately dropped

- **A branded `AuthCtx` type only `lib/auth` can mint.** Lint already restricts who imports
  `lib/auth` as a value, and a brand would force every test to mint one. Revisit if a second place
  starts constructing users.
- **A "who may import what" table here.** It drifted; `eslint.config.mjs` is the table.
- **`index.ts` as a public API before `modules/` exists.** A self-contained route has none.
- **Full module layering from day one.** Correct, and too heavy for a route that owns one table.

## Testing

| Level      | Self-contained route                       | Module-backed route                                             |
| ---------- | ------------------------------------------ | --------------------------------------------------------------- |
| API tests  | none (would need Next; see soft trigger 6) | every use case in `queries.ts` and `commands.ts`, real Postgres |
| Unit tests | business-critical pure functions only      | same (e.g. `policy.ts`)                                         |
| UI tests   | business-critical workflows only, E2E      | same; the only coverage adapters in `app/` get                  |

> **TODO:** define "business critical": what makes a unit or workflow worth its own test, who
> decides, and where that is written down.

1. **Test the use cases, colocated.** `modules/<x>/queries.test.ts` and `commands.test.ts` call the
   functions with an explicit `requester`, as `index.ts` does after `withUser`. One
   `describe("<useCase>")` per function, `it("<behavior in plain words>")`. `index.ts`, `repo.ts`
   and `mappers.ts` are covered through them; a unit already exercised by a use case gets no test.
2. **Real Postgres, no db mocks.** The ownership check is a `WHERE` clause; a mock tests the mock.
   `test/global-setup.ts` owns the test database: it migrates and truncates once per run, and
   refuses to start unless the database name ends in `_test` (`TEST_DATABASE_URL` overrides the
   default).
3. **Every test creates its own users.** No shared fixtures. Fresh users isolate tests through the
   same ownership rule the app uses, so files run in parallel without cleanup.
4. **Arrange with factories, assert through the API.** `test/factories.ts` inserts raw rows, so a
   query test doesn't depend on a command. Read a table directly only when the API can't observe
   the behavior, and say why in a comment.
5. **Rule 2 gets a test.** Every use case that takes an id has a "someone else's id" case (returns
   `null` or throws, and changes nothing) and a malformed-id case next to its happy path.
6. **Never mock `next/*`.** A test that needs Next means the logic sits in the adapter and belongs
   in the module.

```bash
createdb <app>_test   # once, on the local Postgres
pnpm test
```

## Naming

### UI and use cases

| Kind                 | File                                                                     | Identifier                                                                                        | Example                                              |
| -------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Server action        | `actions.ts`                                                             | `<useCase>Action`                                                                                 | `deleteChatAction`                                   |
| Query                | `queries.ts`                                                             | `<verb><Noun>`; in a module `(requester, …)`, bound to `(…)` by `index.ts`                        | `getChat(requester, id)` → `chats.getChat(id)`       |
| Command              | `modules/<x>/commands.ts`                                                | the use case's name, same binding                                                                 | `deleteChat(requester, id)` → `chats.deleteChat(id)` |
| Input contract (zod) | `contracts.ts`                                                           | `<useCase>Input`; inferred type `<UseCase>Input`                                                  | `sendMessageInput`, `SendMessageInput`               |
| Component            | `components/<noun>-<role>.tsx`, or `app/.../_components/` if route-local | `<Noun><Role>`, props `<Component>Props`; client components start with `'use client'`, no suffix | `ChatList`, `ChatListProps`                          |
| Hook                 | `hooks/use-<thing>.ts`, or `_components/` if route-local                 | `use<Thing>`                                                                                      | `useIsMobile`                                        |
| Page                 | `page.tsx`                                                               | `<Noun>Page` / `<Nouns>Page`                                                                      | `ChatPage`, `ChatsPage`                              |

Roles (last word of a component name): `List`, `Table`, `Card`, `Row`, `Form`, `Dialog`, `Sheet`,
`Panel`, `Badge`, `Summary`, `Picker`, `Select`, `Filters`, `Toolbar`, `Empty`, `Provider`, or any
name from the [shadcn components list](https://ui.shadcn.com/docs/components.md). The noun may be
`App` for shell pieces (`AppSidebar`); a role may stack to describe a state (`ChatListSkeleton`).
Extend this list rather than inventing a role. Unexported helpers are free-form as long as they
don't mimic `*Action`, `*Page` or a verb-first use-case name. `components/ui/*` is shadcn: don't
rename it, don't add your own components there.

### Data

| Kind     | Where                                                                                   | Identifier                                | Example                      |
| -------- | --------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------- |
| Table    | `lib/db/schema.ts` (exports tables only)                                                | `<nouns>Table`; SQL name plural `<nouns>` | `chatsTable` → `"chats"`     |
| Row type | not exported; derive inline where needed                                                | `typeof <nouns>Table.$inferSelect`        |                              |
| DTO      | `contracts.ts`; in a self-contained route without one, the `queries.ts` that returns it | `<Noun><Shape>`                           | `ChatDetail`, `ChatListItem` |
| Mapper   | `modules/<x>/mappers.ts`, not exported                                                  | `to<TargetType>`                          | `toChatMessage(row)`         |

Inputs are zod schemas because they are untrusted; DTOs are plain types because the data layer
builds them. UI imports DTO types, never a row type.

## Where the rules live

- `eslint.config.mjs` (template in `templates/eslint.config.mjs`): the import graph,
  `server-only`, `'use server'`.
- `test/global-setup.ts`, `test/factories.ts`: test database and fixtures.
- `docs/adr/` (template in `templates/adr-0000-template.md`): one record per decision that
  changes or interprets a rule, with the options considered and how to reverse it.
