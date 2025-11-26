import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { UserProfileService } from '../../../core/user-profile.service';
import { ProfileSettingsComponent } from './profile-settings.component';

describe('ProfileSettingsComponent', () => {
  let component: ProfileSettingsComponent;
  let fixture: ComponentFixture<ProfileSettingsComponent>;

  // Mock UserProfileService to avoid entity catalog issues
  const mockUserProfileService = {
    userProfile$: of(null),
    isFetching$: of(false),
    isError$: of(false),
    fetchUserProfile: vi.fn(),
    getPrimaryEmailAddress: vi.fn().mockReturnValue('test@test.com'),
    setPrimaryEmailAddress: vi.fn(),
    updateProfile: vi.fn().mockReturnValue(of([{}, {}]))
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: UserProfileService, useValue: mockUserProfileService },
        provideZonelessChangeDetection()
      ],
      imports: [
        BaseTestModules,
        ProfileSettingsComponent,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileSettingsComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid triggering observables that need store state
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
