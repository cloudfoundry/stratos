import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { IPageSideNavTab } from '../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { CSI_CANCEL_URL } from '../../../shared/components/add-service-instance/csi-mode.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { getServiceName } from '../services-helper';
import { ServicesService } from '../services.service';

@Component({
  selector: 'app-service-tabs-base',
  templateUrl: './service-tabs-base.component.html',
  styleUrls: ['./service-tabs-base.component.scss'],
})
export class ServiceTabsBaseComponent {
  canCreateServiceInstance: CfCurrentUserPermissions;
  toolTipText$: Observable<string>;
  hasVisiblePlans$: Observable<boolean>;
  servicesSubscription: Subscription;
  isServiceSpaceScoped$: Observable<any>;
  addServiceInstanceLink: string[];
  serviceLabel$: Observable<string>;

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
    this.canCreateServiceInstance = CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE;
    this.toolTipText$ = this.hasVisiblePlans$.pipe(
      map(hasPlans => {
        if (hasPlans) {
          return 'Create service instance';
        } else {
          return 'Cannot create service instance (no public or visible plans exist for service)';
        }
      }));
    this.isServiceSpaceScoped$ = this.servicesService.isSpaceScoped$.pipe(
      map(queryParams => ({
        ...queryParams,
        [CSI_CANCEL_URL]: `/marketplace/${this.servicesService.cfGuid}/${this.servicesService.serviceGuid}/instances`
      }))
    )
    this.addServiceInstanceLink = [
      '/marketplace',
      this.servicesService.cfGuid,
      this.servicesService.serviceGuid,
      'create'
    ]
    this.serviceLabel$ = this.servicesService.service$.pipe(
      map(getServiceName),
      publishReplay(1),
      refCount()
    )
  }

}
