import { Routes } from '@angular/router';
import { serviceInstanceTitle } from '../../route-titles';

import {
  AddServiceInstanceBaseStepComponent,
} from '../../shared/components/add-service-instance/add-service-instance-base-step/add-service-instance-base-step.component';
import {
  AddServiceInstanceComponent,
} from '../../shared/components/add-service-instance/add-service-instance/add-service-instance.component';
import { DetachServiceInstanceComponent } from './detach-service-instance/detach-service-instance.component';
import { RouteServiceComponent } from './route-service/route-service.component';
import { ServiceInstanceSummaryComponent } from './service-instance-summary/service-instance-summary.component';
import { ServiceKeysComponent } from './service-keys/service-keys.component';
import { ServicesWallComponent } from './services-wall/services-wall.component';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    component: ServicesWallComponent,
  },
  {
    path: 'new',
    title: 'Choose Service Type',
    component: AddServiceInstanceBaseStepComponent
  },
  {
    path: 'new/:type',
    component: AddServiceInstanceComponent
  },
  {
    path: ':type/:endpointId/:serviceInstanceId/edit',
    title: serviceInstanceTitle('Edit'),
    component: AddServiceInstanceComponent
  },
  {
    path: ':type/:endpointId/:serviceInstanceId/detach',
    title: serviceInstanceTitle('Detach'),
    component: DetachServiceInstanceComponent
  },
  {
    path: ':type/:endpointId/:serviceInstanceId/keys',
    title: serviceInstanceTitle('Service Keys'),
    component: ServiceKeysComponent
  },
  {
    path: 'route-service/:endpointId/:routeGuid',
    component: RouteServiceComponent
  },
  // Bare per-instance detail/summary (read view, #5370). Listed AFTER the
  // literal `route-service/...` route so its `:type` segment cannot shadow it.
  {
    path: ':type/:endpointId/:serviceInstanceId',
    title: serviceInstanceTitle(),
    component: ServiceInstanceSummaryComponent
  }
];
