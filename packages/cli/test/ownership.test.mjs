import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ownership } from '../src/checks/ownership.mjs';
import { header } from '../src/checks/header.mjs';
import { applyPolicy } from '../src/policy.mjs';
import { parseHeader } from '../src/architecture.mjs';

const manifest = JSON.parse(readFileSync(path.join(import.meta.dirname, '../../nextjs/profile.json'), 'utf8'));
const rules = [
  { id: 'NX-AUTH-03', group: 'auth', severity: 'error', isolation: ['tenant', 'owner'] },
  { id: 'NX-AUTH-05', group: 'auth', severity: 'error', isolation: ['tenant', 'owner'] },
  { id: 'NX-AUTH-06', group: 'auth', severity: 'error' },
  { id: 'NX-MIG-04', group: 'migration', severity: 'error' },
];

/** A project with the given files (path → content) under modules/. */
function project(isolation, tree) {
  const appRoot = mkdtempSync(path.join(tmpdir(), 'conventions-ownership-'));
  for (const [file, content] of Object.entries(tree)) {
    const full = path.join(appRoot, 'modules', file);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return { appRoot, header: { isolation }, manifest, catalogue: { rules }, profile: 'nextjs', pkg: { name: '@conventions/nextjs', version: '0.3.0' } };
}

const ownerTree = {
  'screens/application/ports.ts': 'export type ScreenRepository = {\n  findById(ownerId: string, id: string): Promise<Screen | null>;\n};\n',
  'screens/infra/screen.repository.ts': 'export const screenRepository = { async findById(ownerId: OwnerId, id: string) { return null; } };\n',
  'screens/infra/screen.repository.integration.test.ts': 'describeIntegration("screenRepository", () => {});\n',
  'filters/infra/field.repository.ts': 'export const fieldRepository = { async list() { return []; } };\n',
  'filters/infra/field.repository.integration.test.ts': 'describeIntegration("fieldRepository", () => {});\n',
};
const ids = (findings) => findings.map((f) => `${f.id} ${f.file}${f.line ? ':' + f.line : ''}`).sort();

describe('ownership under isolation: owner', () => {
  it('reports an ownerId typed string, and an owned repository without assertIsolation()', async () => {
    assert.deepEqual(ids(await ownership(project('owner', ownerTree))), [
      'NX-AUTH-03 modules/screens/infra/screen.repository.integration.test.ts',
      'NX-AUTH-05 modules/screens/application/ports.ts:2',
    ]);
  });
  it('is satisfied by OwnerId and the helper; shared data needs neither', async () => {
    const tree = {
      ...ownerTree,
      'screens/application/ports.ts': 'findById(ownerId: OwnerId, id: string): Promise<Screen | null>;\n',
      'screens/infra/screen.repository.integration.test.ts': 'describeIntegration("screenRepository", () => { assertIsolation({}); });\n',
    };
    assert.deepEqual(ids(await ownership(project('owner', tree))), []);
  });
  it('does not ask for tenantId', async () => {
    const tree = { 'orders/application/ports.ts': 'findById(tenantId: string, id: string): Promise<Order | null>;\n' };
    assert.deepEqual(ids(await ownership(project('owner', tree))), []);
  });
});

describe('ownership with a command test', () => {
  const tree = {
    'threads/application/ports.ts': 'findById(ownerId: OwnerId, id: ThreadId): Promise<Thread | null>;\n',
    'threads/infra/thread.repository.ts': 'export const threadRepository = { async findById(ownerId: OwnerId, id: ThreadId) { return null; } };\n',
    'threads/infra/message.repository.ts': 'export const messageRepository = { async list(ownerId: OwnerId) { return []; } };\n',
    'threads/commands.ts': "import { threadRepository } from './infra/thread.repository';\n",
    'threads/queries.ts': "import { messageRepository } from './infra/message.repository';\n",
    'threads/commands.integration.test.ts': 'describeIntegration("threads commands", () => { startThread(alice, {}); });\n',
  };
  it('reports an owned repository it covers when it does not call assertIsolation()', async () => {
    const found = await ownership(project('owner', tree));
    assert.deepEqual(ids(found), ['NX-AUTH-03 modules/threads/commands.integration.test.ts']);
    assert.match(found[0].message, /must call assertIsolation\(\).*covers thread\.repository\.ts.*own thread\.repository\.integration\.test\.ts/);
  });
  it('is satisfied when it calls assertIsolation(); a repository only queries.ts reaches is left to NX-TEST-02', async () => {
    const t = { ...tree, 'threads/commands.integration.test.ts': 'describeIntegration("threads commands", () => { assertIsolation({ ownerA, ownerB, arrange, read, change }); });\n' };
    assert.deepEqual(ids(await ownership(project('owner', t))), []);
  });
  it('checks the repository\'s own test when it has one', async () => {
    const t = { ...tree, 'threads/infra/thread.repository.integration.test.ts': 'describeIntegration("threadRepository", () => {});\n' };
    assert.deepEqual(ids(await ownership(project('owner', t))), ['NX-AUTH-03 modules/threads/infra/thread.repository.integration.test.ts']);
  });
});

describe('ownership under isolation: tenant', () => {
  it('reports tenantId typed string and a repository that takes a TenantId without the helper', async () => {
    const tree = {
      'orders/application/ports.ts': 'findById(tenantId: string, id: string): Promise<Order | null>;\n',
      'orders/infra/order.repository.ts': 'async lock(t: TenantId, id: string) {}\n',
      'orders/infra/order.repository.integration.test.ts': '',
    };
    assert.deepEqual(ids(await ownership(project('tenant', tree))), [
      'NX-AUTH-03 modules/orders/infra/order.repository.integration.test.ts',
      'NX-AUTH-05 modules/orders/application/ports.ts:1',
    ]);
  });
});

describe('ownership under isolation: none', () => {
  it('reports nothing', async () => {
    assert.deepEqual(await ownership(project('none', ownerTree)), []);
  });
  it('drops ownership findings of other tools, keeps the rest', () => {
    const p = project('none', {});
    const kept = applyPolicy({ ...p, deviations: [] }, [
      { id: 'NX-AUTH-03', severity: 'error', message: '' },
      { id: 'NX-AUTH-06', severity: 'error', message: '' },
    ]);
    assert.deepEqual(kept.map((f) => f.id), ['NX-AUTH-06']);
  });
});

describe('the isolation header key', () => {
  it('is parsed', () => {
    assert.equal(parseHeader('```yaml\nconventions: 0.3.0\nprofile: nextjs\nisolation: owner\n```\n').isolation, 'owner');
  });
  it('is required, and must be a known value', async () => {
    const base = { conventions: '0.3.0', profile: 'nextjs', bindings: [] };
    const run = async (isolation) => (await header({ ...project(isolation, {}), header: { ...base, isolation } })).map((f) => f.message);
    assert.match((await run(undefined)).join(), /no `isolation:`/);
    assert.match((await run('tenants')).join(), /unknown isolation 'tenants'/);
    assert.deepEqual(await run('owner'), []);
  });
});
