import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { CreateServiceInstanceHelper } from './create-service-instance-helper.service';

@Injectable({
  providedIn: 'root'
})
export class CreateServiceInstanceHelperServiceFactory {
  private store = inject<Store<CFAppState>>(Store);
  private paginationMonitorFactory = inject(PaginationMonitorFactory);


  private serviceInstanceCache: {
    [key: string]: CreateServiceInstanceHelper
  } = {};

  create(
    cfGuid: string,
    serviceGuid: string,
  ) {
    // Validate inputs before creating helper instance
    if (!cfGuid) {
      throw new Error('CreateServiceInstanceHelperServiceFactory.create() requires a valid cfGuid');
    }
    if (!serviceGuid) {
      throw new Error('CreateServiceInstanceHelperServiceFactory.create() requires a valid serviceGuid');
    }

    const key = `${cfGuid}-${serviceGuid}`;
    if (!this.serviceInstanceCache[key]) {
      const instance = new CreateServiceInstanceHelper(
        this.store,
        serviceGuid,
        cfGuid,
        this.paginationMonitorFactory
      );
      this.serviceInstanceCache[key] = instance;
    }
    return this.serviceInstanceCache[key];
  }

}
