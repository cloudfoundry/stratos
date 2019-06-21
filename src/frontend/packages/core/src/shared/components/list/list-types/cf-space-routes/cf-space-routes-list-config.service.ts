
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { publishReplay, refCount } from 'rxjs/operators';

import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { IListConfig } from '../../list.component.types';
import { CfSpaceRoutesDataSource } from './cf-space-routes-data-source';
import { DatePipe } from '@angular/common';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { CfRoutesListConfigBase } from '../cf-routes/cf-routes-list-config-base';

@Injectable()
export class CfSpaceRoutesListConfigService extends CfRoutesListConfigBase implements IListConfig<APIResource> {
  private dataSource: CfSpaceRoutesDataSource;

  getDataSource: () => CfSpaceRoutesDataSource;

  constructor(
    store: Store<AppState>,
    confirmDialog: ConfirmationDialogService,
    cfSpaceService: CloudFoundrySpaceService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    const canEditAppsInSpace = currentUserPermissionsService.can(
      CurrentUserPermissions.APPLICATION_EDIT,
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
    store: Store<AppState>,
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
