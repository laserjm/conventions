# Architecture (violations fixture)

```yaml
conventions: 0.2.1
profile: nextjs
bindings: [drizzle, supabase, zod, next-safe-action]
app-root: .
legacy: [lib/legacy/**, components/legacy/**]
```

Every file under `app/`, `modules/`, `lib/` and `components/` carries `// expect: <RULE-ID>[, …]`
and must be reported for each id by `conventions lint`; a file without the comment must be clean.
`check.mjs` also asserts that every lint-enforced rule in the catalogue is covered by a fixture.

## Deviations

| Rule | Deviation | Why | Until |
| --- | --- | --- | --- |
| NX-DRZ-08 | raw SQL in `modules/orders/infra/order.repository.ts` | proves a Deviations row turns the finding into a warning (check.mjs asserts it) | never |

## Legacy

| Folder | Replaced by module | Status |
| --- | --- | --- |
| `lib/legacy/` | `modules/orders` | migrating |
| `components/legacy/` | `modules/orders` | migrating |
