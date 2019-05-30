import { inject, TestBed } from '@angular/core/testing';

import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceQuotasListConfigService } from './cf-space-quotas-list-config.service';

describe('CfOrgSpaceQuotasListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...generateTestCfEndpointServiceProvider(), CfOrgSpaceQuotasListConfigService],
      imports: [
        ...BaseTestModules
      ]

    });
  });

  it('should be created', inject([CfOrgSpaceQuotasListConfigService], (service: CfOrgSpaceQuotasListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
