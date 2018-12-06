import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MetricsComponent } from './metrics/metrics.component';

const metrics: Routes = [{
  path: ':metricsId',
  component: MetricsComponent,
  pathMatch: 'full'
}];

@NgModule({
  imports: [RouterModule.forChild(metrics)]
})
export class MetricsRoutingModule { }
