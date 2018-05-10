import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
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
import { CfOrgSpaceDataService, InitCfOrgSpaceService } from '../../../shared/data-services/cf-org-space-service.service';
import { Subscription } from 'rxjs/Subscription';

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
export class ServicesWallComponent implements OnInit, OnDestroy {
  initCfOrgSpaceService: Subscription;
  cfIds$: Observable<string[]>;

  constructor(public cloudFoundryService: CloudFoundryService,
    public store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService) {

    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints.map(endpoint => endpoint.guid))
    );

    this.initCfOrgSpaceService = InitCfOrgSpaceService(this.store,
      this.cfOrgSpaceService,
      serviceInstancesSchemaKey,
      'all').subscribe();
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.unsubscribe();
  }
}
