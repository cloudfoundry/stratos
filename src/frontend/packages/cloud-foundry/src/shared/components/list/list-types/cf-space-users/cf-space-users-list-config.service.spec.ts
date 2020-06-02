import { HttpClient, HttpHandler } from '@angular/common/http';
import { inject, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../test-framework/cloud-foundry-organization.service.mock';
import { CloudFoundrySpaceServiceMock } from '../../../../../../test-framework/cloud-foundry-space.service.mock';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { UserInviteService } from '../../../../../features/cloud-foundry/user-invites/user-invite.service';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfSpaceUsersListConfigService } from './cf-space-users-list-config.service';


describe('CfSpaceUsersListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfSpaceUsersListConfigService,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        ActiveRouteCfOrgSpace,
        UserInviteService,
        HttpClient,
        HttpHandler,
        CloudFoundryEndpointService,
        CfUserService
      ],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', inject([CfSpaceUsersListConfigService], (service: CfSpaceUsersListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
