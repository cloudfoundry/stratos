import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { CaaspSummaryComponent } from './caasp-summary/caasp-summary.component';
import { CaaspRoutingModule } from './caasp.routing';
import { CaaspComponent } from './caasp/caasp.component';
import { CaaspEndpointsListConfigService } from './list-types/caasp-endpoints/caasp-endpoints-list-config.service';
import { CaaspService } from './services/cassp-service';

import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    CaaspRoutingModule,
    NgxChartsModule,
  ],
  declarations: [CaaspComponent, CaaspSummaryComponent, ],
  providers: [
    CaaspService,
    CaaspEndpointsListConfigService,
    // EndpointsListConfigService
  ]
})
export class CaaspModule { }
