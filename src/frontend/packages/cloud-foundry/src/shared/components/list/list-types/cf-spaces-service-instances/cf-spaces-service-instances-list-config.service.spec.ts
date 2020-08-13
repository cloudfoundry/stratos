import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

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
      ],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', inject([CfSpacesServiceInstancesListConfigService], (service: CfSpacesServiceInstancesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
