import { TestBed, inject } from '@angular/core/testing';

import { CfAppMapRoutesListConfigService } from './cf-app-map-routes-list-config.service';

describe('CfAppMapRoutesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfAppMapRoutesListConfigService]
    });
  });

  it('should be created', inject([CfAppMapRoutesListConfigService], (service: CfAppMapRoutesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
