// PostToolUse (Edit|Write): lint the file just written. Exit 2 feeds the findings back to the agent.
import { readStdin, appDirOf, conventions } from './common.mjs';

const input = readStdin();
const file = input.tool_input?.file_path;
if (!file || !/\.(ts|tsx|mts)$/.test(file)) process.exit(0);
const appDir = appDirOf(file);
if (!appDir) process.exit(0);
const r = conventions(appDir, ['lint-file', file]);
if (!r || r.code === 0) process.exit(0);
process.stderr.write(`conventions lint found rule violations in ${file}. Fix each one (read the rule with \`npx conventions explain <ID>\`); do not disable rules.\n${r.out}`);
process.exit(2);
