import { header } from './header.mjs';
import { modules } from './modules.mjs';
import { tests } from './tests.mjs';
import { ownership } from './ownership.mjs';
import { deviations } from './deviations.mjs';
import { inventory } from './inventory.mjs';
import { routeLocal } from './route-local.mjs';
import { legacy } from './legacy.mjs';

/** Every check: (project, ctx) => Finding[]. A finding: { id, severity, file?, line?, message, check }. */
export const checks = [header, modules, tests, ownership, legacy, deviations, inventory, routeLocal];
