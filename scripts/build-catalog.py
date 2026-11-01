#!/usr/bin/env python3
"""Regenerate rules/nextjs.yaml from the rule tables in docs/nextjs/**.md. Run after editing a rule."""
import re, glob
rows = []
files = ['docs/nextjs/architecture.md', 'docs/nextjs/naming.md', 'docs/nextjs/testing.md'] + sorted(glob.glob('docs/nextjs/bindings/*.md'))
for f in files:
    section = ''
    for line in open(f):
        h = re.match(r'^##\s+(.*)', line)
        if h:
            section = h.group(1).strip()
        m = re.match(r'^\|\s*(NX-[A-Z]+-\d+)\s*\|\s*(error|warn|review)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$', line)
        if m:
            rid, sev, rule, enf = m.groups()
            rows.append((rid, sev, rule.replace('\\|', '|'), enf, f, section))
ids = [r[0] for r in rows]
dups = sorted({i for i in ids if ids.count(i) > 1})
if dups:
    raise SystemExit(f'duplicate rule ids: {dups}')
def y(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'
out = ['# Generated from the rule tables in docs/nextjs/**.md by scripts/build-catalog.py — do not edit by hand.',
       'profile: nextjs', 'version: 0.1.2', 'rules:']
for rid, sev, rule, enf, f, section in rows:
    anchor = re.sub(r'[^a-z0-9 -]', '', section.lower()).replace(' ', '-')
    out += [f'  - id: {rid}', f'    severity: {sev}', f'    enforcement: {y(enf)}', f'    doc: {f}#{anchor}', f'    rule: {y(rule)}']
import os
for target in ['rules/nextjs.yaml', 'packages/eslint-plugin-nextjs/rules/nextjs.yaml']:
    os.makedirs(os.path.dirname(target), exist_ok=True)
    open(target, 'w').write('\n'.join(out) + '\n')
print(f'{len(rows)} rules written to rules/nextjs.yaml (+ package copy)')
