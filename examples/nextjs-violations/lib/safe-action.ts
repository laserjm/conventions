import { createActionClients } from '@conventions/nextjs/next-safe-action';
import { getRequester } from '@/lib/auth/requester';
export const { actionClient, memberActionClient } = createActionClients({ getRequester });
