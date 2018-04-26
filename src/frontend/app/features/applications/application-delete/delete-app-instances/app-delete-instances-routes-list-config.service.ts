import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  CfSpacesServiceInstancesListConfigService,
} from '../../../../shared/components/list/list-types/cf-spaces-service-instances/cf-spaces-service-instances-list-config.service';
import {
  TableCellServiceInstanceAppsAttachedComponent,
  // tslint:disable-next-line:max-line-length
} from '../../../../shared/components/list/list-types/cf-spaces-service-instances/table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import {
  TableCellServiceInstanceTagsComponent,
  // tslint:disable-next-line:max-line-length
} from '../../../../shared/components/list/list-types/cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import {
  TableCellServiceNameComponent,
  // tslint:disable-next-line:max-line-length
} from '../../../../shared/components/list/list-types/cf-spaces-service-instances/table-cell-service-name/table-cell-service-name.component';
import {
  TableCellServicePlanComponent,
  // tslint:disable-next-line:max-line-length
} from '../../../../shared/components/list/list-types/cf-spaces-service-instances/table-cell-service-plan/table-cell-service-plan.component';
import { AppState } from '../../../../store/app-state';
import { CloudFoundrySpaceService } from '../../../cloud-foundry/services/cloud-foundry-space.service';
import { ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { APIResource } from '../../../../store/types/api.types';
import { CfServiceInstance } from '../../../../store/types/service.types';
import {
  AppServiceBindingListConfigService
  // tslint:disable-next-line:max-line-length
} from '../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ApplicationService } from '../../application.service';

@Injectable()
export class AppDeleteServiceInstancesListConfigService extends AppServiceBindingListConfigService {
  hideRefresh: boolean;
  allowSelection: boolean;
  constructor(store: Store<AppState>, appService: ApplicationService, private _datePipe: DatePipe) {
    super(store, appService, _datePipe);

    this.getGlobalActions = () => null;
    this.getMultiActions = () => null;

    this.getSingleActions = () => null;
    this.getSingleActions = () => null;
    this.defaultView = 'table';
    this.viewType = ListViewTypes.TABLE_ONLY;
    this.allowSelection = true;
  }
}
