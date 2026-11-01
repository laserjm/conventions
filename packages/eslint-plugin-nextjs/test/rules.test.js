// Custom rules whose cases parse with the default parser. Run: node --test test/
import { describe, it } from 'node:test';
import { RuleTester } from 'eslint';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
import { rules } from '../src/rules.js';

const tester = new RuleTester({ languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } });
const at = (p) => `/repo/${p}`;

tester.run('action-suffix', rules['action-suffix'], {
  valid: [
    { code: 'export const payOrderAction = 1; export function revalidateOrder() {}', filename: at('modules/orders/actions.ts') },
    { code: 'export const getOrder = 1;', filename: at('modules/orders/queries.ts') },
  ],
  invalid: [
    { code: 'export const payOrder = 1;', filename: at('modules/orders/actions.ts'), errors: [{ messageId: 'missingSuffix' }] },
    { code: 'export const payOrderAction = 1;', filename: at('modules/orders/application/pay-order.ts'), errors: [{ messageId: 'misplacedSuffix' }] },
    { code: 'const x = 1; export { x as doAction };', filename: at('lib/foo.ts'), errors: [{ messageId: 'misplacedSuffix' }] },
  ],
});

tester.run('use-case-export-name', rules['use-case-export-name'], {
  valid: [
    { code: 'export async function payOrder() {}', filename: at('modules/orders/application/pay-order.ts') },
    { code: 'export const listOpenOrders = async () => {};', filename: at('modules/orders/application/list-open-orders.ts') },
    { code: 'export const a = 1; export const b = 2;', filename: at('modules/orders/application/ports.ts') },
    { code: 'export const whatever = 1;', filename: at('modules/orders/application/pay-order.test.ts') },
    { code: 'export const whatever = 1;', filename: at('modules/orders/application/__fakes__/order.repository.fake.ts') },
  ],
  invalid: [
    { code: 'export function pay() {}', filename: at('modules/orders/application/pay-order.ts'), errors: [{ messageId: 'wrongName' }] },
    { code: 'export function payOrder() {} export const helper = 1;', filename: at('modules/orders/application/pay-order.ts'), errors: [{ messageId: 'tooMany' }, { messageId: 'wrongName' }] },
    { code: 'const payOrder = 1;', filename: at('modules/orders/application/pay-order.ts'), errors: [{ messageId: 'none' }] },
  ],
});

tester.run('no-inline-cache-tags', rules['no-inline-cache-tags'], {
  valid: [
    { code: 'revalidateTag(ORDER_TAGS.all); revalidateTag(ORDER_TAGS.one(id)); cacheTag(ORDER_TAGS.all);' },
  ],
  invalid: [
    { code: "revalidateTag('orders');", errors: [{ messageId: 'inline' }] },
    { code: 'cacheTag(`order:${id}`);', errors: [{ messageId: 'inline' }] },
    { code: "cache.revalidateTag('orders');", errors: [{ messageId: 'inline' }] },
  ],
});

tester.run('no-server-exports-from-index', rules['no-server-exports-from-index'], {
  valid: [
    { code: "export * from './contracts'; export { payOrderAction } from './actions';", filename: at('modules/orders/index.ts') },
    { code: "import 'server-only'; export * from './queries';", filename: at('modules/orders/server.ts') },
    { code: "export * from './infra/order.repository';", filename: at('modules/orders/application/ports.ts') },
  ],
  invalid: [
    { code: "export * from './queries';", filename: at('modules/orders/index.ts'), errors: [{ messageId: 'queries' }] },
    { code: "export { orderRepository } from './infra/order.repository';", filename: at('modules/orders/index.ts'), errors: [{ messageId: 'infra' }] },
    { code: "import { orderRepository } from './infra/order.repository';", filename: at('modules/orders/server.ts'), errors: [{ messageId: 'infra' }] },
  ],
});

tester.run('schema-suffix', rules['schema-suffix'], {
  valid: [
    { code: 'export const payOrderInputSchema = z.object({});' },
    { code: 'const emailSchema = z.string().email();' },
    { code: 'function f() { const local = z.string(); return local; }' },
    { code: 'const notZod = y.object({});' },
  ],
  invalid: [
    { code: 'export const payOrderInput = z.object({});', errors: [{ messageId: 'suffix' }] },
    { code: 'const PayOrderSchema = z.object({}).strict();', errors: [{ messageId: 'suffix' }] },
  ],
});

tester.run('require-server-only', rules['require-server-only'], {
  valid: [
    { code: "import 'server-only'; export const getOrder = 1;", filename: at('modules/orders/queries.ts') },
    { code: 'export const x = 1;', filename: at('modules/orders/actions.ts') },
  ],
  invalid: [
    { code: 'export const getOrder = 1;', filename: at('modules/orders/queries.ts'), errors: [{ messageId: 'missing' }] },
    { code: "export * from './queries';", filename: at('modules/orders/server.ts'), errors: [{ messageId: 'missing' }] },
  ],
});
