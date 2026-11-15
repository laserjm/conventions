# Extensions

What this app decided at the conventions' extension points (`docs/CONVENTIONS.md`, Extension
points). The conventions leave these seams to the app. An entry here departs from nothing, so it
needs no ADR. A rollout of the conventions never overwrites this file.

Keep only the points the app uses, and delete the rest. An entry says what was decided, where it
lives in the code and, in a line, why. Change an entry when the decision changes, in the same pull
request as the code.

## E1. Boundaries of the project's own

<!-- Each block in eslint.project.mjs, in a line: what it keeps apart and why.
- `integrations` is a leaf: it imports no other module (import/no-restricted-paths). It is
  replaced per provider and must not drag the others along. -->

## E2. Lint seams

<!-- Each seam set in eslint.project.mjs, and what uses it.
- `moduleLibImports: ["@/lib/fmp/errors"]`: `modules/instruments` catches FMP's failures where
  a read carries on without prices (E3). -->

## E3. External services

<!-- Per client in lib/: its failures, timeout and retries, how adapters answer each failure,
and which use cases carry on without it.
- `lib/fmp/`: throws `FmpUnavailable`, `FmpTimedOut`, `FmpRateLimited`, `FmpBadResponse`
  (`lib/fmp/errors.ts`); a self-caused 4xx is a bug. 10 s deadline, 3 tries for 5xx, 429 and
  lost connections. Actions answer "try again" copy through `fmpRefusal`. `getLiveQuotes`
  answers without prices when FMP fails. -->

## E4. Naming additions

<!-- Roles or kinds of file NAMING.md lacks: name, what it is, example.
- `Ticker`: a symbol with its last price, inline in text (`InstrumentTicker`). -->

## E5. Agent tool names

<!-- The case style of tool names, if not snake_case.
- camelCase, as the AI SDK's examples write them (`getWeatherInformation`). -->

## E6. Observability

<!-- Where "logged" errors go, and what expected refusals report.
- Bugs and FMP failures go to Sentry; FMP failures at warning level. -->

## E7. Test support

<!-- What test/ holds beyond the conventions' errors test, and how tests use it.
- `test/fmp-recordings/`: recorded FMP answers; `test/support/recorded-fmp.ts` serves them. -->
