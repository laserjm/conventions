export function print(findings, { json, title }) {
  if (json) { console.log(JSON.stringify(findings, null, 2)); return; }
  if (!findings.length) { console.log(`✓ ${title}: nothing to report`); return; }
  for (const f of findings) {
    const loc = f.file ? `${f.file}${f.line ? ':' + f.line : ''}` : '';
    console.log(`${f.severity === 'error' ? '✗' : '!'} ${f.id} ${loc ? loc + ' — ' : ''}${f.message}`);
  }
  const errors = findings.filter((f) => f.severity === 'error').length;
  console.log(`\n${findings.length} finding(s), ${errors} error(s) — ${title}`);
}

export function exitCode(findings) {
  return findings.some((f) => f.severity === 'error') ? 1 : 0;
}
