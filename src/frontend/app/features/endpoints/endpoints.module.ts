import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

import { EndointsRoutingModule } from './endpoints.routing';
import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';
import { CreateEndpointModule } from './create-endpoint/create-endpoint.module';
import { ConnectEndpointDialogComponent } from './connect-endpoint-dialog/connect-endpoint-dialog.component';
import { CredentialsAuthFormComponent } from './connect-endpoint-dialog/auth-forms/credentials-auth-form.component';
import { SSOAuthFormComponent } from './connect-endpoint-dialog/auth-forms/sso-auth-form.component';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    EndointsRoutingModule,
    CreateEndpointModule
  ],
  declarations: [
    EndpointsPageComponent,
    ConnectEndpointDialogComponent,
    CredentialsAuthFormComponent,
    SSOAuthFormComponent
  ],
  entryComponents: [
    ConnectEndpointDialogComponent,
    CredentialsAuthFormComponent,
    SSOAuthFormComponent
  ]
})
export class EndpointsModule { }
