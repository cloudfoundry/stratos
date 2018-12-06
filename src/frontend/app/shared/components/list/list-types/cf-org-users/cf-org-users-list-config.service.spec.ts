import { inject, TestBed } from '@angular/core/testing';

import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import {
  BaseTestModulesNoShared,
  generateTestCfUserServiceProvider,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationServiceMock } from '../../../../../test-framework/cloud-foundry-organization.service.mock';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
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
        EntityMonitorFactory
      ],
      imports: [...BaseTestModulesNoShared]
    });
  });

  it('should be created', inject([CfOrgUsersListConfigService], (service: CfOrgUsersListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
