// Range-comparison filter model for signal-list toolbars (#5770 Part 2).
// Deliberately domain-general: `valueType` picks the comparison domain so
// date columns (last refreshed) and numeric columns (memory, instances)
// share one mechanism — adding a numeric consumer must touch no framework
// code. Date bounds are DAY-GRANULAR in local time: a date input names a
// calendar day, so "lte 2026-05-15" reaches through that day's end and
// "gte 2026-05-15" starts at its beginning.

export type SignalListRangeOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'between';
export type SignalListRangeValueType = 'date' | 'number';

export interface SignalListRangeValue {
  readonly op: SignalListRangeOperator;
  readonly a: string;
  readonly b?: string;
  readonly inclusiveA?: boolean;
  readonly inclusiveB?: boolean;
}

// [startOfDay, endOfDay] for a YYYY-MM-DD input, in ms; null when unparsable.
// End bound computed as start-of-next-day - 1ms to honor DST transitions.
function dayWindow(bound: string): [number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bound);
  if (!m) return null;
  const start = new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  if (Number.isNaN(start)) return null;
  const end = new Date(+m[1], +m[2] - 1, +m[3] + 1).getTime() - 1;
  return [start, end];
}

function numWindow(bound: string): [number, number] | null {
  if (bound.trim() === '') return null;
  const n = Number(bound);
  return Number.isNaN(n) ? null : [n, n];
}

// True iff `range` names a fully-typed constraint: a non-null range whose
// primary bound parses in the given domain, and — for `between` — whose
// upper bound parses too. A half-typed range (e.g. `{ op: 'between', a: '' }`
// right after picking "between" but before typing a date) is inert for
// filtering purposes (see rangeMatches's half-typed-bounds note above) but
// is NOT the canonical "no constraint" state — updateRange stores it as-is
// so the popup keeps the user's op choice across keystrokes. Callers that
// need to know whether a range is actually constraining the list (the
// Clear button, hasActiveFilter) should check this instead of `!== null`.
export function rangeIsComplete(
  range: SignalListRangeValue | null,
  valueType: SignalListRangeValueType,
): boolean {
  if (range === null) return false;
  const window = valueType === 'date' ? dayWindow : numWindow;
  if (window(range.a) === null) return false;
  if (range.op === 'between' && window(range.b ?? '') === null) return false;
  return true;
}

export function rangeMatches(
  raw: string | number | null | undefined,
  range: SignalListRangeValue | null,
  valueType: SignalListRangeValueType,
): boolean {
  if (range === null) return true;

  const window = valueType === 'date' ? dayWindow : numWindow;
  const wa = window(range.a);
  const wb = range.b !== undefined ? window(range.b) : null;
  // Half-typed or unparsable bounds: the filter is inert, never blanking
  // the list under the user's cursor mid-edit.
  if (wa === null || (range.op === 'between' && wb === null)) return true;

  // Active range + unknown row value: comparisons against unknown are
  // false (SQL-NULL posture) — a "—" row matches no constraint.
  if (raw === null || raw === undefined || raw === '') return false;
  const v = valueType === 'date'
    ? Date.parse(String(raw))
    : (typeof raw === 'number' ? raw : Number(raw));
  if (Number.isNaN(v)) return false;

  switch (range.op) {
    case 'lt': return v < wa[0];
    case 'lte': return v <= wa[1];
    case 'gt': return v > wa[1];
    case 'gte': return v >= wa[0];
    case 'between': {
      const loOk = (range.inclusiveA ?? true) ? v >= wa[0] : v > wa[1];
      const hiOk = (range.inclusiveB ?? true) ? v <= wb![1] : v < wb![0];
      return loOk && hiOk;
    }
  }
}
