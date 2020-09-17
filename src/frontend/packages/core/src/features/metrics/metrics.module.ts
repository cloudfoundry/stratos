import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { stratosEntityCatalog } from '@stratosui/store';

import { CoreModule } from '../../core/core.module';
import { BaseEndpointAuth } from '../../core/endpoint-auth';
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
export class MetricsModule {

  constructor() {
    // Register the endpoint details component
    // This is done here to break circular dependency - since the registration is done in the store package
    // But the core package defines the component for the endpoint card details
    stratosEntityCatalog.metricsEndpoint.setListComponent(MetricsEndpointDetailsComponent);
    stratosEntityCatalog.metricsEndpoint.setAuthTypes([BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.None]);
  }
}
