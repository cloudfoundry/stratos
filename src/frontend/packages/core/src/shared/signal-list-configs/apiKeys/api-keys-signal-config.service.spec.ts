import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKey } from '@stratosui/store';
import { BASE_TEST_PROVIDERS } from '@test-framework/core-test.helper';

import { SignalListColumn } from '../../components/signal-list/signal-list.component';
import { ApiKeysSignalConfigService, keyExpiry, timeOfDay } from './api-keys-signal-config.service';

const NOW = new Date('2026-10-28T12:00:00Z');
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
    expect(keyExpiry(expiring(-0.5), NOW)).toEqual({ state: 'expired', days: 0 });
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

  it('expired is danger', () => {
    expect(cell(expiring(-0.5))).toBe('Expired today');
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
