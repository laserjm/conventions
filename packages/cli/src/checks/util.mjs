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

/** True when the rule's group is adopted by the project (ARCHITECTURE.md `rulesets:`). */
export function adopted(project, id) {
  const rule = project.catalogue.rules.find((r) => r.id === id);
  if (!rule) return true;
  const chosen = project.header?.rulesets;
  return !chosen || !chosen.length || chosen.includes(rule.group);
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
