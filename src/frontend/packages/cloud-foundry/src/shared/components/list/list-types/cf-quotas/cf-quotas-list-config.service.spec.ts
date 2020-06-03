import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { CFBaseTestModules } from '../../../../../../test-framework/cf-test-helper';
import {
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfQuotasListConfigService } from './cf-quotas-list-config.service';

describe('CfQuotasListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...generateTestCfEndpointServiceProvider(), CfQuotasListConfigService, DatePipe],
      imports: [
        ...CFBaseTestModules
      ]

    });
  });

  it('should be created', inject([CfQuotasListConfigService], (service: CfQuotasListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
