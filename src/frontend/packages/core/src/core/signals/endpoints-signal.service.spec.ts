import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import type { EndpointModel, IRequestEntityTypeState, SessionData } from '@stratosui/store';

import { AuthSignalService } from './auth-signal.service';
import { EndpointsSignalService } from './endpoints-signal.service';

function makeAuthStub(sessionData: SessionData | null) {
  const sessionDataSig: WritableSignal<SessionData | null> = signal(sessionData);
  return {
    sessionData: sessionDataSig,
    setSessionData: (next: SessionData | null) => sessionDataSig.set(next),
  };
}

describe('EndpointsSignalService', () => {
  let entities$: BehaviorSubject<IRequestEntityTypeState<EndpointModel>>;
  let authStub: ReturnType<typeof makeAuthStub>;

  beforeEach(() => {
    entities$ = new BehaviorSubject<IRequestEntityTypeState<EndpointModel>>(
      {} as IRequestEntityTypeState<EndpointModel>
    );
    authStub = makeAuthStub(null);

    const stubStore = {
      select: () => entities$.asObservable(),
      dispatch: () => undefined,
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: stubStore },
        { provide: AuthSignalService, useValue: authStub },
        EndpointsSignalService,
      ],
    });
  });

  it('starts with empty endpoints and false flags', () => {
    const service = TestBed.inject(EndpointsSignalService);
    expect(service.endpoints()).toEqual({});
    expect(service.haveRegistered()).toBe(false);
    expect(service.haveConnected()).toBe(false);
    expect(service.connectedEndpoints()).toEqual([]);
    expect(service.disablePersistenceFeatures()).toBe(false);
  });

  it('flips haveRegistered when endpoints arrive', () => {
    const service = TestBed.inject(EndpointsSignalService);
    expect(service.haveRegistered()).toBe(false);

    entities$.next({
      'guid-1': {
        guid: 'guid-1',
        cnsi_type: 'cf',
        connectionStatus: 'disconnected',
      } as unknown as EndpointModel,
    } as IRequestEntityTypeState<EndpointModel>);

    expect(service.haveRegistered()).toBe(true);
    expect(Object.keys(service.endpoints()).length).toBe(1);
  });

  it('honours plugin-config.disablePersistenceFeatures from session data', () => {
    const service = TestBed.inject(EndpointsSignalService);
    expect(service.disablePersistenceFeatures()).toBe(false);

    authStub.setSessionData({
      valid: true,
      'plugin-config': { disablePersistenceFeatures: 'true' },
    } as unknown as SessionData);
    expect(service.disablePersistenceFeatures()).toBe(true);

    authStub.setSessionData({
      valid: true,
      'plugin-config': { disablePersistenceFeatures: 'false' },
    } as unknown as SessionData);
    expect(service.disablePersistenceFeatures()).toBe(false);
  });

  it('excludes endpoints whose type is not in the entity catalog from connected list', () => {
    const service = TestBed.inject(EndpointsSignalService);

    // Use an unregistered cnsi_type so the defensive guard returns false.
    entities$.next({
      'guid-1': {
        guid: 'guid-1',
        cnsi_type: '__unregistered_for_test__',
        connectionStatus: 'connected',
      } as unknown as EndpointModel,
    } as IRequestEntityTypeState<EndpointModel>);

    expect(service.haveRegistered()).toBe(true);
    expect(service.connectedEndpoints()).toEqual([]);
    expect(service.haveConnected()).toBe(false);
  });
});
