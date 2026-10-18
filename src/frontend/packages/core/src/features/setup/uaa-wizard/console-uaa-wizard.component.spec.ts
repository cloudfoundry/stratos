import { HttpHeaders } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BASE_TEST_PROVIDERS, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { configureZonelessTestBed } from '@test-framework/zoneless-testbed.helper';
import { APP_TITLE } from '../../../core/core.types';
import { ConsoleUaaWizardComponent } from './console-uaa-wizard.component';

const CHECK_URL = '/pp/v1/setup/check';
const SAVE_URL = '/pp/v1/setup/save';
const VERIFY_URL = '/api/v1/auth/verify';

describe('ConsoleUaaWizardComponent', () => {
  let component: ConsoleUaaWizardComponent;
  let fixture: ComponentFixture<ConsoleUaaWizardComponent>;
  let httpMock: HttpTestingController;

  const el = (): HTMLElement => fixture.nativeElement;
  const nextButton = () => el().querySelector<HTMLButtonElement>('#stepper_next')!;
  const scopeSelect = () => el().querySelector<HTMLSelectElement>('#uaaScope');
  const overlayShown = () => !!el().querySelector('.loading-page__overlay');
  const errorSnack = () => document.querySelector('.snackbar-error .snackbar-message')?.textContent ?? '';

  // A flushed response resolves the step through a chain of promises that
  // no pending task tracks, so drain the microtasks before waiting for CD.
  const settle = async () => {
    await new Promise(resolve => setTimeout(resolve));
    await fixture.whenStable();
  };

  const fillForm = () => {
    component.uaaForm.setValue({
      apiUrl: 'https://uaa.example.com',
      skipSSL: false,
      clientId: 'console',
      clientSecret: '',
      adminUsername: 'admin',
      adminPassword: 'secret',
      useSSO: false,
    });
  };

  const flushScopes = (scope: string[]) =>
    httpMock.expectOne(CHECK_URL).flush({ scope, exp: 0, user_id: 'u', user_name: 'admin' });

  const flushCheckError = (error: string) =>
    httpMock.expectOne(CHECK_URL).flush({ error }, { status: 400, statusText: 'Bad Request' });

  const reachScopeStep = async (scope: string[]) => {
    fillForm();
    await fixture.whenStable();
    nextButton().click();
    flushScopes(scope);
    await settle();
  };

  beforeEach(async () => {
    await configureZonelessTestBed({
      imports: [ConsoleUaaWizardComponent, NoopAnimationsModule],
      providers: [
        ...BASE_TEST_PROVIDERS,
        ...STORE_TEST_PROVIDERS,
        { provide: APP_TITLE, useValue: 'Stratos' },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ConsoleUaaWizardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.querySelectorAll('.snackbar-error').forEach(s => s.remove());
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('UAA endpoint step', () => {
    it('stops waiting and shows an error when the scope check never answers', async () => {
      fillForm();
      await fixture.whenStable();

      vi.useFakeTimers();
      nextButton().click();
      httpMock.expectOne(CHECK_URL);
      await vi.advanceTimersByTimeAsync(131000);
      vi.useRealTimers();
      await settle();

      expect(scopeSelect()).toBeNull();
      expect(nextButton().disabled).toBe(false);
      expect(errorSnack()).toContain('did not answer');
    });

    // Regression (#6020): the step read the replayed state of the previous
    // request, so the first click succeeded with no scopes before the check
    // had even answered.
    it('does not advance when the scope check fails, then reports the next attempt', async () => {
      fillForm();
      await fixture.whenStable();

      nextButton().click();
      flushCheckError('Failed to authenticate with UAA - check Client ID, Secret and credentials');
      await settle();

      expect(scopeSelect()).toBeNull();
      expect(errorSnack()).toContain('Failed to authenticate with UAA');

      nextButton().click();
      flushScopes(['openid', 'stratos.admin']);
      await settle();

      const select = scopeSelect();
      expect(select).not.toBeNull();
      expect(Array.from(select!.options).map(o => o.value)).toContain('stratos.admin');
      expect(component.selectedScope()).toBe('stratos.admin');
    });

    it('reports the result of this attempt on a retry, not the previous one', async () => {
      await reachScopeStep(['openid', 'stratos.admin']);
      expect(scopeSelect()).not.toBeNull();

      el().querySelector<HTMLButtonElement>('#stepper_previous')!.click();
      await settle();
      expect(scopeSelect()).toBeNull();

      nextButton().click();
      flushCheckError('Failed to authenticate with UAA - check Client ID, Secret and credentials');
      await settle();

      expect(scopeSelect()).toBeNull();
      expect(errorSnack()).toContain('Failed to authenticate with UAA');
    });

    it('does not advance when the UAA returns no scopes for the admin user', async () => {
      await reachScopeStep([]);

      expect(scopeSelect()).toBeNull();
      expect(errorSnack()).toContain('no scopes');
    });

    it('words a failed scope check as a credentials check, not a save', async () => {
      fillForm();
      await fixture.whenStable();

      nextButton().click();
      flushCheckError('Failed to authenticate with UAA - check Client ID, Secret and credentials');
      await settle();

      expect(errorSnack()).toBe('Failed to check the UAA credentials. Failed to authenticate with UAA - check Client ID, Secret and credentials');
    });
  });

  describe('Admin scope step', () => {
    it('blocks Finish until an admin scope is chosen', async () => {
      await reachScopeStep(['openid', 'uaa.user']);

      expect(nextButton().disabled).toBe(true);
      expect(component.selectedScope()).toBe('');

      const select = scopeSelect()!;
      select.value = 'uaa.user';
      select.dispatchEvent(new Event('change'));
      await settle();

      expect(component.selectedScope()).toBe('uaa.user');
      expect(nextButton().disabled).toBe(false);
    });

    // Regression (#6020): a failed save left the full-screen overlay up
    // forever, with the error snackbar hidden behind it.
    it('clears the overlay and shows the error when the save fails', async () => {
      await reachScopeStep(['openid', 'stratos.admin']);

      nextButton().click();
      await settle();
      expect(overlayShown()).toBe(true);

      httpMock.expectOne(SAVE_URL).flush({ error: 'database unavailable' }, { status: 500, statusText: 'Error' });
      await settle();

      expect(component.applyingSetup()).toBe(false);
      expect(overlayShown()).toBe(false);
      expect(errorSnack()).toContain('database unavailable');
    });

    it('saves the chosen scope and reloads once the backend leaves setup mode', async () => {
      const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
      await reachScopeStep(['openid', 'stratos.admin']);

      nextButton().click();
      const save = httpMock.expectOne(SAVE_URL);
      expect(save.request.body.get('console_admin_scope')).toBe('stratos.admin');
      save.flush(null);
      await settle();
      httpMock.expectOne(VERIFY_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
      await settle();

      expect(assign).toHaveBeenCalledWith(`${window.location.protocol}//${window.location.host}`);
      expect(errorSnack()).toBe('');
    });

    it('clears the overlay and shows an error when the backend never confirms the setup', async () => {
      await reachScopeStep(['openid', 'stratos.admin']);

      vi.useFakeTimers();
      nextButton().click();
      httpMock.expectOne(SAVE_URL).flush(null);

      // The backend keeps answering "setup required".
      for (let i = 0; i < 40; i++) {
        await vi.advanceTimersByTimeAsync(1000);
        httpMock.match(VERIFY_URL).forEach(req => req.flush(null, {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new HttpHeaders({ 'Stratos-Setup-Required': 'true' }),
        }));
      }
      vi.useRealTimers();
      await settle();

      expect(component.applyingSetup()).toBe(false);
      expect(overlayShown()).toBe(false);
      expect(errorSnack()).toContain('did not confirm');
    });

    it('clears the overlay and shows an error when the save never answers', async () => {
      await reachScopeStep(['openid', 'stratos.admin']);

      vi.useFakeTimers();
      nextButton().click();
      httpMock.expectOne(SAVE_URL);
      await vi.advanceTimersByTimeAsync(61000);
      vi.useRealTimers();
      await settle();

      expect(component.applyingSetup()).toBe(false);
      expect(overlayShown()).toBe(false);
      expect(errorSnack()).toContain('did not answer');
      httpMock.expectNone(VERIFY_URL);
    });
  });
});
