import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { serviceInstancesEntityType } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import {
  ServiceInstancesWallListConfigService,
} from '../../../shared/components/list/list-types/services-wall/service-instances-wall-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { CfOrgSpaceDataService, initCfOrgSpaceService } from '../../../shared/data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';

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

  canCreateServiceInstance: CurrentUserPermissions;
  initCfOrgSpaceService: Subscription;
  cfIds$: Observable<string[]>;

  constructor(
    public cloudFoundryService: CloudFoundryService,
    public store: Store<CFAppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService) {

    this.canCreateServiceInstance = CurrentUserPermissions.SERVICE_INSTANCE_CREATE;
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
  }

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.unsubscribe();
  }
}
