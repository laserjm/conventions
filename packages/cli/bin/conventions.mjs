#!/usr/bin/env node
import { main } from '../src/index.mjs';
main(process.argv.slice(2)).then((code) => process.exit(code ?? 0), (e) => { console.error(e?.stack ?? e); process.exit(2); });
