import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesWallService } from "./services-wall.service";
describe('ServicesWallService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServicesWallService,
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        provideZonelessChangeDetection(),
      ],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ServicesWallService);
    expect(service).toBeTruthy();
  });
});
