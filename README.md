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

The lint package is not on npm; install it from a release tag of this repo. This needs pnpm
(npm cannot install a package from a subdirectory of a git repo).

```sh
# pin exactly: the tag is the version
pnpm add -D "github:laserjm/conventions#v0.1.0&path:/packages/eslint-plugin-nextjs" eslint typescript
cp -r node_modules/@conventions/eslint-plugin-nextjs/templates/lib/* lib/
cp -r node_modules/@conventions/eslint-plugin-nextjs/templates/tests/* tests/
curl -fsSL https://raw.githubusercontent.com/laserjm/conventions/v0.1.0/docs/templates/ARCHITECTURE.md \
  -o ARCHITECTURE.md   # fill the header
```

```js
// eslint.config.mjs
import conventions from '@conventions/eslint-plugin-nextjs';
export default [...conventions.createConfig({ appRoot: '.', legacy: ['lib/server/**'] })];
```

Working on the rules and a project side by side: `pnpm add -D link:../conventions/packages/eslint-plugin-nextjs`
picks up local edits without a release. Switch back to the tag before you commit.

Install the skill (it reads the catalogue from the installed lint package, so install that first):

```sh
claude plugin marketplace add laserjm/conventions
claude plugin install conventions@conventions
```

Existing project: follow the refactoring playbook in `docs/nextjs/architecture.md` — guardrails
first with everything declared `legacy`, then one module at a time.

## Keeping projects in sync

- Projects pin an exact version (a `v<semver>` tag of this repo). Renovate opens the bump PR;
  it is never auto-merged.
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
