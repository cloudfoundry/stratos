import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

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

  it('should be created', () => {
    const service = TestBed.inject(CfQuotasListConfigService);
    expect(service).toBeTruthy();
  });
});
