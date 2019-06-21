import { NgModule } from '@angular/core';

import { CoreModule } from '../../../../core/src/core/core.module';
import { CfEndpointDetailsComponent } from './cf-endpoint-details/cf-endpoint-details.component';

@NgModule({
  imports: [
    CoreModule
  ],
  declarations: [
    CfEndpointDetailsComponent
  ],
  exports: [
    CfEndpointDetailsComponent
  ],
  entryComponents: [
    CfEndpointDetailsComponent
  ]
})
export class CloudFoundryComponentsModule { }
