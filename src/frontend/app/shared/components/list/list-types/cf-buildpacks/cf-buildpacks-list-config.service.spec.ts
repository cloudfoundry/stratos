import { TestBed, inject } from '@angular/core/testing';

import { CfBuildpacksListConfigService } from './cf-buildpacks-list-config.service';
import { BaseCF } from '../../../../../features/cloud-foundry/cf-page.types';

import {
  getBaseTestModules,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CfBuildpacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfBuildpacksListConfigService, BaseCF],
      imports: [...getBaseTestModules],
    });
  });

  it('should be created', inject([CfBuildpacksListConfigService], (service: CfBuildpacksListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
