# conventions

Architecture conventions as a versioned product with three delivery channels: **docs** (the
rules, with IDs), **lint packages** (what can be checked mechanically) and **skills** (what an
agent must judge). One profile per stack; `nextjs` is the first.

```
docs/<profile>/            rules — core (vendor-agnostic) + bindings/ (one product per role)
docs/templates/            ARCHITECTURE.md, db-inventory.md, MIGRATING.md for projects
rules/<profile>.yaml       generated catalogue: id, severity, enforcement, doc, rule
packages/eslint-plugin-nextjs/   flat config + custom rules + shipped lib/ helpers
examples/nextjs-orders/    reference module; must pass the config
examples/nextjs-violations/ one file per rule; each must fail for that rule
skills/                    Claude Code plugin; the skill reads the catalogue and the lint output
scripts/build-catalog.py   regenerates rules/*.yaml from the doc tables
```

## Principles

1. **Every rule has an ID** (`NX-LAYER-05`), a severity (`error`/`warn`/`review`) and an
   enforcement (`eslint:<rule>`, `tsc`, `check:<script>`, `review`). The ID appears in the doc,
   the lint message, the fixture and the review comment.
2. **Core is vendor-agnostic.** Core rules name roles (the ORM, the contract schema library,
   the action client, the database platform). A **binding** maps a role to a product and may
   add rules, never relax one. Projects declare their bindings in `ARCHITECTURE.md`.
3. **Prose and enforcement never diverge** because the catalogue is generated from the doc
   tables, the fixtures are the regression suite, and the skill points at the lint output
   instead of restating rules.
4. **Projects deviate explicitly.** Every interpretation or deviation is an entry in the
   project's `ARCHITECTURE.md` (decision · enforced by · recorded in), added before the
   deviation lands.

## Use in a project

Pick the path that matches the project. Both install the same three things: the lint package,
an `ARCHITECTURE.md` and the skill. They differ in what already exists and must not be
overwritten.

- **Greenfield** — a new app, or one with no `modules/` and no layering rules yet. Adopt
  everything as shipped; nothing is `legacy`.
- **Brownfield** — an app with code, helpers and an ESLint config of its own. Add the
  guardrails without moving code, declare the old code `legacy`, then migrate one module at a
  time.

### Monorepos

Install into the **app's package** (the folder with `next.config.*` and `eslint.config.mjs`,
e.g. `apps/web`), not the repository root, and run every command below from there. The app is
what the config describes; `appRoot` is relative to the config file, so it stays `'.'` (or
`'src'`). A root that is not a JS workspace, or other apps in other languages, need nothing.

### Install the lint package

It is not on npm; every release of this repo attaches it as a tarball. Pin the exact version:
the tag is the version.

```sh
# npm (and anything that uses package-lock.json, e.g. Vercel's `npm ci`)
npm i -D -E https://github.com/laserjm/conventions/releases/download/v0.1.1/conventions-eslint-plugin-nextjs-0.1.1.tgz

# pnpm can also install straight from the tag
pnpm add -D "github:laserjm/conventions#v0.1.1&path:/packages/eslint-plugin-nextjs"
```

`eslint` (9+) and `typescript` (5+) are peer dependencies. Working on the rules and a project
side by side: `pnpm add -D link:../conventions/packages/eslint-plugin-nextjs` (npm:
`npm i -D ../conventions/packages/eslint-plugin-nextjs`) picks up local edits without a release.
Switch back to the release before you commit.

### Install the skill

The skill reads the catalogue from the installed lint package, so install that first. Pin it to
the same tag:

```sh
npx skills add https://github.com/laserjm/conventions/tree/v0.1.1 --skill nextjs-conventions
```

Or as a Claude Code plugin: `claude plugin marketplace add laserjm/conventions` then
`claude plugin install conventions@conventions`.

### Greenfield

```sh
SRC=node_modules/@conventions/eslint-plugin-nextjs/templates
mkdir -p lib tests && cp -r $SRC/lib/* lib/ && cp -r $SRC/tests/* tests/
curl -fsSL https://raw.githubusercontent.com/laserjm/conventions/v0.1.1/docs/templates/ARCHITECTURE.md \
  -o ARCHITECTURE.md   # fill the header; delete the Legacy section
```

