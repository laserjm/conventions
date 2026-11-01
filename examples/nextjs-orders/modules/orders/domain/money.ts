export type Money = { readonly cents: number; readonly currency: 'EUR' };

export function money(cents: number): Money {
  return { cents, currency: 'EUR' };
}

export function add(a: Money, b: Money): Money {
  return { cents: a.cents + b.cents, currency: a.currency };
}
