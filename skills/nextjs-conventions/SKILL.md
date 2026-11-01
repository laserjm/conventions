---
name: nextjs-conventions
description: Apply the team's Next.js architecture, naming and testing conventions (profile nextjs) when creating or changing code in a project whose ARCHITECTURE.md declares `profile: nextjs`. Use when adding a module, use case, repository, action, query, component or migration, when fixing lint errors prefixed NX-, when reviewing a PR against the conventions, or when deciding rich vs anemic, direct call vs event, or whether database code is allowed.
---

# Next.js conventions

The project's `ARCHITECTURE.md` header names the conventions version, the bindings and the
project's own interpretations. Read it first; it overrides nothing in the core rules but
fills every gap they leave.

## Where the rules live

- Catalogue: `node_modules/@conventions/eslint-plugin-nextjs/rules/nextjs.yaml` in the project (same file as `rules/nextjs.yaml` in the conventions repo). Every rule: `id`, `severity`, `enforcement`, `doc`, `rule`.
- Prose: `docs/nextjs/architecture.md`, `naming.md`, `testing.md`, `bindings/*.md`.
- Reference module: `examples/nextjs-orders/modules/orders` — copy its shape, not its domain.

Do not restate the rules from memory. Open the catalogue entry by ID.

## Workflow

1. **Run the linter first**: `pnpm eslint <paths>`. Every message carries an `NX-` ID. Fix by
   reading the catalogue entry, not by disabling the rule. An `eslint-disable` needs an
   `ARCHITECTURE.md` entry (NX-MIG-04).
2. **Apply the review-only rules yourself.** Filter the catalogue for `enforcement: review`
   and `severity: error`; these are the judgement calls lint cannot make. The ones that
   matter most when writing code:
   - NX-LAYER-06 / NX-RICH-02: does this action contain a business `if`? Then it is a use case.
   - NX-AUTH-02/03/05: authorization in the use case; tenant id first in repository methods; shared data takes none.
   - NX-DB-02/03: any new database function or trigger needs a category A–E and an inventory row; no business rule inside.
   - NX-ERR-01/03: `Result` not `throw`; standard errors from `lib/errors.ts`.
   - NX-TYPE-01/03: one source of truth; validate at the edge once.
   - NX-XMOD-01: direct call vs event.
3. **New module checklist**: `index.ts` (browser-safe) + `server.ts` (`server-only`) +
   `contracts.ts`; `infra/<noun>.repository.ts` as a plain object with tenant id first;
   `domain/` and `application/` only when NX-RICH-01 says so; with the first write use case,
   `commands.ts` (`server-only`) wires it as `<useCase>(requester, input)`, `actions.ts`
   calls it and `server.ts` re-exports it (NX-LAYER-11); unit test with
   `InMemory<Noun>Repository`; integration test proving tenant isolation.
4. **Deviating?** Add the `ARCHITECTURE.md` entry (decision · enforced by · recorded in)
   in the same change. Half-migrated module → `MIGRATING.md`.
5. **Reviewing a PR**: lint output + the generated checklist at the end of
   `architecture.md`. Quote rule IDs in review comments.

## Naming quick reference

Use the table at the end of `docs/nextjs/naming.md` ("Quick reference"). File name ⇒ layer
⇒ identifier pattern; never invent a suffix.
