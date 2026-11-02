import { expect, it } from 'vitest';

/** An owner's id: `TenantId` under `isolation: tenant`, `OwnerId` under `isolation: owner`. */
export type IsolationCase<Owner extends string> = {
  /** Names the methods under test when a repository registers several cases; part of the test titles. */
  name?: string;
  /** Two distinct owners. */
  ownerA: Owner;
  ownerB: Owner;
  /** Creates the row (or rows) `owner` owns. Called with `ownerA`. */
  arrange: (owner: Owner) => Promise<unknown>;
  /**
   * What `owner` reads of the arranged row: a row, a list, a map or a count. Nothing is `null`,
   * `undefined`, `0`, `false`, an empty array, map or set.
   */
  read: (owner: Owner) => Promise<unknown>;
  /** The write `owner` attempts on the arranged row. Called with `ownerB`; a refusal or a throw is fine. */
  change: (owner: Owner) => Promise<unknown>;
};

const nothing = (v: unknown) =>
  v === null || v === undefined || v === 0 || v === false ||
  (Array.isArray(v) && v.length === 0) ||
  ((v instanceof Map || v instanceof Set) && v.size === 0);

/**
 * Registers the two tests NX-AUTH-03 requires of every repository on owned data: another owner's
 * rows can be neither read nor changed. Takes callbacks, so it fits any repository shape
 * (`findById`/`save`, `lock…`/`setState`, a list read). Call it inside `describeIntegration`, once
 * per group of methods that reads or writes owned rows.
 */
export function assertIsolation<Owner extends string>(c: IsolationCase<Owner>): void {
  const label = c.name ? ` (${c.name})` : '';

  it(`does not return another owner’s rows${label} (NX-AUTH-03)`, async () => {
    await c.arrange(c.ownerA);
    expect(nothing(await c.read(c.ownerA)), 'the owner reads their own row back; otherwise the case proves nothing').toBe(false);
    expect(nothing(await c.read(c.ownerB)), 'another owner reads nothing').toBe(true);
  });

  it(`does not change another owner’s rows${label} (NX-AUTH-03)`, async () => {
    await c.arrange(c.ownerA);
    const before = await c.read(c.ownerA);
    await Promise.resolve()
      .then(() => c.change(c.ownerB))
      .catch(() => undefined);
    expect(await c.read(c.ownerA)).toEqual(before);
  });
}
