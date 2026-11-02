// Reads the conventions header of a project's ARCHITECTURE.md: the one place a project says
// which profile, version, bindings, rulesets, isolation, app root and legacy folders it uses. ESLint config,
// `conventions check` and the skill all read it, so a project touches one file to change them.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

/**
 * @typedef {object} ArchitectureHeader
 * @property {string} conventions   pinned version
 * @property {string} profile
 * @property {string[]} bindings
 * @property {string} appRoot        folder with app/, modules/, lib/ — relative to ARCHITECTURE.md
 * @property {string} [schemaSource]
 * @property {string} [isolation]    who owns a row: tenant | owner | none (NX-AUTH-03); required since 0.3.0
 * @property {string[]} [rulesets]   adopted rulesets; undefined = all
 * @property {string[]} legacy       pre-module folders, globs relative to appRoot (NX-LAYER-10)
 * @property {string} [migrations]   glob of SQL migrations, relative to ARCHITECTURE.md (monorepo: ../../supabase/migrations/*.sql)
 * @property {string} [inventory]    path of the database inventory, relative to ARCHITECTURE.md
 */

/** Walks up from `startDir` to the first ARCHITECTURE.md with a conventions header. */
export function findArchitecture(startDir = process.cwd()) {
  let dir = path.resolve(startDir);
  for (;;) {
    const file = path.join(dir, 'ARCHITECTURE.md');
    if (existsSync(file)) {
      const header = parseHeader(readFileSync(file, 'utf8'));
      if (header) return { file, dir, header };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** @returns {ArchitectureHeader | undefined} */
export function readArchitecture(file) {
  return parseHeader(readFileSync(file, 'utf8'));
}

/** @returns {ArchitectureHeader | undefined} */
export function parseHeader(markdown) {
  const m = /```ya?ml\r?\n([\s\S]*?)```/.exec(markdown);
  if (!m) return undefined;
  const raw = YAML.parse(m[1]);
  if (!raw || typeof raw !== 'object' || !('conventions' in raw)) return undefined;
  const list = (v) => (Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? [v] : []);
  return {
    conventions: String(raw.conventions),
    profile: String(raw.profile ?? ''),
    bindings: list(raw.bindings),
    appRoot: String(raw['app-root'] ?? raw.appRoot ?? '.'),
    schemaSource: raw['schema-source'] ? String(raw['schema-source']) : undefined,
    isolation: raw.isolation === undefined || raw.isolation === null ? undefined : String(raw.isolation),
    rulesets: raw.rulesets === undefined ? undefined : list(raw.rulesets),
    legacy: list(raw.legacy),
    migrations: raw.migrations ? String(raw.migrations) : undefined,
    inventory: raw.inventory ? String(raw.inventory) : undefined,
  };
}

/** Replaces the `conventions:` value in the header, keeping everything else byte for byte. */
export function withConventionsVersion(markdown, version) {
  return markdown.replace(/(```ya?ml\r?\n[\s\S]*?^conventions:\s*)([^\r\n]*)/m, `$1${version}`);
}

/**
 * Parses the Deviations and Legacy tables. A Deviations row names a rule id in the first column
 * and, in backticks in the second, the files or globs it covers (`modules/x/domain/{a,b}.ts`,
 * `lib/legacy/**`); findings of that rule on those paths are reported as warnings, not errors.
 * A row without paths covers the whole project. A Legacy row names its folder in backticks first.
 */
export function parseTables(markdown) {
  const deviations = [], legacy = [];
  let section = '';
  for (const line of markdown.split('\n')) {
    const h = /^##\s+(.*)/.exec(line);
    if (h) { section = h[1].trim().toLowerCase(); continue; }
    const cells = splitRow(line);
    if (!cells || /^-+$/.test(cells[0])) continue;
    if (section.startsWith('deviations') && /^[A-Z]{2}-[A-Z]+-\d{2}$/.test(cells[0])) {
      deviations.push({ rule: cells[0], deviation: cells[1] ?? '', why: cells[2] ?? '', until: cells[3] ?? '', paths: pathsIn(cells[1] ?? '') });
    }
    if (section.startsWith('legacy')) {
      const folder = /`([^`]+)`/.exec(cells[0])?.[1];
      if (folder) legacy.push({ folder, module: cells[1] ?? '', status: cells[2] ?? '' });
    }
  }
  return { deviations, legacy };
}

function splitRow(line) {
  const m = /^\|(.+)\|\s*$/.exec(line);
  if (!m) return undefined;
  return m[1].split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

/** Backticked tokens that look like paths: contain a slash, a glob character or a source extension. */
export function pathsIn(text) {
  return [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((t) => /[\/*{]/.test(t) || /\.(ts|tsx|mts|js|mjs|sql|md)$/.test(t)).map((t) => t.replace(/\/$/, '/**'));
}
