// expect: no-restricted-syntax
export function cancel(): never {
  throw new Error('NX-LAYER-08: never throw across layers');
}
