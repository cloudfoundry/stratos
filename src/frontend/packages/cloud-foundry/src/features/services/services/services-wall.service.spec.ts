import { inject, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesWallService } from './services-wall.service';

describe('ServicesWallService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServicesWallService,
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', inject([ServicesWallService], (service: ServicesWallService) => {
    expect(service).toBeTruthy();
  }));
});
