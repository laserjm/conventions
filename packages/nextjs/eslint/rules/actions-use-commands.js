// NX-LAYER-11: once a module has commands.ts, its use cases are wired there and actions.ts
// reaches them only through it. actions.ts then imports no value from its own application/
// or infra/, relative or through the `@/` alias; type-only imports are fine.
// Stays in ESLint because it looks at the file system (does commands.ts exist?).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { isActionsFile, moduleOf } from '../util.js';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'NX-LAYER-11: actions.ts calls commands.ts when the module has one', url: 'docs/nextjs/architecture.md#layer-rules' },
    schema: [],
    messages: {
      viaCommands: "NX-LAYER-11: this module has commands.ts; import the wired command from './commands' instead of '{{source}}'.",
    },
  },
  create(context) {
    const file = context.physicalFilename ?? context.filename;
    if (!isActionsFile(file)) return {};
    const dir = path.dirname(file);
    if (!existsSync(path.join(dir, 'commands.ts')) && !existsSync(path.join(dir, 'commands.tsx'))) return {};
    const mod = moduleOf(file);
    const ownLayer = new RegExp(`^(\\./|(\\.\\./)+modules/${mod}/|@/modules/${mod}/)(application|infra)(/|$)`);
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        if (!ownLayer.test(source)) return;
        if (node.importKind === 'type') return;
        const specifiers = node.specifiers ?? [];
        if (specifiers.length > 0 && specifiers.every((s) => s.importKind === 'type')) return;
        context.report({ node: node.source, messageId: 'viaCommands', data: { source } });
      },
    };
  },
};
