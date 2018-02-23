import { inject, TestBed } from '@angular/core/testing';

import {
  getBaseTestModules,
  generateTestCfEndpointServiceProvider
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgsListConfigService } from './cf-orgs-list-config.service';

describe('CfOrgsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfOrgsListConfigService, generateTestCfEndpointServiceProvider()],
      imports: [...getBaseTestModules]
    });
  });

  it('should be created', inject([CfOrgsListConfigService], (service: CfOrgsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
