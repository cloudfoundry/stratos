import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';
import { CreateEndpointComponent } from './create-endpoint/create-endpoint.component';
import { DynamicExtensionRoutes } from '../../core/extension/dynamic-extension-routes';
import { PageNotFoundComponentComponent } from '../../core/page-not-found-component/page-not-found-component.component';
import { StratosActionType } from '../../core/extension/extension-service';

const endpointsRoutes: Routes = [
  {
    path: '', component: EndpointsPageComponent,
    data: {
      extensionsActionsKey: StratosActionType.Endpoints
    }
  },
  { path: 'new', component: CreateEndpointComponent },
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
export class EndointsRoutingModule { }
