# conventions

Architecture conventions for Next.js apps on Drizzle, Postgres and zod, as two Markdown documents.
A project copies them, copies the ESLint config that enforces the import rules, and points its
agent instructions at them. Nothing is installed.

The documents are developed in `dogfood-challenge`, a real app that is built alongside them; a
change lands there first and is ported here.

```
docs/nextjs/CONVENTIONS.md      the conventions: how to read them, the floor, the defaults (layout,
                                import graph, the two states of a route, errors, promotion, testing),
                                what was deliberately dropped, examples, open territory
docs/nextjs/NAMING.md           file and identifier patterns per kind, component roles and placement
templates/eslint.config.mjs     the import graph and the server-only / 'use server' checks the
                                document only points at; flat config on top of eslint-config-next
templates/adr-0000-template.md  one record per decision that changes or interprets a rule
templates/adr-0001-example-*.md a filled-in example: where the current user is resolved
CHANGELOG.md                    what changed per version, and why
```

Every rule in the document says how it is enforced: **lint** (the ESLint template), **review**
(a human or an agent reads the diff) or **test** (a test the document prescribes). A rule that
lint can enforce is stated once in the document and lives in the config.

The sections bind differently. The **floor** holds in every diff, and no ADR lifts it. A
**default** is followed until there is a reason not to, and the reason goes into an ADR first.
What the document doesn't name is **open territory**, decided by its priorities.

## Adopt it in a project

1. Copy `docs/nextjs/CONVENTIONS.md` and `docs/nextjs/NAMING.md` to the project root. Their first
   line names the version (`<!-- conventions 0.5.0 -->`); keep it, so a later diff against this
   repo knows where to start.
2. Copy `templates/eslint.config.mjs` to the project root as `eslint.config.mjs`. It expects
   `eslint-config-next`, the `@/` path alias, and the folders the document names (`app/`,
   `modules/`, `lib/`, `components/`, `hooks/`, `scripts/`). Adjust the globs if yours differ.
3. Add to `AGENTS.md` (or `CLAUDE.md`):

   ```markdown
   # Conventions

   Use `CONVENTIONS.md`
   ```

4. When a decision departs from a default or interprets a rule, copy
   `templates/adr-0000-template.md` to `docs/adr/NNNN-<slug>.md` and fill it in before the code
   changes. A floor rule that doesn't fit is changed in the document, not departed from. The
   document's last section says what else the project owns: the test setup that refuses to run
   outside a `_test` database, and the factories.

To upgrade, diff this repo's document against your copy and take what you want. Your local
additions and your ADRs stay yours; the document is a starting point, not a dependency.

## Propose a rule change

Open a pull request against `docs/nextjs/CONVENTIONS.md` or `NAMING.md`, ideally after the
change has held up in an app. The description says:

- **The reason**: which project hit which problem. Link the commit, issue or ADR. A rule earns
  its place by a problem that happened, not by one that might.
- **Floor or default.** The floor is the rules that guard who may see and change what, and that
  mostly only a reviewer can check. Everything else is a default. A project's ADR that departs from a default is not
  a change request, but a default that keeps collecting ADRs is.
- **The enforcement class**: lint, review or test. A lint rule comes with the change to
  `templates/eslint.config.mjs` in the same pull request; a test rule names the test it adds.
- **What it replaces**, if anything. A removed rule gets a bullet in "Deliberately dropped" with
  the sentence that replaces it, so the question is not reopened.

Versions: a new or tightened rule, or a new template, is a minor bump; wording that changes no
behavior is a patch. Before 1.0 a minor bump may also remove or reverse a rule; the changelog says
so in its first line.

## Release

Bump `version` in `package.json`, add the `CHANGELOG.md` entry, commit, tag `v<version>` and push
the tag. The release workflow checks that the tag matches both, then creates the GitHub release
with generated notes.
