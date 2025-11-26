import { DatePipe, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import type { Observable } from 'rxjs';

import {
  CurrentUserPermissionsService,
  ListComponent,
  ListConfig,
  PageSubNavComponent,
} from '@stratosui/core';

import {
  CfSpaceQuotasListConfigService,
} from '../../../../shared/components/list/list-types/cf-space-quotas/cf-space-quotas-list-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-organization-space-quotas',
  templateUrl: './cloud-foundry-organization-space-quotas.component.html',
  styleUrls: ['./cloud-foundry-organization-space-quotas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    RouterModule,
    PageSubNavComponent,
    ListComponent,
  ],
  providers: [
    DatePipe,
    {
      provide: ListConfig,
      useClass: CfSpaceQuotasListConfigService,
    },
  ],
})
export class CloudFoundryOrganizationSpaceQuotasComponent {
  public canAddQuota$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    const { cfGuid, orgGuid } = this.activeRouteCfOrgSpace;
    this.canAddQuota$ = currentUserPermissionsService.can(CfCurrentUserPermissions.SPACE_QUOTA_CREATE, cfGuid, orgGuid);
  }
}
