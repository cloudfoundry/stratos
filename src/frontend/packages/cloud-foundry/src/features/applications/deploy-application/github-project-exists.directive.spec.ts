import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../core/src/core/github.helpers';
import { GitSCMService } from '../../../../../core/src/shared/data-services/scm/scm.service';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { createBasicStoreModule } from '../../../../../core/test-framework/store-test-helper';
import { CFAppState } from '../../../cf-app-state';
import { GithubProjectExistsDirective } from './github-project-exists.directive';


describe('GithubProjectExistsDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
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
