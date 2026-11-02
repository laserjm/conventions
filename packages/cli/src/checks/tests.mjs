import path from 'node:path';
import { dirs, files, finding, adopted } from './util.mjs';

/** NX-TEST-01 unit test per use case, NX-TEST-02 integration test per repository (NX-AUTH-03: ownership.mjs). */
export async function tests(project) {
  const out = [];
  const m = project.manifest.module;
  for (const dir of await dirs(project.appRoot, project.manifest.modules)) {
    if (adopted(project, 'NX-TEST-01')) {
      for (const uc of await files(project.appRoot, [`${dir}/${m.useCases}`], ['**/*.test.ts', '**/__fakes__/**'])) {
        if (m.useCaseExclude.includes(path.basename(uc))) continue;
        const test = uc.replace(/\.ts$/, m.unitTestSuffix);
        if (!(await files(project.appRoot, [test])).length) out.push(finding(project, 'NX-TEST-01', `use case ${path.basename(uc)} has no ${path.basename(test)} next to it`, { file: uc, check: 'use-case-test' }));
      }
    }
    for (const repo of await files(project.appRoot, [`${dir}/${m.repositories}`])) {
      const test = repo.replace(/\.ts$/, m.integrationTestSuffix);
      const exists = (await files(project.appRoot, [test])).length > 0;
      if (adopted(project, 'NX-TEST-02') && !exists) out.push(finding(project, 'NX-TEST-02', `repository ${path.basename(repo)} has no ${path.basename(test)}`, { file: repo, check: 'repository-test' }));
    }
  }
  return out;
}
