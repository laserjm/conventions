import { files, finding, adopted, read } from './util.mjs';

/** NX-MIG-04: every disabled rule in source has a Deviations row with its rule id. */
export async function deviations(project) {
  const out = [];
  if (!project.header || !adopted(project, 'NX-MIG-04')) return out;
  const { deviations: rows } = project.arch.parseTables(project.markdown);
  const declared = new Set(rows.map((r) => r.rule));
  const patterns = project.manifest.sourceGlobs.map((g) => (g.includes('.') ? g : `${g}/*.{ts,tsx,mts}`));
  for (const f of await files(project.appRoot, patterns)) {
    const src = read(project.appRoot, f);
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      const dis = /(eslint-disable[^\n]*|ast-grep-ignore[^\n]*)/.exec(line);
      if (!dis) return;
      const ids = [...dis[1].matchAll(/[A-Z]{2}-[A-Z]+-\d{2}/g)].map((m) => m[0]);
      const toolIds = [...dis[1].matchAll(/(boundaries\/[a-z-]+|nextjs\/[a-z-]+|@typescript-eslint\/[a-z-]+|import-x\/[a-z-]+|nx-[a-z]+-\d{2}[a-z0-9-]*)/g)].map((m) => m[0]);
      const ruleIds = ids.length ? ids : toolIds.map((t) => project.catalogue.rules.find((r) => r.tool === t || (r.tool && t.startsWith(r.tool)) || (t.startsWith('nx-') && r.id.toLowerCase() === t.slice(0, 11)))?.id).filter(Boolean);
      if (!ruleIds.length) { out.push(finding(project, 'NX-MIG-04', `disable comment names no convention rule; name the NX id and add a Deviations row`, { file: f, line: i + 1, check: 'deviations' })); return; }
      for (const id of ruleIds) if (!declared.has(id)) out.push(finding(project, 'NX-MIG-04', `${id} is disabled here but has no row in the Deviations table of ARCHITECTURE.md`, { file: f, line: i + 1, check: 'deviations' }));
    });
  }
  return out;
}
