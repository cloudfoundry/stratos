import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  generateCfBaseTestModulesNoShared,
  CloudFoundryOrganizationServiceMock,
  CloudFoundrySpaceServiceMock
} from '@test-framework/cf';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CloudFoundryEndpointService } from '../../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { UserInviteService } from '../../../../../features/cf/user-invites/user-invite.service';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfSpaceUsersListConfigService } from "./cf-space-users-list-config.service";

describe('CfSpaceUsersListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(...generateCfBaseTestModulesNoShared()),
        CfSpaceUsersListConfigService,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        ActiveRouteCfOrgSpace,
        UserInviteService,
        CloudFoundryEndpointService,
        CfUserService,
        ...cfCurrentUserPermissionsService,
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpaceUsersListConfigService);
    expect(service).toBeTruthy();
  });
});
