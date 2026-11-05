---
name: nextjs-conventions
description: >-
  Apply the team's Next.js architecture, naming and testing conventions (profile nextjs) when
  creating or changing code in a project whose ARCHITECTURE.md declares `profile: nextjs`. Use
  when adding a module, use case, repository, action, query, component or migration, when
  fixing findings prefixed NX-, when reviewing a PR against the conventions, or when deciding
  rich vs anemic, direct call vs event, or whether database code is allowed.
---

# Next.js conventions

The project's `ARCHITECTURE.md` header names the conventions version, bindings, app root,
isolation, legacy folders and rulesets; its sections record the project's own interpretations and
deviations. Read it first; it overrides nothing in the core rules but fills every gap they leave.

`isolation:` says who owns a row, and with it which words and types the ownership rules use:
`tenant` (a workspace owns it; `TenantRequester`, `tenantId: TenantId`), `owner` (the signed-in
user owns it; `OwnerRequester`, `ownerId: OwnerId`) or `none` (no owned data; NX-AUTH-03/04/05/08
and NX-NAME-34 do not apply). Where a rule says "the owner", read the tenant or the user. Never
introduce a `tenantId` into an `owner` or `none` project; `conventions explain` says whether a
rule applies here.

## Where the rules live

- `npx conventions explain <RULE-ID>` prints any rule from the installed catalogue
  (`node_modules/@conventions/nextjs/rules/nextjs.yaml`): id, ruleset, severity, what enforces
  it, the text and a doc link at the pinned version. Do not restate rules from memory.
- Prose and the reference module live in the conventions repo at the pinned tag,
  `https://github.com/laserjm/conventions/blob/v<version>/`: `docs/nextjs/architecture.md`,
  `naming.md`, `testing.md`, `bindings/*.md`, and `examples/nextjs-orders/modules/orders`
  (copy its shape, not its domain).

## Workflow

1. **Lint what you touch**: `npx conventions lint <files>` runs ESLint, ast-grep and ls-lint
   together; every message starts with an `NX-` id. The plugin's hook runs it after every
   write. Fix by reading the rule, never by disabling it: a disabled rule without a Deviations
   row fails `conventions check` (NX-MIG-04).
2. **Before you finish**: `npx conventions check` (modules complete, tests for use cases
   and repositories next to them or in the module's `commands.integration.test.ts`, owner ids
   typed and the isolation helper used, header version, deviations, database inventory) and `npx tsc --noEmit`. The hook runs the checks on stop.
3. **Apply the guidance rules yourself.** `conventions explain` shows `enforced by: agent` for
   them; the checklist at the end of `architecture.md` lists the ones that matter most:
   - NX-AUTH-02: authorization is decided in the use case, never in a component.
   - NX-RICH-02 / NX-LAYER-06: an `if` about business state in an action is a use case
     waiting to be extracted (the linter warns on the obvious cases).
   - NX-DB-03/04: no business rule inside database code; "easier in SQL" is not a reason.
   - NX-TYPE-01/03: one source of truth per shape; validate at the edge once.
   - NX-XMOD-01: direct call through `index.ts`/`server.ts` first; an event at the second
     subscriber or across a transaction boundary.
4. **New module**: use the `new-module` skill; it writes the shape the checks expect.
5. **Deviating?** Add the `ARCHITECTURE.md` entry (decision · enforced by · recorded in) and a
   Deviations row in the same change. A half-migrated module carries `MIGRATING.md`.
6. **Existing project** (header has `legacy:` folders): new code goes into modules; code under
   a legacy folder keeps its imports but reaches modules only through `index.ts`/`server.ts`.
   Never add a legacy folder to silence a finding (NX-LAYER-10); never import a legacy helper
   a module already replaced (NX-MIG-02).
7. **Reviewing a PR**: run lint and check on the branch, then walk the checklist. Quote rule
   ids in review comments.

## Core API the rules assume

From `@conventions/nextjs/core`: `Result`, `ok`, `err`, the standard errors (`notFound`,
`forbidden`, `conflict`, …), `Requester`, `TenantRequester`/`TenantId` or
`OwnerRequester`/`OwnerId` (per `isolation`), `systemRequester`, `defineUseCase`,
`defineRepository`, `ConstraintViolation`. From `@conventions/nextjs/drizzle`:
`createTransactionRunner`, `violatedConstraint`. From `@conventions/nextjs/next-safe-action`:
`createActionClients`. From `@conventions/nextjs/testing`: `describeIntegration`,
`assertIsolation`, `localStack`.

## Naming quick reference

The table at the end of `docs/nextjs/naming.md` at the pinned tag ("Quick reference"): file
name ⇒ layer ⇒ identifier pattern; never invent a suffix.
