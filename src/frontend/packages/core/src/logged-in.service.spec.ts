import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthState } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { of } from 'rxjs';

import { CoreTestingModule } from '@test-framework/core-test.modules';
import { CoreModule } from './core/core.module';
import { CurrentUserPermissionsService } from './core/permissions/current-user-permissions.service';
import { AuthSignalService } from './core/signals/auth-signal.service';
import { DashboardSignalService } from './core/signals/dashboard-signal.service';
import { LoggedInService } from './logged-in.service';

describe('LoggedInService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggedInService,
        CurrentUserPermissionsService,
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ],
      imports: [
        CoreModule,
        NoopAnimationsModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([LoggedInService], (service: LoggedInService) => {
    expect(service).toBeTruthy();
  }));
});

describe('LoggedInService activity tracking', () => {
  const validAuth = { loggedIn: true, sessionData: { valid: true }, error: false } as unknown as AuthState;
  const auth = signal<AuthState | undefined>(undefined);
  let service: LoggedInService;

  beforeEach(() => {
    auth.set(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthSignalService, useValue: { auth } },
        { provide: DashboardSignalService, useValue: { dashboard: signal({}) } },
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(false) } },
      ],
    });
    service = TestBed.inject(LoggedInService);
  });

  afterEach(() => service.destroy());

  // A keepalive blip makes the session briefly invalid, which stops the
  // activity listener. Once the session is valid again the listener must
  // come back, or an active user is warned and logged out as idle.
  it('tracks user activity again after the session recovers', () => {
    service.init();
    auth.set(validAuth);
    TestBed.tick();
    auth.set({ ...validAuth, error: true });
    TestBed.tick();
    auth.set(validAuth);
    TestBed.tick();

    (service as any).lastUserInteraction = 0;
    document.dispatchEvent(new KeyboardEvent('keydown'));

    expect((service as any).lastUserInteraction).toBeGreaterThan(0);
  });
});
