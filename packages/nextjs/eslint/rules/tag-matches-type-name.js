// NX-ERR-02 / NX-NAME-22 / NX-NAME-62: in `type X = { _tag: 'Y' }` and `interface X { _tag: 'Y' }`, X === Y.
// Stays in ESLint because it compares two captured texts, which ast-grep cannot.

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
    function check(name, members) {
      for (const m of members) {
        if (m.type !== 'TSPropertySignature' || !m.key || m.key.type !== 'Identifier' || m.key.name !== '_tag') continue;
        const t = m.typeAnnotation && m.typeAnnotation.typeAnnotation;
        if (!t || t.type !== 'TSLiteralType' || !t.literal || typeof t.literal.value !== 'string') continue;
        if (t.literal.value !== name) context.report({ node: t, messageId: 'mismatch', data: { type: name, tag: t.literal.value } });
      }
    }
    return {
      TSTypeAliasDeclaration(node) {
        const ann = node.typeAnnotation;
        if (ann && ann.type === 'TSTypeLiteral') check(node.id.name, ann.members);
      },
      TSInterfaceDeclaration(node) {
        check(node.id.name, node.body.body);
      },
    };
  },
};
