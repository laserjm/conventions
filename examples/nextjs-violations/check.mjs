// Every file under app/, modules/, lib/ and components/ carries `// expect: <RULE-ID>[, …]` and must
// be reported for each id; a file without it must be clean. Then: every lint-enforced rule of the
// catalogue is covered by at least one fixture, and `conventions check` reports expected-checks.txt.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { glob } from 'tinyglobby';
import YAML from 'yaml';

const here = import.meta.dirname;
const cli = path.join(here, 'node_modules/@conventions/cli/bin/conventions.mjs');
function run(args) {
  try { return execFileSync('node', [cli, ...args, '--json'], { cwd: here, encoding: 'utf8', maxBuffer: 64 << 20 }); }
  catch (e) { if (e.stdout?.trim().startsWith('[')) return e.stdout; throw new Error(`conventions ${args[0]} failed: ${e.stderr || e.stdout}`); }
}
const lint = JSON.parse(run(['lint']));
const byFile = new Map();
for (const f of lint) byFile.set(f.file, (byFile.get(f.file) ?? new Set()).add(f.id));
// a finding on a folder (ls-lint) counts for every file inside it
const reportedFor = (file) => {
  const ids = new Set(byFile.get(file) ?? []);
  for (const [k, v] of byFile) if (!k.includes('.') && file.startsWith(k + '/')) for (const id of v) ids.add(id);
  return ids;
};

let failed = 0, checked = 0;
const reportedIds = new Set();
for (const file of (await glob(['app/**/*.{ts,tsx}', 'modules/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'], { cwd: here })).sort()) {
  const src = readFileSync(path.join(here, file), 'utf8');
  const m = /\/\/\s*expect:\s*(.+)/.exec(src);
  const reported = reportedFor(file);
  for (const id of reported) reportedIds.add(id);
  if (!m) {
    if (reported.size) { console.log(`✗ ${file}: support file must be clean, got ${[...reported].join(', ')}`); failed++; }
    continue;
  }
  checked++;
  const expected = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  const missing = expected.filter((id) => !reported.has(id));
  if (missing.length) {
    console.log(`✗ ${file}: expected ${missing.join(', ')}; reported ${[...reported].join(', ') || 'nothing'}`);
    for (const x of lint.filter((f) => f.file === file)) console.log(`    ${x.line ?? '-'} ${x.id} [${x.tool}] ${x.message}`);
    failed++;
  } else console.log(`✓ ${file}: ${expected.join(', ')}`);
}

// catalogue coverage: every eslint / ast-grep / ls-lint rule is reported by some fixture
const catalogue = YAML.parse(readFileSync(path.join(here, 'node_modules/@conventions/nextjs/rules/nextjs.yaml'), 'utf8'));
const lintRules = catalogue.rules.filter((r) => ['eslint', 'ast-grep', 'ls-lint'].includes(r.mechanism));
const uncovered = lintRules.filter((r) => !reportedIds.has(r.reportedAs ?? r.id));
if (uncovered.length) { console.log(`✗ no fixture reports: ${uncovered.map((r) => r.id).join(', ')}`); failed++; }
else console.log(`✓ all ${lintRules.length} lint-enforced rules are covered by a fixture`);

// a Deviations row with a path makes the finding a warning, not an error (NX-MIG-04)
const deviated = lint.find((f) => f.id === 'NX-DRZ-08' && f.file === 'modules/orders/infra/order.repository.ts');
if (deviated?.severity === 'warn') console.log('✓ Deviations row downgrades NX-DRZ-08 on order.repository.ts to a warning');
else { console.log(`✗ expected NX-DRZ-08 on order.repository.ts to be a warning via the Deviations row; got ${deviated?.severity}`); failed++; }
const notDeviated = lint.find((f) => f.id === 'NX-DRZ-08' && f.file !== 'modules/orders/infra/order.repository.ts');
if (notDeviated && notDeviated.severity !== 'error') { console.log(`✗ NX-DRZ-08 elsewhere must stay an error`); failed++; }

// structural checks
const checks = JSON.parse(run(['check']));
const expectedChecks = readFileSync(path.join(here, 'expected-checks.txt'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/));
for (const [id, file] of expectedChecks) {
  if (checks.some((c) => c.id === id && c.file === file)) console.log(`✓ check ${id} ${file}`);
  else { console.log(`✗ check ${id} ${file} not reported; got ${checks.map((c) => `${c.id} ${c.file}`).join(' | ')}`); failed++; }
}
const unexpectedChecks = checks.filter((c) => !expectedChecks.some(([id, file]) => c.id === id && c.file === file));
if (unexpectedChecks.length) { console.log(`✗ unexpected check findings: ${unexpectedChecks.map((c) => `${c.id} ${c.file ?? ''} ${c.message}`).join(' | ')}`); failed++; }

console.log(`\n${checked} violation files checked, ${failed} failed`);
process.exit(failed ? 1 : 0);
