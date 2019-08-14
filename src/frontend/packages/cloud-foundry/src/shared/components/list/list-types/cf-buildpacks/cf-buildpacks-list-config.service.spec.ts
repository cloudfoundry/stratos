import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { CfBuildpacksListConfigService } from './cf-buildpacks-list-config.service';

describe('CfBuildpacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfBuildpacksListConfigService, ActiveRouteCfOrgSpace],
      imports: [...BaseTestModules],
    });
  });

  it('should be created', inject([CfBuildpacksListConfigService], (service: CfBuildpacksListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
