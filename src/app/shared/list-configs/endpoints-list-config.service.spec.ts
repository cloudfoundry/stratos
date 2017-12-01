import { TestBed, inject } from '@angular/core/testing';

import { EndpointsListConfigService } from './endpoints-list-config.service';

describe('EndpointsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndpointsListConfigService]
    });
  });

  it('should be created', inject([EndpointsListConfigService], (service: EndpointsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
