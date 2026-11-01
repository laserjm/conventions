import conventions from '@conventions/nextjs';

export default [
  { ignores: ['node_modules/**', '.next/**'] },
  // ...framework presets (e.g. next/core-web-vitals) go here
  ...conventions.createConfig(), // app root, legacy folders and rulesets come from ARCHITECTURE.md
  // project overrides below — every override needs a Deviations row in ARCHITECTURE.md (NX-MIG-04)
];
