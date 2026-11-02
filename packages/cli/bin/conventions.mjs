#!/usr/bin/env node
import { main } from '../src/index.mjs';
import { UsageError } from '../src/project.mjs';
main(process.argv.slice(2)).then((code) => process.exit(code ?? 0), (e) => { console.error(e instanceof UsageError ? e.message : e?.stack ?? e); process.exit(2); });
