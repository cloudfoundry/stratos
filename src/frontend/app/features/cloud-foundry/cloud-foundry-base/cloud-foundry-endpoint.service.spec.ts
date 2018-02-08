import { TestBed, inject } from '@angular/core/testing';

import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';

describe('CloudFoundryEndpointService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CloudFoundryEndpointService]
    });
  });

  it('should be created', inject([CloudFoundryEndpointService], (service: CloudFoundryEndpointService) => {
    expect(service).toBeTruthy();
  }));
});
