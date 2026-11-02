// The transaction runner's contract (NX-DB-06): commit on return, roll back on throw, roll back on
// `err` when asked, join an outer transaction, and refuse to start one when joining is required.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTransactionRunner } from '../dist/drizzle/index.js';
import { Bug, err, ok } from '../dist/core/index.js';

function fakeDb() {
  const log = [];
  return {
    log,
    transaction: async (fn) => {
      const tx = { execute: async () => {} };
      try {
        const value = await fn(tx);
        log.push('commit');
        return value;
      } catch (e) {
        log.push('rollback');
        throw e;
      }
    },
  };
}

describe('createTransactionRunner', () => {
  it('commits when fn returns, an err included, by default', async () => {
    const db = fakeDb();
    const withTransaction = createTransactionRunner(() => db);
    assert.deepEqual(await withTransaction('interactive', async () => err('Refused')), err('Refused'));
    assert.deepEqual(db.log, ['commit']);
  });

  it('rolls back on err with rollbackOnErr and returns the err unchanged', async () => {
    const db = fakeDb();
    const withTransaction = createTransactionRunner(() => db);
    const refusal = err({ _tag: 'ScreenLimitReached' });
    assert.equal(await withTransaction('interactive', async () => refusal, { rollbackOnErr: true }), refusal);
    assert.deepEqual(await withTransaction('interactive', async () => ok(1), { rollbackOnErr: true }), ok(1));
    assert.deepEqual(db.log, ['rollback', 'commit']);
  });

  it('a joined unit of work returns its err to the outer one, which rolls back once', async () => {
    const db = fakeDb();
    const withTransaction = createTransactionRunner(() => db);
    const result = await withTransaction(
      'interactive',
      async () => {
        const inner = await withTransaction('interactive', async () => err('Inner'), { rollbackOnErr: true });
        return inner.ok ? ok('kept') : inner;
      },
      { rollbackOnErr: true },
    );
    assert.deepEqual(result, err('Inner'));
    assert.deepEqual(db.log, ['rollback']);
  });

  it('still rolls back and rethrows when fn throws', async () => {
    const db = fakeDb();
    const withTransaction = createTransactionRunner(() => db);
    await assert.rejects(withTransaction('system', async () => { throw new Error('driver'); }, { rollbackOnErr: true }), /driver/);
    assert.deepEqual(db.log, ['rollback']);
  });

  it("join: 'required' joins the caller's transaction and stops with a Bug when there is none", async () => {
    const db = fakeDb();
    const withTransaction = createTransactionRunner(() => db);
    await assert.rejects(withTransaction('interactive', async () => 'locked', { join: 'required' }), (e) => e instanceof Bug);
    assert.deepEqual(db.log, []);
    const joined = await withTransaction('interactive', () => withTransaction('interactive', async () => 'locked', { join: 'required' }));
    assert.equal(joined, 'locked');
    assert.deepEqual(db.log, ['commit']);
  });
});
