import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsComponent } from './metrics/metrics.component';
import { MetricsRoutingModule } from './metrics.routing';
import { MetricsService } from './services/metrics-service';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,    
    MetricsRoutingModule,
  ],
  declarations: [MetricsComponent],
  providers: [
    MetricsService,
  ]
})
export class MetricsModule { }
