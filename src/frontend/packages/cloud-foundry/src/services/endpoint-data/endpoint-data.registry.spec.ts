import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
