import { files, finding, adopted, read } from './util.mjs';

/** NX-MIG-04: every disabled rule in source has a Deviations row with its rule id. */
export async function deviations(project) {
  const out = [];
  if (!project.header || !adopted(project, 'NX-MIG-04')) return out;
  const declared = new Set(project.deviations.map((r) => r.rule));
  const tools = project.catalogue.rules.map((r) => r.tool).filter(Boolean);
  const patterns = project.manifest.sourceGlobs.map((g) => (g.includes('.') ? g : `${g}/*.{ts,tsx,mts}`));
  for (const f of await files(project.appRoot, patterns)) {
    const src = read(project.appRoot, f);
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      const dis = /(?:eslint-disable(?:-next-line|-line)?|ast-grep-ignore)(?::?\s*([^\n*]*))?/.exec(line);
      if (!dis) return;
      const named = (dis[1] ?? '').split(/[,\s]+/).map((t) => t.trim()).filter((t) => t && !/^--/.test(t));
      // a bare disable switches every rule off, convention rules included
      if (!named.length) { out.push(finding(project, 'NX-MIG-04', `a bare disable comment switches the convention rules off; name the rule and add a Deviations row`, { file: f, line: i + 1, check: 'deviations' })); return; }
      const ruleIds = new Set();
      for (const t of named) {
        if (/^[A-Z]{2}-[A-Z]+-\d{2}$/.test(t)) { ruleIds.add(t); continue; }
        const byTool = project.catalogue.rules.find((r) => r.tool === t || r.tool === t.replace(/^@typescript-eslint\//, 'nx-ts/') || (/^nx-[a-z]+-\d{2}/.test(t) && r.id.toLowerCase() === t.slice(0, 11)));
        if (byTool) ruleIds.add(byTool.reportedAs ?? byTool.id);
        else if (tools.includes(t)) ruleIds.add(t);
      }
      // disabling a rule that is not a convention rule (react-hooks/…, @next/…) is none of our business
      for (const id of ruleIds) if (!declared.has(id)) out.push(finding(project, 'NX-MIG-04', `${id} is disabled here but has no row in the Deviations table of ARCHITECTURE.md`, { file: f, line: i + 1, check: 'deviations' }));
    });
  }
  return out;
}
