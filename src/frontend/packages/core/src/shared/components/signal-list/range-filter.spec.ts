import { describe, expect, it } from 'vitest';
import { rangeIsComplete, rangeMatches, resolveRelativeDay, SignalListRangeValue } from './range-filter';

const d = (op: SignalListRangeValue['op'], a: string, b?: string, inclusiveA?: boolean, inclusiveB?: boolean): SignalListRangeValue =>
  ({ op, a, ...(b !== undefined ? { b } : {}), ...(inclusiveA !== undefined ? { inclusiveA } : {}), ...(inclusiveB !== undefined ? { inclusiveB } : {}) });

describe('rangeMatches — date domain (day-granular, local time)', () => {
  const may15noon = '2026-05-15T12:00:00Z';

  it('null range matches everything, including missing values', () => {
    expect(rangeMatches(may15noon, null, 'date')).toBe(true);
    expect(rangeMatches(undefined, null, 'date')).toBe(true);
  });

  it('missing value never matches an active range', () => {
    expect(rangeMatches(undefined, d('gte', '2026-01-01'), 'date')).toBe(false);
    expect(rangeMatches(null, d('lt', '2099-01-01'), 'date')).toBe(false);
    expect(rangeMatches('', d('lt', '2099-01-01'), 'date')).toBe(false);
  });

  it('lt excludes the named day itself', () => {
    expect(rangeMatches(may15noon, d('lt', '2026-05-15'), 'date')).toBe(false);
    expect(rangeMatches(may15noon, d('lt', '2026-05-16'), 'date')).toBe(true);
  });

  it('lte includes through the end of the named day', () => {
    expect(rangeMatches(may15noon, d('lte', '2026-05-15'), 'date')).toBe(true);
    expect(rangeMatches(may15noon, d('lte', '2026-05-14'), 'date')).toBe(false);
  });

  it('gt excludes the named day itself', () => {
    expect(rangeMatches(may15noon, d('gt', '2026-05-15'), 'date')).toBe(false);
    expect(rangeMatches(may15noon, d('gt', '2026-05-14'), 'date')).toBe(true);
  });

  it('gte includes from the start of the named day', () => {
    expect(rangeMatches(may15noon, d('gte', '2026-05-15'), 'date')).toBe(true);
    expect(rangeMatches(may15noon, d('gte', '2026-05-16'), 'date')).toBe(false);
  });

  it('between defaults to inclusive on both ends', () => {
    expect(rangeMatches(may15noon, d('between', '2026-05-15', '2026-05-15'), 'date')).toBe(true);
    expect(rangeMatches(may15noon, d('between', '2026-05-01', '2026-05-14'), 'date')).toBe(false);
  });

  it('between honors exclusive ends', () => {
    expect(rangeMatches(may15noon, d('between', '2026-05-15', '2026-05-31', false, true), 'date')).toBe(false);
    expect(rangeMatches(may15noon, d('between', '2026-05-01', '2026-05-15', true, false), 'date')).toBe(false);
    expect(rangeMatches(may15noon, d('between', '2026-05-01', '2026-05-15', true, true), 'date')).toBe(true);
  });

  it('half-typed or invalid bounds are inert (match everything)', () => {
    expect(rangeMatches(may15noon, d('gte', ''), 'date')).toBe(true);
    expect(rangeMatches(may15noon, d('between', '2026-05-01'), 'date')).toBe(true);
    expect(rangeMatches(may15noon, d('lt', 'not-a-date'), 'date')).toBe(true);
  });

  it('day windows honor DST transitions (spring-forward)', () => {
    // US spring-forward 2026-03-08: lte 2026-03-08 must NOT include 2026-03-09T00:30 local
    const springForwardProbe = new Date(2026, 2, 9, 0, 30).toISOString();
    expect(rangeMatches(springForwardProbe, d('lte', '2026-03-08'), 'date')).toBe(false);
  });

  it('day windows honor DST transitions (fall-back)', () => {
    // US fall-back 2026-11-01: lte 2026-11-01 MUST include 2026-11-01T23:30 local
    const fallBackProbe = new Date(2026, 10, 1, 23, 30).toISOString();
    expect(rangeMatches(fallBackProbe, d('lte', '2026-11-01'), 'date')).toBe(true);
  });
});

