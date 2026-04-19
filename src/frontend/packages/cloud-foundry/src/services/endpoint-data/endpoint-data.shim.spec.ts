import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { EndpointDataShim } from './endpoint-data.shim';
import { StEndpointData } from './stratos-types';

describe('EndpointDataShim', () => {
  let shim: EndpointDataShim;
  let dispatchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dispatchSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        EndpointDataShim,
        { provide: Store, useValue: { dispatch: dispatchSpy } },
      ],
    });
    shim = TestBed.inject(EndpointDataShim);
  });

  it('does not throw and does not dispatch when write() is called with data', () => {
    const data: StEndpointData = {
      orgs: [{ guid: 'org-1', name: 'Org One', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] }],
      apps: [],
      routeCount: 5,
    };
    expect(() => shim.write('cnsi-guid-1', data)).not.toThrow();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not throw and does not dispatch when called with empty data', () => {
    expect(() => shim.write('cnsi-guid-1', { orgs: [], apps: [], routeCount: 0 })).not.toThrow();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
