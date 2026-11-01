/** A nominal type over a primitive: `type OrderId = Brand<string, 'OrderId'>` (NX-TYPE-05). */
export type Brand<T, Name extends string> = T & { readonly __brand: Name };
