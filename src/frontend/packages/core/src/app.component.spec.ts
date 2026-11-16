import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { AuthDataService } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, CoreTestingModule } from '@test-framework';

import { AppComponent } from './app.component';
import { CurrentUserPermissionsService } from './core/permissions/current-user-permissions.service';
import { StratosBrandingService } from '../../theme/stratos-branding.service';
import { LoggedInService } from './logged-in.service';
import { SharedModule } from './shared/shared.module';

describe('AppComponent', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
      ],
      imports: [
        RouterOutlet,
        NoopAnimationsModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        LoggedInService,
        CurrentUserPermissionsService,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent<AppComponent>(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // The signed-in user's name is in the page for the end-to-end tests.
  it('puts the signed-in user name in the page', async () => {
    const fixture = TestBed.createComponent<AppComponent>(AppComponent);
    await fixture.whenStable();
    const userId = () => fixture.nativeElement.querySelector('#__stratos-userid__');
    expect(userId()).toBeNull();

    (TestBed.inject(AuthDataService) as any)._auth.update((a: object) => ({ ...a, sessionData: { user: { name: 'tester' } } }));
    await fixture.whenStable();
    expect(userId()?.textContent).toBe('tester');
  });
  // The brand colors of dark mode sit inline on body. A dark-theme class on an
  // element inside the app would redeclare the default colors there, and
  // everything below it would show those instead of the brand colors.
  it('keeps the dark-theme class on body, not inside the app', async () => {
    const fixture = TestBed.createComponent<AppComponent>(AppComponent);
    TestBed.inject(StratosBrandingService).setThemeMode('dark');
    await fixture.whenStable();
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    expect(fixture.nativeElement.querySelector('.dark-theme')).toBeNull();
    expect(fixture.nativeElement.classList.contains('dark-theme')).toBe(false);
  });
});
