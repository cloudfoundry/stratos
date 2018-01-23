import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeployApplicationComponent } from './deploy-application.component';
import { SharedModule } from '../../../shared/shared.module';
import { CoreModule } from '../../../core/core.module';
import { CreateApplicationComponent } from '../create-application/create-application.component';
import { CreateApplicationModule } from '../create-application/create-application.module';
import { DeployApplicationStep2Component } from './deploy-application-step2/deploy-application-step2.component';
import { GithubProjectExistsDirective } from './github-project-exists.directive';
import { DeployApplicationStep3Component } from './deploy-application-step3/deploy-application-step3.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { SetCFDetails } from '../../../store/actions/create-applications-page.actions';
import { Observable } from 'rxjs/Observable';

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
  ],
  exports: [
    DeployApplicationComponent
  ]
})
export class DeployApplicationModule {

}
