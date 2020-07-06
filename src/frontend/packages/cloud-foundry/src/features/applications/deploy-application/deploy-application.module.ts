import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { CloudFoundrySharedModule } from '../../../shared/cf-shared.module';
import { CreateApplicationModule } from '../create-application/create-application.module';
import {
  DeployApplicationOptionsStepComponent,
} from './deploy-application-options-step/deploy-application-options-step.component';
import {
  DeployApplicationStepSourceUploadComponent,
} from './deploy-application-step-source-upload/deploy-application-step-source-upload.component';
import { CommitListWrapperComponent } from './deploy-application-step2-1/commit-list-wrapper/commit-list-wrapper.component';
import { DeployApplicationStep21Component } from './deploy-application-step2-1/deploy-application-step2-1.component';
import {
  DeployApplicationFsComponent,
} from './deploy-application-step2/deploy-application-fs/deploy-application-fs.component';
import { DeployApplicationStep2Component } from './deploy-application-step2/deploy-application-step2.component';
import { DeployApplicationStep3Component } from './deploy-application-step3/deploy-application-step3.component';
import { DeployApplicationComponent } from './deploy-application.component';
import { GithubProjectExistsDirective } from './github-project-exists.directive';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    CommonModule,
    CreateApplicationModule,
    CloudFoundrySharedModule
  ],
  declarations: [
    DeployApplicationComponent,
    DeployApplicationStep2Component,
    GithubProjectExistsDirective,
    DeployApplicationStep3Component,
    DeployApplicationOptionsStepComponent,
    DeployApplicationStep21Component,
    CommitListWrapperComponent,
    DeployApplicationFsComponent,
    DeployApplicationStepSourceUploadComponent,
  ],
  exports: [
    DeployApplicationComponent
  ]
})
export class DeployApplicationModule { }
