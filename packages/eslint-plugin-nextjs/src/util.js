import path from 'node:path';

export function normalize(filename) {
  return filename.split(path.sep).join('/');
}

export function baseName(filename) {
  return path.basename(filename);
}

export function isActionsFile(filename) {
  return /\/modules\/[^/]+\/actions\.tsx?$/.test(normalize(filename));
}

export function isIndexFile(filename) {
  return /\/modules\/[^/]+\/index\.tsx?$/.test(normalize(filename));
}

export function isServerFile(filename) {
  return /\/modules\/[^/]+\/server\.tsx?$/.test(normalize(filename));
}

export function isQueriesFile(filename) {
  return /\/modules\/[^/]+\/queries\.tsx?$/.test(normalize(filename));
}

/** application/<verb>-<noun>.ts — not ports/errors/events/index, not tests or fakes. */
export function useCaseFile(filename) {
  const f = normalize(filename);
  const m = /\/modules\/[^/]+\/application\/([a-z0-9-]+)\.ts$/.exec(f);
  if (!m) return undefined;
  const name = m[1];
  if (['ports', 'errors', 'events', 'index'].includes(name)) return undefined;
  if (/\.(test|spec|integration\.test|fake)$/.test(name)) return undefined;
  if (/\.test$/.test(name)) return undefined;
  return name;
}

export function camelCase(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function pascalCase(kebab) {
  const c = camelCase(kebab);
  return c.charAt(0).toUpperCase() + c.slice(1);
}

/** Yields { name, node, kind: 'value' | 'type' } for an export declaration. */
export function* exportedNames(node) {
  if (node.type === 'ExportDefaultDeclaration') {
    const d = node.declaration;
    if (d && d.id && d.id.name) yield { name: d.id.name, node: d.id, kind: 'value' };
    return;
  }
  if (node.exportKind === 'type') {
    for (const s of node.specifiers ?? []) yield { name: specName(s.exported), node: s.exported, kind: 'type' };
    const d = node.declaration;
    if (d && d.id) yield { name: d.id.name, node: d.id, kind: 'type' };
    return;
  }
  const d = node.declaration;
  if (d) {
    if (d.type === 'VariableDeclaration') {
      for (const decl of d.declarations) {
        for (const id of patternIds(decl.id)) yield { name: id.name, node: id, kind: 'value' };
      }
    } else if (d.id) {
      const isType = d.type === 'TSTypeAliasDeclaration' || d.type === 'TSInterfaceDeclaration';
      yield { name: d.id.name, node: d.id, kind: isType ? 'type' : 'value' };
    }
  }
  for (const s of node.specifiers ?? []) {
    yield { name: specName(s.exported), node: s.exported, kind: s.exportKind === 'type' ? 'type' : 'value' };
  }
}

function specName(n) {
  return n.type === 'Literal' ? String(n.value) : n.name;
}

function* patternIds(p) {
  if (!p) return;
  if (p.type === 'Identifier') yield p;
  else if (p.type === 'ObjectPattern') for (const prop of p.properties) yield* patternIds(prop.value ?? prop.argument);
  else if (p.type === 'ArrayPattern') for (const el of p.elements) yield* patternIds(el);
  else if (p.type === 'AssignmentPattern') yield* patternIds(p.left);
  else if (p.type === 'RestElement') yield* patternIds(p.argument);
}
