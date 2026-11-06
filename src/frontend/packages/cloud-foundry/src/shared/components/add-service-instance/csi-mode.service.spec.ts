import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CsiModeService } from './csi-mode.service';

function configure(routeParams: Record<string, string>) {
  TestBed.resetTestingModule();
  const mockActivatedRoute = {
    snapshot: {
      params: routeParams,
      queryParams: {},
      queryParamMap: {
        get: vi.fn().mockReturnValue(null),
      },
    },
  } as unknown as ActivatedRoute;

  const mockRouter = {
    getCurrentNavigation: vi.fn().mockReturnValue(null),
  } as unknown as Router;

  TestBed.configureTestingModule({
    providers: [
      CsiModeService,
      { provide: ActivatedRoute, useValue: mockActivatedRoute },
      { provide: Router, useValue: mockRouter },
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
}

describe('CsiModeService', () => {
  it('should be created', () => {
    configure({});
    const service = TestBed.inject(CsiModeService);
    expect(service).toBeTruthy();
  });

  // The SERVICES_WALL_MODE branch is the behavior fix PR 5053 shipped: when
  // the create-instance stepper launches from the top-level services wall
  // (no endpointId in the route), the bind-to-app step must be hidden. Async
  // service brokers provision instances in the background, and the inline
  // bind step would otherwise try to bind before the instance is ready.

  describe('SERVICES_WALL_MODE (no endpointId on route)', () => {
    beforeEach(() => configure({}));

    it('hides the bind-to-app step', () => {
      const svc = TestBed.inject(CsiModeService);
      expect(svc.viewDetail.showBindApp).toBe(false);
    });

    it('reports SERVICES_WALL_MODE', () => {
      const svc = TestBed.inject(CsiModeService);
      expect(svc.isServicesWallMode()).toBe(true);
      expect(svc.isMarketplaceMode()).toBe(false);
      expect(svc.isAppServicesMode()).toBe(false);
      expect(svc.isEditServiceInstanceMode()).toBe(false);
    });

    it('keeps the other stepper steps visible', () => {
      const svc = TestBed.inject(CsiModeService);
      expect(svc.viewDetail.showSelectCf).toBe(true);
      expect(svc.viewDetail.showSelectService).toBe(true);
      expect(svc.viewDetail.showSelectServicePlan).toBe(true);
      expect(svc.viewDetail.showSpecifyDetails).toBe(true);
    });
  });

  describe('MARKETPLACE_MODE (serviceId + endpointId)', () => {
    beforeEach(() => configure({ serviceId: 'svc-1', endpointId: 'cf-1' }));

    it('keeps bind-to-app visible', () => {
      const svc = TestBed.inject(CsiModeService);
      expect(svc.viewDetail.showBindApp).toBe(true);
      expect(svc.isMarketplaceMode()).toBe(true);
    });
  });

  describe('APP_SERVICES_MODE (id + endpointId, no serviceId)', () => {
    beforeEach(() => configure({ id: 'app-1', endpointId: 'cf-1' }));

    it('keeps bind-to-app visible', () => {
      const svc = TestBed.inject(CsiModeService);
      expect(svc.viewDetail.showBindApp).toBe(true);
      expect(svc.isAppServicesMode()).toBe(true);
    });
  });

  describe('EDIT_SERVICE_INSTANCE_MODE (serviceInstanceId + endpointId)', () => {
    beforeEach(() => configure({ serviceInstanceId: 'si-1', endpointId: 'cf-1' }));

    it('also hides bind-to-app (already provisioned, edit flow)', () => {
      const svc = TestBed.inject(CsiModeService);
      expect(svc.viewDetail.showBindApp).toBe(false);
      expect(svc.isEditServiceInstanceMode()).toBe(true);
    });
  });

  // Stage 3 of the services-domain signal+V3 slice: createApplicationServiceBinding
  // is wired to the v3 POST handler via writeWithJob instead of ngrx
  // cfEntityCatalog.serviceBinding.api.create. The two callers (specify-details
  // and specify-user-provided) consume the same `{success, message?}` shape, so
  // the contract is verified across the sync (201), async (202 → poll), and
  // failure paths.
  describe('createApplicationServiceBinding (v3 + writeWithJob)', () => {
    beforeEach(() => configure({}));

    it('posts the v3-shaped body to the Stratos write endpoint', async () => {
      const svc = TestBed.inject(CsiModeService);
      const httpMock = TestBed.inject(HttpTestingController);

      const result$ = svc.createApplicationServiceBinding('si-1', 'cnsi-1', 'app-1', { foo: 'bar' });
      const finalResult = firstValueFrom(result$);

      const req = httpMock.expectOne('/pp/v1/cf/service_bindings/cnsi-1');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'app',
        relationships: {
          app: { data: { guid: 'app-1' } },
          service_instance: { data: { guid: 'si-1' } },
        },
        parameters: { foo: 'bar' },
      });

      // Sync 201 path — writeWithJob treats 2xx<202 as COMPLETE.
      req.flush({ guid: 'binding-1', type: 'app' }, { status: 201, statusText: 'Created' });

      await expect(finalResult).resolves.toEqual({ success: true });
      httpMock.verify();
    });

    it('omits parameters when none provided', async () => {
      const svc = TestBed.inject(CsiModeService);
      const httpMock = TestBed.inject(HttpTestingController);

      const result$ = svc.createApplicationServiceBinding('si-1', 'cnsi-1', 'app-1', {});
      const finalResult = firstValueFrom(result$);

      const req = httpMock.expectOne('/pp/v1/cf/service_bindings/cnsi-1');
      expect(req.request.body.parameters).toBeUndefined();
      req.flush({}, { status: 201, statusText: 'Created' });
      await finalResult;
      httpMock.verify();
    });

    it('resolves async 202 → poll → COMPLETE as success', async () => {
      const svc = TestBed.inject(CsiModeService);
      const httpMock = TestBed.inject(HttpTestingController);

      const result$ = svc.createApplicationServiceBinding('si-1', 'cnsi-1', 'app-1', {});
      const finalResult = firstValueFrom(result$);

      const post = httpMock.expectOne('/pp/v1/cf/service_bindings/cnsi-1');
      post.flush(
        { id: 'job-7', state: 'PROCESSING', startedAt: '2026-05-08T00:00:00Z' },
        { status: 202, statusText: 'Accepted' },
      );

      // Yield the microtask so writeWithJob enters its poll loop.
      await Promise.resolve();
      const poll = httpMock.expectOne('/pp/v1/stratos/jobs/job-7');
      poll.flush(
        { id: 'job-7', state: 'COMPLETE', startedAt: '2026-05-08T00:00:00Z', updatedAt: '2026-05-08T00:00:01Z' },
        { status: 200, statusText: 'OK' },
      );

      await expect(finalResult).resolves.toEqual({ success: true });
      httpMock.verify();
    });

    it('surfaces FAILED job as success:false with the error message', async () => {
      const svc = TestBed.inject(CsiModeService);
      const httpMock = TestBed.inject(HttpTestingController);

      const result$ = svc.createApplicationServiceBinding('si-1', 'cnsi-1', 'app-1', {});
      const finalResult = firstValueFrom(result$);

      const post = httpMock.expectOne('/pp/v1/cf/service_bindings/cnsi-1');
      post.flush(
        { id: 'job-9', state: 'PROCESSING', startedAt: '2026-05-08T00:00:00Z' },
        { status: 202, statusText: 'Accepted' },
      );

      await Promise.resolve();
      const poll = httpMock.expectOne('/pp/v1/stratos/jobs/job-9');
      poll.flush(
        {
          id: 'job-9',
          state: 'FAILED',
          startedAt: '2026-05-08T00:00:00Z',
          updatedAt: '2026-05-08T00:00:01Z',
          errors: [{ code: 'cf.service_binding.create', message: 'broker rejected the bind' }],
        },
        { status: 200, statusText: 'OK' },
      );

      await expect(finalResult).resolves.toEqual({
        success: false,
        message: 'cf.service_binding.create: broker rejected the bind',
      });
      httpMock.verify();
    });

    it('surfaces 4xx HTTP error (CF UnprocessableEntity) with the CF detail', async () => {
      const svc = TestBed.inject(CsiModeService);
      const httpMock = TestBed.inject(HttpTestingController);

      const result$ = svc.createApplicationServiceBinding('si-1', 'cnsi-1', 'app-1', {});
      const finalResult = firstValueFrom(result$);

      const post = httpMock.expectOne('/pp/v1/cf/service_bindings/cnsi-1');
      post.flush(
        { errors: [{ code: 10008, title: 'CF-UnprocessableEntity', detail: 'App is already bound' }] },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

      const out = await finalResult;
      expect(out.success).toBe(false);
      expect(out.message).toBe('App is already bound');
      httpMock.verify();
    });

    it('UNKNOWN (404 on poll, HA-degradation) resolves optimistically as success', async () => {
      const svc = TestBed.inject(CsiModeService);
      const httpMock = TestBed.inject(HttpTestingController);

      const result$ = svc.createApplicationServiceBinding('si-1', 'cnsi-1', 'app-1', {});
      const finalResult = firstValueFrom(result$);

      const post = httpMock.expectOne('/pp/v1/cf/service_bindings/cnsi-1');
      post.flush(
        { id: 'job-3', state: 'PROCESSING', startedAt: '2026-05-08T00:00:00Z' },
        { status: 202, statusText: 'Accepted' },
      );

      await Promise.resolve();
      const poll = httpMock.expectOne('/pp/v1/stratos/jobs/job-3');
      poll.flush({ errors: [{ message: 'unknown job' }] }, { status: 404, statusText: 'Not Found' });

      // writeWithJob returns {status:'UNKNOWN'} which our mapper treats as
      // success. Caller refetch reveals the truth — better than blocking the
      // stepper on a write that probably succeeded.
      await expect(finalResult).resolves.toEqual({ success: true });
      httpMock.verify();
    });
  });
});
