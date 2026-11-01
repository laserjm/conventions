import { loadProject, changedFiles } from '../project.mjs';
import { checks } from '../checks/index.mjs';
import { print, exitCode } from '../report.mjs';

export async function check({ cwd, changed, json }) {
  const project = await loadProject(cwd);
  let findings = [];
  for (const c of checks) findings.push(...(await c(project)));
  if (changed) {
    const list = changedFiles(project.appRoot);
    if (list) {
      const touched = new Set(list);
      const touchedModules = new Set(list.map((f) => /^(modules\/[^/]+)/.exec(f)?.[1]).filter(Boolean));
      findings = findings.filter((f) => !f.file || touched.has(f.file) || f.file === 'ARCHITECTURE.md' || [...touchedModules].some((m) => f.file.startsWith(m)));
    }
  }
  print(findings, { json, title: `conventions check (${project.profile} ${project.pkg.version})` });
  return exitCode(findings);
}
