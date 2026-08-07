import { describe, expect, it } from 'vitest';
import { rangeMatches, SignalListRangeValue } from './range-filter';

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
