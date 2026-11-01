// expect: NX-LAYER-08, NX-NAME-20, NX-RICH-03
export type OrderModel = { id: string };
export class Order { pay() { throw new Error('paid'); } }
