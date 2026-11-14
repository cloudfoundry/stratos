import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { CfCurrentUserRolesDataService } from '../../../../../services/cf-current-user-roles-data.service';
import { getFeatureFlagsSource } from '../../../../../user-permissions/feature-flags-cache';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { ManageUsersSetUsernamesComponent } from './manage-users-set-usernames.component';

describe('ManageUsersSetUsernamesComponent', () => {
  let component: ManageUsersSetUsernamesComponent;
  let fixture: ComponentFixture<ManageUsersSetUsernamesComponent>;
  const cfGuid = 'cfGuid';

  beforeEach(async () => {
    // Mock CurrentUserPermissionsService to return observables that emit immediately
    // This avoids having to wait for actual permission checks
    const mockPermissionsService = {
      can: vi.fn().mockReturnValue(signal(true))
    };

    await TestBed.configureTestingModule({
      imports: [
        ManageUsersSetUsernamesComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid,
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
        {
          provide: CurrentUserPermissionsService,
          useValue: mockPermissionsService
        },
        // The endpoint's roles have loaded.
        {
          provide: CfCurrentUserRolesDataService,
          useValue: { cfEndpointRolesState: () => signal({ state: { initialised: true } }) }
        }
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ManageUsersSetUsernamesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('answers add and remove only once the feature flags have loaded', async () => {
    const src = getFeatureFlagsSource(cfGuid, TestBed.inject(HttpClient));
    let finishLoad!: () => void;
    vi.spyOn(src, 'load').mockReturnValue(new Promise<void>(resolve => finishLoad = resolve));
    const wizardStep = TestBed.createComponent(ManageUsersSetUsernamesComponent);

    const step = wizardStep.componentInstance;
    await wizardStep.whenStable();
    expect(step.blocked()).toBe(true);
    expect(step.currentValue()).toBeUndefined();
    expect((wizardStep.nativeElement as HTMLElement).querySelector('.usernames')).toBeNull();

    finishLoad();
    // The load's continuation runs in a microtask; the view refreshes after.
    await Promise.resolve();
    await wizardStep.whenStable();
    expect(step.blocked()).toBe(false);
    expect(step.canAdd()).toBe(true);
    expect(step.canRemove()).toBe(true);
    // Adding is allowed, so the add choice is the one picked first.
    expect(step.currentValue()).toBe(false);
    const add = (wizardStep.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#manage-add-roles');
    expect(add?.checked).toBe(true);
  });
});
