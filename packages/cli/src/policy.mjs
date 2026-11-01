// What the project declared: rulesets not adopted, legacy folders (layer rules only) and Deviations
// rows (findings become warnings). Applied to lint and check findings alike.

/** Converts a glob (`**`, `*`, `{a,b}`, `!(x)`) to a RegExp anchored at the start of a relative path. */
export function globToRegex(glob) {
  let src = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { src += glob[i + 2] === '/' ? '(?:.*/)?' : '.*'; i += glob[i + 2] === '/' ? 2 : 1; }
    else if (c === '*') src += '[^/]*';
    else if (c === '?') src += '[^/]';
    else if (c === '{') { const end = glob.indexOf('}', i); src += '(?:' + glob.slice(i + 1, end).split(',').map(escape).join('|') + ')'; i = end; }
    else if (c === '!' && glob[i + 1] === '(') { const end = glob.indexOf(')', i); src += '(?!(?:' + glob.slice(i + 2, end).split('|').map(escape).join('|') + ')(?:/|$))[^/]+'; i = end; }
    else src += escape(c);
  }
  return new RegExp(`^${src}(?:/|$)`);
}

const escape = (s) => s.replace(/[.+^$()|[\]\\]/g, '\\$&');

export function matchesAny(file, globs) {
  return globs.some((g) => (g instanceof RegExp ? g : globToRegex(g)).test(file));
}

/**
 * @param {object} project  from loadProject
 * @param {Array<{id: string, file?: string, severity: string}>} findings
 */
export function applyPolicy(project, findings) {
  const rules = project.catalogue.rules;
  const chosen = project.header?.rulesets?.length ? new Set(project.header.rulesets) : undefined;
  const exempt = new Set(project.manifest.legacyExempt ?? []);
  const legacy = (project.header?.legacy ?? []).map(globToRegex);
  const deviations = project.deviations ?? [];
  const out = [];
  for (const f of findings) {
    const rule = rules.find((r) => r.id === f.id);
    if (rule) {
      if (chosen && !chosen.has(rule.group)) continue;
      if (f.file && exempt.has(rule.group) && legacy.some((re) => re.test(f.file))) continue;
    }
    const row = deviations.find((d) => d.rule === f.id && (d.paths.length === 0 || (f.file && matchesAny(f.file, d.paths))));
    out.push(row ? { ...f, severity: 'warn', deviation: row.deviation } : f);
  }
  return out;
}
