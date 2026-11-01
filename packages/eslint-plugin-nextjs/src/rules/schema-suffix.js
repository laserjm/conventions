// NX-NAME-60 / NX-ZOD-02: a `z.*` schema declaration is camelCase + `Schema`.

function isZodCall(init) {
  let n = init;
  while (n) {
    if (n.type === 'CallExpression') n = n.callee;
    else if (n.type === 'MemberExpression') {
      if (n.object.type === 'Identifier' && n.object.name === 'z') return true;
      n = n.object;
    } else return false;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'NX-NAME-60: contract schemas end in `Schema`', url: 'docs/nextjs/naming.md#contracts--types' },
    schema: [],
    messages: {
      suffix: "NX-NAME-60: '{{name}}' is a schema; name it camelCase + 'Schema' (e.g. '{{suggested}}').",
    },
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !node.init || !isZodCall(node.init)) return;
        // Only module-level declarations are contracts; local helpers inside functions are left alone.
        const parent = node.parent && node.parent.parent;
        const top = parent && (parent.type === 'Program' || parent.type === 'ExportNamedDeclaration');
        if (!top) return;
        const name = node.id.name;
        if (/Schema$/.test(name) && /^[a-z]/.test(name)) return;
        const base = name.replace(/Schema$/, '');
        const suggested = base.charAt(0).toLowerCase() + base.slice(1) + 'Schema';
        context.report({ node: node.id, messageId: 'suffix', data: { name, suggested } });
      },
    };
  },
};
