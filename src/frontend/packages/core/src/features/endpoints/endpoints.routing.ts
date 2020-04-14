import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DynamicExtensionRoutes } from '../../core/extension/dynamic-extension-routes';
import { StratosActionType } from '../../core/extension/extension-service';
import { PageNotFoundComponentComponent } from '../../core/page-not-found-component/page-not-found-component.component';
import {
  CreateEndpointBaseStepComponent,
} from './create-endpoint/create-endpoint-base-step/create-endpoint-base-step.component';
import { CreateEndpointComponent } from './create-endpoint/create-endpoint.component';
import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';
import { EditEndpointComponent } from './edit-endpoint/edit-endpoint.component';

const endpointsRoutes: Routes = [
  {
    path: '', component: EndpointsPageComponent,
    data: {
      extensionsActionsKey: StratosActionType.Endpoints
    }
  },
  {
    path: 'new',
    component: CreateEndpointBaseStepComponent
  },
  {
    path: 'new/:type/:subtype',
    component: CreateEndpointComponent
  },
  {
    path: 'new/:type',
    component: CreateEndpointComponent
  },
  {
    path: 'edit/:id',
    component: EditEndpointComponent
  },
  {
    path: '**',
    component: PageNotFoundComponentComponent,
    canActivate: [DynamicExtensionRoutes],
    data: {
      stratosRouteGroup: StratosActionType.Endpoints
    }
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(endpointsRoutes),
  ]
})
export class EndpointsRoutingModule { }
