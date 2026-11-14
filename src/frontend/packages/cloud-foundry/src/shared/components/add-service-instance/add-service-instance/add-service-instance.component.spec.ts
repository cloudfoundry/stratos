import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { PageHeaderComponent, StepComponent, TabNavService } from '@stratosui/core';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../data-services/cloud-foundry.service';
import { CsiStateService } from '../csi-state.service';
import { AddServiceInstanceComponent } from './add-service-instance.component';

describe('AddServiceInstanceComponent', () => {
  let component: AddServiceInstanceComponent;
  let fixture: ComponentFixture<AddServiceInstanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddServiceInstanceComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CfOrgSpaceDataService,
        CloudFoundryService,
        TabNavService,
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(AddServiceInstanceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the title it is given in the page header', async () => {
    component.title.set('Edit Service Instance: my-db');
    await fixture.whenStable();
    // The header renders through a portal; instantiate its template directly.
    const header = fixture.debugElement.query(By.directive(PageHeaderComponent)).componentInstance as PageHeaderComponent;
    const view = header.pageHeaderTmpl().createEmbeddedView({});
    view.detectChanges();
    const text = view.rootNodes.map((node: Node) => node.textContent).join('');
    view.destroy();
    expect(text).toContain('Edit Service Instance: my-db');
  });

  // Stands a stub in for one of the wizard's child view queries. The stub
  // is a signal, as the query is, so a handle's computed follows it.
  function stubChild(query: string, child?: unknown) {
    const ref = signal<any>(child);
    (component as any)[query] = ref;
    return ref;
  }

  /**
   * Step handles use computed() to read the active step child's `validate`
   * signal. If the child reference is held in a non-signal field, the
   * computed evaluates once with `_field?.validate()` short-circuiting on
   * undefined, memoizes with zero signal dependencies, and never re-runs —
   * even after the child appears and its validate signal flips. This locks
   * in the signal-tracking contract for each handle so the bug can't creep
   * back.
   */
  describe('step handle valid signals track child validate signal changes', () => {
    // ORDERING IS LOAD-BEARING: the steppers component reads handle.valid()
    // during initial change detection BEFORE the lazy child of an
    // inactive step exists. That first read evaluates the computed with
    // _ref undefined, optional-chains over a never-read child signal, and
    // memoizes with zero dependencies. Once memoized, no later child signal
    // change re-runs it. The tests below assert the contract: read valid()
    // first (cold), then attach the child, then flip child.validate.

    // A fresh instance that has not rendered: no handle has been read, so
    // the first read in each test is the cold one.
    beforeEach(() => {
      component = TestBed.createComponent(AddServiceInstanceComponent).componentInstance;
    });

    it('selectPlanHandle.valid flips true when child validate flips true', () => {
      const ref = stubChild('_selectPlan');
      // Cold read while ref is still undefined — locks in the bad memo path
      // for the broken implementation.
      expect(component.selectPlanHandle.valid()).toBe(false);
      const child = { validate: signal(false), onEnter: () => undefined } as any;
      ref.set(child);
      child.validate.set(true);
      expect(component.selectPlanHandle.valid()).toBe(true);
    });

    it('selectServiceHandle.valid flips true when child validate flips true', () => {
      const ref = stubChild('_selectService');
      expect(component.selectServiceHandle.valid()).toBe(false);
      const child = { validate: signal(false), isFetching$: { subscribe: () => ({ unsubscribe: () => {} }) } } as any;
      ref.set(child);
      child.validate.set(true);
      expect(component.selectServiceHandle.valid()).toBe(true);
    });

    it('bindAppHandle.valid flips true when child validate flips true', () => {
      const ref = stubChild('_bindApp');
      expect(component.bindAppHandle.valid()).toBe(false);
      const child = { validate: signal(false), onEnter: () => undefined } as any;
      ref.set(child);
      child.validate.set(true);
      expect(component.bindAppHandle.valid()).toBe(true);
    });

    it('supdHandle.valid flips true when child validate flips true', () => {
      const ref = stubChild('_supd');
      expect(component.supdHandle.valid()).toBe(false);
      const child = { validate: signal(false) } as any;
      ref.set(child);
      child.validate.set(true);
      expect(component.supdHandle.valid()).toBe(true);
    });

  });

  /**
   * The framework's SteppersComponent.setActive(idx+1) propagates a step's
   * submit-result `data` field into the next step's `pOnEnter(this.enterData)`
   * call, which prefers `signalHandle.onEnter(data)`. For the Add SI flow this
   * is how the user's selected plan must reach bind-app and specify-details:
   *
   *   selectPlanHandle.submit  →  { data: plan }
   *                                    │
   *                                    └→  SteppersComponent.enterData = plan
   *                                            │
   *                                            └→  bindAppHandle.onEnter(plan)
   *                                                  → _bindApp().onEnter(plan)
   *                                            └→  specifyDetailsHandle.onEnter(plan)
   *                                                  → _specifyDetails.onEnter(plan)
   *
   * The legacy pendingX-flag pattern attempted this via view-query setters
   * that fire-once-at-mount, missing later flag flips. These specs lock the
   * contract on the handles directly so the bug can't reappear.
   */
  describe('step handle onEnter forwards plan to child after selectPlan submit', () => {
    it('selectPlanHandle.submit resolves with { data: <plan> } so framework propagates it', async () => {
      const plan = { guid: 'plan-1', name: 'Standard' };
      const child = {
        validate: signal(true),
        onEnter: () => undefined,
        onNext: async () => ({ success: true, data: plan }),
      } as any;
      stubChild('_selectPlan', child);

      const result = await component.selectPlanHandle.submit!();

      expect(result).toEqual({ data: plan });
    });

    it('bindAppHandle.onEnter forwards the plan to the bind-app child', () => {
      let received: any = null;
      const child = {
        validate: signal(true),
        onEnter: (plan: any) => { received = plan; },
      } as any;
      stubChild('_bindApp', child);

      const plan = { guid: 'plan-1', name: 'Standard' };
      component.bindAppHandle.onEnter?.(plan);

      expect(received).toEqual(plan);
    });

    it('specifyDetailsHandle.onEnter forwards the plan to the specify-details child', () => {
      let received: any = null;
      const child = {
        validate: { subscribe: () => ({ unsubscribe: () => {} }) },
        serviceInstancesInit$: { subscribe: () => ({ unsubscribe: () => {} }) },
        onEnter: (plan: any) => { received = plan; },
      } as any;
      stubChild('_specifyDetails', child);

      const plan = { guid: 'plan-1', name: 'Standard' };
      component.specifyDetailsHandle.onEnter?.(plan);

      expect(received).toEqual(plan);
    });

    it('selectPlanHandle.onEnter triggers the select-plan child onEnter', () => {
      let called = false;
      const child = {
        validate: signal(true),
        onEnter: () => { called = true; },
      } as any;
      stubChild('_selectPlan', child);

      component.selectPlanHandle.onEnter?.();

      expect(called).toBe(true);
    });
  });

  // The user-provided step is the wizard's last. A success without
  // redirect makes the stepper try the step after it, which does not
  // exist, so the wizard stays put with no error.
  describe('supdHandle.submit', () => {
    async function stepResult(childResult: object) {
      stubChild('_supd', { validate: signal(true), onNext: async () => childResult });
      const stepRef = TestBed.createComponent(StepComponent).componentRef;
      stepRef.setInput('signalHandle', component.supdHandle);
      const step = stepRef.instance;
      return step.invokeNext();
    }

    it('passes the create or update redirect on to the stepper', async () => {
      expect(await stepResult({ success: true, redirect: true })).toMatchObject({ success: true, redirect: true });
    });

    it('fails the step with the reason given', async () => {
      expect(await stepResult({ success: false, message: 'Name taken' }))
        .toMatchObject({ success: false, message: expect.stringContaining('Name taken') });
    });
  });

  // The first step saves the picked CF, org and space, then waits for the
  // space's apps to finish loading (appsLoading$ never completes).
  describe('onNext of the Cloud Foundry step', () => {
    it('fails without a selected endpoint', async () => {
      expect(await component.onNext()).toEqual({ success: false });
    });

    it('succeeds once the apps have loaded', async () => {
      const spaces = component.cfOrgSpaceService;
      spaces.cf.select.set('cf-1');
      spaces.org.select.set('org-1');
      spaces.space.select.set('space-1');
      const loading = (component as unknown as { _appsLoading: WritableSignal<boolean> })._appsLoading;
      loading.set(true);
      await fixture.whenStable();

      let done = false;
      const pending = component.onNext().then(result => {
        done = true;
        return result;
      });
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(done).toBe(false);

      loading.set(false);
      await fixture.whenStable();
      expect(await pending).toEqual({ success: true });
    });
  });

  // The apps of the picked space feed the bind step. A failed fetch must not
  // end the feed, or going back and picking another space shows no apps and
  // skips the bind step.
  describe('apps of the picked space', () => {
    const appsUrl = (space: string) => `/pp/v1/cf/apps/cf-1?space_guids=${space}&per_page=500&page=1`;

    it('fetches again for another space after one fetch failed', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const http = TestBed.inject(HttpTestingController);
      const csi = fixture.debugElement.injector.get(CsiStateService);

      csi.setCFDetails('cf-1', 'org-1', 'space-1');
      await fixture.whenStable();
      http.expectOne(appsUrl('space-1')).flush('boom', { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();

      csi.setCFDetails('cf-1', 'org-1', 'space-2');
      await fixture.whenStable();
      http.expectOne(appsUrl('space-2')).flush({ resources: [{ guid: 'app-1', name: 'my-app' }] });
      await fixture.whenStable();

      expect(component.bindAppHandle.skipIf!()).toBe(false);
    });
  });
});
