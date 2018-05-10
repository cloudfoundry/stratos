import { TestBed, inject } from '@angular/core/testing';

import { CfUserListConfigService } from './cf-user-list-config.service';
import {
  getBaseProviders,
  BaseTestModules,
  generateTestCfEndpointServiceProvider
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CfUserListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules
      ],
      providers: [CfUserListConfigService, ...generateTestCfEndpointServiceProvider()]
    });
  });

  it('should be created', inject([CfUserListConfigService], (service: CfUserListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
