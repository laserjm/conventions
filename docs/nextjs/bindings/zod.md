# Binding: zod (role: contract schema library)

<!-- rules: zod -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-ZOD-01 | error | `zod` is imported in `contracts.ts`, `lib/env.ts`, `infra/` (external payloads, function results), `app/api/**` (webhooks) and `components/` (forms via resolver). Never in `domain/`; in `application/` only as `import type`. | eslint:boundaries/external |
| NX-ZOD-02 | error | Every `z.*` schema declaration is `camelCase` + `Schema`; its type is `z.infer<typeof xSchema>` named `X` (NX-NAME-60). | ast-grep:nx-name-60-schema-suffix |
| NX-ZOD-03 | guidance | Branded ids: `orderIdSchema = z.string().transform(OrderId)` in `contracts.ts`; the `OrderId` constructor lives in `domain/order-id.ts`. | agent |
| NX-ZOD-04 | guidance | Forms use the action's input schema through `@hookform/resolvers/zod` (NX-TYPE-04). A separate `<noun>FormSchema` exists only when the form shape differs from the action input. | agent |
| NX-ZOD-05 | error | `lib/env.ts` uses `@t3-oss/env-nextjs` or plain `z.object(...).parse(process.env)`; either way it is the only reader of `process.env` besides `lib/db/client.ts`. Tooling outside the app (`*.config.*`, `scripts/`) reads its own. | ast-grep:nx-zod-05-env-outside-env-readers |
<!-- /rules -->
