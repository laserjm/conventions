import path from 'node:path';
import { dirs, files, finding, adopted, read, commandTest } from './util.mjs';

/**
 * Owned data, under `isolation: tenant` or `owner` (the profile's `isolation` map names the
 * parameter, type and helper of each):
 * - NX-AUTH-05 the owner's id is typed with its brand in ports and repositories, never `string`;
 *   the compiler then refuses a plain string everywhere else.
 * - NX-AUTH-03 a repository that takes the owner's id has an integration test calling the
 *   isolation helper: its own, or the module's command test when that covers it (NX-TEST-02).
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
    const cmd = await commandTest(project, dir);
    for (const repo of await files(project.appRoot, [`${dir}/${m.repositories}`])) {
      if (!owned.test(read(project.appRoot, repo))) continue;
      const test = repo.replace(/\.ts$/, m.integrationTestSuffix);
      const own = (await files(project.appRoot, [test])).length > 0;
      if (!own && !cmd?.repositories.has(repo)) continue; // NX-TEST-02 reports it
      const [file, text] = own ? [test, read(project.appRoot, test)] : [cmd.file, cmd.text];
      if (text.includes(`${iso.helper}(`)) continue;
      const how = own
        ? `the repository takes the owner's id (${spec.param})`
        : `it covers ${path.basename(repo)}, which takes the owner's id (${spec.param}); arrange, read and change through commands and queries for two owners, or give the repository its own ${path.basename(test)}`;
      out.push(finding(project, 'NX-AUTH-03', `${path.basename(file)} must call ${iso.helper}() from the testing package: ${how}`, { file, check: 'isolation-test' }));
    }
  }
  return out;
}
