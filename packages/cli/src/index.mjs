import { check } from './commands/check.mjs';
import { lint } from './commands/lint.mjs';
import { explain } from './commands/explain.mjs';
import { init } from './commands/init.mjs';
import { sync } from './commands/sync.mjs';

const HELP = `conventions — architecture conventions as a versioned, checkable product

  conventions check [--changed] [--json]        structural checks (modules, tests, header, deviations, inventory)
  conventions lint [paths…] [--changed] [--json] eslint + ast-grep + ls-lint in one run, messages carry rule ids
  conventions lint-file <file>                   the same for one file (editor and agent hooks)
  conventions explain <RULE-ID>                  print a catalogue entry
  conventions init --profile <name> --isolation <tenant|owner|none> [--app-root .]
                                                 write ARCHITECTURE.md, configs and CI for a project
  conventions sync                               align the header version and generated configs with the installed profile

Run from the app's folder (the one with ARCHITECTURE.md). Options: --cwd <dir>.`;

export async function main(argv) {
  const { command, args, flags } = parse(argv);
  if (!command || flags.help || command === 'help') { console.log(HELP); return 0; }
  const cwd = flags.cwd ? String(flags.cwd) : process.cwd();
  switch (command) {
    case 'check': return check({ cwd, changed: !!flags.changed, json: !!flags.json });
    case 'lint': return lint({ cwd, paths: args, changed: !!flags.changed, json: !!flags.json });
    case 'lint-file': return lint({ cwd, paths: args, json: !!flags.json, single: true });
    case 'explain': return explain({ cwd, id: args[0] });
    case 'init': return init({ cwd, profile: flags.profile ? String(flags.profile) : undefined, isolation: flags.isolation ? String(flags.isolation) : undefined, appRoot: flags['app-root'] ? String(flags['app-root']) : '.', force: !!flags.force });
    case 'sync': return sync({ cwd });
    default: console.error(`unknown command: ${command}\n\n${HELP}`); return 2;
  }
}

function parse(argv) {
  const flags = {}, args = [];
  let command;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--') && ['cwd', 'profile', 'app-root', 'isolation'].includes(k)) flags[k] = argv[++i];
      else flags[k] = true;
    } else if (!command) command = a;
    else args.push(a);
  }
  return { command, args, flags };
}
