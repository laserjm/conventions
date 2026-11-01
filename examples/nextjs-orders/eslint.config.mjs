import conventions from '@conventions/eslint-plugin-nextjs';

export default [
  { ignores: ['node_modules/**', '.next/**'] },
  ...conventions.createConfig({ appRoot: '.', tsconfig: './tsconfig.json' }),
];
