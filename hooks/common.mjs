import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export function readStdin() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

/** The nearest folder above `file` with an ARCHITECTURE.md carrying a conventions header. */
export function appDirOf(file) {
  let dir = path.dirname(path.resolve(file));
  for (;;) {
    const arch = path.join(dir, 'ARCHITECTURE.md');
    if (existsSync(arch) && /^conventions:\s*\S+/m.test(readFileSync(arch, 'utf8'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** Runs the project's `conventions` binary; undefined when the CLI is not installed there. */
export function conventions(appDir, args) {
  const bin = path.join(appDir, 'node_modules', '.bin', 'conventions');
  if (!existsSync(bin)) return undefined;
  const r = spawnSync(bin, args, { cwd: appDir, encoding: 'utf8', maxBuffer: 16 << 20 });
  return { code: r.status ?? 1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}
