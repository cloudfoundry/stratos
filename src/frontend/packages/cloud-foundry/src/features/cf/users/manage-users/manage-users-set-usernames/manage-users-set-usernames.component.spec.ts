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

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUsersSetUsernamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('answers add and remove only once the feature flags have loaded', async () => {
    const src = getFeatureFlagsSource(cfGuid, TestBed.inject(HttpClient));
    let finishLoad!: () => void;
    vi.spyOn(src, 'load').mockReturnValue(new Promise<void>(resolve => finishLoad = resolve));
    const wizardStep = TestBed.createComponent(ManageUsersSetUsernamesComponent);

    const seen: boolean[] = [];
    const sub = wizardStep.componentInstance.canAdd$.subscribe(v => seen.push(v));
    await Promise.resolve();
    expect(seen).toEqual([]);

    finishLoad();
    await wizardStep.whenStable();
    expect(seen).toEqual([true]);
    sub.unsubscribe();
  });
});
