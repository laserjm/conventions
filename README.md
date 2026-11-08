# conventions

Architecture conventions for Next.js apps on Drizzle, Postgres and zod, as one Markdown document.
A project copies the document, copies the ESLint config that enforces its import rules, and
points its agent instructions at it. Nothing is installed.

```
docs/nextjs/CONVENTIONS.md      the conventions: layout, eleven rules, the two states of a route,
                                promotion triggers, errors, testing, naming
templates/eslint.config.mjs     the import graph and the server-only / 'use server' checks the
                                document only points at; flat config on top of eslint-config-next
templates/adr-0000-template.md  one record per decision that changes or interprets a rule
templates/adr-0001-example-*.md a filled-in example: where the current user is resolved
CHANGELOG.md                    what changed per version, and why
```

Every rule in the document says how it is enforced: **lint** (the ESLint template), **review**
(a human or an agent reads the diff) or **test** (a test the document prescribes). A rule that
lint can enforce is stated once in the document and lives in the config.

## Adopt it in a project

1. Copy `docs/nextjs/CONVENTIONS.md` to the project root as `CONVENTIONS.md`. Put the version you
   copied in its first line as an HTML comment (`<!-- conventions 0.4.0 -->`), so a later diff
   against this repo knows where to start.
2. Copy `templates/eslint.config.mjs` to the project root as `eslint.config.mjs`. It expects
   `eslint-config-next`, the `@/` path alias, and the folders the document names (`app/`,
   `modules/`, `lib/`, `components/`, `hooks/`). Adjust the globs if yours differ.
3. Add to `AGENTS.md` (or `CLAUDE.md`):

   ```markdown
   # Conventions

   Use `CONVENTIONS.md`
   ```

4. When a decision changes or interprets a rule, copy `templates/adr-0000-template.md` to
   `docs/adr/NNNN-<slug>.md` and fill it in. The document's last section says what else the
   project owns: the test setup that refuses to run outside a `_test` database, and the factories.

To upgrade, diff this repo's document against your copy and take what you want. Your local
additions stay yours; the document is a starting point, not a dependency.

## Propose a rule change

Open a pull request against `docs/nextjs/CONVENTIONS.md`. The description says:

- **The reason**: which project hit which problem. Link the commit, issue or ADR. A rule earns
  its place by a problem that happened, not by one that might.
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
