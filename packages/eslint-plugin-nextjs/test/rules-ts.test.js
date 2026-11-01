// Custom rules that need the TypeScript parser.
import { after, describe, it } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { RuleTester } from 'eslint';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
import tsParser from '@typescript-eslint/parser';
import { rules } from '../src/rules.js';

const tester = new RuleTester({ languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' } });
const at = (p) => `/repo/${p}`;

tester.run('tag-matches-type-name', rules['tag-matches-type-name'], {
  valid: [
    { code: "export type OrderAlreadyPaid = { readonly _tag: 'OrderAlreadyPaid'; orderId: string };" },
    { code: 'export type Plain = { id: string };' },
    { code: "export type OrderError = OrderAlreadyPaid | { _tag: 'InsufficientStock' };" }, // unions are not checked
  ],
  invalid: [
    { code: "export type OrderAlreadyPaid = { _tag: 'PayOrderFailed' };", errors: [{ messageId: 'mismatch' }] },
  ],
});

tester.run('no-server-exports-from-index (type re-exports)', rules['no-server-exports-from-index'], {
  valid: [{ code: "export type { Order } from './domain/order';", filename: at('modules/orders/index.ts') }],
  invalid: [{ code: "export type { OrderRow } from './infra/order.mapper';", filename: at('modules/orders/index.ts'), errors: [{ messageId: 'infra' }] }],
});

tester.run('use-case-export-name (type exports ignored)', rules['use-case-export-name'], {
  valid: [
    { code: 'export type PayOrderInput = { id: string }; export type PayOrderDeps = {}; export async function payOrder(input: PayOrderInput, deps: PayOrderDeps) {}', filename: at('modules/orders/application/pay-order.ts') },
  ],
  invalid: [],
});

tester.run('action-suffix (type exports ignored)', rules['action-suffix'], {
  valid: [
    { code: 'export type PayOrderResult = {}; export const payOrderAction = 1;', filename: at('modules/orders/actions.ts') },
    { code: "export type { PayOrderResult } from './actions'; export { payOrderAction } from './actions';", filename: at('modules/orders/index.ts') },
  ],
  invalid: [],
});

const tree = mkdtempSync(path.join(tmpdir(), 'conventions-ts-'));
mkdirSync(path.join(tree, 'modules/orders'), { recursive: true });
writeFileSync(path.join(tree, 'modules/orders/commands.ts'), "import 'server-only';\n");
after(() => rmSync(tree, { recursive: true, force: true }));

tester.run('actions-use-commands (type imports allowed)', rules['actions-use-commands'], {
  valid: [
    { code: "import type { OrderEvent } from './application/ports'; import { type PayOrderDeps } from './application/pay-order';", filename: path.join(tree, 'modules/orders/actions.ts') },
  ],
  invalid: [
    { code: "import { type PayOrderDeps, payOrder } from './application/pay-order';", filename: path.join(tree, 'modules/orders/actions.ts'), errors: [{ messageId: 'viaCommands' }] },
  ],
});
