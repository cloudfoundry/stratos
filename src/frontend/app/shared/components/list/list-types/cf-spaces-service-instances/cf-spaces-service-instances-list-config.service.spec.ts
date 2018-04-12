import { TestBed, inject } from '@angular/core/testing';

import { CfSpacesServiceInstancesListConfigService } from './cf-spaces-service-instances-list-config.service';
import { BaseTestModules, getCfSpaceServiceMock } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DatePipe } from '@angular/common';

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
