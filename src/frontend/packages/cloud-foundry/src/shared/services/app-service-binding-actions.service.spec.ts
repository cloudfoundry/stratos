import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ApplicationService } from '../../features/applications/application.service';
import { AppServiceBindingActionsService } from './app-service-binding-actions.service';

describe('AppServiceBindingActionsService', () => {
  let svc: AppServiceBindingActionsService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AppServiceBindingActionsService,
        {
          provide: ApplicationService,
          useValue: { cfGuid: 'cnsi-1', appGuid: 'app-1' },
        },
      ],
    });
    svc = TestBed.inject(AppServiceBindingActionsService);
    ctrl = TestBed.inject(HttpTestingController);
  });

  it('starts idle', () => {
    expect(svc.inFlight()).toBe(false);
    expect(svc.transitioningBindingGuid()).toBeNull();
  });

  it('unbindService DELETEs the binding via writeWithJob and resolves on 200 fast-path', async () => {
    const promise = svc.unbindService('bind-1');
    expect(svc.inFlight()).toBe(true);
    expect(svc.transitioningBindingGuid()).toBe('bind-1');

    const req = ctrl.expectOne('/pp/v1/cf/service_bindings/cnsi-1/bind-1');
    expect(req.request.method).toBe('DELETE');
    // Backend's canonical fast-path 200 envelope; writeWithJob unwraps to T.
    req.flush({ state: 'COMPLETE', result: null }, { status: 200, statusText: 'OK' });

    await promise;
    expect(svc.inFlight()).toBe(false);
    expect(svc.transitioningBindingGuid()).toBeNull();
  });

  it('rejects when invoked while another verb is in flight', async () => {
    const first = svc.unbindService('bind-1');
    await expect(svc.unbindService('bind-2')).rejects.toThrow(/already in flight/);

    // Resolve the first call so the queue clears (otherwise the test
    // controller would complain about a pending request).
    ctrl.expectOne('/pp/v1/cf/service_bindings/cnsi-1/bind-1')
      .flush({ state: 'COMPLETE', result: null }, { status: 200, statusText: 'OK' });
    await first;
  });

  it('clears transitioningBindingGuid on failure', async () => {
    const promise = svc.unbindService('bind-1');
    ctrl.expectOne('/pp/v1/cf/service_bindings/cnsi-1/bind-1')
      .flush({ errors: [{ detail: 'boom' }] }, { status: 500, statusText: 'Server Error' });
    await expect(promise).rejects.toBeDefined();
    expect(svc.inFlight()).toBe(false);
    expect(svc.transitioningBindingGuid()).toBeNull();
  });
});
