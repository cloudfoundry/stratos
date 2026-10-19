import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs';
import { AuthDataService, AuthState } from '@stratosui/store';

import { authGuard } from './auth-guard.service';

describe('authGuard', () => {
  let _router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        RouterTestingModule,
      ]
    });
    _router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should return a function', () => {
    expect(typeof authGuard).toBe('function');
  });
});

describe('authGuard runs', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/applications?x=1' } as RouterStateSnapshot;
  const auth = signal<AuthState | undefined>(undefined);
  // Every read of auth comes from a live watcher of the signal, so the
  // count after a change is the number of watchers left behind.
  let authReads = 0;
  let navigateAndRememberRedirect: ReturnType<typeof vi.fn>;

  function authState(valid: boolean, verifying = false): AuthState {
    return { loggedIn: valid, verifying, sessionData: { valid } } as AuthState;
  }

  function runGuard(): boolean[] {
    const results: boolean[] = [];
    const guard$ = TestBed.runInInjectionContext(() => authGuard(route, state)) as Observable<boolean>;
    guard$.subscribe(result => results.push(result));
    return results;
  }

  beforeEach(() => {
    authReads = 0;
    auth.set(authState(true));
    navigateAndRememberRedirect = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AuthDataService,
          useValue: {
            auth: () => {
              authReads++;
              return auth();
            },
            navigateAndRememberRedirect,
          },
        },
      ],
    });
  });

  it('allows a valid session', () => {
    const results = runGuard();
    TestBed.tick();
    expect(results).toEqual([true]);
    expect(navigateAndRememberRedirect).not.toHaveBeenCalled();
  });

  it('redirects to login and remembers the target when the session is invalid', () => {
    auth.set(authState(false));
    const results = runGuard();
    TestBed.tick();
    expect(results).toEqual([false]);
    expect(navigateAndRememberRedirect).toHaveBeenCalledWith(['/login'], {
      path: '/applications',
      queryParams: { x: '1' },
    });
  });

  it('waits until verification ends', () => {
    auth.set(authState(true, true));
    const results = runGuard();
    TestBed.tick();
    expect(results).toEqual([]);

    auth.set(authState(true));
    TestBed.tick();
    expect(results).toEqual([true]);
  });

  it('leaves no auth watcher behind after it resolves', () => {
    const runs = [runGuard(), runGuard(), runGuard()];
    TestBed.tick();
    expect(runs).toEqual([[true], [true], [true]]);

    authReads = 0;
    auth.set(authState(false));
    TestBed.tick();
    expect(authReads).toBe(0);
  });
});
