# Architecture

```yaml
conventions: 0.2.3
profile: nextjs
bindings: [drizzle, supabase, zod, next-safe-action]
app-root: .
schema-source: migrations-first
legacy: []
```

The reference module of the `nextjs` profile: `modules/orders` (rich) and `modules/billing`
(an event handler). It must pass `conventions lint`, `conventions check` and `tsc`; the
violations fixture next door must fail. Copy its shape, not its domain.

## Interpretations

### No `src/` folder

**Decision.** `app/`, `modules/`, `lib/` and `components/` sit in the package root; `@/` points there (NX-STR-01).
**Enforced by.** `tsconfig.json` paths; the `app-root` key above.
**Recorded in.** This entry.

## Deviations

| Rule | Deviation | Why | Until |
| --- | --- | --- | --- |

## Legacy

| Folder | Replaced by module | Status |
| --- | --- | --- |
