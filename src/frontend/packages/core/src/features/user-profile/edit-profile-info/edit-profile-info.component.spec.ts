import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { STORE_TEST_PROVIDERS, createBasicStoreModule, AppTestModule } from '@test-framework/core-test.helper';
import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { UserProfileService } from '../../../core/user-profile.service';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { EditProfileInfoComponent } from './edit-profile-info.component';

describe('EditProfileInfoComponent', () => {
  let component: EditProfileInfoComponent;
  let fixture: ComponentFixture<EditProfileInfoComponent>;

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
        EditProfileInfoComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: UserProfileService, useValue: mockUserProfileService },
        TabNavService,
        CurrentUserPermissionsService,
        provideZonelessChangeDetection(),
      ],
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProfileInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fills the form from the loaded profile', async () => {
    await fixture.whenStable();
    expect(mockUserProfileService.loadUserProfile).toHaveBeenCalled();
    expect(component.editProfileForm.value.givenName).toBe('Test');
    expect(component.editProfileForm.value.emailAddress).toBe('test@test.com');
  });

  // The Change Password fields show only to a user with 'password.write'.
  it('offers Change Password only with the password permission', async () => {
    const canChange = signal(false);
    vi.spyOn(TestBed.inject(CurrentUserPermissionsService), 'can').mockReturnValue(canChange);
    const page = TestBed.createComponent(EditProfileInfoComponent);
    await page.whenStable();
    const text = () => (page.nativeElement as HTMLElement).textContent ?? '';
    expect(text()).not.toContain('Change Password');

    canChange.set(true);
    await page.whenStable();
    expect(text()).toContain('Change Password');
  });
});
