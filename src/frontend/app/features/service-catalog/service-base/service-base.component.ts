import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../store/app-state';
import { ServicesService } from '../services.service';
import { map, tap, first, publishReplay, refCount } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';


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
export class ServiceBaseComponent implements OnInit, OnDestroy {
  servicesSubscription: Subscription;

  constructor(private servicesService: ServicesService, private store: Store<AppState>) {
    this.servicesSubscription = this.servicesService.service$.subscribe();
  }

  ngOnInit() {
  }

  addServiceInstanceLink = () => [
    '/service-catalog',
    this.servicesService.cfGuid,
    this.servicesService.serviceGuid,
    'create'

  ]

  getServiceLabel = (): Observable<string> => {
    return this.servicesService.service$.pipe(
      map((s) => !!s.entity.extra ? JSON.parse(s.entity.extra).displayName : s.entity.label),
      publishReplay(1),
      refCount()
    );
  }
  ngOnDestroy(): void {
    this.servicesSubscription.unsubscribe();
  }

}
