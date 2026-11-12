import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { CurrentUserPermissionsService } from '../permissions/current-user-permissions.service';
import { PermissionsSignalService } from './permissions-signal.service';

describe('PermissionsSignalService', () => {
  const result = signal(false);
  let lastArgs: { action: any; endpointGuid?: string; rest: any[] } | null;

  beforeEach(() => {
    result.set(false);
    lastArgs = null;
    const stubPermissions = {
      can: (action: any, endpointGuid?: string, ...rest: any[]) => {
        lastArgs = { action, endpointGuid, rest };
        return result.asReadonly();
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

  it('returns the permission service signal', () => {
    const service = TestBed.inject(PermissionsSignalService);
    const sig = service.can('any.action');
    expect(sig()).toBe(false);

    result.set(true);
    expect(sig()).toBe(true);
  });

  it('forwards action, endpointGuid and extra args to the permission service', () => {
    const service = TestBed.inject(PermissionsSignalService);
    service.can('do.thing', 'endpoint-guid', 'org-guid', 'space-guid');
    expect(lastArgs).toEqual({
      action: 'do.thing',
      endpointGuid: 'endpoint-guid',
      rest: ['org-guid', 'space-guid'],
    });
  });
});
