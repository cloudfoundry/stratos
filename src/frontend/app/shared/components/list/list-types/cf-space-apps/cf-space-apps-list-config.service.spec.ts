import { TestBed, inject } from '@angular/core/testing';

import { CfSpaceAppsListConfigService } from './cf-space-apps-list-config.service';

describe('CfSpaceAppsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSpaceAppsListConfigService]
    });
  });

  it('should be created', inject([CfSpaceAppsListConfigService], (service: CfSpaceAppsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
