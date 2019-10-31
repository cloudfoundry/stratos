import { inject, TestBed } from '@angular/core/testing';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CfSpacesListConfigService } from './cf-spaces-list-config.service';

describe('CfOrgsSpaceListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        CfSpacesListConfigService,
        CloudFoundryOrganizationService
      ],
      imports: generateCfBaseTestModules()

    });
  });

  it('should be created', inject([CfSpacesListConfigService], (service: CfSpacesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
