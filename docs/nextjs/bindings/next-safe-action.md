# Binding: next-safe-action (role: action client)

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-NSA-01 | error | `lib/safe-action.ts` exports two clients: `actionClient` (no identity) and `memberActionClient` (middleware signs the caller in once and puts `requester` in `ctx`, or returns `SignedOut`). Nothing else creates a client. | review |
| NX-NSA-02 | error | Every export of `actions.ts` is `memberActionClient.inputSchema(xInputSchema).action(...)` or `actionClient...`, named `<useCase>Action` (NX-NAME-50). | eslint:nextjs/action-suffix |
| NX-NSA-03 | error | `handleServerError` in `lib/safe-action.ts` maps a thrown error to `Unexpected` with a trace id and logs it; tagged errors returned via `Result` are passed through as `serverError` carrying `_tag`. | review |
| NX-NSA-04 | error | The client reads results with `useAction` / `useOptimisticAction` and maps `serverError._tag` to copy with an exhaustive record (NX-ERR-04). | review |
| NX-NSA-05 | error | `next-safe-action` is imported only in `lib/safe-action.ts`, `modules/*/actions.ts` and client components (`/hooks`). | eslint:boundaries/external |

## Shipped file

`packages/eslint-plugin-nextjs/templates/lib/safe-action.ts`.
