// NX-LAYER-05: server.ts and queries.ts import 'server-only' so a client import fails the build.
import { isServerFile, isQueriesFile } from '../util.js';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: "NX-LAYER-05: server.ts and queries.ts start with import 'server-only'", url: 'docs/nextjs/architecture.md#layer-rules' },
    schema: [],
    messages: { missing: "NX-LAYER-05: {{file}} must import 'server-only'." },
  },
  create(context) {
    const server = isServerFile(context.filename);
    const queries = isQueriesFile(context.filename);
    if (!server && !queries) return {};
    let found = false;
    return {
      ImportDeclaration(node) { if (node.source.value === 'server-only') found = true; },
      'Program:exit'(program) {
        if (!found) context.report({ node: program, messageId: 'missing', data: { file: server ? 'server.ts' : 'queries.ts' } });
      },
    };
  },
};
