import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthState } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { CoreTestingModule } from '@test-framework/core-test.modules';
import { CoreModule } from './core/core.module';
import { CurrentUserPermissionsService } from './core/permissions/current-user-permissions.service';
import { AuthSignalService } from './core/signals/auth-signal.service';
import { DashboardSignalService } from './core/signals/dashboard-signal.service';
import { TailwindDialogService } from './shared/services/tailwind-dialog.service';
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
  const canNotLogout = signal(false);
  const dashboard = signal({ timeoutSession: false });
  const verifySession = vi.fn();
  const openDialog = vi.fn(() => ({ afterClosed: () => of(false) }));
  let service: LoggedInService;

  beforeEach(() => {
    verifySession.mockClear();
    openDialog.mockClear();
    dashboard.set({ timeoutSession: false });
    auth.set(undefined);
    canNotLogout.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthSignalService, useValue: { auth, verifySession } },
        { provide: DashboardSignalService, useValue: { dashboard } },
        { provide: TailwindDialogService, useValue: { open: openDialog } },
        { provide: CurrentUserPermissionsService, useValue: { can: () => canNotLogout } },
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

  // A user who cannot log out (no session to end) is never timed out; the
  // tracking follows that permission.
  it('tracks activity only while the user can log out', () => {
    canNotLogout.set(true);
    service.init();
    auth.set(validAuth);
    TestBed.tick();
    (service as any).lastUserInteraction = 0;
    document.dispatchEvent(new KeyboardEvent('keydown'));
    expect((service as any).lastUserInteraction).toBe(0);

    canNotLogout.set(false);
    TestBed.tick();
    document.dispatchEvent(new KeyboardEvent('keydown'));
    expect((service as any).lastUserInteraction).toBeGreaterThan(0);
  });

  // The session poll asks for the dashboard's timeout setting each tick, so
  // a change of it while the poll runs applies to the next tick.
  it('applies the timeout setting as it is when the poll ticks', () => {
    vi.useFakeTimers();
    try {
      service.init();
      auth.set({ ...validAuth, sessionData: { valid: true, sessionExpiresOn: Date.now() + 60_000 } } as unknown as AuthState);
      TestBed.tick();
      (service as any).lastUserInteraction = 0;

      vi.advanceTimersByTime(5000);
      expect(verifySession).toHaveBeenCalledTimes(1);
      expect(openDialog).not.toHaveBeenCalled();

      dashboard.set({ timeoutSession: true });
      (service as any).lastUserInteraction = 0;
      vi.advanceTimersByTime(5000);
      expect(openDialog).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
