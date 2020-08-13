import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { serviceInstancesEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import {
  ServiceInstancesWallListConfigService,
} from '../../../../../cloud-foundry/src/shared/components/list/list-types/services-wall/service-instances-wall-list-config.service';
import {
  CfOrgSpaceDataService,
  initCfOrgSpaceService,
} from '../../../../../cloud-foundry/src/shared/data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../../../cloud-foundry/src/shared/data-services/cloud-foundry.service';
import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { CSI_CANCEL_URL } from '../../../shared/components/add-service-instance/csi-mode.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';

@Component({
  selector: 'app-services-wall',
  templateUrl: './services-wall.component.html',
  styleUrls: ['./services-wall.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: ServiceInstancesWallListConfigService
    },
    CfOrgSpaceDataService
  ]
})
export class ServicesWallComponent implements OnDestroy {

  public haveConnectedCf$: Observable<boolean>;

  canCreateServiceInstance: CfCurrentUserPermissions;
  initCfOrgSpaceService: Subscription;
  cfIds$: Observable<string[]>;
  location: { [CSI_CANCEL_URL]: string };

  constructor(
    public cloudFoundryService: CloudFoundryService,
    public store: Store<CFAppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService) {

    this.canCreateServiceInstance = CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE;
    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints
        .filter(endpoint => endpoint.connectionStatus === 'connected')
        .map(endpoint => endpoint.guid)
      )
    );

    this.initCfOrgSpaceService = initCfOrgSpaceService(this.store,
      this.cfOrgSpaceService,
      serviceInstancesEntityType,
      'all').subscribe();

    this.haveConnectedCf$ = cloudFoundryService.connectedCFEndpoints$.pipe(
      map(endpoints => !!endpoints && endpoints.length > 0)
    );

    this.location = {
      [CSI_CANCEL_URL]: `/services`
    }
  }

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.unsubscribe();
  }
}
