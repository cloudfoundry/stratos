import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { CfFeatureFlagsListConfigService } from './cf-feature-flags-list-config.service';

describe('CfFeatureFlagsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfFeatureFlagsListConfigService, ActiveRouteCfOrgSpace],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([CfFeatureFlagsListConfigService], (service: CfFeatureFlagsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
