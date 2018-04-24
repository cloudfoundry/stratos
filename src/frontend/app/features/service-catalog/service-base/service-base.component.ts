import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../../cloud-foundry/cf.helpers';
import { ServicesService } from '../services.service';
import { tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { selectEntity } from '../../../store/selectors/api.selectors';


function servicesServiceFactory(
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory,
  paginationMonitorFactory: PaginationMonitorFactory
) {
  const { id, cfId } = activatedRoute.snapshot.params;
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
export class ServiceBaseComponent implements OnInit {

  constructor(private servicesService: ServicesService, private store: Store<AppState>) {

  }

  ngOnInit() {
  }

  addServiceInstanceLink = () => [
    '/service-catalog',
    this.servicesService.cfGuid,
    this.servicesService.serviceGuid,
    'create'

  ]

}
