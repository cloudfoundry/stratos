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
});
