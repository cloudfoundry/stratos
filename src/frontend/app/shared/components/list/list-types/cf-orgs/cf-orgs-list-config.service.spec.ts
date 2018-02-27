import { inject, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModules,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgsListConfigService } from './cf-orgs-list-config.service';

describe('CfOrgsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...generateTestCfEndpointServiceProvider(), CfOrgsListConfigService],
      imports: [
        ...getBaseTestModules
      ]

    });
  });

  it('should be created', inject([CfOrgsListConfigService], (service: CfOrgsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
