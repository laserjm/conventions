import { TenantId, type TenantRequester } from '@conventions/nextjs/core';
export async function getRequester(): Promise<TenantRequester | null> {
  return { kind: 'user', userId: 'u', tenantId: TenantId('u'), roles: [] };
}
