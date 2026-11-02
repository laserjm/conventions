// One run of every linter the profile uses, output unified: { id, severity, file, line, message, tool }.
// Legacy folders (ARCHITECTURE.md `legacy:`) get the layer rules only (NX-LAYER-10): findings of the
// exempt rulesets are dropped there. Rulesets not adopted are dropped everywhere. Findings of the
// project's other ESLint plugins (framework presets, react-hooks) are kept as id `ESLINT`, so this
// is the one lint command a project runs: Deviations rows and legacy exemptions apply here, and
// nothing ESLint reports is lost (#23).
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadProject, changedFiles, resolveFrom } from '../project.mjs';
import { print, exitCode } from '../report.mjs';
import { applyPolicy } from '../policy.mjs';

const ID = /\b([A-Z]{2}-[A-Z]+-\d{2})\b/;

export async function lint({ cwd, paths = [], changed, json, single }) {
  const project = await loadProject(cwd);
  const root = project.appRoot;
  let targets = paths.length ? paths.map((p) => path.relative(root, path.resolve(cwd, p)) || '.') : changed ? (changedFiles(root) ?? ['.']).filter((f) => /\.(ts|tsx|mts)$/.test(f)) : ['.'];
  if (changed && !targets.length) { print([], { json, title: 'conventions lint (no changed files)' }); return 0; }
  const findings = [];
  if (project.manifest.lint.eslint) findings.push(...(await runEslint(project, targets)));
  if (project.manifest.lint.astGrep) findings.push(...runAstGrep(project, targets));
  if (project.manifest.lint.lsLint && !single) findings.push(...runLsLint(project));
  const filtered = applyPolicy(project, findings);
  print(filtered, { json, title: `conventions lint (${project.profile} ${project.pkg.version})` });
  return exitCode(filtered);
}

async function runEslint(project, targets) {
  let ESLint;
  try { ({ ESLint } = await import(resolveFrom(project.appDir, 'eslint'))); }
  catch { return [{ id: 'NX-MIG-04', severity: 'warn', message: 'eslint is not installed in the app; the ESLint-enforced rules did not run', tool: 'eslint' }]; }
  const eslint = new ESLint({ cwd: project.appDir });
  const results = await eslint.lintFiles(targets.map((t) => path.join(project.appRoot, t)));
  const out = [];
  for (const r of results) {
    for (const m of r.messages) {
      if (!m.ruleId && /Unused eslint-disable directive/.test(m.message)) continue;
      const id = ID.exec(m.message)?.[1] ?? ESLINT_IDS[m.ruleId] ?? (m.fatal ? 'PARSE' : 'ESLINT');
      // another plugin's finding names its rule, since it carries no convention id
      const message = id === 'ESLINT' && m.ruleId ? `${m.ruleId}: ${m.message}` : m.message;
      out.push({ id, severity: m.severity === 2 ? 'error' : 'warn', file: path.relative(project.appRoot, r.filePath), line: m.line, message, tool: m.ruleId ?? 'eslint' });
    }
  }
  return out;
}

const ESLINT_IDS = {
  'boundaries/no-unknown-files': 'NX-STR-02',
  'import-x/no-cycle': 'NX-LAYER-09',
  'nx-ts/naming-convention': 'NX-NAME-02',
  'nx-ts/consistent-type-assertions': 'NX-TYPE-02',
};

function runAstGrep(project, targets) {
  const bin = resolveBin(project.appDir, '@ast-grep/cli', 'ast-grep');
  const config = path.join(project.pkgRoot, project.manifest.lint.astGrep);
  let raw;
  try {
    raw = execFileSync(bin, ['scan', '-c', config, '--json', ...targets], { cwd: project.appRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { raw = e.stdout?.toString() ?? '[]'; if (!raw.trim().startsWith('[')) throw new Error(`ast-grep failed: ${e.stderr}`); }
  return JSON.parse(raw || '[]').map((m) => ({
    id: ID.exec(m.message)?.[1] ?? m.ruleId.slice(0, 11).toUpperCase(),
    severity: m.severity === 'error' ? 'error' : 'warn',
    file: m.file, line: m.range.start.line + 1, message: m.message, tool: m.ruleId,
  }));
}

function runLsLint(project) {
  const bin = resolveBin(project.appDir, '@ls-lint/ls-lint', 'ls-lint');
  const config = path.join(project.pkgRoot, project.manifest.lint.lsLint);
  let raw = '';
  try { execFileSync(bin, ['--config', config], { cwd: project.appRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { raw = (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? ''); }
  return raw.split('\n').filter((l) => / failed for /.test(l)).map((l) => l.split(' failed for ')[0].trim()).filter((file) => !file.split('/').some((seg) => seg.startsWith('.'))).map((file) => {
    const l = raw.split('\n').find((x) => x.startsWith(file + ' failed for ')) ?? file;
    const id = /^modules\/[^/]+\/[^/]+\.tsx?$/.test(file) ? 'NX-STR-02' : /^app\//.test(file) ? 'NX-NAME-11' : /\.(test|spec|integration\.test)\.tsx?$/.test(file) ? 'NX-NAME-70' : 'NX-NAME-01';
    return { id, severity: 'error', file, message: `${id}: ${l.trim()}`, tool: 'ls-lint' };
  });
}

/** The tool's executable: the app's copy if installed there, else the CLI's own dependency, else PATH. */
function resolveBin(dir, pkg, name) {
  for (const base of [dir, path.dirname(fileURLToPath(import.meta.url))]) {
    try {
      const pkgJson = createRequire(path.join(base, 'noop.js')).resolve(`${pkg}/package.json`);
      const bin = JSON.parse(readFileSync(pkgJson, 'utf8')).bin;
      return path.join(path.dirname(pkgJson), typeof bin === 'string' ? bin : bin[name]);
    } catch { /* next */ }
  }
  return name;
}
