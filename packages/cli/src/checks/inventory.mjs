import { finding, adopted, globFrom } from './util.mjs';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** NX-DB-02's categories: A–E, and X for legacy code waiting to be ported (NX-MIG-01). */
export const CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'X'];
const CATEGORY_TEXT = 'A–E, or X while its caller is legacy';

/** NX-DB-02: every function and trigger in the migrations has an inventory row with a category. */
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

  const { objects: live, tables } = scanMigrations(migrations.map((f) => ({ file: f, sql: readFileSync(f, 'utf8') })));
  const { listed, rows } = parseInventory(inv);

  for (const [name, { kind, file }] of live) {
    if (!listed.has(name)) out.push(finding(project, 'NX-DB-02', `${kind} ${name} has no row in ${inventoryPath} (category ${CATEGORY_TEXT}; caller, wrapper, test)`, { file: path.relative(project.appDir, file), check: 'inventory' }));
  }
  for (const row of rows) {
    if (row.dropped) continue;
    if (!row.category) out.push(finding(project, 'NX-DB-02', `inventory row ${row.names.join(', ')} has no category: ${CATEGORY_TEXT} (NX-DB-08 for an updated_at or audit trigger)`, { file: inventoryPath, line: row.line, check: 'inventory' }));
    for (const name of row.names) {
      // a row may name the table a trigger is on (`audit_x` on `change_events`)
      if (!live.has(name) && !tables.has(name) && !/^set_updated_at|^audit/.test(name)) out.push(finding(project, 'NX-DB-02', `inventory row ${name} names no function or trigger in the migrations; mark it dropped or remove the row`, { file: inventoryPath, line: row.line, check: 'inventory', severity: 'warn' }));
    }
  }
  return out;
}

// ---- migrations ---------------------------------------------------------------------------

