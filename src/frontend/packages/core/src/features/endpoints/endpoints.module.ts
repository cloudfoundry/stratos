import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { CredentialsAuthFormComponent } from './connect-endpoint-dialog/auth-forms/credentials-auth-form.component';
import { NoneAuthFormComponent } from './connect-endpoint-dialog/auth-forms/none-auth-form.component';
import { SSOAuthFormComponent } from './connect-endpoint-dialog/auth-forms/sso-auth-form.component';
import { ConnectEndpointDialogComponent } from './connect-endpoint-dialog/connect-endpoint-dialog.component';
import { CreateEndpointModule } from './create-endpoint/create-endpoint.module';
import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';
import { EndpointsRoutingModule } from './endpoints.routing';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    EndpointsRoutingModule,
    CreateEndpointModule
  ],
  declarations: [
    EndpointsPageComponent,
    ConnectEndpointDialogComponent,
    CredentialsAuthFormComponent,
    SSOAuthFormComponent,
    NoneAuthFormComponent,
  ],
  entryComponents: [
    ConnectEndpointDialogComponent,
    CredentialsAuthFormComponent,
    SSOAuthFormComponent,
    NoneAuthFormComponent
  ]
})
export class EndpointsModule { }
