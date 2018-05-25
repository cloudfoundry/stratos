import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { ISubHeaderTabs } from '../../../shared/components/page-subheader/page-subheader.types';
import { AppState } from '../../../store/app-state';
import { ServicesService } from '../services.service';

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
      link: 'summary',
      label: 'Summary'
    },
    {
      link: 'instances',
      label: 'Instances'
    }
  ];
  breadcrumbs: IHeaderBreadcrumb[] = [
    {
      breadcrumbs: [{ value: 'Marketplace', routerLink: '/marketplace' }]
    }
  ];

  constructor(private servicesService: ServicesService, private store: Store<AppState>) {
    this.hasVisiblePlans$ = this.servicesService.getVisibleServicePlans().pipe(
      map(p => p.length > 0));
    this.toolTipText$ = this.hasVisiblePlans$.pipe(
      map(hasPlans => {
        if (hasPlans) {
          return 'Create service instance';
        } else {
          return 'Cannot create service instance (no public or visible plans exist for service)';
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
