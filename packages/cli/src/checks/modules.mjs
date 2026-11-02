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
      const domain = await has('domain/**'), application = await has('application/**');
      // a domain other modules judge with, and no writes of its own, needs no use case; an anemic module's commands.ts may wrap repository calls
      const writes = (await has('actions.ts')) || (await has('commands.ts'));
      if (domain && !application && writes) out.push(finding(project, 'NX-RICH-01', `module '${name}' has domain/ and writes (actions.ts or commands.ts) but no application/: a rich module writes through use cases that call its domain`, { file: dir, check: 'rich-shape' }));
    }
  }
  return out;
}
