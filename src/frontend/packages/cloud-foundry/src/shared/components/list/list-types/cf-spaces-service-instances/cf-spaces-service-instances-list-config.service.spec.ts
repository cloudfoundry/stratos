import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { getCfSpaceServiceMock } from '../../../../../../../core/test-framework/cloud-foundry-space.service.mock';
import { CfSpacesServiceInstancesListConfigService } from './cf-spaces-service-instances-list-config.service';

describe('CfSpacesServiceInstancesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfSpacesServiceInstancesListConfigService,
        getCfSpaceServiceMock,
        DatePipe
      ],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([CfSpacesServiceInstancesListConfigService], (service: CfSpacesServiceInstancesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
