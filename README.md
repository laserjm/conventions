# conventions

Architecture conventions for Next.js apps on Drizzle, Postgres and zod: two Markdown documents,
an ESLint config and an ADR template. A project copies them and points its agent instructions at
them. Nothing is installed.

This is the home repository. Changes are made and released here, then rolled out top down to the
registered repositories; it does not accept change requests from downstream. The rules and the
list of registered repositories are in [AGENTS.md](AGENTS.md).

## Contents

```
docs/nextjs/CONVENTIONS.md       the conventions: how to read them, the floor, the defaults,
                                 what was deliberately dropped, examples, open territory
docs/nextjs/NAMING.md            file and identifier patterns per kind, component roles and placement
templates/eslint.config.mjs      the import graph and the server-only / 'use server' checks;
                                 flat config on top of eslint-config-next
templates/adr-0000-template.md   one record per decision that departs from a default
templates/adr-0001-example-*.md  a filled-in example: where the current user is resolved
CHANGELOG.md                     what changed per version, and why
```

Every rule says how it is enforced: **lint** (the ESLint template), **review** (a human or an
agent reads the diff) or **test** (a test the document prescribes).

The sections bind differently. The **floor** holds in every diff, and no ADR lifts it. A
**default** is followed until there is a reason not to, and the reason goes into an ADR first.
What the document doesn't name is **open territory**, decided by its priorities.

## Adopt it in a project

1. Register the project in the table in [AGENTS.md](AGENTS.md).
2. Copy `docs/nextjs/CONVENTIONS.md` and `docs/nextjs/NAMING.md` to the project root. Keep their
   first line (`<!-- conventions 0.6.0 -->`): it tells the next rollout where to start.
3. Copy `templates/eslint.config.mjs` to the project root as `eslint.config.mjs`. It expects
   `eslint-config-next`, the `@/` path alias, and the folders the document names (`app/`,
   `modules/`, `lib/`, `components/`, `hooks/`, `scripts/`). Adjust the globs if yours differ.
4. Add to the project's `AGENTS.md`:

   ```markdown
   # Conventions

   Use `CONVENTIONS.md`
   ```

5. Before a decision departs from a default, copy `templates/adr-0000-template.md` to
   `docs/adr/NNNN-<slug>.md` and fill it in. The document's last section says what else the
   project owns: the test setup that refuses to run outside a `_test` database, and the factories.

## Change the conventions

A change starts here, never in a downstream copy. It says why the rule earns its place, whether
it belongs to the floor or the defaults, how it is enforced, and what it replaces. Then it is
released and rolled out to every registered repository. [AGENTS.md](AGENTS.md) has the rules.

## Release

Bump `version` in `package.json`, add the `CHANGELOG.md` entry, update the version line in both
documents, commit, tag `v<version>` and push the tag. The release workflow checks that the tag
matches the version and the changelog, then creates the GitHub release with generated notes.
