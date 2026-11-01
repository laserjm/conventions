// Flat config for the `nextjs` profile. Every rule entry names the convention id it enforces; the
// message of every boundary violation starts with that id.
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';
import importX from 'eslint-plugin-import-x';
import { findArchitecture } from '@conventions/cli/architecture';

/**
 * @typedef {object} Options
 * @property {string} [appRoot]            folder that holds app/, modules/, lib/ ('.' or 'src'); default: ARCHITECTURE.md `app-root`
 * @property {string[]} [legacy]           globs of pre-module code (NX-LAYER-10), relative to appRoot, anchored at it; default: header `legacy`
 * @property {string[]} [rulesets]         rulesets to enable; default: header `rulesets`, else all
 * @property {string} [tsconfig]           default './tsconfig.json'
 * @property {string[]} [extraServerOnly]  extra packages banned from domain/ and application/
 * @property {boolean} [architecture]      false: do not read ARCHITECTURE.md
 * @property {string} [cwd]                where to look for ARCHITECTURE.md; default process.cwd()
 */

// typescript-eslint is registered as `nx-ts`, not `@typescript-eslint`: a framework preset (next/typescript)
// registers its own copy under the standard name, and ESLint refuses two plugins under one name.
/** ESLint rule → ruleset, so `rulesets:` in the header can switch a group off. */
export const RULE_GROUPS = {
  'boundaries/element-types': 'layers',
  'boundaries/external': 'layers',
  'boundaries/no-unknown-files': 'structure',
  'import-x/no-cycle': 'layers',
  'nextjs/actions-use-commands': 'layers',
  'nx-ts/naming-convention': 'naming',
  'nextjs/use-case-export-name': 'naming',
  'nx-ts/consistent-type-assertions': 'types',
  'nextjs/tag-matches-type-name': 'errors',
};

/** Rules legacy code is exempt from (NX-LAYER-10): everything but the layer rules. */
export const LEGACY_EXEMPT = [
  'nx-ts/naming-convention',
  'nx-ts/consistent-type-assertions',
  'nextjs/use-case-export-name',
  'nextjs/tag-matches-type-name',
];

// boundaries matches external selectors by package name; a subpath is `[pkg, { path }]`
const FRAMEWORK = ['react', 'react-dom', 'next', 'server-only', 'client-only'];
const ORM = ['drizzle-orm', 'postgres', 'pg'];
const PLATFORM = ['@supabase/*'];
const SCHEMA = ['zod'];
const ACTION_CLIENT = ['next-safe-action'];
const NEXT_CACHE = ['next', { path: '/cache' }]; // boundaries' internal path keeps the leading slash
const REVALIDATE = ['revalidateTag', 'revalidatePath', 'updateTag', 'unstable_expireTag', 'unstable_expirePath'];
const CACHE = ['unstable_cache', 'cacheTag', 'cacheLife', 'unstable_cacheTag', 'unstable_cacheLife', 'unstable_noStore'];

const MODULE_INTERNAL = ['domain', 'application', 'infra', 'components', 'contracts', 'commands', 'actions', 'queries'];
const MODULE_API = ['module-index', 'module-server'];
const ALL = [...MODULE_INTERNAL, ...MODULE_API, 'lib-core', 'lib-db', 'lib', 'ui-primitives', 'app', 'root', 'tooling', 'legacy'];
const except = (...types) => ALL.filter((t) => !types.includes(t));

/**
 * @param {object} plugin  the nextjs plugin object (registered as `nextjs`)
 * @param {Options} [options]
 */
