import { Injector, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EndpointModel, EndpointsDataService, UserProfileInfo } from '@stratosui/store';
import { describe, expect, it } from 'vitest';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { SessionSignalService } from '../../../core/signals/session-signal.service';
import { UserProfileService } from '../../../core/user-profile.service';
import { CreateEndpointHelperComponent } from './create-endpoint-helper';

const endpoint = (guid: string, system: boolean, creator: string) => ({
  guid,
  name: guid,
  creator: { name: creator, admin: false, system },
  api_endpoint: { Scheme: 'https', Host: `${guid}.example.com`, Path: '' },
}) as EndpointModel;

describe('CreateEndpointHelperComponent', () => {
  function setup() {
    const notDisabled = signal(true);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SessionSignalService, useValue: { userEndpointsNotDisabled: notDisabled } },
      ],
    });
    const isAdmin = signal(false);
    const list = signal<EndpointModel[]>([]);
    const profile = signal<UserProfileInfo | null>(null);
    const helper = new CreateEndpointHelperComponent(
      { can: () => isAdmin } as unknown as CurrentUserPermissionsService,
      { loadUserProfile: () => undefined, userProfile: profile } as unknown as UserProfileService,
      { endpointsList: list } as unknown as EndpointsDataService,
      TestBed.inject(Injector),
    );
    return { helper, isAdmin, list, profile, notDisabled };
  }

  // An admin may create system endpoints when user endpoints are enabled;
  // the answer follows the admin permission.
  it('follows the admin permission for system endpoints', () => {
    const { helper, isAdmin } = setup();
    expect(helper.userEndpointsAndIsAdminSignal()).toBe(false);

    isAdmin.set(true);
    expect(helper.userEndpointsAndIsAdminSignal()).toBe(true);
  });

  // Which endpoints a new one is compared with depends on the setting and
  // the role; it follows both, and waits for the profile.
  it('picks the endpoints to compare with from the setting, the role and the profile', () => {
    const { helper, isAdmin, list, profile, notDisabled } = setup();
    list.set([endpoint('sys', true, 'admin'), endpoint('mine', false, 'me'), endpoint('theirs', false, 'you')]);
    const names = () => helper.customEndpointsSignal()?.names;
    expect(names()).toBeUndefined();

    profile.set({ userName: 'me' } as UserProfileInfo);
    expect(names()).toEqual(['mine']);
    expect(helper.existingPersonalEndpointsSignal()?.names).toEqual(['mine']);
    expect(helper.existingSystemEndpointsSignal().names).toEqual(['sys']);
    expect(helper.existingEndpointsSignal().urls).toContain('https://sys.example.com');

    isAdmin.set(true);
    expect(names()).toEqual(['sys']);

    notDisabled.set(false);
    expect(names()).toEqual(['sys', 'mine', 'theirs']);
  });
});
