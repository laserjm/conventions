import conventions from '@conventions/nextjs';

export default [{ ignores: ['node_modules/**', '.next/**'] }, ...conventions.createConfig()];
