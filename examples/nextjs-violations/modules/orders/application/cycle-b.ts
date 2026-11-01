// expect: NX-LAYER-09, NX-LAYER-07
import { cycleA } from './cycle-a';
export const cycleB = () => cycleA;
