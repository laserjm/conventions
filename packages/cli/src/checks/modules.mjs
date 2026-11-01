import { dirs, files, finding, adopted } from './util.mjs';

/** NX-STR-07 module completeness, NX-NAME-10 module names, NX-RICH-01 shape consistency. */
export async function modules(project) {
  const out = [];
  const m = project.manifest.module;
  for (const dir of await dirs(project.appRoot, project.manifest.modules)) {
    const name = dir.split('/').pop();
    if (adopted(project, 'NX-NAME-10') && (m.bannedNames.includes(name) || !/^[a-z][a-z0-9-]*$/.test(name))) {
      out.push(finding(project, 'NX-NAME-10', `module '${name}' is a technical name; a module is a business noun`, { file: dir, check: 'module-name' }));
    }
    if (adopted(project, 'NX-STR-07')) {
      for (const req of m.required) {
        if (!(await files(project.appRoot, [`${dir}/${req}`])).length) out.push(finding(project, 'NX-STR-07', `module '${name}' has no ${req}`, { file: dir, check: 'module-complete' }));
      }
    }
    if (adopted(project, 'NX-RICH-01')) {
      const has = async (p) => (await files(project.appRoot, [`${dir}/${p}`])).length > 0;
      const domain = await has('domain/**'), application = await has('application/**'), commands = await has('commands.ts');
      if (domain && !application) out.push(finding(project, 'NX-RICH-01', `module '${name}' has domain/ but no application/: a rich module has use cases that call its domain`, { file: dir, check: 'rich-shape' }));
      if (commands && !application) out.push(finding(project, 'NX-RICH-01', `module '${name}' has commands.ts but no application/: commands wire use cases`, { file: dir, check: 'rich-shape' }));
    }
  }
  return out;
}
