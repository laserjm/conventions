// Writes what a project needs and nothing it already has: ARCHITECTURE.md (header + tables),
// eslint.config.mjs, CLAUDE.md/AGENTS.md pointers, the CI workflow, package.json scripts.
import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { resolveFrom, UsageError } from '../project.mjs';

export async function init({ cwd, profile, appRoot = '.', force = false }) {
  if (!profile) throw new UsageError('usage: conventions init --profile <name> [--app-root .]');
  const pkgName = `@conventions/${profile}`;
  let pkgRoot;
  try { pkgRoot = path.dirname(resolveFrom(cwd, `${pkgName}/profile.json`)); }
  catch { throw new UsageError(`install ${pkgName} first (it ships the profile)`); }
  const pkg = JSON.parse(readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(path.join(pkgRoot, 'profile.json'), 'utf8'));
  const tpl = path.join(pkgRoot, 'templates');
  const written = [], kept = [];
  const put = (rel, content) => {
    const file = path.join(cwd, rel);
    if (existsSync(file) && !force) { kept.push(rel); return; }
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
    written.push(rel);
  };
  const t = (name) => readFileSync(path.join(tpl, name), 'utf8').replaceAll('{{version}}', pkg.version).replaceAll('{{profile}}', profile).replaceAll('{{appRoot}}', appRoot);

  put('ARCHITECTURE.md', t('ARCHITECTURE.md'));
  put('eslint.config.mjs', t('eslint.config.mjs'));
  put('CLAUDE.md', t('CLAUDE.md'));
  put('AGENTS.md', t('AGENTS.md'));
  // CI lives at the repository root; in a monorepo the job runs in the app's folder
  const top = gitTop(cwd);
  const appRel = path.relative(top, cwd).split(path.sep).join('/');
  const workflow = t('conventions.yml').replace('{{workingDirectory}}', appRel ? `\n    defaults:\n      run:\n        working-directory: ${appRel}` : '');
  const wfPath = path.join(top, '.github/workflows/conventions.yml');
  if (existsSync(wfPath) && !force) kept.push(path.relative(cwd, wfPath));
  else { mkdirSync(path.dirname(wfPath), { recursive: true }); writeFileSync(wfPath, workflow); written.push(path.relative(cwd, wfPath)); }
  put(path.join(manifest.inventory), t('db-inventory.md'));
  for (const s of manifest.starters ?? []) {
    const target = path.join(appRoot, s);
    if (!existsSync(path.join(cwd, target)) || force) { mkdirSync(path.dirname(path.join(cwd, target)), { recursive: true }); cpSync(path.join(pkgRoot, 'starters', s), path.join(cwd, target)); written.push(target); } else kept.push(target);
  }
  // package.json scripts
  const pj = path.join(cwd, 'package.json');
  if (existsSync(pj)) {
    const json = JSON.parse(readFileSync(pj, 'utf8'));
    json.scripts ??= {};
    for (const [k, v] of Object.entries({ 'conventions': 'conventions lint && conventions check', 'conventions:lint': 'conventions lint', 'conventions:check': 'conventions check' })) if (!json.scripts[k]) json.scripts[k] = v;
    writeFileSync(pj, JSON.stringify(json, null, 2) + '\n');
    written.push('package.json (scripts)');
  }
  console.log(`conventions ${profile} ${pkg.version}\n  written: ${written.join(', ') || '—'}\n  kept:    ${kept.join(', ') || '—'}`);
  console.log(`\nNext: fill the ARCHITECTURE.md header (bindings, app-root, legacy), then \`conventions lint && conventions check\`.`);
  return 0;
}

function gitTop(cwd) {
  try { return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return cwd; }
}
