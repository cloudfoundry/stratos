import { TestBed, inject } from '@angular/core/testing';

import { ServiceInstancesListConfigService } from './service-instances-list-config.service';

describe('ServiceInstancesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiceInstancesListConfigService]
    });
  });

  it('should be created', inject([ServiceInstancesListConfigService], (service: ServiceInstancesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
