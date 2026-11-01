// expect: NX-NAME-02
export interface IOrderRepository { findById(id: string): Promise<unknown> }
