# @conventions/nextjs

The `nextjs` conventions profile in one package:

- `@conventions/nextjs` — ESLint 9 flat config (`createConfig()`) and three custom rules. typescript-eslint is registered as `nx-ts`, so a framework preset that brings `@typescript-eslint` does not collide.
- `@conventions/nextjs/core` — `Result`, `ok`, `err`, the standard errors, `Requester`,
  `TenantRequester`/`TenantId`, `OwnerRequester`/`OwnerId` (per the header's `isolation`), `systemRequester`, `defineUseCase`, `defineRepository`, `ConstraintViolation`.
- `@conventions/nextjs/drizzle` — `createTransactionRunner`, `violatedConstraint`, `postgresErrorCode`.
- `@conventions/nextjs/next-safe-action` — `createActionClients`.
- `@conventions/nextjs/testing` — `describeIntegration`, `assertIsolation`, `localStack`.
- `ast-grep/` rules with tests, `ls-lint.yml`, `profile.json` and `rules/nextjs.yaml`, which
  `@conventions/cli` runs and reads.
- `starters/` the four files a project owns and adapts (`lib/auth/requester.ts` in one variant per `isolation`); `templates/` what `conventions init` writes.

```js
// eslint.config.mjs
import conventions from '@conventions/nextjs';
export default [...conventions.createConfig()]; // app root, legacy folders, rulesets from ARCHITECTURE.md
```

`createConfig` accepts `appRoot`, `legacy`, `rulesets`, `tsconfig`, `extraServerOnly` and
`architecture: false` to ignore the header. Every boundary message starts with the rule id it
enforces; `npx conventions explain <id>` prints the rule.
