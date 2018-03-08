import { TestBed, inject } from '@angular/core/testing';

import { CfSecurityGroupsListConfigService } from './cf-security-groups-list-config.service';
import { BaseCF } from '../../../../../features/cloud-foundry/cf-page.types';
import { getBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CfSecurityGroupsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSecurityGroupsListConfigService, BaseCF],
      imports: [...getBaseTestModules]

    });
  });

  it('should be created', inject([CfSecurityGroupsListConfigService], (service: CfSecurityGroupsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
