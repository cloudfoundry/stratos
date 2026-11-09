import { Routes } from '@angular/router';
import { tabTitle } from '@stratosui/core';
import { serviceOfferingTitle } from '../../route-titles';

import {
  AddServiceInstanceComponent,
} from '../../shared/components/add-service-instance/add-service-instance/add-service-instance.component';
import { ServiceBaseComponent } from './service-base/service-base.component';
import { ServiceCatalogPageComponent } from './service-catalog-page/service-catalog-page.component';
import { ServiceInstancesComponent } from './service-instances/service-instances.component';
import { ServicePlansComponent } from './service-plans/service-plans.component';
import { ServiceSummaryComponent } from './service-summary/service-summary.component';
import { ServiceTabsBaseComponent } from './service-tabs-base/service-tabs-base.component';

export const SERVICE_CATALOG_ROUTES: Routes = [
  {
    path: '',
    title: 'Services Marketplace',
    component: ServiceCatalogPageComponent,
  },
  {
    path: ':endpointId/:serviceId/create',
    title: serviceOfferingTitle('Create Service Instance'),
    component: AddServiceInstanceComponent,
  },
  {
    path: ':endpointId/:serviceId',
    title: serviceOfferingTitle(),
    component: ServiceBaseComponent,
    children: [
      {
        path: '',
        component: ServiceTabsBaseComponent,
        children: [
          {
            path: '',
            redirectTo: 'summary',
            pathMatch: 'full'
          },
          {
            path: 'summary',
            title: tabTitle('Summary'),
            component: ServiceSummaryComponent
          },
          {
            path: 'plans',
            title: tabTitle('Plans'),
            component: ServicePlansComponent
          },
          {
            path: 'instances',
            title: tabTitle('Instances'),
            component: ServiceInstancesComponent
          },
          {
            path: 'plans',
            title: tabTitle('Plans'),
            component: ServicePlansComponent
          }
        ]
      }
    ]
  }
];
