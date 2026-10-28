import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKey } from '@stratosui/store';
import { BASE_TEST_PROVIDERS } from '@test-framework/core-test.helper';

import { SignalListColumn } from '../../components/signal-list/signal-list.component';
import { ApiKeysSignalConfigService, keyExpiry, timeOfDay } from './api-keys-signal-config.service';

// Local noon: the calendar-day rules read the viewer's zone.
const NOW = new Date(2026, 9, 28, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const at = (days: number) => new Date(NOW.getTime() + days * DAY);

function key(over: Partial<ApiKey> = {}): ApiKey {
  return {
    guid: 'g', comment: 'CI', user_guid: 'u', secret: '', last_used: '',
    expires_at: null, last_used_refused: false, ...over,
  };
}
const expiring = (days: number) => key({ expires_at: at(days).toISOString() });

describe('keyExpiry', () => {
  it('never for a key without an expiry', () => {
    expect(keyExpiry(key(), NOW)).toEqual({ state: 'never', days: 0 });
  });
  it('ok beyond 7 days, soon from 7', () => {
    expect(keyExpiry(expiring(8), NOW).state).toBe('ok');
    expect(keyExpiry(expiring(7), NOW)).toEqual({ state: 'soon', days: 7 });
  });
  it('expired from the exact expiry instant', () => {
    expect(keyExpiry(expiring(0), NOW).state).toBe('expired');
    expect(keyExpiry(expiring(0.0001), NOW).state).toBe('soon');
  });
  it('counts whole days since expiry', () => {
    expect(keyExpiry(expiring(-0.25), NOW)).toEqual({ state: 'expired', days: 0 });
    expect(keyExpiry(expiring(-12), NOW)).toEqual({ state: 'expired', days: 12 });
  });
});

describe('ApiKeysSignalConfigService columns', () => {
  let columns: SignalListColumn<ApiKey>[];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    TestBed.configureTestingModule({
      providers: [...BASE_TEST_PROVIDERS, provideZonelessChangeDetection(), ApiKeysSignalConfigService],
    });
    columns = TestBed.inject(ApiKeysSignalConfigService).buildConfig().columns;
  });
  afterEach(() => vi.useRealTimers());

  const col = (header: string) => columns.find(c => c.header === header)!;
  const cell = (k: ApiKey) => col('Expires').render(k);
  const color = (k: ApiKey) => col('Expires').pillColor!(k);

  it('puts Expires after Last Used', () => {
    const headers = columns.map(c => c.header);
    expect(headers.indexOf('Expires')).toBe(headers.indexOf('Last Used') + 1);
    expect(col('Expires').kind).toBe('pill');
  });

  it('Never is neutral', () => {
    expect(cell(key())).toBe('Never');
    expect(color(key())).toBe('neutral');
  });

  it('a date beyond 7 days is neutral', () => {
    const k = expiring(20);
    expect(cell(k)).toBe(new Date(k.expires_at!).toLocaleDateString());
    expect(color(k)).toBe('neutral');
  });

  it('warns in days, then tomorrow with the time', () => {
    expect(cell(expiring(5))).toBe('in 5 days');
    expect(color(expiring(5))).toBe('warning');
    const k = expiring(20 / 24);
    expect(cell(k)).toBe(`tomorrow ${timeOfDay(new Date(k.expires_at!))}`);
    expect(color(k)).toBe('warning');
  });

  // Local calendar days, not 24-hour buckets.
  it('says today or tomorrow by the local date', () => {
    const seenAt = (h: number) => vi.setSystemTime(new Date(2026, 9, 28, h, 0, 0));
    const local = (d: number, h: number) => key({ expires_at: new Date(2026, 9, d, h, 0, 0).toISOString() });
    seenAt(9);
    expect(cell(local(28, 15))).toBe(`today ${timeOfDay(new Date(2026, 9, 28, 15))}`);
    seenAt(22);
    expect(cell(local(29, 1))).toBe(`tomorrow ${timeOfDay(new Date(2026, 9, 29, 1))}`);
    seenAt(8);
    expect(cell(local(27, 22))).toBe('Expired 1 day ago');
  });

  it('expired is danger', () => {
    expect(cell(expiring(-0.25))).toBe('Expired today');
    expect(cell(expiring(-12))).toBe('Expired 12 days ago');
    expect(color(expiring(-12))).toBe('danger');
  });

  it('Last Used says when a use was refused', () => {
    const when = '2026-10-16T12:00:00Z';
    const base = new Date(when).toLocaleString();
    expect(col('Last Used').render(key({ last_used: when }))).toBe(base);
    expect(col('Last Used').render(key({ last_used: when, last_used_refused: true }))).toBe(`${base}, refused`);
  });
});
