import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

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
      ,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ServiceInstancesWallListConfigService);
    expect(service).toBeTruthy();
  });
});
