import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { CfSpaceQuotasListConfigService } from './cf-space-quotas-list-config.service';
import {
  generateTestCfEndpointServiceProvider
} from '../../../../../../../cloud-foundry/test-framework/cloud-foundry-endpoint-service.helper';
import { BaseTestModules } from '../../../../../../test-framework/core-test.helper';

describe('CfSpaceQuotasListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...generateTestCfEndpointServiceProvider(), CfSpaceQuotasListConfigService, DatePipe],
      imports: [
        ...BaseTestModules
      ]

    });
  });

  it('should be created', inject([CfSpaceQuotasListConfigService], (service: CfSpaceQuotasListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
