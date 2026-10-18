import { HttpHeaders } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BASE_TEST_PROVIDERS, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { configureZonelessTestBed } from '@test-framework/zoneless-testbed.helper';
import { APP_TITLE } from '../../../core/core.types';
import { LocalAccountWizardComponent } from './local-account-wizard.component';

const SAVE_URL = '/pp/v1/setup/save';
const VERIFY_URL = '/api/v1/auth/verify';

describe('LocalAccountWizardComponent', () => {
  let component: LocalAccountWizardComponent;
  let fixture: ComponentFixture<LocalAccountWizardComponent>;
  let httpMock: HttpTestingController;

  const el = (): HTMLElement => fixture.nativeElement;
  const finishButton = () => el().querySelector<HTMLButtonElement>('#stepper_next')!;
  const overlayShown = () => !!el().querySelector('.loading-page__overlay');
  const errorSnack = () => document.querySelector('.snackbar-error .snackbar-message')?.textContent ?? '';

  // A flushed response resolves the step through a chain of promises that
  // no pending task tracks, so drain the microtasks before waiting for CD.
  const settle = async () => {
    await new Promise(resolve => setTimeout(resolve));
    await fixture.whenStable();
  };

  const submitPassword = async () => {
    component.passwordForm.setValue({ adminPassword: 'secret', adminPasswordConfirm: 'secret' });
    await fixture.whenStable();
    finishButton().click();
    await settle();
  };

  beforeEach(async () => {
    await configureZonelessTestBed({
      imports: [LocalAccountWizardComponent, NoopAnimationsModule],
      providers: [
        ...BASE_TEST_PROVIDERS,
        ...STORE_TEST_PROVIDERS,
        { provide: APP_TITLE, useValue: 'Stratos' },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LocalAccountWizardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.querySelectorAll('.snackbar-error').forEach(s => s.remove());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the saving overlay while the save is in flight', async () => {
    await submitPassword();

    expect(overlayShown()).toBe(true);
    httpMock.expectOne(SAVE_URL);
  });

  // Regression (#6020): a failed save left the full-screen overlay up
  // forever, with the error snackbar hidden behind it.
  it('clears the overlay and shows the error when the save fails', async () => {
    await submitPassword();

    httpMock.expectOne(SAVE_URL).flush({ error: 'database unavailable' }, { status: 500, statusText: 'Error' });
    await settle();

    expect(component.applyingSetup()).toBe(false);
    expect(overlayShown()).toBe(false);
    expect(errorSnack()).toContain('database unavailable');
  });

  it('clears the overlay and shows an error when the backend never confirms the setup', async () => {
    await submitPassword();

    vi.useFakeTimers();
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
    component.passwordForm.setValue({ adminPassword: 'secret', adminPasswordConfirm: 'secret' });
    await fixture.whenStable();

    vi.useFakeTimers();
    finishButton().click();
    httpMock.expectOne(SAVE_URL);
    await vi.advanceTimersByTimeAsync(61000);
    vi.useRealTimers();
    await settle();

    expect(component.applyingSetup()).toBe(false);
    expect(overlayShown()).toBe(false);
    expect(errorSnack()).toContain('did not answer');
    httpMock.expectNone(VERIFY_URL);
  });

  it('reloads the app once the backend leaves setup mode', async () => {
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
    await submitPassword();

    httpMock.expectOne(SAVE_URL).flush(null);
    await settle();
    httpMock.expectOne(VERIFY_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(assign).toHaveBeenCalledWith(`${window.location.protocol}//${window.location.host}`);
    expect(errorSnack()).toBe('');
  });
});
