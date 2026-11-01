// Stop: run the structural checks on what changed. Blocks the stop once with the findings;
// a second stop in the same turn (stop_hook_active) goes through, so the agent can report.
import { readStdin, appDirOf, conventions } from './common.mjs';

const input = readStdin();
if (input.stop_hook_active) process.exit(0);
const appDir = appDirOf(process.cwd() + '/x');
if (!appDir) process.exit(0);
const r = conventions(appDir, ['check', '--changed']);
if (!r || r.code === 0) process.exit(0);
process.stderr.write(`conventions check reports structural findings for your change. Fix them or record a deviation in ARCHITECTURE.md before finishing.\n${r.out}`);
process.exit(2);
