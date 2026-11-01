import { finding, adopted, globFrom } from './util.mjs';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** NX-DB-02: every function, trigger and policy in the migrations has an inventory row. */
export async function inventory(project) {
  const out = [];
  if (!adopted(project, 'NX-DB-02')) return out;
  // monorepo: the header points at migrations and inventory outside the app (../../supabase/migrations/*.sql)
  const migrationsGlob = project.header?.migrations ?? project.manifest.migrations;
  const inventoryPath = project.header?.inventory ?? project.manifest.inventory;
  const migrations = await globFrom(project.appDir, migrationsGlob);
  if (!migrations.length) return out;
  const invPath = path.resolve(project.appDir, inventoryPath);
  const inv = existsSync(invPath) ? readFileSync(invPath, 'utf8') : '';
  if (!inv) return [finding(project, 'NX-DB-02', `migrations exist but ${inventoryPath} does not; \`conventions init\` writes a starting table`, { file: inventoryPath, check: 'inventory' })];
  // a row counts when it names a function, trigger, policy or rpc somewhere on the line; table rows do not
  const rows = inv.split('\n').filter((l) => /^\|\s*`[^`]+`/.test(l) && /\b(function|trigger|polic(y|ies)|rpc)\b/i.test(l));
  const nameOf = (l) => /^\|\s*`([^`(]+)/.exec(l)[1].trim();
  const listed = new Set(rows.map(nameOf));
  const dropped = new Set(rows.filter((l) => /\|\s*(dropped|removed|ported)\b[^|]*\|?\s*$/i.test(l)).map(nameOf));
  const seen = new Map();
  for (const f of migrations) {
    const sql = readFileSync(f, 'utf8').replace(/--[^\n]*/g, '');
    for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?(function|trigger|policy)\s+(?:if\s+not\s+exists\s+)?"?([\w.]+)"?/gi)) seen.set(m[2].replace(/^public\./, ''), { kind: m[1].toLowerCase(), file: f });
    for (const m of sql.matchAll(/drop\s+(function|trigger|policy)\s+(?:if\s+exists\s+)?"?([\w.]+)"?/gi)) seen.delete(m[2].replace(/^public\./, ''));
  }
  for (const [name, { kind, file }] of seen) {
    if (!listed.has(name)) out.push(finding(project, 'NX-DB-02', `${kind} ${name} has no row in ${inventoryPath} (category A–E, caller, wrapper, test)`, { file: path.relative(project.appDir, file), check: 'inventory' }));
  }
  for (const name of listed) if (!seen.has(name) && !dropped.has(name) && !/^set_updated_at|^audit/.test(name)) out.push(finding(project, 'NX-DB-02', `inventory row ${name} names no function, trigger or policy in the migrations; mark it dropped or remove the row`, { file: inventoryPath, check: 'inventory', severity: 'warn' }));
  return out;
}
