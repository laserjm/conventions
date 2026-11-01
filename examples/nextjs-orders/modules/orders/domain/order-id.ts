// NX-TYPE-05: branded id. The constructor lives here; the contract schema (`orderIdSchema`) in contracts.ts.
export type OrderId = string & { readonly __brand: 'OrderId' };

export function OrderId(value: string): OrderId {
  return value as OrderId; // the single sanctioned cast for a brand constructor
}
