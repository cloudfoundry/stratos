import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';
import { AuthDataService } from '@stratosui/store';
import type { AuthState } from '@stratosui/store';

import { LoginPageComponent } from './login-page.component';

function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        LoginPageComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

describe('LoginPageComponent — error banner branding', () => {
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    const errorAuthState: AuthState = {
      loggedIn: false,
      loggingIn: false,
      user: null,
      error: true,
      errorResponse: { status: 401, error: null },
      sessionData: null,
      verifying: false,
    };

    const stubAuthData = {
      auth: signal<AuthState | undefined>(errorAuthState),
      loggedIn: signal(false),
      loggingIn: signal(false),
      verifying: signal(false),
      error: signal(true),
      errorResponse: signal({ status: 401, error: null }),
      sessionData: signal(null),
      sessionValid: signal(false),
      redirect: signal(undefined),
      loginCompletedAt: signal(0),
      login: vi.fn(),
      logout: vi.fn(),
      verifySession: vi.fn(),
      navigateAndRememberRedirect: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        LoginPageComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthDataService, useValue: stubAuthData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
  });

  it('brands the login error banner via the semantic alert-danger surface', () => {
    flushEffects();
    fixture.detectChanges();
    flushEffects();
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('[data-stratos-snapshot-id="auth.login.error"]');
    expect(banner).not.toBeNull();
    expect(banner.classList).toContain('alert-danger');
    expect(banner.className).not.toContain('bg-danger-50');
  });
});
