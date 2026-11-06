import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { CurrentUserPermissionsService } from '../permissions/current-user-permissions.service';
import { PermissionsSignalService } from './permissions-signal.service';

function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

describe('PermissionsSignalService', () => {
  let result$: BehaviorSubject<boolean>;
  let lastArgs: { action: any; endpointGuid?: string; rest: any[] } | null;

  beforeEach(() => {
    result$ = new BehaviorSubject<boolean>(false);
    lastArgs = null;
    const stubPermissions = {
      can: (action: any, endpointGuid?: string, ...rest: any[]) => {
        lastArgs = { action, endpointGuid, rest };
        return result$.asObservable();
      },
    } as unknown as CurrentUserPermissionsService;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CurrentUserPermissionsService, useValue: stubPermissions },
        PermissionsSignalService,
      ],
    });
  });

  it('returns a signal seeded with false', () => {
    const service = TestBed.inject(PermissionsSignalService);
    const sig = service.can('any.action');
    expect(sig()).toBe(false);
  });

  it('reflects underlying permission emissions', () => {
    const service = TestBed.inject(PermissionsSignalService);
    const sig = service.can('any.action');
    flushEffects();
    expect(sig()).toBe(false);

    result$.next(true);
    flushEffects();
    expect(sig()).toBe(true);
  });

  it('forwards action, endpointGuid and extra args to the legacy service', () => {
    const service = TestBed.inject(PermissionsSignalService);
    service.can('do.thing', 'endpoint-guid', 'org-guid', 'space-guid');
    expect(lastArgs).toEqual({
      action: 'do.thing',
      endpointGuid: 'endpoint-guid',
      rest: ['org-guid', 'space-guid'],
    });
  });

  it('deduplicates identical consecutive emissions via distinctUntilChanged', () => {
    const service = TestBed.inject(PermissionsSignalService);
    const sig = service.can('any.action');
    flushEffects();
    expect(sig()).toBe(false);

    // Pump the same value through; signal should stay at false.
    result$.next(false);
    flushEffects();
    expect(sig()).toBe(false);

    result$.next(true);
    flushEffects();
    expect(sig()).toBe(true);
  });
});
