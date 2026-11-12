import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { STORE_TEST_PROVIDERS, createBasicStoreModule, AppTestModule, CoreTestingModule } from '@test-framework';
import { CoreModule } from '../../../core/core.module';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { UserProfileService } from '../../../core/user-profile.service';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { ProfileInfoComponent } from './profile-info.component';

describe('ProfileInfoComponent', () => {
  let component: ProfileInfoComponent;
  let fixture: ComponentFixture<ProfileInfoComponent>;

  // Mock UserProfileService to avoid entity catalog issues
  const mockUserProfileService = {
    userProfile: signal({
      id: 'test-user',
      name: {
        familyName: 'User',
        givenName: 'Test'
      },
      userName: 'test-user',
      emails: [{
        primary: true,
        value: 'test@test.com'
      }],
      meta: {
        version: 1,
        created: '',
        lastModified: ''
      },
      verified: true,
      active: true,
      passwordLastModified: '',
      schemas: '',
      zoneId: '',
      origin: ''
    }),
    isError: signal(false),
    loadUserProfile: vi.fn(),
    fetchUserProfile: vi.fn(),
    getPrimaryEmailAddress: vi.fn().mockReturnValue('test@test.com'),
    setPrimaryEmailAddress: vi.fn(),
    updateProfile: vi.fn().mockReturnValue(of([{}, {}]))
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        CoreTestingModule,
        createBasicStoreModule(),
        AppTestModule,
        ProfileInfoComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: UserProfileService, useValue: mockUserProfileService },
        TabNavService,
        CurrentUserPermissionsService,
        provideZonelessChangeDetection(),
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The page loads the profile itself; the header's user menu, which also
  // loads it, can be configured away.
  it('loads the profile it shows', () => {
    mockUserProfileService.loadUserProfile.mockClear();
    TestBed.createComponent(ProfileInfoComponent);
    expect(mockUserProfileService.loadUserProfile).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('test@test.com');
  });
});
