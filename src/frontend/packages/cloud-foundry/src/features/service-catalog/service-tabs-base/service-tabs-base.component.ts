import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { CurrentUserPermissions } from '../../../../../core/src/core/current-user-permissions.config';
import { IPageSideNavTab } from '../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { ServicesService } from '../services.service';

@Component({
  selector: 'app-service-tabs-base',
  templateUrl: './service-tabs-base.component.html',
  styleUrls: ['./service-tabs-base.component.scss'],
})
export class ServiceTabsBaseComponent {
  canCreateServiceInstance: CurrentUserPermissions;
  toolTipText$: Observable<string>;
  hasVisiblePlans$: Observable<boolean>;
  servicesSubscription: Subscription;

  tabLinks: IPageSideNavTab[] = [
    {
      link: 'summary',
      label: 'Summary',
      icon: 'description'
    },
    {
      link: 'instances',
      label: 'Instances',
      icon: 'service_instance',
      iconFont: 'stratos-icons'
    },
    {
      link: 'plans',
      label: 'Plans',
      icon: 'service_plan',
      iconFont: 'stratos-icons'
    }
  ];

  breadcrumbs: IHeaderBreadcrumb[] = [
    {
      breadcrumbs: [{ value: 'Marketplace', routerLink: '/marketplace' }]
    }
  ];

  constructor(private servicesService: ServicesService, private store: Store<CFAppState>) {
    this.hasVisiblePlans$ = this.servicesService.servicePlans$.pipe(
      map(p => p.length > 0));
    this.canCreateServiceInstance = CurrentUserPermissions.SERVICE_INSTANCE_CREATE;
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

  isServiceSpaceScoped = () => this.servicesService.isSpaceScoped$;

  getServiceLabel = (): Observable<string> => {
    return this.servicesService.service$.pipe(
      map((s) => !!s.entity.extra ? JSON.parse(s.entity.extra).displayName : s.entity.label),
      publishReplay(1),
      refCount()
    );
  }

}
