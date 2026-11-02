import 'server-only';
import type { Thing } from './domain/thing';

/** A write beside a domain/ with no application/: NX-RICH-01 (see expected-checks.txt). */
export async function saveThing(thing: Thing): Promise<Thing> {
  return thing;
}
