import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../test-framework/cloud-foundry-organization.service.mock';
import { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import { CfSpacesListConfigService } from './cf-spaces-list-config.service';

describe('CfOrgsSpaceListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        ...generateTestCfEndpointServiceProvider(),
        CfSpacesListConfigService,
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
      ,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModules()

    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpacesListConfigService);
    expect(service).toBeTruthy();
  });
});
