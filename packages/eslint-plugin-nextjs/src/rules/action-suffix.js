// NX-NAME-50: every export of actions.ts ends in `Action` (revalidate<Noun> excepted);
// nothing outside actions.ts ends in `Action`.
import { isActionsFile, exportedNames } from '../util.js';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'NX-NAME-50: `Action` suffix only and always in actions.ts', url: 'docs/nextjs/naming.md#ui-layer' },
    schema: [],
    messages: {
      missingSuffix: "NX-NAME-50: export '{{name}}' in actions.ts must end in 'Action' (or be revalidate<Noun>).",
      misplacedSuffix: "NX-NAME-50: '{{name}}' ends in 'Action' but is not exported from actions.ts.",
    },
  },
  create(context) {
    const inActions = isActionsFile(context.filename);
    return {
      'ExportNamedDeclaration, ExportDefaultDeclaration'(node) {
        for (const { name, node: idNode } of exportedNames(node)) {
          const endsInAction = /Action$/.test(name);
          const isRevalidate = /^revalidate[A-Z]/.test(name);
          if (inActions && !endsInAction && !isRevalidate) {
            context.report({ node: idNode, messageId: 'missingSuffix', data: { name } });
          }
          if (!inActions && endsInAction) {
            context.report({ node: idNode, messageId: 'misplacedSuffix', data: { name } });
          }
        }
      },
    };
  },
};
