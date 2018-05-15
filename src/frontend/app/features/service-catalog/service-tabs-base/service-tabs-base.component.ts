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
import { ISubHeaderTabs } from '../../../shared/components/page-subheader/page-subheader.types';

@Component({
  selector: 'app-service-tabs-base',
  templateUrl: './service-tabs-base.component.html',
  styleUrls: ['./service-tabs-base.component.scss'],
})
export class ServiceTabsBaseComponent {
  toolTipText$: Observable<string>;
  hasVisiblePlans$: Observable<boolean>;
  servicesSubscription: Subscription;

  tabLinks: ISubHeaderTabs[] = [
    {
      link: 'instances',
      label: 'Instances'
    }
  ];

  constructor(private servicesService: ServicesService, private store: Store<AppState>) {
    this.hasVisiblePlans$ = this.servicesService.getVisibleServicePlans().pipe(
      map(p => p.length > 0));
    this.toolTipText$ = this.hasVisiblePlans$.pipe(
      map(hasPlans => {
        if (hasPlans) {
          return 'Create a New Service Instance';
        } else {
          return 'No public or visible plans exist for this service.';
        }
      }));

  }

  addServiceInstanceLink = () => [
    '/marketplace',
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

}
