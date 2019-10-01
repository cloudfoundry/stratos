import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../../data-services/cf-org-space-service.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { ServiceInstancesWallListConfigService } from './service-instances-wall-list-config.service';

describe('ServiceInstancesWallListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServiceInstancesWallListConfigService,
        CfOrgSpaceDataService,
        DatePipe,
        ServiceActionHelperService
      ],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', inject([ServiceInstancesWallListConfigService], (service: ServiceInstancesWallListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
