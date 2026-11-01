// expect: NX-ERR-02, NX-ERR-03
export type OrderAlreadyPaid = { readonly _tag: 'PayOrderFailed' };
export type NotFound = { readonly _tag: 'NotFound' };
