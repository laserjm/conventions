import { rules } from './rules.js';
import { createConfig as build, RULE_GROUPS, LEGACY_EXEMPT } from './config.js';

export { rules, RULE_GROUPS, LEGACY_EXEMPT };

const plugin = {
  meta: { name: '@conventions/nextjs', version: '0.2.3' },
  rules,
  configs: {},
};

/**
 * The full `nextjs` profile config. Reads the project's ARCHITECTURE.md header (app root, legacy
 * folders, rulesets) unless `architecture: false`; explicit options win over the header.
 * @param {import('./config.js').Options} [options]
 */
export function createConfig(options = {}) {
  return build(plugin, options);
}

plugin.createConfig = createConfig;
export default plugin;
