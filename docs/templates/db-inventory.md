# Database code inventory

Every function, trigger and policy helper in the database (NX-DB-02). A migration that
adds, changes or drops one changes this table in the same PR. Categories:

- **A** atomic claim/lock · **B** read model · **C** constraint/policy helper ·
  **D** platform lifecycle hook · **E** pipeline · **X** legacy, to be ported (NX-MIG-01)

| Name | Kind | Category | Caller | Wrapped by (repository method) | Test | Contains business rule? | Plan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `claim_check` | function | A | check worker | `checkRepository.claimNext` | `supabase/tests/claim_check.sql` | no | keep |
| `handle_new_user` | trigger on `auth.users` | D | platform | — | `supabase/tests/handle_new_user.sql` | provisioning only | keep |
| `set_updated_at` | trigger | — (allowed by NX-DB-08) | all tables | — | — | no | keep |
| `calculate_order_total` | function | X | `lib/server/orders.ts` | — | — | **yes** (pricing) | port to `modules/orders/domain/order.ts`, step 5 of ADR 00xx |
