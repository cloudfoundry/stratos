import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { CFBaseTestModules } from '../../../../../../test-framework/cf-test-helper';
import {
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfSpaceQuotasListConfigService } from './cf-space-quotas-list-config.service';

describe('CfSpaceQuotasListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...generateTestCfEndpointServiceProvider(), CfSpaceQuotasListConfigService, DatePipe],
      imports: [
        ...CFBaseTestModules
      ]

    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpaceQuotasListConfigService);
    expect(service).toBeTruthy();
  });
});
