import { Routes } from '@angular/router';
import { endpointTitle } from '../../title-strategy';

import { MetricsComponent } from './metrics/metrics.component';

export const METRICS_ROUTES: Routes = [{
  path: ':metricsId',
  title: endpointTitle('metricsId'),
  component: MetricsComponent,
  pathMatch: 'full'
}];
