# Architecture

<!-- conventions header: read by tooling and by the conventions skill. Keep the keys. -->
```yaml
conventions: 0.1.0
profile: nextjs
bindings: [drizzle, supabase, zod, next-safe-action]
app-root: .            # or src
schema-source: migrations-first   # or code-first
```

This app follows the [Next.js Architecture Rules](<link to pinned version>),
[Naming Conventions](<link>) and [Testing Policy](<link>) of the conventions version above,
with the bindings listed. This file records how this project reads the rules where they
leave room, and every deviation (NX-MIG-04). Each entry says what was decided and where it
is enforced or recorded. **Add an entry before you deviate; change one only with the
decision that changes it.**

Related: `docs/adr/` (why and in what order), `docs/architecture/db-inventory.md`
(every database function and trigger), `modules/*/MIGRATING.md` (half-migrated modules).

## Interpretations

<!-- One entry per decision. Keep the three parts. -->

### <Short title of the decision>

**Decision.** What this project does, in one or two sentences.
**Enforced by.** The lint rule, CI job, test or review step that catches a violation.
**Recorded in.** ADR, inventory row or file that explains it.

### Example: No `src/` folder

**Decision.** `app/`, `modules/`, `lib/` and `components/` sit directly in the package
root; `@/` points there (NX-STR-01).
**Enforced by.** `tsconfig.json` paths; `eslint.config.mjs` element patterns.
**Recorded in.** This entry.

## Deviations

<!-- Rules this project does not follow, with the rule ID. Review quarterly. -->

| Rule | Deviation | Why | Until |
| --- | --- | --- | --- |
| NX-… | | | |

## Legacy

<!-- Folders declared as the `legacy` element (NX-LAYER-10) and the module that will replace each. -->

| Folder | Replaced by module | Status |
| --- | --- | --- |
| `lib/server/` | | migrating |
