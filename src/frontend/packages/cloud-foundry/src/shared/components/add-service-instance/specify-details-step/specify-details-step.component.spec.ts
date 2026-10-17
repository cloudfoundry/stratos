import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  answerServiceWrite,
  generateCfBaseTestModulesNoShared,
  RESOLVE_PATHS,
  ResolvePath,
  serviceWriteContract,
  ServiceWriteContract,
} from '@test-framework/cf';
import { StServiceInstance } from '../../../../services/endpoint-data/stratos-types';
import { SchemaFormComponent } from '../../schema-form/schema-form.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CreateServiceFormMode, CsiModeService } from '../csi-mode.service';
import { CsiStateService } from '../csi-state.service';
import { TrackedJobsService } from '../../../../services/async-jobs/tracked-jobs.service';
import { SpecifyDetailsStepComponent } from './specify-details-step.component';

describe('SpecifyDetailsStepComponent', () => {
  let component: SpecifyDetailsStepComponent;
  let fixture: ComponentFixture<SpecifyDetailsStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SpecifyDetailsStepComponent,
        SchemaFormComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          ...generateCfBaseTestModulesNoShared(),
        ),
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService,
        CsiModeService,
        CsiStateService,
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecifyDetailsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Regression: onEnter used to dereference cSIHelperService, which is only
  // constructed as a side-effect of the serviceInstances$ chain's first
  // emission — entering the step before that threw a TypeError (GH#5438).
  it('onEnter builds the CSI helper from wizard state instead of throwing', () => {
    const csiState = TestBed.inject(CsiStateService);
    csiState.setCFDetails('cf-1', 'org-1', 'sp-1');
    csiState.setServiceGuid('svc-1');

    expect(component.cSIHelperService).toBeUndefined();
    expect(() => component.onEnter({ guid: 'plan-1', cnsiGuid: 'cf-1', name: 'small' } as any)).not.toThrow();
    expect(component.cSIHelperService).toBeDefined();
    expect(component.allServiceInstances$).toBeDefined();
  });

  // Regression: the wizard's plan list is summary-tier (no `schemas`), so
  // the schema-driven param form always degraded to the raw JSON textbox
  // (GH#5437). onEnter now fetches the selected plan at details and grafts
  // the schema onto the form config when it lands.
  it('onEnter fetches the selected plan at details and adopts its schema', async () => {
    const csiState = TestBed.inject(CsiStateService);
    csiState.setCFDetails('cf-1', 'org-1', 'sp-1');
    csiState.setServiceGuid('svc-1');
    const httpMock = TestBed.inject(HttpTestingController);

    component.onEnter({ guid: 'plan-1', cnsiGuid: 'cf-1', name: 'small' } as any);
    expect(component.schemaFormConfig()?.schema).toBeUndefined();

    const schema = { type: 'object', properties: { size: { type: 'string' } } };
    const req = httpMock.expectOne(r => r.url === '/pp/v1/cf/service_plans/cf-1/plan-1' && r.params.get('return') === 'details');
    req.flush({ guid: 'plan-1', name: 'small', schemas: { serviceInstance: { create: { parameters: schema } } } });
    await fixture.whenStable();

    expect(component.schemaFormConfig()?.schema).toEqual(schema);
  });

  // The stepper only relays select-plan's data into the NEXT step's
  // onEnter; with the bind-app step in between, this step enters with no
  // arg and must derive the plan from wizard state.
  it('onEnter falls back to wizard state for the details fetch when no plan is passed', async () => {
    const csiState = TestBed.inject(CsiStateService);
    csiState.setCFDetails('cf-1', 'org-1', 'sp-1');
    csiState.setServiceGuid('svc-1');
    csiState.setServicePlan('plan-1');
    const httpMock = TestBed.inject(HttpTestingController);

    component.onEnter(undefined as any);

    const schema = { type: 'object', properties: { size: { type: 'string' } } };
    const req = httpMock.expectOne(r => r.url === '/pp/v1/cf/service_plans/cf-1/plan-1' && r.params.get('return') === 'details');
    req.flush({ guid: 'plan-1', name: 'small', schemas: { serviceInstance: { create: { parameters: schema } } } });
    await fixture.whenStable();

    expect(component.schemaFormConfig()?.schema).toEqual(schema);
  });

  // Regression (GH#5600 follow-up): the bind-existing dropdown rendered no
  // options because the template still read the legacy v2 APIResource shape
  // (sI.metadata.guid / sI.entity.name) off the flat v3 StServiceInstance
  // rows the signal-native helper emits.
  it('renders bind-existing options from flat v3 service instances', async () => {
    const instances = [
      { guid: 'si-1', name: 'instance-one' },
      { guid: 'si-2', name: 'instance-two' },
    ] as StServiceInstance[];
    component.serviceInstances$ = of(instances);
    component.bindableServiceInstances$ = of(instances);
    component.hasInstances$ = of(true);
    component.formMode.set(CreateServiceFormMode.BindServiceInstance);
    // setInput (not a plain field write) so the OnPush view is marked dirty,
    // same as the parent-template binding in the real wizard.
    fixture.componentRef.setInput('showModeSelection', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const texts = Array.from(
      fixture.nativeElement.querySelectorAll('app-option') as NodeListOf<HTMLElement>,
    ).map(o => o.textContent?.trim());
    expect(texts).toContain('instance-one');
    expect(texts).toContain('instance-two');
  });

  it('onEnter skips the details fetch when the plan already carries a schema', () => {
    const csiState = TestBed.inject(CsiStateService);
    csiState.setCFDetails('cf-1', 'org-1', 'sp-1');
    csiState.setServiceGuid('svc-1');
    const httpMock = TestBed.inject(HttpTestingController);
    const schema = { type: 'object' };

    component.onEnter({
      guid: 'plan-1', cnsiGuid: 'cf-1', name: 'small',
      schemas: { serviceInstance: { create: { parameters: schema } } },
    } as any);

    httpMock.expectNone(r => r.url.startsWith('/pp/v1/cf/service_plans/'));
    expect(component.schemaFormConfig()?.schema).toEqual(schema);
  });
});

