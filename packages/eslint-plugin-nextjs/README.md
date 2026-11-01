# @conventions/eslint-plugin-nextjs

ESLint 9 flat config and custom rules for the `nextjs` conventions profile. Every rule names
the convention ID it enforces; look the ID up in `docs/nextjs/*.md`.

## Install

```sh
# npm
npm i -D -E https://github.com/laserjm/conventions/releases/download/v0.1.1/conventions-eslint-plugin-nextjs-0.1.1.tgz
# pnpm
pnpm add -D "github:laserjm/conventions#v0.1.1&path:/packages/eslint-plugin-nextjs"
```

Not published to npm; each release of the repo attaches the tarball, and the tag is the
version. In a monorepo, install it into the app's package. The repo README has the full setup,
separately for greenfield and brownfield projects.

`eslint.config.mjs`:

```js
import conventions from '@conventions/eslint-plugin-nextjs';

export default [
  ...conventions.createConfig({
    appRoot: '.',                       // 'src' if you use one (NX-STR-01)
    legacy: ['lib/server/**', 'lib/monitor/**'], // pre-module code (NX-LAYER-10); shrink as modules land
    tsconfig: './tsconfig.json',
  }),
  // project overrides below — every override needs an ARCHITECTURE.md entry (NX-MIG-04)
];
```

Greenfield: copy the shipped helpers once and keep them in sync with the package version.
Brownfield: the project usually has some of them already; diff and merge instead
(`diff -r node_modules/@conventions/eslint-plugin-nextjs/templates/lib lib`).

```sh
cp -r node_modules/@conventions/eslint-plugin-nextjs/templates/lib/* lib/
cp -r node_modules/@conventions/eslint-plugin-nextjs/templates/tests/* tests/
```

## What it enforces

| Convention | Mechanism |
| --- | --- |
| NX-LAYER-01/03/04/10 layer direction, module entry points, legacy | `boundaries/element-types` |
| NX-LAYER-02, NX-CACHE-01/04, NX-DRZ-01, NX-NSA-05, NX-SB-08 vendor packages per layer | `boundaries/external` |
| NX-LAYER-05 browser-safe `index.ts`, `server-only` | `nextjs/no-server-exports-from-index`, `nextjs/require-server-only` |
| NX-LAYER-08 no `throw` in domain/application | `no-restricted-syntax` |
| NX-LAYER-09 no cycles | `import-x/no-cycle` |
| NX-TYPE-02 no `as` outside mappers | `@typescript-eslint/consistent-type-assertions` |
| NX-ERR-02 / NX-NAME-62 `_tag` equals type name | `nextjs/tag-matches-type-name` |
| NX-CACHE-02 no inline tag strings | `nextjs/no-inline-cache-tags` |
| NX-STR-02 module root layout | `check-file/filename-naming-convention` |
| NX-NAME-01/11 kebab-case files, Next route folders | `check-file` |
| NX-NAME-02 identifier casing, no `I` prefix | `@typescript-eslint/naming-convention` |
| NX-NAME-03 one export per use-case file, named after it | `nextjs/use-case-export-name` |
| NX-NAME-50 `Action` suffix | `nextjs/action-suffix` |
| NX-NAME-60 / NX-ZOD-02 `Schema` suffix | `nextjs/schema-suffix` |
| NX-ZOD-05 `process.env` only in `lib/env.ts`, `lib/db/client.ts` | `no-restricted-syntax` |

Everything with enforcement `review` in the docs is **not** here by design; the conventions
skill covers it.

## Versioning

- New rule at `warn`, new `review` rule, doc clarification → **minor**
- Rule flipped to `error`, new `error` rule, renamed file or folder → **major**
- Message wording, bug fix that reports *less* → **patch**

Projects pin an exact version; Renovate opens the bump PR.
