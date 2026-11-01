import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { globToRegex, matchesAny, applyPolicy } from '../src/policy.mjs';
import { parseTables, parseHeader } from '../src/architecture.mjs';

describe('globToRegex', () => {
  it('handles **, *, braces and extglob negation', () => {
    assert.ok(matchesAny('lib/server/a/b.ts', ['lib/server/**']));
    assert.ok(!matchesAny('lib/servers/b.ts', ['lib/server/**']));
    assert.ok(matchesAny('modules/filters/domain/predicate.ts', ['modules/filters/domain/{predicate,filters,registry}.ts']));
    assert.ok(!matchesAny('modules/filters/domain/other.ts', ['modules/filters/domain/{predicate,filters,registry}.ts']));
    assert.ok(matchesAny('components/app-shell/x.tsx', ['components/!(ui)/**']));
    assert.ok(!matchesAny('components/ui/button.tsx', ['components/!(ui)/**']));
    assert.ok(matchesAny('lib/return-path.ts', ['lib/return-path.ts']));
  });
});

describe('Deviations rows', () => {
  const md = `## Deviations

| Rule | Deviation | Why | Until |
| --- | --- | --- | --- |
| NX-LAYER-08 | \`throw\` in \`modules/filters/domain/{predicate,filters}.ts\` and \`modules/screens/domain/screen-hash.ts\` | parser | step 7 |
| NX-DB-02 | the inventory has no category column | written before | next change |

## Legacy

| Folder | Replaced by module | Status |
| --- | --- | --- |
| \`components/\` except \`ui/\` | the modules' \`components/\` | migrating |
`;
  const { deviations, legacy } = parseTables(md);
  it('extracts path tokens and ignores words in backticks', () => {
    assert.deepEqual(deviations[0].paths, ['modules/filters/domain/{predicate,filters}.ts', 'modules/screens/domain/screen-hash.ts']);
    assert.deepEqual(deviations[1].paths, []);
  });
  it('reads the legacy folder from the first backticked token', () => {
    assert.equal(legacy[0].folder, 'components/');
  });
  it('turns matching findings into warnings', () => {
    const project = { catalogue: { rules: [{ id: 'NX-LAYER-08', group: 'layers' }, { id: 'NX-DB-02', group: 'database' }] }, manifest: {}, header: parseHeader('```yaml\nconventions: 0.2.1\nprofile: nextjs\n```'), deviations };
    const out = applyPolicy(project, [
      { id: 'NX-LAYER-08', file: 'modules/filters/domain/predicate.ts', severity: 'error' },
      { id: 'NX-LAYER-08', file: 'modules/filters/domain/other.ts', severity: 'error' },
      { id: 'NX-DB-02', file: 'supabase/migrations/1.sql', severity: 'error' },
    ]);
    assert.deepEqual(out.map((f) => f.severity), ['warn', 'error', 'warn']);
  });
});

describe('header paths', () => {
  it('reads migrations and inventory', () => {
    const h = parseHeader('```yaml\nconventions: 0.2.1\nprofile: nextjs\nmigrations: ../../supabase/migrations/*.sql\ninventory: ../../docs/architecture/rpc-inventory.md\n```');
    assert.equal(h.migrations, '../../supabase/migrations/*.sql');
    assert.equal(h.inventory, '../../docs/architecture/rpc-inventory.md');
  });
});
