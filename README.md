# conventions

Architecture conventions for Next.js apps on Drizzle, Postgres and zod: a baseline with extension
points. Two Markdown documents, an ESLint config, an extensions template, an ADR template and a
test for one of the extensions. A project copies them and points its agent instructions at
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
templates/eslint.project.mjs     the project's own lint rules (E1) and lint seams (E2), empty;
                                 copied once, then the project's
templates/errors.test.ts         with E8: every module error is in its list, named after its class
templates/EXTENSIONS.md          the app's decisions at the extension points; copied once, then the app's
templates/adr-0000-template.md   one record per decision that departs from a default
templates/adr-0001-example-*.md  a filled-in example: where the current user is resolved
CHANGELOG.md                     what changed per version, and why
```

Every rule says how it is enforced: **lint** (the ESLint template), **review** (a human or an
agent reads the diff) or **test** (a test the document prescribes).

The sections bind differently. The **floor** holds in every diff, and no ADR lifts it. A
**default** is followed until there is a reason not to, and the reason goes into an ADR first. An
**extension point** is a seam the baseline leaves to the app: the app decides and writes it in
`docs/EXTENSIONS.md`, with no ADR. What the document doesn't name is **open territory**, decided
by its priorities.

The baseline is small on purpose and changes rarely. An app that grows grows into its extension
points; the baseline takes something over only when two apps have written the same extension.

## Adopt it in a project

The conventions apply to one Next.js app and live at its **app root**, the folder that holds the
app's `package.json`. In a single-app repository that is the repository root; in a monorepo it is
`apps/<app>/`. Every app that adopts them carries its own copy:

```
<app root>/
├─ AGENTS.md            points at docs/CONVENTIONS.md
├─ CLAUDE.md            @AGENTS.md
├─ eslint.config.mjs    from templates/eslint.config.mjs
├─ eslint.project.mjs   from templates/eslint.project.mjs once, then the app's own
├─ test/errors.test.ts  from templates/errors.test.ts, with E8 only
└─ docs/
   ├─ CONVENTIONS.md    from docs/nextjs/
   ├─ NAMING.md         from docs/nextjs/
   ├─ EXTENSIONS.md     from templates/EXTENSIONS.md once, then the app's own
   └─ adr/              the app's departures from a default
```

1. Register the app in the table in [AGENTS.md](AGENTS.md), one row per app.
2. Copy `docs/nextjs/CONVENTIONS.md` and `docs/nextjs/NAMING.md` to `docs/` at the app root. Keep
   their first line (`<!-- conventions 0.10.0 -->`): it tells the next rollout where to start.
3. Copy `templates/eslint.config.mjs` to the app root as `eslint.config.mjs`. It expects
   `eslint-config-next`, the `@/` path alias, and the folders the document names (`app/`,
   `modules/`, `lib/`, `components/`, `hooks/`, `scripts/`). Adjust the globs if yours differ.
   Copy `templates/eslint.project.mjs` next to it once: it is where the app adds boundaries of its
   own, and a rollout never overwrites it. An app that uses the exhaustive error mapping (E8)
   copies `templates/errors.test.ts` to `test/errors.test.ts`.
   Copy `templates/EXTENSIONS.md` to `docs/EXTENSIONS.md` once, and keep only the points the app
   uses.
4. Add to the app's `AGENTS.md`, and give the app a `CLAUDE.md` that contains only `@AGENTS.md`:

   ```markdown
   # Conventions

   Use `docs/CONVENTIONS.md`
   ```

   Point at `CONVENTIONS.md` only. It sends the reader to `NAMING.md` when a file or an export is
   created or renamed, so most tasks don't load the naming tables.
5. Before a decision departs from a default, copy `templates/adr-0000-template.md` to
   `docs/adr/NNNN-<slug>.md` and fill it in. The document's last section says what else the
   project owns: the test setup that refuses to run outside a `_test` database, and the factories.

In a monorepo, the repository root's `AGENTS.md` is a map: it lists the apps under `apps/`, says
which of them follow the conventions, and tells the reader to read an app's `AGENTS.md` before
working in it. It doesn't point at the conventions itself. A second Next.js app gets its own copy,
ADRs and version; one shared copy is not worth it until two apps exist.

## Change the conventions

A change starts here, never in a downstream copy. It says why the rule earns its place, whether
it belongs to the floor, the defaults or the extension points, how it is enforced, what it
replaces, and what the rollout costs each app. A finding in one app stays in that app's
`EXTENSIONS.md`; it moves here when a second app has written the same one. Then it is released
and rolled out to every registered repository. [AGENTS.md](AGENTS.md) has the rules.

## Release

Bump `version` in `package.json`, add the `CHANGELOG.md` entry, update the version line in both
documents, commit, tag `v<version>` and push the tag. The release workflow checks that the tag
matches the version and the changelog, then creates the GitHub release with generated notes.
