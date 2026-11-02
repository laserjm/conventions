import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { modules } from '../src/checks/modules.mjs';

/** A project with the given files under modules/<name>/, enough for the module checks. */
function project(tree) {
  const appRoot = mkdtempSync(path.join(tmpdir(), 'conventions-modules-'));
  for (const file of tree) {
    const full = path.join(appRoot, 'modules', file);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, '');
  }
  return {
    appRoot,
    header: {},
    catalogue: { rules: [{ id: 'NX-RICH-01', group: 'rich', severity: 'error' }] },
    manifest: { modules: 'modules/*', module: { required: ['index.ts', 'server.ts'], bannedNames: [] } },
  };
}

const rich01 = async (tree) => (await modules(project(tree))).filter((f) => f.id === 'NX-RICH-01').map((f) => f.file);

describe('NX-RICH-01 module shapes', () => {
  it('accepts a read-only domain module: domain/ without application/, actions.ts or commands.ts', async () => {
    assert.deepEqual(await rich01(['filters/index.ts', 'filters/server.ts', 'filters/queries.ts', 'filters/domain/predicate.ts', 'filters/infra/field.repository.ts']), []);
  });
  it('accepts an anemic module whose commands.ts other modules call', async () => {
    assert.deepEqual(await rich01(['accounts/index.ts', 'accounts/server.ts', 'accounts/actions.ts', 'accounts/commands.ts', 'accounts/infra/account.repository.ts']), []);
  });
  it('reports a module with domain/ and writes but no application/', async () => {
    assert.deepEqual(await rich01(['orders/index.ts', 'orders/server.ts', 'orders/actions.ts', 'orders/domain/order.ts']), ['modules/orders']);
    assert.deepEqual(await rich01(['orders/index.ts', 'orders/server.ts', 'orders/commands.ts', 'orders/domain/order.ts']), ['modules/orders']);
  });
  it('accepts a rich module', async () => {
    assert.deepEqual(await rich01(['orders/index.ts', 'orders/server.ts', 'orders/actions.ts', 'orders/commands.ts', 'orders/domain/order.ts', 'orders/application/pay-order.ts']), []);
  });
});
