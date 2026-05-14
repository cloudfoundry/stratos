import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import type { EndpointState } from '@stratosui/store';

import { EndpointStatusSignalService } from './endpoint-status-signal.service';

function makeState(overrides: Partial<EndpointState> = {}): EndpointState {
  return { loading: false, error: false, message: '', ...overrides };
}

describe('EndpointStatusSignalService', () => {
  let status$: BehaviorSubject<EndpointState>;

  beforeEach(() => {
    status$ = new BehaviorSubject<EndpointState>(makeState({ loading: true }));
    const stubStore = {
      select: () => status$.asObservable(),
      dispatch: () => undefined,
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: stubStore },
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
    status$.next(makeState({ loading: false }));
    expect(service.loading()).toBe(false);
    expect(service.initialised()).toBe(true);
  });

  it('reflects error+message updates', () => {
    const service = TestBed.inject(EndpointStatusSignalService);
    status$.next(makeState({ error: true, message: 'nope' }));
    expect(service.error()).toBe(true);
    expect(service.message()).toBe('nope');
  });
});
