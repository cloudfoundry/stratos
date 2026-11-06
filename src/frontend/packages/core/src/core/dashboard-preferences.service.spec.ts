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
    expect(service.homeShowMode()).toBeNull();
    expect(service.homeLayout()).toBe(0);
  });

  it('hydrates from localStorage on construction when the user is known', () => {
    localStorage.setItem(storageKey, JSON.stringify({ homeShowMode: 'connected', homeLayout: 3 }));

    const service = configure(makeSessionStub(username));
    flushEffects();

    expect(service.homeShowMode()).toBe('connected');
    expect(service.homeLayout()).toBe(3);
  });

  it('persists changes to localStorage', () => {
    const service = configure(makeSessionStub(username));
    flushEffects();
    service.setHomeShowMode('connected');
    service.setHomeLayout(2);
    flushEffects();

    const raw = localStorage.getItem(storageKey);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual({ homeShowMode: 'connected', homeLayout: 2, homeSortDirection: 'asc' });
  });

  it('does not persist when the user is not yet known', () => {
    const service = configure(makeSessionStub(null));
    flushEffects();
    service.setHomeShowMode('connected');
    flushEffects();

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('migrates the legacy boolean pref to a show mode', () => {
    localStorage.setItem(storageKey, JSON.stringify({ homeShowAllEndpoints: false, homeLayout: 0 }));

    const service = configure(makeSessionStub(username));
    flushEffects();

    expect(service.homeShowMode()).toBe('favorites');
  });
});
