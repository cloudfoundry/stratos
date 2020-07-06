import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import {
  IListConfig,
  IListMultiFilterConfig,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import {
  CfOrgSpaceDataService,
  createCfOrgSpaceFilterConfig,
  initCfOrgSpaceService,
} from '../../../../data-services/cf-org-space-service.service';
import { CfRoutesDataSource } from './cf-routes-data-source';
import { ListCfRoute } from './cf-routes-data-source-base';
import { CfRoutesListConfigBase } from './cf-routes-list-config-base';


@Injectable()
export class CfRoutesListConfigService extends CfRoutesListConfigBase implements IListConfig<APIResource> {
  private dataSource: CfRoutesDataSource;

  getDataSource: () => CfRoutesDataSource;
  getMultiFiltersConfigs: () => IListMultiFilterConfig[];
  getInitialised: () => Observable<boolean>;

  constructor(
    store: Store<CFAppState>,
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
    store: Store<CFAppState>,
    cfService: CloudFoundryEndpointService,
    cfOrgSpaceService: CfOrgSpaceDataService) {
    this.dataSource = new CfRoutesDataSource(
      store,
      this,
      cfService.cfGuid
    );
    this.getDataSource = () => this.dataSource;

    // Show drop down filters for org and space
    const multiFilterConfigs = [
      createCfOrgSpaceFilterConfig('org', 'Organization', cfOrgSpaceService.org),
    ];
    this.getMultiFiltersConfigs = () => multiFilterConfigs;
    initCfOrgSpaceService(store, cfOrgSpaceService,
      this.dataSource.masterAction.entityType,
      this.dataSource.masterAction.paginationKey).subscribe();
    cfOrgSpaceService.cf.select.next(cfService.cfGuid);

    this.getInitialised = () => combineLatest(
      cfOrgSpaceService.cf.list$,
      cfOrgSpaceService.org.list$,
      cfOrgSpaceService.space.list$,
    ).pipe(
      map(loading => !loading),
      startWith(true)
    );
  }
}
