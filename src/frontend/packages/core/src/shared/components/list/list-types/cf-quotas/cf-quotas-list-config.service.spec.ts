import { inject, TestBed } from '@angular/core/testing';

import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfQuotasListConfigService } from './cf-quotas-list-config.service';

describe('CfQuotasListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...generateTestCfEndpointServiceProvider(), CfQuotasListConfigService],
      imports: [
        ...BaseTestModules
      ]

    });
  });

  it('should be created', inject([CfQuotasListConfigService], (service: CfQuotasListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
