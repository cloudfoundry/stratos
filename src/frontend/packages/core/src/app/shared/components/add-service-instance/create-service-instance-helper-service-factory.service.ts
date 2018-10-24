import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';
import { CreateServiceInstanceHelper } from './create-service-instance-helper.service';
import { AppState } from '../../../store/app-state';
import { isMarketplaceMode, isAppServicesMode, isServicesWallMode } from '../../../features/service-catalog/services-helper';

@Injectable()
export class CreateServiceInstanceHelperServiceFactory {

  private serviceInstanceCache: {
    [key: string]: CreateServiceInstanceHelper
  } = {};
  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) { }

  create<T>(
    cfGuid: string,
    serviceGuid: string,
  ) {
    const key = `${cfGuid}-${serviceGuid}`;
    if (!this.serviceInstanceCache[key]) {
      const instance = new CreateServiceInstanceHelper(
        this.store,
        serviceGuid,
        cfGuid,
        this.entityServiceFactory,
        this.paginationMonitorFactory
      );
      this.serviceInstanceCache[key] = instance;
    }
    return this.serviceInstanceCache[key];
  }

}
