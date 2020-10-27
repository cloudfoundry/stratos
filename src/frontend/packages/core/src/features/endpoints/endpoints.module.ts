import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { BackupCheckboxCellComponent } from './backup-restore/backup-checkbox-cell/backup-checkbox-cell.component';
import { BackupConnectionCellComponent } from './backup-restore/backup-connection-cell/backup-connection-cell.component';
import { BackupEndpointsComponent } from './backup-restore/backup-endpoints/backup-endpoints.component';
import {
  BackupRestoreEndpointsComponent,
} from './backup-restore/backup-restore-endpoints/backup-restore-endpoints.component';
import { RestoreEndpointsComponent } from './backup-restore/restore-endpoints/restore-endpoints.component';
import { CredentialsAuthFormComponent } from './connect-endpoint-dialog/auth-forms/credentials-auth-form.component';
import { NoneAuthFormComponent } from './connect-endpoint-dialog/auth-forms/none-auth-form.component';
import { SSOAuthFormComponent } from './connect-endpoint-dialog/auth-forms/sso-auth-form.component';
import { ConnectEndpointDialogComponent } from './connect-endpoint-dialog/connect-endpoint-dialog.component';
import { CreateEndpointModule } from './create-endpoint/create-endpoint.module';
import { EditEndpointStepComponent } from './edit-endpoint/edit-endpoint-step/edit-endpoint-step.component';
import { EditEndpointComponent } from './edit-endpoint/edit-endpoint.component';
import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';
import { EndpointsRoutingModule } from './endpoints.routing';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    EndpointsRoutingModule,
    CreateEndpointModule,
  ],
  declarations: [
    EndpointsPageComponent,
    ConnectEndpointDialogComponent,
    CredentialsAuthFormComponent,
    SSOAuthFormComponent,
    NoneAuthFormComponent,
    EditEndpointComponent,
    EditEndpointStepComponent,
    BackupRestoreEndpointsComponent,
    BackupEndpointsComponent,
    RestoreEndpointsComponent,
    BackupCheckboxCellComponent,
    BackupConnectionCellComponent,
  ],
  entryComponents: [
    ConnectEndpointDialogComponent,
    CredentialsAuthFormComponent,
    SSOAuthFormComponent,
    NoneAuthFormComponent,
    BackupCheckboxCellComponent,
    BackupConnectionCellComponent
  ]
})
export class EndpointsModule { }
