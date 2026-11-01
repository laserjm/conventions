// NX-ERR-02 / NX-NAME-62: in `type X = { _tag: 'Y' }`, X === Y.

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'NX-ERR-02: a tagged type’s `_tag` literal equals the type name', url: 'docs/nextjs/architecture.md#errors' },
    schema: [],
    messages: {
      mismatch: "NX-ERR-02: type '{{type}}' has _tag '{{tag}}'; the tag must equal the type name.",
    },
  },
  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        const ann = node.typeAnnotation;
        if (!ann || ann.type !== 'TSTypeLiteral') return;
        for (const m of ann.members) {
          if (m.type !== 'TSPropertySignature' || !m.key || m.key.type !== 'Identifier' || m.key.name !== '_tag') continue;
          const t = m.typeAnnotation && m.typeAnnotation.typeAnnotation;
          if (!t || t.type !== 'TSLiteralType' || !t.literal || typeof t.literal.value !== 'string') continue;
          if (t.literal.value !== node.id.name) {
            context.report({ node: t, messageId: 'mismatch', data: { type: node.id.name, tag: t.literal.value } });
          }
        }
      },
    };
  },
};
