import path from 'node:path';
import { files, finding, adopted, read } from './util.mjs';

/** NX-STR-04: a route-local component (`_components/`) is imported by one route only. */
export async function routeLocal(project) {
  const out = [];
  if (!adopted(project, 'NX-STR-04')) return out;
  const importers = new Map();
  for (const f of await files(project.appRoot, ['app/**/*.{ts,tsx}'])) {
    const src = read(project.appRoot, f);
    for (const m of src.matchAll(/from\s+['"]([^'"]*_components\/[^'"]+)['"]/g)) {
      const target = m[1].startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1])) : m[1].replace(/^@\//, '');
      const owner = target.slice(0, target.indexOf('_components'));
      if (!f.startsWith(owner)) out.push(finding(project, 'NX-STR-04', `${f} imports route-local ${target} from another route; move it to modules/<x>/components/ or components/ui/`, { file: f, check: 'route-local-components' }));
      importers.set(target, (importers.get(target) ?? new Set()).add(owner));
    }
  }
  return out;
}
