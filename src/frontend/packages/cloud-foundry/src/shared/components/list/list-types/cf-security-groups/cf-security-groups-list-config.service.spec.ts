import { inject, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { CfSecurityGroupsListConfigService } from './cf-security-groups-list-config.service';

describe('CfSecurityGroupsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSecurityGroupsListConfigService, ActiveRouteCfOrgSpace],
      imports: [...BaseTestModules]

    });
  });

  it('should be created', inject([CfSecurityGroupsListConfigService], (service: CfSecurityGroupsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
