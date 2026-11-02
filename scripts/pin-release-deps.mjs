// Before packing a release: @conventions/nextjs depends on @conventions/cli (the ESLint config
// reads the ARCHITECTURE.md header with the CLI's parser). In the workspace that is
// `workspace:*`, which `pnpm pack` turns into a bare version npm would look up in a registry
// the packages are not on. Point it at the CLI tarball attached to the same GitHub release, so
// the nextjs tarball installs by itself (#19).
//
//   node scripts/pin-release-deps.mjs 0.2.3 [owner/repo]
import { readFileSync, writeFileSync } from 'node:fs';

const [version, repo = process.env.GITHUB_REPOSITORY ?? 'laserjm/conventions'] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+/.test(version ?? '')) {
  console.error('usage: node scripts/pin-release-deps.mjs <version> [owner/repo]');
  process.exit(1);
}
const file = new URL('../packages/nextjs/package.json', import.meta.url);
const pkg = JSON.parse(readFileSync(file, 'utf8'));
const url = `https://github.com/${repo}/releases/download/v${version}/conventions-cli-${version}.tgz`;
if (!pkg.dependencies?.['@conventions/cli']) throw new Error('@conventions/nextjs has no @conventions/cli dependency');
pkg.dependencies['@conventions/cli'] = url;
writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
console.log(`@conventions/nextjs → @conventions/cli ${url}`);
