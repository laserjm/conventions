import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanMigrations, parseInventory } from '../src/checks/inventory.mjs';

const live = (...sql) => [...scanMigrations(sql.map((s, i) => ({ file: `${i}.sql`, sql: s }))).objects.keys()].sort();

describe('scanMigrations (NX-DB-02)', () => {
  it('reads quoted, schema-qualified and plain names, not the schema', () => {
    assert.deepEqual(live(`CREATE OR REPLACE FUNCTION "public"."lock_active_account"("account" "uuid") RETURNS boolean AS $$ select true $$;
      create function public.claim_check(lease interval) returns void language sql as $f$ drop function x(); $f$;
      create procedure tidy() language sql as 'select 1';`), ['claim_check', 'lock_active_account', 'tidy']);
  });
  it('replays drops, comma lists and renames in order', () => {
    assert.deepEqual(live(
      'create function a() returns int as $$ select 1 $$; create function b(numeric(10,2)) returns int as $$ select 1 $$; create function old() returns int as $$ select 1 $$;',
      'drop function if exists public.a(), b(numeric(10,2)) cascade; alter function public.old() rename to new;',
    ), ['new']);
  });
  it('a trigger goes with its table, its function, or its own drop, and follows renames', () => {
    const base = `create function f() returns trigger as $$ begin return new; end $$;
      create table t (id int); create table u (id int); create table v (id int);
      create trigger on_t before insert on public.t for each row execute function f();
      CREATE CONSTRAINT TRIGGER "on_u" AFTER DELETE ON "public"."u" DEFERRABLE FOR EACH ROW EXECUTE FUNCTION "public"."f"();
      create trigger on_v before insert on v for each row execute function f();`;
    assert.deepEqual(live(base), ['f', 'on_t', 'on_u', 'on_v']);
    assert.deepEqual(live(base, 'drop table public.t; drop trigger if exists on_u on u; alter table v rename to w; alter trigger on_v on public.w rename to on_w;'), ['f', 'on_w']);
    assert.deepEqual(live(base, 'drop function f() cascade;'), []);
  });
  it('ignores DDL inside comments and function bodies', () => {
    assert.deepEqual(live('-- create function ghost()\n/* create trigger g on t */ create function real() returns void as $$ begin create temp table x(); end $$;'), ['real']);
  });
});

describe('parseInventory (NX-DB-02)', () => {
  const md = `# Inventory

| Step | Module |
| --- | --- |
| 3 | \`modules/accounts\` |

## Kept

| Function | Category | Called from | Wrapped by | Test |
| --- | --- | --- | --- | --- |
| \`claim_check\` | A | \`lib/x.ts\` | \`checkRuns.claim\` | pgTAP |
| \`review_change\` | X | \`lib/server/reviews.ts\` | — | pgTAP |
| \`filter_passes\`, \`screen_predicates\` | **B** read model | \`screen_listings\` | — | through callers |
| \`set_updated_at\` → \`extensions.moddatetime\` | — (NX-DB-08, \`updated_at\`) | 23 tables | — | — |
| \`mystery\` | ? | — | — | — |

| Table | Trigger → function | Category | Test |
| --- | --- | --- | --- |
| \`digests\` | \`check_digest\` | X | pgTAP |

## Data pipeline

Written by \`apps/data\`. All of them are category E: no module calls them.

**Functions:** \`commit_fx_input\`, \`record_market_eod\`.

## Dropped

- Step 5: \`archive_screen\` and \`duplicate_screen\`.

| Function | Category | Note |
| --- | --- | --- |
| \`gone\` | X | dropped in step 7 |
`;
  const { listed, rows } = parseInventory(md);
  it('lists table rows by their name columns, with their category', () => {
    assert.equal(listed.get('claim_check'), 'A');
    assert.equal(listed.get('review_change'), 'X');
    assert.equal(listed.get('screen_predicates'), 'B');
    assert.equal(listed.get('set_updated_at'), 'NX-DB-08');
    assert.equal(listed.get('check_digest'), 'X');
    assert.equal(listed.has('digests'), false, 'a Table column is not a name column');
    assert.equal(listed.has('moddatetime'), false, "another schema is not the project's");
  });
  it('a section naming one category lists its other names with it', () => {
    assert.equal(listed.get('commit_fx_input'), 'E');
    assert.equal(listed.get('record_market_eod'), 'E');
  });
  it('a Dropped section lists nothing, and skips the step table', () => {
    for (const name of ['archive_screen', 'duplicate_screen', 'gone', 'modules']) assert.equal(listed.has(name), false, name);
    assert.equal(rows.find((r) => r.names.includes('gone')).dropped, true);
  });
  it('a row without a valid category has none', () => {
    assert.equal(rows.find((r) => r.names.includes('mystery')).category, undefined);
  });
});