describe('rangeMatches — number domain (memory-style consumer)', () => {
  it('compares plain numbers with no day windowing', () => {
    expect(rangeMatches(512, d('gte', '512'), 'number')).toBe(true);
    expect(rangeMatches(511, d('gte', '512'), 'number')).toBe(false);
    expect(rangeMatches(512, d('lt', '512'), 'number')).toBe(false);
    expect(rangeMatches(512, d('lte', '512'), 'number')).toBe(true);
    expect(rangeMatches(512, d('gt', '512'), 'number')).toBe(false);
    expect(rangeMatches(1024, d('gt', '512'), 'number')).toBe(true);
    expect(rangeMatches(256, d('between', '128', '512'), 'number')).toBe(true);
    expect(rangeMatches(512, d('between', '128', '512', true, false), 'number')).toBe(false);
  });

  it('accepts numeric strings as row values', () => {
    expect(rangeMatches('512', d('gte', '512'), 'number')).toBe(true);
  });

  it('missing or non-numeric row values never match an active range', () => {
    expect(rangeMatches(undefined, d('gte', '0'), 'number')).toBe(false);
    expect(rangeMatches('n/a', d('gte', '0'), 'number')).toBe(false);
  });
});

// Relative bounds: `a`/`b` hold day counts instead of dates. All weekday
// numbers use the JS Date.getDay() convention (0=Sun … 6=Sat).
const MON_FRI = [1, 2, 3, 4, 5];

const rel = (
  op: SignalListRangeValue['op'],
  a: string,
  mode: 'days' | 'businessDays',
  extra: Partial<SignalListRangeValue> = {},
): SignalListRangeValue => ({ op, a, mode, ...extra });

// Local-time ISO probe for a moment inside a given calendar day.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString();

describe('rangeMatches — relative "days ago" bounds', () => {
  const nowMon = new Date(2026, 7, 10, 12, 0); // Mon 2026-08-10 local noon

  it('lt N days ago matches only values before the resolved day', () => {
    // 90 days before Mon 2026-08-10 = Tue 2026-05-12.
    expect(rangeMatches(at(2026, 5, 11), rel('lt', '90', 'days'), 'date', nowMon)).toBe(true);
    expect(rangeMatches(at(2026, 5, 12, 0), rel('lt', '90', 'days'), 'date', nowMon)).toBe(false);
  });

  it('lte N days ago reaches through the end of the resolved day', () => {
    expect(rangeMatches(at(2026, 5, 12, 23), rel('lte', '90', 'days'), 'date', nowMon)).toBe(true);
    expect(rangeMatches(at(2026, 5, 13, 0), rel('lte', '90', 'days'), 'date', nowMon)).toBe(false);
  });

  it('gte N days ago includes from the start of the resolved day', () => {
    // 1 day before Mon 2026-08-10 = Sun 2026-08-09.
    expect(rangeMatches(at(2026, 8, 9, 0), rel('gte', '1', 'days'), 'date', nowMon)).toBe(true);
    expect(rangeMatches(at(2026, 8, 8, 23), rel('gte', '1', 'days'), 'date', nowMon)).toBe(false);
  });

  it('between relative bounds resolves each count to its own day', () => {
    // a=90 → 2026-05-12, b=30 → 2026-07-11; inclusive both ends by default.
    expect(rangeMatches(at(2026, 6, 15), rel('between', '90', 'days', { b: '30' }), 'date', nowMon)).toBe(true);
    expect(rangeMatches(at(2026, 5, 11), rel('between', '90', 'days', { b: '30' }), 'date', nowMon)).toBe(false);
    expect(rangeMatches(at(2026, 7, 12), rel('between', '90', 'days', { b: '30' }), 'date', nowMon)).toBe(false);
  });

  it('non-positive, fractional, or empty counts are inert', () => {
    expect(rangeMatches(at(2026, 5, 11), rel('lt', '', 'days'), 'date', nowMon)).toBe(true);
    expect(rangeMatches(at(2026, 5, 11), rel('lt', '0', 'days'), 'date', nowMon)).toBe(true);
    expect(rangeMatches(at(2026, 5, 11), rel('lt', '-3', 'days'), 'date', nowMon)).toBe(true);
    expect(rangeMatches(at(2026, 5, 11), rel('lt', '2.5', 'days'), 'date', nowMon)).toBe(true);
  });

  it('counts beyond the 10-year cap are inert', () => {
    expect(rangeMatches(at(2026, 5, 11), rel('lt', '99999', 'days'), 'date', nowMon)).toBe(true);
  });

  it('missing row values still never match an active relative range', () => {
    expect(rangeMatches(undefined, rel('lt', '90', 'days'), 'date', nowMon)).toBe(false);
  });
});

