import { inject, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../test-framework/cloud-foundry-space.service.mock';
import { CfSpaceUsersListConfigService } from './cf-space-users-list-config.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';

describe('CfSpaceUsersListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfSpaceUsersListConfigService,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        ActiveRouteCfOrgSpace

      ],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([CfSpaceUsersListConfigService], (service: CfSpaceUsersListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
