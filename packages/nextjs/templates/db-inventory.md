# Database code inventory

Every function, trigger and policy helper in the database (NX-DB-02). A migration that
adds, changes or drops one changes this table in the same PR; `conventions check` compares
the two. Categories:

- **A** atomic claim/lock · **B** read model · **C** constraint/policy helper ·
  **D** platform lifecycle hook · **E** pipeline · **X** legacy, to be ported (NX-MIG-01)

| Name | Kind | Category | Caller | Wrapped by (repository method) | Test | Contains business rule? | Plan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `set_updated_at` | trigger | — (allowed by NX-DB-08) | all tables | — | — | no | keep |