describe('rangeMatches — relative "business days ago" bounds', () => {
  const nowMon = new Date(2026, 7, 10, 12, 0); // Mon 2026-08-10

  it('walks over weekends: 1 business day before Monday is Friday', () => {
    const r = rel('gte', '1', 'businessDays', { workingDays: MON_FRI });
    expect(rangeMatches(at(2026, 8, 7, 0), r, 'date', nowMon)).toBe(true);   // Fri start
    expect(rangeMatches(at(2026, 8, 6, 23), r, 'date', nowMon)).toBe(false); // Thu end
  });

  it('counts only working days: 3 business days before Monday is Wednesday', () => {
    const r = rel('gte', '3', 'businessDays', { workingDays: MON_FRI });
    expect(rangeMatches(at(2026, 8, 5, 0), r, 'date', nowMon)).toBe(true);   // Wed
    expect(rangeMatches(at(2026, 8, 4, 23), r, 'date', nowMon)).toBe(false); // Tue
  });

  it('holidayCount extends the walk by whole working days', () => {
    // 1 business day + 1 holiday from Monday: Fri, then Thu.
    const r = rel('gte', '1', 'businessDays', { workingDays: MON_FRI, holidayCount: 1 });
    expect(rangeMatches(at(2026, 8, 6, 0), r, 'date', nowMon)).toBe(true);   // Thu
    expect(rangeMatches(at(2026, 8, 5, 23), r, 'date', nowMon)).toBe(false); // Wed
  });

  it('respects a Sun–Thu working week', () => {
    const nowSun = new Date(2026, 7, 9, 12, 0); // Sun 2026-08-09
    // 1 business day before Sunday, skipping Fri+Sat = Thu 2026-08-06.
    const r = rel('gte', '1', 'businessDays', { workingDays: [0, 1, 2, 3, 4] });
    expect(rangeMatches(at(2026, 8, 6, 0), r, 'date', nowSun)).toBe(true);
    expect(rangeMatches(at(2026, 8, 5, 23), r, 'date', nowSun)).toBe(false);
  });

  it('an empty working-day set is inert', () => {
    const r = rel('lt', '5', 'businessDays', { workingDays: [] });
    expect(rangeMatches(at(2026, 5, 11), r, 'date', nowMon)).toBe(true);
  });
});

