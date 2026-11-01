// NX-CACHE-02: revalidateTag / cacheTag take a *_TAGS member, never a literal.
const CALLEES = new Set(['revalidateTag', 'cacheTag', 'unstable_cacheTag']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'NX-CACHE-02: cache tags come from exported *_TAGS constants', url: 'docs/nextjs/architecture.md#caching--revalidation' },
    schema: [],
    messages: {
      inline: 'NX-CACHE-02: {{callee}}() takes a tag from an exported `<NOUN>_TAGS` constant, never an inline string.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        const name = callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' && callee.property.type === 'Identifier' ? callee.property.name : undefined;
        if (!name || !CALLEES.has(name)) return;
        const arg = node.arguments[0];
        if (!arg) return;
        if (arg.type === 'Literal' || arg.type === 'TemplateLiteral') {
          context.report({ node: arg, messageId: 'inline', data: { callee: name } });
        }
      },
    };
  },
};
