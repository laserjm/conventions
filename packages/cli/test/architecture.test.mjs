import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseHeader, parseTables, withConventionsVersion } from '../src/architecture.mjs';

const md = `# Architecture

\`\`\`yaml
conventions: 0.2.0
profile: nextjs
bindings: [drizzle, supabase]
app-root: src
rulesets: [layers, naming]
legacy: [lib/server/**, 'components/!(ui)/**']
\`\`\`

## Deviations

| Rule | Deviation | Why | Until |
| --- | --- | --- | --- |
| NX-NAME-02 | snake_case in lib/legacy | generated | 1.0 |

## Legacy

| Folder | Replaced by module | Status |
| --- | --- | --- |
| \`lib/server/\` | modules/orders | migrating |
`;

describe('architecture header', () => {
  it('parses the yaml header', () => {
    const h = parseHeader(md);
    assert.equal(h.conventions, '0.2.0');
    assert.equal(h.profile, 'nextjs');
    assert.deepEqual(h.bindings, ['drizzle', 'supabase']);
    assert.equal(h.appRoot, 'src');
    assert.deepEqual(h.rulesets, ['layers', 'naming']);
    assert.deepEqual(h.legacy, ['lib/server/**', 'components/!(ui)/**']);
  });
  it('returns undefined without a conventions key', () => {
    assert.equal(parseHeader('# nothing\n```yaml\nfoo: 1\n```'), undefined);
  });
  it('parses the Deviations and Legacy tables', () => {
    const t = parseTables(md);
    assert.deepEqual(t.deviations, [{ rule: 'NX-NAME-02', deviation: 'snake_case in lib/legacy', why: 'generated', until: '1.0' }]);
    assert.deepEqual(t.legacy, [{ folder: 'lib/server/', module: 'modules/orders', status: 'migrating' }]);
  });
  it('bumps only the conventions version', () => {
    const out = withConventionsVersion(md, '0.3.0');
    assert.match(out, /^conventions: 0\.3\.0$/m);
    assert.equal(out.replace('0.3.0', '0.2.0'), md);
  });
});
