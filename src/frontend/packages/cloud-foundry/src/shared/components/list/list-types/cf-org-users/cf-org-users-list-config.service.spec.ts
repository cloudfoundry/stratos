import { HttpClient, HttpHandler } from '@angular/common/http';
import { inject, TestBed } from '@angular/core/testing';

import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import {
  generateCfBaseTestModulesNoShared,
  generateTestCfUserServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../test-framework/cloud-foundry-organization.service.mock';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { UserInviteService } from '../../../../../features/cloud-foundry/user-invites/user-invite.service';
import { CfOrgUsersListConfigService } from './cf-org-users-list-config.service';

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
      imports: generateCfBaseTestModulesNoShared()
    });
  });

  it('should be created', inject([CfOrgUsersListConfigService], (service: CfOrgUsersListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
