import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const bin = path.join(import.meta.dirname, '../bin/conventions.mjs');
const orders = path.join(import.meta.dirname, '../../../examples/nextjs-orders');

describe('conventions', () => {
  it('prints help', () => {
    const out = execFileSync('node', [bin, '--help'], { encoding: 'utf8' });
    assert.match(out, /conventions check/);
  });
  it('explains a rule from the installed catalogue', () => {
    const out = execFileSync('node', [bin, 'explain', 'NX-LAYER-05', '--cwd', orders], { encoding: 'utf8' });
    assert.match(out, /NX-LAYER-05\s+\[layers\]/);
    assert.match(out, /enforced by: eslint:boundaries\/element-types/);
  });
  it('fails on an unknown rule', () => {
    assert.throws(() => execFileSync('node', [bin, 'explain', 'NX-NOPE-99', '--cwd', orders], { encoding: 'utf8', stdio: 'pipe' }));
  });
});
