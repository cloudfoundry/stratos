import { TestBed, inject } from '@angular/core/testing';

import { CfFeatureFlagsListConfigService } from './cf-feature-flags-list-config.service';

describe('CfFeatureFlagsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfFeatureFlagsListConfigService]
    });
  });

  it('should be created', inject([CfFeatureFlagsListConfigService], (service: CfFeatureFlagsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
