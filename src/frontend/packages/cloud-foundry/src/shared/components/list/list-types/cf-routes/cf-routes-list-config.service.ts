import { DatePipe } from '@angular/common';
import { Injectable, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@stratosui/store';
import { Observable, of as observableOf } from 'rxjs';
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
import { CloudFoundryEndpointService } from '../../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfOrgSpaceDataService, createCfOrgSpaceFilterConfig } from '../../../../data-services/cf-org-space-service.service';
import { CfRoutesDataSource } from './cf-routes-data-source';
import { ListCfRoute } from './cf-routes-data-source-base';
import { CfRoutesListConfigBase } from './cf-routes-list-config-base';


@Injectable({
  providedIn: 'root'
})
export class CfRoutesListConfigService extends CfRoutesListConfigBase implements IListConfig<APIResource> {
  private dataSource!: CfRoutesDataSource;

  getDataSource!: () => CfRoutesDataSource;
  declare getMultiFiltersConfigs: () => IListMultiFilterConfig[];
  getInitialised!: () => Observable<boolean>;

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const confirmDialog = inject(ConfirmationDialogService);
    const cfService = inject(CloudFoundryEndpointService);
    const datePipe = inject(DatePipe);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const cfOrgSpaceService = inject(CfOrgSpaceDataService);

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

    // The framework consumes getInitialised as an Observable<boolean>.
    // Express loading-complete as a signal-side computed (true while
    // any list is unpopulated) and bridge to Observable here, in the
    // constructor's injection context — the arrow returned to the
    // framework just hands the captured Observable back.
    const initialised$ = toObservable(computed(() =>
      cfOrgSpaceService.cf.list().length === 0
        || cfOrgSpaceService.org.list().length === 0
        || cfOrgSpaceService.space.list().length === 0,
    )).pipe(startWith(true));
    this.getInitialised = () => initialised$;

    cfOrgSpaceService.cf.select.set(cfService.cfGuid);
  }
}
