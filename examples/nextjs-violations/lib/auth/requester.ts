import { TenantId, type Requester } from '@conventions/nextjs/core';
export async function getRequester(): Promise<Requester | null> {
  return { kind: 'user', userId: 'u', tenantId: TenantId('u'), roles: [] };
}
