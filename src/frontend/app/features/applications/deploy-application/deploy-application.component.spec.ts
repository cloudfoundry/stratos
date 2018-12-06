import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../core/github.helpers';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { SharedModule } from '../../../shared/shared.module';
import { appReducers } from '../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
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
import { DeployApplicationComponent } from './deploy-application.component';

describe('DeployApplicationComponent', () => {
  let component: DeployApplicationComponent;
  let fixture: ComponentFixture<DeployApplicationComponent>;
  const initialState = { ...getInitialTestStoreState() };

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
        CommitListWrapperComponent
      ],
      providers: [
        CfOrgSpaceDataService,
        ApplicationEnvVarsHelper,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ],
      imports: [
        SharedModule,
        CoreModule,
        RouterTestingModule,
        CreateApplicationModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
        HttpClientModule,
        HttpClientTestingModule,
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
