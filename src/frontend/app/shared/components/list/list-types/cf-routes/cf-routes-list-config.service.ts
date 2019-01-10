import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { publishReplay, refCount, switchMap } from 'rxjs/operators';

import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import {
  CfOrgSpaceDataService,
  createCfOrgSpaceFilterConfig,
  initCfOrgSpaceService,
} from '../../../../data-services/cf-org-space-service.service';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { IListConfig, IListMultiFilterConfig } from '../../list.component.types';
import { CfRoutesDataSource } from './cf-routes-data-source';
import { ListCfRoute } from './cf-routes-data-source-base';
import { CfRoutesListConfigBase } from './cf-routes-list-config-base';


@Injectable()
export class CfRoutesListConfigService extends CfRoutesListConfigBase implements IListConfig<APIResource> {
  private dataSource: CfRoutesDataSource;

  getDataSource: () => CfRoutesDataSource;
  getMultiFiltersConfigs: () => IListMultiFilterConfig[];

  constructor(
    store: Store<AppState>,
    confirmDialog: ConfirmationDialogService,
    cfService: CloudFoundryEndpointService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService,
    cfOrgSpaceService: CfOrgSpaceDataService,
  ) {
    const canEditRoute = (route$: Observable<APIResource<ListCfRoute>>) => {
      return route$.pipe(
        switchMap(route => currentUserPermissionsService.can(
          CurrentUserPermissions.APPLICATION_EDIT,
          route.entity.cfGuid,
          route.entity.space_guid
        )),
        publishReplay(1),
        refCount(),
      );
    };
    super(store, confirmDialog, cfService.cfGuid, datePipe, true, true, canEditRoute, observableOf(false));

    this.setupList(store, cfService, cfOrgSpaceService);
  }

  private setupList(
    store: Store<AppState>,
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
      createCfOrgSpaceFilterConfig('space', 'Space', cfOrgSpaceService.space),
    ];
    this.getMultiFiltersConfigs = () => multiFilterConfigs;
    initCfOrgSpaceService(store, cfOrgSpaceService,
      this.dataSource.action.entityKey,
      this.dataSource.action.paginationKey).subscribe();
    cfOrgSpaceService.cf.select.next(cfService.cfGuid);
  }
}
