import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { publishReplay, refCount } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfRoutesListConfigBase } from '../cf-routes/cf-routes-list-config-base';
import { CfSpaceRoutesDataSource } from './cf-space-routes-data-source';


@Injectable()
export class CfSpaceRoutesListConfigService extends CfRoutesListConfigBase implements IListConfig<APIResource> {
  private dataSource: CfSpaceRoutesDataSource;

  getDataSource: () => CfSpaceRoutesDataSource;

  constructor(
    store: Store<CFAppState>,
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
