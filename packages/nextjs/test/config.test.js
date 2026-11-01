import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import plugin, { createConfig, RULE_GROUPS } from '../eslint/index.js';

describe('createConfig', () => {
  it('builds without an ARCHITECTURE.md', () => {
    const config = createConfig({ architecture: false });
    assert.ok(Array.isArray(config) && config.length >= 3);
    assert.equal(config[0].plugins.nextjs, plugin);
    assert.equal(config[0].rules['boundaries/no-unknown-files'], 'error');
  });

  it('prefixes every element pattern with the app root', () => {
    const [base] = createConfig({ architecture: false, appRoot: 'src' });
    for (const e of base.settings['boundaries/elements']) for (const pat of [e.pattern].flat()) assert.ok(pat.startsWith('src/'), pat);
    assert.ok(base.settings['boundaries/ignore'].includes('src/tests/**'));
  });

  it('adds the legacy element and exemptions from options', () => {
    const config = createConfig({ architecture: false, appRoot: 'src', legacy: ['lib/server/**'] });
    const legacy = config.find((c) => c.name === 'conventions/nextjs/legacy');
    assert.deepEqual(legacy.files, ['src/lib/server/**']);
    assert.equal(legacy.rules['nx-ts/naming-convention'], 'off');
    assert.equal(config[0].settings['boundaries/elements'][0].type, 'legacy');
  });

  it('switches off the rules of rulesets a project has not adopted', () => {
    const config = createConfig({ architecture: false, rulesets: ['layers'] });
    const off = config.find((c) => c.name === 'conventions/nextjs/rulesets-off');
    assert.equal(off.rules['nx-ts/naming-convention'], 'off');
    assert.equal(off.rules['boundaries/element-types'], undefined);
    assert.ok(Object.values(RULE_GROUPS).includes('layers'));
  });
});
