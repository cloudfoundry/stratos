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
import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';
import { StratosTheme, defaultTheme } from '../../../../../theme/theme.config';

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
    const banner = fixture.nativeElement.querySelector('#login-error-message');
    expect(banner).not.toBeNull();
    expect(banner.classList).toContain('alert-danger');
    expect(banner.className).not.toContain('bg-danger-50');
  });
});

describe('LoginPageComponent — login-scoped input branding', () => {
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    const themeState = signal<StratosTheme>({
      ...defaultTheme,
      login: {
        ...defaultTheme.login,
        inputBackground: '#222222',
        inputBorder: '#ff0000',
      }
    });

    const brandingStub = {
      theme: themeState.asReadonly(),
    } as unknown as StratosBrandingService;

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
        { provide: StratosBrandingService, useValue: brandingStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
  });

  it('applies login input branding scoped to the login card', () => {
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.login-card');
    expect(card.style.getPropertyValue('--input-bg')).toBe('#222222');
    expect(card.style.getPropertyValue('--input-border')).toBe('#ff0000');
  });
});

describe('LoginPageComponent — logo and title visibility', () => {
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    const themeState = signal<StratosTheme>({
      ...defaultTheme,
      login: {
        ...defaultTheme.login,
        showLogo: false,
        showTitle: false,
      }
    });

    const brandingStub = {
      theme: themeState.asReadonly(),
    } as unknown as StratosBrandingService;

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
        { provide: StratosBrandingService, useValue: brandingStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
  });

  it('hides the login logo when showLogo is false', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-logo')).toBeNull();
  });

  it('hides the login title when showTitle is false', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-title')).toBeNull();
  });
});

describe('LoginPageComponent — before-login notice', () => {
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    const themeState = signal<StratosTheme>({
      ...defaultTheme,
      login: {
        ...defaultTheme.login,
        customMessage: 'Authorized users only',
      },
    });

    const brandingStub = {
      theme: themeState.asReadonly(),
    } as unknown as StratosBrandingService;

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
        { provide: StratosBrandingService, useValue: brandingStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
  });

  it('renders the before-login notice when a custom message is set', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.login-message');
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('Authorized users only');
  });
});

describe('LoginPageComponent — before-login notice hidden when empty', () => {
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    const themeState = signal<StratosTheme>({
      ...defaultTheme,
      login: { ...defaultTheme.login, customMessage: '' },
    });
    const brandingStub = { theme: themeState.asReadonly() } as unknown as StratosBrandingService;

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NoopAnimationsModule, createBasicStoreModule(), LoginPageComponent],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StratosBrandingService, useValue: brandingStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
  });

  it('hides the before-login notice when customMessage is empty', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-message')).toBeNull();
  });
});
