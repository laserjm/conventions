import { finding } from './util.mjs';

export async function header(project) {
  const out = [];
  const h = project.header;
  if (!h) return [finding(project, 'NX-MIG-04', 'ARCHITECTURE.md has no conventions header; add the yaml block from the template', { check: 'header' })];
  if (h.conventions !== project.pkg.version) {
    out.push(finding(project, 'NX-MIG-04', `ARCHITECTURE.md pins conventions ${h.conventions} but ${project.pkg.name}@${project.pkg.version} is installed; run \`conventions sync\``, { check: 'header', file: 'ARCHITECTURE.md' }));
  }
  if (h.profile !== project.profile) out.push(finding(project, 'NX-MIG-04', `header profile '${h.profile}' does not match the installed profile '${project.profile}'`, { check: 'header', file: 'ARCHITECTURE.md' }));
  const values = project.manifest.isolation?.values;
  if (values) {
    if (!h.isolation) out.push(finding(project, 'NX-MIG-04', `the header has no \`isolation:\`; say who owns a row: ${values.join(', ')} (tenant: a workspace or organisation, owner: the signed-in user, none: no owned data)`, { check: 'header', file: 'ARCHITECTURE.md' }));
    else if (!values.includes(h.isolation)) out.push(finding(project, 'NX-MIG-04', `unknown isolation '${h.isolation}' (known: ${values.join(', ')})`, { check: 'header', file: 'ARCHITECTURE.md' }));
  }
  const groups = project.catalogue.rulesets ?? [];
  for (const g of h.rulesets ?? []) if (!groups.includes(g)) out.push(finding(project, 'NX-MIG-04', `unknown ruleset '${g}' (known: ${groups.join(', ')})`, { check: 'header', file: 'ARCHITECTURE.md' }));
  const bindings = groups.filter((g) => ['drizzle', 'supabase', 'zod', 'next-safe-action'].includes(g));
  for (const b of h.bindings) if (!bindings.includes(b)) out.push(finding(project, 'NX-MIG-04', `unknown binding '${b}' (known: ${bindings.join(', ')})`, { check: 'header', file: 'ARCHITECTURE.md' }));
  return out;
}
