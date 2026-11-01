// Reads the conventions header of a project's ARCHITECTURE.md: the one place a project says
// which profile, version, bindings, rulesets, app root and legacy folders it uses. ESLint config,
// `conventions check` and the skill all read it, so a project touches one file to change them.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

/** @typedef {{ conventions: string, profile: string, bindings: string[], appRoot: string, schemaSource?: string, rulesets?: string[], legacy: string[] }} ArchitectureHeader */

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
    rulesets: raw.rulesets === undefined ? undefined : list(raw.rulesets),
    legacy: list(raw.legacy),
  };
}

/** Replaces the `conventions:` value in the header, keeping everything else byte for byte. */
export function withConventionsVersion(markdown, version) {
  return markdown.replace(/(```ya?ml\r?\n[\s\S]*?^conventions:\s*)([^\r\n]*)/m, `$1${version}`);
}

/** Parses the Deviations and Legacy tables (rows with a rule id / a folder in the first column). */
export function parseTables(markdown) {
  const deviations = [], legacy = [];
  let section = '';
  for (const line of markdown.split('\n')) {
    const h = /^##\s+(.*)/.exec(line);
    if (h) { section = h[1].trim().toLowerCase(); continue; }
    const cells = /^\|(.+)\|\s*$/.exec(line)?.[1].split('|').map((c) => c.trim());
    if (!cells || cells[0] === '---' || /^-+$/.test(cells[0])) continue;
    if (section.startsWith('deviations') && /^[A-Z]{2}-[A-Z]+-\d{2}$/.test(cells[0])) deviations.push({ rule: cells[0], deviation: cells[1], why: cells[2], until: cells[3] });
    if (section.startsWith('legacy') && /^`.+`$/.test(cells[0])) legacy.push({ folder: cells[0].slice(1, -1), module: cells[1], status: cells[2] });
  }
  return { deviations, legacy };
}
