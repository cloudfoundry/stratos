import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import {
  GithubCommitAuthorComponent,
} from '../../../../../../../../git/src/shared/components/github-commit-author/github-commit-author.component';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../../../../git/src/shared/github.helpers';
import { GitSCMService } from '../../../../../../../../git/src/shared/scm/scm.service';
import { ApplicationServiceMock } from '../../../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationService } from '../../../../application.service';
import { GitSCMTabComponent } from './gitscm-tab.component';

describe('GitSCMTabComponent', () => {
  let component: GitSCMTabComponent;
  let fixture: ComponentFixture<GitSCMTabComponent>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [GitSCMTabComponent, GithubCommitAuthorComponent],
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
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        DatePipe,
        GitSCMService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GitSCMTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
