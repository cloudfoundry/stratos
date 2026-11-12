import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { DashboardDataService } from '../../../core/dashboard-data.service';
import { UserProfileService } from '../../../core/user-profile.service';
import { ProfileSettingsComponent } from './profile-settings.component';

describe('ProfileSettingsComponent', () => {
  let component: ProfileSettingsComponent;
  let fixture: ComponentFixture<ProfileSettingsComponent>;

  // Mock UserProfileService to avoid entity catalog issues
  const mockUserProfileService = {
    isError: signal(false),
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

  // #4166: the option subtexts were body text at opacity 0.6 (4.04:1 in light mode).
  it('shows the option subtext in the muted text color', async () => {
    await fixture.whenStable();
    const subtexts = Array.from(fixture.nativeElement.querySelectorAll('.user-profile__option-subtext')) as HTMLElement[];
    expect(subtexts.map(s => s.textContent)).toContainEqual(expect.stringContaining('Disable automatic logout'));
    for (const subtext of subtexts) {
      expect(subtext.classList).toContain('text-content-muted');
    }
  });

  it('flags the session-timeout option as a warning once the timeout is disabled', async () => {
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.user-profile__option-warning')).toBeNull();
    TestBed.inject(DashboardDataService).setSessionTimeout(false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.user-profile__option-warning')).not.toBeNull();
  });
});
