import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../store/app-state';
import { ServicesService } from '../services.service';



export function servicesServiceFactory(
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory,
  paginationMonitorFactory: PaginationMonitorFactory
) {
  return new ServicesService(store, entityServiceFactory, activatedRoute, paginationMonitorFactory);
}


@Component({
  selector: 'app-service-base',
  templateUrl: './service-base.component.html',
  styleUrls: ['./service-base.component.scss'],
  providers: [
    {
      provide: ServicesService,
      useFactory: servicesServiceFactory,
      deps: [Store, ActivatedRoute, EntityServiceFactory, PaginationMonitorFactory]
    }
  ]
})
export class ServiceBaseComponent {

  constructor(private servicesService: ServicesService, private store: Store<AppState>) {
  }


}
