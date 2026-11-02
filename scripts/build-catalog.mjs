#!/usr/bin/env node
// Validates catalog/<profile>/*.yaml, regenerates rules/<profile>.yaml (+ the profile package's copy),
// and rewrites the rule tables and the checklist inside docs/<profile>/**/*.md between markers:
//   <!-- rules: <table-key> --> … <!-- /rules -->      <!-- checklist --> … <!-- /checklist -->
// Usage: node scripts/build-catalog.mjs [profile…]   (default: every folder under catalog/)
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import Ajv from 'ajv';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const schema = JSON.parse(readFileSync(path.join(root, 'catalog/schema.json'), 'utf8'));
const validate = new Ajv({ allErrors: true }).compile(schema);
const profiles = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(path.join(root, 'catalog')).filter((d) => statSync(path.join(root, 'catalog', d)).isDirectory());

const yq = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const slug = (h) => h.toLowerCase().replace(/[`*]/g, '').replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
export function enforcementLabel(r) {
  if (r.mechanism === 'agent') return 'agent';
  return r.tool ? `${r.mechanism}:${r.tool}` : r.mechanism;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== '_source') walk(p, out); }
    else if (e.endsWith('.md')) out.push(p);
  }
  return out;
}

let failed = false;
const fail = (msg) => { console.error('✗ ' + msg); failed = true; };

for (const profile of profiles) {
  const dir = path.join(root, 'catalog', profile);
  const tables = {}; // key -> { group, rules }
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort()) {
    const key = f.replace(/\.yaml$/, '');
    const doc = YAML.parse(readFileSync(path.join(dir, f), 'utf8'));
    if (!validate(doc)) { for (const e of validate.errors) fail(`${profile}/${f}: ${e.instancePath} ${e.message}`); continue; }
    for (const r of doc.rules) {
      if ((r.mechanism === 'agent') !== (r.severity === 'guidance')) fail(`${r.id}: mechanism 'agent' and severity 'guidance' go together (got ${r.mechanism}/${r.severity})`);
      if (r.checklist && r.severity !== 'guidance') fail(`${r.id}: only guidance rules go on the checklist`);
      if (['eslint', 'ast-grep', 'check'].includes(r.mechanism) && !r.tool) fail(`${r.id}: mechanism ${r.mechanism} needs 'tool' (the rule or check id)`);
    }
    tables[key] = doc;
  }
  const all = Object.values(tables).flatMap((t) => t.rules);
  const ids = all.map((r) => r.id);
  for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) fail(`${profile}: duplicate rule id ${id}`);

  // ---- docs: inject tables, learn doc anchors --------------------------------------------
  const docAnchor = {};
  const seen = new Set();
  for (const file of walk(path.join(root, 'docs', profile))) {
    const rel = path.relative(root, file);
    const lines = readFileSync(file, 'utf8').split('\n');
    const out = [];
    let section = '', i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const h = /^##\s+(.*)/.exec(line);
      if (h) section = slug(h[1]);
      const m = /^<!-- rules: ([a-z0-9-]+) -->$/.exec(line);
      if (m) {
        const key = m[1];
        const t = tables[key];
        if (!t) { fail(`${rel}: marker for unknown table '${key}'`); out.push(line); i++; continue; }
        if (seen.has(key)) fail(`${rel}: table '${key}' injected twice`);
        seen.add(key);
        out.push(line, '| ID | Sev | Rule | Enforcement |', '| --- | --- | --- | --- |');
        for (const r of t.rules) {
          out.push(`| ${r.id} | ${r.severity} | ${r.rule.replace(/\|/g, '\\|')} | ${enforcementLabel(r)}${r.isolation ? ` (isolation: ${r.isolation.join(', ')})` : ''} |`);
          docAnchor[r.id] = `${rel}#${section}`;
        }
        while (i < lines.length && lines[i] !== '<!-- /rules -->') i++;
        if (i >= lines.length) fail(`${rel}: unterminated rules marker '${key}'`);
        out.push('<!-- /rules -->'); i++; continue;
      }
      if (line === '<!-- checklist -->') {
        out.push(line);
        for (const r of all.filter((r) => r.checklist)) out.push(`- [ ] ${r.id} ${r.rule.split(/[.:]\s/)[0].replace(/[.:]$/, '')}`);
        while (i < lines.length && lines[i] !== '<!-- /checklist -->') i++;
        if (i >= lines.length) fail(`${rel}: unterminated checklist marker`);
        out.push('<!-- /checklist -->'); i++; continue;
      }
      out.push(line); i++;
    }
    const text = out.join('\n');
    if (text !== lines.join('\n')) writeFileSync(file, text);
  }
  for (const key of Object.keys(tables)) if (!seen.has(key)) fail(`${profile}: table '${key}' has no <!-- rules: ${key} --> marker in docs/${profile}`);

  // ---- flat catalogue ---------------------------------------------------------------------
  const pkgJson = path.join(root, 'packages', profile, 'package.json');
  const version = existsSync(pkgJson) ? JSON.parse(readFileSync(pkgJson, 'utf8')).version : '0.0.0';
  const groups = [...new Set(Object.values(tables).map((t) => t.group))];
  const lines = [
    `# Generated from catalog/${profile}/*.yaml by scripts/build-catalog.mjs — do not edit by hand.`,
    `profile: ${profile}`, `version: ${version}`, `rulesets: [${groups.join(', ')}]`, 'rules:',
  ];
  for (const [key, t] of Object.entries(tables)) {
    for (const r of t.rules) {
      lines.push(`  - id: ${r.id}`, `    group: ${t.group}`, `    table: ${key}`, `    severity: ${r.severity}`, `    mechanism: ${r.mechanism}`);
      if (r.tool) lines.push(`    tool: ${yq(r.tool)}`);
      if (r.checklist) lines.push(`    checklist: true`);
      if (r.reportedAs) lines.push(`    reportedAs: ${r.reportedAs}`);
      if (r.isolation) lines.push(`    isolation: [${r.isolation.join(', ')}]`);
      lines.push(`    doc: ${docAnchor[r.id] ?? ''}`, `    rule: ${yq(r.rule)}`);
      if (r.note) lines.push(`    note: ${yq(r.note)}`);
    }
  }
  const text = lines.join('\n') + '\n';
  for (const target of [path.join(root, 'rules', `${profile}.yaml`), path.join(root, 'packages', profile, 'rules', `${profile}.yaml`)]) {
    if (target.includes('/packages/') && !existsSync(path.join(root, 'packages', profile))) continue;
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, text);
  }
  const by = (k) => all.filter((r) => r.mechanism === k).length;
  console.log(`${profile}: ${all.length} rules — eslint ${by('eslint')}, ast-grep ${by('ast-grep')}, ls-lint ${by('ls-lint')}, tsc ${by('tsc')}, check ${by('check')}, ci ${by('ci')}, db ${by('db')}, agent ${by('agent')}`);
}
if (failed) process.exit(1);
