
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { ServicesService } from './services.service';
import { Provider } from '@angular/core';
import { CFAppState } from '../../../../store/src/app-state';

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
