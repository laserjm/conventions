# Binding: zod (role: contract schema library)

<!-- rules: zod -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-ZOD-01 | error | `zod` is imported in `contracts.ts`, `lib/env.ts`, `infra/` (external payloads, function results), `app/api/**` (webhooks) and `components/` (forms via resolver). Never in `domain/`; in `application/` only as `import type`. | eslint:boundaries/external |
| NX-ZOD-02 | error | Every `z.*` schema declaration is `camelCase` + `Schema`; its type is `z.infer<typeof xSchema>` named `X` (NX-NAME-60). | ast-grep:nx-name-60-schema-suffix |
| NX-ZOD-03 | guidance | Branded ids: `orderIdSchema = z.string().transform(OrderId)` in `contracts.ts`; the `OrderId` constructor lives in `domain/order-id.ts`. | agent |
| NX-ZOD-04 | guidance | Forms use the action's input schema through `@hookform/resolvers/zod` (NX-TYPE-04). A separate `<noun>FormSchema` exists only when the form shape differs from the action input. | agent |
| NX-ZOD-05 | error | `lib/env.ts` uses `@t3-oss/env-nextjs` or plain `z.object(...).parse(process.env)`; either way it is the only reader of `process.env` besides `lib/db/client.ts`. Tooling outside the app (`*.config.*`, `scripts/`) reads its own. | ast-grep:nx-zod-05-env-outside-env-readers |
| NX-ZOD-06 | guidance | A `text` column a check constraint holds to a set of values (status, kind, currency) is narrowed in `infra/` by parsing with the domain's `as const` list through `z.enum(LIST)`, never by a cast, not even in a `*.mapper.ts`. A row that breaks its constraint then fails loudly instead of a wrong value travelling on (NX-TYPE-02). | agent |
<!-- /rules -->

## Narrowing a stored value (NX-ZOD-06)

`drizzle-kit pull` types a constrained `text` column as `string`. Parse it with the list the
domain already exports, so a row that breaks its constraint fails where it is read:

```ts
// domain/portfolio.ts
export const INTENTS = ['own', 'follow'] as const;
export type Intent = (typeof INTENTS)[number];

// infra/portfolio.repository.ts
const storedIntentSchema = z.enum(INTENTS);
const toPortfolio = (row: PortfolioRow) => ({ ...row, intent: storedIntentSchema.parse(row.intent) });
```

`row.intent as Intent` is wrong in a repository and just as wrong in a `*.mapper.ts`: the
mapper exemption of NX-TYPE-02 is for shapes the types cannot express, not for a value the
code could check.
