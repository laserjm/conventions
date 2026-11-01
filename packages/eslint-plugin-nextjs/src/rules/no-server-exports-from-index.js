// NX-LAYER-05 / NX-NAME-12: index.ts never re-exports infra/, queries.ts or commands.ts; server.ts never infra/.
import { isIndexFile, isServerFile } from '../util.js';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'NX-LAYER-05: index.ts is browser-safe; server-only reads and writes go through server.ts', url: 'docs/nextjs/architecture.md#layer-rules' },
    schema: [],
    messages: {
      infra: 'NX-LAYER-05: {{file}} must not export or import from infra/.',
      queries: "NX-LAYER-05: index.ts must not export queries.ts; export server-only reads from server.ts.",
      commands: "NX-LAYER-05: index.ts must not export commands.ts; export server-only writes from server.ts.",
    },
  },
  create(context) {
    const index = isIndexFile(context.filename);
    const server = isServerFile(context.filename);
    if (!index && !server) return {};
    const file = index ? 'index.ts' : 'server.ts';
    function check(node, source) {
      if (!source) return;
      const s = source.value;
      if (typeof s !== 'string') return;
      if (/^\.\/infra(\/|$)/.test(s)) context.report({ node: source, messageId: 'infra', data: { file } });
      if (index && /^\.\/queries(\.ts)?$/.test(s)) context.report({ node: source, messageId: 'queries' });
      if (index && /^\.\/commands(\.ts)?$/.test(s)) context.report({ node: source, messageId: 'commands' });
    }
    return {
      ExportNamedDeclaration(node) { check(node, node.source); },
      ExportAllDeclaration(node) { check(node, node.source); },
      ImportDeclaration(node) { check(node, node.source); },
    };
  },
};
