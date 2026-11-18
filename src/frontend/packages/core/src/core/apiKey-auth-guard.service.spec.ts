import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthDataService, SessionData } from '@stratosui/store';
import { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiKeyAuthGuard } from './apiKey-auth-guard.service';
import { CurrentUserPermissionsService } from './permissions/current-user-permissions.service';

describe('apiKeyAuthGuard', () => {
  const sessionData = signal<SessionData | null>(null);
  const canUseKeys = signal(false);
  const navigate = vi.fn();

  beforeEach(() => {
    sessionData.set(null);
    canUseKeys.set(false);
    navigate.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthDataService, useValue: { sessionData } },
        { provide: CurrentUserPermissionsService, useValue: { can: () => canUseKeys } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  const run = () => {
    const answers: boolean[] = [];
    const result = TestBed.runInInjectionContext(() =>
      apiKeyAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as Observable<boolean>;
    result.subscribe(v => answers.push(v));
    return answers;
  };

  // The permission reads false until the session is verified; the guard
  // must not turn that early false into a redirect.
  it('waits for the session before answering', async () => {
    const answers = run();
    TestBed.tick();
    expect(answers).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();

    canUseKeys.set(true);
    sessionData.set({ valid: true } as SessionData);
    TestBed.tick();
    expect(answers).toEqual([true]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends a user without API key access home', () => {
    sessionData.set({ valid: true } as SessionData);
    const answers = run();
    TestBed.tick();
    expect(answers).toEqual([false]);
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
