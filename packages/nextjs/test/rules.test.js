// Custom rules that need the file name, two captured texts or the file system. Run: pnpm test
import { after, describe, it } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { rules } from '../eslint/rules.js';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' } });
const at = (p) => `/repo/${p}`;

tester.run('use-case-export-name', rules['use-case-export-name'], {
  valid: [
    { code: 'export const payOrder = defineUseCase(async () => ok(1));', filename: at('modules/orders/application/pay-order.ts') },
    { code: 'export type PayOrderInput = { id: string }; export type PayOrderDeps = {}; export const payOrder = 1;', filename: at('modules/orders/application/pay-order.ts') },
    { code: 'export const a = 1; export const b = 2;', filename: at('modules/orders/application/ports.ts') },
    { code: 'export const whatever = 1;', filename: at('modules/orders/application/__fakes__/order.repository.fake.ts') },
  ],
  invalid: [
    { code: 'export function pay() {}', filename: at('modules/orders/application/pay-order.ts'), errors: [{ messageId: 'wrongName' }] },
    { code: 'export const payOrder = 1; export const helper = 1;', filename: at('modules/orders/application/pay-order.ts'), errors: [{ messageId: 'tooMany' }, { messageId: 'wrongName' }] },
    { code: 'const payOrder = 1;', filename: at('modules/orders/application/pay-order.ts'), errors: [{ messageId: 'none' }] },
  ],
});

tester.run('tag-matches-type-name', rules['tag-matches-type-name'], {
  valid: [
    { code: "export type OrderAlreadyPaid = { readonly _tag: 'OrderAlreadyPaid'; orderId: string };" },
    { code: 'export type Plain = { id: string };' },
    { code: "export type OrderError = OrderAlreadyPaid | { _tag: 'InsufficientStock' };" }, // unions are not checked
    { code: "export interface Paid { _tag: 'Paid' }" },
  ],
  invalid: [
    { code: "export type OrderAlreadyPaid = { _tag: 'PayOrderFailed' };", errors: [{ messageId: 'mismatch' }] },
    { code: "export interface OrderAlreadyPaid { _tag: 'PayOrderFailed' }", errors: [{ messageId: 'mismatch' }] },
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
    { code: "import { orderRepository } from './infra/order.repository';", filename: inTree('modules/rich/commands.ts') },
    { code: "import type { OrderEvent } from './application/ports'; import { type PayOrderDeps } from './application/pay-order';", filename: inTree('modules/rich/actions.ts') },
    // another module's layers are a boundaries matter, not this rule's
    { code: "import { x } from '@/modules/billing/application/x';", filename: inTree('modules/rich/actions.ts') },
  ],
  invalid: [
    { code: "import { payOrder } from './application/pay-order';", filename: inTree('modules/rich/actions.ts'), errors: [{ messageId: 'viaCommands' }] },
    { code: "import { orderRepository } from './infra/order.repository';", filename: inTree('modules/rich/actions.ts'), errors: [{ messageId: 'viaCommands' }] },
    { code: "import { payOrder } from '@/modules/rich/application/pay-order';", filename: inTree('modules/rich/actions.ts'), errors: [{ messageId: 'viaCommands' }] },
    { code: "import { type PayOrderDeps, payOrder } from './application/pay-order';", filename: inTree('modules/rich/actions.ts'), errors: [{ messageId: 'viaCommands' }] },
  ],
});
