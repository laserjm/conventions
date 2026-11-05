import { glob } from 'tinyglobby';
import path from 'node:path';
import { readFileSync } from 'node:fs';

export async function files(dir, patterns, ignore = ['**/node_modules/**', '**/.next/**', '**/dist/**']) {
  const list = await glob(patterns, { cwd: dir, ignore, onlyFiles: true, dot: false });
  return list.sort();
}

export async function dirs(dir, pattern) {
  const list = await glob(pattern, { cwd: dir, onlyDirectories: true, ignore: ['**/node_modules/**'] });
  return list.map((d) => d.replace(/\/$/, '')).sort();
}

export const read = (dir, rel) => readFileSync(path.join(dir, rel), 'utf8');

/** A finding, with the catalogue's severity for `id` unless overridden. */
export function finding(project, id, message, extra = {}) {
  const rule = project.catalogue.rules.find((r) => r.id === id);
  return { id, severity: extra.severity ?? (rule?.severity === 'warn' ? 'warn' : 'error'), message, ...extra };
}

/**
 * True when the rule applies to the project: its group is adopted (ARCHITECTURE.md `rulesets:`)
 * and it applies under the header's `isolation:` (a rule without `isolation` applies under all).
 */
export function adopted(project, id) {
  const rule = project.catalogue.rules.find((r) => r.id === id);
  if (!rule) return true;
  const chosen = project.header?.rulesets;
  return (!chosen || !chosen.length || chosen.includes(rule.group)) && appliesUnder(rule, project.header?.isolation);
}

/** A rule's `isolation` lists the values it applies under; an unset header value keeps every rule. */
export function appliesUnder(rule, isolation) {
  return !rule?.isolation || !isolation || rule.isolation.includes(isolation);
}

/** Absolute matches of a glob that may start with `../`: the static prefix is resolved first. */
export async function globFrom(dir, pattern) {
  const parts = pattern.split('/');
  const i = parts.findIndex((p) => /[*?{[]/.test(p));
  const base = path.resolve(dir, parts.slice(0, i < 0 ? -1 : i).join('/'));
  const rest = parts.slice(i < 0 ? -1 : i).join('/');
  const list = await glob([rest], { cwd: base, onlyFiles: true, ignore: ['**/node_modules/**'] });
  return list.sort().map((f) => path.join(base, f));
}

/** A use case's export name: the camelCase of its kebab-case file name (NX-NAME-03). */
export const exportName = (file) => path.basename(file, '.ts').replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/**
 * The module's command test (`module.commandTest`, next to `commands.ts`), or null when the
 * profile names none or the module has none. `text` is its source; `repositories` holds the
 * repository files (`<dir>/infra/<x>.repository.ts`) `commands.ts` imports, which it covers.
 */
export async function commandTest(project, dir) {
  const m = project.manifest.module;
  if (!m.commandTest) return null;
  const file = `${dir}/${m.commandTest}`;
  if (!(await files(project.appRoot, [file])).length) return null;
  const commands = `${dir}/${m.commandTest.replace(m.integrationTestSuffix, '.ts')}`;
  const repositories = new Set();
  if ((await files(project.appRoot, [commands])).length) {
    const spec = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
    for (const [, s] of read(project.appRoot, commands).matchAll(spec)) {
      const hit = /(?:^|\/)infra\/([a-z0-9-]+)\.repository(?:\.[mc]?[jt]s)?$/.exec(s);
      if (hit) repositories.add(`${dir}/infra/${hit[1]}.repository.ts`);
    }
  }
  return { file, text: read(project.appRoot, file), repositories };
}
