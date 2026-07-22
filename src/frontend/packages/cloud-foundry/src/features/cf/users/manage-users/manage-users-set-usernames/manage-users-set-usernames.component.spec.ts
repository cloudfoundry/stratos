import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

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
      can: vi.fn().mockReturnValue(of(true))
    };

    await TestBed.configureTestingModule({
      imports: [
        ManageUsersSetUsernamesComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
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
});
