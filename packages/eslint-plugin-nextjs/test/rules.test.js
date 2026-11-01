// Custom rules whose cases parse with the default parser. Run: pnpm test
import { after, describe, it } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
    // index.ts and server.ts re-export the module's own actions (NX-NAME-12)
    { code: "export { payOrderAction, revalidateOrder } from './actions';", filename: at('modules/orders/index.ts') },
    { code: "export { payOrderAction } from './actions.ts';", filename: at('modules/orders/server.ts') },
  ],
  invalid: [
    { code: 'export const payOrder = 1;', filename: at('modules/orders/actions.ts'), errors: [{ messageId: 'missingSuffix' }] },
    // a re-export from anywhere but the module's own actions.ts still counts
    { code: "export { payOrderAction } from '@/modules/orders/index';", filename: at('modules/billing/index.ts'), errors: [{ messageId: 'misplacedSuffix' }] },
    { code: "export { payOrderAction } from './application/pay-order';", filename: at('modules/orders/index.ts'), errors: [{ messageId: 'misplacedSuffix' }] },
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
    { code: "import 'server-only'; export * from './queries'; export * from './commands';", filename: at('modules/orders/server.ts') },
    { code: "export * from './infra/order.repository';", filename: at('modules/orders/application/ports.ts') },
  ],
  invalid: [
    { code: "export * from './queries';", filename: at('modules/orders/index.ts'), errors: [{ messageId: 'queries' }] },
    { code: "export { orderRepository } from './infra/order.repository';", filename: at('modules/orders/index.ts'), errors: [{ messageId: 'infra' }] },
    { code: "export { payOrder } from './commands';", filename: at('modules/orders/index.ts'), errors: [{ messageId: 'commands' }] },
    { code: "export * from './commands.ts';", filename: at('modules/orders/index.ts'), errors: [{ messageId: 'commands' }] },
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
    { code: 'export async function payOrder() {}', filename: at('modules/orders/commands.ts'), errors: [{ messageId: 'missing', data: { file: 'commands.ts' } }] },
  ],
});

// NX-LAYER-11 looks for a sibling commands.ts on disk, so its cases live in a temporary tree.
const tree = mkdtempSync(path.join(tmpdir(), 'conventions-'));
for (const dir of ['modules/rich', 'modules/anemic']) mkdirSync(path.join(tree, dir), { recursive: true });
writeFileSync(path.join(tree, 'modules/rich/commands.ts'), "import 'server-only';\n");
const inTree = (p) => path.join(tree, p);
after(() => rmSync(tree, { recursive: true, force: true }));

tester.run('actions-use-commands', rules['actions-use-commands'], {
  valid: [
    { code: "import { payOrder } from './commands'; import { payOrderInputSchema } from './contracts';", filename: inTree('modules/rich/actions.ts') },
    // no commands.ts yet: the action wires the use case itself (NX-LAYER-06)
    { code: "import { payOrder } from './application/pay-order'; import { orderRepository } from './infra/order.repository';", filename: inTree('modules/anemic/actions.ts') },
    // only actions.ts is checked
    { code: "import { orderRepository } from './infra/order.repository';", filename: inTree('modules/rich/commands.ts') },
  ],
  invalid: [
    { code: "import { payOrder } from './application/pay-order';", filename: inTree('modules/rich/actions.ts'), errors: [{ messageId: 'viaCommands' }] },
    { code: "import { orderRepository } from './infra/order.repository';", filename: inTree('modules/rich/actions.ts'), errors: [{ messageId: 'viaCommands' }] },
  ],
});
