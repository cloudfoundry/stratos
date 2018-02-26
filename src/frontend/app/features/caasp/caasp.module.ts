import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaaspComponent } from './caasp/caasp.component';
import { CaaspSummaryComponent } from './caasp-summary/caasp-summary.component';
import { CaaspRoutingModule } from './caasp.routing';
import { CaaspService } from './services/cassp-service';
import { CaaspEndpointsListConfigService } from '../../shared/components/list/list-types/caasp-endpoints/caasp-endpoints-list-config.service';
import { EndpointsListConfigService } from '../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { SharedModule } from '../../shared/shared.module';
import { CoreModule } from '../../core/core.module';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,    
    CaaspRoutingModule,
  ],
  declarations: [CaaspComponent, CaaspSummaryComponent, ],
  providers: [
    CaaspService,
    CaaspEndpointsListConfigService,
    EndpointsListConfigService
  ]
  
})
export class CaaspModule { }
