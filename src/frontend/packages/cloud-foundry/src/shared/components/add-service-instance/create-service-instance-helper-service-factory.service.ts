import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { CreateServiceInstanceHelper } from './create-service-instance-helper.service';
import { CFEntityServiceFactory } from '../../../cf-entity-service-factory.service';

@Injectable()
export class CreateServiceInstanceHelperServiceFactory {

  private serviceInstanceCache: {
    [key: string]: CreateServiceInstanceHelper
  } = {};
  constructor(
    private store: Store<CFAppState>,
    private entityServiceFactory: CFEntityServiceFactory,
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
