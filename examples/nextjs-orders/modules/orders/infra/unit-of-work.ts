import { withTransaction } from '@/lib/db/client';
import type { UnitOfWork } from '../application/ports';

export const unitOfWork: UnitOfWork = {
  // a refusal after a write keeps nothing: rollbackOnErr rolls back on err and returns it (NX-DB-06, NX-DRZ-06)
  run: (fn) => withTransaction('interactive', () => fn(), { rollbackOnErr: true }),
};
