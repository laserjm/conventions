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
   and keeps their version line (`<!-- conventions x.y.z -->`). Its own decisions go into its
   ADRs (`docs/adr/`), which depart from a default; they don't rewrite the document. What a
   downstream repository learns is at most a reason for the owner to start a change here.
3. **A change names its enforcement class**: lint, review or test. A lint rule comes with the
   change to `templates/eslint.config.mjs` in the same pull request; a test rule names the test
   it prescribes. A removed rule gets a bullet in "Deliberately dropped".
4. **Every change is released.** Bump `version` in `package.json`, add the `CHANGELOG.md` entry
   and update the version line at the top of both documents. A new or tightened rule, or a new
   template, is a minor bump; wording that changes no behavior is a patch. Before 1.0 a minor
   bump may remove or reverse a rule, and the changelog says so in its first line.
5. **A release is rolled out to every registered repository** that implements the changed part,
   one pull request per repository, opened from a session in this repository. When it is merged,
   update the repository's version in the table below.
6. **A repository is registered here before it adopts the conventions**, and removed from the
   table when it stops using them.

## Registered repositories

Local links assume the downstream repositories are cloned next to this one.

| Repository | Local | Implements | Version | Where |
| --- | --- | --- | --- | --- |
| [laserjm/dogfood-challenge](https://github.com/laserjm/dogfood-challenge) | [`../dogfood-challenge`](../dogfood-challenge) | Complete: both documents, ESLint config, ADRs | 0.5.0 | repository root |
| [laserjm/screenerhub3](https://github.com/laserjm/screenerhub3) | [`../screenerhub3/apps/web`](../screenerhub3/apps/web) | Complete: `CONVENTIONS.md`, ESLint config, ADRs | 0.4.1 | `apps/web/` |

A repository below the current version (see `package.json`) is due a rollout.
