import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { AppState } from '../../../../../store/app-state';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';

@Injectable()
export class CfSpaceUsersListConfigService extends CfUserListConfigService {
  constructor(
    store: Store<AppState>,
    cfSpaceService: CloudFoundrySpaceService,
    cfOrgService: CloudFoundryOrganizationService,
    cfUserService: CfUserService,
    router: Router,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    userPerms: CurrentUserPermissionsService,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory) {
    super(store, cfUserService, router, activeRouteCfOrgSpace, userPerms, paginationMonitorFactory, entityMonitorFactory, cfOrgService.org$, cfSpaceService.space$);
  }
}
