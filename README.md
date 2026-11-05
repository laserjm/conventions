# conventions

Architecture conventions as a versioned, checkable product. One **profile** per stack
(`nextjs` today), each profile a catalogue of rules with ids and, for every rule, the tool that
enforces it. A project adopts a profile by installing two packages and adding one header to
its `ARCHITECTURE.md`; nothing is copied into the project.

```
catalog/<profile>/*.yaml      the rules: one file per table — id, severity, text, mechanism, tool
docs/<profile>/               the prose; rule tables and the checklist are generated into it
rules/<profile>.yaml          generated flat catalogue (also shipped inside the profile package)
packages/<profile>/           @conventions/<profile>: eslint config, ast-grep rules, ls-lint config,
                              profile manifest, runtime core (Result, errors, use cases, …), starters
packages/cli/                 @conventions/cli: `conventions lint | check | explain | init | sync`
examples/<profile>-orders/    reference module: must pass lint, check, tsc and its tests
examples/<profile>-violations/ one fixture per rule id; every lint-enforced rule must have one
skills/, hooks/               Claude Code plugin: skills that read the catalogue, hooks that lint on write
scripts/build-catalog.mjs     validates the catalogue, regenerates rules/ and the doc tables
```

## How a rule is enforced

Every rule has an id (`NX-LAYER-05`), a severity and a **mechanism**. The mechanism is a real
tool, not a promise; the catalogue build fails when a rule claims one it cannot have.

| Mechanism | What it is | Rules (nextjs) |
| --- | --- | --- |
| `eslint` | boundaries (layers, module entry points, vendor packages per layer), typescript-eslint, three custom rules | 23 |
| `ast-grep` | syntax rules in YAML with their own test cases: suffixes, `server-only`, no `throw` in pure layers, … | 30 |
| `ls-lint` | file and folder names, module-root layout | 4 |
| `tsc` | shapes the core types refuse: `TenantId`/`OwnerId`, `defineUseCase`, `systemRequester` | 4 |
| `check` | `conventions check`: modules complete, tests next to use cases and repositories, owner ids typed and isolation tested, header version, deviations, database inventory | 14 |
| `ci` | a job in the project's workflow: schema drift, pgTAP | 3 |
| `agent` | judgement: the conventions skill and the reviewer, with a generated checklist | 55 |

`conventions lint` runs ESLint, ast-grep and ls-lint in one pass and prints every finding with
its rule id; findings of the project's other ESLint plugins (framework presets) come out as
`ESLINT`, so it is the one lint command a project needs, Deviations rows included. `conventions explain NX-…` prints the rule. The violations fixture proves every
lint-enforced rule fires, and the reference module proves the rules are satisfiable.

## Use in a project

```sh
# from the release tarballs; app code imports the profile's runtime core, so it is a dependency
V=0.3.2; R=https://github.com/laserjm/conventions/releases/download/v$V
npm i -E $R/conventions-nextjs-$V.tgz
npm i -D -E $R/conventions-cli-$V.tgz
npx conventions init --profile nextjs --isolation owner   # ARCHITECTURE.md, eslint.config.mjs, CI, CLAUDE.md, AGENTS.md
npx conventions lint && npx conventions check
```

`init` writes only what is missing. The header it puts in `ARCHITECTURE.md` is the one place a
project configures the conventions:

```yaml
conventions: 0.3.2
profile: nextjs
bindings: [drizzle, supabase, zod, next-safe-action]
app-root: .                      # or src
isolation: owner                 # who owns a row: tenant (a workspace), owner (the signed-in user) or none
rulesets: [structure, layers]    # optional: adopt rulesets one at a time; omit for all
legacy: [lib/server/**]          # brownfield: pre-module code keeps its shape (NX-LAYER-10)
```

The ESLint config, `conventions lint`, `conventions check` and the skill all read it. Runtime
helpers are imported, not copied: `@conventions/nextjs/core` (`Result`, errors, `Requester`, `TenantId`/`OwnerId`,
`defineUseCase`, `defineRepository`), `/drizzle`, `/next-safe-action`, `/testing`. Four
starters the project owns (`lib/safe-action.ts`, `lib/env.ts`, `lib/db/client.ts`,
`lib/auth/requester.ts`, in the variant for the project's `isolation`) are written by `init`
when missing.

`isolation:` says who owns a row. Not every app has tenants: in an app where each user's data
is theirs alone, `isolation: owner` gives an `OwnerRequester` with `ownerId: OwnerId`, and the
ownership rules read "owner" where a tenant app reads "tenant". `isolation: none` turns them off.

- **Greenfield**: `init`, fill the header, build the first module with the `new-module` skill.
- **Brownfield**: `init`, list pre-module folders under `legacy:` and in the Legacy table, lint
  until green (fix what is cheap, record the rest as Deviations rows), then migrate one module
  at a time following the playbook in [`docs/nextjs/architecture.md`](docs/nextjs/architecture.md#refactoring-playbook-for-existing-projects).
- **Monorepo**: install into the app's package and run everything from there.
- **Agents**: `claude plugin marketplace add laserjm/conventions && claude plugin install conventions@conventions`.
  The plugin's hooks lint every file the agent writes and run the checks before it stops; the
  skills point the agent at the catalogue and the CLI instead of restating rules.

### Keeping a project in sync

Projects pin an exact version. A bump is `npm i -D @conventions/nextjs@<v> @conventions/cli@<v>`,
`npx conventions sync` (updates the header), commit. `conventions check` fails while the header
and the installed version differ. Semver: new `warn`, `guidance` or `check` rule, or a
clarification → minor; rule flipped to `error`, new `error` rule, renamed file or folder →
major; wording or a fix that reports less → patch. A rule becomes `error` only after one release
at `warn` with zero findings in the reference projects.

## Growing it

A violation seen in a project → a rule with an id in `catalog/<profile>/<table>.yaml` → the
cheapest mechanism that catches it (prefer an existing tool: ast-grep over a custom ESLint rule,
`check` over a new tool) → a fixture file in `examples/<profile>-violations/` carrying
`// expect: <id>` → the reference module if it introduces a new shape → `pnpm test` → release.
[`docs/adding-a-profile.md`](docs/adding-a-profile.md) describes a second profile (FastAPI:
Ruff, import-linter, the same ast-grep and CLI).

## Develop

```sh
pnpm install
pnpm test          # build, catalogue + docs, rule tests, CLI tests, reference module, fixtures
pnpm catalog       # after editing catalog/**: regenerates rules/ and the doc tables
```

Release: bump `version` in the root, `packages/*/package.json`, `.claude-plugin/*.json` and the
examples' `ARCHITECTURE.md` headers, add the CHANGELOG entry, `pnpm catalog`, `pnpm test`, then
tag `v<version>` and push the tag. The release workflow packs both packages and attaches the
tarballs to the GitHub release.
