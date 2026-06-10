import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TailwindJsonSchemaFormModule } from '@stratosui/core';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { SchemaFormComponent } from '../../schema-form/schema-form.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { CsiStateService } from '../csi-state.service';
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
          TailwindJsonSchemaFormModule,
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
      name: 'my-instance',
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
          TailwindJsonSchemaFormModule,
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
          links: { service_instance: 'https://cf/v3/service_instances/si-new' },
        },
      },
      { status: 200, statusText: 'OK' },
    );

    await expect(finalResult).resolves.toEqual({ success: true, redirect: true });
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('chains into bind when bindAppGuid is set and a SI guid is extractable', async () => {
    const { component, modeServiceStub, csiStateStub, httpMock } = setup({ bindAppGuid: 'app-1' });
    const result$ = component.onNext();
    const finalResult = firstValueFrom(result$);

    const post = httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1');
    post.flush(
      {
        state: 'COMPLETE',
        result: {
          jobGuid: 'job-1',
          operation: 'service_instance.create',
          links: { service_instance: 'https://cf/v3/service_instances/si-new' },
        },
      },
      { status: 200, statusText: 'OK' },
    );

    await expect(finalResult).resolves.toEqual({ success: true, redirect: true });
    expect(csiStateStub.setServiceInstanceGuid).toHaveBeenCalledWith('si-new');
    expect(modeServiceStub.createApplicationServiceBinding).toHaveBeenCalledWith(
      'si-new', 'cnsi-1', 'app-1', undefined,
    );
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('skips auto-bind on slow-async create when no SI link is available (UNKNOWN/missing-link path)', async () => {
    const { component, modeServiceStub, httpMock } = setup({ bindAppGuid: 'app-1' });
    const result$ = component.onNext();
    const finalResult = firstValueFrom(result$);

    // 202 handoff with a job that 404s on poll → writeWithJob resolves UNKNOWN.
    const post = httpMock.expectOne('/pp/v1/cf/service_instances/cnsi-1');
    post.flush(
      { id: 'job-2', state: 'PROCESSING', startedAt: '2026-05-09T00:00:00Z' },
      { status: 202, statusText: 'Accepted' },
    );

    await Promise.resolve();
    const poll = httpMock.expectOne('/pp/v1/stratos/jobs/job-2');
    poll.flush({ errors: [{ message: 'unknown job' }] }, { status: 404, statusText: 'Not Found' });

    // SI eventually settles in CF; bind is left to the user via the services
    // wall — same UX as SERVICES_WALL_MODE. No bind call here.
    await expect(finalResult).resolves.toEqual({ success: true, redirect: true });
    expect(modeServiceStub.createApplicationServiceBinding).not.toHaveBeenCalled();
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('PATCHes the v3 endpoint and returns success+redirect on update', async () => {
    const { component, httpMock } = setup({ isEditMode: true });
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
    // Drain unrelated background loaders the cf test module fires on bootstrap;
    // they are not under test in this stage.
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
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
});
