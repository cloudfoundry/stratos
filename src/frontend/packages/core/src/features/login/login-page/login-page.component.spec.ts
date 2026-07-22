import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { InvalidSession, ResetAuth } from '../../../../../store/src/actions/auth.actions';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';

import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let store: Store;

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

    store = TestBed.inject(Store);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    // appReady$ gates navigation on ApplicationRef.isStable, which does not
    // reliably emit under the test harness. Stub it so the (post-init)
    // subscriptions can proceed. Set before detectChanges()/ngOnInit.
    (component as any).appReady$ = of(true);
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('SSO nosplash auto-login (unauthenticated)', () => {
    it('redirects straight to the IdP when nosplash is set and there is no valid session', async () => {
      const ssoSpy = vi
        .spyOn(component as any, 'doSSOLoginReactive')
        .mockReturnValue(of(null));

      // Start from a logged-out state (the default test store is logged in).
      store.dispatch(new ResetAuth());

      // ngOnInit subscribes to auth$; spy must be installed first.
      fixture.detectChanges();

      // Simulate the backend reporting an invalid session with SSO nosplash.
      store.dispatch(new InvalidSession(false, false, false, 'nosplash,logout'));

      await fixture.whenStable();

      expect(ssoSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT auto-redirect when the session is invalid but SSO is not configured', async () => {
      const ssoSpy = vi
        .spyOn(component as any, 'doSSOLoginReactive')
        .mockReturnValue(of(null));

      store.dispatch(new ResetAuth());

      fixture.detectChanges();

      // Invalid session, no ssoOptions -> user should see the login form.
      store.dispatch(new InvalidSession(false, false, false, ''));

      await fixture.whenStable();

      expect(ssoSpy).not.toHaveBeenCalled();
    });
  });
});
