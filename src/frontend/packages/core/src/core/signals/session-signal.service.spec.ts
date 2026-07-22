import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import type { SessionData } from '@stratosui/store';
import { UserEndpointsEnabled } from '@stratosui/store';

import { AuthSignalService } from './auth-signal.service';
import { SessionSignalService } from './session-signal.service';

function makeAuthStub(sessionData: SessionData | null) {
  const sessionDataSig: WritableSignal<SessionData | null> = signal(sessionData);
  return {
    sessionData: sessionDataSig,
    setSessionData: (next: SessionData | null) => sessionDataSig.set(next),
  };
}

describe('SessionSignalService', () => {
  let stub: ReturnType<typeof makeAuthStub>;

  beforeEach(() => {
    stub = makeAuthStub(null);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthSignalService, useValue: stub },
        SessionSignalService,
      ],
    });
  });

  it('returns false flags when sessionData is null', () => {
    const service = TestBed.inject(SessionSignalService);
    expect(service.sessionData()).toBeNull();
    expect(service.config()).toBeNull();
    expect(service.isTechPreview()).toBe(false);
    expect(service.userEndpointsEnabled()).toBe(false);
    // userEndpointsNotDisabled is true unless explicitly DISABLED.
    expect(service.userEndpointsNotDisabled()).toBe(true);
  });

  it('reflects techPreview + userEndpointsEnabled from session config', () => {
    stub.setSessionData({
      valid: true,
      config: {
        enableTechPreview: true,
        userEndpointsEnabled: UserEndpointsEnabled.ENABLED,
      },
    } as unknown as SessionData);

    const service = TestBed.inject(SessionSignalService);
    expect(service.isTechPreview()).toBe(true);
    expect(service.userEndpointsEnabled()).toBe(true);
    expect(service.userEndpointsNotDisabled()).toBe(true);
  });

  it('projects the SessionDataConfig object verbatim onto config()', () => {
    const config = {
      enableTechPreview: true,
      userEndpointsEnabled: UserEndpointsEnabled.ADMIN_ONLY,
    };
    stub.setSessionData({ valid: true, config } as unknown as SessionData);

    const service = TestBed.inject(SessionSignalService);
    expect(service.config()).toEqual(config);
  });

  it('reacts to upstream sessionData changes (signal pass-through)', () => {
    const service = TestBed.inject(SessionSignalService);
    expect(service.isTechPreview()).toBe(false);

    stub.setSessionData({
      valid: true,
      config: { enableTechPreview: true },
    } as unknown as SessionData);
    expect(service.isTechPreview()).toBe(true);

    stub.setSessionData(null);
    expect(service.isTechPreview()).toBe(false);
    expect(service.config()).toBeNull();
  });

  it('treats DISABLED as both not-enabled and not-not-disabled', () => {
    stub.setSessionData({
      valid: true,
      config: { userEndpointsEnabled: UserEndpointsEnabled.DISABLED },
    } as unknown as SessionData);

    const service = TestBed.inject(SessionSignalService);
    expect(service.userEndpointsEnabled()).toBe(false);
    expect(service.userEndpointsNotDisabled()).toBe(false);
  });

  it('treats ADMIN_ONLY as not-enabled but still not-disabled', () => {
    stub.setSessionData({
      valid: true,
      config: { userEndpointsEnabled: UserEndpointsEnabled.ADMIN_ONLY },
    } as unknown as SessionData);

    const service = TestBed.inject(SessionSignalService);
    expect(service.userEndpointsEnabled()).toBe(false);
    expect(service.userEndpointsNotDisabled()).toBe(true);
  });
});
