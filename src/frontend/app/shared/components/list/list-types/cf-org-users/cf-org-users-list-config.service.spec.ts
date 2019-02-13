import { HttpClient, HttpHandler } from '@angular/common/http';
import { inject, TestBed } from '@angular/core/testing';

import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { UserInviteService } from '../../../../../features/cloud-foundry/user-invites/user-invite.service';
import {
  BaseTestModulesNoShared,
  generateTestCfUserServiceProvider,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationServiceMock } from '../../../../../test-framework/cloud-foundry-organization.service.mock';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { CfOrgUsersListConfigService } from './cf-org-users-list-config.service';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';

describe('CfOrgUsersListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfOrgUsersListConfigService,
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        generateTestCfUserServiceProvider(),
        PaginationMonitorFactory,
        ActiveRouteCfOrgSpace,
        EntityMonitorFactory,
        UserInviteService,
        HttpClient,
        HttpHandler,
        CloudFoundryEndpointService,
        ConfirmationDialogService
      ],
      imports: [...BaseTestModulesNoShared]
    });
  });

  it('should be created', inject([CfOrgUsersListConfigService], (service: CfOrgUsersListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
