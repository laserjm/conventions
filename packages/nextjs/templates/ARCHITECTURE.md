# Architecture

<!-- conventions header: read by the linter, `conventions check` and the conventions skill. Keep the keys. -->
```yaml
conventions: {{version}}
profile: {{profile}}
bindings: [drizzle, supabase, zod, next-safe-action]
app-root: {{appRoot}}            # or src
schema-source: migrations-first  # or code-first
# rulesets: [structure, layers]  # omit to adopt every ruleset; list some to adopt them one at a time
legacy: []                       # globs of pre-module code, relative to app-root (NX-LAYER-10), e.g. [lib/server/**, components/!(ui)/**]
# migrations: ../../supabase/migrations/*.sql   # monorepo: where the SQL migrations are, relative to this file
# inventory: ../../docs/architecture/db-inventory.md
```

This app follows the Next.js Architecture Rules, Naming Conventions and Testing Policy of the
conventions version above, with the bindings listed. `conventions explain <RULE-ID>` prints any
rule. This file records how this project reads the rules where they leave room, and every
deviation (NX-MIG-04). Each entry says what was decided and where it is enforced or recorded.
**Add an entry before you deviate; change one only with the decision that changes it.**

Related: `docs/adr/` (why and in what order), `docs/architecture/db-inventory.md`
(every database function and trigger), `modules/*/MIGRATING.md` (half-migrated modules).

## Interpretations

<!-- One entry per decision. Keep the three parts. -->

### Example: No `src/` folder

**Decision.** `app/`, `modules/`, `lib/` and `components/` sit directly in the package
root; `@/` points there (NX-STR-01).
**Enforced by.** `tsconfig.json` paths; the `app-root` key above.
**Recorded in.** This entry.

## Deviations

<!-- Rules this project does not follow yet. Name the files or globs in backticks in the Deviation column: findings of that rule there are warnings, not errors; a row without paths covers the whole project. A disabled rule in source without a row here fails `conventions check`. Review quarterly. -->

| Rule | Deviation | Why | Until |
| --- | --- | --- | --- |

## Legacy

<!-- Folders declared in the `legacy:` key above and the module that will replace each. -->

| Folder | Replaced by module | Status |
| --- | --- | --- |
