// Aligns ARCHITECTURE.md with the installed profile version. Everything else a project uses is
// read from the installed package at run time, so a version bump is: install, sync, commit.
import { writeFileSync } from 'node:fs';
import { loadProject } from '../project.mjs';

export async function sync({ cwd }) {
  const project = await loadProject(cwd);
  const { header, pkg, file, markdown } = project;
  if (header.conventions === pkg.version) { console.log(`ARCHITECTURE.md already pins ${pkg.version}`); return 0; }
  writeFileSync(file, project.arch.withConventionsVersion(markdown, pkg.version));
  console.log(`ARCHITECTURE.md: conventions ${header.conventions} → ${pkg.version}. Read the CHANGELOG for rules that became error.`);
  return 0;
}
