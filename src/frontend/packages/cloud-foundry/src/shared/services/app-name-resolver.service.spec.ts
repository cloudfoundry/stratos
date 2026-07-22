// Spec for AppNameResolverService — slice-3 framework primitive.
// Verifies cache hit, batch coalescing, in-flight dedup, multi-cnsi
// isolation, and partial-cache resolveMany behavior.
//
// Uses provideHttpClient + provideHttpClientTesting + HttpTestingController
// (Angular 15+ pattern; HttpClientTestingModule is deprecated).
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { StAppsResponse } from '../../services/endpoint-data/stratos-types';
import { AppNameResolverService } from './app-name-resolver.service';

// Promise.resolve drains the microtask queue once; the resolver schedules
// its flush via queueMicrotask. A few flushes catch any chained microtask
// (computed re-evaluation) without resorting to fakeAsync.
async function tick(n = 4): Promise<void> {
  for (let i = 0; i < n; i++) await Promise.resolve();
}

function appsResponse(rows: Array<{ guid: string; name: string }>): StAppsResponse {
  return {
    resources: rows.map(r => ({
      guid: r.guid,
      name: r.name,
      state: 'STARTED',
      spaceGuid: 'space-1',
      instances: 1,
      routes: [],
      createdAt: '',
      updatedAt: '',
      cnsiGuid: 'cnsi-1',
    })),
    totalResults: rows.length,
  };
}

describe('AppNameResolverService', () => {
  let svc: AppNameResolverService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AppNameResolverService,
      ],
    });
    svc = TestBed.inject(AppNameResolverService);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  // ── cache hit ──────────────────────────────────────────────────────────────

  it('cache hit returns cached value synchronously, no network call', async () => {
    // Prime the cache with one resolve + flush.
    const sig = svc.resolve('cnsi-1', 'a');
    await tick();
    ctrl.expectOne('/pp/v1/cf/apps/cnsi-1?guids=a&per_page=1')
      .flush(appsResponse([{ guid: 'a', name: 'app-a' }]));
    await tick();
    expect(sig()).toBe('app-a');

    // Second call for same guid: signal already reads cached value, no
    // additional HTTP request fires.
    const sig2 = svc.resolve('cnsi-1', 'a');
    await tick();
    expect(sig2()).toBe('app-a');
    ctrl.expectNone(req => req.url.startsWith('/pp/v1/cf/apps/cnsi-1'));
  });

  // ── cache miss fires guids filter ──────────────────────────────────────────

  it('cache miss fires guids filter with the requested guid', async () => {
    const sig = svc.resolve('cnsi-1', 'b');
    await tick();
    const req = ctrl.expectOne('/pp/v1/cf/apps/cnsi-1?guids=b&per_page=1');
    expect(req.request.method).toBe('GET');
    req.flush(appsResponse([{ guid: 'b', name: 'app-b' }]));
    await tick();
    expect(sig()).toBe('app-b');
  });

  // ── batch coalescing ───────────────────────────────────────────────────────

  it('coalesces same-tick resolves for distinct guids into ONE batched request', async () => {
    const sigA = svc.resolve('cnsi-1', 'a');
    const sigB = svc.resolve('cnsi-1', 'b');
    const sigC = svc.resolve('cnsi-1', 'c');
    await tick();

    // Exactly one HTTP request, with all three guids in the query.
    const matches = ctrl.match(req => req.url.startsWith('/pp/v1/cf/apps/cnsi-1'));
    expect(matches.length).toBe(1);
    expect(matches[0].request.urlWithParams).toContain('guids=a,b,c');
    matches[0].flush(appsResponse([
      { guid: 'a', name: 'app-a' },
      { guid: 'b', name: 'app-b' },
      { guid: 'c', name: 'app-c' },
    ]));
    await tick();
    expect(sigA()).toBe('app-a');
    expect(sigB()).toBe('app-b');
    expect(sigC()).toBe('app-c');
  });

  // ── in-flight dedup ────────────────────────────────────────────────────────

  it('parallel resolve() calls for the same guid share a single request', async () => {
    const sig1 = svc.resolve('cnsi-1', 'x');
    const sig2 = svc.resolve('cnsi-1', 'x');
    await tick();

    const matches = ctrl.match(req => req.url.startsWith('/pp/v1/cf/apps/cnsi-1'));
    expect(matches.length).toBe(1);
    matches[0].flush(appsResponse([{ guid: 'x', name: 'app-x' }]));
    await tick();
    expect(sig1()).toBe('app-x');
    expect(sig2()).toBe('app-x');
  });

  // ── multi-cnsi isolation ───────────────────────────────────────────────────

  it('same guid in two cnsis is two cache slots and two requests', async () => {
    const sigA = svc.resolve('cnsi-1', 'shared-guid');
    const sigB = svc.resolve('cnsi-2', 'shared-guid');
    await tick();

    const r1 = ctrl.expectOne('/pp/v1/cf/apps/cnsi-1?guids=shared-guid&per_page=1');
    const r2 = ctrl.expectOne('/pp/v1/cf/apps/cnsi-2?guids=shared-guid&per_page=1');
    r1.flush(appsResponse([{ guid: 'shared-guid', name: 'name-in-cf-1' }]));
    r2.flush(appsResponse([{ guid: 'shared-guid', name: 'name-in-cf-2' }]));
    await tick();
    expect(sigA()).toBe('name-in-cf-1');
    expect(sigB()).toBe('name-in-cf-2');
  });

  // ── resolveMany partial cache ──────────────────────────────────────────────

  it('resolveMany fires guids filter for misses only when partial cache hit', async () => {
    // Prime cache for `a`.
    const primer = svc.resolve('cnsi-1', 'a');
    await tick();
    ctrl.expectOne('/pp/v1/cf/apps/cnsi-1?guids=a&per_page=1')
      .flush(appsResponse([{ guid: 'a', name: 'app-a' }]));
    await tick();
    expect(primer()).toBe('app-a');

    // Now bulk-request a, b, c. `a` is cached; only `b,c` should fly.
    const bulk = svc.resolveMany('cnsi-1', ['a', 'b', 'c']);
    await tick();

    const matches = ctrl.match(req => req.url.startsWith('/pp/v1/cf/apps/cnsi-1'));
    expect(matches.length).toBe(1);
    expect(matches[0].request.urlWithParams).toContain('guids=b,c');
    matches[0].flush(appsResponse([
      { guid: 'b', name: 'app-b' },
      { guid: 'c', name: 'app-c' },
    ]));
    await tick();

    const got = bulk();
    expect(got.get('a')).toBe('app-a');
    expect(got.get('b')).toBe('app-b');
    expect(got.get('c')).toBe('app-c');
  });
});
