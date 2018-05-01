import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { AppState } from '../../../../../store/app-state';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { ServiceInstancesDataSource } from './service-instances-data-source';

@Injectable()
export class ServiceInstancesListConfigService
  extends CfServiceInstancesListConfigBase {

  constructor(store: Store<AppState>, servicesService: ServicesService, datePipe: DatePipe) {
    super(store, servicesService.cfGuid, datePipe);
    // Remove 'Service' column
    this.serviceInstanceColumns.splice(1, 1);
    this.getColumns = () => this.serviceInstanceColumns;
    this.dataSource = new ServiceInstancesDataSource(servicesService.cfGuid, servicesService.serviceGuid, store, this);
  }

  getDataSource = () => this.dataSource;
}
