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
  CfQuotasListConfigService,
} from '../../../../shared/components/list/list-types/cf-quotas/cf-quotas-list-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-quotas',
  templateUrl: './cloud-foundry-quotas.component.html',
  styleUrls: ['./cloud-foundry-quotas.component.scss'],
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
      useClass: CfQuotasListConfigService,
    },
  ],
})
export class CloudFoundryQuotasComponent {
  public canAddQuota$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    this.canAddQuota$ = currentUserPermissionsService.can(CfCurrentUserPermissions.QUOTA_CREATE, this.cfEndpointService.cfGuid);
  }
}