const IDENT = String.raw`(?:"[^"]+"|[A-Za-z_][\w$]*)`;
const QUALIFIED = String.raw`${IDENT}(?:\s*\.\s*${IDENT})?`;
const lastPart = (q) => q.split(/\s*\.\s*(?=(?:"|[A-Za-z_]))/).pop().replace(/^"|"$/g, '');

/** Removes comments and dollar-quoted bodies, so text inside a function body is not read as DDL. */
function stripSql(sql) {
  return sql
    .replace(/\$([A-Za-z_]\w*)?\$[\s\S]*?\$\1\$/g, "''")
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ');
}

/** `a(int, numeric(10,2)), public.b(text) cascade` → ['a', 'b'] */
function namesInList(text) {
  let s = text;
  for (let prev; prev !== s; ) { prev = s; s = s.replace(/\([^()]*\)/g, ''); }
  return s.replace(/\b(cascade|restrict)\b/gi, '').split(',').map((x) => x.trim()).filter(Boolean).map(lastPart);
}

/**
 * Replays the migrations in order and returns what is live: `objects`, function or trigger name →
 * { kind, file }, and `tables`, the live table names. Reads quoted and schema-qualified names
 * (`"public"."x"`), `create or replace`, `create constraint trigger`, `drop … if exists a(), b()`,
 * `alter function|trigger|table … rename to`. A trigger goes with its table (`drop table`) and
 * with its function (`drop function … cascade`, or after its triggers went), and follows its
 * table through a rename.
 *
 * @param {Array<{file: string, sql: string}>} files  in migration order
 */
export function scanMigrations(files) {
  const functions = new Map();
  const triggers = new Map(); // trigger name → Map(table → { file, fn })
  const tables = new Set();
  const statement = new RegExp(
    [
      String.raw`\bcreate\s+(?:or\s+replace\s+)?(function|procedure)\s+(${QUALIFIED})`,
      String.raw`\bcreate\s+(?:or\s+replace\s+)?(?:constraint\s+)?trigger\s+(${QUALIFIED})[^;]*?\bon\s+(${QUALIFIED})[^;]*?\bexecute\s+(?:function|procedure)\s+(${QUALIFIED})`,
      String.raw`\bdrop\s+(?:function|procedure)\s+(?:if\s+exists\s+)?([^;]+)`,
      String.raw`\bdrop\s+trigger\s+(?:if\s+exists\s+)?(${QUALIFIED})\s+on\s+(${QUALIFIED})`,
      String.raw`\balter\s+(function|procedure)\s+(${QUALIFIED})\s*(?:\([^;]*?\))?\s+rename\s+to\s+(${IDENT})`,
      String.raw`\balter\s+trigger\s+(${QUALIFIED})\s+on\s+(${QUALIFIED})\s+rename\s+to\s+(${IDENT})`,
      String.raw`\bcreate\s+(?:unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?(${QUALIFIED})`,
      String.raw`\bdrop\s+table\s+(?:if\s+exists\s+)?([^;]+)`,
      String.raw`\balter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(${QUALIFIED})\s+rename\s+to\s+(${IDENT})`,
    ].join('|'),
    'gi',
  );
  const onTable = (name) => triggers.get(name) ?? triggers.set(name, new Map()).get(name);
  for (const { file, sql } of files) {
    for (const m of stripSql(sql).matchAll(statement)) {
      const [, cfKind, cfName, ctName, ctTable, ctFn, dfList, dtName, dtTable, afKind, afName, afTo, atName, atTable, atTo, cTable, dTables, rtFrom, rtTo] = m;
      if (cfName) functions.set(lastPart(cfName), { kind: cfKind.toLowerCase(), file });
      else if (ctName) onTable(lastPart(ctName)).set(lastPart(ctTable), { file, fn: lastPart(ctFn) });
      else if (dfList) {
        for (const name of namesInList(dfList)) {
          functions.delete(name);
          for (const on of triggers.values()) for (const [table, t] of on) if (t.fn === name) on.delete(table);
        }
      } else if (dtName) triggers.get(lastPart(dtName))?.delete(lastPart(dtTable));
      else if (afName) {
        const from = lastPart(afName), to = lastPart(afTo);
        if (functions.has(from)) { functions.set(to, { kind: afKind.toLowerCase(), file }); functions.delete(from); }
        for (const on of triggers.values()) for (const t of on.values()) if (t.fn === from) t.fn = to;
      } else if (atName) {
        const on = triggers.get(lastPart(atName)), table = lastPart(atTable);
        const t = on?.get(table);
        if (t) { on.delete(table); onTable(lastPart(atTo)).set(table, { ...t, file }); }
      } else if (cTable) tables.add(lastPart(cTable));
      else if (dTables) {
        for (const table of namesInList(dTables)) {
          tables.delete(table);
          for (const on of triggers.values()) on.delete(table);
        }
      } else if (rtFrom) {
        const from = lastPart(rtFrom), to = lastPart(rtTo);
        if (tables.delete(from)) tables.add(to);
        for (const on of triggers.values()) {
          const t = on.get(from);
          if (t) { on.delete(from); on.set(to, t); }
        }
      }
    }
  }
  const objects = new Map(functions);
  for (const [name, on] of triggers) {
    const last = [...on.values()].at(-1);
    if (last && !objects.has(name)) objects.set(name, { kind: 'trigger', file: last.file });
  }
  return { objects, tables };
}

// ---- inventory ----------------------------------------------------------------------------

const cellsOf = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const isSeparator = (line) => /^\|?\s*:?-{3,}/.test(line.trim());
const NAME = /^[A-Za-z_][\w$]*$/;

/** Backticked function or trigger names: `x`, `public.x`, `x()`; other schemas (`auth.users`, `extensions.moddatetime`) are not the project's. */
function namesIn(text) {
  const out = [];
  for (const [, raw] of text.matchAll(/`([^`]+)`/g)) {
    const name = raw.trim().replace(/\(.*\)$/, '').replace(/^public\./, '');
    if (NAME.test(name)) out.push(name);
  }
  return out;
}

/** `A`, `**B** read model`, `X (legacy)`; `— (NX-DB-08, audit)` for the triggers NX-DB-08 allows. */
function categoryOf(cell) {
  const text = cell.replace(/[*_`]/g, '').trim();
  const letter = new RegExp(`^(${CATEGORIES.join('|')})\\b`).exec(text);
  if (letter) return letter[1];
  if (/NX-DB-08/.test(text)) return 'NX-DB-08';
  return undefined;
}

/**
 * Reads an inventory: every table with a `Category` column gives one row per line, its names
 * taken from the columns headed Name, Function or Trigger (the first column if none is). A
 * section whose text names exactly one category (`All of them are category E`) lists every
 * other backticked name in it with that category: a group with no caller of its own. A section
 * headed Dropped or Removed lists nothing.
 *
 * @returns {{ listed: Map<string, string|undefined>, rows: Array<{names: string[], category?: string, dropped: boolean, line: number}> }}
 */
export function parseInventory(md) {
  const lines = md.split('\n');
  const listed = new Map();
  const rows = [];
  const sections = [];
  let section = { heading: '', start: 0, lines: [] };
  lines.forEach((line, i) => {
    if (/^#{1,6}\s/.test(line)) { sections.push(section); section = { heading: line, start: i, lines: [] }; }
    section.lines.push({ text: line, n: i + 1 });
  });
  sections.push(section);

  for (const s of sections) {
    const droppedSection = /\b(dropped|removed)\b/i.test(s.heading);
    const prose = [];
    for (let i = 0; i < s.lines.length; i++) {
      const { text } = s.lines[i];
      if (!text.trim().startsWith('|') || !s.lines[i + 1] || !isSeparator(s.lines[i + 1].text)) { prose.push(text); continue; }
      // a table: header, separator, rows
      const header = cellsOf(text);
      const body = [];
      for (i += 2; i < s.lines.length && s.lines[i].text.trim().startsWith('|'); i++) body.push(s.lines[i]);
      i--;
      const categoryCol = header.findIndex((h) => /categor/i.test(h));
      if (categoryCol < 0) { prose.push(text, ...body.map((b) => b.text)); continue; }
      let nameCols = header.map((h, j) => (/\b(name|function|trigger)s?\b/i.test(h) && j !== categoryCol ? j : -1)).filter((j) => j >= 0);
      if (!nameCols.length) nameCols = [0];
      for (const { text: rowText, n } of body) {
        const cells = cellsOf(rowText);
        const names = nameCols.flatMap((j) => namesIn(cells[j] ?? ''));
        if (!names.length) continue;
        const dropped = droppedSection || /^(dropped|removed|ported)\b/i.test(cells.at(-1) ?? '');
        const category = categoryOf(cells[categoryCol] ?? '');
        rows.push({ names, category, dropped, line: n });
        if (!dropped) for (const name of names) listed.set(name, category);
      }
    }
    if (droppedSection) continue;
    const text = prose.join('\n');
    const named = new Set([...(s.heading + '\n' + text).matchAll(new RegExp(`\\b[Cc]ategory\\s+\\**(${CATEGORIES.join('|')})\\b`, 'g'))].map((m) => m[1]));
    if (named.size !== 1) continue;
    const [category] = named;
    for (const name of namesIn(text)) if (!listed.has(name)) listed.set(name, category);
  }
  return { listed, rows };
}