// Stage 5 of the services-domain signal+V3 slice: managed service instance
// create/update goes through HttpClient + writeWithJob against
// /pp/v1/cf/service_instances. The previous ngrx pipeline (entity-catalog
// actions + selectCfRequestInfo polling + LongRunningCfOperationsService)
// is gone — writeWithJob's fast-path-then-handoff IS the long-running path.
//
// `extractCreatedSiGuid` parses the new SI guid out of writeWithJob's
// terminal result so the bind-after-create flow can chain into
// modeService.createApplicationServiceBinding. writeWithJob normalises
// fast-path and polled-handoff to the same bare-result shape, so the
// helper only has to inspect one level.
describe('SpecifyDetailsStepComponent.onNext (v3 + writeWithJob)', () => {
  function setup(opts: {
    isEditMode?: boolean;
    bindAppGuid?: string;
    csiBindParams?: object;
  } = {}) {
    const csiState = {
      cfGuid: 'cnsi-1',
      spaceGuid: 'space-1',
      orgGuid: 'org-1',
      servicePlanGuid: 'plan-1',
      serviceGuid: 'svc-1',
      serviceInstanceGuid: opts.isEditMode ? 'si-existing' : undefined,
      bindAppGuid: opts.bindAppGuid,
      bindAppParams: opts.csiBindParams,
      // As in the real wizard: create never writes the name into wizard
      // state, and edit seeds it with the instance's name before the user
      // renames it in the form. Messages must name what the form sent.
      name: opts.isEditMode ? 'my-old-instance' : '',
      spaceScoped: false,
    };

    const modeServiceStub = {
      isEditServiceInstanceMode: vi.fn().mockReturnValue(!!opts.isEditMode),
      isMarketplaceMode: vi.fn().mockReturnValue(false),
      isAppServicesMode: vi.fn().mockReturnValue(false),
      isServicesWallMode: vi.fn().mockReturnValue(false),
      createApplicationServiceBinding: vi.fn().mockReturnValue(
        of({ success: true })
      ),
    };

    const csiStateStub: any = {
      // Expose state as a plain function so toObservable() over the signal
      // produces a single-emit stream. The real CsiStateService uses a Signal,
      // but the component only subscribes via toObservable + take(1) so a
      // simple cold observable suffices here.
      state: () => csiState,
      setServiceInstanceGuid: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SpecifyDetailsStepComponent, SchemaFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          ...generateCfBaseTestModulesNoShared(),
        ),
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService,
        { provide: CsiModeService, useValue: modeServiceStub },
        { provide: CsiStateService, useValue: csiStateStub },
      ],
    });

    const fixture = TestBed.createComponent(SpecifyDetailsStepComponent);
    const component = fixture.componentInstance;
    component.createNewInstanceForm.controls.name.setValue('my-instance');
    fixture.detectChanges();
    return {
      fixture,
      component,
      modeServiceStub,
      csiStateStub,
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  it('POSTs the v3 managed body and returns success+redirect on create without bind', async () => {
    const { component, httpMock } = setup();
    const snackBarOpen = vi.spyOn((component as any).snackBar, 'open');
    const result$ = component.onNext();
    const finalResult = firstValueFrom(result$);

    const req = httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      type: 'managed',
      name: 'my-instance',
      relationships: {
        space: { data: { guid: 'space-1' } },
        service_plan: { data: { guid: 'plan-1' } },
      },
    });
    // 200 fast-path: backend wraps as {state, result: <translateCFJobResult output>}
    req.flush(
      {
        state: 'COMPLETE',
        result: {
          jobGuid: 'job-1',
          operation: 'service_instance.create',
          links: { service_instances: 'https://cf/v3/service_instances/si-new' },
        },
      },
      { status: 200, statusText: 'OK' },
    );

    await expect(finalResult).resolves.toEqual({ success: true, redirect: true });
    expect(snackBarOpen).toHaveBeenCalledWith('Service instance "my-instance" created.', 'Dismiss', { duration: 4000 });
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('binds an existing instance and names it, without claiming it was created', async () => {
    const { component, modeServiceStub, httpMock } = setup({ bindAppGuid: 'app-1' });
    const snackBarOpen = vi.spyOn((component as any).snackBar, 'open');
    component.bindExistingInstance = true;
    component.bindableServiceInstances$ = of([
      { guid: 'si-1', name: 'instance-one' },
      { guid: 'si-2', name: 'instance-two' },
    ] as StServiceInstance[]);
    component.selectExistingInstanceForm.controls.serviceInstance.setValue('si-2');

    await expect(firstValueFrom(component.onNext())).resolves.toEqual({ success: true, redirect: true });
    expect(modeServiceStub.createApplicationServiceBinding).toHaveBeenCalledWith('si-2', 'cnsi-1', 'app-1', undefined);
    expect(snackBarOpen).toHaveBeenCalledWith('Service instance "instance-two" bound to the application.', 'Dismiss', { duration: 4000 });
    httpMock.expectNone('/pp/v1/cf/service_instances/cnsi-1');
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('chains into bind when bindAppGuid is set and a SI guid is extractable', async () => {
    const { component, modeServiceStub, csiStateStub, httpMock } = setup({ bindAppGuid: 'app-1' });
    const snackBarOpen = vi.spyOn((component as any).snackBar, 'open');
    const result$ = component.onNext();
    const finalResult = firstValueFrom(result$);

    const post = httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1');
    post.flush(
      {
        state: 'COMPLETE',
        result: {
          jobGuid: 'job-1',
          operation: 'service_instance.create',
          links: { service_instances: 'https://cf/v3/service_instances/si-new' },
        },
      },
      { status: 200, statusText: 'OK' },
    );

    await expect(finalResult).resolves.toEqual({ success: true, redirect: true });
    expect(snackBarOpen).toHaveBeenCalledWith('Service instance "my-instance" created and bound.', 'Dismiss', { duration: 4000 });
    expect(csiStateStub.setServiceInstanceGuid).toHaveBeenCalledWith('si-new');
    expect(modeServiceStub.createApplicationServiceBinding).toHaveBeenCalledWith(
      'si-new', 'cnsi-1', 'app-1', undefined,
    );
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('reports a create that ended with an unknown result, and that the bind was not attempted', async () => {
    const { component, modeServiceStub, httpMock } = setup({ bindAppGuid: 'app-1' });
    const result$ = component.onNext();
    const finalResult = firstValueFrom(result$);

    // 202 handoff with a job the backend no longer knows → UNKNOWN.
    const post = httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1');
    post.flush(
      { id: 'job-2', state: 'PROCESSING', startedAt: '2026-05-09T00:00:00Z' },
      { status: 202, statusText: 'Accepted' },
    );

    await Promise.resolve();
    const poll = httpMock.expectOne('/pp/v1/stratos/jobs/job-2');
    poll.flush({ errors: [{ message: 'unknown job' }] }, { status: 404, statusText: 'Not Found' });

    await expect(finalResult).resolves.toEqual({
      success: false,
      message: 'Create service instance "my-instance": the operation ended, but its result could not be determined. '
        + 'The Services list shows the current state. It was not bound to the application.',
    });
    expect(modeServiceStub.createApplicationServiceBinding).not.toHaveBeenCalled();
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('reports an update that ended with an unknown result, never as updated', async () => {
    const { component, httpMock } = setup({ isEditMode: true });
    const finalResult = firstValueFrom(component.onNext());

    httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1/si-existing').flush(null, { status: 202, statusText: 'Accepted' });

    await expect(finalResult).resolves.toEqual({
      success: false,
      message: 'Update service instance "my-instance": the operation ended, but its result could not be determined. '
        + 'The Services list shows the current state.',
    });
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('reports a bind that ended with an unknown result after a create', async () => {
    const { component, modeServiceStub, httpMock } = setup({ bindAppGuid: 'app-1' });
    modeServiceStub.createApplicationServiceBinding.mockReturnValue(of({ success: false, unknown: true }));
    const finalResult = firstValueFrom(component.onNext());

    httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1').flush(
      {
        state: 'COMPLETE',
        result: { jobGuid: 'job-1', operation: 'service_instance.create', links: { service_instances: 'https://cf/v3/service_instances/si-new' } },
      },
      { status: 200, statusText: 'OK' },
    );

    await expect(finalResult).resolves.toEqual({
      success: false,
      message: 'Service instance "my-instance" was created. Binding it to the application: the operation ended, '
        + 'but its result could not be determined. The application\'s Services tab shows the current state.',
    });
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('names the instance and says it was created when the bind after a create fails', async () => {
    const { component, modeServiceStub, httpMock } = setup({ bindAppGuid: 'app-1' });
    modeServiceStub.createApplicationServiceBinding.mockReturnValue(of({ success: false, message: 'bind said no' }));
    const finalResult = firstValueFrom(component.onNext());

    httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1').flush(
      {
        state: 'COMPLETE',
        result: { jobGuid: 'job-1', operation: 'service_instance.create', links: { service_instances: 'https://cf/v3/service_instances/si-new' } },
      },
      { status: 200, statusText: 'OK' },
    );

    await expect(finalResult).resolves.toEqual({
      success: false,
      message: 'Service instance "my-instance" was created, but binding it to the application failed: bind said no',
    });
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('names the instance when binding an existing one fails', async () => {
    const { component, modeServiceStub, httpMock } = setup({ bindAppGuid: 'app-1' });
    modeServiceStub.createApplicationServiceBinding.mockReturnValue(of({ success: false, message: 'bind said no' }));
    component.bindExistingInstance = true;
    component.bindableServiceInstances$ = of([{ guid: 'si-2', name: 'instance-two' }] as StServiceInstance[]);
    component.selectExistingInstanceForm.controls.serviceInstance.setValue('si-2');

    await expect(firstValueFrom(component.onNext())).resolves.toEqual({
      success: false,
      message: 'Failed to bind service instance "instance-two" to the application: bind said no',
    });
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('PATCHes the v3 endpoint and returns success+redirect on update', async () => {
    const { component, httpMock } = setup({ isEditMode: true });
    const snackBarOpen = vi.spyOn((component as any).snackBar, 'open');
    const result$ = component.onNext();
    const finalResult = firstValueFrom(result$);

    const req = httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1/si-existing');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toMatchObject({ name: 'my-instance' });
    req.flush(
      {
        state: 'COMPLETE',
        result: { jobGuid: 'job-3', operation: 'service_instance.update' },
      },
      { status: 200, statusText: 'OK' },
    );

    await expect(finalResult).resolves.toEqual({ success: true, redirect: true });
    expect(snackBarOpen).toHaveBeenCalledWith('Service instance "my-instance" updated.', 'Dismiss', { duration: 4000 });
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  describe('a write that outlasts the wait', () => {
    const failedJob = {
      id: 'job-slow', kind: 'service_instance.create', state: 'FAILED', startedAt: '2026-10-15T00:00:00Z',
      errors: [{ code: 'CF-UnableToPerform', message: 'CF-UnableToPerform', detail: 'the broker said no' }],
    };

    async function startSlowCreate(opts: Parameters<typeof setup>[0] = {}, deadline?: AbortController) {
      vi.useFakeTimers();
      const ctx = setup(opts);
      const tracked = TestBed.inject(TrackedJobsService);
      vi.spyOn(tracked, 'remember');
      vi.spyOn(tracked, 'forget');
      if (deadline) {
        vi.spyOn(tracked, 'deadline').mockReturnValue({ signal: deadline.signal, clear: () => undefined });
      }
      const open = vi.spyOn((ctx.component as any).snackBar, 'open');
      const error = vi.spyOn((ctx.component as any).snackBar, 'error');
      const result = firstValueFrom(ctx.component.onNext());
      ctx.httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1').flush(
        { id: 'job-slow', state: 'PROCESSING', startedAt: '2026-10-15T00:00:00Z' },
        { status: 202, statusText: 'Accepted' },
      );
      await vi.advanceTimersByTimeAsync(0);
      // Answer the background loaders the cf test module starts, so their
      // 60 s timeouts do not fire while these tests wait minutes.
      ctx.httpMock.match(r => !r.url.startsWith('/pp/v1/stratos/jobs/'))
        .forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
      return { ...ctx, open, error, result, tracked };
    }

    function answerPoll(httpMock: HttpTestingController, body: object) {
      httpMock.expectOne('/pp/v1/stratos/jobs/job-slow').flush(body, { status: 200, statusText: 'OK' });
    }

    it('asks at 30 s, and with no answer hands off to the Services list, keeps tracking, and reports a later failure', async () => {
      const { component, httpMock, open, error, result } = await startSlowCreate();
      try {
        await vi.advanceTimersByTimeAsync(30_000);
        expect(component.slowWrite()).toEqual({
          text: 'Creating service instance "my-instance" is still running after 30 s.', answerIn: 30,
        });
        expect(open).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(29_000);
        expect(component.slowWrite()?.answerIn).toBe(1);
        expect(open).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1_000);
        await expect(result).resolves.toEqual({ success: true, redirect: true });
        expect(component.slowWrite()).toBeNull();
        expect(open).toHaveBeenCalledWith(
          'Creating service instance "my-instance" carries on in the background. The Services list shows its '
            + 'progress, and a message will say how it ended.',
          'Dismiss', { duration: 10000 },
        );

        answerPoll(httpMock, failedJob);
        await vi.advanceTimersByTimeAsync(0);
        expect(error).toHaveBeenCalledWith('Failed to create service instance "my-instance": the broker said no');
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('brings the question into view when it appears', async () => {
      const scrollIntoView = vi.fn();
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = scrollIntoView;
      const { fixture, httpMock, result, component } = await startSlowCreate();
      try {
        await vi.advanceTimersByTimeAsync(30_000);
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
        expect(scrollIntoView.mock.contexts[0]).toBe(fixture.nativeElement.querySelector('[role=alertdialog]'));
        component.continueInBackground();
        await result;
      } finally {
        Element.prototype.scrollIntoView = original;
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('hands off at once when the user chooses to continue in the background', async () => {
      const { component, httpMock, open, result } = await startSlowCreate();
      try {
        await vi.advanceTimersByTimeAsync(30_000);
        component.continueInBackground();
        await expect(result).resolves.toEqual({ success: true, redirect: true });
        expect(open).toHaveBeenCalledWith(
          'Creating service instance "my-instance" carries on in the background. The Services list shows its '
            + 'progress, and a message will say how it ended.',
          'Dismiss', { duration: 10000 },
        );
        expect(component.slowWrite()).toBeNull();
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('keeps waiting for the chosen seconds, then asks again with the time so far', async () => {
      const { component, httpMock, open, result } = await startSlowCreate();
      let settled = false;
      void result.then(() => { settled = true; });
      try {
        await vi.advanceTimersByTimeAsync(40_000);
        component.waitSeconds.setValue(45);
        component.keepWaiting();
        expect(component.slowWrite()).toBeNull();
        await vi.advanceTimersByTimeAsync(44_000);
        expect(component.slowWrite()).toBeNull();
        expect(settled).toBe(false);
        await vi.advanceTimersByTimeAsync(1_000);
        expect(component.slowWrite()).toEqual({
          text: 'Creating service instance "my-instance" is still running after 1 min.', answerIn: 30,
        });
        expect(open).not.toHaveBeenCalled();
        expect(settled).toBe(false);
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('takes 30 to 600 whole seconds and ignores Keep waiting otherwise', async () => {
      const { component, httpMock, result } = await startSlowCreate();
      try {
        await vi.advanceTimersByTimeAsync(30_000);
        for (const [value, valid] of [[29, false], [30, true], [600, true], [601, false], [45.5, false], [null, false]] as const) {
          component.waitSeconds.setValue(value as number);
          expect(component.waitSeconds.valid).toBe(valid);
        }
        component.waitSeconds.setValue(601);
        component.keepWaiting();
        expect(component.slowWrite()).not.toBeNull();
        component.continueInBackground();
        await result;
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('closes the prompt and reports the outcome when the write ends while asking', async () => {
      const { component, httpMock, open, result } = await startSlowCreate();
      try {
        await vi.advanceTimersByTimeAsync(30_000);
        expect(component.slowWrite()).not.toBeNull();
        answerPoll(httpMock, { ...failedJob, state: 'COMPLETE', errors: undefined, result: {} });
        await expect(result).resolves.toEqual({ success: true, redirect: true });
        expect(component.slowWrite()).toBeNull();
        expect(open).toHaveBeenCalledTimes(1);
        expect(open).toHaveBeenCalledWith('Service instance "my-instance" created.', 'Dismiss', { duration: 4000 });
        await vi.advanceTimersByTimeAsync(60_000);
        expect(open).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('hands off once when the user leaves while being asked', async () => {
      const { component, fixture, httpMock, open, result } = await startSlowCreate();
      try {
        await vi.advanceTimersByTimeAsync(30_000);
        fixture.destroy();
        await expect(result).resolves.toEqual({ success: true, redirect: true });
        expect(component.slowWrite()).toBeNull();
        await vi.advanceTimersByTimeAsync(60_000);
        expect(open).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    const processingJob = { ...failedJob, state: 'PROCESSING', errors: undefined };

    it('remembers a running write so a reload or a new sign-in can report it, and forgets it once it ends', async () => {
      const { httpMock, result, tracked } = await startSlowCreate();
      try {
        answerPoll(httpMock, processingJob);
        await vi.advanceTimersByTimeAsync(0);
        expect(tracked.remember).toHaveBeenCalledWith({
          jobId: 'job-slow',
          startedAt: Date.now(),
          running: 'Creating service instance "my-instance"',
          done: 'Service instance "my-instance" created.',
          failed: 'Failed to create service instance "my-instance"',
          unknown: 'Create service instance "my-instance"',
          where: 'The Services list',
        });
        expect(tracked.following.has('job-slow')).toBe(true);
        await vi.advanceTimersByTimeAsync(500);
        answerPoll(httpMock, { ...failedJob, state: 'COMPLETE', errors: undefined, result: {} });
        await expect(result).resolves.toEqual({ success: true, redirect: true });
        expect(tracked.forget).toHaveBeenCalledWith('job-slow');
        expect(tracked.following.has('job-slow')).toBe(false);
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('says a resumed create was not bound when the wizard was to bind it', async () => {
      const { httpMock, tracked } = await startSlowCreate({ bindAppGuid: 'app-1' });
      try {
        answerPoll(httpMock, processingJob);
        await vi.advanceTimersByTimeAsync(0);
        expect(tracked.remember).toHaveBeenCalledWith(expect.objectContaining({
          done: 'Service instance "my-instance" created. It was not bound to the application: the wizard that '
            + 'would bind it closed before the instance was ready.',
        }));
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('keeps the record and says so when the session ends while following', async () => {
      const { httpMock, result, tracked } = await startSlowCreate();
      try {
        answerPoll(httpMock, processingJob);
        await vi.advanceTimersByTimeAsync(500);
        httpMock.expectOne('/pp/v1/stratos/jobs/job-slow').flush({}, { status: 401, statusText: 'Unauthorized' });
        await expect(result).resolves.toEqual({
          success: false,
          message: 'Signed out while Creating service instance "my-instance" was running (1 s so far). '
            + 'Its status will show after you sign in.',
        });
        expect(tracked.forget).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('stops following when the hour is up, says so, and forgets the write', async () => {
      const deadline = new AbortController();
      const { httpMock, result, tracked } = await startSlowCreate({}, deadline);
      try {
        expect(tracked.deadline).toHaveBeenCalledWith(Date.now());
        answerPoll(httpMock, processingJob);
        await vi.advanceTimersByTimeAsync(500);
        deadline.abort();
        await vi.advanceTimersByTimeAsync(0);
        await expect(result).resolves.toEqual({
          success: false,
          message: 'Creating service instance "my-instance" was still running after 1 hour, so Stratos stopped '
            + 'checking on it. The Services list shows its current state.',
        });
        expect(tracked.forget).toHaveBeenCalledWith('job-slow');
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).filter(r => !r.cancelled).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('does not hand off a write that ends inside the wait', async () => {
      const { httpMock, open, result } = await startSlowCreate();
      try {
        await vi.advanceTimersByTimeAsync(29_000);
        answerPoll(httpMock, { ...failedJob, state: 'COMPLETE', errors: undefined, result: {} });
        await expect(result).resolves.toEqual({ success: true, redirect: true });
        expect(open).toHaveBeenCalledTimes(1);
        expect(open).toHaveBeenCalledWith('Service instance "my-instance" created.', 'Dismiss', { duration: 4000 });
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('hands off as soon as the user leaves the wizard, and only once', async () => {
      const { fixture, httpMock, open } = await startSlowCreate();
      try {
        fixture.destroy();
        expect(open).toHaveBeenCalledWith(
          'Creating service instance "my-instance" carries on in the background. The Services list shows its '
            + 'progress, and a message will say how it ended.',
          'Dismiss', { duration: 10000 },
        );
        await vi.advanceTimersByTimeAsync(90_000);
        expect(open).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });

    it('reports a failure that ends after the user left the wizard', async () => {
      const { fixture, httpMock, error } = await startSlowCreate();
      try {
        fixture.destroy();
        answerPoll(httpMock, failedJob);
        await vi.advanceTimersByTimeAsync(0);
        expect(error).toHaveBeenCalledWith('Failed to create service instance "my-instance": the broker said no');
      } finally {
        vi.useRealTimers();
      }
      httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
    });
  });

  it('surfaces CF detail message on 4xx create failure', async () => {
    const { component, httpMock } = setup();
    const result$ = component.onNext();
    const finalResult = firstValueFrom(result$);

    const req = httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1');
    req.flush(
      { errors: [{ code: 10008, title: 'CF-UnprocessableEntity', detail: 'Service instance name is taken' }] },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    const out = await finalResult;
    expect(out.success).toBe(false);
    expect(out.message).toContain('Service instance name is taken');
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  // Recorded backend answers (see @test-framework/cf service-write-contract):
  // a synchronous or asynchronous broker, resolved on the fast or the polled
  // path, must give the user the same outcome.
  describe('same outcome for sync and async brokers on both resolve paths', () => {
    const CREATE_URL = '/pp/v1/cf/service_instances/cnsi-1';
    const UPDATE_URL = '/pp/v1/cf/service_instances/cnsi-1/si-existing';

    async function runOnNext(opts: Parameters<typeof setup>[0], url: string, contract: ServiceWriteContract, path: ResolvePath) {
      const ctx = setup(opts);
      const finalResult = firstValueFrom(ctx.component.onNext());
      await answerServiceWrite(ctx.httpMock, url, contract, path);
      const out = await finalResult;
      // Drain unrelated background loaders the cf test module fires on bootstrap.
      ctx.httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
      return { out, ...ctx };
    }

    // The new instance's guid as CF reported it, found without assuming
    // which link key carries it.
    function createdGuid(contract: ServiceWriteContract): string {
      const m = JSON.stringify(contract.fastPath.body).match(/\/v3\/service_instances\/([0-9a-f-]{36})/);
      if (!m) {
        throw new Error('recorded create names no service instance');
      }
      return m[1];
    }

    for (const broker of ['sync', 'async']) {
      for (const path of RESOLVE_PATHS) {
        const name = `${broker} broker, ${path} path`;

        it(`creates: ${name}`, async () => {
          const { out } = await runOnNext({}, CREATE_URL, serviceWriteContract(`${broker}-service-instance-create`), path);
          expect(out).toEqual({ success: true, redirect: true });
        });

        it(`creates and binds the selected app: ${name}`, async () => {
          const contract = serviceWriteContract(`${broker}-service-instance-create`);
          const { out, csiStateStub, modeServiceStub } = await runOnNext({ bindAppGuid: 'app-1' }, CREATE_URL, contract, path);
          expect(out).toEqual({ success: true, redirect: true });
          expect(csiStateStub.setServiceInstanceGuid).toHaveBeenCalledWith(createdGuid(contract));
          expect(modeServiceStub.createApplicationServiceBinding).toHaveBeenCalledWith(
            createdGuid(contract), 'cnsi-1', 'app-1', undefined,
          );
        });

        it(`updates: ${name}`, async () => {
          const { out } = await runOnNext({ isEditMode: true }, UPDATE_URL, serviceWriteContract(`${broker}-service-instance-update`), path);
          expect(out).toEqual({ success: true, redirect: true });
        });
      }
    }

    const failures: [string, string, Parameters<typeof setup>[0]][] = [
      ['failasync-service-instance-create', CREATE_URL, {}],
      ['syncfail-service-instance-create', CREATE_URL, {}],
      ['failasync-service-instance-update', UPDATE_URL, { isEditMode: true }],
    ];
    for (const [contractName, url, opts] of failures) {
      // Both paths show Stratos's lead-in and the broker's own words; the
      // CF code and title go to the console (#6002).
      it(`reports the broker failure the same way on both paths: ${contractName}`, async () => {
        const contract = serviceWriteContract(contractName);
        const fast = await runOnNext(opts, url, contract, 'fast');
        const polled = await runOnNext(opts, url, contract, 'polled');
        expect(fast.out.success).toBe(false);
        expect(polled.out.success).toBe(false);
        expect(polled.out.message).toEqual(fast.out.message);
      });
    }
  });
});
