import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { MetricsEndpointDetailsComponent } from './metrics-endpoint-details/metrics-endpoint-details.component';
import { MetricsRoutingModule } from './metrics.routing';
import { MetricsComponent } from './metrics/metrics.component';
import { MetricsService } from './services/metrics-service';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    MetricsRoutingModule,
  ],
  declarations: [MetricsComponent, MetricsEndpointDetailsComponent],
  providers: [
    MetricsService,
  ],
  entryComponents: [
    MetricsEndpointDetailsComponent,
  ]
})
export class MetricsModule { }
