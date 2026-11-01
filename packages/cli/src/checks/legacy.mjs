import { files, finding, adopted } from './util.mjs';

/** NX-MIG-03: every legacy folder is in the Legacy table; a migrating module carries MIGRATING.md. */
export async function legacy(project) {
  const out = [];
  if (!project.header || !adopted(project, 'NX-MIG-03')) return out;
  const rows = project.legacyRows;
  for (const g of project.header.legacy) {
    const base = g.replace(/\/?\*\*.*$/, '').replace(/\/!\(.*$/, '').replace(/\/$/, '');
    if (!rows.some((r) => r.folder.replace(/\/\*\*$/, '').replace(/\/$/, '') === base || r.folder === g)) {
      out.push(finding(project, 'NX-MIG-03', `legacy glob '${g}' has no row in the Legacy table of ARCHITECTURE.md`, { file: 'ARCHITECTURE.md', check: 'legacy-table' }));
    }
  }
  for (const r of rows) {
    if (!r.module || !/migrat/i.test(r.status ?? '')) continue;
    const mod = r.module.replace(/`/g, '').replace(/^modules\//, '').replace(/\/$/, '');
    if (!mod) continue;
    const hasModule = (await files(project.appRoot, [`modules/${mod}/**`])).length > 0;
    const hasMigrating = (await files(project.appRoot, [`modules/${mod}/MIGRATING.md`])).length > 0;
    if (hasModule && !hasMigrating) out.push(finding(project, 'NX-MIG-03', `modules/${mod} replaces legacy '${r.folder}' and is still migrating: add modules/${mod}/MIGRATING.md`, { file: `modules/${mod}`, check: 'migrating-file' }));
  }
  return out;
}
