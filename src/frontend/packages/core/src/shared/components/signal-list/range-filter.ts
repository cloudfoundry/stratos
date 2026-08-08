// Range-comparison filter model for signal-list toolbars (#5770 Part 2).
// Deliberately domain-general: `valueType` picks the comparison domain so
// date columns (last refreshed) and numeric columns (memory, instances)
// share one mechanism — adding a numeric consumer must touch no framework
// code. Date bounds are DAY-GRANULAR in local time: a date input names a
// calendar day, so "lte 2026-05-15" reaches through that day's end and
// "gte 2026-05-15" starts at its beginning.

export type SignalListRangeOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'between';
export type SignalListRangeValueType = 'date' | 'number';

// Bound interpretation for date-domain ranges. 'date' (the default when the
// field is absent) reads `a`/`b` as YYYY-MM-DD; the relative modes read them
// as day counts walked back from "today", so "older than 90 days" is plain
// `lt` with a relative bound — no extra operators. 'businessDays' counts
// only days in `workingDays` (JS getDay() numbers, 0=Sun … 6=Sat), stepping
// `holidayCount` extra working days to compensate for weekday holidays the
// user knows about — we deliberately hold no holiday data, the popup shows
// the resolved date and tells the user to bump the count if it's a holiday.
export type SignalListRangeBoundMode = 'date' | 'days' | 'businessDays';

export interface SignalListRangeValue {
  readonly op: SignalListRangeOperator;
  readonly a: string;
  readonly b?: string;
  readonly inclusiveA?: boolean;
  readonly inclusiveB?: boolean;
  readonly mode?: SignalListRangeBoundMode;
  readonly workingDays?: readonly number[];
  readonly holidayCount?: number;
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

// Positive integer day count, capped at ~10 years — beyond that a relative
// staleness bound is meaningless and the business-day walk gets needlessly
// long. Out-of-range counts read as unparsable (inert / incomplete).
function parseCount(bound: string): number | null {
  if (!/^\d+$/.test(bound)) return null;
  const n = +bound;
  return n > 0 && n <= 3650 ? n : null;
}

// Resolves a relative bound to the local-midnight Date it names, or null
// when the range is not relative or the bound doesn't parse. Exported so
// the popup can display the resolved date next to the holiday warning.
// The business-day walk counts only working days, so it lands on a working
// day by construction — never a weekend, whatever the week shape.
export function resolveRelativeDay(
  range: SignalListRangeValue,
  bound: 'a' | 'b',
  now: Date = new Date(),
): Date | null {
  const mode = range.mode ?? 'date';
  if (mode === 'date') return null;
  const count = parseCount(bound === 'a' ? range.a : range.b ?? '');
  if (count === null) return null;
  if (mode === 'days') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - count);
  }
  const working = new Set(range.workingDays ?? []);
  if (working.size === 0) return null;
  const h = range.holidayCount;
  const holidays = Number.isInteger(h) && (h as number) > 0 ? (h as number) : 0;
  let remaining = count + holidays;
  // setDate rollover keeps this in local time across month/year/DST edges.
  const cur = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (remaining > 0) {
    cur.setDate(cur.getDate() - 1);
    if (working.has(cur.getDay())) remaining--;
  }
  return cur;
}

// [startOfDay, endOfDay] window for a resolved local-midnight Date — the
// relative-mode counterpart of dayWindow's string parse.
function dayWindowFromDate(day: Date): [number, number] {
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime() - 1;
  return [day.getTime(), end];
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
  const window = (bound: 'a' | 'b') => boundWindow(range, bound, valueType);
  if (window('a') === null) return false;
  if (range.op === 'between' && window('b') === null) return false;
  return true;
}

// Comparison window for one bound, honoring the range's bound mode: number
// domain and literal dates parse the bound string; relative date modes
// resolve the count to a day first. Null = bound not (yet) parsable.
function boundWindow(
  range: SignalListRangeValue,
  bound: 'a' | 'b',
  valueType: SignalListRangeValueType,
  now?: Date,
): [number, number] | null {
  const raw = bound === 'a' ? range.a : range.b ?? '';
  if (valueType !== 'date') return numWindow(raw);
  if ((range.mode ?? 'date') !== 'date') {
    const day = resolveRelativeDay(range, bound, now);
    return day === null ? null : dayWindowFromDate(day);
  }
  return dayWindow(raw);
}

export function rangeMatches(
  raw: string | number | null | undefined,
  range: SignalListRangeValue | null,
  valueType: SignalListRangeValueType,
  now?: Date,
): boolean {
  if (range === null) return true;

  const wa = boundWindow(range, 'a', valueType, now);
  const wb = range.b !== undefined ? boundWindow(range, 'b', valueType, now) : null;
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
