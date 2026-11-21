# AGENTS.md

`laserjm/conventions` is the home repository of the conventions. It holds the source of truth
(`docs/nextjs/CONVENTIONS.md`, `docs/nextjs/NAMING.md`, the templates in `templates/`) and the
list of repositories that use them. Every other repository that implements the conventions is
downstream of this one.

## Rules

1. **Changes go top down only.** This repository does not accept bottom-up change requests.
   A change to the conventions is made here first, released here, and then rolled out to the
   registered repositories. Nothing flows the other way: no pull request, issue or port from a
   downstream repository changes this one, and an agent working in a downstream repository
   never opens one here.
2. **A downstream repository doesn't change its copy.** It takes the released files as they are
   and keeps their version line (`<!-- conventions x.y.z -->`). Its own decisions go into
   `docs/EXTENSIONS.md` where they fill an extension point, and into its ADRs (`docs/adr/`) where
   they depart from a default; they don't rewrite the document. What a downstream repository
   learns is at most a reason for the owner to start a change here.
3. **A change names its enforcement class**: lint, review or test. A lint rule comes with the
   change to `templates/eslint.config.mjs` in the same pull request; a test rule names the test
   it prescribes. A removed rule gets a bullet in "Deliberately dropped".
4. **Every change is released.** Bump `version` in `package.json`, add the `CHANGELOG.md` entry
   and update the version line at the top of both documents. A new or tightened rule, or a new
   template, is a minor bump; wording that changes no behavior is a patch. Before 1.0 a minor
   bump may remove or reverse a rule, and the changelog says so in its first line.
5. **A release is rolled out to every registered repository** that implements the changed part,
   one pull request per repository, opened from a session in this repository. A rollout also
   brings the app to the layout in the README: the documents in `docs/` at the app root, the
   app's `AGENTS.md` pointing at `docs/CONVENTIONS.md` only, a `CLAUDE.md` with `@AGENTS.md`, and
   in a monorepo a root `AGENTS.md` that maps the apps. When it is merged, update the version in
   the table below.
6. **An app is registered here before it adopts the conventions**, one row per app, and removed
   from the table when it stops using them. A monorepo with two adopting apps has two rows.
7. **A rollout is not a source of changes.** A challenge from a rollout is answered in the
   rollout: most become the app's extension (`docs/EXTENSIONS.md`) or an ADR, not a release.
   Something moves into the baseline when two registered apps have written the same extension,
   or when a floor rule is wrong. A change that adds a rule names the bug it prevented in those
   apps.
8. **A release says what it costs.** Its changelog entry ends with "To upgrade", and that section
   names every code change a registered app has to make. A release that only loosens, clarifies
   or adds a seam costs a copy of the files; one that makes apps rewrite code needs a reason the
   apps already felt.

## Registered repositories

Local links assume the downstream repositories are cloned next to this one. *Where* is the app
root: the repository root for a single-app repository, `apps/<app>/` in a monorepo.

| Repository | Local | Implements | Version | Where |
| --- | --- | --- | --- | --- |
| [laserjm/dogfood-challenge](https://github.com/laserjm/dogfood-challenge) | [`../dogfood-challenge`](../dogfood-challenge) | Complete: both documents, ESLint config, `eslint.project.mjs`, `EXTENSIONS.md` (with E8), errors test, ADRs | 0.9.0 | repository root |
| [laserjm/jigframe](https://github.com/laserjm/jigframe) | [`../jigframe/apps/web`](../jigframe/apps/web) | Complete: both documents, ESLint config, `eslint.project.mjs`, `EXTENSIONS.md` (without E8), ADRs in the repository's `docs/adr/` | 0.9.0 | `apps/web/` |
| [laserjm/jigframe](https://github.com/laserjm/jigframe) | [`../jigframe/apps/admin`](../jigframe/apps/admin) | Complete, on supabase-js instead of Drizzle (ADR 0011): both documents, ESLint config, `eslint.project.mjs`, `EXTENSIONS.md` (without E8), ADRs in the repository's `docs/adr/` | 0.9.0 | `apps/admin/` |
| [laserjm/screener-hub](https://github.com/laserjm/screener-hub) | [`../screener-hub/apps/web2`](../screener-hub/apps/web2) | Complete: both documents, ESLint config, `eslint.project.mjs`, `EXTENSIONS.md` (without E8), no ADRs yet; on branch `feat/init-rebuild-web2`, not yet on `main` | 0.9.0 | `apps/web2/` |
| [laserjm/screenerhub3](https://github.com/laserjm/screenerhub3) | [`../screenerhub3/apps/web`](../screenerhub3/apps/web) | Complete: both documents, ESLint config, `eslint.project.mjs`, `EXTENSIONS.md` (with E8), errors test, ADRs | 0.9.0 | `apps/web/` |
| [laserjm/workspace-prototype](https://github.com/laserjm/workspace-prototype) | [`../workspace-prototype`](../workspace-prototype) | Complete: both documents, ESLint config, `eslint.project.mjs`, `EXTENSIONS.md` (with E8), errors test, ADRs | 0.9.0 | repository root |

A repository below the current version (see `package.json`) is due a rollout.
