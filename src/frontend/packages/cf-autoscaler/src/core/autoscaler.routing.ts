import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DynamicExtensionRoutes } from '../../../core/src/core/extension/dynamic-extension-routes';
import { StratosActionType } from '../../../core/src/core/extension/extension-service';
import {
  PageNotFoundComponentComponent,
} from '../../../core/src/core/page-not-found-component/page-not-found-component.component';
import { AutoscalerBaseComponent } from '../features/autoscaler-base.component';
import { AutoscalerMetricPageComponent } from '../features/autoscaler-metric-page/autoscaler-metric-page.component';
import {
  AutoscalerScaleHistoryPageComponent,
} from '../features/autoscaler-scale-history-page/autoscaler-scale-history-page.component';
import { EditAutoscalerPolicyComponent } from '../features/edit-autoscaler-policy/edit-autoscaler-policy.component';
import { EditAutoscalerCredentialComponent } from '../features/edit-autoscaler-credential/edit-autoscaler-credential.component';

const autoscalerRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':endpointId/:id',
        component: AutoscalerBaseComponent,
        children: [
          {
            path: 'edit-autoscaler-policy',
            component: EditAutoscalerPolicyComponent,
          },
          {
            path: 'edit-autoscaler-credential',
            component: EditAutoscalerCredentialComponent,
          },
          {
            path: 'app-autoscaler-metric-page',
            component: AutoscalerMetricPageComponent,
          },
          {
            path: 'app-autoscaler-scale-history-page',
            component: AutoscalerScaleHistoryPageComponent,
          },
          {
            path: '**',
            component: PageNotFoundComponentComponent,
            canActivate: [DynamicExtensionRoutes],
            data: {
              stratosRouteGroup: StratosActionType.Application
            }
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(autoscalerRoutes)
  ]
})
export class AutoscalerRoutingModule { }
