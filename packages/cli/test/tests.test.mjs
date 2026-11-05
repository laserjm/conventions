import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { tests } from '../src/checks/tests.mjs';

const manifest = JSON.parse(readFileSync(path.join(import.meta.dirname, '../../nextjs/profile.json'), 'utf8'));
const rules = [
  { id: 'NX-TEST-01', group: 'testing', severity: 'error' },
  { id: 'NX-TEST-02', group: 'testing', severity: 'error' },
];

/** A project with the given files (path → content) under modules/. */
function project(tree) {
  const appRoot = mkdtempSync(path.join(tmpdir(), 'conventions-tests-'));
  for (const [file, content] of Object.entries(tree)) {
    const full = path.join(appRoot, 'modules', file);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return { appRoot, header: { isolation: 'owner' }, manifest, catalogue: { rules } };
}

const ids = (findings) => findings.map((f) => `${f.id} ${f.file}`).sort();

/** A module with two thin write use cases over one repository, and a read-only repository. */
const threads = {
  'threads/application/ports.ts': '',
  'threads/application/start-thread.ts': 'export const startThread = defineUseCase(async () => {});\n',
  'threads/application/rename-thread.ts': 'export const renameThread = defineUseCase(async () => {});\n',
  'threads/infra/thread.repository.ts': 'export const threadRepository = {};\n',
  'threads/infra/message.repository.ts': 'export const messageRepository = {};\n',
  'threads/commands.ts': [
    "import 'server-only';",
    "import { threadRepository } from './infra/thread.repository';",
    "import { startThread as run } from './application/start-thread';",
    "import { renameThread as rename } from './application/rename-thread';",
    '',
  ].join('\n'),
  'threads/queries.ts': "import { messageRepository } from '@/modules/threads/infra/message.repository';\n",
};

describe('tests without a command test', () => {
  it('asks for a unit test per use case and an integration test per repository', async () => {
    assert.deepEqual(ids(await tests(project(threads))), [
      'NX-TEST-01 modules/threads/application/rename-thread.ts',
      'NX-TEST-01 modules/threads/application/start-thread.ts',
      'NX-TEST-02 modules/threads/infra/message.repository.ts',
      'NX-TEST-02 modules/threads/infra/thread.repository.ts',
    ]);
  });
  it('names both ways to satisfy each rule', async () => {
    const messages = (await tests(project(threads))).map((f) => f.message);
    assert.ok(messages.includes("use case start-thread.ts has neither start-thread.test.ts next to it nor a call to startThread in the module's commands.integration.test.ts"));
    assert.ok(messages.includes('repository thread.repository.ts has no thread.repository.integration.test.ts, and the module has no commands.integration.test.ts (which covers a repository commands.ts imports)'));
  });
});

describe('the command test, commands.integration.test.ts', () => {
  const tree = {
    ...threads,
    'threads/commands.integration.test.ts': 'describeIntegration("threads commands", () => { it("starts", () => startThread(alice, {})); });\n',
  };
  it('covers a use case it calls by its export name, not one it does not name', async () => {
    const found = (await tests(project(tree))).filter((f) => f.id === 'NX-TEST-01');
    assert.deepEqual(ids(found), ['NX-TEST-01 modules/threads/application/rename-thread.ts']);
  });
  it('does not take a longer name for the use case', async () => {
    const t = { ...tree, 'threads/commands.integration.test.ts': 'startThreadLater(alice, {});\n' };
    assert.equal((await tests(project(t))).filter((f) => f.id === 'NX-TEST-01').length, 2);
  });
  it('covers a repository commands.ts imports, not one only queries.ts reaches', async () => {
    const found = (await tests(project(tree))).filter((f) => f.id === 'NX-TEST-02');
    assert.deepEqual(ids(found), ['NX-TEST-02 modules/threads/infra/message.repository.ts']);
    assert.equal(found[0].message, "repository message.repository.ts has no message.repository.integration.test.ts; the module's commands.integration.test.ts covers it only once commands.ts imports it");
  });
  it('leaves a module whose tests sit next to each file as it was', async () => {
    const t = {
      ...tree,
      'threads/application/rename-thread.test.ts': '',
      'threads/infra/message.repository.integration.test.ts': '',
    };
    assert.deepEqual(ids(await tests(project(t))), []);
  });
  it('covers nothing without commands.ts', async () => {
    const t = { ...tree };
    delete t['threads/commands.ts'];
    assert.equal((await tests(project(t))).filter((f) => f.id === 'NX-TEST-02').length, 2);
  });
});
