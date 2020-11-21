import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../git/src/shared/github.helpers';
import { GitSCMService } from '../../../../../git/src/shared/scm/scm.service';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CFAppState } from '../../../cf-app-state';
import { GithubProjectExistsDirective } from './github-project-exists.directive';


describe('GithubProjectExistsDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        CommonModule,
        CoreModule,
        SharedModule,
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ]
    });
  });
  it('should create an instance', inject([Store, GitSCMService], (store: Store<CFAppState>, scmService: GitSCMService) => {
    const directive = new GithubProjectExistsDirective(store, scmService);
    expect(directive).toBeTruthy();
  }));
});
