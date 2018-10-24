
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { ActivatedRoute } from '@angular/router';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { ServicesService } from './services.service';
import { Provider } from '@angular/core';

export function servicesServiceFactory(
  store: Store<AppState>,
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
