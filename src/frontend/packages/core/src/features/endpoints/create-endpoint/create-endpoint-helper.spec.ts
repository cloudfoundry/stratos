import { Injector, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EndpointsDataService } from '@stratosui/store';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { UserProfileService } from '../../../core/user-profile.service';
import { SessionService } from '../../../shared/services/session.service';
import { CreateEndpointHelperComponent } from './create-endpoint-helper';

describe('CreateEndpointHelperComponent', () => {
  // An admin may create system endpoints when user endpoints are enabled;
  // the answer follows the admin permission.
  it('follows the admin permission for system endpoints', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const isAdmin = signal(false);
    const helper = new CreateEndpointHelperComponent(
      { userEndpointsNotDisabled: () => of(true) } as unknown as SessionService,
      { can: () => isAdmin } as unknown as CurrentUserPermissionsService,
      { loadUserProfile: () => undefined, userProfile: signal(null) } as unknown as UserProfileService,
      { endpointsList: signal([]) } as unknown as EndpointsDataService,
      TestBed.inject(Injector),
    );
    const answers: boolean[] = [];
    const sub = helper.userEndpointsAndIsAdmin.subscribe(v => answers.push(v));
    TestBed.tick();
    expect(answers.at(-1)).toBe(false);

    isAdmin.set(true);
    TestBed.tick();
    expect(answers.at(-1)).toBe(true);
    sub.unsubscribe();
  });
});
