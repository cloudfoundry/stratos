import type { Routes } from '@angular/router';

import { MetricsComponent } from './metrics/metrics.component';

export const METRICS_ROUTES: Routes = [{
  path: ':metricsId',
  component: MetricsComponent,
  pathMatch: 'full'
}];
