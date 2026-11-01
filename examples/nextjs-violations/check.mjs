// Every file under this fixture carries `// expect: <ruleId>[, <ruleId>]` and must be reported for each of them.
import { ESLint } from 'eslint';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const eslint = new ESLint({ cwd: import.meta.dirname });
const results = await eslint.lintFiles(['app', 'modules', 'lib']);
let failed = 0;
let checked = 0;

for (const r of results) {
  const rel = path.relative(import.meta.dirname, r.filePath);
  const src = readFileSync(r.filePath, 'utf8');
  const m = /\/\/\s*expect:\s*(.+)/.exec(src);
  const reported = new Set(r.messages.map((x) => x.ruleId ?? `fatal:${x.message}`));
  if (!m) {
    if (reported.size) { console.log(`✗ ${rel}: support file must be clean, got ${[...reported].join(', ')}`); failed++; }
    continue;
  }
  checked++;
  const expected = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  const missing = expected.filter((id) => !reported.has(id));
  if (missing.length) {
    console.log(`✗ ${rel}: expected ${missing.join(', ')}; reported ${[...reported].join(', ') || 'nothing'}`);
    for (const x of r.messages) console.log(`    ${x.line}:${x.column} ${x.ruleId} ${x.message}`);
    failed++;
  } else {
    console.log(`✓ ${rel}: ${expected.join(', ')}`);
  }
}
console.log(`\n${checked} violation files checked, ${failed} failed`);
process.exit(failed ? 1 : 0);
