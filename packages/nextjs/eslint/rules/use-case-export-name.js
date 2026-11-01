// NX-NAME-03: application/<verb>-<noun>.ts exports exactly one value, named camelCase(file).
// Stays in ESLint because it compares the file name with an identifier, which ast-grep cannot.
import { useCaseFile, camelCase, exportedNames } from '../util.js';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'NX-NAME-03: one value export per use-case file, named after the file', url: 'docs/nextjs/naming.md#general-rules' },
    schema: [],
    messages: {
      wrongName: "NX-NAME-03: '{{file}}.ts' must export '{{expected}}', found value export '{{name}}'.",
      tooMany: "NX-NAME-03: '{{file}}.ts' exports {{count}} values; a use-case file exports exactly one (types are fine).",
      none: "NX-NAME-03: '{{file}}.ts' exports no value; expected '{{expected}}'.",
    },
  },
  create(context) {
    const file = useCaseFile(context.filename);
    if (!file) return {};
    const expected = camelCase(file);
    const values = [];
    return {
      'ExportNamedDeclaration, ExportDefaultDeclaration'(node) {
        for (const e of exportedNames(node)) if (e.kind === 'value') values.push(e);
      },
      'Program:exit'(program) {
        if (values.length === 0) {
          context.report({ node: program, messageId: 'none', data: { file, expected } });
          return;
        }
        if (values.length > 1) {
          context.report({ node: values[1].node, messageId: 'tooMany', data: { file, count: values.length } });
        }
        for (const v of values) {
          if (v.name !== expected) {
            context.report({ node: v.node, messageId: 'wrongName', data: { file, expected, name: v.name } });
          }
        }
      },
    };
  },
};
