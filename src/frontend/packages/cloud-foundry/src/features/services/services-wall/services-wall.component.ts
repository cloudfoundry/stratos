import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import type { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import type { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import {
  ServiceInstancesWallListConfigService,
} from '../../../../../cloud-foundry/src/shared/components/list/list-types/services-wall/service-instances-wall-list-config.service';
import { CfOrgSpaceDataService } from '../../../../../cloud-foundry/src/shared/data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../../../cloud-foundry/src/shared/data-services/cloud-foundry.service';
import { ListComponent, ListConfig, PageHeaderComponent, NoContentMessageComponent } from '@stratosui/core';
import { CSI_CANCEL_URL } from '../../../shared/components/add-service-instance/csi-mode.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CfUserPermissionDirective } from '../../../shared/directives/cf-user-permission/cf-user-permission.directive';

@Component({
  selector: 'app-services-wall',
  templateUrl: './services-wall.component.html',
  styleUrls: ['./services-wall.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: ServiceInstancesWallListConfigService
    },
    CfOrgSpaceDataService,
    DatePipe
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    ListComponent,
    NoContentMessageComponent,
    CfEndpointsMissingComponent,
    CfUserPermissionDirective
  ]
})
export class ServicesWallComponent {

  public haveConnectedCf$: Observable<boolean>;

  canCreateServiceInstance!: CfCurrentUserPermissions;
  initCfOrgSpaceService!: Subscription;
  cfIds$!: Observable<string[]>;
  location!: { [CSI_CANCEL_URL]: string, };

  constructor(
    public cloudFoundryService: CloudFoundryService,
    public store: Store,
    public cfOrgSpaceService: CfOrgSpaceDataService) {

    this.canCreateServiceInstance = CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE;
    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints
        .filter(endpoint => endpoint.connectionStatus === 'connected')
        .map(endpoint => endpoint.guid)
      )
    );

    this.haveConnectedCf$ = cloudFoundryService.connectedCFEndpoints$.pipe(
      map(endpoints => !!endpoints && endpoints.length > 0)
    );

    this.location = {
      [CSI_CANCEL_URL]: `/services`
    };
  }
}
