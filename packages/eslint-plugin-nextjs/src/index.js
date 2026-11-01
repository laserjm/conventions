import { rules } from './rules.js';
import { createConfig as createBaseConfig } from './config.js';

export { rules };

const plugin = {
  meta: { name: '@conventions/eslint-plugin-nextjs', version: '0.1.0' },
  rules,
  configs: {},
};

/**
 * Build the full `nextjs` profile config.
 * @param {Parameters<typeof createBaseConfig>[0]} [options]
 */
export function createConfig(options = {}) {
  const root = options.appRoot && options.appRoot !== '.' ? options.appRoot.replace(/\/$/, '') + '/' : '';
  return [
    ...createBaseConfig(options),
    {
      name: 'conventions/nextjs/custom-rules',
      files: ['**/*.ts', '**/*.tsx'],
      plugins: { nextjs: plugin },
      rules: {
        'nextjs/action-suffix': 'error',
        'nextjs/use-case-export-name': 'error',
        'nextjs/no-inline-cache-tags': 'error',
        'nextjs/tag-matches-type-name': 'error',
        'nextjs/no-server-exports-from-index': 'error',
        'nextjs/schema-suffix': 'error',
        'nextjs/require-server-only': 'error',
      },
    },
    {
      name: 'conventions/nextjs/custom-rules/tests',
      files: ['**/*.test.ts', '**/*.spec.ts', '**/__fakes__/**', `${root}tests/**`],
      rules: { 'nextjs/use-case-export-name': 'off', 'nextjs/action-suffix': 'off' },
    },
  ];
}

plugin.configs.nextjs = createConfig();
plugin.createConfig = createConfig;

export default plugin;
