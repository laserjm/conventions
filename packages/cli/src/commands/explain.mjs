import { loadProject, ruleById, UsageError } from '../project.mjs';

export async function explain({ cwd, id }) {
  if (!id) throw new UsageError('usage: conventions explain <RULE-ID>');
  const project = await loadProject(cwd);
  const r = ruleById(project, id.toUpperCase());
  if (!r) { console.error(`no rule ${id} in ${project.pkg.name}@${project.pkg.version}`); return 1; }
  console.log(`${r.id}  [${r.group}]  severity: ${r.severity}  enforced by: ${r.mechanism}${r.tool ? ':' + r.tool : ''}`);
  console.log(`\n${r.rule}\n`);
  if (r.note) console.log(`note: ${r.note}\n`);
  if (r.isolation) {
    const own = project.header?.isolation;
    const here = own ? (r.isolation.includes(own) ? ` — applies here (isolation: ${own})` : ` — does not apply here (isolation: ${own})`) : '';
    console.log(`applies under isolation: ${r.isolation.join(', ')}${here}\n`);
  }
  console.log(`doc: https://github.com/laserjm/conventions/blob/v${project.pkg.version}/${r.doc}`);
  return 0;
}
