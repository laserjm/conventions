import path from 'node:path';
import { dirs, files, finding, adopted, read } from './util.mjs';

/**
 * Owned data, under `isolation: tenant` or `owner` (the profile's `isolation` map names the
 * parameter, type and helper of each):
 * - NX-AUTH-05 the owner's id is typed with its brand in ports and repositories, never `string`;
 *   the compiler then refuses a plain string everywhere else.
 * - NX-AUTH-03 a repository that takes the owner's id has an integration test calling the
 *   isolation helper.
 * Under `isolation: none`, or without the key, nothing here applies.
 */
export async function ownership(project) {
  const iso = project.manifest.isolation;
  const spec = iso?.[project.header?.isolation];
  if (!spec?.param) return [];
  const out = [];
  const m = project.manifest.module;
  const plain = new RegExp(`\\b${spec.param}\\??\\s*:\\s*string\\b`);
  const owned = new RegExp(`\\b(${spec.param}|${spec.type})\\b`);
  for (const dir of await dirs(project.appRoot, project.manifest.modules)) {
    if (adopted(project, 'NX-AUTH-05')) {
      for (const file of await files(project.appRoot, iso.files.map((f) => `${dir}/${f}`))) {
        read(project.appRoot, file).split('\n').forEach((line, i) => {
          if (plain.test(line)) out.push(finding(project, 'NX-AUTH-05', `\`${spec.param}\` is typed \`string\`; type it \`${spec.type}\` so the compiler refuses a plain string (isolation: ${project.header.isolation})`, { file, line: i + 1, check: 'owner-id-type' }));
        });
      }
    }
    if (!adopted(project, 'NX-AUTH-03')) continue;
    for (const repo of await files(project.appRoot, [`${dir}/${m.repositories}`])) {
      const test = repo.replace(/\.ts$/, m.integrationTestSuffix);
      if (!(await files(project.appRoot, [test])).length) continue; // NX-TEST-02 reports it
      if (owned.test(read(project.appRoot, repo)) && !read(project.appRoot, test).includes(`${iso.helper}(`)) {
        out.push(finding(project, 'NX-AUTH-03', `${path.basename(test)} must call ${iso.helper}() from the testing package: the repository takes the owner's id (${spec.param})`, { file: test, check: 'isolation-test' }));
      }
    }
  }
  return out;
}
