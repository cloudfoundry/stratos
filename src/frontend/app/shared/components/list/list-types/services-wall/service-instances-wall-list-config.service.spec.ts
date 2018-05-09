import { TestBed, inject } from '@angular/core/testing';

import { ServiceInstancesWallListConfigService } from './service-instances-wall-list-config.service';

describe('ServiceInstancesWallListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiceInstancesWallListConfigService]
    });
  });

  it('should be created', inject([ServiceInstancesWallListConfigService], (service: ServiceInstancesWallListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
