# @conventions/nextjs

The `nextjs` conventions profile in one package:

- `@conventions/nextjs` — ESLint 9 flat config (`createConfig()`) and three custom rules.
- `@conventions/nextjs/core` — `Result`, `ok`, `err`, the standard errors, `TenantId`,
  `Requester`, `systemRequester`, `defineUseCase`, `defineRepository`, `ConstraintViolation`.
- `@conventions/nextjs/drizzle` — `createTransactionRunner`, `violatedConstraint`, `postgresErrorCode`.
- `@conventions/nextjs/next-safe-action` — `createActionClients`.
- `@conventions/nextjs/testing` — `describeIntegration`, `assertTenantIsolation`, `localStack`.
- `ast-grep/` rules with tests, `ls-lint.yml`, `profile.json` and `rules/nextjs.yaml`, which
  `@conventions/cli` runs and reads.
- `starters/` the four files a project owns and adapts; `templates/` what `conventions init` writes.

```js
// eslint.config.mjs
import conventions from '@conventions/nextjs';
export default [...conventions.createConfig()]; // app root, legacy folders, rulesets from ARCHITECTURE.md
```

`createConfig` accepts `appRoot`, `legacy`, `rulesets`, `tsconfig`, `extraServerOnly` and
`architecture: false` to ignore the header. Every boundary message starts with the rule id it
enforces; `npx conventions explain <id>` prints the rule.
