import conventions from '@conventions/eslint-plugin-nextjs';

export default [
  { ignores: ['node_modules/**', '.next/**'] },
  ...conventions.createConfig({
    appRoot: '.',
    tsconfig: './tsconfig.json',
    // 'components/**' is anchored at the root: modules/orders/components/ must stay ui, so
    // OrderCard.tsx keeps its check-file report instead of the legacy exemption.
    legacy: ['lib/legacy/**', 'components/**'],
  }),
];
