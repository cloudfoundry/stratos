import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { EndpointsDataService } from '@stratosui/store';

import { EndpointStatusSignalService } from './endpoint-status-signal.service';

function makeEndpointsServiceStub(initialLoading = true, initialError: string | null = null) {
  const loading: WritableSignal<boolean> = signal(initialLoading);
  const error: WritableSignal<string | null> = signal(initialError);
  return {
    loading,
    error,
    setLoading: (v: boolean) => loading.set(v),
    setError: (v: string | null) => error.set(v),
  };
}

describe('EndpointStatusSignalService', () => {
  let endpointsServiceStub: ReturnType<typeof makeEndpointsServiceStub>;

  beforeEach(() => {
    endpointsServiceStub = makeEndpointsServiceStub(true, null);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointsDataService, useValue: endpointsServiceStub },
        EndpointStatusSignalService,
      ],
    });
  });

  it('reflects initial loading=true / not initialised', () => {
    const service = TestBed.inject(EndpointStatusSignalService);
    expect(service.loading()).toBe(true);
    expect(service.initialised()).toBe(false);
    expect(service.error()).toBe(false);
  });

  it('flips initialised once loading clears', () => {
    const service = TestBed.inject(EndpointStatusSignalService);
    endpointsServiceStub.setLoading(false);
    expect(service.loading()).toBe(false);
    expect(service.initialised()).toBe(true);
  });

  it('reflects error+message updates', () => {
    const service = TestBed.inject(EndpointStatusSignalService);
    endpointsServiceStub.setLoading(false);
    endpointsServiceStub.setError('nope');
    expect(service.error()).toBe(true);
    expect(service.message()).toBe('nope');
  });
});