```js
// eslint.config.mjs
import conventions from '@conventions/eslint-plugin-nextjs';
export default [...conventions.createConfig({ appRoot: '.' })];
```

Build the first module from the shape of `examples/nextjs-orders/modules/orders`. Every
interpretation goes into `ARCHITECTURE.md` from the start (NX-MIG-04).

### Brownfield

Follow the refactoring playbook in [`docs/nextjs/architecture.md`](docs/nextjs/architecture.md#refactoring-playbook-for-existing-projects).
Setting it up is step 1, guardrails first:

1. **Merge the helpers, do not copy over them.** `lib/result.ts`, `lib/errors.ts`, `lib/db/*`,
   `lib/safe-action.ts` and `tests/support/local-stack.ts` often exist already.
   `diff -r node_modules/@conventions/eslint-plugin-nextjs/templates/lib lib` shows what
   differs; copy the files that are missing, reconcile the rest by hand, and record any shape you
   keep as an `ARCHITECTURE.md` entry.
2. **`ARCHITECTURE.md`.** If the project has one, add the template's YAML header and the
   Deviations and Legacy sections to it; keep its existing entries, and point its links at the
   docs of the pinned tag. Otherwise start from the template.
3. **Replace the layering config.** Swap any hand-written `eslint-plugin-boundaries` block for
   `createConfig`: the package brings its own copy of the plugin, and ESLint refuses two plugins
   registered as `boundaries`. Keep framework presets such as `next/core-web-vitals` and the
   project's ignores. Declare every pre-module folder `legacy` (NX-LAYER-10) and list each one in
   the Legacy table of `ARCHITECTURE.md`:

   ```js
   // eslint.config.mjs
   import conventions from '@conventions/eslint-plugin-nextjs';
   export default [
     // ...framework presets and ignores
     ...conventions.createConfig({ appRoot: '.', legacy: ['lib/server/**', 'components/**'] }),
   ];
   ```

   Lint until it passes: fix what is cheap, record the rest as deviations with a rule ID. Do not
   widen `legacy` to silence a rule; it lists old code, not exceptions.
4. **Inventory the database code** in [`db-inventory.md`](docs/templates/db-inventory.md)
   (NX-DB-02).

From there, one module at a time: each half-migrated module carries a
[`MIGRATING.md`](docs/templates/MIGRATING.md) (NX-MIG-03), and its folder leaves `legacy` when
it is done.

## Keeping projects in sync

- Projects pin an exact version (a `v<semver>` tag of this repo). A bump moves three things to
  the same tag in one PR: the lint package, the skill (`npx skills add …/tree/v<new>` again)
  and the `conventions:` key of the `ARCHITECTURE.md` header. It is never auto-merged.
- Renovate opens that PR for the pnpm `github:` form. It does not follow the npm tarball URL;
  there the bump is by hand, prompted by the release.
- Semver: new `warn`/`review` rule or clarification → minor; rule flipped to `error`, new `error`
  rule, renamed file/folder → major; wording or report-less fix → patch.
- `ARCHITECTURE.md` header records `conventions: <version>`, so the skill knows which rules apply.
- A rule becomes `error` only after it has been `warn` for one release and the violation count in
  the reference projects is zero.

## Growing it

Violation observed in a project → write the rule with an ID in the doc table → add a file to
`examples/nextjs-violations/` → add it to the reference module if it introduces a new shape →
lint rule or skill note → `python3 scripts/build-catalog.py` → release.

Next profiles planned: `fastapi` (Ruff preset + import-linter contracts for the layering).

## Develop

```sh
pnpm install
pnpm test          # rule unit tests, reference module lint, violation fixtures
python3 scripts/build-catalog.py
```

Release: bump the version everywhere it appears (`grep -rn <old> --exclude-dir=node_modules`),
add the CHANGELOG entry, regenerate the catalogue, tag `v<version>`, push the tag, then attach
the tarball:

```sh
cd packages/eslint-plugin-nextjs && pnpm pack
gh release create v<version> conventions-eslint-plugin-nextjs-<version>.tgz --verify-tag --notes "…"
```
