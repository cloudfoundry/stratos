import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { InternalEventMonitorFactory } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TabNavService } from '@stratosui/core';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from '../../../data-services/long-running-cf-op.service';
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
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CfOrgSpaceDataService,
        InternalEventMonitorFactory,
        CloudFoundryService,
        TabNavService,
        LongRunningCfOperationsService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Step handles use computed() to read the active step child's `validate`
   * signal. If the child reference is held in a non-signal field, the
   * computed evaluates once with `_field?.validate()` short-circuiting on
   * undefined, memoizes with zero signal dependencies, and never re-runs —
   * even after the ViewChild setter populates the field and the child's
   * validate signal flips. This locks in the signal-tracking contract for
   * each handle so the bug can't creep back.
   */
  describe('step handle valid signals track child validate signal changes', () => {
    // ORDERING IS LOAD-BEARING: the steppers component reads handle.valid()
    // during initial change detection BEFORE the lazy ViewChild for an
    // inactive step has fired. That first read evaluates the computed with
    // _ref undefined, optional-chains over a never-read child signal, and
    // memoizes with zero dependencies. Once memoized, no later child signal
    // change re-runs it. The tests below assert the contract: read valid()
    // first (cold), then attach the child, then flip child.validate.

    it('selectPlanHandle.valid flips true when child validate flips true', () => {
      // Cold read while ref is still undefined — locks in the bad memo path
      // for the broken implementation.
      expect(component.selectPlanHandle.valid()).toBe(false);
      const child = { validate: signal(false), onEnter: () => undefined } as any;
      (component as any).selectPlanRef = child;
      child.validate.set(true);
      expect(component.selectPlanHandle.valid()).toBe(true);
    });

    it('selectServiceHandle.valid flips true when child validate flips true', () => {
      expect(component.selectServiceHandle.valid()).toBe(false);
      const child = { validate: signal(false), isFetching$: { subscribe: () => ({ unsubscribe: () => {} }) } } as any;
      (component as any).selectServiceRef = child;
      child.validate.set(true);
      expect(component.selectServiceHandle.valid()).toBe(true);
    });

    it('bindAppHandle.valid flips true when child validate flips true', () => {
      expect(component.bindAppHandle.valid()).toBe(false);
      const child = { validate: signal(false), onEnter: () => undefined } as any;
      (component as any).bindAppRef = child;
      child.validate.set(true);
      expect(component.bindAppHandle.valid()).toBe(true);
    });

    it('supdHandle.valid flips true when child validate flips true', () => {
      expect(component.supdHandle.valid()).toBe(false);
      const child = { validate: signal(false) } as any;
      (component as any).supdRef = child;
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
   * The legacy pendingX-flag pattern attempted this via @ViewChild setters
   * that fire-once-at-mount, missing later flag flips. These specs lock the
   * contract on the handles directly so the bug can't reappear.
   */
  describe('step handle onEnter forwards plan to child after selectPlan submit', () => {
    it('selectPlanHandle.submit resolves with { data: <plan> } so framework propagates it', async () => {
      const plan = { guid: 'plan-1', name: 'Standard' };
      const child = {
        validate: signal(true),
        onEnter: () => undefined,
        onNext: () => of({ success: true, data: plan }),
      } as any;
      (component as any).selectPlanRef = child;

      const result = await component.selectPlanHandle.submit!();

      expect(result).toEqual({ data: plan });
    });

    it('bindAppHandle.onEnter forwards the plan to the bind-app child', () => {
      let received: any = null;
      const child = {
        validate: signal(true),
        onEnter: (plan: any) => { received = plan; },
      } as any;
      (component as any).bindAppRef = child;

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
      (component as any).specifyDetailsRef = child;

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
      (component as any).selectPlanRef = child;

      component.selectPlanHandle.onEnter?.();

      expect(called).toBe(true);
    });
  });
});
