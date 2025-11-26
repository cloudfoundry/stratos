import type { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { GeneralEntityAppState } from '@stratosui/store';
import { publishReplay, refCount } from 'rxjs/operators';
import type { CurrentUserPermissionsService, ConfirmationDialogService, IListConfig } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';

import type { CFAppState } from '../../../../../cf-app-state';
import type { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfRoutesListConfigBase, type ListCfRoute } from '../cf-routes/cf-routes-list-config-base';
import { CfSpaceRoutesDataSource } from './cf-space-routes-data-source';


@Injectable({
  providedIn: 'root'
})
export class CfSpaceRoutesListConfigService extends CfRoutesListConfigBase implements IListConfig<APIResource> {
  private dataSource!: CfSpaceRoutesDataSource;

  getDataSource!: () => CfSpaceRoutesDataSource;

  constructor(
    store: Store<GeneralEntityAppState>,
    confirmDialog: ConfirmationDialogService,
    cfSpaceService: CloudFoundrySpaceService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    const canEditAppsInSpace = currentUserPermissionsService.can(
      CfCurrentUserPermissions.APPLICATION_EDIT,
      cfSpaceService.cfGuid,
      cfSpaceService.spaceGuid
    ).pipe(
      publishReplay(1),
      refCount(),
    );
    super(store, confirmDialog, cfSpaceService.cfGuid, datePipe, false, true, () => canEditAppsInSpace, canEditAppsInSpace);

    this.setupList(store, cfSpaceService);
  }

  private setupList(
    store: Store<GeneralEntityAppState>,
    cfSpaceService: CloudFoundrySpaceService, ) {
    this.dataSource = new CfSpaceRoutesDataSource(
      store,
      this as unknown as IListConfig<APIResource<ListCfRoute>>,
      cfSpaceService.spaceGuid,
      cfSpaceService.cfGuid,
    );
    this.getDataSource = () => this.dataSource;
    this.enableTextFilter = false;

    const mappedAppsColumn = this.columns.find(column => column.columnId === CfRoutesListConfigBase.columnIdMappedApps);
    mappedAppsColumn.cellConfig = {
      breadcrumbs: 'space'
    };
  }
}
