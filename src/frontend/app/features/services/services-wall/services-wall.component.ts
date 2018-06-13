import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable ,  Subscription } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

import {
  ServiceInstancesWallListConfigService,
} from '../../../shared/components/list/list-types/services-wall/service-instances-wall-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { AppState } from '../../../store/app-state';
import { serviceInstancesSchemaKey } from '../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import { selectPaginationState } from '../../../store/selectors/pagination.selectors';
import { CfOrgSpaceDataService, initCfOrgSpaceService } from '../../../shared/data-services/cf-org-space-service.service';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';

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
  canCreateServiceInstance: CurrentUserPermissions;
  initCfOrgSpaceService: Subscription;
  cfIds$: Observable<string[]>;

  constructor(public cloudFoundryService: CloudFoundryService,
    public store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService) {

    this.canCreateServiceInstance =  CurrentUserPermissions.SERVICE_INSTANCE_CREATE;
    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints.map(endpoint => endpoint.guid))
    );

    this.initCfOrgSpaceService = initCfOrgSpaceService(this.store,
      this.cfOrgSpaceService,
      serviceInstancesSchemaKey,
      'all').subscribe();
  }

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.unsubscribe();
  }
}
