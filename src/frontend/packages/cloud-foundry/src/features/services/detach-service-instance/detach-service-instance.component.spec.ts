import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { PaginationMonitorFactory, EntityServiceFactory, EntityMonitorFactory, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { CloudFoundryTestingModule } from "@test-framework/cf";
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { StServiceCredentialBinding } from '../../../services/endpoint-data/stratos-types';
import { DetachServiceInstanceComponent } from "./detach-service-instance.component";

const cfGuid = 'test-cf-guid';
const serviceInstanceId = 'test-service-instance-id';

function configureModule(routerStub: { navigate: ReturnType<typeof vi.fn> }) {
  TestBed.resetTestingModule();
  return TestBed.configureTestingModule({
    imports: [
      DetachServiceInstanceComponent,
      createBasicStoreModule(),
      CloudFoundryTestingModule,
    ],
    providers: [
      ...STORE_TEST_PROVIDERS,
      DatePipe,
      TabNavService,
      PaginationMonitorFactory,
      EntityServiceFactory,
      EntityMonitorFactory,
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            params: { serviceInstanceId, endpointId: cfGuid },
            queryParams: {},
          },
        },
      },
      { provide: Router, useValue: routerStub },
      provideZonelessChangeDetection(),
      provideNoopAnimations(),
    ],
  }).compileComponents();
}

function makeBinding(guid: string, appName: string): StServiceCredentialBinding {
  return {
    guid,
    cnsiGuid: cfGuid,
    type: 'app',
    serviceInstance: { guid: serviceInstanceId },
    app: { guid: `app-${guid}`, name: appName },
    createdAt: '2026-05-09T00:00:00Z',
  };
}

describe('DetachServiceInstanceComponent', () => {
  let component: DetachServiceInstanceComponent;
  let fixture: ComponentFixture<DetachServiceInstanceComponent>;
  let routerStub: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    routerStub = { navigate: vi.fn().mockResolvedValue(true) };
    await configureModule(routerStub);
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);
  });

  it('should create', () => {
    fixture = TestBed.createComponent(DetachServiceInstanceComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});

// Stage 6 of the services-domain signal+V3 slice: confirmStepHandle.submit
// fires a v3 DELETE per binding via writeWithJob and tracks each row's
// outcome via signals. Replaces the prior ngrx
// ServiceActionHelperService.detachServiceBinding fan-out + the
// AppActionMonitorComponent ngrx-coupled progress display.
describe('DetachServiceInstanceComponent.confirmStepHandle.submit (v3 + writeWithJob)', () => {
  let routerStub: { navigate: ReturnType<typeof vi.fn> };

  async function bootstrap(bindings: StServiceCredentialBinding[]) {
    routerStub = { navigate: vi.fn().mockResolvedValue(true) };
    await configureModule(routerStub);
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);

    const fixture = TestBed.createComponent(DetachServiceInstanceComponent);
    const component = fixture.componentInstance;
    // detectChanges first so the <app-detach-apps> child mounts and runs its
    // initial "empty selection" emit; setSelectedBindings then overrides with
    // the test's chosen bindings (mirroring the user's Step 1 selection).
    fixture.detectChanges();
    component.setSelectedBindings(bindings);
    return { fixture, component, httpMock: TestBed.inject(HttpTestingController) };
  }

  it('all-success: each binding resolves COMPLETE, status flips to success', async () => {
    const b1 = makeBinding('bind-1', 'app-1');
    const b2 = makeBinding('bind-2', 'app-2');
    const { component, httpMock } = await bootstrap([b1, b2]);

    const submitPromise = component.confirmStepHandle.submit();
    // Both DELETEs fire in parallel.
    const reqs = httpMock.match(`/pp/v1/cf/service_bindings/${cfGuid}/bind-1`)
      .concat(httpMock.match(`/pp/v1/cf/service_bindings/${cfGuid}/bind-2`));
    expect(reqs.length).toBe(2);
    expect(reqs.every(r => r.request.method === 'DELETE')).toBe(true);
    reqs.forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));

    await submitPromise;
    const rows = component.rows();
    expect(rows.find(r => r.guid === 'bind-1')?.status).toBe('success');
    expect(rows.find(r => r.guid === 'bind-2')?.status).toBe('success');

    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('mixed: one binding fails with FAILED job, the other succeeds', async () => {
    const b1 = makeBinding('bind-ok', 'app-1');
    const b2 = makeBinding('bind-bad', 'app-2');
    const { component, httpMock } = await bootstrap([b1, b2]);

    const submitPromise = component.confirmStepHandle.submit();
    const okReq = httpMock.expectOne(`/pp/v1/cf/service_bindings/${cfGuid}/bind-ok`);
    const badReq = httpMock.expectOne(`/pp/v1/cf/service_bindings/${cfGuid}/bind-bad`);

    okReq.flush({}, { status: 200, statusText: 'OK' });
    // 202 handoff that polls to FAILED → writeWithJob throws StratosJobError
    badReq.flush(
      { id: 'job-bad', state: 'PROCESSING', startedAt: '2026-05-09T00:00:00Z' },
      { status: 202, statusText: 'Accepted' },
    );
    await Promise.resolve();
    const poll = httpMock.expectOne('/pp/v1/stratos/jobs/job-bad');
    poll.flush(
      {
        id: 'job-bad',
        state: 'FAILED',
        startedAt: '2026-05-09T00:00:00Z',
        updatedAt: '2026-05-09T00:00:01Z',
        errors: [{ code: 'cf.service_binding.delete', message: 'binding still referenced' }],
      },
      { status: 200, statusText: 'OK' },
    );

    await submitPromise;
    const rows = component.rows();
    expect(rows.find(r => r.guid === 'bind-ok')?.status).toBe('success');
    const failedRow = rows.find(r => r.guid === 'bind-bad');
    expect(failedRow?.status).toBe('error');
    expect(failedRow?.errorMessage).toContain('binding still referenced');

    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('navigates to /services on second click after deleteStarted', async () => {
    const { component, httpMock } = await bootstrap([makeBinding('b1', 'app-1')]);

    // First click — fires the delete.
    const first = component.confirmStepHandle.submit();
    httpMock.expectOne(`/pp/v1/cf/service_bindings/${cfGuid}/b1`)
      .flush({}, { status: 200, statusText: 'OK' });
    await first;

    // Second click — navigates instead of re-deleting.
    routerStub.navigate.mockClear();
    await component.confirmStepHandle.submit();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/services']);
    httpMock.match(`/pp/v1/cf/service_bindings/${cfGuid}/b1`).forEach(r =>
      r.flush({}, { status: 200, statusText: 'OK' }),
    );
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });

  it('safe no-op when no bindings selected', async () => {
    const { component, httpMock } = await bootstrap([]);
    await component.confirmStepHandle.submit();
    // No DELETE issued.
    expect(httpMock.match(req => req.url.includes('/service_bindings/')).length).toBe(0);
    httpMock.match(() => true).forEach(r => r.flush({}, { status: 200, statusText: 'OK' }));
  });
});