describe('resolveRelativeDay', () => {
  const nowMon = new Date(2026, 7, 10, 12, 0); // Mon 2026-08-10

  it('resolves a plain-days count to local midnight N days back', () => {
    const day = resolveRelativeDay(rel('lt', '90', 'days'), 'a', nowMon);
    expect(day).toEqual(new Date(2026, 4, 12)); // Tue 2026-05-12
  });

  it('resolves business days landing on a working day (Monday → Friday)', () => {
    const day = resolveRelativeDay(rel('lt', '1', 'businessDays', { workingDays: MON_FRI }), 'a', nowMon);
    expect(day).toEqual(new Date(2026, 7, 7)); // Fri 2026-08-07
  });

  it('absorbs consecutive holidays one bump at a time', () => {
    // From Monday: 1bd → Fri; +1 holiday → Thu; +2 → Wed.
    const mk = (holidayCount: number) =>
      resolveRelativeDay(rel('lt', '1', 'businessDays', { workingDays: MON_FRI, holidayCount }), 'a', nowMon);
    expect(mk(1)).toEqual(new Date(2026, 7, 6));
    expect(mk(2)).toEqual(new Date(2026, 7, 5));
  });

  it('resolves the b bound for between', () => {
    const day = resolveRelativeDay(rel('between', '90', 'days', { b: '30' }), 'b', nowMon);
    expect(day).toEqual(new Date(2026, 6, 11)); // Sat 2026-07-11
  });

  it('returns null for date mode, invalid counts, and empty working-day sets', () => {
    expect(resolveRelativeDay({ op: 'lt', a: '2026-05-01' }, 'a', nowMon)).toBeNull();
    expect(resolveRelativeDay(rel('lt', '', 'days'), 'a', nowMon)).toBeNull();
    expect(resolveRelativeDay(rel('lt', '0', 'days'), 'a', nowMon)).toBeNull();
    expect(resolveRelativeDay(rel('lt', '5', 'businessDays', { workingDays: [] }), 'a', nowMon)).toBeNull();
  });
});

describe('rangeIsComplete — relative modes', () => {
  it('a positive integer count is complete in days mode', () => {
    expect(rangeIsComplete(rel('lt', '90', 'days'), 'date')).toBe(true);
  });

  it('zero, negative, fractional, or empty counts are incomplete', () => {
    expect(rangeIsComplete(rel('lt', '0', 'days'), 'date')).toBe(false);
    expect(rangeIsComplete(rel('lt', '-3', 'days'), 'date')).toBe(false);
    expect(rangeIsComplete(rel('lt', '2.5', 'days'), 'date')).toBe(false);
    expect(rangeIsComplete(rel('lt', '', 'days'), 'date')).toBe(false);
  });

  it('business days additionally require a non-empty working-day set', () => {
    expect(rangeIsComplete(rel('lt', '5', 'businessDays', { workingDays: MON_FRI }), 'date')).toBe(true);
    expect(rangeIsComplete(rel('lt', '5', 'businessDays', { workingDays: [] }), 'date')).toBe(false);
    expect(rangeIsComplete(rel('lt', '5', 'businessDays'), 'date')).toBe(false);
  });

  it('a relative between needs both counts', () => {
    expect(rangeIsComplete(rel('between', '90', 'days'), 'date')).toBe(false);
    expect(rangeIsComplete(rel('between', '90', 'days', { b: '30' }), 'date')).toBe(true);
  });
});

describe('rangeIsComplete', () => {
  it('a null range is not complete', () => {
    expect(rangeIsComplete(null, 'date')).toBe(false);
  });

  it('a single-op range with a parsing primary bound is complete', () => {
    expect(rangeIsComplete(d('gte', '2026-05-01'), 'date')).toBe(true);
    expect(rangeIsComplete(d('lt', '512'), 'number')).toBe(true);
  });

  it('a "between" range with only the primary bound typed is not complete', () => {
    expect(rangeIsComplete(d('between', '2026-05-01'), 'date')).toBe(false);
  });

  it('a "between" range with both bounds parsing is complete', () => {
    expect(rangeIsComplete(d('between', '2026-05-01', '2026-06-01'), 'date')).toBe(true);
    expect(rangeIsComplete(d('between', '128', '512'), 'number')).toBe(true);
  });

  it('an unparsable primary bound is not complete', () => {
    expect(rangeIsComplete(d('gte', 'not-a-date'), 'date')).toBe(false);
    expect(rangeIsComplete(d('gte', ''), 'date')).toBe(false);
  });
});