export function createConfig(plugin, options = {}) {
  const header = options.architecture === false ? undefined : findArchitecture(options.cwd ?? process.cwd())?.header;
  const appRoot = options.appRoot ?? header?.appRoot ?? '.';
  const legacy = options.legacy ?? header?.legacy ?? [];
  const rulesets = options.rulesets ?? header?.rulesets;
  const { tsconfig = './tsconfig.json', extraServerOnly = [] } = options;
  const root = appRoot === '.' ? '' : appRoot.replace(/\/$/, '') + '/';
  const p = (glob) => root + glob;
  const same = (type) => [type, { module: '${from.module}' }];
  const other = (type) => [type, { module: '!${from.module}' }];
  const TEST_GLOBS = ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/__fakes__/**', p('tests/**')];

  const elements = [
    // mode 'full' anchors the globs at the app root, so a module's own components/ is never legacy
    ...(legacy.length ? [{ type: 'legacy', pattern: legacy.map(p), mode: 'full' }] : []),
    { type: 'domain', pattern: p('modules/*/domain'), capture: ['module'] },
    { type: 'application', pattern: p('modules/*/application'), capture: ['module'] },
    { type: 'infra', pattern: p('modules/*/infra'), capture: ['module'] },
    { type: 'components', pattern: p('modules/*/components'), capture: ['module'] },
    { type: 'contracts', pattern: p('modules/*/contracts.ts'), capture: ['module'], mode: 'file' },
    { type: 'module-index', pattern: p('modules/*/index.ts'), capture: ['module'], mode: 'file' },
    { type: 'module-server', pattern: p('modules/*/server.ts'), capture: ['module'], mode: 'file' },
    { type: 'commands', pattern: p('modules/*/commands.ts'), capture: ['module'], mode: 'file' }, // optional (NX-LAYER-11)
    { type: 'actions', pattern: p('modules/*/actions.ts'), capture: ['module'], mode: 'file' },
    { type: 'queries', pattern: p('modules/*/queries.ts'), capture: ['module'], mode: 'file' },
    // copies of the 0.1 helpers; domain/ and application/ may still import them (NX-ERR-03 asks for their removal)
    { type: 'lib-core', pattern: [p('lib/result.ts'), p('lib/errors.ts')], mode: 'file' },
    { type: 'lib-db', pattern: p('lib/db') },
    { type: 'lib', pattern: p('lib') },
    { type: 'ui-primitives', pattern: p('components/ui') },
    { type: 'app', pattern: p('app') },
    { type: 'root', pattern: [p('middleware.ts'), p('proxy.ts'), p('instrumentation.ts'), p('instrumentation-client.ts')], mode: 'full' },
    { type: 'tooling', pattern: [p('*.config.{ts,mts}'), p('scripts/**'), p('supabase/**'), p('drizzle/**'), p('tests/**')], mode: 'full' },
    // anything else — modules/x/helpers.ts, modules/x/hooks/, components/feature.tsx — is unknown and reported (NX-STR-02)
  ];

  const elementTypes = {
    default: 'disallow',
    message: 'NX-LAYER-01: ${file.type} may not import ${dependency.type} (${dependency.source}). See docs/nextjs/architecture.md#layer-rules',
    rules: [
      { from: 'domain', allow: [same('domain'), 'lib-core'] },
      { from: 'application', allow: [same('application'), same('domain'), 'lib-core'] },
      // types from own contracts and from another module's public API (the event a handler receives, NX-XMOD-02)
      { from: 'application', allow: [same('contracts'), other('module-index')], importKind: 'type' },
      { from: 'infra', allow: [same('infra'), same('application'), same('domain'), same('contracts'), 'lib-db', 'lib', 'lib-core', other('module-index')] },
      { from: 'contracts', allow: [same('domain'), 'lib', 'lib-core', other('module-index')] },
      { from: 'actions', allow: [same('commands'), same('application'), same('infra'), same('contracts'), same('domain'), same('queries'), 'lib', 'lib-core', other('module-index'), other('module-server')] },
      { from: 'queries', allow: [same('application'), same('infra'), same('contracts'), same('domain'), 'lib', 'lib-core', other('module-index'), other('module-server')] },
      { from: 'components', allow: [same('components'), same('actions'), same('contracts'), same('domain'), 'lib', 'lib-core', 'ui-primitives', other('module-index')] },
      { from: 'commands', allow: [same('application'), same('infra'), same('contracts'), same('domain'), 'lib', 'lib-core', other('module-index'), other('module-server')] },
      { from: 'module-index', allow: [same('domain'), same('contracts'), same('components'), same('actions'), 'lib-core'] },
      { from: 'module-index', allow: [same('application')], importKind: 'type' }, // use-case types; commands.ts runs it (NX-NAME-12)
      { from: 'module-server', allow: [same('queries'), same('commands'), same('actions'), same('module-index'), same('domain'), same('contracts'), 'lib', 'lib-core'] },
      { from: 'app', allow: ['app', 'module-index', 'module-server', 'ui-primitives', 'lib', 'lib-core'] },
      { from: 'root', allow: ['module-index', 'module-server', 'lib', 'lib-core'] },
      // scripts and configs drive the app from outside: module APIs, lib, and legacy code while it exists
      { from: 'tooling', allow: ['tooling', 'lib', 'lib-core', 'lib-db', 'module-index', 'module-server', 'legacy'] },
      { from: 'lib-core', allow: ['lib-core'] },
      { from: 'lib-db', allow: ['lib-db', 'lib', 'lib-core'] },
      { from: 'lib', allow: ['lib', 'lib-db', 'lib-core'] },
      { from: 'ui-primitives', allow: ['ui-primitives', 'lib', 'lib-core'] },
      { from: 'legacy', allow: ['legacy', 'app', 'root', 'lib', 'lib-core', 'lib-db', 'ui-primitives', 'module-index', 'module-server'] },
      // ---- specific messages; the last matching rule wins, so these come after the allows ----
      { from: [...MODULE_INTERNAL, ...MODULE_API], disallow: MODULE_INTERNAL.map(other), message: 'NX-LAYER-04: another module is reached only through its index.ts or server.ts (${file.type} imported ${dependency.source}).' },
      { from: ['lib', 'lib-core', 'lib-db', 'ui-primitives'], disallow: [...MODULE_INTERNAL, ...MODULE_API], message: 'NX-STR-05: lib/ and components/ui are cross-cutting and import nothing from modules/ (${dependency.source}).' },
      { from: ['app', 'root', 'tooling'], disallow: MODULE_INTERNAL, message: 'NX-STR-03: app/ holds routes only and reaches a module through index.ts or server.ts (${dependency.source}).' },
      { from: 'legacy', disallow: MODULE_INTERNAL, message: 'NX-LAYER-10: legacy code reaches a module only through index.ts or server.ts (${dependency.source}).' },
      { from: 'module-index', disallow: [same('queries'), same('commands'), same('infra')], message: 'NX-LAYER-05: index.ts is browser-safe; export server-only reads and commands from server.ts, never infra/ (${dependency.source}).' },
      { from: 'module-server', disallow: [same('infra')], message: 'NX-LAYER-05: server.ts re-exports queries.ts and commands.ts, never infra/ (${dependency.source}).' },
      { from: 'components', disallow: [same('infra'), same('queries'), same('commands'), same('application')], message: 'NX-LAYER-05: components are browser code: they call actions.ts and get data from the page, never infra/, queries.ts, commands.ts or a use case (${dependency.source}).' },
      { from: except('infra', 'lib-db', 'lib', 'tooling'), disallow: ['lib-db'], message: 'NX-LAYER-03: only infra/ and lib/db import lib/db (${dependency.source}).' },
    ],
  };

  const external = {
    default: 'allow',
    message: 'NX-LAYER-02: ${file.type} may not import ${dependency.source}. See docs/nextjs/architecture.md#layer-rules',
    // the last matching rule wins: the broad layer rules first, the specific ones after them
    rules: [
      { from: 'domain', disallow: [...FRAMEWORK, ...PLATFORM, ...SCHEMA, ...ACTION_CLIENT, ...extraServerOnly], message: 'NX-LAYER-02: domain/ imports no framework or vendor package (${dependency.source}); it is plain TypeScript.' },
      { from: 'application', disallow: [...FRAMEWORK, ...PLATFORM, ...ACTION_CLIENT, ...extraServerOnly], message: 'NX-LAYER-02: application/ imports no framework or vendor package (${dependency.source}); I/O goes behind a port.' },
      { from: 'application', disallow: SCHEMA, importKind: 'value', message: 'NX-ZOD-01: application/ imports the schema library as types only (${dependency.source}).' },
      { from: except('infra', 'lib-db', 'tooling'), disallow: ORM, message: 'NX-LAYER-03: only infra/ and lib/db import the ORM (${dependency.source}) — NX-DRZ-01.' },
      { from: except('lib', 'actions', 'components', 'legacy'), disallow: ACTION_CLIENT, message: 'NX-NSA-05: next-safe-action is imported only in lib/safe-action.ts, actions.ts and client components (${dependency.source}).' },
      { from: except('lib', 'infra', 'legacy', 'tooling'), disallow: PLATFORM, message: 'NX-SB-08: the platform client is used in lib/ (auth, storage) and infra/ only (${dependency.source}).' },
      { from: except('actions', 'queries', 'tooling'), disallow: [NEXT_CACHE], message: 'NX-CACHE-01: caching primitives live in queries.ts and revalidation in actions.ts only (${dependency.source}).' },
      { from: ['infra', 'application', 'commands', 'domain'], disallow: [NEXT_CACHE], message: 'NX-CACHE-04: use cases, commands and repositories never revalidate; the action does, after the use case returns ok (${dependency.source}).' },
      { from: 'queries', disallow: [['next', { path: '/cache', specifiers: REVALIDATE }]], message: 'NX-CACHE-01: revalidation lives in actions.ts; queries.ts only caches.' },
      { from: 'actions', disallow: [['next', { path: '/cache', specifiers: CACHE }]], message: 'NX-CACHE-01: caching lives in queries.ts; actions.ts only revalidates.' },
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

  const config = [
    {
      name: 'conventions/nextjs/base',
      files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
      languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } },
      plugins: { 'nx-ts': tsPlugin, boundaries, 'import-x': importX, nextjs: plugin },
      settings: {
        'import/resolver': { typescript: { alwaysTryTypes: true, project: tsconfig } },
        'import-x/resolver': { typescript: { alwaysTryTypes: true, project: tsconfig } },
        'import-x/extensions': ['.ts', '.tsx', '.mts', '.js', '.mjs'], // no-cycle follows TypeScript files
        'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx', '.mts'] },
        'boundaries/elements': elements,
        'boundaries/ignore': TEST_GLOBS, // NX-STR-06 / NX-TEST-07
        'boundaries/dependency-nodes': ['import', 'export', 'dynamic-import'],
      },
      rules: {
        'boundaries/element-types': ['error', elementTypes], // NX-LAYER-01, -03, -04, -05, -10, NX-STR-03, -05
        'boundaries/external': ['error', external], // NX-LAYER-02, -03, NX-CACHE-01/04, NX-DRZ-01, NX-NSA-05, NX-SB-08, NX-ZOD-01
        'boundaries/no-unknown-files': 'error', // NX-STR-02: every file belongs to a known place
        'import-x/no-cycle': ['error', { ignoreExternal: true, maxDepth: 6 }], // NX-LAYER-09
        'nx-ts/naming-convention': namingConvention, // NX-NAME-02
        'nx-ts/consistent-type-assertions': ['error', { assertionStyle: 'never' }], // NX-TYPE-02
        'nextjs/use-case-export-name': 'error', // NX-NAME-03
        'nextjs/tag-matches-type-name': 'error', // NX-ERR-02, NX-NAME-22, NX-NAME-62
        'nextjs/actions-use-commands': 'error', // NX-LAYER-11
      },
    },
    // ---- mappers, lib/db and brand constructors may cast (NX-TYPE-02) ------------------------
    {
      name: 'conventions/nextjs/mappers',
      files: ['**/*.mapper.ts', p('lib/db/**/*.ts'), p('modules/*/domain/*-id.ts')],
      rules: { 'nx-ts/consistent-type-assertions': 'off' },
    },
    // ---- tests: exempt from layer rules, not from naming (NX-TEST-07) ------------------------
    {
      name: 'conventions/nextjs/tests',
      files: TEST_GLOBS,
      rules: {
        'boundaries/element-types': 'off',
        'boundaries/external': 'off',
        'boundaries/no-unknown-files': 'off',
        'nx-ts/consistent-type-assertions': 'off',
        'nextjs/use-case-export-name': 'off',
      },
    },
    // ---- legacy code keeps its shape until its module migrates (NX-LAYER-10) ----------------
    ...(legacy.length
      ? [{ name: 'conventions/nextjs/legacy', files: legacy.map(p), rules: Object.fromEntries(LEGACY_EXEMPT.map((r) => [r, 'off'])) }]
      : []),
  ];

  // ---- rulesets not adopted yet (ARCHITECTURE.md `rulesets:`) --------------------------------
  if (rulesets && rulesets.length) {
    const off = Object.entries(RULE_GROUPS).filter(([, g]) => !rulesets.includes(g)).map(([r]) => [r, 'off']);
    if (off.length) config.push({ name: 'conventions/nextjs/rulesets-off', files: ['**/*.ts', '**/*.tsx', '**/*.mts'], rules: Object.fromEntries(off) });
  }
  return config;
}
