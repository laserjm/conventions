import { files, finding, adopted, read } from './util.mjs';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** NX-DB-02: every function, trigger and policy in the migrations has an inventory row. */
export async function inventory(project) {
  const out = [];
  if (!adopted(project, 'NX-DB-02')) return out;
  const migrations = await files(project.appDir, [project.manifest.migrations]);
  if (!migrations.length) return out;
  const invPath = path.join(project.appDir, project.manifest.inventory);
  const inv = existsSync(invPath) ? read(project.appDir, project.manifest.inventory) : '';
  if (!inv) return [finding(project, 'NX-DB-02', `migrations exist but ${project.manifest.inventory} does not; start from templates/project/docs/db-inventory.md`, { file: project.manifest.inventory, check: 'inventory' })];
  const listed = new Set([...inv.matchAll(/^\|\s*`([^`]+)`/gm)].map((m) => m[1].replace(/\(.*$/, '')));
  const dropped = new Set([...inv.matchAll(/^\|\s*`([^`]+)`[^\n]*\|\s*(dropped|removed)\s*\|?\s*$/gim)].map((m) => m[1]));
  const seen = new Map();
  for (const f of migrations) {
    const sql = read(project.appDir, f).replace(/--[^\n]*/g, '');
    for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?(function|trigger|policy)\s+(?:if\s+not\s+exists\s+)?"?([\w.]+)"?/gi)) seen.set(m[2].replace(/^public\./, ''), { kind: m[1].toLowerCase(), file: f });
    for (const m of sql.matchAll(/drop\s+(function|trigger|policy)\s+(?:if\s+exists\s+)?"?([\w.]+)"?/gi)) seen.delete(m[2].replace(/^public\./, ''));
  }
  for (const [name, { kind, file }] of seen) {
    if (!listed.has(name)) out.push(finding(project, 'NX-DB-02', `${kind} ${name} has no row in ${project.manifest.inventory} (category A–E, caller, wrapper, test)`, { file, check: 'inventory' }));
  }
  for (const name of listed) if (!seen.has(name) && !dropped.has(name) && !/^set_updated_at|^audit/.test(name)) out.push(finding(project, 'NX-DB-02', `inventory row ${name} names no function, trigger or policy in the migrations; mark it dropped or remove the row`, { file: project.manifest.inventory, check: 'inventory', severity: 'warn' }));
  return out;
}
