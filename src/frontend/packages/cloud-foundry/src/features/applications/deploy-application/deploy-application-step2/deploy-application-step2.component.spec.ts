import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../../git/src/shared/github.helpers';
import { GitSCMService } from '../../../../../../git/src/shared/scm/scm.service';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationDeploySourceTypes } from '../deploy-application-steps.types';
import { GithubProjectExistsDirective } from '../github-project-exists.directive';
import { DeployApplicationFsComponent } from './deploy-application-fs/deploy-application-fs.component';
import { DeployApplicationStep2Component } from './deploy-application-step2.component';

describe('DeployApplicationStep2Component', () => {
  let component: DeployApplicationStep2Component;
  let fixture: ComponentFixture<DeployApplicationStep2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DeployApplicationStep2Component,
        DeployApplicationFsComponent,
        GithubProjectExistsDirective,
      ],
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        ApplicationDeploySourceTypes
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
