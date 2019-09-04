import { Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { PaginationMonitorFactory } from '../../../../core/src/shared/monitors/pagination-monitor.factory';
import { ServicesService } from './services.service';
import { CFEntityServiceFactory } from '../../cf-entity-service-factory.service';


export function servicesServiceFactory(
  store: Store<CFAppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: CFEntityServiceFactory,
  paginationMonitorFactory: PaginationMonitorFactory
) {
  return new ServicesService(store, entityServiceFactory, activatedRoute, paginationMonitorFactory);
}

export const servicesServiceFactoryProvider: Provider = {
  provide: ServicesService,
  useFactory: servicesServiceFactory,
  deps: [Store, ActivatedRoute, CFEntityServiceFactory, PaginationMonitorFactory]
};
