import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppVariableActionsService } from './app-variable-actions.service';
import { ApplicationService } from '../../features/applications/application.service';
import { AppDetailDataService } from '../../features/applications/app-detail-data.service';

// ---------------------------------------------------------------------------
// Stubs — minimal: only the surface this service touches.
// ---------------------------------------------------------------------------

function makeAppServiceStub(cfGuid = 'cf-1', appGuid = 'app-1') {
  return { cfGuid, appGuid };
}

// AppDetailDataService stub — the action service used to read the current
// env map off this to recompose a full PATCH. After the delta wire-fix it
// no longer needs it, but the provider must still resolve.
function makeDataServiceStub(environment: Record<string, string> = { EXISTING: 'keep' }) {
  return { envVars: signal({ environment }) } as unknown as AppDetailDataService;
}

// HttpClient stub — only patch() is exercised. Each test wires its own impl.
function makeHttpStub(patchImpl?: () => any) {
  return {
    patch: vi.fn(patchImpl ?? (() => of({ guid: 'app-1' }))),
  } as unknown as HttpClient & { patch: ReturnType<typeof vi.fn> };
}

async function tick(n = 4): Promise<void> {
  for (let i = 0; i < n; i++) await Promise.resolve();
}

const URL = '/pp/v1/cf/apps/cf-1/app-1';

describe('AppVariableActionsService', () => {
  let svc: AppVariableActionsService;
  let http: ReturnType<typeof makeHttpStub>;

  function configure(httpStub = makeHttpStub(), dataStub = makeDataServiceStub()) {
    TestBed.resetTestingModule();
    http = httpStub;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AppVariableActionsService,
        { provide: HttpClient, useValue: http },
        { provide: ApplicationService, useValue: makeAppServiceStub() },
        { provide: AppDetailDataService, useValue: dataStub },
      ],
    });
    svc = TestBed.inject(AppVariableActionsService);
  }

  beforeEach(() => {
    configure();
  });

  it('starts idle: transitioningName is null and inFlight is false', () => {
    expect(svc.transitioningName()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // add — delta PATCH with only the new key (NOT the full recomposed map)
  // -------------------------------------------------------------------------

  it('addVariable PATCHes the app URL with only the new key as a delta', async () => {
    await svc.addVariable('NEW', 'val');

    expect(http.patch).toHaveBeenCalledTimes(1);
    expect(http.patch).toHaveBeenCalledWith(URL, { environment_json: { NEW: 'val' } });
  });

  it('addVariable preserves an empty-string value (never collapses "" to null)', async () => {
    await svc.addVariable('EMPTY', '');

    expect(http.patch).toHaveBeenCalledWith(URL, { environment_json: { EMPTY: '' } });
  });

  it('addVariable sets transitioningName mid-flight, clears on success', async () => {
    const gate = new Subject<unknown>();
    configure(makeHttpStub(() => gate.asObservable()));

    const promise = svc.addVariable('NEW', 'val');
    await tick();
    expect(svc.transitioningName()).toBe('NEW');
    expect(svc.inFlight()).toBe(true);

    gate.next({ guid: 'app-1' });
    gate.complete();
    await promise;
    expect(svc.transitioningName()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // update — delta PATCH with the single key
  // -------------------------------------------------------------------------

  it('updateVariable PATCHes only the changed key as a delta (not the full map)', async () => {
    // Multi-key env so a full-map recompose would leak OTHER into the body.
    configure(makeHttpStub(), makeDataServiceStub({ EXISTING: 'keep', OTHER: 'untouched' }));

    await svc.updateVariable('EXISTING', 'changed');

    expect(http.patch).toHaveBeenCalledWith(URL, { environment_json: { EXISTING: 'changed' } });
  });

  // -------------------------------------------------------------------------
  // delete — explicit null (merge-patch delete), NOT key omission
  // -------------------------------------------------------------------------

  it('deleteVariable PATCHes the target key set to null (merge-patch delete)', async () => {
    await svc.deleteVariable('EXISTING');

    expect(http.patch).toHaveBeenCalledTimes(1);
    expect(http.patch).toHaveBeenCalledWith(URL, { environment_json: { EXISTING: null } });
  });

  // -------------------------------------------------------------------------
  // rename — one PATCH: old key -> null, new key -> value
  // -------------------------------------------------------------------------

  it('renameVariable PATCHes old->null and new->value in a single delta', async () => {
    await svc.renameVariable('OLD', 'NEW', 'val');

    expect(http.patch).toHaveBeenCalledTimes(1);
    expect(http.patch).toHaveBeenCalledWith(URL, { environment_json: { OLD: null, NEW: 'val' } });
  });

  it('renameVariable sets transitioningName to the new name mid-flight, clears on success', async () => {
    const gate = new Subject<unknown>();
    configure(makeHttpStub(() => gate.asObservable()));

    const promise = svc.renameVariable('OLD', 'NEW', 'val');
    await tick();
    expect(svc.transitioningName()).toBe('NEW');

    gate.next({ guid: 'app-1' });
    gate.complete();
    await promise;
    expect(svc.transitioningName()).toBeNull();
  });

  // -------------------------------------------------------------------------
  // error + reentrancy — shared shape across all verbs
  // -------------------------------------------------------------------------

  it('clears the signal and surfaces the error on HTTP failure', async () => {
    const err = new Error('CF-UnprocessableEntity');
    configure(makeHttpStub(() => throwError(() => err)));

    await expect(svc.deleteVariable('EXISTING')).rejects.toBe(err);
    expect(svc.transitioningName()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('rejects a second verb while a first is still in flight', async () => {
    const gate = new Subject<unknown>();
    configure(makeHttpStub(() => gate.asObservable()));

    const first = svc.addVariable('A', '1');
    await tick();

    await expect(svc.deleteVariable('B')).rejects.toThrow(/already in flight/i);
    expect(svc.transitioningName()).toBe('A');

    gate.next({ guid: 'app-1' });
    gate.complete();
    await first;
    expect(svc.transitioningName()).toBeNull();
  });
});
