import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { CurrentUserPermissions } from '../../../../core/current-user-permissions.config';
import {
  CfQuotaCardComponent,
} from '../../../../shared/components/list/list-types/cf-quotas/cf-quota-card/cf-quota-card.component';
import {
  CfQuotasListConfigService,
} from '../../../../shared/components/list/list-types/cf-quotas/cf-quotas-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CurrentUserPermissionsService } from './../../../../core/current-user-permissions.service';

@Component({
  selector: 'app-cloud-foundry-quotas',
  templateUrl: './cloud-foundry-quotas.component.html',
  styleUrls: ['./cloud-foundry-quotas.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfQuotasListConfigService
    }
  ]
})
export class CloudFoundryQuotasComponent {
  public canAddQuota$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    this.canAddQuota$ = currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);
  }
  cardComponent = CfQuotaCardComponent;
}
