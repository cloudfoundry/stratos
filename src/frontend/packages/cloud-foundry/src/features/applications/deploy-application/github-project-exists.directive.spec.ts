import { TestBed } from '@angular/core/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';

import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../git/src/shared/github.helpers';
import { GitSCMService } from '../../../../../git/src/shared/scm/scm.service';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CFAppState } from '../../../cf-app-state';
import { GithubProjectExistsDirective } from './github-project-exists.directive';

describe('GithubProjectExistsDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...generateCfStoreModules(),
        GitSCMService,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const store = TestBed.inject(Store<CFAppState>);
    const scmService = TestBed.inject(GitSCMService);
    const directive = new GithubProjectExistsDirective(store, scmService);
    expect(directive).toBeTruthy();
  });
});
