import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { ServicesWallService } from './services-wall.service';

describe('ServicesWallService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServicesWallService,
        EntityServiceFactory,
        PaginationMonitorFactory],
      imports: [BaseTestModules]
    });
  });

  it('should be created', inject([ServicesWallService], (service: ServicesWallService) => {
    expect(service).toBeTruthy();
  }));
});
