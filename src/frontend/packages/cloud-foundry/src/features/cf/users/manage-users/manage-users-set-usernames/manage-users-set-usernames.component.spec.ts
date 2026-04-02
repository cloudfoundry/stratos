import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';

import { CFAppState } from '../../../../../cf-app-state';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { ManageUsersSetUsernamesComponent } from './manage-users-set-usernames.component';

describe('ManageUsersSetUsernamesComponent', () => {
  let component: ManageUsersSetUsernamesComponent;
  let fixture: ComponentFixture<ManageUsersSetUsernamesComponent>;
  let store: MockStore<CFAppState>;
  const cfGuid = 'cfGuid';

  beforeEach(async () => {
    // Mock CurrentUserPermissionsService to return observables that emit immediately
    // This avoids having to wait for actual permission checks
    const mockPermissionsService = {
      can: vi.fn().mockReturnValue(of(true))
    };

    // Set up initial state with CF roles initialized
    // This prevents EmptyError from waitForCFPermissions() -> take(1) in the constructor
    const initialState: Partial<CFAppState> = {
      currentUserRoles: {
        internal: {
          isAdmin: false,
          scopes: []
        },
        endpoints: {
          [CF_ENDPOINT_TYPE]: {
            [cfGuid]: {
              global: {
                isAdmin: false,
                isReadOnlyAdmin: false,
                isGlobalAuditor: false,
                canRead: true,
                canWrite: true,
                scopes: []
              },
              spaces: {},
              organizations: {},
              state: {
                initialised: true,
                fetching: false,
                error: false
              }
            }
          }
        },
        state: {
          initialised: true,
          fetching: false,
          error: false
        }
      }
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        ManageUsersSetUsernamesComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        provideMockStore({ initialState }),
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
        }
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUsersSetUsernamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
