import type { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, type Observable, of as observableOf } from 'rxjs';
import { map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import type {
  CurrentUserPermissionsService,
} from '@stratosui/core';
import type { ConfirmationDialogService } from '@stratosui/core';
import type {
  IListConfig,
  IListMultiFilterConfig,
} from '@stratosui/core';
import type { APIResource, GeneralEntityAppState } from '@stratosui/store';
import type { CloudFoundryEndpointService } from '../../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfOrgSpaceDataService, createCfOrgSpaceFilterConfig } from '../../../../data-services/cf-org-space-service.service';
import { CfRoutesDataSource } from './cf-routes-data-source';
import type { ListCfRoute } from './cf-routes-data-source-base';
import { CfRoutesListConfigBase } from './cf-routes-list-config-base';


@Injectable({
  providedIn: 'root'
})
export class CfRoutesListConfigService extends CfRoutesListConfigBase implements IListConfig<APIResource> {
  private dataSource!: CfRoutesDataSource;

  getDataSource!: () => CfRoutesDataSource;
  declare getMultiFiltersConfigs: () => IListMultiFilterConfig[];
  getInitialised!: () => Observable<boolean>;

  constructor(
    store: Store<GeneralEntityAppState>,
    confirmDialog: ConfirmationDialogService,
    cfService: CloudFoundryEndpointService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService,
    cfOrgSpaceService: CfOrgSpaceDataService,
  ) {
    const canEditRoute = (route$: Observable<APIResource<ListCfRoute>>) => {
      return route$.pipe(
        switchMap(route => currentUserPermissionsService.can(
          CfCurrentUserPermissions.APPLICATION_EDIT,
          route.entity.cfGuid,
          route.entity.space_guid
        )),
        publishReplay(1),
        refCount(),
      );
    };
    super(store, confirmDialog, cfService.cfGuid, datePipe, true, true, canEditRoute, observableOf(false));

    this.setupList(store, cfService, cfOrgSpaceService);

    this.text.maxedResults.filterLine = 'Please use the Organization filter';
  }

  private setupList(
    store: Store<GeneralEntityAppState>,
    cfService: CloudFoundryEndpointService,
    cfOrgSpaceService: CfOrgSpaceDataService) {
    this.dataSource = new CfRoutesDataSource(
      store,
      this as unknown as IListConfig<APIResource<ListCfRoute>>,
      cfService.cfGuid
    );
    this.getDataSource = () => this.dataSource;

    // Show drop down filters for org and space
    const multiFilterConfigs = [
      createCfOrgSpaceFilterConfig('org', 'Organization', cfOrgSpaceService.org),
    ];
    this.getMultiFiltersConfigs = () => multiFilterConfigs;

    this.getInitialised = () => combineLatest(
      cfOrgSpaceService.cf.list$,
      cfOrgSpaceService.org.list$,
      cfOrgSpaceService.space.list$,
    ).pipe(
      map(loading => !loading),
      startWith(true)
    );

    cfOrgSpaceService.cf.select.next(cfService.cfGuid);
  }
}
