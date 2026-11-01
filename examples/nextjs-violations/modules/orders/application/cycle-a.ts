// expect: NX-LAYER-09, NX-LAYER-07
import { cycleB } from './cycle-b';
export const cycleA = () => cycleB;
