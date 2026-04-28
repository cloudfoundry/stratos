import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { SessionData, SessionDataConfig } from '@stratosui/store';

import { DashboardPreferencesService, DASHBOARD_PREFS_STORAGE_KEY_PREFIX } from './dashboard-preferences.service';
import { SessionService } from './session.service';

function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

function makeSessionStub(username: string | null): SessionService {
  const sessionData: WritableSignal<SessionData | null> = signal(
    username
      ? ({ user: { name: username }, config: {} } as unknown as SessionData)
      : null,
  );
  const config: WritableSignal<SessionDataConfig | null> = signal(null);
  return {
    sessionData,
    config,
  } as unknown as SessionService;
}

describe('DashboardPreferencesService', () => {
  const username = 'norm-test';
  const storageKey = `${DASHBOARD_PREFS_STORAGE_KEY_PREFIX}${username}`;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  function configure(sessionStub: SessionService): DashboardPreferencesService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SessionService, useValue: sessionStub },
        DashboardPreferencesService,
      ],
    });
    return TestBed.inject(DashboardPreferencesService);
  }

  it('starts with default values when nothing is persisted', () => {
    const service = configure(makeSessionStub(username));
    flushEffects();
    expect(service.homeShowAllEndpoints()).toBeNull();
    expect(service.homeLayout()).toBe(0);
  });

  it('hydrates from localStorage on construction when the user is known', () => {
    localStorage.setItem(storageKey, JSON.stringify({ homeShowAllEndpoints: true, homeLayout: 3 }));

    const service = configure(makeSessionStub(username));
    flushEffects();

    expect(service.homeShowAllEndpoints()).toBe(true);
    expect(service.homeLayout()).toBe(3);
  });

  it('persists changes to localStorage', () => {
    const service = configure(makeSessionStub(username));
    flushEffects();
    service.setHomeShowAllEndpoints(true);
    service.setHomeLayout(2);
    flushEffects();

    const raw = localStorage.getItem(storageKey);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual({ homeShowAllEndpoints: true, homeLayout: 2 });
  });

  it('does not persist when the user is not yet known', () => {
    const service = configure(makeSessionStub(null));
    flushEffects();
    service.setHomeShowAllEndpoints(true);
    flushEffects();

    expect(localStorage.getItem(storageKey)).toBeNull();
  });
});
