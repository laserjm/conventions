import type { Result } from './result';

/** `(input, deps) => Promise<Result>` — the only shape a use case has (NX-LAYER-07, NX-ERR-01, NX-NAME-32). */
export type UseCase<Input, Output, Error, Deps extends object> = (input: Input, deps: Deps) => Promise<Result<Output, Error>>;

/**
 * Declares a use case. The generics pin the signature, so the compiler refuses positional
 * dependencies, a thrown-only error path or a bare return value:
 *
 *   export const payOrder = defineUseCase<PayOrderInput, PayOrderOutput, OrderError | NotFound, PayOrderDeps>(
 *     async (input, { orders, clock }) => { … return ok(…); },
 *   );
 */
export function defineUseCase<Input, Output, Error, Deps extends object>(
  run: UseCase<Input, Output, Error, Deps>,
): UseCase<Input, Output, Error, Deps> {
  return run;
}
