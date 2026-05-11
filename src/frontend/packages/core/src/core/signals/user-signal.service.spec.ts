import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import type { SessionData } from '@stratosui/store';

import { AuthSignalService } from './auth-signal.service';
import { UserSignalService } from './user-signal.service';

function makeAuthStub(sessionData: SessionData | null) {
  const sessionDataSig: WritableSignal<SessionData | null> = signal(sessionData);
  return {
    sessionData: sessionDataSig,
    setSessionData: (next: SessionData | null) => sessionDataSig.set(next),
  };
}

describe('UserSignalService', () => {
  let stub: ReturnType<typeof makeAuthStub>;

  beforeEach(() => {
    stub = makeAuthStub(null);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthSignalService, useValue: stub },
        UserSignalService,
      ],
    });
  });

  it('returns false flags when sessionData is null', () => {
    const service = TestBed.inject(UserSignalService);
    expect(service.isAdmin()).toBe(false);
    expect(service.isEndpointAdmin()).toBe(false);
  });

  it('flags admin users from sessionData.user.admin', () => {
    stub.setSessionData({
      valid: true,
      user: { guid: 'u1', name: 'admin', admin: true, scopes: [] },
    } as unknown as SessionData);

    const service = TestBed.inject(UserSignalService);
    expect(service.isAdmin()).toBe(true);
    expect(service.isEndpointAdmin()).toBe(false);
  });

  it('flags endpoint-admin users via the stratos.endpointadmin scope', () => {
    stub.setSessionData({
      valid: true,
      user: { guid: 'u2', name: 'epadmin', admin: false, scopes: ['stratos.endpointadmin', 'other'] },
    } as unknown as SessionData);

    const service = TestBed.inject(UserSignalService);
    expect(service.isAdmin()).toBe(false);
    expect(service.isEndpointAdmin()).toBe(true);
  });

  it('does not flag endpoint-admin without the scope', () => {
    stub.setSessionData({
      valid: true,
      user: { guid: 'u3', name: 'plain', admin: false, scopes: ['something.else'] },
    } as unknown as SessionData);

    const service = TestBed.inject(UserSignalService);
    expect(service.isEndpointAdmin()).toBe(false);
  });
});
