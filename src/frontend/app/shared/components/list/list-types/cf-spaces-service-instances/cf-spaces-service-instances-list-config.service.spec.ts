import { TestBed, inject } from '@angular/core/testing';

import { CfSpacesServiceInstancesListConfigService } from './cf-spaces-service-instances-list-config.service';

describe('CfSpacesServiceInstancesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSpacesServiceInstancesListConfigService]
    });
  });

  it('should be created', inject([CfSpacesServiceInstancesListConfigService], (service: CfSpacesServiceInstancesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
