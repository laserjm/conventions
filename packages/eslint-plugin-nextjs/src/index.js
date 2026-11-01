import { rules } from './rules.js';
import { createConfig as createBaseConfig } from './config.js';

export { rules };

/** Rules that do not apply to `legacy` code; everything else, the layer rules above all, does. */
const LEGACY_EXEMPT = [
  '@typescript-eslint/naming-convention',
  '@typescript-eslint/consistent-type-assertions',
  'no-restricted-syntax',
  'check-file/filename-naming-convention',
  'check-file/folder-naming-convention',
  'nextjs/action-suffix',
  'nextjs/schema-suffix',
  'nextjs/use-case-export-name',
  'nextjs/tag-matches-type-name',
  'nextjs/no-inline-cache-tags',
];

const plugin = {
  meta: { name: '@conventions/eslint-plugin-nextjs', version: '0.1.2' },
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
        'nextjs/actions-use-commands': 'error',
      },
    },
    {
      name: 'conventions/nextjs/custom-rules/tests',
      files: ['**/*.test.ts', '**/*.spec.ts', '**/__fakes__/**', `${root}tests/**`],
      rules: { 'nextjs/use-case-export-name': 'off', 'nextjs/action-suffix': 'off' },
    },
    // Legacy code keeps its shape until its module migrates (NX-LAYER-10): only the layer rules
    // apply to it. Naming, cast and env rules start when its folder leaves the list.
    ...(options.legacy?.length
      ? [
          {
            name: 'conventions/nextjs/legacy',
            files: options.legacy.map((glob) => root + glob),
            rules: Object.fromEntries(LEGACY_EXEMPT.map((rule) => [rule, 'off'])),
          },
        ]
      : []),
  ];
}

plugin.configs.nextjs = createConfig();
plugin.createConfig = createConfig;

export default plugin;
