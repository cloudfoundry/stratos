import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { CreateServiceInstanceHelperService, CreateServiceInstanceMode } from './create-service-instance-helper.service';
import { AppState } from '../../../store/app-state';
import { isMarketplaceMode, isAppServicesMode, isServicesWallMode } from '../services-helper';

@Injectable()
export class CreateServiceInstanceHelperServiceFactory {

  private serviceInstanceCache: {
    [key: string]: CreateServiceInstanceHelperService
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
    let mode;
    if (isMarketplaceMode(this.activatedRoute)) {
      mode = CreateServiceInstanceMode.MARKETPLACE_MODE;
    } else if (isAppServicesMode(this.activatedRoute)) {
      mode = CreateServiceInstanceMode.APP_SERVICES_MODE;
    } else if (isServicesWallMode(this.activatedRoute)) {
      mode = CreateServiceInstanceMode.SERVICES_WALL_MODE;
    }

    const key = `${cfGuid}-${serviceGuid}`;
    if (!this.serviceInstanceCache[key]) {
      const instance = new CreateServiceInstanceHelperService(
        this.store,
        serviceGuid,
        cfGuid,
        mode,
        this.entityServiceFactory,
        this.paginationMonitorFactory
      );
      this.serviceInstanceCache[key] = instance;
    }
    return this.serviceInstanceCache[key];
  }

}
