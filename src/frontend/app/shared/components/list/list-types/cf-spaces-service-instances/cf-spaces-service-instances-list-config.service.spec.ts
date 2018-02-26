import { TestBed, inject } from '@angular/core/testing';

import { CfSpacesServiceInstancesListConfigService } from './cf-spaces-service-instances-list-config.service';
import { getBaseTestModules, getCfSpaceServiceMock } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CfSpacesServiceInstancesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSpacesServiceInstancesListConfigService, getCfSpaceServiceMock],
      imports: [...getBaseTestModules]
    });
  });

  it('should be created', inject([CfSpacesServiceInstancesListConfigService], (service: CfSpacesServiceInstancesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
