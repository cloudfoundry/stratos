import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EndpointDataRegistry } from './endpoint-data.registry';
import { EndpointDataShim } from './endpoint-data.shim';

describe('EndpointDataRegistry', () => {
  let registry: EndpointDataRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        EndpointDataRegistry,
        { provide: EndpointDataShim, useValue: { write: vi.fn() } },
      ],
    });
    registry = TestBed.inject(EndpointDataRegistry);
  });

  it('returns same service instance on repeated acquire() for same guid', () => {
    const svc1 = registry.acquire('guid-a');
    const svc2 = registry.acquire('guid-a');
    expect(svc1).toBe(svc2);
    registry.release('guid-a');
    registry.release('guid-a');
  });

  it('returns different instances for different guids', () => {
    const svc1 = registry.acquire('guid-a');
    const svc2 = registry.acquire('guid-b');
    expect(svc1).not.toBe(svc2);
    registry.release('guid-a');
    registry.release('guid-b');
  });

  it('retains instance after full release (sticky data)', () => {
    const svc = registry.acquire('guid-a');
    registry.release('guid-a');
    const svcAgain = registry.acquire('guid-a');
    expect(svc).toBe(svcAgain);
    registry.release('guid-a');
  });

  it('configure() sets maxConcurrentCards without throwing', () => {
    expect(() => registry.configure(4)).not.toThrow();
  });
});

// Defer chain: after a card's load() completes, the registry enqueues
// the corresponding details fetch via requestIdleCallback so the home
// dashboard's first paint doesn't compete with the (much heavier) drain
// for HTTP/1.1 connection-pool slots. These tests pin that wiring so a
// future refactor can't silently re-introduce the synchronous enqueue
// that was the perceived-perf regression.
describe('EndpointDataRegistry — details auto-chain defer', () => {
  let registry: EndpointDataRegistry;
  let httpMock: HttpTestingController;
  let originalRIC: unknown;

  beforeEach(() => {
    originalRIC = (globalThis as any).requestIdleCallback;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        EndpointDataRegistry,
        { provide: EndpointDataShim, useValue: { write: vi.fn() } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    (globalThis as any).requestIdleCallback = originalRIC;
  });

  it('uses requestIdleCallback when available to defer the details enqueue', async () => {
    const ricSpy = vi.fn();
    (globalThis as any).requestIdleCallback = ricSpy;
    registry = TestBed.inject(EndpointDataRegistry);

    registry.acquire('cnsi-1');
    // load() fires its 3 fast-path requests; flush them to drive
    // load() to complete, which triggers the tap that schedules the
    // details enqueue.
    httpMock.expectOne('/pp/v1/cf/orgs/cnsi-1?return=counts').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/apps/cnsi-1?return=recent').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/routes/cnsi-1?return=counts').flush({ totalResults: 0 });
    await Promise.resolve();
    await Promise.resolve();

    expect(ricSpy).toHaveBeenCalled();
    // First arg must be a function (the deferred enqueue); second arg
    // the timeout-bound options bag.
    expect(typeof ricSpy.mock.calls[0][0]).toBe('function');
    expect(ricSpy.mock.calls[0][1]).toMatchObject({ timeout: expect.any(Number) });
  });

  it('falls back to setTimeout when requestIdleCallback is not available (Safari)', async () => {
    (globalThis as any).requestIdleCallback = undefined;
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    registry = TestBed.inject(EndpointDataRegistry);

    registry.acquire('cnsi-1');
    httpMock.expectOne('/pp/v1/cf/orgs/cnsi-1?return=counts').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/apps/cnsi-1?return=recent').flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/routes/cnsi-1?return=counts').flush({ totalResults: 0 });
    await Promise.resolve();
    await Promise.resolve();

    // Allow other framework setTimeouts; just assert ours fired.
    const ourCall = setTimeoutSpy.mock.calls.find(([_fn, delay]) => delay === 500);
    expect(ourCall).toBeDefined();
    setTimeoutSpy.mockRestore();
  });
});
