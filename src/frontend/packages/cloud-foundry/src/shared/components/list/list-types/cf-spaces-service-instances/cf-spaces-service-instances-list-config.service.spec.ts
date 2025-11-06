import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { getCfSpaceServiceMock } from '../../../../../../test-framework/cloud-foundry-space.service.mock';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { CfSpacesServiceInstancesListConfigService } from './cf-spaces-service-instances-list-config.service';

describe('CfSpacesServiceInstancesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        CfSpacesServiceInstancesListConfigService,
        getCfSpaceServiceMock,
        DatePipe,
        ServiceActionHelperService
      ,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpacesServiceInstancesListConfigService);
    expect(service).toBeTruthy();
  });
});
