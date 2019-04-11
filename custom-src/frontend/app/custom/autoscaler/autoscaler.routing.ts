import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DynamicExtensionRoutes } from '../../core/extension/dynamic-extension-routes';
import { StratosActionType } from '../../core/extension/extension-service';
import { PageNotFoundComponentComponent } from '../../core/page-not-found-component/page-not-found-component.component';
import { AutoscalerBaseComponent } from './autoscaler-base.component';
import { EditAutoscalerPolicyComponent } from './edit-autoscaler-policy/edit-autoscaler-policy.component';
import { AutoscalerMetricPageComponent } from './autoscaler-metric-page/autoscaler-metric-page.component';
import { AutoscalerScaleHistoryPageComponent } from './autoscaler-scale-history-page/autoscaler-scale-history-page.component';

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
