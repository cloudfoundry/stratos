import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfFeatureFlagsListConfigService } from './cf-feature-flags-list-config.service';

describe('CfFeatureFlagsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfFeatureFlagsListConfigService, ActiveRouteCfOrgSpace],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfFeatureFlagsListConfigService);
    expect(service).toBeTruthy();
  });
});
