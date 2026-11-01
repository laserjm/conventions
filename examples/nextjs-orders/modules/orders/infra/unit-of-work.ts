import { withTransaction } from '@/lib/db/transaction';
import type { UnitOfWork } from '../application/ports';

export const unitOfWork: UnitOfWork = {
  run: (fn) => withTransaction('interactive', () => fn()),
};
