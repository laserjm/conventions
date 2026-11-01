# Binding: next-safe-action (role: action client)

<!-- rules: next-safe-action -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NSA-01 | error | `lib/safe-action.ts` exports `actionClient` (no identity) and `memberActionClient` (signs the caller in once, puts `requester` in `ctx`, or ends the call with `SignedOut`), both from `createActionClients()` in `@conventions/nextjs/next-safe-action`. Nothing else creates a client. | ast-grep:nx-nsa-01-no-action-client-creation |
| NX-NSA-02 | error | Every export of `actions.ts` is `memberActionClient.inputSchema(xInputSchema).action(...)` or `actionClient...`, named `<useCase>Action` (NX-NAME-50). | ast-grep:nx-nsa-02-actions-are-client-chains |
| NX-NSA-03 | error | `createActionClients()` maps a thrown error to `Unexpected` with a trace id and logs it; tagged errors returned via `Result` pass through as `serverError` carrying `_tag`. | ast-grep:nx-nsa-01-no-action-client-creation |
| NX-NSA-04 | guidance | The client reads results with `useAction` / `useOptimisticAction` and maps `serverError._tag` to copy with an exhaustive record (NX-ERR-04). | agent |
| NX-NSA-05 | error | `next-safe-action` is imported only in `lib/safe-action.ts`, `modules/*/actions.ts` and client components (`/hooks`). | eslint:boundaries/external |
<!-- /rules -->

## Shipped

`createActionClients` in `@conventions/nextjs/next-safe-action`; the starter `lib/safe-action.ts` calls it.
