// Locates the project: its ARCHITECTURE.md header, the installed profile package and its catalogue.
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { execSync } from 'node:child_process';
import * as arch from './architecture.mjs';

export async function loadProject(cwd, { profile } = {}) {
  const found = arch.findArchitecture(cwd);
  const header = found?.header;
  const profileName = profile ?? header?.profile;
  if (!profileName) throw new UsageError(`no ARCHITECTURE.md with a conventions header above ${cwd}; run \`conventions init --profile <name>\``);
  const appDir = found?.dir ?? cwd;
  const pkgName = `@conventions/${profileName}`;
  let pkgRoot;
  try { pkgRoot = path.dirname(resolveFrom(appDir, `${pkgName}/profile.json`)); }
  catch { throw new UsageError(`profile package ${pkgName} is not installed in ${appDir}`); }
  const pkg = JSON.parse(readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(path.join(pkgRoot, 'profile.json'), 'utf8'));
  const catalogue = YAML.parse(readFileSync(path.join(pkgRoot, 'rules', `${profileName}.yaml`), 'utf8'));
  const appRoot = path.resolve(appDir, header?.appRoot ?? '.');
  return { cwd, appDir, appRoot, file: found?.file, header, markdown: found ? readFileSync(found.file, 'utf8') : '', profile: profileName, pkgRoot, pkg, manifest, catalogue, arch };
}

export function resolveFrom(dir, spec) {
  return createRequire(path.join(dir, 'noop.js')).resolve(spec);
}

export class UsageError extends Error {}

/** Files changed against the default branch plus the working tree, relative to `dir`. */
export function changedFiles(dir) {
  try {
    const base = execSync('git merge-base HEAD origin/HEAD 2>/dev/null || git merge-base HEAD main 2>/dev/null || echo HEAD~1', { cwd: dir, encoding: 'utf8' }).trim();
    const out = execSync(`git diff --name-only ${base} -- . && git ls-files --others --exclude-standard -- .`, { cwd: dir, encoding: 'utf8' });
    const top = execSync('git rev-parse --show-toplevel', { cwd: dir, encoding: 'utf8' }).trim();
    return [...new Set(out.split('\n').filter(Boolean))].map((f) => path.relative(dir, path.join(top, f)));
  } catch {
    return undefined;
  }
}

export function ruleById(project, id) {
  return project.catalogue.rules.find((r) => r.id === id);
}

export function existsIn(dir, rel) {
  return existsSync(path.join(dir, rel));
}
