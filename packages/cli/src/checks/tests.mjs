import path from 'node:path';
import { dirs, files, finding, adopted, commandTest, exportName } from './util.mjs';

/**
 * NX-TEST-01 a unit test per use case, NX-TEST-02 an integration test per repository
 * (NX-AUTH-03: ownership.mjs). The module's command test (`module.commandTest`) stands in for
 * both: for a use case it names by its export name, and for a repository `commands.ts` imports.
 */
export async function tests(project) {
  const out = [];
  const m = project.manifest.module;
  for (const dir of await dirs(project.appRoot, project.manifest.modules)) {
    const cmd = await commandTest(project, dir);
    if (adopted(project, 'NX-TEST-01')) {
      for (const uc of await files(project.appRoot, [`${dir}/${m.useCases}`], ['**/*.test.ts', '**/__fakes__/**'])) {
        if (m.useCaseExclude.includes(path.basename(uc))) continue;
        const test = uc.replace(/\.ts$/, m.unitTestSuffix);
        if ((await files(project.appRoot, [test])).length) continue;
        const name = exportName(uc);
        if (cmd && new RegExp(`\\b${name}\\b`).test(cmd.text)) continue;
        const alt = m.commandTest ? ` nor a call to ${name} in the module's ${m.commandTest}` : '';
        out.push(finding(project, 'NX-TEST-01', `use case ${path.basename(uc)} has neither ${path.basename(test)} next to it${alt}`, { file: uc, check: 'use-case-test' }));
      }
    }
    if (!adopted(project, 'NX-TEST-02')) continue;
    for (const repo of await files(project.appRoot, [`${dir}/${m.repositories}`])) {
      const test = repo.replace(/\.ts$/, m.integrationTestSuffix);
      if ((await files(project.appRoot, [test])).length) continue;
      if (cmd?.repositories.has(repo)) continue;
      const commands = m.commandTest?.replace(m.integrationTestSuffix, '.ts');
      const alt = !m.commandTest ? ''
        : cmd ? `; the module's ${m.commandTest} covers it only once ${commands} imports it`
        : `, and the module has no ${m.commandTest} (which covers a repository ${commands} imports)`;
      out.push(finding(project, 'NX-TEST-02', `repository ${path.basename(repo)} has no ${path.basename(test)}${alt}`, { file: repo, check: 'repository-test' }));
    }
  }
  return out;
}
