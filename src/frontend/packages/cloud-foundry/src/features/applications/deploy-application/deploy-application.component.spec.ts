import { HttpBackend, HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../core/src/core/github.helpers';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/tab-nav.service';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySharedModule } from '../../../shared/cf-shared.module';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { ApplicationEnvVarsHelper } from '../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
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
import { ApplicationDeploySourceTypes } from './deploy-application-steps.types';
import { DeployApplicationComponent } from './deploy-application.component';
import { GithubProjectExistsDirective } from './github-project-exists.directive';

describe('DeployApplicationComponent', () => {
  let component: DeployApplicationComponent;
  let fixture: ComponentFixture<DeployApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DeployApplicationComponent,
        DeployApplicationStep2Component,
        DeployApplicationStep21Component,
        DeployApplicationStep3Component,
        DeployApplicationOptionsStepComponent,
        DeployApplicationStepSourceUploadComponent,
        DeployApplicationFsComponent,
        CommitListWrapperComponent,
        GithubProjectExistsDirective,
      ],
      providers: [
        CfOrgSpaceDataService,
        ApplicationEnvVarsHelper,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        HttpClient,
        {
          provide: HttpBackend,
          useClass: HttpTestingController
        },
        TabNavService,
        ApplicationDeploySourceTypes
      ],
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        CoreModule,
        RouterTestingModule,
        CreateApplicationModule,
        NoopAnimationsModule,
        HttpClientModule,
        HttpClientTestingModule,
        HttpClientModule,
        CloudFoundrySharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
