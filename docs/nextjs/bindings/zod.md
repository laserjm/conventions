# Binding: zod (role: contract schema library)

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-ZOD-01 | error | `zod` is imported in `contracts.ts`, `lib/env.ts`, `infra/` (external payloads, function results), `app/api/**` (webhooks) and `components/` (forms via resolver). Never in `domain/`; in `application/` only as `import type`. | eslint:boundaries/external |
| NX-ZOD-02 | error | Every `z.*` schema declaration is `camelCase` + `Schema`; its type is `z.infer<typeof xSchema>` named `X` (NX-NAME-60). | eslint:nextjs/schema-suffix |
| NX-ZOD-03 | error | Branded ids: `orderIdSchema = z.string().transform(OrderId)` in `contracts.ts`; the `OrderId` constructor lives in `domain/order-id.ts`. | review |
| NX-ZOD-04 | error | Forms use the action's input schema through `@hookform/resolvers/zod` (NX-TYPE-04). A separate `<noun>FormSchema` exists only when the form shape differs from the action input. | review |
| NX-ZOD-05 | warn | `lib/env.ts` uses `@t3-oss/env-nextjs` or plain `z.object(...).parse(process.env)`; either way it is the only reader of `process.env` besides `lib/db/client.ts`. | eslint:no-restricted-syntax (`process.env` outside `lib/env.ts`, `lib/db/client.ts`) |
