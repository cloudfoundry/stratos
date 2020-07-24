import { inject, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfBuildpacksListConfigService } from './cf-buildpacks-list-config.service';

describe('CfBuildpacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfBuildpacksListConfigService, ActiveRouteCfOrgSpace],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', inject([CfBuildpacksListConfigService], (service: CfBuildpacksListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
