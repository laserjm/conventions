// No expect line: this file must be clean. Legacy code is exempt from naming, cast and env
// rules until its folder leaves the list (NX-LAYER-10).
export function legacy_total(row_count: unknown): number {
  const url = process.env.LEGACY_URL;
  return (row_count as number) + (url ? 1 : 0);
}
