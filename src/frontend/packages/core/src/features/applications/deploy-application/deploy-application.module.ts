import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { CreateApplicationModule } from '../create-application/create-application.module';
import { DeployApplicationStep2Component } from './deploy-application-step2/deploy-application-step2.component';
import { DeployApplicationStep3Component } from './deploy-application-step3/deploy-application-step3.component';
import { DeployApplicationComponent } from './deploy-application.component';
import { GithubProjectExistsDirective } from './github-project-exists.directive';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step/deploy-application-options-step.component';
import { DeployApplicationStep21Component } from './deploy-application-step2-1/deploy-application-step2-1.component';
import { CommitListWrapperComponent } from './deploy-application-step2-1/commit-list-wrapper/commit-list-wrapper.component';
import { DeployApplicationFsComponent } from './deploy-application-step2/deploy-application-fs/deploy-application-fs.component';
import {
  DeployApplicationStepSourceUploadComponent
} from './deploy-application-step-source-upload/deploy-application-step-source-upload.component';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    CommonModule,
    CreateApplicationModule
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
