import { DatePipe } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { publishReplay, refCount } from 'rxjs/operators';
import { CurrentUserPermissionsService, ConfirmationDialogService, IListConfig } from '@stratosui/core';
import { APIResource, Store } from '@stratosui/store';

import { CFAppState } from '../../../../../cf-app-state';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfRoutesListConfigBase } from '../cf-routes/cf-routes-list-config-base';
import { CfSpaceRoutesDataSource } from './cf-space-routes-data-source';


@Injectable({
  providedIn: 'root'
})
export class CfSpaceRoutesListConfigService extends CfRoutesListConfigBase implements IListConfig<APIResource> {
  private dataSource!: CfSpaceRoutesDataSource;

  getDataSource!: () => CfSpaceRoutesDataSource;

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const confirmDialog = inject(ConfirmationDialogService);
    const cfSpaceService = inject(CloudFoundrySpaceService);
    const datePipe = inject(DatePipe);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);

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
    store: Store<CFAppState>,
    cfSpaceService: CloudFoundrySpaceService, ) {
    this.dataSource = new CfSpaceRoutesDataSource(
      store,
      this,
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
