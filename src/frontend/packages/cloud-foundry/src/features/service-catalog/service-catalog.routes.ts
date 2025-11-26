import type { Routes } from '@angular/router';

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
    component: ServiceCatalogPageComponent,
  },
  {
    path: ':endpointId/:serviceId/create',
    component: AddServiceInstanceComponent,
  },
  {
    path: ':endpointId/:serviceId',
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
            component: ServiceSummaryComponent
          },
          {
            path: 'plans',
            component: ServicePlansComponent
          },
          {
            path: 'instances',
            component: ServiceInstancesComponent
          },
          {
            path: 'plans',
            component: ServicePlansComponent
          }
        ]
      }
    ]
  }
];
