// expect: NX-NAME-03, NX-LAYER-07, NX-LAYER-02
export async function pay(input: { orderId: string }, deps: object) {
  await fetch('https://pay.example');
  return { ok: true as const, input, deps };
}
