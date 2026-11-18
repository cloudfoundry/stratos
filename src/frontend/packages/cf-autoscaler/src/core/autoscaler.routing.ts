import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { tabTitle } from '@stratosui/core';
import { appTitle } from '@stratosui/cloud-foundry';

import { dynamicExtensionRoutesGuard } from '../../../core/src/core/extension/dynamic-extension-routes';
import { StratosActionType } from '../../../core/src/core/extension/extension-service';
import {
  PageNotFoundComponentComponent,
} from '../../../core/src/core/page-not-found-component/page-not-found-component.component';
import { AutoscalerBaseComponent } from '../features/autoscaler-base.component';
import {
  AutoscalerScaleHistoryPageComponent,
} from '../features/autoscaler-scale-history-page/autoscaler-scale-history-page.component';
import { EditAutoscalerPolicyComponent } from '../features/edit-autoscaler-policy/edit-autoscaler-policy.component';

const autoscalerRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':endpointId/:id',
        title: appTitle,
        component: AutoscalerBaseComponent,
        children: [
          {
            path: 'edit-autoscaler-policy',
            title: tabTitle('AutoScaler Policy'),
            component: EditAutoscalerPolicyComponent,
          },
          {
            path: 'app-autoscaler-metric-page',
            title: tabTitle('AutoScaler Metric Charts'),
            loadComponent: () => import('../features/autoscaler-metric-page/autoscaler-metric-page.component').then(m => m.AutoscalerMetricPageComponent),
          },
          {
            path: 'app-autoscaler-scale-history-page',
            title: tabTitle('AutoScaler Scaling Events'),
            component: AutoscalerScaleHistoryPageComponent,
          },
          {
            path: '**',
            component: PageNotFoundComponentComponent,
            canActivate: [dynamicExtensionRoutesGuard],
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
