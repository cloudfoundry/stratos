import { Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { EntityServiceFactory } from '../../../../core/src/core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../core/src/shared/monitors/pagination-monitor.factory';
import { ServicesService } from './services.service';


export function servicesServiceFactory(
  store: Store<CFAppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory,
  paginationMonitorFactory: PaginationMonitorFactory
) {
  return new ServicesService(store, entityServiceFactory, activatedRoute, paginationMonitorFactory);
}

export const servicesServiceFactoryProvider: Provider = {
  provide: ServicesService,
  useFactory: servicesServiceFactory,
  deps: [Store, ActivatedRoute, EntityServiceFactory, PaginationMonitorFactory]
};
