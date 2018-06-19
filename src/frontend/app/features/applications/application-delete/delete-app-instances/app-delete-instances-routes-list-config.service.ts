import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  AppServiceBindingListConfigService,
} from '../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { CurrentUserPermissionsService } from '../../../../core/current-user-permissions.service';

@Injectable()
export class AppDeleteServiceInstancesListConfigService extends AppServiceBindingListConfigService {
  hideRefresh: boolean;
  allowSelection: boolean;
  constructor(store: Store<AppState>,
    appService: ApplicationService,
    private _datePipe: DatePipe,
    private currentUserPermissionService: CurrentUserPermissionsService) {
    super(store, appService, _datePipe, currentUserPermissionService);

    this.getGlobalActions = () => null;
    this.getMultiActions = () => null;

    this.getSingleActions = () => null;
    this.getSingleActions = () => null;
    this.defaultView = 'table';
    this.viewType = ListViewTypes.TABLE_ONLY;
    this.allowSelection = true;
  }
}
