import conventions from '@conventions/nextjs';

export default [
  { ignores: ['node_modules/**', '.next/**'] },
  ...conventions.createConfig(), // app root, legacy folders and rulesets come from ARCHITECTURE.md
];
