import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
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
});
