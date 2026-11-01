// Flat config for the `nextjs` profile. Every rule entry names the convention ID it enforces.
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';
import checkFile from 'eslint-plugin-check-file';
import importX from 'eslint-plugin-import-x';

const TEST_GLOBS = ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/__fakes__/**', 'tests/**'];

/**
 * @param {object} [options]
 * @param {string} [options.appRoot='.']   folder that holds app/, modules/, lib/ (e.g. 'src' or 'apps/web')
 * @param {string[]} [options.legacy=[]]   globs of pre-module code (NX-LAYER-10), relative to appRoot
 * @param {string} [options.tsconfig='./tsconfig.json']
 * @param {string[]} [options.extraServerOnly=[]]  extra packages banned from domain/application
 */
export function createConfig(options = {}) {
  const { appRoot = '.', legacy = [], tsconfig = './tsconfig.json', extraServerOnly = [] } = options;
  const root = appRoot === '.' ? '' : appRoot.replace(/\/$/, '') + '/';
  const p = (glob) => root + glob;
  const same = (type) => [type, { module: '${from.module}' }];
  const other = (type) => [type, { module: '!${from.module}' }];

  const elements = [
    { type: 'domain', pattern: p('modules/*/domain'), capture: ['module'] },
    { type: 'application', pattern: p('modules/*/application'), capture: ['module'] },
    { type: 'infra', pattern: p('modules/*/infra'), capture: ['module'] },
    { type: 'contracts', pattern: p('modules/*/contracts.ts'), capture: ['module'], mode: 'file' },
    { type: 'module-index', pattern: p('modules/*/index.ts'), capture: ['module'], mode: 'file' },
    { type: 'module-server', pattern: p('modules/*/server.ts'), capture: ['module'], mode: 'file' },
    { type: 'ui', pattern: [p('modules/*/actions.ts'), p('modules/*/queries.ts')], capture: ['module'], mode: 'file' },
    { type: 'ui', pattern: p('modules/*/components'), capture: ['module'] },
    { type: 'module-other', pattern: p('modules/*'), capture: ['module'] }, // any other file in a module is a mistake
    { type: 'lib-core', pattern: [p('lib/result.ts'), p('lib/errors.ts')], mode: 'file' },
    { type: 'lib-db', pattern: p('lib/db') },
    { type: 'lib', pattern: p('lib') },
    { type: 'ui-primitives', pattern: p('components/ui') },
    { type: 'app', pattern: p('app') },
  ];
  if (legacy.length) elements.unshift({ type: 'legacy', pattern: legacy.map(p) });

  const FRAMEWORK = ['react', 'react-dom', 'next', 'next/*', 'server-only', 'client-only'];
  const ORM = ['drizzle-orm', 'drizzle-orm/*', 'postgres', 'pg'];
  const PLATFORM = ['@supabase/*'];
  const SCHEMA = ['zod'];
  const ACTION_CLIENT = ['next-safe-action', 'next-safe-action/*'];

  const elementTypes = {
    default: 'disallow',
    message: 'NX-LAYER-01: ${file.type} may not import ${dependency.type} (${dependency.source}). See docs/nextjs/architecture.md#layer-rules',
    rules: [
      { from: 'domain', allow: [same('domain'), 'lib-core'] },
      { from: 'application', allow: [same('application'), same('domain'), 'lib-core'] },
      { from: 'application', allow: [same('contracts')], importKind: 'type' },
      { from: 'infra', allow: [same('infra'), same('application'), same('domain'), same('contracts'), 'lib-core', 'lib-db', 'lib'] },
      { from: 'contracts', allow: [same('domain'), 'lib-core', 'lib'] },
      { from: 'ui', allow: [same('ui'), same('application'), same('infra'), same('contracts'), same('domain'), 'lib-core', 'lib', 'ui-primitives', other('module-index'), other('module-server')] },
      { from: 'module-index', allow: [same('domain'), same('application'), same('contracts'), same('ui'), 'lib-core'] },
      { from: 'module-server', allow: [same('domain'), same('application'), same('contracts'), same('ui'), same('module-index'), 'lib-core'] },
      { from: 'app', allow: ['app', 'module-index', 'module-server', 'ui-primitives', 'lib', 'lib-core'] },
      { from: 'lib-core', allow: ['lib-core'] },
      { from: 'lib-db', allow: ['lib-db', 'lib-core', 'lib'] },
      { from: 'lib', allow: ['lib', 'lib-core', 'lib-db'] },
      { from: 'ui-primitives', allow: ['ui-primitives', 'lib', 'lib-core'] },
      { from: 'legacy', allow: ['legacy', 'app', 'lib', 'lib-core', 'lib-db', 'ui-primitives', 'module-index', 'module-server'] },
    ],
  };

  const external = {
    default: 'allow',
    message: 'NX-LAYER-02: ${file.type} may not import ${dependency.source}. See docs/nextjs/architecture.md#layer-rules',
    rules: [
      { from: 'domain', disallow: [...FRAMEWORK, ...ORM, ...PLATFORM, ...SCHEMA, ...ACTION_CLIENT, ...extraServerOnly] },
      { from: 'application', disallow: [...FRAMEWORK, ...ORM, ...PLATFORM, ...ACTION_CLIENT, ...extraServerOnly] },
      { from: 'application', disallow: SCHEMA, importKind: 'value' },
      // NX-LAYER-03 / NX-DRZ-01: only infra and lib/db touch the ORM
      { from: ['ui', 'app', 'contracts', 'module-index', 'module-server', 'lib', 'ui-primitives'], disallow: ORM },
      // NX-CACHE-01 / NX-CACHE-04: caching only in queries.ts, revalidation only in actions.ts
      { from: ['infra', 'contracts', 'module-index', 'ui-primitives', 'lib'], disallow: ['next/cache'] },
      { from: 'app', disallow: ['next/cache'] },
      // NX-NSA-05: action client only in lib/safe-action.ts and actions.ts (ui) — components use /hooks
      { from: ['app', 'infra', 'contracts', 'module-index', 'module-server', 'ui-primitives'], disallow: ACTION_CLIENT },
      // NX-SB-08: platform client only in lib (auth/storage) and infra
      { from: ['app', 'ui', 'contracts', 'module-index', 'module-server', 'ui-primitives'], disallow: PLATFORM },
    ],
  };

  const namingConvention = [
    'error',
    { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow', trailingUnderscore: 'forbid' },
    { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
    { selector: 'function', format: ['camelCase', 'PascalCase'] },
    { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
    { selector: 'import', format: ['camelCase', 'PascalCase'] },
    { selector: 'typeLike', format: ['PascalCase'] },
    { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: false } }, // NX-NAME-02
    { selector: 'enumMember', format: ['PascalCase'] },
    { selector: ['objectLiteralProperty', 'typeProperty', 'objectLiteralMethod', 'typeMethod', 'classProperty'], format: null },
  ];

  return [
    // ---- base: parser, plugins, resolver -------------------------------------------------
    {
      name: 'conventions/nextjs/base',
      files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
      languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } },
      plugins: { '@typescript-eslint': tsPlugin, boundaries, 'check-file': checkFile, 'import-x': importX },
      settings: {
        'import/resolver': { typescript: { alwaysTryTypes: true, project: tsconfig } },
        'import-x/resolver': { typescript: { alwaysTryTypes: true, project: tsconfig } },
        'boundaries/elements': elements,
        'boundaries/ignore': TEST_GLOBS, // NX-STR-06 / NX-TEST-07
        'boundaries/dependency-nodes': ['import', 'export', 'dynamic-import'],
      },
      rules: {
        'boundaries/element-types': ['error', elementTypes], // NX-LAYER-01, -03, -04, -10
        'boundaries/external': ['error', external], // NX-LAYER-02, NX-CACHE-01/04, NX-DRZ-01, NX-NSA-05, NX-SB-08
        'boundaries/no-unknown-files': 'off',
        'import-x/no-cycle': ['error', { ignoreExternal: true, maxDepth: 6 }], // NX-LAYER-09
        '@typescript-eslint/naming-convention': namingConvention, // NX-NAME-02
        '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }], // NX-TYPE-02
        'check-file/filename-naming-convention': ['error', { '**/*.{ts,tsx}': 'KEBAB_CASE' }, { ignoreMiddleExtensions: true }], // NX-NAME-01
        'check-file/folder-naming-convention': ['error', { [p('app/**/')]: 'NEXT_JS_APP_ROUTER_CASE', [p('modules/*/')]: 'KEBAB_CASE', [p('lib/**/')]: 'KEBAB_CASE' }], // NX-NAME-01, NX-NAME-11
        'no-restricted-syntax': [
          'error',
          { selector: 'MemberExpression[object.name="process"][property.name="env"]', message: 'NX-ZOD-05: read env through lib/env.ts (lib/db/client.ts excepted).' },
        ],
      },
    },
    // ---- module file layout (NX-STR-02): nothing else at a module root ---------------------
    {
      name: 'conventions/nextjs/module-layout',
      files: [p('modules/*/*.ts'), p('modules/*/*.tsx')],
      ignores: [p('modules/*/{actions,queries,contracts,index,server}.ts'), p('modules/*/MIGRATING.md')],
      rules: {
        'check-file/filename-naming-convention': ['error', { [p('modules/*/*.{ts,tsx}')]: '@(actions|queries|contracts|index|server)' }, { errorMessage: 'NX-STR-02: a module root holds only actions.ts, queries.ts, contracts.ts, index.ts, server.ts (and the layer folders).' }],
      },
    },
    // ---- domain + application: no throw, no vendor (NX-LAYER-08) ---------------------------
    {
      name: 'conventions/nextjs/pure-layers',
      files: [p('modules/*/domain/**/*.ts'), p('modules/*/application/**/*.ts')],
      ignores: TEST_GLOBS,
      rules: {
        'no-restricted-syntax': [
          'error',
          { selector: 'ThrowStatement', message: 'NX-LAYER-08: return err(...) — throwing is reserved for bugs and never crosses a layer.' },
          { selector: 'MemberExpression[object.name="process"][property.name="env"]', message: 'NX-ZOD-05: read env through lib/env.ts.' },
        ],
      },
    },
    // ---- mappers and lib/db may cast (NX-TYPE-02) ------------------------------------------
    {
      name: 'conventions/nextjs/mappers',
      files: ['**/*.mapper.ts', p('lib/db/**/*.ts'), p('modules/*/domain/*-id.ts')], // brand constructors may cast
      rules: { '@typescript-eslint/consistent-type-assertions': 'off' },
    },
    // ---- env readers (NX-TYPE-06, NX-ZOD-05) ------------------------------------------------
    {
      name: 'conventions/nextjs/env-readers',
      files: [p('lib/env.ts'), p('lib/db/client.ts')],
      rules: { 'no-restricted-syntax': 'off' },
    },
    // ---- tests: exempt from layer rules, not from naming (NX-TEST-07) ---------------------
    {
      name: 'conventions/nextjs/tests',
      files: TEST_GLOBS,
      rules: {
        'boundaries/element-types': 'off',
        'boundaries/external': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
        'no-restricted-syntax': 'off',
      },
    },
  ];
}
